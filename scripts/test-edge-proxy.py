#!/usr/bin/env python3
"""Exercise actual edge + frontend Nginx with an isolated echo backend.

Requires Docker, OpenSSL and Python 3. Uses only disposable local containers,
loopback-published ports, and a test certificate trusted explicitly by the test.
"""
import http.client
import json
import pathlib
import shutil
import ssl
import subprocess
import tempfile
import time
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]
IMAGE = "nginx:stable-alpine"
PREFIX = "rha-tls-test-" + uuid.uuid4().hex[:8]
containers = []


def run(*args, **kwargs):
    return subprocess.check_output(args, text=True, **kwargs).strip()


def request(port, path="/", *, tls=False, headers=None, context=None):
    cls = http.client.HTTPSConnection if tls else http.client.HTTPConnection
    options = {"timeout": 5}
    if tls:
        options["context"] = context
    conn = cls("127.0.0.1", port, **options)
    try:
        conn.request("GET", path, headers=headers or {})
        response = conn.getresponse()
        return response.status, dict(response.getheaders()), response.read()
    finally:
        conn.close()


def start(suffix, args):
    name = PREFIX + "-" + suffix
    containers.append(name)
    run("docker", "run", "-d", "--name", name, "--network", PREFIX,
        "--network-alias", suffix, *args, IMAGE)
    return name


def assert_rejected(fn, message):
    try:
        fn()
    except (ssl.SSLError, http.client.RemoteDisconnected, ConnectionResetError):
        print("PASS", message)
        return
    raise AssertionError(message)


with tempfile.TemporaryDirectory(prefix=PREFIX) as temp:
    base = pathlib.Path(temp)
    edge = base / "edge"
    edge.mkdir()
    certs = base / "certs" / "live" / "127.0.0.1"
    certs.mkdir(parents=True)
    webroot = base / "webroot"
    challenge = webroot / ".well-known" / "acme-challenge"
    challenge.mkdir(parents=True)
    (challenge / "known-token").write_text("verified-challenge")
    run("openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
        "-keyout", str(certs / "privkey.pem"), "-out", str(certs / "fullchain.pem"),
        "-subj", "/CN=127.0.0.1", "-addext", "subjectAltName=IP:127.0.0.1",
        stderr=subprocess.DEVNULL)
    context = ssl.create_default_context(cafile=str(certs / "fullchain.pem"))
    (edge / "default.conf").write_text(
        (ROOT / "deploy/edge/tls.conf.template").read_text().replace("__PUBLIC_IP__", "127.0.0.1"))
    # The production host connects to loopback:8080. In this isolated network,
    # connect to the same frontend HTTP listener by its test DNS alias.
    proxy = base / "proxy.conf"
    proxy.write_text((ROOT / "deploy/edge/proxy.conf").read_text().replace(
        "http://127.0.0.1:8080", "http://frontend:80"))
    mock = base / "backend.conf"
    mock.write_text('''server {
    listen 8080;
    location / {
        default_type application/json;
        return 200 '{"path":"$request_uri","proto":"$http_x_forwarded_proto","real":"$http_x_real_ip","chain":"$http_x_forwarded_for","forwarded":"$http_forwarded","host":"$http_host","forwarded_host":"$http_x_forwarded_host","forwarded_port":"$http_x_forwarded_port"}';
    }
}''')
    run("docker", "network", "create", PREFIX)
    try:
        start("backend", ["-v", f"{mock}:/etc/nginx/conf.d/default.conf:ro"])
        frontend = start("frontend", ["-v", f"{ROOT / 'frontend/nginx.conf'}:/etc/nginx/conf.d/default.conf:ro"])
        edge_name = start("edge", [
            "-p", "127.0.0.1::80", "-p", "127.0.0.1::443",
            "-v", f"{ROOT / 'deploy/edge/nginx.conf'}:/etc/nginx/nginx.conf:ro",
            "-v", f"{edge}:/etc/nginx/conf.d:ro",
            "-v", f"{proxy}:/etc/nginx/snippets/rha-proxy.conf:ro",
            "-v", f"{base / 'certs'}:/etc/letsencrypt:ro",
            "-v", f"{webroot}:/var/www/certbot:ro",
        ])
        http_port = int(run("docker", "port", edge_name, "80/tcp").rsplit(":", 1)[1])
        https_port = int(run("docker", "port", edge_name, "443/tcp").rsplit(":", 1)[1])
        for _ in range(30):
            try:
                if request(https_port, tls=True, context=context)[0] == 200:
                    break
            except (OSError, http.client.HTTPException):
                pass
            time.sleep(0.2)
        else:
            raise AssertionError("edge startup failed")
        for name in (frontend, edge_name):
            run("docker", "exec", name, "nginx", "-t", stderr=subprocess.STDOUT)
        print("PASS both Nginx configurations parse")
        status, headers, _ = request(http_port, "/login?next=%2Fdashboard")
        assert status == 308 and headers["Location"] == "https://127.0.0.1/login?next=%2Fdashboard"
        print("PASS HTTP redirects with path/query preserved")
        status, _, data = request(http_port, "/.well-known/acme-challenge/known-token")
        assert status == 200 and data == b"verified-challenge"
        assert request(http_port, "/.well-known/acme-challenge/missing")[0] == 404
        print("PASS ACME challenge bypasses redirect; unknown token is 404")
        status, _, data = request(https_port, "/v1/probe?x=1", tls=True, context=context, headers={
            "X-Forwarded-Proto": "http", "X-Real-IP": "198.51.100.66",
            "X-Forwarded-For": "198.51.100.66", "X-Forwarded-Host": "evil.invalid",
            "X-Forwarded-Port": "8080", "Forwarded": "for=198.51.100.66;proto=http",
        })
        body = json.loads(data)
        assert status == 200 and body["path"] == "/v1/probe?x=1", body
        assert body["proto"] == "https" and body["forwarded_port"] == "443", body
        assert body["host"] == body["forwarded_host"] == "127.0.0.1", body
        assert body["forwarded"] == "" and "198.51.100.66" not in body["chain"], body
        assert body["real"] and body["real"] != "198.51.100.66", body
        print("PASS /v1 reaches backend; HTTPS and client identity survive both proxies")
        print("PASS forged forwarding headers are overwritten at the public edge")
        assert_rejected(lambda: request(http_port, headers={"Host": "evil.invalid"}), "HTTP rejects unknown Host")
        assert_rejected(lambda: request(https_port, tls=True, context=context,
                                       headers={"Host": "evil.invalid"}), "HTTPS rejects unknown Host")
        assert_rejected(lambda: request(https_port, tls=True, context=ssl.create_default_context()),
                        "untrusted certificate is rejected (validation is not disabled)")
        wrong_ip = ssl.create_default_context(cafile=str(certs / "fullchain.pem"))
        import socket
        def mismatch():
            with socket.create_connection(("127.0.0.1", https_port), timeout=5) as sock:
                with wrong_ip.wrap_socket(sock, server_hostname="wrong.invalid"):
                    pass
        assert_rejected(mismatch, "certificate name mismatch is rejected")
        bootstrap = (ROOT / "deploy/edge/http.conf.template").read_text().replace("__PUBLIC_IP__", "127.0.0.1")
        (edge / "default.conf").write_text(bootstrap)
        run("docker", "exec", edge_name, "nginx", "-t", stderr=subprocess.STDOUT)
        print("PASS bootstrap HTTP configuration parses without requiring a certificate")
        print("ALL EDGE TESTS PASSED")
    finally:
        for name in reversed(containers):
            subprocess.run(["docker", "rm", "-f", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["docker", "network", "rm", PREFIX], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
