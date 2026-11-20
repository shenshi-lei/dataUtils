/* =========================================================
 * 工具：Linux 命令速查
 * 可搜索的常用 Linux 命令参考，附中文说明、用法与示例。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  var CATS = ['全部', '文件', '目录', '查看', '搜索', '权限', '用户', '系统', '进程', '网络', '压缩', '磁盘'];

  var COMMANDS = [
    {
      cmd: 'ls',
      title: '列出目录内容',
      cat: '目录',
      desc: '显示指定目录下的文件和子目录。默认按名称排序，不加参数时列出当前目录。',
      usage: 'ls [选项] [路径...]',
      example: 'ls\n# 列出当前目录\n\nls -l\n# 长格式显示权限、所有者、大小、时间\n\nls -la /var/log\n# 显示所有文件（含隐藏文件），并用长格式\n\nls -lh\n# 以人类可读的单位显示文件大小（K/M/G）',
      tags: ['列表', '目录', '文件', '隐藏', 'list']
    },
    {
      cmd: 'cd',
      title: '切换当前目录',
      cat: '目录',
      desc: '更改当前工作目录。是 shell 内建命令，影响后续命令的相对路径基准。',
      usage: 'cd [目录]',
      example: 'cd /etc\n# 切换到 /etc\n\ncd ..\n# 返回上一级目录\n\ncd ~\n# 回到当前用户主目录\n\ncd -\n# 返回上一次所在目录',
      tags: ['切换', '目录', '路径', 'change directory']
    },
    {
      cmd: 'pwd',
      title: '显示当前目录路径',
      cat: '目录',
      desc: '输出当前工作目录的绝对路径，便于确认所处位置。',
      usage: 'pwd [-P]',
      example: 'pwd\n# 显示当前绝对路径\n\npwd -P\n# 显示物理路径（解析符号链接）',
      tags: ['路径', '当前目录', 'print working directory']
    },
    {
      cmd: 'mkdir',
      title: '创建目录',
      cat: '目录',
      desc: '创建一个或多个新目录。常用 -p 递归创建多级目录且目录已存在时不报错。',
      usage: 'mkdir [选项] 目录...',
      example: 'mkdir logs\n# 创建 logs 目录\n\nmkdir -p a/b/c\n# 递归创建多级目录\n\nmkdir -m 755 public\n# 创建目录并指定权限',
      tags: ['创建', '目录', '文件夹', 'make directory']
    },
    {
      cmd: 'rmdir',
      title: '删除空目录',
      cat: '目录',
      desc: '删除空目录。若目录非空会报错；删除非空目录通常使用 rm -r（需谨慎）。',
      usage: 'rmdir [选项] 目录...',
      example: 'rmdir emptydir\n# 删除空目录\n\nrmdir -p a/b/c\n# 递归删除空的父目录',
      tags: ['删除', '空目录', 'remove directory']
    },
    {
      cmd: 'cp',
      title: '复制文件或目录',
      cat: '文件',
      desc: '将文件或目录复制到指定位置。复制目录时需加 -r；覆盖前可用 -i 交互确认。',
      usage: 'cp [选项] 源 目标',
      example: 'cp a.txt b.txt\n# 复制文件\n\ncp -r src/ backup/\n# 递归复制目录\n\ncp -i a.txt /tmp/\n# 覆盖前提示确认\n\ncp -a src/ dst/\n# 保留权限、时间等属性归档复制',
      tags: ['复制', '拷贝', '文件', '目录', 'copy']
    },
    {
      cmd: 'mv',
      title: '移动或重命名',
      cat: '文件',
      desc: '移动文件/目录到新位置，或在同一目录下重命名。跨文件系统移动相当于复制后删除。',
      usage: 'mv [选项] 源 目标',
      example: 'mv old.txt new.txt\n# 重命名文件\n\nmv file.txt /tmp/\n# 移动文件到 /tmp\n\nmv -i a.txt b.txt\n# 覆盖前提示确认',
      tags: ['移动', '重命名', 'rename', 'move']
    },
    {
      cmd: 'rm',
      title: '删除文件或目录',
      cat: '文件',
      desc: '删除文件或目录。-r 递归删除目录，-f 强制不提示。该操作不可轻易恢复，使用前请确认路径（尤其避免误删 / 或重要数据）。',
      usage: 'rm [选项] 文件...',
      example: 'rm file.txt\n# 删除文件\n\nrm -i file.txt\n# 删除前确认\n\nrm -r build/\n# 递归删除目录及其内容（谨慎）\n\nrm -rf temp/\n# 强制递归删除且不提示（非常谨慎）',
      tags: ['删除', '移除', 'remove', '递归']
    },
    {
      cmd: 'touch',
      title: '创建空文件或更新时间戳',
      cat: '文件',
      desc: '若文件不存在则创建空文件；若已存在则更新其访问和修改时间。常用于快速创建占位文件。',
      usage: 'touch [选项] 文件...',
      example: 'touch notes.txt\n# 创建空文件或更新时间戳\n\ntouch a.txt b.txt c.txt\n# 同时处理多个文件',
      tags: ['创建', '文件', '时间戳', '新建']
    },
    {
      cmd: 'cat',
      title: '查看或连接文件内容',
      cat: '查看',
      desc: '将文件内容输出到标准输出，也可连接多个文件。查看大文件时更推荐 less 或 tail。',
      usage: 'cat [选项] [文件...]',
      example: 'cat file.txt\n# 显示文件内容\n\ncat -n file.txt\n# 显示行号\n\ncat a.txt b.txt > all.txt\n# 合并文件并写入新文件',
      tags: ['查看', '输出', '合并', '内容']
    },
    {
      cmd: 'less',
      title: '分页查看文件',
      cat: '查看',
      desc: '以分页方式浏览文件内容，支持上下滚动和搜索，适合查看大文件。按 q 退出，/ 搜索，n/N 跳转匹配。',
      usage: 'less [选项] 文件',
      example: 'less /var/log/syslog\n# 分页查看日志\n\nless -N file.txt\n# 显示行号\n\n# 常用键：空格翻页，b 上翻，/pattern 搜索，q 退出',
      tags: ['分页', '查看', '日志', '浏览']
    },
    {
      cmd: 'head',
      title: '查看文件开头',
      cat: '查看',
      desc: '输出文件的前若干行（默认 10 行），常用于快速预览文件格式或日志开头。',
      usage: 'head [选项] [文件...]',
      example: 'head file.txt\n# 显示前 10 行\n\nhead -n 20 file.txt\n# 显示前 20 行\n\nhead -c 100 file.txt\n# 显示前 100 个字节',
      tags: ['开头', '前几行', '预览']
    },
    {
      cmd: 'tail',
      title: '查看文件末尾',
      cat: '查看',
      desc: '输出文件的末尾若干行（默认 10 行）。-f 可持续跟踪文件新增内容，常用于看日志。',
      usage: 'tail [选项] [文件...]',
      example: 'tail file.txt\n# 显示最后 10 行\n\ntail -n 50 app.log\n# 显示最后 50 行\n\ntail -f /var/log/nginx/access.log\n# 实时跟踪日志新增内容',
      tags: ['末尾', '日志', '跟踪', '实时']
    },
    {
      cmd: 'grep',
      title: '文本搜索过滤',
      cat: '搜索',
      desc: '在文件或输入流中搜索匹配指定模式的行。支持正则表达式，是日志排查和文本过滤的常用工具。',
      usage: 'grep [选项] 模式 [文件...]',
      example: 'grep "error" app.log\n# 搜索包含 error 的行\n\ngrep -n "TODO" src/*.js\n# 显示匹配行号\n\ngrep -r "main" ./src\n# 递归搜索目录\n\ngrep -i "warn" app.log\n# 忽略大小写\n\ngrep -v "^#" config.conf\n# 反向匹配（排除注释行）',
      tags: ['搜索', '过滤', '正则', '文本', '查找']
    },
    {
      cmd: 'find',
      title: '按条件查找文件',
      cat: '搜索',
      desc: '在目录树中按名称、类型、大小、时间等条件查找文件和目录。功能强大，适合定位文件位置。',
      usage: 'find [路径...] [表达式]',
      example: 'find . -name "*.log"\n# 按名称查找 .log 文件\n\nfind /var -type f -size +100M\n# 查找大于 100MB 的普通文件\n\nfind . -mtime -1\n# 查找最近 1 天内修改过的文件\n\nfind . -name "*.tmp" -delete\n# 查找并删除匹配文件（谨慎）',
      tags: ['查找', '文件', '路径', '条件', '搜索']
    },
    {
      cmd: 'locate',
      title: '快速按名称查找文件',
      cat: '搜索',
      desc: '基于预建数据库快速查找文件路径，速度通常比 find 快，但结果可能不是实时的（需 updatedb 更新索引）。',
      usage: 'locate [选项] 模式',
      example: 'locate nginx.conf\n# 快速查找包含 nginx.conf 的路径\n\nlocate -i readme\n# 忽略大小写\n\nsudo updatedb\n# 更新文件名数据库',
      tags: ['查找', '索引', '快速', '文件名']
    },
    {
      cmd: 'which / whereis',
      title: '查找命令位置',
      cat: '搜索',
      desc: 'which 显示命令在 PATH 中的可执行文件路径；whereis 可同时查找二进制、源码和手册页位置。',
      usage: 'which 命令 | whereis 命令',
      example: 'which python3\n# 显示 python3 可执行文件路径\n\nwhereis bash\n# 显示 bash 的程序、源码、手册位置',
      tags: ['命令', '路径', '可执行文件', 'PATH']
    },
    {
      cmd: 'chmod',
      title: '修改文件权限',
      cat: '权限',
      desc: '修改文件或目录的读(r)、写(w)、执行(x)权限。可用符号模式（u/g/o/a +/- rwx）或数字模式（如 755）。',
      usage: 'chmod [选项] 模式 文件...',
      example: 'chmod 755 script.sh\n# 所有者 rwx，组和其他 rx\n\nchmod +x script.sh\n# 为所有用户增加执行权限\n\nchmod -R 644 docs/\n# 递归设置权限（对目录递归需谨慎）\n\nchmod u+w,g-w file.txt\n# 所有者加写，组去写',
      tags: ['权限', '可执行', '读写', 'mode']
    },
    {
      cmd: 'chown',
      title: '修改所有者和所属组',
      cat: '权限',
      desc: '更改文件或目录的所有者（user）和/或所属组（group）。通常需要管理员权限。',
      usage: 'chown [选项] 用户[:组] 文件...',
      example: 'sudo chown alice file.txt\n# 修改所有者\n\nsudo chown alice:developers file.txt\n# 同时修改所有者和组\n\nsudo chown -R www-data:www-data /var/www\n# 递归修改目录归属',
      tags: ['所有者', '用户', '组', '属主']
    },
    {
      cmd: 'chgrp',
      title: '修改所属组',
      cat: '权限',
      desc: '更改文件或目录的所属组。与 chown :group 类似，但只改组信息。',
      usage: 'chgrp [选项] 组 文件...',
      example: 'sudo chgrp developers project/\n# 修改所属组\n\nsudo chgrp -R developers project/\n# 递归修改',
      tags: ['组', '权限', '属组']
    },
    {
      cmd: 'umask',
      title: '查看或设置默认权限掩码',
      cat: '权限',
      desc: '控制新建文件和目录的默认权限。umask 值表示要从默认权限中“去掉”的权限位。',
      usage: 'umask [掩码]',
      example: 'umask\n# 查看当前掩码\n\numask 022\n# 常见设置：新目录默认 755，新文件默认 644（受实现影响）',
      tags: ['默认权限', '掩码', '新建文件']
    },
    {
      cmd: 'ln',
      title: '创建链接',
      cat: '文件',
      desc: '创建硬链接或符号链接（软链接）。符号链接类似快捷方式，可跨文件系统并可指向目录；硬链接与原文件共享 inode。',
      usage: 'ln [选项] 目标 链接名',
      example: 'ln -s /usr/bin/python3 /usr/local/bin/python\n# 创建符号链接\n\nln file.txt hardlink.txt\n# 创建硬链接',
      tags: ['链接', '软链接', '符号链接', '硬链接', 'symlink']
    },
    {
      cmd: 'df',
      title: '查看磁盘空间使用',
      cat: '磁盘',
      desc: '显示文件系统的磁盘空间使用情况，包括总量、已用、可用和挂载点。',
      usage: 'df [选项] [文件系统...]',
      example: 'df -h\n# 以人类可读单位显示各挂载点空间\n\ndf -hT\n# 同时显示文件系统类型\n\ndf -h /home\n# 查看指定路径所在分区',
      tags: ['磁盘', '空间', '容量', '挂载点']
    },
    {
      cmd: 'du',
      title: '查看目录或文件占用空间',
      cat: '磁盘',
      desc: '统计文件和目录的磁盘占用大小，常用于定位占空间的大目录。',
      usage: 'du [选项] [路径...]',
      example: 'du -sh .\n# 查看当前目录总大小\n\ndu -h --max-depth=1 /var\n# 查看 /var 下一级子目录大小\n\ndu -ah . | sort -hr | head\n# 按大小排序列出前几项（依赖 sort/head）',
      tags: ['大小', '占用', '目录', '空间']
    },
    {
      cmd: 'mount / umount',
      title: '挂载与卸载文件系统',
      cat: '磁盘',
      desc: 'mount 将设备或文件系统挂载到目录树；umount 卸载已挂载的文件系统。操作前需确认设备与挂载点。',
      usage: 'mount [设备] [挂载点] | umount [挂载点|设备]',
      example: 'mount\n# 查看已挂载的文件系统\n\nsudo mount /dev/sdb1 /mnt/usb\n# 挂载设备到目录\n\nsudo umount /mnt/usb\n# 卸载挂载点',
      tags: ['挂载', '卸载', '设备', '文件系统']
    },
    {
      cmd: 'free',
      title: '查看内存使用情况',
      cat: '系统',
      desc: '显示系统物理内存、交换分区（swap）的总量、已用和可用情况。',
      usage: 'free [选项]',
      example: 'free -h\n# 以易读单位显示内存信息\n\nfree -m\n# 以 MB 为单位显示',
      tags: ['内存', 'swap', 'RAM', '资源']
    },
    {
      cmd: 'top / htop',
      title: '实时查看系统与进程状态',
      cat: '进程',
      desc: '动态显示 CPU、内存和进程占用情况。top 为系统常见工具；htop 交互更友好但可能需额外安装。',
      usage: 'top | htop',
      example: 'top\n# 实时查看进程与资源占用（按 q 退出）\n\nhtop\n# 交互式进程查看器（若已安装）',
      tags: ['进程', 'CPU', '内存', '监控', '实时']
    },
    {
      cmd: 'ps',
      title: '查看进程快照',
      cat: '进程',
      desc: '显示当前时刻的进程信息，可按用户、终端、命令等筛选。常与 grep 配合查找特定进程。',
      usage: 'ps [选项]',
      example: 'ps aux\n# 查看系统所有进程（BSD 风格）\n\nps -ef\n# 查看所有进程（System V 风格）\n\nps aux | grep nginx\n# 查找 nginx 相关进程',
      tags: ['进程', '列表', 'PID', '状态']
    },
    {
      cmd: 'kill / killall',
      title: '向进程发送信号',
      cat: '进程',
      desc: '向指定 PID（kill）或按名称（killall）发送信号，常用于终止进程。默认 SIGTERM(15)，-9 为 SIGKILL 强制结束（谨慎）。',
      usage: 'kill [-信号] PID... | killall [选项] 名称',
      example: 'kill 1234\n# 请求进程 1234 正常退出\n\nkill -9 1234\n# 强制结束进程（可能丢失数据，谨慎）\n\nkillall nginx\n# 向名为 nginx 的进程发送信号',
      tags: ['终止', '进程', '信号', 'PID']
    },
    {
      cmd: 'nohup / &',
      title: '后台运行命令',
      cat: '进程',
      desc: '在命令末尾加 & 可放到后台运行；nohup 可让命令在终端退出后继续运行，并默认把输出写到 nohup.out。',
      usage: 'nohup 命令 [参数] &',
      example: 'python app.py &\n# 后台运行（终端关闭可能中断，视环境而定）\n\nnohup python app.py > app.log 2>&1 &\n# 后台运行并重定向输出，终端退出后仍继续',
      tags: ['后台', '守护', '运行', 'nohup']
    },
    {
      cmd: 'jobs / fg / bg',
      title: '管理当前 shell 作业',
      cat: '进程',
      desc: 'jobs 列出当前 shell 的后台/挂起作业；fg 将作业切到前台；bg 让挂起作业在后台继续运行。',
      usage: 'jobs | fg [%n] | bg [%n]',
      example: 'jobs\n# 查看作业列表\n\nCtrl+Z\n# 挂起当前前台任务\n\nbg %1\n# 让 1 号作业后台继续\n\nfg %1\n# 将 1 号作业切回前台',
      tags: ['作业', '前台', '后台', 'shell']
    },
    {
      cmd: 'systemctl',
      title: '管理 systemd 服务',
      cat: '系统',
      desc: '在使用 systemd 的发行版中管理系统服务（启动、停止、开机自启等）和查看状态。通常需要管理员权限。',
      usage: 'systemctl <命令> [服务名]',
      example: 'systemctl status nginx\n# 查看 nginx 服务状态\n\nsudo systemctl start nginx\n# 启动服务\n\nsudo systemctl enable nginx\n# 设置开机自启\n\nsudo systemctl restart nginx\n# 重启服务\n\nsudo systemctl stop nginx\n# 停止服务',
      tags: ['服务', '守护进程', '开机自启', 'systemd']
    },
    {
      cmd: 'journalctl',
      title: '查看 systemd 日志',
      cat: '系统',
      desc: '查询 systemd 日志（journald），可按服务、时间、优先级过滤，适合排查服务启动和运行问题。',
      usage: 'journalctl [选项]',
      example: 'journalctl -u nginx -e\n# 查看 nginx 单元日志并跳到末尾\n\njournalctl -u nginx -f\n# 实时跟踪 nginx 日志\n\njournalctl --since "1 hour ago"\n# 查看最近 1 小时日志',
      tags: ['日志', '服务', '排查', 'journal']
    },
    {
      cmd: 'uname',
      title: '显示系统内核信息',
      cat: '系统',
      desc: '输出内核名称、主机名、内核版本、架构等系统信息。',
      usage: 'uname [选项]',
      example: 'uname -a\n# 显示全部系统信息\n\nuname -r\n# 显示内核版本\n\nuname -m\n# 显示机器硬件架构',
      tags: ['内核', '系统', '架构', '版本']
    },
    {
      cmd: 'hostname / hostnamectl',
      title: '查看或设置主机名',
      cat: '系统',
      desc: 'hostname 显示或临时设置主机名；hostnamectl 在 systemd 系统中可持久化设置主机名并查看主机信息。',
      usage: 'hostname | hostnamectl [set-hostname 名称]',
      example: 'hostname\n# 显示主机名\n\nhostnamectl\n# 显示主机详细信息（systemd）\n\nsudo hostnamectl set-hostname my-server\n# 设置主机名',
      tags: ['主机名', '网络标识', '系统']
    },
    {
      cmd: 'date',
      title: '显示或设置系统时间',
      cat: '系统',
      desc: '显示当前日期时间，支持自定义输出格式；在有权限时也可用于设置系统时间。',
      usage: 'date [选项] [+格式]',
      example: 'date\n# 显示当前时间\n\ndate "+%Y-%m-%d %H:%M:%S"\n# 按指定格式输出\n\ndate -u\n# 显示 UTC 时间',
      tags: ['时间', '日期', '时区', '格式']
    },
    {
      cmd: 'uptime',
      title: '查看运行时间与负载',
      cat: '系统',
      desc: '显示系统当前时间、已运行时长、登录用户数以及 1/5/15 分钟平均负载。',
      usage: 'uptime [-p]',
      example: 'uptime\n# 显示运行时间和负载\n\nuptime -p\n# 以易读方式显示已运行时长',
      tags: ['运行时间', '负载', 'load average']
    },
    {
      cmd: 'whoami / id',
      title: '查看当前用户身份',
      cat: '用户',
      desc: 'whoami 显示当前有效用户名；id 显示用户 UID、GID 及所属组信息，便于排查权限问题。',
      usage: 'whoami | id [用户名]',
      example: 'whoami\n# 当前用户名\n\nid\n# 显示 uid/gid 和组信息\n\nid alice\n# 查看指定用户的信息',
      tags: ['用户', '身份', 'UID', 'GID', '组']
    },
    {
      cmd: 'sudo',
      title: '以管理员权限执行命令',
      cat: '用户',
      desc: '以超级用户（root）或其他用户身份执行命令。是否可用及权限范围取决于 /etc/sudoers 配置。',
      usage: 'sudo [选项] 命令',
      example: 'sudo apt update\n# 以管理员权限执行命令\n\nsudo -i\n# 切换到 root 交互式 shell（谨慎）\n\nsudo -u postgres psql\n# 以指定用户身份执行',
      tags: ['管理员', 'root', '权限', '提权']
    },
    {
      cmd: 'su',
      title: '切换用户',
      cat: '用户',
      desc: '切换到其他用户身份。su - 会同时加载目标用户的登录环境；需要目标用户密码（切到 root 时通常如此）。',
      usage: 'su [-] [用户名]',
      example: 'su -\n# 切换到 root 并加载其环境\n\nsu - alice\n# 切换到用户 alice',
      tags: ['切换用户', '登录', '身份']
    },
    {
      cmd: 'useradd / usermod / userdel',
      title: '管理用户账号',
      cat: '用户',
      desc: 'useradd 创建用户，usermod 修改用户属性，userdel 删除用户。通常需要管理员权限，具体选项因发行版略有差异。',
      usage: 'useradd/usermod/userdel [选项] 用户名',
      example: 'sudo useradd -m alice\n# 创建用户并生成主目录\n\nsudo usermod -aG sudo alice\n# 将用户加入 sudo 组\n\nsudo passwd alice\n# 设置或修改用户密码\n\nsudo userdel -r alice\n# 删除用户及其主目录（谨慎）',
      tags: ['用户', '创建', '修改', '删除', '账号']
    },
    {
      cmd: 'passwd',
      title: '修改用户密码',
      cat: '用户',
      desc: '修改当前用户或指定用户的登录密码。普通用户只能改自己的密码，管理员可改他人密码。',
      usage: 'passwd [用户名]',
      example: 'passwd\n# 修改当前用户密码\n\nsudo passwd alice\n# 管理员修改指定用户密码',
      tags: ['密码', '认证', '安全']
    },
    {
      cmd: 'ip',
      title: '查看与配置网络',
      cat: '网络',
      desc: 'iproute2 工具集的核心命令，用于查看和配置 IP 地址、路由、链路等。是 ifconfig/route 的现代替代。',
      usage: 'ip [对象] [命令]',
      example: 'ip addr\n# 查看网络接口和 IP 地址\n\nip -br addr\n# 简洁显示地址信息\n\nip route\n# 查看路由表\n\nip link show\n# 查看网卡链路状态',
      tags: ['IP', '网卡', '路由', '网络', '地址']
    },
    {
      cmd: 'ping',
      title: '测试网络连通性',
      cat: '网络',
      desc: '向目标主机发送 ICMP 回显请求，检测网络连通性和往返延迟。部分环境可能禁用 ICMP。',
      usage: 'ping [选项] 主机',
      example: 'ping -c 4 8.8.8.8\n# 发送 4 个探测包后停止\n\nping example.com\n# 持续探测（Ctrl+C 停止）',
      tags: ['连通性', '延迟', 'ICMP', '网络测试']
    },
    {
      cmd: 'ss / netstat',
      title: '查看网络连接与端口',
      cat: '网络',
      desc: '显示套接字、监听端口和网络连接。ss 是较新的工具，速度更快；netstat 在部分系统需额外安装。',
      usage: 'ss [选项] | netstat [选项]',
      example: 'ss -tuln\n# 查看 TCP/UDP 监听端口（数字显示）\n\nss -tunap\n# 显示连接及对应进程（需权限）\n\nnetstat -tulnp\n# netstat 等效查看（若可用）',
      tags: ['端口', '连接', '监听', 'socket', 'TCP', 'UDP']
    },
    {
      cmd: 'curl',
      title: '发送 HTTP/网络请求',
      cat: '网络',
      desc: '通过 URL 传输数据，支持 HTTP(S)、FTP 等多种协议。常用于接口调试、下载文件和脚本自动化。',
      usage: 'curl [选项] URL',
      example: 'curl https://example.com\n# 获取网页内容\n\ncurl -I https://example.com\n# 只获取响应头\n\ncurl -fsSL https://example.com/file -o file\n# 下载文件并失败时返回非零\n\ncurl -X POST -H "Content-Type: application/json" -d \'{"a":1}\' https://api.example.com\n# 发送 JSON POST 请求',
      tags: ['HTTP', '请求', '下载', 'API', '接口']
    },
    {
      cmd: 'wget',
      title: '下载文件',
      cat: '网络',
      desc: '从网络下载文件，支持 HTTP/HTTPS/FTP，适合脚本化下载和断点续传（依赖服务器支持）。',
      usage: 'wget [选项] URL',
      example: 'wget https://example.com/file.zip\n# 下载文件\n\nwget -O out.zip https://example.com/file.zip\n# 指定保存文件名\n\nwget -c https://example.com/big.iso\n# 断点续传',
      tags: ['下载', 'HTTP', '文件', '续传']
    },
    {
      cmd: 'ssh',
      title: '远程登录服务器',
      cat: '网络',
      desc: '通过加密连接登录远程主机或在远程执行命令。默认使用 22 端口，可用密钥认证提升安全性。',
      usage: 'ssh [选项] [用户@]主机 [命令]',
      example: 'ssh user@192.168.1.10\n# 登录远程主机\n\nssh -p 2222 user@host\n# 指定端口\n\nssh -i ~/.ssh/id_ed25519 user@host\n# 使用指定私钥\n\nssh user@host "uname -a"\n# 在远程执行单条命令',
      tags: ['远程', '登录', '加密', '终端']
    },
    {
      cmd: 'scp / rsync',
      title: '远程复制与同步文件',
      cat: '网络',
      desc: 'scp 基于 SSH 复制文件；rsync 支持增量同步、压缩和断点续传，更适合大批量或重复同步。',
      usage: 'scp [选项] 源 目标 | rsync [选项] 源 目标',
      example: 'scp file.txt user@host:/tmp/\n# 复制本地文件到远程\n\nscp -r dir/ user@host:/opt/\n# 递归复制目录\n\nrsync -avz ./src/ user@host:/app/src/\n# 增量同步目录（注意尾部斜杠含义）',
      tags: ['复制', '同步', '远程', '传输', '备份']
    },
    {
      cmd: 'tar',
      title: '打包与解包归档',
      cat: '压缩',
      desc: '将多个文件打包为 tar 归档，常与 gzip/bzip2/xz 结合压缩。是 Linux 下最常见的归档工具。',
      usage: 'tar [选项] [归档文件] [文件...]',
      example: 'tar -czvf archive.tar.gz dir/\n# 打包并 gzip 压缩\n\ntar -xzvf archive.tar.gz\n# 解压 .tar.gz\n\ntar -xvf archive.tar\n# 解包 .tar\n\ntar -tf archive.tar.gz\n# 查看归档内容（不解压）',
      tags: ['打包', '解压', '压缩', '归档', 'gzip']
    },
    {
      cmd: 'zip / unzip',
      title: 'zip 压缩与解压',
      cat: '压缩',
      desc: '创建或解压 zip 格式压缩包，跨平台兼容性好。解压到指定目录可用 -d。',
      usage: 'zip [选项] 压缩包 文件... | unzip [选项] 压缩包',
      example: 'zip -r archive.zip dir/\n# 递归压缩目录\n\nunzip archive.zip\n# 解压到当前目录\n\nunzip archive.zip -d /tmp/out\n# 解压到指定目录\n\nunzip -l archive.zip\n# 查看压缩包内容',
      tags: ['压缩', '解压', 'zip', '打包']
    },
    {
      cmd: 'gzip / gunzip',
      title: 'gzip 压缩与解压',
      cat: '压缩',
      desc: '对单个文件进行 gzip 压缩或解压，默认会替换原文件（可用 -k 保留）。常与 tar 配合使用。',
      usage: 'gzip [选项] 文件 | gunzip [选项] 文件.gz',
      example: 'gzip file.txt\n# 压缩为 file.txt.gz（默认删除原文件）\n\ngzip -k file.txt\n# 压缩并保留原文件\n\ngunzip file.txt.gz\n# 解压\n\ngzip -d file.txt.gz\n# 等价解压',
      tags: ['压缩', '解压', 'gz']
    },
    {
      cmd: 'echo',
      title: '输出文本或变量',
      cat: '查看',
      desc: '将字符串或变量值输出到标准输出，常用于脚本提示、写入文件和查看环境变量。',
      usage: 'echo [选项] [字符串...]',
      example: 'echo "Hello"\n# 输出文本\n\necho $HOME\n# 输出环境变量\n\necho -e "a\\nb"\n# 解释转义字符（如换行）',
      tags: ['输出', '打印', '变量', '文本']
    },
    {
      cmd: 'printf',
      title: '格式化输出',
      cat: '查看',
      desc: '按指定格式输出文本，比 echo 更可控，适合脚本中生成对齐或格式化内容。',
      usage: 'printf 格式 [参数...]',
      example: 'printf "%s\\n" "hello"\n# 输出字符串并换行\n\nprintf "%-10s %5d\\n" "apple" 3\n# 左对齐字符串和右对齐数字',
      tags: ['格式化', '输出', '脚本']
    },
    {
      cmd: 'wc',
      title: '统计行数、词数和字节数',
      cat: '查看',
      desc: '统计文件或输入的行数、单词数和字节/字符数，常用于快速了解文本规模。',
      usage: 'wc [选项] [文件...]',
      example: 'wc file.txt\n# 输出 行数 词数 字节数 文件名\n\nwc -l file.txt\n# 只统计行数\n\ncat file.txt | wc -c\n# 统计字节数',
      tags: ['统计', '行数', '字数', '计数']
    },
    {
      cmd: 'sort',
      title: '排序文本行',
      cat: '查看',
      desc: '对文本行进行排序。支持按字典序、数值、去重等方式处理，常与 uniq、cut 等配合。',
      usage: 'sort [选项] [文件...]',
      example: 'sort names.txt\n# 按字典序排序\n\nsort -n numbers.txt\n# 按数值排序\n\nsort -u list.txt\n# 排序并去重\n\nsort -t: -k3 -n /etc/passwd\n# 指定分隔符和字段排序',
      tags: ['排序', '文本', '去重']
    },
    {
      cmd: 'uniq',
      title: '去除相邻重复行',
      cat: '查看',
      desc: '过滤或统计相邻的重复行。通常需要先 sort 再 uniq 才能对全文件去重。',
      usage: 'uniq [选项] [输入 [输出]]',
      example: 'sort list.txt | uniq\n# 去除重复行\n\nsort list.txt | uniq -c\n# 统计每行出现次数\n\nsort list.txt | uniq -d\n# 只显示重复的行',
      tags: ['去重', '重复', '统计']
    },
    {
      cmd: 'cut',
      title: '按列提取文本',
      cat: '查看',
      desc: '从每行中按字节、字符或字段提取指定部分，适合处理结构化文本（如以分隔符分列的数据）。',
      usage: 'cut [选项] [文件...]',
      example: 'cut -d: -f1 /etc/passwd\n# 以冒号分隔，取第 1 列\n\ncut -c1-10 file.txt\n# 取每行第 1-10 个字符',
      tags: ['列', '字段', '提取', '分隔符']
    },
    {
      cmd: 'awk',
      title: '文本处理与按列分析',
      cat: '查看',
      desc: '强大的文本处理工具，适合按字段过滤、计算和格式化输出。常用于日志分析和报表生成。',
      usage: 'awk \'模式 {动作}\' [文件...]',
      example: "awk '{print $1}' file.txt\n# 输出每行第 1 列（默认空白分隔）\n\nawk -F: '{print $1, $3}' /etc/passwd\n# 指定冒号分隔并输出列\n\nawk '$3 > 100 {print $0}' data.txt\n# 输出第 3 列大于 100 的行",
      tags: ['文本处理', '列', '过滤', '脚本']
    },
    {
      cmd: 'sed',
      title: '流式文本编辑',
      cat: '查看',
      desc: '对输入流或文件内容按行进行替换、删除、插入等编辑操作。常用于批量文本替换。',
      usage: 'sed [选项] \'脚本\' [文件...]',
      example: "sed 's/foo/bar/g' file.txt\n# 将 foo 替换为 bar 并输出（不改原文件）\n\nsed -i 's/foo/bar/g' file.txt\n# 直接修改文件（谨慎，建议先备份）\n\nsed -n '10,20p' file.txt\n# 只输出第 10-20 行",
      tags: ['替换', '编辑', '文本', '流']
    },
    {
      cmd: 'xargs',
      title: '将输入转为命令参数',
      cat: '搜索',
      desc: '从标准输入读取数据并构造为命令行参数执行命令，常与 find、grep 等管道组合使用。',
      usage: 'xargs [选项] [命令]',
      example: 'find . -name "*.log" | xargs grep "error"\n# 在找到的日志文件中搜索 error\n\nprintf "%s\\n" a b c | xargs -n 1 echo\n# 每次传 1 个参数执行命令\n\nfind . -name "*.tmp" -print0 | xargs -0 rm -f\n# 安全处理包含空格的文件名',
      tags: ['参数', '管道', '批处理', '组合']
    },
    {
      cmd: 'tee',
      title: '同时输出到屏幕和文件',
      cat: '查看',
      desc: '从标准输入读取并同时写入标准输出和文件，适合在查看命令输出的同时保存日志。',
      usage: 'tee [选项] 文件...',
      example: 'ls -l | tee list.txt\n# 显示结果并保存到文件\n\nmake 2>&1 | tee build.log\n# 保存构建输出\n\ncommand | tee -a app.log\n# 追加写入文件',
      tags: ['输出', '保存', '日志', '管道']
    },
    {
      cmd: 'history',
      title: '查看命令历史',
      cat: '系统',
      desc: '显示当前 shell 记录的历史命令。可配合 ! 编号或 Ctrl+R 快速复用历史命令（具体行为依赖 shell）。',
      usage: 'history [n]',
      example: 'history\n# 显示命令历史\n\nhistory 20\n# 显示最近 20 条\n\n!42\n# 执行历史中第 42 条命令（bash 等支持）',
      tags: ['历史', '命令', 'shell']
    },
    {
      cmd: 'alias / unalias',
      title: '设置命令别名',
      cat: '系统',
      desc: '为命令创建简短别名，提高输入效率。alias 查看或设置别名，unalias 删除别名；持久化需写入 shell 配置文件。',
      usage: 'alias [名称=\'命令\'] | unalias 名称',
      example: "alias ll='ls -alF'\n# 定义别名\n\nalias\n# 查看当前别名\n\nunalias ll\n# 删除别名",
      tags: ['别名', '快捷', 'shell', '配置']
    },
    {
      cmd: 'export',
      title: '设置环境变量',
      cat: '系统',
      desc: '设置环境变量并导出给当前 shell 及其子进程。持久化需写入 ~/.bashrc、~/.profile 等配置文件。',
      usage: 'export 变量名=值',
      example: 'export PATH="$PATH:/opt/bin"\n# 追加 PATH\n\nexport JAVA_HOME=/usr/lib/jvm/java-17\n# 设置变量\n\nenv | grep JAVA_HOME\n# 查看环境变量',
      tags: ['环境变量', 'PATH', '配置', 'shell']
    },
    {
      cmd: 'env / printenv',
      title: '查看环境变量',
      cat: '系统',
      desc: '显示当前环境变量；env 也可在临时修改环境后运行命令。',
      usage: 'env | printenv [变量名]',
      example: 'env\n# 列出所有环境变量\n\nprintenv HOME\n# 查看指定变量\n\nenv LANG=C ls\n# 以指定环境变量运行命令',
      tags: ['环境变量', '查看', '运行环境']
    },
    {
      cmd: 'crontab',
      title: '管理定时任务',
      cat: '系统',
      desc: '为当前用户设置按时间周期执行的计划任务。编辑后由 cron 服务按计划运行。',
      usage: 'crontab [-e|-l|-r]',
      example: 'crontab -l\n# 查看当前用户定时任务\n\ncrontab -e\n# 编辑定时任务\n\n# 示例：每天 2:30 执行脚本\n# 30 2 * * * /home/user/backup.sh',
      tags: ['定时任务', '计划', 'cron', '调度']
    },
    {
      cmd: 'man / --help',
      title: '查看命令帮助文档',
      cat: '查看',
      desc: 'man 打开命令的手册页；多数命令支持 --help 或 -h 显示简要用法。遇到参数不确定时优先查帮助。',
      usage: 'man 命令 | 命令 --help',
      example: 'man ls\n# 查看 ls 手册（按 q 退出）\n\nls --help\n# 查看简要帮助\n\nman -k keyword\n# 按关键字搜索手册（等价 apropos）',
      tags: ['帮助', '文档', '手册', '用法']
    }
  ];

  function normalize(text) {
    return String(text || '').toLowerCase();
  }

  function matchItem(item, query, cat) {
    if (cat && cat !== '全部' && item.cat !== cat) return false;
    if (!query) return true;

    var q = normalize(query);
    var hay = normalize(
      item.cmd + ' ' + item.title + ' ' + item.cat + ' ' + item.desc + ' ' +
      (item.usage || '') + ' ' + (item.example || '') + ' ' + (item.tags || []).join(' ')
    );
    return hay.indexOf(q) >= 0;
  }

  function build() {
    var state = {
      query: '',
      cat: '全部',
      open: Object.create(null)
    };

    var root = ui.el('section', 't-page');
    root.appendChild(ui.head({
      icon: 'i-code',
      title: 'Linux 命令速查',
      desc: '常用 Linux Shell 命令参考：支持按关键词搜索，查看命令含义、用法与示例。',
      search: true
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var searchInput = ui.el('input', 't-input cmdref-search');
    searchInput.type = 'search';
    searchInput.placeholder = '搜索命令、用途或关键词，如 ls / 权限 / 端口…';
    searchInput.setAttribute('aria-label', '搜索 Linux 命令');
    searchInput.autocomplete = 'off';
    searchInput.spellcheck = false;

    options.appendChild(ui.field('搜索', searchInput));
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');
    var countBadge = ui.el('span', 'badge', COMMANDS.length + ' 条');
    var clearBtn = ui.miniButton('清空', {
      icon: 'i-trash',
      danger: true,
      title: '清空搜索与筛选',
      onClick: function () {
        state.query = '';
        state.cat = '全部';
        searchInput.value = '';
        syncCats();
        render();
        searchInput.focus();
      }
    });
    actions.appendChild(countBadge);
    actions.appendChild(clearBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    var catBar = ui.el('div', 'cmdref-cats');
    catBar.setAttribute('role', 'group');
    catBar.setAttribute('aria-label', '命令分类');
    var catButtons = [];

    CATS.forEach(function (cat) {
      var btn = ui.el('button', 'cmdref-cat' + (cat === '全部' ? ' is-active' : ''), cat);
      btn.type = 'button';
      btn.setAttribute('data-cat', cat);
      btn.setAttribute('aria-pressed', cat === '全部' ? 'true' : 'false');
      btn.addEventListener('click', function () {
        state.cat = cat;
        syncCats();
        render();
      });
      catButtons.push(btn);
      catBar.appendChild(btn);
    });
    root.appendChild(catBar);

    function syncCats() {
      catButtons.forEach(function (btn) {
        var on = btn.getAttribute('data-cat') === state.cat;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    var body = ui.el('div', 't-scroll cmdref-body');
    var list = ui.el('div', 'cmdref-list');
    body.appendChild(list);
    root.appendChild(body);

    function render() {
      var items = [];
      COMMANDS.forEach(function (item) {
        if (matchItem(item, state.query, state.cat)) items.push(item);
      });

      list.textContent = '';
      countBadge.textContent = items.length + ' / ' + COMMANDS.length + ' 条';

      if (!items.length) {
        var empty = ui.el('div', 't-empty cmdref-empty');
        empty.appendChild(ui.icon('i-search'));
        empty.appendChild(ui.el('span', '', '没有匹配的命令，试试其他关键词'));
        list.appendChild(empty);
        return;
      }

      items.forEach(function (item, index) {
        list.appendChild(buildCard(item, index));
      });
    }

    function buildCard(item, index) {
      var card = ui.el('article', 'cmdref-card');
      card.setAttribute('data-cmd', item.cmd);

      var isOpen = !!state.open[item.cmd];
      if (isOpen) card.classList.add('is-open');

      var headBtn = ui.el('button', 'cmdref-card-head');
      headBtn.type = 'button';
      headBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      var left = ui.el('div', 'cmdref-card-main');
      var cmd = ui.el('code', 'cmdref-cmd', item.cmd);
      var meta = ui.el('span', 'cmdref-meta');
      meta.appendChild(ui.el('span', 'cmdref-cat-tag', item.cat));
      meta.appendChild(ui.el('span', 'cmdref-title', item.title));
      left.appendChild(cmd);
      left.appendChild(meta);
      headBtn.appendChild(left);

      var toggle = ui.el('span', 'cmdref-toggle', isOpen ? '收起' : '详情');
      headBtn.appendChild(toggle);

      headBtn.addEventListener('click', function () {
        var open = !state.open[item.cmd];
        state.open[item.cmd] = open;
        card.classList.toggle('is-open', open);
        headBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? '收起' : '详情';
        detail.hidden = !open;
      });

      card.appendChild(headBtn);

      var detail = ui.el('div', 'cmdref-detail');
      detail.hidden = !isOpen;

      var desc = ui.el('p', 'cmdref-desc', item.desc);
      detail.appendChild(desc);

      if (item.usage) {
        detail.appendChild(sectionBlock('用法', item.usage));
      }
      if (item.example) {
        detail.appendChild(sectionBlock('示例', item.example));
      }

      card.appendChild(detail);
      return card;
    }

    function sectionBlock(label, text) {
      var wrap = ui.el('div', 'cmdref-block');
      var head = ui.el('div', 'cmdref-block-head');
      head.appendChild(ui.el('span', 'cmdref-block-label', label));
      head.appendChild(ui.miniButton('', {
        icon: 'i-copy',
        title: '复制' + label,
        onClick: function () {
          ui.copyText(text).then(function (ok) {
            ui.toast(ok ? '已复制' : '复制失败');
          });
        }
      }));
      wrap.appendChild(head);
      var pre = ui.el('pre', 'cmdref-pre');
      pre.textContent = text;
      wrap.appendChild(pre);
      return wrap;
    }

    var runSearch = ui.debounce(function () {
      state.query = searchInput.value.trim();
      render();
    }, 120);

    searchInput.addEventListener('input', runSearch);

    render();

    return {
      root: root,
      focus: function () { searchInput.focus(); },
      find: function () {
        searchInput.focus();
        searchInput.select();
        return true;
      }
    };
  }

  var instance = null;

  TB.register({
    id: 'linux',
    group: '命令参考',
    title: 'Linux 命令',
    desc: '常用 Linux Shell 命令速查：支持搜索并查看含义、用法与示例',
    icon: 'i-code',
    keywords: ['linux', 'shell', 'bash', '命令', '终端', 'ls', 'grep'],
    shortcuts: [
      { keys: ['Ctrl', 'F'], label: '聚焦搜索' }
    ],
    find: function () {
      if (instance && instance.find) return instance.find();
      return false;
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();