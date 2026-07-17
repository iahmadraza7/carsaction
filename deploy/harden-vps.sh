#!/usr/bin/env bash
# Host-level hardening for the CARSaction VPS. Run once as root.
# Does NOT disable password SSH until you confirm key login works.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ufw fail2ban unattended-upgrades curl git ca-certificates

# Firewall: SSH + HTTP/HTTPS only
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Fail2ban: SSH brute-force protection
cat >/etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
findtime = 10m
bantime = 1h
EOF

systemctl enable --now fail2ban
systemctl restart fail2ban

# Automatic security updates
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "Host hardening applied: UFW + fail2ban (SSH) + unattended-upgrades."
echo "Confirm SSH key login works before disabling PasswordAuthentication."
