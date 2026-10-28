# EC2 한 대의 Nginx TLS 프록시

외부 요청은 호스트 Nginx의 80/443으로 받는다. 일반 HTTP 요청은 308로
HTTPS에 재접속시키고, HTTPS 요청은 TLS 처리 후 `127.0.0.1:8080`으로
프록시한다. Docker는 이를 프론트 컨테이너의 80으로 전달한다.
프론트는 정적 파일을 제공하며 `/v1/`은 기존 `backend:8080`으로 전달한다.

인증서는 호스트 `/etc/letsencrypt`에 보관한다. 프론트 이미지에는 인증서나
개인키를 포함하지 않는다. 앞단 Nginx와 인증서는 프론트 컨테이너 교체와
독립적으로 유지된다. 프론트 Nginx 설정은 `frontend/nginx.conf`를 이미지에
포함하므로 재배포 후에도 유지된다.

## 최초 설정 (Amazon Linux 2023, IPv4)

1. 고정 공인 IPv4를 연결하고 보안그룹에 TCP 80/443을 허용한다.
2. `sudo dnf install -y nginx`로 호스트 Nginx를 설치한다.
3. 이 저장소의 `deploy/edge`와 관련 `scripts`를 같은 상대 구조로 서버에 배치한다.
4. `sudo bash scripts/setup-edge.sh http 15.164.24.35`를 실행한다.
   기존 설정은 `/opt/rha/edge-backup.*`에 보관되며 문법 오류 시 되돌린다.
5. 인증서 디렉터리를 준비하고 검증한 Certbot 래퍼를 설치한다.

```bash
sudo install -d -m 700 /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt
sudo install -m 755 scripts/rha-certbot /usr/local/sbin/rha-certbot
sudo /usr/local/sbin/rha-certbot --version
```

6. `/var/www/certbot/.well-known/acme-challenge/`에 임시 검증 파일을 만들고,
   외부 HTTP 요청이 해당 내용을 받는지 확인한다. 없는 토큰은 404여야 한다.
7. Let's Encrypt 약관에 동의한 운영자가 인증서를 발급한다. 아래 예시는
   이메일을 등록하지 않으므로 갱신 실패와 만료는 운영자가 별도로 감시해야 한다.

```bash
sudo /usr/local/sbin/rha-certbot certonly --non-interactive \
  --agree-tos --register-unsafely-without-email \
  --webroot -w /var/www/certbot \
  --preferred-profile shortlived \
  --cert-name 15.164.24.35 --ip-address 15.164.24.35
sudo bash scripts/setup-edge.sh tls 15.164.24.35
sudo bash scripts/install-certificate-renewal.sh 15.164.24.35
```

IP 인증서는 약 6일(160시간) 유효하다. 타이머는 하루 두 번 갱신 필요 여부를
확인하고 성공 후 Nginx를 reload한다. Certbot은 Docker 소켓 없이 인증서,
작업/로그 및 webroot 디렉터리만 연결한다. 검증된 5.8.0 이미지 digest를
고정했으며, 버전을 바꿀 때 `--version` 및 갱신 모의 테스트를 다시 확인한다.

8. 변경된 프론트 이미지와 `deploy/compose.yaml`을 배포한다. 프론트 포트는
   `127.0.0.1:8080:80`이어야 한다. 원본 배포 스크립트는 같은 이미지여도
   Compose 변경을 반영하며 프론트 정상 확인 시 loopback 연결도 검사한다.
9. HTTPS 화면/API 정상 동작 후 보안그룹의 TCP 8080 공개 규칙을 제거한다.
   Docker loopback 바인딩과 보안그룹을 함께 적용한다. 백엔드/DB는 공개하지 않는다.

## 전달 헤더의 신뢰 경계

호스트 Nginx는 외부 요청의 `X-Real-IP`, `X-Forwarded-*`를 실제 접속값으로
덮어쓰고 `Forwarded`는 제거한다. 프론트는 그 HTTPS 정보와 클라이언트 IP를
백엔드로 전달한다. 프론트를 외부에 직접 공개하면 이 신뢰 경계가 깨진다.
리다이렉트는 고정 IP를 사용하며 다른 Host는 거부하므로 임의 도메인으로
리다이렉트하지 않는다. IP 접속은 SNI를 생략할 수 있어 443의 기본 서버에서
IP 인증서를 제공한다. TLS 1.2/1.3만 허용한다.

## 검증 및 역검증

`python3 scripts/test-edge-proxy.py`는 별도 Docker 네트워크에서 실제
앞단/프론트 Nginx와 응답 확인용 백엔드를 실행하고 종료 시 정리한다.
운영 프록시와 같은 설정을 사용하되 loopback 목적지만 테스트 컨테이너 DNS로
바꾼다. 테스트 인증서는 테스트 클라이언트에서만 명시적으로 신뢰한다.

- HTTP 리다이렉트의 경로/쿼리 보존, HTTP ACME 토큰 제공과 없는 토큰 404.
- 신뢰한 인증서로 HTTPS 200, `/v1/` 경로와 HTTPS/클라이언트 정보 전달.
- 위조 전달 헤더 덮어쓰기, 잘못된 Host 거부, 신뢰하지 않거나 주소가 다른 인증서 거부.
- 운영에서는 `curl`의 기본 인증서 검증을 유지한다 (`-k` 사용 금지).
- 외부 8080 실패, 내부 8080 성공, API의 비로그인 요청 거부 여부를 확인한다.
- 프론트 재생성 후 같은 검사와 인증서 fingerprint 유지 여부를 확인한다.
- `rha-certbot renew --dry-run --cert-name 15.164.24.35`로 갱신 절차를 검증한다.
- `systemctl status rha-certbot-renew.timer`와 `journalctl -u rha-certbot-renew.service`
  로 다음 실행과 실패를 확인한다. 타이머 설치 자체가 외부 알림을 만들지는 않는다.

HTTP에서 이미 전송한 비밀번호를 리다이렉트가 보호해 주지는 않으므로 앱/API
클라이언트의 기본 URL은 HTTPS로 사용한다. 도메인 구매 후에는 DNS 연결 및
도메인 인증서 발급을 하고 server_name, 인증서 경로, 고정 리다이렉트 주소를 변경한다.

공식 근거:
- https://letsencrypt.org/2026/03/11/shorter-certs-certbot
- https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header
- https://docs.docker.com/engine/network/port-publishing/
