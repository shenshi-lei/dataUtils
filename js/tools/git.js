/* =========================================================
 * 工具：Git 命令速查
 * 可搜索的常用 Git 命令参考，附中文说明、用法与示例。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  var CATS = ['全部', '基础', '配置', '查看', '分支', '合并', '远程', '撤销', '暂存', '标签', '子模块', '排查'];

  /* 常用 Git 命令数据：cmd 为命令，title 为一句话说明，desc 为详细解释 */
  var COMMANDS = [
    {
      cmd: 'git init',
      title: '初始化仓库',
      cat: '基础',
      desc: '在当前目录创建一个新的 Git 仓库，会生成 .git 目录来保存版本历史和配置。对已有项目开始版本管理时使用。',
      usage: 'git init [目录名] [--bare]',
      example: 'git init\n# 在当前目录初始化\n\ngit init my-project\n# 新建目录并初始化\n\ngit init --bare repo.git\n# 创建裸仓库（常用于远程/服务器）',
      tags: ['初始化', '新建', '仓库', 'repository', 'bare']
    },
    {
      cmd: 'git clone',
      title: '克隆远程仓库',
      cat: '基础',
      desc: '从远程地址复制一个完整的仓库到本地，包括提交历史和引用。常用于获取已有项目代码。',
      usage: 'git clone <仓库地址> [本地目录] [选项]',
      example: 'git clone https://github.com/user/repo.git\n# 克隆到同名目录\n\ngit clone git@github.com:user/repo.git mydir\n# 克隆到指定目录\n\ngit clone --depth 1 <url>\n# 浅克隆（只取最近提交，速度更快）\n\ngit clone -b dev --single-branch <url>\n# 只克隆指定分支',
      tags: ['克隆', '下载', '复制', 'remote', 'depth', 'branch']
    },
    {
      cmd: 'git status',
      title: '查看工作区状态',
      cat: '查看',
      desc: '显示工作区和暂存区的当前状态：哪些文件已修改未暂存、哪些已暂存待提交、哪些未被跟踪，以及当前分支信息。',
      usage: 'git status [-s|--short] [-b]',
      example: 'git status\n# 详细状态\n\ngit status -s\n# 简洁输出（?? 未跟踪，M 修改，A 新增，D 删除）\n\ngit status -sb\n# 简洁输出并显示分支信息',
      tags: ['状态', '修改', '暂存', '未跟踪', 'staged']
    },
    {
      cmd: 'git add',
      title: '添加到暂存区',
      cat: '基础',
      desc: '把工作区的改动加入暂存区（index），作为下一次提交的候选内容。可以指定文件，也可以批量添加。',
      usage: 'git add <路径...> [-A|-u|-p]',
      example: 'git add file.txt\n# 暂存指定文件\n\ngit add .\n# 暂存当前目录下改动（行为随 Git 版本略有差异）\n\ngit add -A\n# 暂存所有改动（新增、修改、删除）\n\ngit add -u\n# 只暂存已跟踪文件的修改和删除\n\ngit add -p\n# 交互式分块暂存，便于拆分提交',
      tags: ['暂存', 'stage', '添加', '跟踪', 'patch']
    },
    {
      cmd: 'git commit',
      title: '提交更改',
      cat: '基础',
      desc: '将暂存区的内容记录为一次新的提交，生成唯一的提交 ID。每次提交应包含清晰的说明信息，便于追踪历史。',
      usage: 'git commit -m "说明" [选项]',
      example: 'git commit -m "修复登录校验问题"\n# 提交暂存区内容\n\ngit commit -am "更新文档"\n# 跳过 git add，直接提交已跟踪文件的修改\n\ngit commit --amend\n# 修改最近一次提交（内容或说明），会改写提交 ID\n\ngit commit -v\n# 提交时在编辑器中显示 diff 便于确认',
      tags: ['提交', '保存', '记录', 'message', 'amend']
    },
    {
      cmd: 'git log',
      title: '查看提交历史',
      cat: '查看',
      desc: '按时间倒序显示提交记录，包括提交 ID、作者、日期和说明。可配合参数以单行、图形、统计或过滤方式查看。',
      usage: 'git log [选项] [-- 路径]',
      example: 'git log\n# 完整历史\n\ngit log --oneline -10\n# 最近 10 条，单行显示\n\ngit log --oneline --graph --decorate --all\n# 图形化显示所有分支\n\ngit log --stat -2\n# 显示最近 2 次提交的文件变更统计\n\ngit log -p -- file.txt\n# 查看某文件的提交及具体改动\n\ngit log --author="Alice" --since="2026-01-01"\n# 按作者和时间过滤',
      tags: ['历史', '记录', '提交', 'history', 'graph', 'stat']
    },
    {
      cmd: 'git diff',
      title: '查看差异',
      cat: '查看',
      desc: '比较文件在不同状态之间的差异：默认比较工作区与暂存区；加 --staged 比较暂存区与最新提交；也可比较分支或提交。',
      usage: 'git diff [选项] [提交1 提交2] [-- 路径]',
      example: 'git diff\n# 工作区 vs 暂存区（未 add 的改动）\n\ngit diff --staged\n# 暂存区 vs 最近一次提交（将要提交的改动）\n\ngit diff main..feature\n# 比较两个分支\n\ngit diff HEAD~1 HEAD\n# 比较最近两次提交\n\ngit diff --name-status\n# 只显示文件名和变更类型',
      tags: ['差异', '对比', '改动', 'staged', 'compare']
    },
    {
      cmd: 'git show',
      title: '查看提交或对象详情',
      cat: '查看',
      desc: '显示某次提交（默认最新一次）的元信息和具体改动内容，也可用来查看标签或其他 Git 对象。',
      usage: 'git show [提交ID|标签] [--name-only]',
      example: 'git show\n# 查看最新提交\n\ngit show abc1234\n# 查看指定提交\n\ngit show --name-only HEAD\n# 只列出改动的文件名\n\ngit show v1.0.0\n# 查看标签指向的内容',
      tags: ['提交', '详情', '改动', 'patch', 'tag']
    },
    {
      cmd: 'git shortlog',
      title: '按作者汇总提交',
      cat: '查看',
      desc: '按作者分组汇总提交信息，常用于统计贡献者和提交概况。',
      usage: 'git shortlog [-s] [-n] [-e]',
      example: 'git shortlog -sn\n# 按提交次数统计贡献者\n\ngit shortlog -sne\n# 显示作者邮箱\n\ngit shortlog --since="1 month ago"\n# 统计最近一个月',
      tags: ['统计', '作者', '贡献', '汇总']
    },
    {
      cmd: 'git branch',
      title: '管理分支',
      cat: '分支',
      desc: '列出、创建、重命名或删除分支。分支用于并行开发，合适的分支策略能让协作更清晰。',
      usage: 'git branch [分支名] [选项]',
      example: 'git branch\n# 列出本地分支（* 表示当前）\n\ngit branch feature/login\n# 创建新分支（不切换）\n\ngit branch -a\n# 查看本地和远程所有分支\n\ngit branch -vv\n# 查看本地分支及其跟踪关系\n\ngit branch -m old-name new-name\n# 重命名分支\n\ngit branch -d feature/login\n# 删除已合并分支（-D 强制删除）',
      tags: ['分支', '列表', '创建', '删除', '重命名', 'branch']
    },
    {
      cmd: 'git checkout',
      title: '切换分支或恢复文件（传统）',
      cat: '分支',
      desc: '传统命令，可用于切换分支、创建并切换分支，或将文件恢复到指定版本。新版本 Git 推荐用 switch 管分支、restore 管文件。',
      usage: 'git checkout <分支|提交> [-- 文件]',
      example: 'git checkout main\n# 切换到 main 分支\n\ngit checkout -b feature/pay\n# 创建并切换到新分支\n\ngit checkout -t origin/feature/pay\n# 基于远程分支创建本地跟踪分支\n\ngit checkout -- file.txt\n# 丢弃工作区中该文件的未暂存改动（谨慎）',
      tags: ['切换', '分支', '恢复', 'checkout', 'switch']
    },
    {
      cmd: 'git switch',
      title: '切换分支（推荐）',
      cat: '分支',
      desc: '专门用于切换分支的命令，语义比 checkout 更明确。支持创建新分支并切换。',
      usage: 'git switch <分支名> [-c 新分支]',
      example: 'git switch main\n# 切换到已有分支\n\ngit switch -c feature/search\n# 创建并切换到新分支\n\ngit switch -\n# 切回上一个分支\n\ngit switch --detach abc1234\n# 切换到指定提交（分离 HEAD）',
      tags: ['切换', '分支', '创建', 'switch']
    },
    {
      cmd: 'git restore',
      title: '恢复文件（推荐）',
      cat: '撤销',
      desc: '专门用于恢复工作区或暂存区文件。可撤销未暂存改动，或把文件从暂存区移出而保留工作区修改。',
      usage: 'git restore [--staged|--worktree] <文件>',
      example: 'git restore file.txt\n# 丢弃工作区对该文件的修改（谨慎）\n\ngit restore --staged file.txt\n# 取消暂存，保留工作区修改\n\ngit restore -SW file.txt\n# 同时恢复暂存区和工作区（谨慎）\n\ngit restore --source=HEAD~1 file.txt\n# 从指定提交恢复文件内容',
      tags: ['恢复', '撤销', 'unstage', '丢弃', 'restore']
    },
    {
      cmd: 'git merge',
      title: '合并分支',
      cat: '合并',
      desc: '将指定分支的历史合并到当前分支。若无分叉可快进；有分叉时会产生合并提交，冲突需手动解决后提交。',
      usage: 'git merge <分支名> [选项]',
      example: 'git switch main\ngit merge feature/login\n# 将 feature/login 合并到当前 main\n\ngit merge --no-ff feature/login\n# 禁用快进，始终生成合并提交\n\ngit merge --squash feature/login\n# 将分支改动压缩为一次待提交改动\n\ngit merge --abort\n# 合并冲突时放弃本次合并',
      tags: ['合并', 'merge', '整合', '快进', '冲突', 'squash']
    },
    {
      cmd: 'git rebase',
      title: '变基',
      cat: '合并',
      desc: '把当前分支的提交“搬移”到另一个基底之上，使历史更线性。交互式变基可整理提交。不要对已推送到共享远程的公共分支随意 rebase。',
      usage: 'git rebase <基底分支> [-i] [--abort|--continue]',
      example: 'git rebase main\n# 将当前分支变基到 main 最新提交之上\n\ngit rebase -i HEAD~3\n# 交互式整理最近 3 次提交\n\ngit rebase --continue\n# 解决冲突后继续\n\ngit rebase --abort\n# 放弃本次变基\n\ngit rebase --skip\n# 跳过当前冲突提交（谨慎）',
      tags: ['变基', '整理历史', '线性', 'interactive', 'rebase']
    },
    {
      cmd: 'git cherry-pick',
      title: '拣选提交',
      cat: '合并',
      desc: '把某个或某些已有提交的改动应用到当前分支，生成新的提交。适合只引入特定修复而不合并整个分支。',
      usage: 'git cherry-pick <提交ID...> [选项]',
      example: 'git cherry-pick abc1234\n# 将指定提交应用到当前分支\n\ngit cherry-pick A B C\n# 按顺序应用多个提交\n\ngit cherry-pick -n abc1234\n# 只应用改动不自动提交\n\ngit cherry-pick --continue\n# 解决冲突后继续\n\ngit cherry-pick --abort\n# 放弃本次拣选',
      tags: ['拣选', '挑选', '提交', '应用', 'cherry']
    },
    {
      cmd: 'git pull',
      title: '拉取并整合远程更新',
      cat: '远程',
      desc: '从远程仓库获取更新并整合到当前分支，默认等价于 git fetch + git merge。用于同步远程最新代码。',
      usage: 'git pull [远程名] [分支名] [选项]',
      example: 'git pull\n# 拉取当前跟踪分支并合并\n\ngit pull origin main\n# 从 origin 的 main 拉取\n\ngit pull --rebase\n# 拉取后用 rebase 代替 merge\n\ngit pull --ff-only\n# 仅在可快进时合并，避免意外合并提交',
      tags: ['拉取', '更新', '同步', 'fetch', 'merge', 'rebase']
    },
    {
      cmd: 'git fetch',
      title: '获取远程更新（不合并）',
      cat: '远程',
      desc: '从远程下载最新的提交和引用信息，但不修改本地工作分支。适合先查看远程变化再决定如何整合。',
      usage: 'git fetch [远程名] [--all] [-p] [--tags]',
      example: 'git fetch origin\n# 获取 origin 的更新\n\ngit fetch --all\n# 获取所有远程的更新\n\ngit fetch -p\n# 同时清理已在远程删除的分支引用（prune）\n\ngit fetch --tags\n# 获取标签\n\ngit log HEAD..origin/main\n# fetch 后比较本地与远程差异',
      tags: ['获取', '下载', '远程', '同步', 'prune']
    },
    {
      cmd: 'git push',
      title: '推送到远程仓库',
      cat: '远程',
      desc: '将本地提交上传到远程仓库。首次推送新分支通常需要设置上游跟踪；推送会更新远程分支指针。',
      usage: 'git push [远程名] [分支名] [选项]',
      example: 'git push\n# 推送当前分支到已跟踪的远程分支\n\ngit push -u origin feature/login\n# 首次推送并建立跟踪关系\n\ngit push origin --tags\n# 推送本地标签\n\ngit push origin --delete feature/old\n# 删除远程分支\n\ngit push --force-with-lease\n# 更安全的强推（慎用，避免覆盖他人提交）',
      tags: ['推送', '上传', '发布', 'remote', 'upstream', 'delete']
    },
    {
      cmd: 'git remote',
      title: '管理远程仓库',
      cat: '远程',
      desc: '查看、添加、修改、重命名或删除远程仓库配置。origin 通常是默认远程名。',
      usage: 'git remote [子命令] [选项]',
      example: 'git remote -v\n# 查看远程名称和地址\n\ngit remote add origin <url>\n# 添加远程仓库\n\ngit remote set-url origin <new-url>\n# 修改远程地址\n\ngit remote rename origin upstream\n# 重命名远程\n\ngit remote show origin\n# 查看远程详细信息\n\ngit remote remove origin\n# 删除远程配置',
      tags: ['远程', 'origin', '地址', '仓库', 'show']
    },
    {
      cmd: 'git ls-remote',
      title: '查看远程引用',
      cat: '远程',
      desc: '列出远程仓库中的分支、标签等引用及其对应的提交 ID，无需克隆或拉取完整内容。',
      usage: 'git ls-remote [远程名|URL] [模式]',
      example: 'git ls-remote origin\n# 查看 origin 的所有引用\n\ngit ls-remote --heads origin\n# 只查看远程分支\n\ngit ls-remote --tags origin\n# 只查看远程标签',
      tags: ['远程', '引用', '分支', '标签', '查看']
    },
    {
      cmd: 'git reset',
      title: '重置 HEAD / 暂存区',
      cat: '撤销',
      desc: '移动当前分支指针并可选择性地重置暂存区和工作区。--soft 只移动 HEAD；--mixed（默认）重置暂存区；--hard 同时丢弃工作区改动（危险）。',
      usage: 'git reset [--soft|--mixed|--hard] <提交> [-- 路径]',
      example: 'git reset --soft HEAD~1\n# 撤销最近一次提交，改动保留在暂存区\n\ngit reset HEAD~1\n# 撤销提交且取消暂存，改动保留在工作区\n\ngit reset --hard HEAD~1\n# 彻底回退并丢弃改动（谨慎）\n\ngit reset HEAD -- file.txt\n# 取消暂存指定文件（旧写法，等价于 git restore --staged）\n\ngit reset --hard origin/main\n# 强制对齐到远程分支（会丢本地改动）',
      tags: ['回退', '撤销', '重置', 'soft', 'hard', 'HEAD']
    },
    {
      cmd: 'git revert',
      title: '反做提交（安全撤销）',
      cat: '撤销',
      desc: '创建一个新的提交来抵消指定提交的改动，不改写历史。适合撤销已经推送到公共分支的提交。',
      usage: 'git revert <提交ID...> [选项]',
      example: 'git revert abc1234\n# 生成反向提交撤销指定改动\n\ngit revert HEAD\n# 撤销最近一次提交\n\ngit revert -n abc1234\n# 只应用反向改动，不自动提交\n\ngit revert -m 1 <merge-commit>\n# 回滚合并提交（需指定主线）\n\ngit revert --abort\n# 放弃本次回滚',
      tags: ['撤销', '回滚', '反做', '安全', '公共分支']
    },
    {
      cmd: 'git clean',
      title: '清理未跟踪文件',
      cat: '撤销',
      desc: '删除工作区中未被 Git 跟踪的文件或目录。常用于清理构建产物或临时文件。建议先用 -n 预览。',
      usage: 'git clean -fd [-n] [-x|-X]',
      example: 'git clean -nfd\n# 预览将要删除的未跟踪文件/目录（不实际删除）\n\ngit clean -fd\n# 删除未跟踪文件和目录\n\ngit clean -fdx\n# 连同 .gitignore 忽略的文件也删除（非常谨慎）\n\ngit clean -fdX\n# 只删除被 .gitignore 忽略的文件',
      tags: ['清理', '未跟踪', '删除', '临时文件']
    },
    {
      cmd: 'git rm',
      title: '删除文件',
      cat: '基础',
      desc: '从工作区和暂存区中删除文件，并将删除操作纳入下一次提交。用 --cached 可仅取消跟踪而保留本地文件。',
      usage: 'git rm <文件> [--cached] [-r] [-f]',
      example: 'git rm old.txt\n# 删除文件并暂存删除操作\n\ngit rm --cached config.local\n# 从 Git 跟踪中移除但保留本地文件\n\ngit rm -r build/\n# 递归删除目录',
      tags: ['删除', '移除', '跟踪', 'cached']
    },
    {
      cmd: 'git mv',
      title: '移动或重命名文件',
      cat: '基础',
      desc: '移动或重命名文件，并自动把变更加入暂存区。等价于手动移动后执行 git add 和 git rm。',
      usage: 'git mv <旧路径> <新路径>',
      example: 'git mv old-name.txt new-name.txt\n# 重命名文件\n\ngit mv src/a.js lib/a.js\n# 移动文件到其他目录',
      tags: ['移动', '重命名', 'rename', 'move']
    },
    {
      cmd: 'git stash',
      title: '暂存未完成改动',
      cat: '暂存',
      desc: '把当前工作区和暂存区的改动临时保存起来，使工作区变干净，便于切换分支或处理其他任务，之后可恢复。',
      usage: 'git stash [push|pop|apply|list|show|drop|clear]',
      example: 'git stash\n# 临时保存当前改动\n\ngit stash push -m "临时保存登录页修改"\n# 带说明保存\n\ngit stash push -u -m "含未跟踪文件"\n# 同时保存未跟踪文件\n\ngit stash list\n# 查看暂存列表\n\ngit stash show -p stash@{0}\n# 查看某条暂存的具体改动\n\ngit stash pop\n# 恢复最近一次暂存并从列表移除\n\ngit stash apply stash@{1}\n# 恢复指定暂存但保留记录\n\ngit stash branch fix-bug stash@{0}\n# 基于暂存创建并切换到新分支',
      tags: ['暂存', '搁置', '临时', 'stash', 'pop', 'apply']
    },
    {
      cmd: 'git stash drop / clear',
      title: '删除暂存记录',
      cat: '暂存',
      desc: '删除某条或全部 stash 记录。drop 删除指定条目，clear 清空所有暂存记录（不可恢复）。',
      usage: 'git stash drop [stash@{n}] | git stash clear',
      example: 'git stash drop\n# 删除最近一条 stash\n\ngit stash drop stash@{2}\n# 删除指定条目\n\ngit stash clear\n# 清空所有 stash（谨慎）',
      tags: ['暂存', '删除', '清理', 'stash']
    },
    {
      cmd: 'git tag',
      title: '管理标签',
      cat: '标签',
      desc: '为特定提交打标签，常用于标记发布版本。分轻量标签和附注标签，附注标签可包含说明、作者和日期。',
      usage: 'git tag [选项] [标签名] [提交]',
      example: 'git tag\n# 列出所有标签\n\ngit tag v1.0.0\n# 在当前提交创建轻量标签\n\ngit tag -a v1.0.0 -m "发布 1.0.0"\n# 创建附注标签\n\ngit tag -d v1.0.0\n# 删除本地标签\n\ngit push origin v1.0.0\n# 推送单个标签到远程\n\ngit push origin --tags\n# 推送所有标签\n\ngit push origin --delete v1.0.0\n# 删除远程标签',
      tags: ['标签', '版本', '发布', 'release', 'tag', 'annotate']
    },
    {
      cmd: 'git describe',
      title: '生成可读版本描述',
      cat: '标签',
      desc: '基于最近的标签生成可读的版本描述字符串，常用于构建版本号（如 v1.2.0-5-gabc1234）。',
      usage: 'git describe [--tags] [--always] [提交]',
      example: 'git describe\n# 基于最近附注标签描述当前提交\n\ngit describe --tags\n# 也考虑轻量标签\n\ngit describe --always --dirty\n# 无标签时显示提交ID，有未提交改动时加 -dirty',
      tags: ['版本号', '描述', '标签', '构建']
    },
    {
      cmd: 'git config',
      title: '查看或设置配置',
      cat: '配置',
      desc: '读取和修改 Git 配置。--global 作用于当前用户，--local（默认）作用于当前仓库，--system 作用于整台机器。',
      usage: 'git config [--global|--local|--system] <键> [值]',
      example: 'git config --global user.name "Your Name"\n# 设置全局用户名\n\ngit config --global user.email "you@example.com"\n# 设置全局邮箱\n\ngit config --list --show-origin\n# 查看所有生效配置及来源\n\ngit config --global core.editor vim\n# 设置默认编辑器\n\ngit config core.autocrlf input\n# Linux 常用换行符设置\n\ngit config --global alias.st status\n# 设置命令别名',
      tags: ['配置', '用户名', '邮箱', '设置', 'alias', 'config']
    },
    {
      cmd: 'git blame',
      title: '逐行追溯修改来源',
      cat: '排查',
      desc: '显示文件每一行最后一次被哪个提交修改、由谁在何时改动。排查问题、了解代码历史时很有用。',
      usage: 'git blame <文件> [-L 开始,结束] [-w]',
      example: 'git blame src/app.js\n# 查看整个文件每行的最后修改者\n\ngit blame -L 10,30 src/app.js\n# 只查看第 10 到 30 行\n\ngit blame -w src/app.js\n# 忽略空白改动',
      tags: ['追溯', '作者', '修改', '排查', 'annotate']
    },
    {
      cmd: 'git reflog',
      title: '查看引用变更日志',
      cat: '排查',
      desc: '记录本地 HEAD 和分支引用的移动历史（如提交、reset、checkout、rebase）。误操作后常可通过 reflog 找回提交。',
      usage: 'git reflog [show] [-n]',
      example: 'git reflog\n# 查看最近的引用变动\n\ngit reflog -10\n# 最近 10 条\n\ngit reset --hard HEAD@{2}\n# 根据 reflog 恢复到之前的位置',
      tags: ['恢复', '找回', '历史', 'reset', 'HEAD']
    },
    {
      cmd: 'git bisect',
      title: '二分定位问题提交',
      cat: '排查',
      desc: '通过二分查找在“好”与“坏”提交之间定位首次引入问题的提交。每一步测试后标记 good/bad，Git 自动切到中间提交。',
      usage: 'git bisect start|good|bad|reset|run',
      example: 'git bisect start\ngit bisect bad\n# 标记当前为有问题\ngit bisect good v1.0.0\n# 标记已知正常的版本\n# ... 测试后执行 git bisect good 或 git bisect bad ...\ngit bisect reset\n# 结束定位并回到原分支\n\ngit bisect run ./test.sh\n# 用脚本自动二分（返回 0 为好，非 0 为坏）',
      tags: ['二分', '定位', 'bug', '排查', '回归']
    },
    {
      cmd: 'git grep',
      title: '在仓库中搜索文本',
      cat: '排查',
      desc: '在 Git 跟踪的文件中搜索字符串或正则表达式，速度通常快于普通 grep，且可限定到特定提交或路径。',
      usage: 'git grep [选项] <模式> [提交] [-- 路径]',
      example: 'git grep "TODO"\n# 在当前工作区搜索 TODO\n\ngit grep -n "login"\n# 显示匹配行号\n\ngit grep -n --heading --break "config"\n# 更易读的分组输出\n\ngit grep "token" HEAD~5\n# 在某个历史版本中搜索',
      tags: ['搜索', '查找', '文本', 'grep']
    },
    {
      cmd: 'git show-ref / git rev-parse',
      title: '查看引用与解析提交',
      cat: '排查',
      desc: 'show-ref 列出本地引用；rev-parse 用于解析修订版本参数、获取提交哈希或仓库路径等信息，常用于脚本。',
      usage: 'git show-ref | git rev-parse <参数>',
      example: 'git show-ref\n# 列出所有引用及其哈希\n\ngit rev-parse HEAD\n# 输出当前提交的完整哈希\n\ngit rev-parse --abbrev-ref HEAD\n# 输出当前分支名\n\ngit rev-parse --show-toplevel\n# 输出仓库根目录路径',
      tags: ['引用', '哈希', '分支名', '脚本', '解析']
    },
    {
      cmd: 'git ls-files',
      title: '列出已跟踪文件',
      cat: '查看',
      desc: '显示索引和工作区中被 Git 跟踪的文件列表，可用于查看暂存状态或排查忽略规则影响。',
      usage: 'git ls-files [选项]',
      example: 'git ls-files\n# 列出所有已跟踪文件\n\ngit ls-files -m\n# 列出已修改但未暂存的文件\n\ngit ls-files --others --exclude-standard\n# 列出未跟踪且未被忽略的文件',
      tags: ['文件', '跟踪', '索引', '列表']
    },
    {
      cmd: 'git submodule',
      title: '管理子模块',
      cat: '子模块',
      desc: '在一个仓库中嵌入并跟踪另一个仓库的特定提交。适合依赖独立维护的外部项目。',
      usage: 'git submodule <add|init|update|status|sync|deinit>',
      example: 'git submodule add <url> path/to/submodule\n# 添加子模块\n\ngit submodule update --init --recursive\n# 初始化并更新子模块（克隆后常用）\n\ngit submodule status\n# 查看子模块状态\n\ngit submodule sync --recursive\n# 同步子模块远程地址配置',
      tags: ['子模块', '依赖', '嵌套仓库', 'submodule']
    },
    {
      cmd: 'git worktree',
      title: '管理多个工作树',
      cat: '分支',
      desc: '为同一个仓库创建多个工作目录，可同时检出不同分支并行工作，无需反复切换或多次克隆。',
      usage: 'git worktree <add|list|remove|prune>',
      example: 'git worktree list\n# 列出所有工作树\n\ngit worktree add ../hotfix hotfix-branch\n# 在新目录检出指定分支\n\ngit worktree add -b feature/x ../feature-x main\n# 创建新分支并在新目录检出\n\ngit worktree remove ../hotfix\n# 移除工作树\n\ngit worktree prune\n# 清理失效的工作树记录',
      tags: ['工作树', '多目录', '并行', '分支']
    },
    {
      cmd: 'git archive',
      title: '导出归档文件',
      cat: '基础',
      desc: '将指定提交或分支的文件内容打包为归档（如 tar/zip），不包含 .git 历史，适合发布源码快照。',
      usage: 'git archive [选项] <树对象> -o <文件>',
      example: 'git archive --format=zip -o release.zip HEAD\n# 导出当前版本为 zip\n\ngit archive --format=tar v1.0.0 | gzip > release.tar.gz\n# 导出标签版本为 tar.gz',
      tags: ['导出', '打包', '归档', '发布', 'zip', 'tar']
    },
    {
      cmd: 'git format-patch / git am',
      title: '生成与应用补丁邮件',
      cat: '合并',
      desc: 'format-patch 将提交导出为补丁文件；am 将补丁邮件应用为提交。常用于邮件工作流或跨仓库传递变更。',
      usage: 'git format-patch <范围> | git am <补丁文件>',
      example: 'git format-patch -1 HEAD\n# 将最近一次提交导出为补丁\n\ngit format-patch origin/main..HEAD\n# 导出本地未推送提交为补丁\n\ngit am 0001-fix.patch\n# 应用补丁文件\n\ngit am --abort\n# 应用冲突时放弃',
      tags: ['补丁', 'patch', '邮件', '导出', '应用']
    },
    {
      cmd: 'git apply',
      title: '应用补丁到工作区',
      cat: '合并',
      desc: '将补丁（diff）应用到文件，不自动创建提交。适合先检查或部分应用改动。',
      usage: 'git apply [选项] <补丁文件>',
      example: 'git apply fix.patch\n# 应用补丁\n\ngit apply --check fix.patch\n# 仅检查补丁是否可应用\n\ngit apply --3way fix.patch\n# 尝试三方合并方式应用',
      tags: ['补丁', 'diff', '应用', '检查']
    },
    {
      cmd: 'git help / git version',
      title: '帮助与版本信息',
      cat: '配置',
      desc: 'git help 查看命令帮助文档；git version 显示当前 Git 版本。遇到参数不确定时优先查帮助。',
      usage: 'git help <命令> | git <命令> -h | git version',
      example: 'git help commit\n# 打开 commit 的详细帮助\n\ngit commit -h\n# 查看 commit 的简要参数\n\ngit --version\n# 查看 Git 版本',
      tags: ['帮助', '文档', '版本', 'help', 'version']
    },
    {
      cmd: 'git gc / git fsck',
      title: '仓库维护与检查',
      cat: '排查',
      desc: 'gc 执行垃圾回收和仓库优化（压缩对象等）；fsck 检查对象数据库的完整性和一致性，排查仓库损坏问题。',
      usage: 'git gc [--prune] | git fsck [--full]',
      example: 'git gc\n# 执行常规垃圾回收与优化\n\ngit gc --prune=now\n# 立即清理不可达对象（谨慎）\n\ngit fsck\n# 检查仓库完整性\n\ngit count-objects -vH\n# 查看仓库对象统计',
      tags: ['维护', '优化', '检查', '完整性', '垃圾回收']
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
      title: 'Git 命令速查',
      desc: '常用 Git 命令参考：支持按关键词搜索，查看命令含义、用法与示例。',
      search: true
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var searchInput = ui.el('input', 't-input cmdref-search');
    searchInput.type = 'search';
    searchInput.placeholder = '搜索命令、用途或关键词，如 clone / 回退 / 分支…';
    searchInput.setAttribute('aria-label', '搜索 Git 命令');
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
    id: 'git',
    group: '命令参考',
    title: 'Git 命令',
    desc: '常用 Git 命令速查：支持搜索并查看含义、用法与示例',
    icon: 'i-code',
    keywords: ['git', '版本控制', 'commit', 'branch', 'merge', 'rebase'],
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