---
title: "Information collection and target reconnaissance - Nmap, Recon-ng, OSINT technology"
url: "en/recon-techniques"
date: "2026-01-11"
draft: false
summary: "Penetration testing information collection methodology, Nmap scanning technology encyclopedia, passive reconnaissance tool chain and subdomain enumeration practice"
authors: ["default"]
tags:
  - Information collection
  - Nmap
  - OSINT
  - reconnaissance
images: ["https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=1200&q=80"]
categories:
  - Penetration testing
---

# Information collection and target reconnaissance - Nmap, Recon-ng, OSINT technology

Information gathering is the first and one of the most critical phases of penetration testing. Adequate information collection can help penetration testers fully understand the target's attack surface and discover potential weaknesses. Just like an old saying in the security circle: "Know yourself and the enemy, and you can fight a hundred battles without danger." This article will systematically introduce the methodology of passive information collection and active information collection, and explain in depth the advanced usage of core tools such as Nmap and Recon-ng to help you build a complete information reconnaissance capability.

## information collection methodology

Information collection can be divided into two categories from a broad perspective:

### Passive Reconnaissance

It does not interact directly with the target system and obtains intelligence through public channels. The target will not perceive the reconnaissance behavior, and the concealment is extremely high.

- WHOIS queries, DNS records

### Active information collection (Active Reconnaissance)

Interact directly with the target system, send probe packets, and obtain more detailed technical information. The target may log these actions.

- Port scanning (Nmap)

## Passive information collection in practice

### WHOIS query

WHOIS can obtain domain name registration information, including registrant, registrar, DNS server, registration date, etc.

```bash
# Linux 命令行查询
whois example.com

# 只关注关键字段
whois example.com | grep -E "(Registrant|Name Server|Creation|Expiration)"

# 查询 IP 地址归属
whois 93.184.216.34

# 在线查询工具
# https://who.is/
# https://whois.domaintools.com/
```

### DNS 信息收集

DNS 记录中隐藏着大量有价值的信息：A 记录指向服务器 IP、MX 记录揭示邮件服务器、TXT 记录可能包含 SPF 配置等。

```bash
# 使用 dig 查询各类记录
dig example.com A          # 查询 A 记录（IPv4地址）
dig example.com AAAA       # 查询 AAAA 记录（IPv6地址）
dig example.com MX         # 查询邮件服务器
dig example.com NS         # 查询 DNS 服务器
dig example.com TXT        # 查询 TXT 记录
dig example.com ANY        # 查询所有记录

# Specify DNS server query

# Query SOA records (domain name authoritative information)

# Try DNS zone transfers (a gold mine for information leaks)

# Use nslookup

# Use the host command

# Reverse DNS lookup

# DNS enumeration tool

### Google Hacking（Google Dorks）

Use advanced search engine syntax to discover sensitive information of the target:

```bash
# 常用 Google Dorks
site:example.com                        # 限定域名
site:example.com filetype:pdf           # 搜索PDF文件
site:example.com inurl:admin            # 搜索管理后台
site:example.com intitle:"index of"     # 目录浏览
site:example.com ext:sql | ext:bak      # 数据库备份文件
site:example.com intext:"password"      # 页面包含密码关键词
site:example.com ext:log                # 日志文件

# 搜索配置文件
site:example.com ext:conf | ext:cfg | ext:ini

# 搜索 Git 泄露
site:example.com inurl:".git"

# 搜索敏感目录
site:example.com inurl:wp-admin         # WordPress后台
site:example.com inurl:phpmyadmin       # phpMyAdmin

# Google Hacking Database (GHDB) 收录更多 Dorks
# https://www.exploit-db.com/google-hacking-database
```

### Shodan — 网络空间搜索引擎

Shodan 是物联网设备和网络服务的搜索引擎，可以发现暴露在互联网上的各种设备和服务。

```bash
# 安装 Shodan CLI
pip install shodan

# Initialize API Key

# Search target

# Search for a specific service

# Statistics search results

# Commonly used Shodan Dorks

### Certificate transparency and subdomain discovery

```bash
# 通过 Certificate Transparency 日志查询子域名
# https://crt.sh
curl -s "https://crt.sh/?q=%25.example.com&output=json" | jq '.[].name_value' | sort -u

# 使用 subfinder 进行子域名枚举
subfinder -d example.com -o subdomains.txt

# 使用 amass（功能更强大）
amass enum -d example.com -o amass_results.txt

# 使用 amass 的被动模式
amass enum -passive -d example.com

# 子域名暴力枚举
amass enum -brute -d example.com -w /usr/share/wordlists/amass/subdomains-top1mil-5000.txt
```

## Nmap 扫描技术大全

Nmap（Network Mapper）是最强大的网络扫描工具，掌握其各种扫描技术是渗透测试的基本功。

### 主机发现

```bash
# Ping 扫描（仅发现存活主机）
nmap -sn 192.168.1.0/24

# ARP scanning (most reliable for LAN)

# TCP SYN Ping (Bypass banned ping)

# ICMP scan

# Import target list from file

### Port scanning technology

```bash
# TCP SYN 扫描（半开扫描，默认，需要root）
sudo nmap -sS 192.168.1.100

# TCP Connect 扫描（完整三次握手）
nmap -sT 192.168.1.100

# UDP 扫描（较慢）
sudo nmap -sU 192.168.1.100

# TCP SYN + UDP 联合扫描
sudo nmap -sS -sU 192.168.1.100

# 指定端口范围
nmap -p 1-1000 192.168.1.100           # 扫描1-1000端口
nmap -p 80,443,8080 192.168.1.100      # 扫描指定端口
nmap -p- 192.168.1.100                  # 扫描全部65535端口
nmap --top-ports 100 192.168.1.100      # 扫描最常见的100个端口

# FIN 扫描（绕过部分防火墙）
sudo nmap -sF 192.168.1.100

# Xmas 扫描
sudo nmap -sX 192.168.1.100

# NULL 扫描
sudo nmap -sN 192.168.1.100

# ACK 扫描（检测防火墙规则）
sudo nmap -sA 192.168.1.100
```

### 版本探测与操作系统识别

```bash
# 服务版本探测
nmap -sV 192.168.1.100

# Set version detection strength (0-9, default 7)

# Operating system identification

# Comprehensive scan (version + script + OS + traceroute)

# Radical version detection

### NSE script engine

Nmap Scripting Engine (NSE) is the soul of Nmap and has hundreds of scripts.

```bash
# 使用默认脚本集
nmap -sC 192.168.1.100

# 等同于
nmap --script=default 192.168.1.100

# 运行特定脚本
nmap --script=http-title 192.168.1.100
nmap --script=ssh-brute 192.168.1.100
nmap --script=smb-vuln* 192.168.1.100

# 漏洞扫描脚本
nmap --script vuln 192.168.1.100

# 多个脚本组合
nmap --script "http-* and not http-brute" 192.168.1.100

# 查看脚本帮助
nmap --script-help=http-enum

# 列出所有可用脚本
ls /usr/share/nmap/scripts/
nmap --script-help all 2>&1 | grep "Categories"

# 按类别运行脚本
nmap --script auth 192.168.1.100        # 认证相关
nmap --script broadcast 192.168.1.0/24  # 广播发现
nmap --script discovery 192.168.1.100   # 服务发现
```

### 扫描速度与隐蔽性

```bash
# 时间模板（T0最慢最隐蔽，T5最快最暴力）
nmap -T0 192.168.1.100    # 偏执模式（极慢，IDS规避）
nmap -T1 192.168.1.100    # 鬼祟模式
nmap -T2 192.168.1.100    # 礼貌模式
nmap -T3 192.168.1.100    # 正常模式（默认）
nmap -T4 192.168.1.100    # 激进模式（推荐）
nmap -T5 192.168.1.100    # 疯狂模式

# Custom rate

# Sharding bypass (evading IDS)

# Decoy Scan (Obfuscate Source IP)

# Specify source port (bypass firewall rules)

### Output format

```bash
# 标准输出到文件
nmap -oN scan_result.txt 192.168.1.100

# XML 格式（便于后续处理）
nmap -oX scan_result.xml 192.168.1.100

# Grep 友好格式
nmap -oG scan_result.grep 192.168.1.100

# 同时输出所有格式
nmap -oA scan_result 192.168.1.100

# 综合实战命令
sudo nmap -sS -sV -sC -O -p- -T4 --min-rate 5000 -oA full_scan 192.168.1.100
```

## Recon-ng 框架使用

Recon-ng 是一个功能强大的 OSINT 侦察框架，采用模块化设计，类似 Metasploit 的操作风格。

```bash
# 启动 Recon-ng
recon-ng

# Create workspace

# Install module

# Add target domain name

# Load and run modules

# View collected data

# Set API Keys (required by some modules)

# Export report

## Web directory and path scanning

### dirsearch

```bash
# 基本目录扫描
dirsearch -u http://target.com

# 指定字典和扩展名
dirsearch -u http://target.com -w /usr/share/wordlists/dirb/common.txt -e php,asp,html

# 递归扫描
dirsearch -u http://target.com -r -R 3

# 自定义线程和延迟
dirsearch -u http://target.com -t 50 --delay 0.5

# 排除特定状态码
dirsearch -u http://target.com --exclude-status 403,404,500
```

### gobuster

```bash
# 目录扫描模式
gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt

# Specify extension

# Subdomain enumeration mode

# VHOST enumeration

# Custom thread and status code filtering

# Use cookie authentication

### ffuf — High-speed fuzz testing tool

```bash
# 目录模糊测试
ffuf -u http://target.com/FUZZ -w /usr/share/wordlists/dirb/common.txt

# 参数模糊测试
ffuf -u "http://target.com/page?FUZZ=test" -w /usr/share/wordlists/dirb/common.txt

# 过滤响应（按大小、状态码、字数）
ffuf -u http://target.com/FUZZ -w wordlist.txt -fc 404 -fs 4242

# POST 参数模糊测试
ffuf -u http://target.com/login -X POST -d "user=admin&pass=FUZZ" -w passwords.txt -fc 401

# 子域名模糊测试
ffuf -u http://FUZZ.target.com -w subdomains.txt -fc 404
```

## 安全建议与防御措施

作为防御方，了解攻击者的信息收集手段有助于更好地保护资产：

1. **最小信息暴露**：WHOIS 开启隐私保护，减少公开信息的泄露
2. **DNS 安全加固**：禁用区域传送，使用 DNSSEC 防止 DNS 欺骗
3. **搜索引擎管理**：合理使用 robots.txt，清理搜索引擎中的敏感缓存
4. **端口管理**：关闭不必要的端口和服务，使用防火墙规则限制访问
5. **IDS/IPS 部署**：检测和阻断端口扫描等侦察行为
6. **蜜罐部署**：使用蜜罐技术诱捕和识别攻击者
7. **代码仓库审查**：定期检查 GitHub 等平台是否有敏感信息泄露
8. **Rate Limiting**：对 Web 接口实施访问频率限制

## 总结

信息收集是渗透测试中投入时间最多、也最能体现功力的阶段。本文覆盖了从被动侦察（WHOIS、DNS、Google Hacking、Shodan）到主动扫描（Nmap 全系列扫描技术）的完整流程，以及 Recon-ng、subfinder、dirsearch、gobuster 等专业工具的使用方法。掌握这些技术后，你将能够系统地对目标进行全方位的信息侦察，发现潜在的攻击面。记住，信息收集的深度直接决定了后续渗透测试的成功率——"磨刀不误砍柴工"。在下一篇文章中，我们将基于收集到的信息，进入实际的服务漏洞利用阶段。

