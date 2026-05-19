---
title: "Windows penetration testing environment setup and information collection"
url: "en/windows-pentest-setup"
date: "2026-01-16"
draft: false
summary: "Windows penetration testing target environment construction, SMB/LDAP/RPC enumeration technology and Nmap NSE script practice"
authors: ["default"]
tags:
  - Windows
  - Information collection
  - SMB enumeration
images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"]
categories:
  - Penetration testing
---

# Windows penetration testing environment setup and information collection

Windows systems are one of the most common targets during penetration testing. Whether it is a workstation, file server, or domain controller in the corporate intranet, security assessment of the Windows environment is a core skill for penetration testers. This article will start with setting up an experimental environment and systematically explain the information collection methodology in the Windows environment, including port scanning, service identification, SMB/LDAP/RPC enumeration and vulnerability scanning, to help you establish a complete Windows penetration testing knowledge system.

## Penetration testing experimental environment setup

Before starting any penetration testing exercise, it is crucial to set up a safe and legal experimental environment. The following are recommended target drones and experimental platforms.

### Metasploitable3

Metasploitable3 is a Windows target machine officially maintained by Rapid7 and deliberately set up with a large number of vulnerabilities, which is very suitable for penetration testing exercises.

```bash
# 安装依赖
# 需要预先安装 Vagrant 和 VirtualBox/VMware

# 克隆 Metasploitable3 仓库
git clone https://github.com/rapid7/metasploitable3.git
cd metasploitable3

# 使用 Vagrant 构建 Windows 靶机
vagrant up win2k8
# 默认会下载并配置一个带有多种漏洞的 Windows Server 2008 R2 虚拟机
```

Metasploitable3 Windows 靶机默认包含以下易受攻击的服务：

- IIS Web 服务器（含 WebDAV）
- SMB 文件共享（含 MS17-010 漏洞）
- MSSQL 数据库（弱密码）
- WinRM 远程管理
- FTP 服务（匿名访问）

### 搭建 Active Directory 域实验环境

对于域渗透练习，建议自行搭建 AD 域环境：

```powershell
# 在 Windows Server 上安装 AD DS 角色
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools

# Promote to domain controller, create new forest

# Create test user

# Create a test group and add users

It is recommended to prepare at least the following virtual machines:

| Virtual Machine | Role | Operating System |
|--------|------|----------|
| DC01 | Domain Controller | Windows Server 2019 |
| SRV01 | File/Web Server | Windows Server 2016 |
| WS01 | Workstation | Windows 10 |
| Kali | Attack Machine | Kali Linux |

### Network configuration

```bash
# 建议使用 Host-Only 或 NAT 网络隔离实验环境
# VirtualBox 创建 Host-Only 网络
VBoxManage hostonlyif create
VBoxManage hostonlyif ipconfig vboxnet0 --ip 10.10.10.1 --netmask 255.255.255.0
```

## Windows 信息收集方法论

信息收集是渗透测试的第一步，也是最关键的一步。对于 Windows 目标，信息收集通常遵循以下流程：

1. **主机发现** — 确定目标网络中存活的 Windows 主机
2. **端口扫描** — 识别开放端口和运行的服务
3. **服务枚举** — 深入探测每个服务的详细信息
4. **漏洞识别** — 根据服务版本和配置发现潜在漏洞

## 外部信息收集：端口扫描与服务识别

### Nmap 针对 Windows 的扫描技巧

Nmap 是渗透测试中最常用的扫描工具，针对 Windows 目标有许多专用技巧。

```bash
# 基础全端口扫描 — 发现所有开放端口
nmap -sS -p- -T4 --min-rate 1000 -oN full_scan.txt 10.10.10.100

# Quick scan of common Windows ports

# Operating system and service version detection

# UDP port scan (discovers SNMP, DNS, TFTP, etc.)

Ports that need attention in Windows environment:

| Port | Service | Meaning of Penetration Testing |
|------|------|-------------|
| 88 | Kerberos | Domain environment flag, Kerberoasting possible |
| 135 | RPC | Remote procedure call, information leakage |
| 139/445 | SMB | File sharing, massive attack surface |
| 389/636 | LDAP | Directory Service Enumeration |
| 1433 | MSSQL | Database Attack |
| 3389 | RDP | Remote desktop, brute force cracking |
| 5985/5986 | WinRM | Remote Management |

### NSE script deep scan

```bash
# 使用默认脚本和版本检测进行综合扫描
nmap -sC -sV -O -p 445,135,139,389,88,3389 -oA windows_detail 10.10.10.100

# SMB 协议专用脚本
nmap --script smb-os-discovery,smb-protocols,smb-security-mode -p 445 10.10.10.100

# 枚举 SMB 共享
nmap --script smb-enum-shares,smb-enum-users -p 445 10.10.10.100

# LDAP 枚举
nmap --script ldap-rootdse,ldap-search -p 389 10.10.10.100

# RDP 信息收集
nmap --script rdp-enum-encryption,rdp-ntlm-info -p 3389 10.10.10.100
```

## SMB 枚举

SMB（Server Message Block）是 Windows 网络中最重要的协议之一，也是攻击面最广的服务。

### enum4linux

```bash
# 全面 SMB 枚举
enum4linux -a 10.10.10.100

# Enumerate user list

# enum shared

# Enumeration group information

# Use enum4linux-ng (updated version, more standardized output)

### smbclient

```bash
# 列出可用共享（匿名访问）
smbclient -L //10.10.10.100 -N

# 使用凭据列出共享
smbclient -L //10.10.10.100 -U 'testuser%Welcome1!'

# 连接到特定共享
smbclient //10.10.10.100/SharedDocs -U 'testuser%Welcome1!'

# 在 SMB shell 中操作
# smb: \> dir
# smb: \> get secret.txt
# smb: \> recurse ON
# smb: \> prompt OFF
# smb: \> mget *
```

### CrackMapExec（CME）

CrackMapExec 是 Windows/AD 环境渗透测试的瑞士军刀：

```bash
# SMB 主机信息收集
crackmapexec smb 10.10.10.0/24

# enum shared

# Enumerate users

# Enumerate logged in users

# password spraying

# Empty session enum

## LDAP enumeration

When the target is a domain environment, LDAP enumeration can obtain a wealth of valuable domain information.

```bash
# 查询域基本信息（匿名绑定）
ldapsearch -x -H ldap://10.10.10.100 -b "" -s base namingContexts

# 枚举域用户
ldapsearch -x -H ldap://10.10.10.100 -D "testuser@lab.local" -w 'Welcome1!' \
    -b "DC=lab,DC=local" "(objectClass=user)" sAMAccountName description memberOf

# 查找域管理员
ldapsearch -x -H ldap://10.10.10.100 -D "testuser@lab.local" -w 'Welcome1!' \
    -b "DC=lab,DC=local" "(memberOf=CN=Domain Admins,CN=Users,DC=lab,DC=local)" sAMAccountName

# 枚举计算机对象
ldapsearch -x -H ldap://10.10.10.100 -D "testuser@lab.local" -w 'Welcome1!' \
    -b "DC=lab,DC=local" "(objectClass=computer)" cn operatingSystem

# 查找 SPN（服务主体名称）— 用于 Kerberoasting
ldapsearch -x -H ldap://10.10.10.100 -D "testuser@lab.local" -w 'Welcome1!' \
    -b "DC=lab,DC=local" "(&(objectClass=user)(servicePrincipalName=*))" sAMAccountName servicePrincipalName

# 使用 windapsearch 工具（更便捷）
python3 windapsearch.py -d lab.local --dc-ip 10.10.10.100 -u testuser@lab.local -p 'Welcome1!' --users
python3 windapsearch.py -d lab.local --dc-ip 10.10.10.100 -u testuser@lab.local -p 'Welcome1!' --da
```

## RPC 枚举

Windows RPC 服务（端口 135/139/445）同样可以泄露大量系统信息。

```bash
# 空会话连接
rpcclient -U "" -N 10.10.10.100

# Execute enumeration commands in rpcclient shell

# RPC enumeration using impacket

# RID loops through users (bypassing user enumeration restrictions)

## Vulnerability Scan

After the service enumeration is completed, vulnerability scanning needs to be performed on the discovered services.

### Nmap NSE Vuln script

```bash
# 运行所有 vuln 类别的 NSE 脚本
nmap --script vuln -p 445,135,139,3389 10.10.10.100

# 专项漏洞检测
# 检测 MS17-010（永恒之蓝）
nmap --script smb-vuln-ms17-010 -p 445 10.10.10.100

# 检测 MS08-067
nmap --script smb-vuln-ms08-067 -p 445 10.10.10.100

# 检测 BlueKeep (CVE-2019-0708)
nmap --script rdp-vuln-ms12-020 -p 3389 10.10.10.100

# 检测 SMB 签名状态（中继攻击前提）
nmap --script smb2-security-mode -p 445 10.10.10.0/24
```

### 综合漏洞扫描命令集合

```bash
# 使用 Nikto 扫描 IIS Web 服务
nikto -h http://10.10.10.100

# Identify the web technology stack using whatweb

# MSSQL information collection

# Check for MSSQL empty/weak passwords

# SNMP enumeration (if 161/UDP is open)

## Security recommendations and defensive measures

As a defender, it is recommended to take the following measures in response to the above information collection methods:

1. **Minimize exposure** — close unnecessary ports and services, use firewalls to limit inbound connections

## Summarize

The information gathering phase of a Windows penetration test is the foundation of the entire attack chain. Through systematic port scanning, service identification, and protocol enumeration, we gain a complete understanding of the target environment's attack surface. The toolchain introduced in this article — Nmap, enum4linux, smbclient, CrackMapExec, ldapsearch, rpcclient — forms the core arsenal of Windows information collection.

Key takeaways to review:

- Building a safe and isolated experimental environment is a prerequisite for learning penetration testing

In the next article, we will use the data obtained during the information gathering phase to exploit the specific attack surface of Windows services.

