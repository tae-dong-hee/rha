#!/usr/bin/env bash
set -euo pipefail

MODE=${1:?Usage: setup-edge.sh http|tls PUBLIC_IP}
PUBLIC_IP=${2:?Public IPv4 address required}
[[ $EUID -eq 0 ]] || { echo 'Run as root' >&2; exit 1; }
[[ $MODE = http || $MODE = tls ]] || exit 2
python3 -c 'import ipaddress,sys; assert ipaddress.ip_address(sys.argv[1]).version == 4' "$PUBLIC_IP"
SOURCE_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../deploy/edge" && pwd)

if [[ $MODE = tls ]]; then
    CERT="/etc/letsencrypt/live/$PUBLIC_IP/fullchain.pem"
    test -s "$CERT"
    test -s "/etc/letsencrypt/live/$PUBLIC_IP/privkey.pem"
    openssl x509 -in "$CERT" -noout -checkend 86400
    openssl x509 -in "$CERT" -noout -checkip "$PUBLIC_IP"
fi

install -d -m 700 /opt/rha
BACKUP=$(mktemp -d /opt/rha/edge-backup.XXXXXX)
cp -a /etc/nginx/nginx.conf "$BACKUP/nginx.conf"
for name in conf.d/rha-edge.conf snippets/rha-proxy.conf; do
    if [[ -f /etc/nginx/$name ]]; then
        mkdir -p "$BACKUP/$(dirname "$name")"
        cp -a "/etc/nginx/$name" "$BACKUP/$name"
    fi
done

restore() {
    cp -a "$BACKUP/nginx.conf" /etc/nginx/nginx.conf
    for name in conf.d/rha-edge.conf snippets/rha-proxy.conf; do
        if [[ -f $BACKUP/$name ]]; then
            cp -a "$BACKUP/$name" "/etc/nginx/$name"
        else
            rm -f "/etc/nginx/$name"
        fi
    done
    echo "Configuration restored from $BACKUP" >&2
}
trap restore ERR

install -d -m 755 /etc/nginx/conf.d /etc/nginx/snippets /var/www/certbot/.well-known/acme-challenge
install -m 644 "$SOURCE_DIR/nginx.conf" /etc/nginx/nginx.conf
install -m 644 "$SOURCE_DIR/proxy.conf" /etc/nginx/snippets/rha-proxy.conf
sed "s/__PUBLIC_IP__/$PUBLIC_IP/g" "$SOURCE_DIR/$MODE.conf.template" > /etc/nginx/conf.d/rha-edge.conf
chmod 644 /etc/nginx/conf.d/rha-edge.conf
nginx -t
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
else
    systemctl start nginx
fi
systemctl enable nginx
trap - ERR
echo "Edge Nginx $MODE configured; backup=$BACKUP"
