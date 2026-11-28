/* =========================================================
 * 工具：Linux 命令速查
 * 可搜索的常用 Linux 命令参考，附中文说明、用法与示例。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  var CATS = ['全部', '文件', '目录', '查看', '搜索', '文本', '权限', '用户', '系统', '进程', '网络', '压缩', '磁盘'];

  var COMMANDS = [
    {
      cmd: 'ls',
      title: '列出目录内容',
      cat: '目录',
      desc: '列出目录下的条目（默认当前目录）。常用组合：-l 长格式、-a 显示以 . 开头的隐藏文件（含 . 和 .. 取决于实现）、-h 与 -l 配合人类可读大小、-t 按修改时间排序、-S 按大小排序、-R 递归。注意：在某些系统中别名可能加了 --color；通配符展开由 shell 完成。',
      usage: 'ls [选项] [路径...]',
      example: 'ls\n# 列出当前目录（多数实现不含隐藏文件）\n\nls -l\n# 长格式：权限、链接数、属主/组、大小、时间、名称\n\nls -la /var/log\n# 含隐藏文件的长格式\n\nls -lh\n# 长格式并用 K/M/G 显示大小\n\nls -lt\n# 按修改时间倒序（常用查看最新文件）\n\nls -1\n# 每行一个，便于脚本处理',
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
      desc: '将文件或目录复制到目标位置。复制目录必须使用 -r/-R（或 -a）。覆盖已有文件时，某些系统会因别名或选项而提示（可用 -i），也可用 -f 尝试强制覆盖；跨文件系统复制会产生新 inode。复制目录时注意目标路径：cp -r src dst 若 dst 已存在，结果是 dst/src；若想把 src 内容并入 dst，通常写成 cp -r src/. dst/（视需求调整）。',
      usage: 'cp [选项] 源... 目标',
      example: 'cp a.txt b.txt\n# 复制文件并改名\n\ncp a.txt /tmp/\n# 复制到目录\n\ncp -r src/ backup/\n# 递归复制目录（backup/src 或 backup 取决于是否已存在）\n\ncp -ai src/ dst/\n# 归档复制并在覆盖前询问（-a 含 -r、保属性等，依实现而定）\n\ncp -a src/. dst/\n# 尽量把 src 内容复制进 dst（注意尾部 /. 的语义）',
      tags: ['复制', '拷贝', '文件', '目录', 'copy']
    },
    {
      cmd: 'mv',
      title: '移动或重命名',
      cat: '文件',
      desc: '在同一文件系统内通常只是改名/移动目录项（快）；跨文件系统会先复制再删除原文件，耗时与空间取决于数据。若目标已存在且是目录，会把源移入该目录；若目标已存在且是文件，默认可能被覆盖（行为依实现/选项），建议用 -i 交互确认，或用 -n 尽量不覆盖。',
      usage: 'mv [选项] 源... 目标',
      example: 'mv old.txt new.txt\n# 同目录下重命名\n\nmv file.txt /tmp/\n# 移动到目录 /tmp/file.txt\n\nmv -i a.txt b.txt\n# 覆盖 b.txt 前提示\n\nmv -n a.txt b.txt\n# 若 b.txt 已存在则不覆盖（视实现支持）\n\nmv dir1 dir2/\n# 若 dir2 存在则移入 dir2/dir1，否则尝试改名为 dir2',
      tags: ['移动', '重命名', 'rename', 'move']
    },
    {
      cmd: 'rm',
      title: '删除文件或目录',
      cat: '文件',
      desc: '删除文件或目录（默认不删目录）。-r/-R 递归删除目录树；-f 忽略不存在的文件且不提示（部分场景仍受权限影响）。删除通常不可恢复；切勿在不确定路径时使用 rm -rf（尤其是以 /、*、变量未展开等开头的危险组合）。对重要数据优先用 -i 交互确认，或先用 ls/echo 打印将删除的内容再执行。',
      usage: 'rm [选项] 文件...',
      example: 'rm file.txt\n# 删除文件\n\nrm -i file.txt\n# 每次删除前确认\n\nrm -r build/\n# 递归删除目录 build 及内容（谨慎）\n\nrm -ri build/\n# 递归删除但每步/按实现提示确认\n\n# 危险示例勿随意执行：rm -rf / 或 rm -rf "$DIR"/\nrm -rf temp/\n# 强制递归删除且不提示（仅在你100%确认 temp/ 路径正确时使用）',
      tags: ['删除', '移除', 'remove', '递归', '危险']
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
      desc: '将文件（或标准输入）连接后输出到标准输出。适合小文件快速查看、拼接文件；大文件会刷屏且无翻页，建议用 less。cat -n 会给所有行编号，-b 仅对非空行编号（行为依实现）。重定向 > 会覆盖目标文件，>> 追加；合并时注意编码与二进制文件。',
      usage: 'cat [选项] [文件...]',
      example: 'cat file.txt\n# 输出文件内容\n\ncat -n file.txt\n# 显示行号（含空行）\n\ncat a.txt b.txt > all.txt\n# 合并到 all.txt（会覆盖 all.txt）\n\ncat >> notes.txt\n# 从标准输入追加写入，Ctrl+D 结束',
      tags: ['查看', '输出', '合并', '内容']
    },
    {
      cmd: 'more',
      title: '分页查看文件（逐屏）',
      cat: '查看',
      desc: '从标准输入或文件逐屏显示内容，适合在管道或简单场景下分页浏览。交互能力通常弱于 less（按空格翻页，回车下一行，q 退出，取决于实现）。',
      usage: 'more [选项] [文件]',
      example: 'more long.txt\n# 逐屏查看文件\n\nls -lR /etc | more\n# 分页查看命令输出\n\nmore -n 20 file.txt\n# 设置每屏行数（不同实现参数略有差异）',
      tags: ['分页', '查看', '逐屏', 'more']
    },
    {
      cmd: 'vi / vim',
      title: '终端文本编辑器（vi/vim）',
      cat: '查看',
      desc: 'vi 是经典终端编辑器，vim 为其增强版（多数系统上 vi 可能是 vim 的别名）。核心是多模式：正常模式（默认，移动/删除/命令）、插入模式（输入文本）、可视模式（选择文本）、命令行模式（: 开头执行命令）。首次使用建议先记“如何进入插入、如何保存退出、如何不保存退出”，避免卡住。',
      usage: 'vi [文件] | vim [文件]',
      example: '# 启动\nvim file.txt\n\n# 进入后常用（正常模式下按键；: 开头为命令行模式回车执行）\n# i        在光标前进入插入模式\n# a        在光标后进入插入模式\n# o        在下方新建一行并进入插入模式\n# Esc      从插入/可视等模式回到正常模式\n# :w       保存\n# :q       退出（未改动）\n# :wq 或 :x  保存并退出\n# ZZ       正常模式下保存并退出（快捷）\n# :q!      强制退出不保存\n# :set nu  显示行号（临时）\n# /pattern 搜索，n/N 下/上一个匹配\n# dd       删除当前行（正常模式）\n# yy       复制当前行，p 粘贴\n# u        撤销，Ctrl+r 重做（vim 常用）',
      tags: ['编辑器', 'vim', 'vi', '文本编辑', '终端']
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
      desc: '输出文件末尾内容（默认 10 行）。-n N 指定行数；也可用 -n +N 从第 N 行开始到末尾（GNU 常见写法）。-f 跟踪追加内容（日志常用）；在某些系统中 -F 更适合文件被轮转/重建的场景。大量二进制文件不适合直接查看。',
      usage: 'tail [选项] [文件...]',
      example: 'tail file.txt\n# 最后 10 行\n\ntail -n 50 app.log\n# 最后 50 行\n\ntail -n +20 file.txt\n# 从第 20 行开始输出到末尾\n\ntail -f /var/log/nginx/access.log\n# 实时跟踪（Ctrl+C 退出）\n\ntail -F app.log\n# 更适合日志轮转后的继续跟踪（取决于实现）',
      tags: ['末尾', '日志', '跟踪', '实时']
    },
    {
      cmd: 'grep',
      title: '文本搜索过滤',
      cat: '搜索',
      desc: '在文件或标准输入中匹配行。默认使用 BRE（基础正则）；-E 扩展正则，-P Perl 正则（若支持）。常用：-n 行号、-i 忽略大小写、-r/-R 递归、-l 只列文件名、-v 反选、-F 固定字符串（不当正则）、-w 单词边界、-C/-A/-B 显示上下文。注意二进制文件可能被当作二进制处理（视实现，可用 -a 强制按文本或 -I 忽略二进制）。正则与 shell 通配符不同，模式中含特殊字符时建议用单引号。',
      usage: 'grep [选项] 模式 [文件...]',
      example: 'grep "error" app.log\n# 输出含 error 的行\n\ngrep -n "TODO" src/*.js\n# 显示行号\n\ngrep -rn "main" ./src\n# 递归搜索（部分实现对符号链接等有 -R 差异）\n\ngrep -i "warn" app.log\n# 忽略大小写\n\ngrep -v "^#" config.conf\n# 排除以 # 开头的行\n\ngrep -E "err(or|no)" app.log\n# 扩展正则\n\ngrep -F "a.b[c]" file.txt\n# 固定字符串，不按正则解析',
      tags: ['搜索', '过滤', '正则', '文本', '查找']
    },
    {
      cmd: 'find',
      title: '按条件查找文件',
      cat: '搜索',
      desc: '在目录树中按表达式筛选文件/目录。常用：-name（支持通配符，注意被 shell 展开时要加引号）、-type f/d、-size、-mtime/-mmin、-path/-iname（部分实现）、-maxdepth 限制深度。-delete 会直接删除匹配项且不可逆；-exec 在匹配上执行命令，处理带空格路径时更安全用法是 -print0 配合 xargs -0。路径放在表达式前，多个路径表示从多处开始查找。',
      usage: 'find [路径...] [表达式]',
      example: 'find . -name "*.log"\n# 当前目录树下按名称匹配（shell 不展开则由 find 处理）\n\nfind /var -type f -size +100M\n# 普通文件且大于 100MiB（单位视实现，常见 +100M）\n\nfind . -type f -mtime -1\n# 最近 1 天内内容修改过的文件\n\nfind . -name "*.tmp" -print\n# 明确打印（默认行为类似）\n\nfind . -name "*.tmp" -delete\n# 直接删除匹配文件（极谨慎，建议先不加 -delete 预览）\n\nfind . -type f -name "*.sh" -exec chmod +x {} \\;\n# 对每个匹配执行命令',
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
      desc: '修改权限位（rwx）。数字模式常用三位或四位：三位为 ugo（如 755、644）；四位时首位为特殊位（setuid/setgid/sticky，较少在日常脚本中手写时省略理解）。符号模式如 u+x、go-w、a=r 可叠加。对目录递归 chmod -R 时要注意：文件和目录常需要不同权限（例如目录常需 x 才能进入），盲目对整棵树用 644 会导致目录不可访问；更稳妥的做法是分别处理目录与文件（如 find 搭配 -type d/-type f）。',
      usage: 'chmod [选项] 模式 文件...',
      example: 'chmod 755 script.sh\n# rwxr-xr-x：所有者可读写执行，组/其他可读执行\n\nchmod 644 file.txt\n# rw-r--r--：常见文件权限\n\nchmod +x script.sh\n# 为所有身份增加执行位\n\nchmod u=rw,go=r file.txt\n# 精确设置权限\n\n# 谨慎：递归改为 644 会让目录失去 x，可能无法进入\nchmod -R 644 docs/\n\n# 更常见：目录 755、文件 644（示意，需在 shell 中分开执行）\n# find docs -type d -exec chmod 755 {} \\;\n# find docs -type f -exec chmod 644 {} \\;',
      tags: ['权限', '可执行', '读写', 'mode']
    },
    {
      cmd: 'chown',
      title: '修改所有者和所属组',
      cat: '权限',
      desc: '修改文件/目录的属主和属组。格式常见为 user、user:group 或 :group（部分实现支持仅改组但写法随版本略有差异，更通用的是 chgrp 或 chown :group）。通常需要 root 或相应权限；递归 -R 会作用于整棵树，务必确认路径。符号链接的归属处理取决于选项（如 -h 作用于链接本身，行为因系统而异）。',
      usage: 'chown [选项] [用户][:[组]] 文件...',
      example: 'sudo chown alice file.txt\n# 仅修改所有者\n\nsudo chown alice:developers file.txt\n# 同时修改所有者和组\n\nsudo chown :developers file.txt\n# 仅修改组（是否可用取决于实现；也可用 chgrp）\n\nsudo chown -R www-data:www-data /var/www\n# 递归修改（谨慎确认路径）',
      tags: ['所有者', '用户', '组', '属主']
    },
    {
      cmd: 'chgrp',
      title: '修改所属组',
      cat: '权限',
      desc: '仅修改文件/目录的所属组。执行者通常需要对文件有足够权限，且目标组需为其所属组或具备管理员权限（具体由系统策略决定）。递归 -R 影响范围大，操作前请确认路径。',
      usage: 'chgrp [选项] 组 文件...',
      example: 'sudo chgrp developers project/\n# 修改单个路径的所属组\n\nsudo chgrp -R developers project/\n# 递归修改（谨慎）\n\n# 查看当前组信息可用 ls -l 或 stat',
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
      desc: 'iproute2 核心命令，用于查看/配置地址(addr)、链路(link)、路由(route)等。常用只读查看；修改操作（如 ip addr add、ip link set）通常需要 root 且会立即影响网络，务必在可控环境操作。-br 可简洁输出，-4/-6 过滤协议族。',
      usage: 'ip [选项] 对象 {命令}',
      example: 'ip addr\n# 查看所有接口地址（详细）\n\nip -br addr\n# 简洁列出接口、状态、IP\n\nip -4 addr show dev eth0\n# 仅查看 IPv4\n\nip route\n# 查看路由表\n\nip route get 8.8.8.8\n# 查看到目标会走哪条路由/出口\n\nip link show\n# 查看链路层状态',
      tags: ['IP', '网卡', '路由', '网络', '地址']
    },
    {
      cmd: 'dig',
      title: 'DNS 查询工具',
      cat: '网络',
      desc: '向 DNS 服务器查询记录（A/AAAA/MX/TXT 等），输出详细，适合脚本与排障。nslookup 也常见但交互/输出风格不同；在很多发行版中 dig 属于 bind-utils/dnsutils 包。',
      usage: 'dig [@服务器] 域名 [类型] [选项]',
      example: 'dig example.com\n# 查询 A 记录（默认）\n\ndig example.com AAAA\n# 查询 IPv6 记录\n\ndig @8.8.8.8 example.com MX\n# 指定 DNS 服务器查询 MX 记录\n\ndig +short example.com\n# 只输出精简结果',
      tags: ['DNS', '解析', '查询', 'dig', '网络排障']
    },
    {
      cmd: 'nslookup',
      title: '交互式/简单 DNS 查询',
      cat: '网络',
      desc: '查询 DNS 记录的常用工具，常见于多系统。可直接查域名或进入交互模式；输出与 dig 不同，排障时两者可互补。部分最小系统可能未预装。',
      usage: 'nslookup [域名] [DNS服务器]',
      example: 'nslookup example.com\n# 使用系统配置的 DNS 查询\n\nnslookup example.com 8.8.8.8\n# 指定 DNS 服务器\n\nnslookup -type=mx example.com\n# 查询 MX 记录（语法因实现略有差异）',
      tags: ['DNS', '解析', '查询', 'nslookup']
    },
    {
      cmd: 'mtr',
      title: '结合 ping 与 traceroute 的网络诊断',
      cat: '网络',
      desc: 'mtr 实时统计到目标路径上各跳的丢包率与延迟，比单次 traceroute 更适合观察间歇性问题。可能需要安装（如 mtr 或 mtr-tiny），部分功能需要 root。',
      usage: 'mtr [选项] 主机',
      example: 'mtr example.com\n# 交互式动态显示（按 q 退出）\n\nmtr -rw example.com\n# 报告模式，输出后结束（适合粘贴到工单）\n\nmtr -n example.com\n# 不解析主机名',
      tags: ['路由', '丢包', '延迟', '网络诊断', 'mtr']
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
      desc: '查看套接字/连接/监听端口。ss 来自 iproute2，查询内核更直接、通常更快；netstat 来自 net-tools，部分精简系统可能未预装。常用组合：-t TCP、-u UDP、-l 监听、-n 数字不解析、-p 显示进程（常需 root）。排查“端口被谁占用”时，ss -tulnp 或 netstat -tulnp 最常用。',
      usage: 'ss [选项] | netstat [选项]',
      example: 'ss -tuln\n# 列出 TCP/UDP 监听端口（数字形式）\n\nss -tunap\n# 含已建立连接及进程信息（需权限才能看到部分进程）\n\nss -tn state established\n# 仅已建立的 TCP 连接\n\nnetstat -tulnp\n# net-tools 等效写法（若已安装）',
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
      desc: '通过 SSH 登录远程主机或执行远程命令。默认端口 22；可用 -p 指定端口，-i 指定私钥，-L/-R/-D 做端口转发与代理（较进阶）。首次连接会提示主机指纹并写入 ~/.ssh/known_hosts，确认主机身份很重要。密钥认证推荐 ed25519/RSA（按策略），私钥权限应严格（如 chmod 600）。',
      usage: 'ssh [选项] [用户@]主机 [命令]',
      example: 'ssh user@192.168.1.10\n# 交互式登录\n\nssh -p 2222 user@host\n# 指定端口\n\nssh -i ~/.ssh/id_ed25519 user@host\n# 指定私钥文件\n\nssh user@host "uname -a"\n# 在远程执行单条命令并返回\n\nssh -o StrictHostKeyChecking=accept-new user@host\n# 首次连接自动接受新主机键（脚本场景谨慎使用）',
      tags: ['远程', '登录', '加密', '终端']
    },
    {
      cmd: 'scp / rsync',
      title: '远程复制与同步文件',
      cat: '网络',
      desc: 'scp 通过 SSH 进行简单文件复制，递归用 -r。rsync 更适合重复同步：可增量传输、保留属性、断点续传（配合合适选项）、压缩等。rsync 路径尾部斜杠含义很关键：src/ 表示“复制目录内内容”到目标；src 表示“复制整个目录”到目标下（结果常为 target/src）。跨机器用 user@host:/path。首次大同步后再跑 rsync 可显著减少传输量。',
      usage: 'scp [选项] 源 目标 | rsync [选项] 源 目标',
      example: 'scp file.txt user@host:/tmp/\n# 本地 -> 远程\n\nscp -r dir/ user@host:/opt/\n# 递归复制目录\n\nscp -P 2222 user@host:/var/log/app.log .\n# 指定端口（注意 scp 用大写 -P）\n\nrsync -avz ./src/ user@host:/app/src/\n# 同步 src/ 内内容到远端 /app/src/\n\nrsync -avz ./src user@host:/app/\n# 同步得到 /app/src（多一层目录）\n\nrsync -avzn --delete ./src/ user@host:/app/src/\n# 先 dry-run(-n) 查看将删除/变更的内容，再去掉 -n 执行（--delete 谨慎）',
      tags: ['复制', '同步', '远程', '传输', '备份', 'rsync']
    },
    {
      cmd: 'tar',
      title: '打包与解包归档',
      cat: '压缩',
      desc: '创建或解开 tar 归档；是否压缩取决于选项：-z gzip(.tar.gz/.tgz)、-j bzip2(.tar.bz2)、-J xz(.tar.xz)。常用模式：-c 创建、-x 解开、-t 列表。-v 详细输出，-f 必须指定归档文件名且通常放在选项组末尾（习惯写法）。解压到指定目录用 -C 目录。注意：解压时路径遍历等风险来自不可信归档，尽量在空目录解压并核对列表（-t）。打包时源路径前的 ./ 与绝对路径会影响解压后的布局。',
      usage: 'tar -c|-x|-t [zjJvpfC...] 归档 [文件或目录...]',
      example: 'tar -czvf archive.tar.gz dir/\n# 打包并 gzip 压缩（dir/ 会保留该目录名）\n\ntar -czvf archive.tar.gz -C /path/to dir\n# 在 /path/to 下打包 dir，归档内路径更整洁\n\ntar -xzvf archive.tar.gz\n# 解压到当前目录\n\ntar -xJf archive.tar.xz\n# 解压 xz 归档（顺序可灵活，但 -f 后通常跟文件名）\n\ntar -tf archive.tar.gz\n# 仅查看内容，不解压\n\ntar -xvf archive.tar.gz -C /tmp/out\n# 解压到指定目录（目录需存在）',
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
      cmd: 'bzip2 / bunzip2',
      title: 'bzip2 压缩与解压',
      cat: '压缩',
      desc: '对单个文件进行 bzip2 压缩或解压（.bz2），压缩率通常高于 gzip 但较慢。也可用 bunzip2 或 bzip2 -d 解压。',
      usage: 'bzip2 [选项] 文件 | bunzip2 [选项] 文件.bz2',
      example: 'bzip2 file.txt\n# 压缩为 file.txt.bz2\n\nbzip2 -k file.txt\n# 压缩并保留原文件\n\nbunzip2 file.txt.bz2\n# 解压\n\nbzip2 -d file.txt.bz2\n# 等价解压',
      tags: ['压缩', '解压', 'bz2']
    },
    {
      cmd: 'xz / unxz',
      title: 'xz 压缩与解压',
      cat: '压缩',
      desc: '对单个文件进行 xz 压缩或解压（.xz），压缩率高、速度较慢。常见于源码包；tar 可用 -J 处理 .tar.xz。',
      usage: 'xz [选项] 文件 | unxz [选项] 文件.xz',
      example: 'xz file.txt\n# 压缩为 file.txt.xz\n\nxz -k file.txt\n# 压缩并保留原文件\n\nunxz file.txt.xz\n# 解压\n\nxz -d file.txt.xz\n# 等价解压',
      tags: ['压缩', '解压', 'xz']
    },
    {
      cmd: 'clear',
      title: '清屏',
      cat: '查看',
      desc: '清除当前终端屏幕显示（依赖终端/termcap）。不会清除终端滚动缓冲区的历史内容取决于终端实现；在某些环境下可用 reset 恢复终端状态。',
      usage: 'clear',
      example: 'clear\n# 清空当前终端可见区域',
      tags: ['清屏', '终端']
    },
    {
      cmd: 'echo',
      title: '输出文本或变量',
      cat: '查看',
      desc: '将字符串或变量值输出到标准输出，常用于脚本提示、写入文件和查看环境变量。注意：不同 shell 对反斜杠转义处理不同（bash 中 echo -e 可解释转义，部分实现默认不解释）；在脚本中需要可移植时常用 printf。',
      usage: 'echo [选项] [字符串...]',
      example: 'echo "Hello"\n# 输出文本\n\necho $HOME\n# 输出环境变量\n\necho -e "a\\nb"\n# 解释转义（bash 等，视实现）\n\necho -n "no newline"\n# 不自动换行（常见选项）',
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
      cmd: 'nl',
      title: '给文件内容加行号',
      cat: '查看',
      desc: '把文件或标准输入按行输出并标注行号，适合在不等同于 cat -n 行为细节时进行更细粒度的编号（与实现参数有关）。',
      usage: 'nl [选项] [文件]',
      example: 'nl file.txt\n# 显示带行号的内容\n\nnl -ba file.txt\n# 尽量为所有行编号（取决于实现）',
      tags: ['行号', '查看', '文本']
    },
    {
      cmd: 'file',
      title: '识别文件类型',
      cat: '查看',
      desc: '根据文件内容特征判断文件类型（文本、可执行、图片、压缩包等），比仅靠扩展名更可靠。',
      usage: 'file [选项] 文件...',
      example: 'file /bin/ls\n# 查看可执行文件类型\n\nfile image.png\n# 查看文件类型\n\nfile -i notes.txt\n# 显示 MIME 类型（若支持）',
      tags: ['文件类型', 'MIME', '识别']
    },
    {
      cmd: 'stat',
      title: '显示文件或文件系统详细状态',
      cat: '查看',
      desc: '显示文件的 inode、大小、权限、时间戳等详细信息，也可查看文件系统信息（取决于选项）。',
      usage: 'stat [选项] 文件...',
      example: 'stat file.txt\n# 查看文件详细状态\n\nstat -f /\n# 查看文件系统信息（若支持 -f）',
      tags: ['元数据', 'inode', '时间戳', '权限']
    },
    {
      cmd: 'diff',
      title: '比较文件差异',
      cat: '文本',
      desc: '逐行比较两个文件或目录的差异。常用 -u 生成统一格式补丁，便于阅读与传递给 patch。',
      usage: 'diff [选项] 文件1 文件2',
      example: 'diff a.txt b.txt\n# 显示差异\n\ndiff -u a.txt b.txt\n# 统一格式输出（常用于补丁）\n\ndiff -r dir1 dir2\n# 递归比较目录',
      tags: ['比较', '差异', '补丁', '文本']
    },
    {
      cmd: 'tac',
      title: '反向输出文件内容',
      cat: '文本',
      desc: '从最后一行开始向前输出文件内容，与 cat 相反。可用于快速查看倒序日志片段。',
      usage: 'tac [选项] [文件...]',
      example: 'tac file.txt\n# 反向输出整文件\n\ntac a.log | less\n# 从末尾方向浏览',
      tags: ['反向', '文本', '查看']
    },
    {
      cmd: 'tr',
      title: '字符转换或删除',
      cat: '文本',
      desc: '对标准输入进行字符替换、删除或压缩重复字符。常用于大小写转换、清洗分隔符等简单文本处理。',
      usage: 'tr [选项] 集合1 [集合2]',
      example: "tr 'a-z' 'A-Z' < file.txt\n# 转为大写\n\necho \"a  b\" | tr -s ' '\n# 压缩连续空格\n\ntr -d '\\r' < win.txt > unix.txt\n# 删除回车符",
      tags: ['字符', '替换', '删除', '文本']
    },
    {
      cmd: 'column',
      title: '对齐文本为多列',
      cat: '文本',
      desc: '将输入按列对齐显示，常用于把分隔文本整理成表格状输出（依赖实现支持）。',
      usage: 'column [选项] [文件]',
      example: "mount | column -t\n# 按表格对齐显示\n\necho -e \"a:1\\nb:22\" | column -t -s ':'\n# 指定分隔符对齐",
      tags: ['列', '对齐', '表格', '文本']
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
      cmd: 'realpath',
      title: '解析为绝对规范路径',
      cat: '文件',
      desc: '将路径解析为绝对路径，并可解析符号链接（行为依赖选项）。适合脚本里需要稳定路径时使用。',
      usage: 'realpath [选项] 文件...',
      example: 'realpath ././a/../b\n# 输出规范化后的绝对路径\n\nrealpath -m ./maybe/missing\n# 不要求路径存在时也尝试规范化（视实现）',
      tags: ['路径', '绝对路径', '规范化']
    },
    {
      cmd: 'basename / dirname',
      title: '提取路径的文件名或目录部分',
      cat: '文件',
      desc: 'basename 取路径最后一段（可去掉后缀）；dirname 取目录部分。常用于 shell 脚本路径处理。',
      usage: 'basename 路径 [后缀] | dirname 路径',
      example: 'basename /etc/passwd\n# 输出 passwd\n\nbasename /etc/passwd .conf\n# 可按需去掉后缀\n\ndirname /etc/passwd\n# 输出 /etc',
      tags: ['路径', '文件名', '目录', '脚本']
    },
    {
      cmd: 'readlink',
      title: '读取符号链接指向',
      cat: '文件',
      desc: '读取符号链接的目标或解析路径（GNU 常用 -f 解析到最终路径）。用于排查链接指向或脚本中获取真实路径。',
      usage: 'readlink [选项] 链接',
      example: 'readlink /usr/bin/python3\n# 显示链接目标\n\nreadlink -f /usr/bin/python3\n# 递归解析到最终路径',
      tags: ['符号链接', '路径', '解析']
    },
    {
      cmd: 'pgrep / pkill',
      title: '按名称查找或发送信号给进程',
      cat: '进程',
      desc: 'pgrep 按进程名或条件查找 PID；pkill 按名称向匹配进程发送信号。使用 pkill 时要注意匹配范围，避免误杀。',
      usage: 'pgrep [选项] 模式 | pkill [选项] 模式',
      example: 'pgrep -fl nginx\n# 列出匹配进程的 PID 与命令行\n\npgrep -u alice sshd\n# 查找某用户下匹配进程\n\npkill -TERM nginx\n# 向匹配名称的进程发送 TERM（谨慎）',
      tags: ['进程', 'PID', '查找', '信号']
    },
    {
      cmd: 'lsof',
      title: '列出被进程打开的文件',
      cat: '进程',
      desc: '查看哪些进程打开了某文件、目录或网络套接字。排查“文件被占用”“端口被谁监听”等问题常用（通常需权限）。',
      usage: 'lsof [选项]',
      example: 'lsof -i :80\n# 查看占用 80 端口的进程\n\nlsof /var/log/syslog\n# 查看谁打开了该文件\n\nlsof -u alice\n# 查看某用户打开的文件（视权限）',
      tags: ['打开文件', '端口', '占用', '排查']
    },
    {
      cmd: 'dmesg',
      title: '查看内核环形缓冲区消息',
      cat: '系统',
      desc: '显示内核启动信息与硬件/驱动相关日志。排查硬件识别、驱动错误、OOM 等问题常用；可配合 tail、grep 或 --follow。',
      usage: 'dmesg [选项]',
      example: 'dmesg | tail -n 80\n# 查看最近内核消息\n\ndmesg -T\n# 尽量显示可读时间（若支持）\n\nsudo dmesg --follow\n# 实时跟踪内核消息',
      tags: ['内核', '日志', '硬件', '排查']
    },
    {
      cmd: 'timedatectl',
      title: '查看与设置系统时间（systemd）',
      cat: '系统',
      desc: 'systemd 环境下查看和设置时间、时区、NTP 同步状态。是 date 的补充，便于统一管理时间服务。',
      usage: 'timedatectl [命令]',
      example: 'timedatectl\n# 查看时间、时区与 NTP 状态\n\nsudo timedatectl set-timezone Asia/Shanghai\n# 设置时区\n\nsudo timedatectl set-ntp true\n# 启用网络时间同步',
      tags: ['时间', '时区', 'NTP', 'systemd']
    },
    {
      cmd: 'lsblk',
      title: '列出块设备信息',
      cat: '磁盘',
      desc: '以树形方式列出块设备（磁盘、分区、LVM 等）的名称、大小、挂载点等信息，便于快速了解存储布局。',
      usage: 'lsblk [选项]',
      example: 'lsblk\n# 查看块设备树\n\nlsblk -f\n# 显示文件系统与 UUID\n\nlsblk -o NAME,SIZE,TYPE,MOUNTPOINT',
      tags: ['磁盘', '分区', '块设备', '挂载']
    },
    {
      cmd: 'lscpu',
      title: '显示 CPU 架构信息',
      cat: '系统',
      desc: '显示 CPU 型号、核心数、线程、架构等信息（来自 /proc/cpuinfo 等），用于确认硬件能力。',
      usage: 'lscpu',
      example: 'lscpu\n# 查看 CPU 详细信息\n\nlscpu | grep -E "Model name|Socket|CPU\\(s\\)"',
      tags: ['CPU', '硬件', '架构', '系统信息']
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
      desc: '显示当前 shell 记录的历史命令（bash 常用）。可用 history n 查看最近 n 条；!n 执行第 n 条（谨慎），!! 执行上一条，!string 执行最近以 string 开头的命令。Ctrl+R 反向搜索历史（交互）。历史写入文件（如 ~/.bash_history）时机依赖 shell 设置（HISTFILE、HISTSIZE 等）。',
      usage: 'history [n]',
      example: 'history\n# 列出历史\n\nhistory 20\n# 最近 20 条\n\n!42\n# 执行历史编号 42（bash）\n\n!!\n# 执行上一条命令\n\n# 搜索：按 Ctrl+R 后输入关键字',
      tags: ['历史', '命令', 'shell']
    },
    {
      cmd: 'time',
      title: '测量命令执行时间',
      cat: '系统',
      desc: '统计命令的运行时间（real/user/sys）。shell 可能有内建 time，行为与 /usr/bin/time 略有差异；需要详细资源统计时可用 /usr/bin/time -v（GNU）。',
      usage: 'time 命令 [参数...]',
      example: 'time ls -R /usr\n# 显示耗时统计\n\n{ time sleep 1; } 2>&1\n# 在某些 shell 中需这样捕获输出\n\n/usr/bin/time -v your_cmd\n# 更详细的资源统计（GNU time）',
      tags: ['性能', '耗时', 'time']
    },
    {
      cmd: 'timeout',
      title: '限制命令运行时长',
      cat: '系统',
      desc: '在指定时间后向命令发送信号（默认 SIGTERM），超时则终止，常用于防止命令卡死。可用 -s 指定信号，--foreground 等选项视实现而定。',
      usage: 'timeout [选项] 持续时间 命令 [参数...]',
      example: 'timeout 5s sleep 10\n# 5 秒后终止 sleep，返回非零（视实现）\n\ntimeout 30 ping -c 100 example.com\n# 最多运行约 30 秒\n\ntimeout --signal=KILL 10s slow_cmd\n# 超时后发送 SIGKILL',
      tags: ['超时', '限制', 'timeout']
    },
    {
      cmd: 'nice / renice',
      title: '调整进程优先级',
      cat: '进程',
      desc: 'nice 启动时设置优先级（niceness，数值越大越“友好”、优先级越低，范围通常 -20 到 19，普通用户只能调高不能调低）。renice 调整已运行进程的优先级，需相应权限。',
      usage: 'nice [-n 值] 命令 | renice 优先级 [-p PID] [-u 用户]',
      example: 'nice -n 10 long_job\n# 以较低优先级运行\n\nrenice 5 -p 1234\n# 调整 PID 1234 的优先级\n\nrenice 10 -u alice\n# 调整用户 alice 的部分进程优先级（需权限）',
      tags: ['优先级', 'nice', 'renice', '进程']
    },
    {
      cmd: 'shutdown / reboot / poweroff',
      title: '关机与重启（systemd 常用）',
      cat: '系统',
      desc: 'shutdown 可安排定时关机/重启并通知用户（如 shutdown -h now、shutdown -r now）。reboot、poweroff 常为快捷命令（可能是 systemctl 的封装）。操作会影响所有用户，通常需要 root；在生产环境务必确认。',
      usage: 'shutdown [选项] 时间 [消息] | reboot | poweroff',
      example: 'sudo shutdown -h now\n# 立即关机\n\nsudo shutdown -r +5 "系统将在5分钟后重启"\n# 5 分钟后重启并广播消息\n\nsudo reboot\n# 立即重启\n\nsudo poweroff\n# 立即关机',
      tags: ['关机', '重启', 'shutdown', 'reboot', 'systemd']
    },
    {
      cmd: 'traceroute / tracepath',
      title: '追踪到目标的网络路径',
      cat: '网络',
      desc: 'traceroute 显示数据包到达目标经过的路由节点（TTL 递增探测），常用 UDP/ICMP（取决于实现与权限）。tracepath 类似且通常不需要特权，输出信息略有不同。结果受防火墙与 ICMP 策略影响，可能出现 *。',
      usage: 'traceroute [选项] 主机 | tracepath 主机',
      example: 'traceroute example.com\n# 跟踪路由（可能需 root 才能用某些模式）\n\ntraceroute -n 8.8.8.8\n# 不解析主机名，加快显示\n\ntracepath example.com\n# 无需 root 的路径探测（能力视系统而定）',
      tags: ['路由', '路径', '网络诊断', 'traceroute']
    },
    {
      cmd: 'md5sum / sha256sum',
      title: '计算文件校验和',
      cat: '文件',
      desc: 'md5sum、sha256sum（以及 sha1sum 等）计算文件的哈希值，用于完整性校验。校验时可用 -c 读取校验文件。注意 md5/sha1 抗碰撞性较弱，不应用于安全签名场景；sha256 更常用于完整性校验。',
      usage: 'md5sum 文件... | sha256sum 文件... | sha256sum -c 校验文件',
      example: 'sha256sum file.iso\n# 输出 SHA256 校验和\n\nmd5sum file.iso\n# 输出 MD5（仅用于完整性/兼容场景）\n\nsha256sum file1 file2 > SHA256SUMS\n# 生成校验文件\n\nsha256sum -c SHA256SUMS\n# 校验文件是否匹配',
      tags: ['校验', '哈希', 'sha256', 'md5', '完整性']
    },
    {
      cmd: 'tree',
      title: '以树形显示目录结构',
      cat: '目录',
      desc: 'tree 递归以树状图列出目录内容，便于直观查看层级。部分精简系统可能未预装（需单独安装包）。也可用 ls -R，但可读性不如 tree。',
      usage: 'tree [选项] [目录]',
      example: 'tree\n# 显示当前目录树\n\ntree -L 2\n# 限制显示深度为 2 层\n\ntree -a\n# 包含隐藏文件\n\ntree -d\n# 仅显示目录',
      tags: ['目录树', '结构', 'tree']
    },
    {
      cmd: 'cal',
      title: '显示日历',
      cat: '系统',
      desc: '在终端显示日历（默认当月）。可指定年月；不同实现参数略有差异（如 ncal）。适合快速查看日期。',
      usage: 'cal [[月] 年]',
      example: 'cal\n# 显示本月日历\n\ncal 2025\n# 显示整年日历（部分实现）\n\ncal 12 2025\n# 显示 2025 年 12 月',
      tags: ['日历', '日期', 'cal']
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
      cmd: 'who / w',
      title: '查看已登录用户',
      cat: '系统',
      desc: 'who 显示当前已登录用户及来源/终端；w 在 who 基础上显示每个用户正在执行的命令和负载，便于了解谁在用系统。',
      usage: 'who [选项] | w [选项]',
      example: 'who\n# 列出已登录用户\n\nw\n# 显示登录用户及当前活动\n\nwho -b\n# 显示上次系统启动时间（若支持）',
      tags: ['登录', '用户会话', '在线']
    },
    {
      cmd: 'last',
      title: '查看登录历史记录',
      cat: '系统',
      desc: '读取 /var/log/wtmp（及相关文件）显示历史登录/登出与系统重启等记录，用于审计或排查异常登录。',
      usage: 'last [选项] [用户名|终端]',
      example: 'last\n# 显示最近登录记录\n\nlast -n 10\n# 最近 10 条\n\nlast alice\n# 查看指定用户的登录历史',
      tags: ['登录历史', '审计', 'wtmp']
    },
    {
      cmd: 'type / command',
      title: '查看命令类型与解析位置',
      cat: '系统',
      desc: 'shell 内建 type 用于判断命令是别名、函数、内建还是外部程序；command -v 可脚本化检查命令是否存在。',
      usage: 'type 命令... | command -v 命令',
      example: 'type ls\n# 显示 ls 的解析类型（别名/内建/路径等）\n\ntype -a python3\n# 列出所有匹配项\n\ncommand -v node >/dev/null && echo "found"',
      tags: ['shell', '别名', '内建', '命令解析']
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
      cmd: 'man / --help / info',
      title: '查看命令帮助文档',
      cat: '查看',
      desc: 'man 打开手册页（man page），按 q 退出，/ 搜索，n/N 跳转；多数命令支持 --help 或 -h 输出简要用法。info 常用于 GNU 软件的更长文档（节点导航），不同系统可能未安装全部内容。shell 内建命令可用 help 命令名（如 help cd）查看 bash 内建帮助。',
      usage: 'man 命令 | 命令 --help | info 命令 | help 内建命令',
      example: 'man ls\n# 查看 ls 手册（q 退出，/ 搜索）\n\nls --help\n# 简要用法\n\nman -k keyword\n# 按关键字搜索手册（apropos）\n\ninfo coreutils "ls invocation"\n# 查看 info 文档（若已安装）\n\nhelp cd\n# 查看 bash 内建 cd 的帮助',
      tags: ['帮助', '文档', '手册', 'info', '用法']
    },
    {
      cmd: 'nano',
      title: '简单终端文本编辑器（nano）',
      cat: '查看',
      desc: 'nano 界面比 vi/vim 更接近“所见即输入”，底部会显示常用快捷键提示（^ 表示 Ctrl）。适合快速改配置文件；保存用 Ctrl+O，退出用 Ctrl+X。若文件为只读或无权限会提示，需用 sudo 或调整权限。',
      usage: 'nano [选项] 文件',
      example: 'nano file.txt\n# 打开或新建文件\n\n# 常用快捷键（nano 界面底部提示）：\n# Ctrl+O  保存（Write Out），回车确认文件名\n# Ctrl+X  退出；若有未保存修改会询问\n# Ctrl+W  搜索\n# Ctrl+K  剪切当前行（可多次剪切拼接）\n# Ctrl+U  粘贴\n# Ctrl+G  帮助',
      tags: ['编辑器', 'nano', '文本编辑', '终端']
    },
    {
      cmd: 'watch',
      title: '周期性执行并全屏刷新输出',
      cat: '系统',
      desc: 'watch 每隔一段时间重新执行命令并清屏显示结果，便于观察变化（如监控进程、磁盘、网络）。默认间隔约 2 秒，可用 -n 指定秒数；Ctrl+C 退出。注意命令中的管道/引号在 shell 中解析，复杂命令建议用引号包裹。',
      usage: 'watch [选项] 命令...',
      example: 'watch -n 1 date\n# 每秒刷新显示时间\n\nwatch -n 2 "df -h"\n# 每 2 秒查看磁盘使用\n\nwatch -d "ss -tuln"\n# -d 高亮显示变化（若支持）\n\nwatch -n 5 "ps aux | grep nginx"\n# 周期查看匹配进程（注意 grep 也可能匹配自身，视环境）',
      tags: ['监控', '周期', '刷新', 'watch']
    },
    {
      cmd: 'tmux',
      title: '终端复用器（tmux）',
      cat: '系统',
      desc: 'tmux 可在一个终端里创建多个会话/窗口/窗格，断线后会话可保留（配合重新 attach）。默认前缀键常为 Ctrl+b（以下用 C-b 表示）。会话与窗口/窗格概念不同：会话可包含多个窗口，窗口可分多个窗格。',
      usage: 'tmux [命令]',
      example: '# 会话\n# tmux            新建会话\n# tmux new -s dev 新建命名会话\n# tmux ls         列出会话\n# tmux attach -t dev  连接会话\n# tmux kill-session -t dev  删除会话\n\n# 在 tmux 内常用（先按 C-b，再按下键）：\n# c        新建窗口\n# n/p      下/上一个窗口\n# "        水平分割窗格\n# %        垂直分割窗格\n# 方向键   切换窗格\n# d        脱离（detach）会话\n# ,        重命名当前窗口',
      tags: ['终端复用', 'tmux', '会话', '远程']
    },
    {
      cmd: 'screen',
      title: '终端复用器（GNU screen）',
      cat: '系统',
      desc: 'screen 与 tmux 类似，用于会话保持与多窗口。默认前缀键常为 Ctrl+a（以下用 C-a 表示）。适合旧环境或习惯 screen 的场景；新项目更常见 tmux，但两者都很常用。',
      usage: 'screen [选项]',
      example: '# 常用命令（shell 中）\n# screen          新建会话\n# screen -S name  新建命名会话\n# screen -ls      列出会话\n# screen -r name  恢复会话\n\n# 在 screen 内常用（先按 C-a，再按键）：\n# c        新建窗口\n# n/p      下/上一个窗口\n# d        脱离会话\n# k        关闭当前窗口（有确认）\n# ?        查看帮助',
      tags: ['终端复用', 'screen', '会话', '远程']
    },
    {
      cmd: 'getent',
      title: '查询系统数据库条目',
      cat: '系统',
      desc: 'getent 从系统数据库（Name Service Switch）查询条目，如 passwd、group、hosts、services 等，结果反映系统实际解析顺序（可能包含 LDAP/NIS 等），比直接读 /etc/passwd 更贴近运行时。',
      usage: 'getent 数据库 [键...]',
      example: 'getent passwd alice\n# 查询用户 alice 的记录\n\ngetent group sudo\n# 查询组信息\n\ngetent hosts example.com\n# 解析主机名（类似 gethostbyname）\n\ngetent services 80\n# 按端口查服务名',
      tags: ['用户', '组', 'DNS', '查询', 'nss']
    },
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