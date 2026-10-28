#!/usr/bin/env bash
set -euo pipefail
PUBLIC_IP=${1:?Usage: install-certificate-renewal.sh PUBLIC_IP}
[[ $EUID -eq 0 ]] || { echo 'Run as root' >&2; exit 1; }
python3 -c 'import ipaddress,sys; assert ipaddress.ip_address(sys.argv[1]).version == 4' "$PUBLIC_IP"
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
openssl x509 -in "/etc/letsencrypt/live/$PUBLIC_IP/fullchain.pem" -noout -checkip "$PUBLIC_IP"
openssl x509 -in "/etc/letsencrypt/live/$PUBLIC_IP/fullchain.pem" -noout -checkend 86400
install -d -m 700 /etc/rha
printf 'RHA_PUBLIC_IP=%s\n' "$PUBLIC_IP" > /etc/rha/tls.env
chmod 600 /etc/rha/tls.env
install -m 755 "$ROOT/scripts/rha-certbot" /usr/local/sbin/rha-certbot
install -m 755 "$ROOT/scripts/rha-renew-certificate" /usr/local/sbin/rha-renew-certificate
install -m 644 "$ROOT/deploy/edge/rha-certbot-renew.service" /etc/systemd/system/
install -m 644 "$ROOT/deploy/edge/rha-certbot-renew.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now rha-certbot-renew.timer
systemctl start rha-certbot-renew.service
systemctl list-timers rha-certbot-renew.timer --no-pager
