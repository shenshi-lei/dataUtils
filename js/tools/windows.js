/* =========================================================
 * 工具：Windows 命令速查
 * 可搜索的常用 Windows（CMD / PowerShell）命令参考，附中文说明、用法与示例。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  var CATS = ['全部', '文件', '目录', '查看', '搜索', '系统', '进程', '网络', '磁盘', '用户', '服务', 'PowerShell'];

  var COMMANDS = [
    {
      cmd: 'dir',
      title: '列出目录内容',
      cat: '目录',
      desc: '显示指定目录中的文件和子目录列表（CMD）。可按属性、时间排序并显示详细信息。',
      usage: 'dir [路径] [选项]',
      example: 'dir\n# 列出当前目录\n\ndir /a\n# 显示包含隐藏和系统文件在内的所有文件\n\ndir /s /b *.log\n# 递归列出所有 .log 文件的完整路径\n\ndir /o:-d\n# 按日期倒序排列',
      tags: ['列表', '目录', '文件', 'CMD', 'list']
    },
    {
      cmd: 'cd / chdir',
      title: '切换当前目录',
      cat: '目录',
      desc: '显示或更改当前目录（CMD）。在不同驱动器间切换时常配合 /d 使用。',
      usage: 'cd [/d] [路径]',
      example: 'cd\n# 显示当前目录\n\ncd C:\\Windows\n# 切换目录（同一驱动器）\n\ncd /d D:\\data\n# 跨驱动器切换目录\n\ncd ..\n# 返回上一级目录',
      tags: ['切换', '目录', '路径', 'change directory']
    },
    {
      cmd: 'md / mkdir',
      title: '创建目录',
      cat: '目录',
      desc: '创建新目录（CMD）。在启用命令扩展时可一次创建多级目录。',
      usage: 'md [路径]',
      example: 'md logs\n# 创建目录\n\nmd a\\b\\c\n# 创建多级目录（命令扩展启用时）',
      tags: ['创建', '目录', '文件夹', 'make directory']
    },
    {
      cmd: 'rd / rmdir',
      title: '删除目录',
      cat: '目录',
      desc: '删除目录（CMD）。/s 可递归删除目录及其内容，/q 安静模式不提示确认；删除前务必确认路径。',
      usage: 'rd [/s] [/q] 路径',
      example: 'rd emptydir\n# 删除空目录\n\nrd /s /q build\n# 递归强制删除目录及内容（谨慎）',
      tags: ['删除', '目录', '移除', 'remove directory']
    },
    {
      cmd: 'copy',
      title: '复制文件',
      cat: '文件',
      desc: '将一个或多个文件复制到指定位置（CMD）。可用于合并文件，但目录复制更推荐 robocopy 或 xcopy。',
      usage: 'copy [选项] 源 目标',
      example: 'copy a.txt b.txt\n# 复制文件\n\ncopy a.txt D:\\backup\\\n# 复制到指定目录\n\ncopy /y a.txt b.txt\n# 覆盖时不提示确认\n\ncopy a.txt + b.txt all.txt\n# 合并文件内容',
      tags: ['复制', '拷贝', '文件', 'copy']
    },
    {
      cmd: 'xcopy',
      title: '复制文件和目录树',
      cat: '文件',
      desc: '复制文件和目录（含子目录）的传统命令（CMD）。功能比 copy 强，复杂同步场景更推荐 robocopy。',
      usage: 'xcopy 源 [目标] [选项]',
      example: 'xcopy src dst /e /i /y\n# 复制目录及子目录（含空目录）\n\nxcopy src dst /d /y\n# 只复制比目标新的文件\n\nxcopy src dst /s /e /h\n# 包含子目录、空目录和隐藏/系统文件',
      tags: ['复制', '目录', '递归', '备份']
    },
    {
      cmd: 'robocopy',
      title: '健壮的文件复制/同步',
      cat: '文件',
      desc: 'Windows 自带的强大复制与镜像同步工具（CMD）。支持断点续传、多线程、重试和详细日志，适合备份和大批量传输。',
      usage: 'robocopy 源 目标 [文件] [选项]',
      example: 'robocopy C:\\src D:\\dst /E\n# 复制目录树（含空目录）\n\nrobocopy C:\\src D:\\dst /MIR\n# 镜像同步（会删除目标多余文件，谨慎）\n\nrobocopy C:\\src D:\\dst /E /Z /R:3 /W:5\n# 可重启模式并设置重试次数/等待时间\n\nrobocopy C:\\src D:\\dst *.txt /S\n# 只复制匹配文件（含子目录）',
      tags: ['复制', '同步', '镜像', '备份', 'robust']
    },
    {
      cmd: 'move',
      title: '移动或重命名文件',
      cat: '文件',
      desc: '移动文件（或在同一目录下重命名）/ 移动目录（CMD）。覆盖行为可用 /y 或 /-y 控制。',
      usage: 'move [选项] 源 目标',
      example: 'move old.txt new.txt\n# 重命名文件\n\nmove file.txt D:\\backup\\\n# 移动文件到目录\n\nmove /y a.txt b.txt\n# 覆盖时不提示',
      tags: ['移动', '重命名', 'rename', 'move']
    },
    {
      cmd: 'del / erase',
      title: '删除文件',
      cat: '文件',
      desc: '删除一个或多个文件（CMD）。/s 可在子目录中删除，/q 安静模式，/f 强制删除只读文件。删除后通常不可恢复。',
      usage: 'del [选项] 文件...',
      example: 'del file.txt\n# 删除文件\n\ndel /f /q temp\\*.tmp\n# 强制静默删除匹配文件\n\ndel /s /q build\\*\n# 递归删除目录下文件（谨慎）',
      tags: ['删除', '移除', '文件', 'erase']
    },
    {
      cmd: 'ren / rename',
      title: '重命名文件或目录',
      cat: '文件',
      desc: '重命名文件或目录（CMD）。目标名称不能包含路径分隔符，跨目录移动请用 move。',
      usage: 'ren 旧名称 新名称',
      example: 'ren old.txt new.txt\n# 重命名文件\n\nren logs logs_old\n# 重命名目录',
      tags: ['重命名', '名称', 'rename']
    },
    {
      cmd: 'type',
      title: '显示文本文件内容',
      cat: '查看',
      desc: '在控制台输出文本文件内容（CMD），类似 Linux 的 cat。查看大文件时可配合 more 分页。',
      usage: 'type 文件',
      example: 'type readme.txt\n# 显示文件内容\n\ntype a.txt b.txt\n# 依次显示多个文件\n\ntype app.log | more\n# 分页查看',
      tags: ['查看', '内容', '输出', '文本']
    },
    {
      cmd: 'more',
      title: '分页显示输出',
      cat: '查看',
      desc: '逐屏显示文本内容或命令输出（CMD），适合查看较长文件。按空格翻页，q 退出。',
      usage: 'more [文件] | 命令 | more',
      example: 'more long.txt\n# 分页查看文件\n\ndir /s | more\n# 分页查看命令输出',
      tags: ['分页', '查看', '输出']
    },
    {
      cmd: 'find / findstr',
      title: '在文本中搜索字符串',
      cat: '搜索',
      desc: 'find（CMD）用于搜索简单字符串；findstr 支持更强的模式匹配（类似简化版 grep），可递归搜索文件内容。',
      usage: 'find "字符串" 文件 | findstr [选项] 模式 [文件...]',
      example: 'find "ERROR" app.log\n# 在文件中查找包含 ERROR 的行\n\nfindstr /s /n /i "error" *.log\n# 递归、显示行号、忽略大小写搜索\n\nfindstr /r "^ID:[0-9]*" data.txt\n# 使用正则模式搜索',
      tags: ['搜索', '查找', '文本', '过滤', 'grep']
    },
    {
      cmd: 'where',
      title: '查找文件位置',
      cat: '搜索',
      desc: '在 PATH 或指定目录中查找与模式匹配的文件位置（CMD），常用于定位可执行程序。',
      usage: 'where [选项] 模式',
      example: 'where python\n# 查找 PATH 中的 python\n\nwhere /r C:\\src *.config\n# 在目录树中递归查找匹配文件',
      tags: ['查找', '路径', '定位', '可执行文件']
    },
    {
      cmd: 'tree',
      title: '显示目录树结构',
      cat: '目录',
      desc: '以树形结构显示目录和（可选）文件层次（CMD），便于直观查看项目结构。',
      usage: 'tree [路径] [/f] [/a]',
      example: 'tree\n# 显示当前目录的子目录树\n\ntree /f\n# 同时显示文件\n\ntree C:\\project /f /a\n# 使用 ASCII 字符显示完整树',
      tags: ['目录树', '结构', '层级']
    },
    {
      cmd: 'attrib',
      title: '查看或修改文件属性',
      cat: '文件',
      desc: '显示或更改文件的只读(R)、隐藏(H)、系统(S)、存档(A)等属性（CMD）。',
      usage: 'attrib [属性] [路径] [/s [/d]]',
      example: 'attrib file.txt\n# 查看文件属性\n\nattrib +r file.txt\n# 设置只读\n\nattrib -h -s secret.txt\n# 去除隐藏和系统属性\n\nattrib +h +s /s /d folder\n# 递归设置（谨慎）',
      tags: ['属性', '只读', '隐藏', '系统']
    },
    {
      cmd: 'fc',
      title: '比较文件差异',
      cat: '查看',
      desc: '比较两个文件或文件集并显示差异（CMD）。可用于文本比较或二进制比较。',
      usage: 'fc [选项] 文件1 文件2',
      example: 'fc a.txt b.txt\n# 比较两个文本文件\n\nfc /b a.bin b.bin\n# 按二进制比较',
      tags: ['比较', '差异', 'diff']
    },
    {
      cmd: 'cls',
      title: '清屏',
      cat: '查看',
      desc: '清除命令提示符窗口中的显示内容（CMD）。',
      usage: 'cls',
      example: 'cls\n# 清空当前终端屏幕',
      tags: ['清屏', '清除', '终端']
    },
    {
      cmd: 'echo / set',
      title: '输出文本与查看/设置变量',
      cat: '查看',
      desc: 'echo 输出文本或控制回显（CMD）；set 显示、设置或删除环境变量（当前会话）。持久化变量需用 setx 或系统设置。',
      usage: 'echo [文本] | set [变量=[值]]',
      example: 'echo Hello\n# 输出文本\n\necho %PATH%\n# 输出环境变量\n\nset APP_ENV=prod\n# 设置当前会话变量\n\nset\n# 列出当前环境变量',
      tags: ['输出', '变量', '环境', 'echo']
    },
    {
      cmd: 'setx',
      title: '持久化设置环境变量',
      cat: '系统',
      desc: '设置用户或系统环境变量并写入注册表（CMD）。新值对新开的进程生效，当前窗口不会立即更新。',
      usage: 'setx 变量 值 [/m]',
      example: 'setx MY_VAR "hello"\n# 设置当前用户环境变量\n\nsetx PATH "%PATH%;C:\\tools" /m\n# 设置系统变量（需管理员权限；注意 PATH 写法风险）',
      tags: ['环境变量', '持久化', '配置']
    },
    {
      cmd: 'systeminfo',
      title: '查看系统详细信息',
      cat: '系统',
      desc: '显示本地计算机的详细配置信息，包括 OS 版本、主机名、内存、补丁、网卡等（CMD）。',
      usage: 'systeminfo',
      example: 'systeminfo\n# 显示完整系统信息\n\nsysteminfo | findstr /B /C:"OS Name" /C:"OS Version"\n# 过滤查看 OS 信息',
      tags: ['系统', '版本', '硬件', '配置', '信息']
    },
    {
      cmd: 'ver / hostname',
      title: '查看系统版本与主机名',
      cat: '系统',
      desc: 'ver 显示 Windows 版本号；hostname 显示当前计算机的主机名（CMD）。',
      usage: 'ver | hostname',
      example: 'ver\n# 显示 Windows 版本\n\nhostname\n# 显示主机名',
      tags: ['版本', '主机名', '系统']
    },
    {
      cmd: 'tasklist',
      title: '列出运行中的进程',
      cat: '进程',
      desc: '显示本地或远程计算机上正在运行的进程列表（CMD），可查看 PID、内存占用和服务信息。',
      usage: 'tasklist [选项]',
      example: 'tasklist\n# 列出所有进程\n\ntasklist /fi "IMAGENAME eq chrome.exe"\n# 过滤指定进程\n\ntasklist /svc\n# 显示进程对应的服务\n\ntasklist /v\n# 显示详细信息',
      tags: ['进程', '列表', 'PID', '任务']
    },
    {
      cmd: 'taskkill',
      title: '结束进程',
      cat: '进程',
      desc: '按 PID 或映像名终止进程（CMD）。/f 强制结束，/t 同时结束子进程；结束前请确认目标。',
      usage: 'taskkill [/pid PID | /im 名称] [选项]',
      example: 'taskkill /pid 1234\n# 按 PID 结束进程\n\ntaskkill /im notepad.exe /f\n# 强制结束指定程序\n\ntaskkill /im node.exe /f /t\n# 强制结束进程及其子进程（谨慎）',
      tags: ['结束', '终止', '进程', 'kill']
    },
    {
      cmd: 'start',
      title: '启动程序或打开窗口',
      cat: '进程',
      desc: '启动单独窗口运行程序或打开文件/URL（CMD）。可指定窗口标题、工作目录和等待方式。',
      usage: 'start ["标题"] [选项] 程序|文件|URL',
      example: 'start notepad\n# 打开记事本\n\nstart "" https://example.com\n# 打开网址\n\nstart /d "C:\\work" cmd\n# 在指定目录打开新命令行窗口\n\nstart /wait setup.exe\n# 启动并等待程序结束',
      tags: ['启动', '运行', '打开', '程序']
    },
    {
      cmd: 'shutdown',
      title: '关机、重启或注销',
      cat: '系统',
      desc: '关闭、重启、注销本地或远程计算机（CMD）。执行前请保存工作，远程或定时操作需谨慎。',
      usage: 'shutdown [选项]',
      example: 'shutdown /s /t 0\n# 立即关机\n\nshutdown /r /t 60\n# 60 秒后重启\n\nshutdown /a\n# 取消计划中的关机/重启\n\nshutdown /l\n# 注销当前用户',
      tags: ['关机', '重启', '注销', '电源']
    },
    {
      cmd: 'schtasks',
      title: '管理计划任务',
      cat: '系统',
      desc: '创建、删除、查询、更改和运行计划任务（CMD），用于定时或按事件执行程序与脚本。',
      usage: 'schtasks /<操作> [选项]',
      example: 'schtasks /query /fo LIST /v\n# 查看计划任务详情\n\nschtasks /run /tn "MyTask"\n# 立即运行指定任务\n\nschtasks /create /sc daily /tn "Backup" /tr "C:\\backup.bat" /st 02:00\n# 创建每日任务',
      tags: ['计划任务', '定时', '调度', '任务计划']
    },
    {
      cmd: 'ipconfig',
      title: '查看网络配置',
      cat: '网络',
      desc: '显示和刷新本机 TCP/IP 网络配置（CMD），包括 IP 地址、子网掩码、网关和 DNS 等。',
      usage: 'ipconfig [选项]',
      example: 'ipconfig\n# 查看基本网络配置\n\nipconfig /all\n# 查看详细配置（含 MAC、DNS、DHCP 等）\n\nipconfig /release\n# 释放 DHCP 地址\n\nipconfig /renew\n# 重新获取 DHCP 地址\n\nipconfig /flushdns\n# 清除 DNS 缓存',
      tags: ['IP', '网络', 'DNS', '网卡', '配置']
    },
    {
      cmd: 'ping',
      title: '测试网络连通性',
      cat: '网络',
      desc: '向目标主机发送 ICMP 回显请求，检测连通性和延迟（CMD）。',
      usage: 'ping [选项] 主机',
      example: 'ping 8.8.8.8\n# 持续探测（Ctrl+C 停止）\n\nping -n 4 example.com\n# 发送 4 个请求\n\nping -t host\n# 持续 ping 直到手动停止',
      tags: ['连通性', '延迟', 'ICMP', '网络测试']
    },
    {
      cmd: 'tracert',
      title: '跟踪路由路径',
      cat: '网络',
      desc: '跟踪数据包到目标主机经过的路由节点（CMD），用于定位网络路径中的延迟或故障点。',
      usage: 'tracert [选项] 主机',
      example: 'tracert example.com\n# 跟踪到目标的路由\n\ntracert -d 8.8.8.8\n# 不解析主机名，加快显示',
      tags: ['路由', '路径', '跳数', '网络诊断']
    },
    {
      cmd: 'pathping',
      title: '结合 ping 与路由统计',
      cat: '网络',
      desc: '在一段时间内统计到目标路径各节点的丢包和延迟情况（CMD），比 tracert 更适合观察间歇性问题。',
      usage: 'pathping [选项] 主机',
      example: 'pathping example.com\n# 统计路由路径质量（耗时较长）',
      tags: ['路由', '丢包', '延迟', '诊断']
    },
    {
      cmd: 'nslookup',
      title: '查询 DNS 记录',
      cat: '网络',
      desc: '查询域名解析信息和 DNS 服务器响应（CMD），用于排查域名解析问题。',
      usage: 'nslookup [域名] [DNS服务器]',
      example: 'nslookup example.com\n# 查询域名解析\n\nnslookup example.com 8.8.8.8\n# 指定 DNS 服务器查询\n\nnslookup -type=mx example.com\n# 查询 MX 记录',
      tags: ['DNS', '域名', '解析', '查询']
    },
    {
      cmd: 'netstat',
      title: '查看网络连接与端口',
      cat: '网络',
      desc: '显示活动的 TCP 连接、监听端口、路由表和网络统计信息（CMD）。排查端口占用时常用 -ano。',
      usage: 'netstat [选项]',
      example: 'netstat -ano\n# 显示所有连接和监听端口及 PID\n\nnetstat -ab\n# 显示关联的可执行程序（需管理员权限）\n\nnetstat -rn\n# 显示路由表',
      tags: ['端口', '连接', '监听', 'PID', 'TCP']
    },
    {
      cmd: 'arp',
      title: '查看或管理 ARP 缓存',
      cat: '网络',
      desc: '显示和修改 IP 地址到物理地址（MAC）的映射表（CMD）。',
      usage: 'arp -a | arp -d | arp -s',
      example: 'arp -a\n# 显示 ARP 缓存表\n\narp -d *\n# 清空 ARP 缓存（需管理员权限，谨慎）',
      tags: ['ARP', 'MAC', '局域网', '地址映射']
    },
    {
      cmd: 'netsh',
      title: '网络配置脚本工具',
      cat: '网络',
      desc: '用于查看和修改本地或远程计算机网络配置的命令行工具（CMD）。功能覆盖接口、防火墙、WLAN 等多个上下文。',
      usage: 'netsh <上下文> <命令>',
      example: 'netsh interface ip show config\n# 查看 IP 配置\n\nnetsh wlan show profiles\n# 查看已保存的 WLAN 配置\n\nnetsh wlan show profile name="WiFi名" key=clear\n# 查看 WLAN 详情（含密码需权限）\n\nnetsh advfirewall show allprofiles\n# 查看防火墙配置',
      tags: ['网络配置', '防火墙', 'WLAN', '接口']
    },
    {
      cmd: 'curl',
      title: '发送 HTTP/网络请求',
      cat: '网络',
      desc: '在较新版本 Windows 中内置的 curl.exe 可用于发送 HTTP 请求、下载文件和接口调试（注意与 PowerShell 的 curl 别名区分）。',
      usage: 'curl.exe [选项] URL',
      example: 'curl.exe -I https://example.com\n# 获取响应头\n\ncurl.exe -o file.zip https://example.com/file.zip\n# 下载文件\n\ncurl.exe -X POST -H "Content-Type: application/json" -d "{\\"a\\":1}" https://api.example.com\n# 发送 JSON 请求',
      tags: ['HTTP', '请求', '下载', 'API']
    },
    {
      cmd: 'chkdsk',
      title: '检查磁盘',
      cat: '磁盘',
      desc: '检查磁盘文件系统和文件系统元数据错误，并可尝试修复（CMD）。修复系统盘通常需重启执行，操作前请备份重要数据。',
      usage: 'chkdsk [卷:] [选项]',
      example: 'chkdsk C:\n# 检查 C 盘（只读检查）\n\nchkdsk D: /f\n# 检查并修复错误（卷被占用时需计划下次启动）\n\nchkdsk D: /r\n# 查找坏扇区并恢复可读信息（耗时较长）',
      tags: ['磁盘', '检查', '修复', '文件系统']
    },
    {
      cmd: 'diskpart',
      title: '磁盘分区管理',
      cat: '磁盘',
      desc: '交互式磁盘分区工具（CMD），可创建、删除、格式化分区等。操作会影响磁盘数据，务必确认目标磁盘。',
      usage: 'diskpart',
      example: 'diskpart\n# 进入交互式分区工具\n# 常用子命令：list disk / select disk N / list vol / exit',
      tags: ['分区', '磁盘', '卷', '管理']
    },
    {
      cmd: 'format',
      title: '格式化磁盘',
      cat: '磁盘',
      desc: '格式化磁盘以供 Windows 使用（CMD）。会清除卷上的数据，执行前必须确认盘符和数据备份。',
      usage: 'format 卷: [选项]',
      example: 'format E: /fs:ntfs /q\n# 快速格式化为 NTFS（谨慎，数据将丢失）\n\nformat E: /fs:exfat\n# 格式化为 exFAT',
      tags: ['格式化', '文件系统', '磁盘', '清除']
    },
    {
      cmd: 'wmic',
      title: 'WMI 命令行工具（旧）',
      cat: '系统',
      desc: '通过 Windows 管理规范（WMI）查询系统信息（CMD）。在新版本 Windows 中已逐步弃用，建议改用 PowerShell 的 CIM/WMI cmdlet。',
      usage: 'wmic [类别] [命令]',
      example: 'wmic os get Caption,Version\n# 查看操作系统信息\n\nwmic cpu get Name,NumberOfCores\n# 查看 CPU 信息\n\nwmic logicaldisk get Name,Size,FreeSpace\n# 查看磁盘信息',
      tags: ['WMI', '系统信息', '硬件', '旧命令']
    },
    {
      cmd: 'driverquery',
      title: '列出已安装驱动程序',
      cat: '系统',
      desc: '显示已安装的设备驱动程序及其属性（CMD），便于排查驱动问题。',
      usage: 'driverquery [选项]',
      example: 'driverquery\n# 列出驱动程序\n\ndriverquery /v /fo table\n# 以表格显示详细信息',
      tags: ['驱动', '设备', '系统']
    },
    {
      cmd: 'sfc /scannow',
      title: '系统文件检查',
      cat: '系统',
      desc: '扫描并修复受保护的系统文件（CMD）。通常需要管理员权限，耗时视系统情况而定。',
      usage: 'sfc /scannow',
      example: 'sfc /scannow\n# 扫描并修复系统文件（需管理员终端）',
      tags: ['系统文件', '修复', '检查', '完整性']
    },
    {
      cmd: 'DISM',
      title: '部署映像服务和管理',
      cat: '系统',
      desc: '用于修复 Windows 映像、启用/禁用功能等（CMD）。常与 sfc 配合修复系统问题，需管理员权限。',
      usage: 'DISM [选项]',
      example: 'DISM /Online /Cleanup-Image /CheckHealth\n# 检查映像是否损坏\n\nDISM /Online /Cleanup-Image /ScanHealth\n# 深度扫描映像\n\nDISM /Online /Cleanup-Image /RestoreHealth\n# 修复映像（可能需要网络）',
      tags: ['映像', '修复', '系统', 'Windows']
    },
    {
      cmd: 'net user / net localgroup',
      title: '管理本地用户和组',
      cat: '用户',
      desc: 'net user 管理本地用户账户，net localgroup 管理本地组及成员（CMD）。通常需要管理员权限。',
      usage: 'net user [用户名 ...] | net localgroup [组名 ...]',
      example: 'net user\n# 列出本地用户\n\nnet user alice\n# 查看用户信息\n\nnet localgroup administrators\n# 查看管理员组成员\n\nnet user alice /active:no\n# 禁用账户（需管理员权限，谨慎）',
      tags: ['用户', '组', '账户', '管理员']
    },
    {
      cmd: 'whoami',
      title: '查看当前用户与权限',
      cat: '用户',
      desc: '显示当前登录用户、所属组和权限信息（CMD/PowerShell 均可用）。',
      usage: 'whoami [选项]',
      example: 'whoami\n# 显示当前用户\n\nwhoami /groups\n# 显示所属组\n\nwhoami /priv\n# 显示权限',
      tags: ['用户', '身份', '权限', '组']
    },
    {
      cmd: 'runas',
      title: '以其他用户身份运行程序',
      cat: '用户',
      desc: '以指定用户账户权限运行程序（CMD）。适合在普通会话中临时使用另一账户执行任务。',
      usage: 'runas /user:用户 程序',
      example: 'runas /user:Administrator cmd\n# 以管理员账户打开命令行（需密码）\n\nrunas /user:DOMAIN\\user "mmc.exe"\n# 以域用户运行程序',
      tags: ['用户', '权限', '运行', '身份']
    },
    {
      cmd: 'sc',
      title: '管理 Windows 服务',
      cat: '服务',
      desc: '与服务控制管理器通信以查询、启动、停止、配置服务（CMD）。修改服务配置需管理员权限。',
      usage: 'sc <命令> [服务名] [选项]',
      example: 'sc query\n# 查看服务状态\n\nsc query state= all\n# 查看所有服务\n\nsc qc Spooler\n# 查看服务配置\n\nsc start Spooler\n# 启动服务（需权限）\n\nsc stop Spooler\n# 停止服务（需权限）',
      tags: ['服务', '启动', '停止', '配置']
    },
    {
      cmd: 'net start / net stop',
      title: '启动或停止服务',
      cat: '服务',
      desc: '启动或停止 Windows 服务的简便命令（CMD）。服务名需与服务控制器中的名称一致。',
      usage: 'net start [服务名] | net stop [服务名]',
      example: 'net start\n# 列出已启动服务\n\nnet start Spooler\n# 启动服务\n\nnet stop Spooler\n# 停止服务（需权限）',
      tags: ['服务', '启动', '停止']
    },
    {
      cmd: 'Get-Help',
      title: '查看 PowerShell 帮助',
      cat: 'PowerShell',
      desc: '显示 PowerShell 命令（cmdlet、函数、脚本）的帮助信息。首次使用某些帮助可能需要更新帮助内容。',
      usage: 'Get-Help <名称> [-Examples|-Detailed|-Full|-Online]',
      example: 'Get-Help Get-Process\n# 查看帮助\n\nGet-Help Get-ChildItem -Examples\n# 查看示例\n\nUpdate-Help\n# 更新帮助（需网络和权限）',
      tags: ['帮助', '文档', 'PowerShell', 'cmdlet']
    },
    {
      cmd: 'Get-Command',
      title: '查找可用命令',
      cat: 'PowerShell',
      desc: '列出当前会话可用的命令（cmdlet、函数、别名、应用程序），可按名称、模块或动词/名词过滤。',
      usage: 'Get-Command [名称] [选项]',
      example: 'Get-Command\n# 列出可用命令\n\nGet-Command -Name *service*\n# 按名称通配符查找\n\nGet-Command -Module Microsoft.PowerShell.Management\n# 查看模块中的命令',
      tags: ['命令', '查找', 'cmdlet', '模块']
    },
    {
      cmd: 'Get-ChildItem',
      title: '列出目录项（PowerShell）',
      cat: 'PowerShell',
      desc: '获取指定位置的文件和目录项（别名 ls、dir、gci）。支持过滤、递归和对象管道处理。',
      usage: 'Get-ChildItem [路径] [选项]',
      example: 'Get-ChildItem\n# 列出当前目录\n\nGet-ChildItem -Force\n# 包含隐藏项\n\nGet-ChildItem -Recurse -Filter *.log\n# 递归查找 .log 文件\n\nGet-ChildItem | Sort-Object Length -Descending | Select-Object -First 5\n# 按大小列出前 5 项',
      tags: ['列表', '目录', '文件', 'ls', 'dir']
    },
    {
      cmd: 'Set-Location / Get-Location',
      title: '切换与查看当前位置（PowerShell）',
      cat: 'PowerShell',
      desc: 'Set-Location 更改当前工作位置（别名 cd、sl）；Get-Location 显示当前位置（别名 pwd、gl）。',
      usage: 'Set-Location 路径 | Get-Location',
      example: 'Get-Location\n# 显示当前路径\n\nSet-Location C:\\Windows\n# 切换目录\n\nSet-Location ..\n# 返回上一级',
      tags: ['目录', '路径', '切换', 'pwd', 'cd']
    },
    {
      cmd: 'Copy-Item / Move-Item / Remove-Item',
      title: '复制、移动、删除项（PowerShell）',
      cat: 'PowerShell',
      desc: 'PowerShell 中用于复制、移动/重命名、删除文件和目录的 cmdlet。删除操作不可轻易恢复，使用前请确认路径。',
      usage: 'Copy-Item/Move-Item/Remove-Item 路径 [选项]',
      example: 'Copy-Item a.txt b.txt\n# 复制文件\n\nCopy-Item src dst -Recurse\n# 递归复制目录\n\nMove-Item old.txt new.txt\n# 重命名或移动\n\nRemove-Item temp\\* -Recurse -Force\n# 强制递归删除（谨慎）',
      tags: ['复制', '移动', '删除', '文件', '目录']
    },
    {
      cmd: 'New-Item',
      title: '创建新项（PowerShell）',
      cat: 'PowerShell',
      desc: '创建新文件、目录或其他项类型。配合 -ItemType 指定创建类型。',
      usage: 'New-Item 路径 -ItemType <File|Directory>',
      example: 'New-Item -ItemType Directory -Path logs\n# 创建目录\n\nNew-Item -ItemType File -Path notes.txt\n# 创建空文件\n\nNew-Item -ItemType File -Path a\\b\\c.txt -Force\n# 必要时创建路径（按需使用）',
      tags: ['创建', '文件', '目录', '新建']
    },
    {
      cmd: 'Get-Content / Set-Content',
      title: '读取与写入文件内容（PowerShell）',
      cat: 'PowerShell',
      desc: 'Get-Content 读取文件内容（可逐行、按尾部跟踪）；Set-Content 写入或覆盖内容。追加内容常用 Add-Content。',
      usage: 'Get-Content 路径 [选项] | Set-Content 路径 -Value 内容',
      example: 'Get-Content app.log\n# 读取文件内容\n\nGet-Content app.log -Tail 20 -Wait\n# 跟踪查看文件末尾新增内容\n\n"hello" | Set-Content notes.txt\n# 写入（覆盖）文件\n\n"line" | Add-Content notes.txt\n# 追加内容',
      tags: ['读取', '写入', '文件', '日志', 'cat']
    },
    {
      cmd: 'Select-String',
      title: '在文本中搜索匹配（PowerShell）',
      cat: 'PowerShell',
      desc: '在字符串或文件中搜索文本和正则匹配，功能类似 grep。可显示文件名、行号和上下文。',
      usage: 'Select-String -Pattern 模式 -Path 路径 [选项]',
      example: 'Select-String -Pattern "error" -Path *.log\n# 在日志文件中搜索\n\nSelect-String -Pattern "TODO" -Path .\\src\\* -Recurse\n# 递归搜索\n\nGet-Content app.log | Select-String "timeout"\n# 从管道输入中搜索',
      tags: ['搜索', '文本', '正则', 'grep', '过滤']
    },
    {
      cmd: 'Get-Process / Stop-Process',
      title: '查看与结束进程（PowerShell）',
      cat: 'PowerShell',
      desc: 'Get-Process 获取进程信息；Stop-Process 结束进程。可按名称或 ID 操作，强制结束需谨慎。',
      usage: 'Get-Process [名称] | Stop-Process -Id PID',
      example: 'Get-Process\n# 列出进程\n\nGet-Process -Name chrome\n# 查看指定进程\n\nStop-Process -Id 1234\n# 结束指定 PID\n\nStop-Process -Name notepad -Force\n# 强制结束同名进程（谨慎）',
      tags: ['进程', '结束', 'PID', '任务']
    },
    {
      cmd: 'Get-Service / Start-Service / Stop-Service',
      title: '管理服务（PowerShell）',
      cat: 'PowerShell',
      desc: '查询、启动、停止和重启 Windows 服务的 PowerShell cmdlet。更改服务状态通常需要管理员权限。',
      usage: 'Get-Service [名称] | Start-Service/Stop-Service/Restart-Service',
      example: 'Get-Service\n# 列出服务\n\nGet-Service -Name Spooler\n# 查看指定服务\n\nStart-Service -Name Spooler\n# 启动服务\n\nRestart-Service -Name Spooler\n# 重启服务（需权限）',
      tags: ['服务', '启动', '停止', '重启']
    },
    {
      cmd: 'Get-NetIPAddress / Get-NetTCPConnection',
      title: '查看网络地址与连接（PowerShell）',
      cat: 'PowerShell',
      desc: 'PowerShell 网络 cmdlet，可查看 IP 配置和 TCP 连接/监听端口，适合脚本化网络诊断。',
      usage: 'Get-NetIPAddress | Get-NetTCPConnection [选项]',
      example: 'Get-NetIPAddress\n# 查看 IP 地址配置\n\nGet-NetTCPConnection -State Listen\n# 查看监听端口\n\nGet-NetTCPConnection -State Established\n# 查看已建立连接',
      tags: ['网络', 'IP', '端口', '连接', 'TCP']
    },
    {
      cmd: 'Invoke-WebRequest / Invoke-RestMethod',
      title: '发送 Web 请求（PowerShell）',
      cat: 'PowerShell',
      desc: '用于 HTTP(S) 请求和 API 调用。Invoke-RestMethod 更适合直接处理 JSON/XML 响应。',
      usage: 'Invoke-WebRequest/Invoke-RestMethod -Uri URL [选项]',
      example: 'Invoke-WebRequest -Uri https://example.com -OutFile page.html\n# 下载页面/文件\n\nInvoke-RestMethod -Uri https://api.example.com/data\n# 调用 REST API 并解析响应\n\nInvoke-RestMethod -Method Post -Uri https://api.example.com -Body (@{a=1} | ConvertTo-Json) -ContentType "application/json"\n# 发送 JSON POST',
      tags: ['HTTP', 'API', '请求', '下载', 'REST']
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
      title: 'Windows 命令速查',
      desc: '常用 Windows（CMD / PowerShell）命令参考：支持按关键词搜索，查看命令含义、用法与示例。',
      search: true
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var searchInput = ui.el('input', 't-input cmdref-search');
    searchInput.type = 'search';
    searchInput.placeholder = '搜索命令、用途或关键词，如 dir / 端口 / 服务…';
    searchInput.setAttribute('aria-label', '搜索 Windows 命令');
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
    id: 'windows',
    group: '命令参考',
    title: 'Windows 命令',
    desc: '常用 Windows（CMD / PowerShell）命令速查：支持搜索并查看含义、用法与示例',
    icon: 'i-code',
    keywords: ['windows', 'cmd', 'powershell', '命令', 'bat', '终端'],
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