/* =========================================================
 * 工具：Git 命令速查
 * 可搜索的常用 Git 命令参考，附中文说明、用法与示例。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  var CATS = ['全部', '工作流', '基础', '配置', '查看', '分支', '合并', '远程', '撤销', '暂存', '标签', '子模块', '排查'];

  /* 常用 Git 命令数据：cmd 为命令，title 为一句话说明，desc 为详细解释 */
  var COMMANDS = [
    {
      cmd: 'Git 常用命令速查（一整套）',
      title: '从配置到提交推送的完整流程',
      cat: '工作流',
      desc: '覆盖日常开发完整链路：配置、获取仓库、日常提交、分支合并、远程同步、暂存撤销与排查。示例中每条命令都带中文注释；组合命令请注意适用场景与风险。',
      usage: '按场景复制需要的命令；# 后为注释说明。危险操作（reset --hard、clean -fdx、force push 等）执行前先确认。',
      example: '# ===== 1. 初始配置（首次使用）=====\n' +
        'git config --global user.name "Your Name"          # 设置提交用户名\n' +
        'git config --global user.email "you@example.com"   # 设置提交邮箱\n' +
        'git config --global init.defaultBranch main        # 新仓库默认分支名设为 main\n' +
        'git config --list --show-origin                    # 查看所有配置及其来源文件\n' +
        '\n' +
        '# ===== 2. 获取/创建仓库 =====\n' +
        'git init                                           # 在当前目录初始化仓库\n' +
        'git clone <url>                                    # 克隆远程仓库（含完整历史）\n' +
        'git clone --recurse-submodules <url>               # 克隆并初始化子模块\n' +
        '\n' +
        '# ===== 3. 日常开发与提交 =====\n' +
        'git status -sb                                     # 简洁查看状态和当前分支\n' +
        'git diff                                           # 查看未暂存改动\n' +
        'git diff --staged                                  # 查看已暂存、将要提交的改动\n' +
        'git add -A                                         # 暂存所有改动（新增/修改/删除）\n' +
        'git add -A && git commit -m "feat: 描述"           # 暂存所有改动并提交（含新文件，常用组合）\n' +
        'git add -p                                         # 交互式分块暂存，便于拆分提交\n' +
        'git commit -m "feat: 描述"                         # 提交暂存区\n' +
        'git commit -am "fix: 描述"                         # 已跟踪文件：暂存+提交一步完成（不含新文件）\n' +
        'git commit -a -m "fix: 描述"                       # 同 commit -am，-a 与 -m 分开写\n' +
        'git commit --amend --no-edit                       # 补充改动到上次提交，不改说明（会改写提交ID）\n' +
        '\n' +
        '# ===== 4. 分支与合并 =====\n' +
        'git switch -c feature/demo                         # 创建并切换到新分支\n' +
        'git switch main                                    # 切换回主分支\n' +
        'git fetch origin                                   # 获取远程更新，不自动合并\n' +
        'git merge origin/main                              # 合并远程主分支到当前分支\n' +
        'git rebase main                                    # 将当前分支变基到 main（公共分支慎用）\n' +
        '\n' +
        '# ===== 5. 远程同步 =====\n' +
        'git remote -v                                      # 查看远程地址\n' +
        'git fetch --all -p                                 # 获取所有远程并清理失效远程跟踪分支\n' +
        'git pull --rebase                                  # 拉取并 rebase，减少无意义合并提交\n' +
        'git push -u origin feature/demo                    # 首次推送并建立上游跟踪\n' +
        'git push                                           # 后续推送当前跟踪分支\n' +
        '\n' +
        '# ===== 6. 临时保存 / 撤销 / 排查 =====\n' +
        'git stash push -u -m "wip"                         # 临时保存改动，包含未跟踪文件\n' +
        'git stash pop                                      # 恢复最近暂存并移除记录\n' +
        'git restore --staged <file>                        # 取消暂存，保留工作区修改\n' +
        'git restore <file>                                 # 丢弃工作区修改（谨慎，不可恢复）\n' +
        'git reflog -10                                     # 查看最近引用变动，误操作找回线索\n' +
        'git log --oneline --graph --decorate --all -10     # 图形化查看最近提交',
      pitfalls: '1. git commit -am / -a -m 只会暂存已跟踪文件的修改和删除，不包含新文件；包含新文件时用 git add -A && git commit -m "..."。\n' +
        '2. git add -A 暂存全仓库所有改动；git add . 暂存当前路径改动；git add -u 只暂存已跟踪文件修改/删除。提交前用 git status 确认范围。\n' +
        '3. git commit --amend / git rebase 会改写提交历史（提交 ID 变化）：不要对已推送到公共分支的提交随意执行；若已推送，只能谨慎使用 git push --force-with-lease，并提前与协作者同步。\n' +
        '3. git pull 默认是 fetch+merge，可能产生合并提交；git pull --rebase 历史更线性，但遇冲突要按提交逐个解决并 git rebase --continue。\n' +
        '4. git restore <file> 和 git reset --hard 会丢弃改动：执行前用 git status / git diff / git stash 确认。误 reset --hard 可先看 git reflog 尝试找回。\n' +
        '5. git stash pop 遇冲突时，stash 记录可能不会自动删除；解决冲突后检查 git stash list，必要时手动 git stash drop。\n' +
        '6. git add -A 会暂存删除和新增：提交前检查 git status，避免误提交敏感文件、构建产物或本地配置；必要时完善 .gitignore。\n' +
        '7. git clean -fdx 会删除未跟踪文件且包括忽略文件：先用 git clean -nfdx 预览。该操作通常不可恢复。\n' +
        '8. 换行符/编码坑：Windows 与 Linux 协作注意 core.autocrlf、.gitattributes；否则可能出现整文件“假 diff”。\n' +
        '9. 首次推送新分支用 git push -u origin <branch> 建立跟踪，否则后续 git push/pull 可能提示无上游。\n' +
        '10. 子模块坑：普通 clone 不会自动拉取子模块内容，需 --recurse-submodules 或 git submodule update --init --recursive。\n' +
        '11. 敏感信息误提交：已推送的敏感信息不能只靠新提交覆盖，需专门清理历史；普通 revert 不能解决泄露问题。',
      tags: ['一整套', '完整流程', '工作流', '组合命令', 'commit -am', 'commit -a -m', 'add -A && commit', 'cheatsheet', '常用', '坑', '注意事项', 'pull --rebase', 'force-with-lease', 'reflog', 'amend --no-edit']
    },
    {
      cmd: 'git add -A && git commit -m "msg"',
      title: '暂存所有改动并提交（组合命令）',
      cat: '工作流',
      desc: '先暂存所有改动（新增、修改、删除），再创建提交。适合一次性提交当前工作区全部变更，包括新文件。',
      usage: 'git add -A && git commit -m "提交说明"',
      example: 'git add -A && git commit -m "feat: 完成登录页"\n# 暂存所有改动（含新文件）并提交\n\n# 等价分步写法\ngit add -A\n# 暂存所有改动\ngit status\n# 提交前确认暂存内容\ngit commit -m "feat: 完成登录页"\n# 提交\n\n# 只想提交已跟踪文件时用：\ngit commit -am "fix: 仅提交已跟踪修改"',
      pitfalls: '1. -A 会暂存新增、修改、删除，范围很大；提交前务必用 git status / git diff --staged 检查，避免误提交敏感文件或构建产物。\n2. && 表示前一条成功才执行后一条；如果 add 失败，不会 commit。\n3. 只想提交已跟踪文件时用 git commit -am "..."；需要拆分提交时用 git add -p 或按文件分批暂存。\n4. 在 monorepo 或子目录执行 git add -A 时，确认当前目录和仓库根范围是否符合预期。',
      tags: ['add -A', 'commit', '组合命令', '全部暂存', '新文件', '工作流']
    },
    {
      cmd: 'git add . && git commit -m "msg"',
      title: '暂存当前目录改动并提交（组合命令）',
      cat: '工作流',
      desc: '暂存当前目录下的改动并提交。现代 Git 中 git add . 会包含新增/修改/删除，但作用范围是当前路径；在仓库子目录执行时要特别注意范围。',
      usage: 'git add . && git commit -m "提交说明"',
      example: 'git add . && git commit -m "feat: 更新当前模块"\n# 暂存当前目录改动并提交\n\n# 对比：在仓库根目录暂存全部改动\ngit add -A && git commit -m "feat: 全仓库提交"',
      pitfalls: '1. git add . 的范围是当前目录（路径参数），不是“永远等于全仓库”；在子目录执行时只影响该目录。\n2. 提交前用 git status 确认暂存范围，避免漏掉仓库其他目录的改动或误以为已全量提交。\n3. 需要明确全仓库暂存时优先用 git add -A。',
      tags: ['add .', 'commit', '组合命令', '当前目录', '工作流']
    },
    {
      cmd: 'git add -u && git commit -m "msg"',
      title: '仅暂存已跟踪改动并提交（组合命令）',
      cat: '工作流',
      desc: '只暂存已跟踪文件的修改和删除，然后提交。不会包含新文件，适合“只提交已有文件改动”的场景。',
      usage: 'git add -u && git commit -m "提交说明"',
      example: 'git add -u && git commit -m "fix: 修复已跟踪文件问题"\n# 暂存已跟踪文件的修改/删除并提交\n\n# 等价快捷写法\ngit commit -am "fix: 修复已跟踪文件问题"',
      pitfalls: '1. git add -u 不包含未跟踪的新文件；新文件需先 git add <file> 或改用 git add -A。\n2. 会包含已跟踪文件的删除操作，提交前检查 git status。\n3. 和 git commit -am 效果类似，但分步写法更便于在 add 后检查 git diff --staged。',
      tags: ['add -u', 'commit', '组合命令', '已跟踪', '工作流']
    },
    {
      cmd: 'git commit -m "标题" -m "正文"',
      title: '提交并填写多段说明',
      cat: '工作流',
      desc: '使用多个 -m 参数创建带标题和正文的提交信息，适合在命令行中快速写清楚变更背景。',
      usage: 'git commit -m "标题" -m "正文"',
      example: 'git commit -m "fix: 修复登录超时" -m "原因：token 刷新逻辑未处理过期边界。\\n影响：登录页和静默刷新。"\n# 第一段作为标题，第二段作为正文\n\ngit commit\n# 需要更复杂的多段说明/模板时，直接打开编辑器编写',
      pitfalls: '1. 多个 -m 会按段落拼接提交信息；复杂格式或团队模板建议直接 git commit 打开编辑器。\n2. 命令行中换行/引号在不同 shell 下行为不同；必要时用编辑器避免转义问题。\n3. 提交说明应说明“为什么改”，不仅是“改了什么”。',
      tags: ['commit', 'message', '多段提交信息', '工作流']
    },
    {
      cmd: 'git commit -am "msg"',
      title: '已跟踪文件快速提交（组合命令）',
      cat: '工作流',
      desc: '将已跟踪文件的修改和删除一步暂存并提交。适合快速提交，但不会包含未跟踪的新文件。',
      usage: 'git commit -am "提交说明" | git commit -a -m "提交说明"',
      example: 'git commit -am "fix: 修复登录校验"\n# 已跟踪文件：暂存+提交一步完成\n\ngit commit -a -m "fix: 修复登录校验"\n# 同上，-a 和 -m 分开写，效果相同\n\n# 等价于（仅已跟踪文件）\ngit add -u\ngit commit -m "fix: 修复登录校验"\n\n# 如果包含新文件，请用：\ngit add -A && git commit -m "feat: 新增功能"',
      pitfalls: '1. 不会添加未跟踪的新文件：新文件必须先 git add。\n2. 会暂存已跟踪文件的所有修改和删除，提交前用 git status 确认范围。\n3. -am 和 -a -m 等价；只想提交部分已跟踪文件时不要用，改用显式 git add <file>。\n4. 不适合拆分提交；需要精细控制时用 git add -p 或分多次 add/commit。',
      tags: ['commit', 'am', '-a -m', '组合命令', '已跟踪', '快速提交', '工作流']
    },
    {
      cmd: 'git pull --rebase',
      title: '拉取并变基（保持线性历史）',
      cat: '工作流',
      desc: '先 fetch 远程更新，再将本地未推送提交 rebase 到远程分支之上，减少无意义的 merge commit。',
      usage: 'git pull --rebase [远程名] [分支名]',
      example: 'git pull --rebase\n# 拉取当前跟踪分支并变基\n\ngit pull --rebase origin main\n# 从 origin/main 拉取并变基\n\ngit pull --rebase --autostash\n# 自动暂存本地未提交改动，rebase 后恢复\n\n# 冲突时：\n# 1. 解决冲突并 git add <file>\n# 2. git rebase --continue\n# 3. 放弃则 git rebase --abort',
      pitfalls: '1. rebase 会改写本地未推送提交的基底，提交 ID 会变化；不要对已推送公共分支随意 rebase。\n2. 冲突可能按提交逐个出现，需要多次解决并 continue。\n3. 有未提交改动时 pull --rebase 可能失败；先 commit/stash，或使用 --autostash。\n4. 团队协作时确认大家对 rebase 工作流有共识，避免历史混乱。',
      tags: ['pull', 'rebase', '同步', '线性历史', '组合命令', '工作流']
    },
    {
      cmd: 'git fetch -p && git branch -vv',
      title: '同步远程并检查分支跟踪状态',
      cat: '工作流',
      desc: '先获取远程更新并清理失效的远程跟踪引用，再查看本地分支与上游的跟踪关系，识别已 gone 的分支。',
      usage: 'git fetch -p && git branch -vv',
      example: 'git fetch -p\n# 获取远程更新并 prune 失效远程跟踪分支\ngit branch -vv\n# 查看本地分支、最新提交和上游跟踪状态\n\n# 组合使用\ngit fetch -p && git branch -vv\n# 同步后检查哪些分支上游已 gone',
      pitfalls: '1. git fetch -p 只删除本地的远程跟踪引用（如 origin/feature），不会删除本地分支。\n2. 上游显示 gone 的本地分支，确认已合并后再用 git branch -d 删除。\n3. 未设置上游的分支不会显示跟踪关系；首次推送用 git push -u origin <branch>。',
      tags: ['fetch', 'prune', 'branch', 'vv', 'gone', '组合命令', '工作流']
    },
    {
      cmd: 'git stash push -u -m "wip" && git pull --rebase && git stash pop',
      title: '脏工作区安全同步',
      cat: '工作流',
      desc: '在有未提交改动时安全同步远程：先暂存（含未跟踪文件），再拉取 rebase，最后恢复暂存。',
      usage: 'git stash push -u -m "说明" && git pull --rebase && git stash pop',
      example: 'git stash push -u -m "wip: 同步前临时保存"\n# 保存工作区改动，包括未跟踪文件\ngit pull --rebase\n# 拉取远程并变基\ngit stash pop\n# 恢复暂存改动\n\n# 一行组合（任一步失败会停止后续命令）\ngit stash push -u -m "wip" && git pull --rebase && git stash pop',
      pitfalls: '1. 不加 -u 默认不保存未跟踪新文件，可能导致 pull 时冲突或遗漏。\n2. stash pop 冲突时，stash 记录可能不会自动删除；解决冲突后用 git stash list 检查并按需 drop。\n3. 用 && 连接时任一步失败会停止；失败后先检查 git status 和 git stash list 再决定下一步。\n4. 如果只是想同步不恢复，可暂时不 pop，后续用 git stash apply/pop。',
      tags: ['stash', 'pull', 'rebase', '同步', '脏工作区', '组合命令', '工作流']
    },
    {
      cmd: 'git add -p && git commit -m "msg"',
      title: '交互式分块暂存并提交',
      cat: '工作流',
      desc: '通过交互式选择代码块暂存，把一个大改动拆成多个逻辑清晰的提交。',
      usage: 'git add -p [文件] && git commit -m "提交说明"',
      example: 'git add -p\n# 交互式选择要暂存的 hunk（y/n/s/e/q 等）\ngit diff --staged\n# 检查将要提交的内容\ngit commit -m "refactor: 拆分提交"\n# 提交已选改动',
      pitfalls: '1. 容易漏选 hunk；提交前务必用 git diff --staged 检查。\n2. 新文件默认不在 -p 范围内，需先 git add -N <file> 或单独 add。\n3. 二进制文件不支持交互分块。\n4. 交互模式按键：y 暂存，n 跳过，s 拆分，e 手工编辑，q 退出。',
      tags: ['add', 'patch', '交互式', '拆分提交', '组合命令', '工作流']
    },
    {
      cmd: 'git commit --amend -m "msg"',
      title: '修改最近一次提交说明或内容',
      cat: '工作流',
      desc: '将当前暂存区改动合并到最近一次提交，并可同时修改提交说明。适合修正刚刚的提交；会改写提交历史。',
      usage: 'git commit --amend [-m "新说明" | --no-edit]',
      example: 'git add forgotten.txt\ngit commit --amend --no-edit\n# 补漏文件到上次提交，不改提交说明\n\ngit commit --amend -m "fix: 修正提交说明"\n# 只修改最近一次提交说明\n\ngit commit --amend\n# 打开编辑器修改最近一次提交',
      pitfalls: '1. --amend 会改写最近一次提交 ID；已推送到公共分支的提交谨慎 amend，必要时用 --force-with-lease 并与协作者同步。\n2. amend 前确认暂存区内容；否则会把不相关改动也合进上次提交。\n3. 只想改说明用 -m 或编辑器；只想补文件用 --no-edit。',
      tags: ['commit', 'amend', '改写历史', '组合命令', '工作流']
    },
    {
      cmd: 'git add -A && git commit -m "msg" && git push',
      title: '暂存全部、提交并推送（组合命令）',
      cat: '工作流',
      desc: '将当前仓库所有改动暂存、提交并推送到当前跟踪远程分支。适合个人分支的快速同步，执行前必须确认改动范围。',
      usage: 'git add -A && git commit -m "提交说明" && git push',
      example: 'git add -A && git commit -m "feat: 完成页面开发" && git push\n# 暂存所有改动、提交并推送\n\n# 更稳妥的分步写法\ngit status\ngit add -A\ngit diff --staged\ngit commit -m "feat: 完成页面开发"\ngit push',
      pitfalls: '1. 这是高风险快捷组合：-A 会包含新增/修改/删除，push 会直接发布到远程；提交前至少检查 git status。\n2. 任一步失败会中断后续命令；例如无改动时 commit 会失败，push 不会执行。\n3. 首次推送分支应使用 git push -u origin <branch> 或 git push -u origin HEAD 建立跟踪。\n4. 公共分支或协作分支不建议盲目使用一键推送，避免误推临时/调试内容。',
      tags: ['add -A', 'commit', 'push', '组合命令', '一键提交推送', '工作流']
    },
    {
      cmd: 'git commit -am "msg" && git push',
      title: '已跟踪改动快速提交并推送（组合命令）',
      cat: '工作流',
      desc: '将已跟踪文件修改/删除一步提交并推送。适合已跟踪文件的小改动快速同步，不包含新文件。',
      usage: 'git commit -am "提交说明" && git push',
      example: 'git commit -am "fix: 修复样式问题" && git push\n# 已跟踪文件快速提交并推送\n\n# 首次推送当前分支\ngit commit -am "fix: 修复样式问题" && git push -u origin HEAD',
      pitfalls: '1. 只包含已跟踪文件的修改和删除，不包含新文件。\n2. 没有暂存检查步骤，容易误提交；重要改动建议先 git status / git diff。\n3. 如果当前分支没有上游，push 会失败；首次推送用 -u origin HEAD。',
      tags: ['commit -am', 'push', '组合命令', '快速提交', '工作流']
    },
    {
      cmd: 'git push -u origin HEAD',
      title: '推送当前分支并建立上游跟踪',
      cat: '工作流',
      desc: '将当前 HEAD 所在分支推送到 origin，并建立同名上游跟踪关系。适合首次推送新分支时避免手写分支名。',
      usage: 'git push -u origin HEAD',
      example: 'git push -u origin HEAD\n# 推送当前分支到 origin 同名分支，并设置 upstream\n\ngit push -u origin feature/login\n# 显式指定分支名（效果类似）',
      pitfalls: '1. HEAD 必须位于分支上；分离 HEAD 状态不能直接这样推送。\n2. 会在远程创建同名分支（如果不存在）；确认分支名符合团队规范。\n3. 首次推送后，后续可直接使用 git push / git pull。',
      tags: ['push', 'upstream', 'HEAD', '首次推送', '组合命令', '工作流']
    },
    {
      cmd: 'git remote add origin <url> && git push -u origin main',
      title: '关联远程并首次推送（组合命令）',
      cat: '工作流',
      desc: '为本地仓库添加 origin 远程并将 main 分支首次推送到远程，建立跟踪关系。常用于本地 init 后首次发布。',
      usage: 'git remote add origin <url> && git push -u origin <branch>',
      example: 'git remote add origin git@github.com:user/repo.git\ngit branch -M main\ngit push -u origin main\n# 关联远程、确认主分支名、首次推送\n\n# 一行组合（确保远程不存在同名 origin）\ngit remote add origin <url> && git push -u origin main',
      pitfalls: '1. 如果 origin 已存在，git remote add 会失败；可用 git remote set-url origin <url> 修改。\n2. 推送前确认本地分支名是 main 还是 master；必要时用 git branch -M main。\n3. 远程仓库如果已有提交，首次 push 可能被拒绝；需要先 pull/rebase 或按团队流程处理。\n4. SSH/HTTPS 认证需提前配置好，否则 push 会失败。',
      tags: ['remote', 'push', 'origin', '首次发布', '组合命令', '工作流']
    },
    {
      cmd: 'git stash && git pull --rebase && git stash pop',
      title: '暂存未提交改动后同步（组合命令）',
      cat: '工作流',
      desc: '先暂存当前改动，再拉取远程变基，最后恢复暂存。适合工作区不干净但需要同步远程的场景。',
      usage: 'git stash && git pull --rebase && git stash pop',
      example: 'git stash && git pull --rebase && git stash pop\n# 暂存、同步、恢复\n\n# 包含未跟踪文件时\ngit stash push -u -m "wip" && git pull --rebase && git stash pop',
      pitfalls: '1. git stash 默认不包含未跟踪文件；有新文件时用 git stash push -u。\n2. stash pop 冲突后 stash 记录可能残留；解决后检查 git stash list。\n3. 任一步失败会中断后续命令；失败后先看 git status 再处理。',
      tags: ['stash', 'pull', 'rebase', '同步', '组合命令', '工作流']
    },
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
      example: 'git clone https://github.com/user/repo.git\n# 克隆到同名目录\n\ngit clone git@github.com:user/repo.git mydir\n# 克隆到指定目录\n\ngit clone --depth 1 <url>\n# 浅克隆（只取最近提交，速度更快）\n\ngit clone -b dev --single-branch <url>\n# 只克隆指定分支\n\ngit clone --recurse-submodules <url>\n# 克隆并自动初始化/更新子模块',
      pitfalls: '1. 普通 clone 不会自动拉取子模块内容；有子模块时用 --recurse-submodules，或克隆后执行 git submodule update --init --recursive。\n2. --depth 1 浅克隆历史不完整，部分操作（blame 全历史、某些 rebase/tag 场景）受限；需要完整历史时去掉 --depth 或后续 git fetch --unshallow。\n3. 私有仓库注意认证方式（SSH key / HTTPS token）；地址写错或权限不足会报错。\n4. 大仓库克隆慢时可考虑 --filter=blob:none（部分克隆，需 Git 版本支持）。',
      tags: ['克隆', '下载', '复制', 'remote', 'depth', 'branch', 'submodule', 'recurse-submodules']
    },
    {
      cmd: 'git status',
      title: '查看工作区状态',
      cat: '查看',
      desc: '显示工作区和暂存区的当前状态：哪些文件已修改未暂存、哪些已暂存待提交、哪些未被跟踪，以及当前分支信息。',
      usage: 'git status [-s|--short] [-b] [--ignored]',
      example: 'git status\n# 详细状态\n\ngit status -s\n# 简洁输出（?? 未跟踪，M 修改，A 新增，D 删除）\n\ngit status -sb\n# 简洁输出并显示分支信息\n\ngit status --ignored\n# 同时显示被 .gitignore 忽略的文件',
      pitfalls: '1. 被 .gitignore 忽略的文件默认不显示；排查“文件为什么没被跟踪”时用 --ignored 或 git check-ignore -v <file>。\n2. git status 不会显示 stash 内容；查看 stash 用 git stash list。\n3. 提交/推送前养成先 status 的习惯，避免漏文件或误提交。',
      tags: ['状态', '修改', '暂存', '未跟踪', 'staged', 'short', 'ignored']
    },
    {
      cmd: 'git add',
      title: '添加到暂存区',
      cat: '基础',
      desc: '把工作区的改动加入暂存区（index），作为下一次提交的候选内容。可以指定文件，也可以批量添加。',
      usage: 'git add <路径...> [-A|-u|-p|-N]',
      example: 'git add file.txt\n# 暂存指定文件\n\ngit add .\n# 暂存当前目录下改动（新 Git 版本行为更一致）\n\ngit add -A\n# 暂存所有改动（新增、修改、删除）\n\ngit add -A && git commit -m "feat: 一次性暂存并提交"\n# 常用组合：暂存全部改动后提交（含新文件）\n\ngit add -u\n# 只暂存已跟踪文件的修改和删除\n\ngit add -p\n# 交互式分块暂存，便于拆分提交\n\ngit add -N newfile.txt\n# 将新文件标记为“intent-to-add”，便于后续 add -p 纳入',
      pitfalls: '1. git add . / -A / -u 范围不同：-A 含新增+修改+删除；-u 只含已跟踪文件修改+删除，不含新文件。\n2. 暂存前后都用 git status 和 git diff --staged 检查，避免误提交敏感文件或生成文件。\n3. 新文件加入 .gitignore 之前如果已被跟踪，ignore 不会生效；需 git rm --cached <file>。\n4. 交互式 add -p 适合拆分提交，但新文件需先 add -N 或单独 add。',
      tags: ['暂存', 'stage', '添加', '跟踪', 'patch', '-A', '-u', 'intent-to-add']
    },
    {
      cmd: 'git commit',
      title: '提交更改',
      cat: '基础',
      desc: '将暂存区的内容记录为一次新的提交，生成唯一的提交 ID。每次提交应包含清晰的说明信息，便于追踪历史。',
      usage: 'git commit -m "说明" [选项]',
      example: 'git commit -m "修复登录校验问题"\n# 提交暂存区内容\n\ngit commit -am "更新文档"\n# 跳过 git add，直接提交已跟踪文件的修改（不含新文件）\n\ngit commit -a -m "更新文档"\n# 同 -am，-a 与 -m 分开写\n\ngit add -A && git commit -m "新增功能"\n# 暂存所有改动（含新文件）后提交（常用组合）\n\ngit commit --amend\n# 修改最近一次提交（内容或说明），会改写提交 ID\n\ngit commit --amend --no-edit\n# 补充改动到上次提交，不修改提交说明（会改写提交 ID）\n\ngit commit -v\n# 提交时在编辑器中显示 diff 便于确认\n\ngit commit --allow-empty -m "chore: trigger ci"\n# 创建空提交（仅在明确需要时使用）',
      pitfalls: '1. git commit -am / -a -m 不包含未跟踪的新文件；新文件必须先 git add。\n2. 要“包含新文件地全部提交”用 git add -A && git commit -m "..."；只提交已跟踪改动用 git commit -am "..."。\n3. --amend 会改写最近一次提交的 ID；如果该提交已推送到公共分支，amend 后需谨慎 force push，并与协作者同步。\n4. --amend 默认会打开编辑器修改说明；不想改说明用 --no-edit。\n5. 提交前用 git diff --staged 检查将要提交的内容，避免把调试代码、密钥或临时文件提交进去。\n6. 空提交 --allow-empty 只用于触发 CI 等明确场景，避免污染历史。',
      tags: ['提交', '保存', '记录', 'message', 'amend', 'commit -am', 'commit -a -m', 'add -A && commit', 'no-edit', 'allow-empty']
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
      example: 'git diff\n# 工作区 vs 暂存区（未 add 的改动）\n\ngit diff --staged\n# 暂存区 vs 最近一次提交（将要提交的改动）\n\ngit diff main..feature\n# 比较两个分支的差异（两点语法）\n\ngit diff main...feature\n# 比较 feature 相对 main 分叉点以来的改动（三点语法）\n\ngit diff --name-only\n# 只显示改动文件名\n\ngit diff --name-status\n# 只显示文件名和变更类型',
      pitfalls: '1. git diff 默认不显示已暂存改动；提交前要同时关注 git diff 和 git diff --staged。\n2. main..feature 与 main...feature 含义不同：两点比较两端差异，三点比较分叉点以来的改动；PR/rebase 场景常用三点。\n3. 大改动输出很长时可配合 --name-only、--stat 或指定路径。\n4. 换行符配置不当会出现大量“假 diff”；检查 core.autocrlf 和 .gitattributes。',
      tags: ['差异', '对比', '改动', 'staged', 'compare', 'name-only', '三点语法']
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
      example: 'git branch\n# 列出本地分支（* 表示当前）\n\ngit branch feature/login\n# 创建新分支（不切换）\n\ngit branch -a\n# 查看本地和远程所有分支\n\ngit branch -vv\n# 查看本地分支及其跟踪关系\n\ngit branch --merged\n# 查看已合并到当前分支的分支\n\ngit branch --no-merged\n# 查看尚未合并到当前分支的分支\n\ngit branch -m old-name new-name\n# 重命名分支\n\ngit branch -d feature/login\n# 删除已合并分支（-D 强制删除）',
      pitfalls: '1. -d 只能删除已合并分支；-D 强制删除未合并分支，可能丢失未合并提交，删除前确认。\n2. 删除远程分支用 git push origin --delete <branch>，git branch -d 只删本地。\n3. 重命名已推送分支需同时处理远程：推送新分支名并删除旧远程分支，协作者也需更新本地跟踪。\n4. 分支名大小写在 Windows/macOS 默认文件系统上可能不敏感，跨平台协作注意命名一致。',
      tags: ['分支', '列表', '创建', '删除', '重命名', 'branch', 'merged', 'vv']
    },
    {
      cmd: 'git checkout',
      title: '切换分支或恢复文件（传统）',
      cat: '分支',
      desc: '传统命令，可用于切换分支、创建并切换分支，或将文件恢复到指定版本。新版本 Git 推荐用 switch 管分支、restore 管文件。',
      usage: 'git checkout <分支|提交> [-- 文件]',
      example: 'git checkout main\n# 切换到 main 分支\n\ngit checkout -b feature/pay\n# 创建并切换到新分支\n\ngit checkout -t origin/feature/pay\n# 基于远程分支创建本地跟踪分支\n\ngit checkout -- file.txt\n# 丢弃工作区中该文件的未暂存改动（谨慎）',
      pitfalls: '1. checkout 同时承担“切分支”和“恢复文件”两种语义，容易误操作；新 Git 推荐 git switch / git restore。\n2. git checkout -- <file> 会丢弃工作区未暂存改动，不可恢复；执行前确认。\n3. checkout 到提交会进入分离 HEAD；需要保留提交时创建新分支。\n4. 路径和分支同名时可能有歧义，建议用 -- 明确区分文件路径。',
      tags: ['切换', '分支', '恢复', 'checkout', 'switch', '传统']
    },
    {
      cmd: 'git switch',
      title: '切换分支（推荐）',
      cat: '分支',
      desc: '专门用于切换分支的命令，语义比 checkout 更明确。支持创建新分支并切换。',
      usage: 'git switch <分支名> [-c 新分支]',
      example: 'git switch main\n# 切换到已有分支\n\ngit switch -c feature/search\n# 创建并切换到新分支\n\ngit switch -\n# 切回上一个分支\n\ngit switch --detach abc1234\n# 切换到指定提交（分离 HEAD）',
      pitfalls: '1. 切换分支前确保工作区改动已 commit 或 stash，否则可能被阻止切换或把改动带到目标分支。\n2. 分离 HEAD 状态下的提交不属于任何分支，切走后可能丢失引用；需要保留时创建分支 git switch -c <name>。\n3. git switch 只管分支；恢复文件请用 git restore，避免旧 checkout 语义混淆。',
      tags: ['切换', '分支', '创建', 'switch', 'detach']
    },
    {
      cmd: 'git restore',
      title: '恢复文件（推荐）',
      cat: '撤销',
      desc: '专门用于恢复工作区或暂存区文件。可撤销未暂存改动，或把文件从暂存区移出而保留工作区修改。',
      usage: 'git restore [--staged|--worktree|--source=<提交>] <文件>',
      example: 'git restore file.txt\n# 丢弃工作区对该文件的修改（谨慎）\n\ngit restore --staged file.txt\n# 取消暂存，保留工作区修改\n\ngit restore -SW file.txt\n# 同时恢复暂存区和工作区（谨慎）\n\ngit restore --source=HEAD~1 file.txt\n# 从指定提交恢复文件内容\n\ngit restore .\n# 丢弃当前目录所有未暂存改动（谨慎）',
      pitfalls: '1. git restore <file> 会丢弃工作区未暂存改动，通常不可恢复；执行前先 git diff 确认。\n2. --staged 只影响暂存区，不会丢弃工作区修改；不要与不带 --staged 的恢复混淆。\n3. -SW/--staged --worktree 会同时清除暂存和工作区改动，风险更高。\n4. 恢复前可用 git stash 或复制文件做临时备份。',
      tags: ['恢复', '撤销', 'unstage', '丢弃', 'restore', 'staged']
    },
    {
      cmd: 'git merge',
      title: '合并分支',
      cat: '合并',
      desc: '将指定分支的历史合并到当前分支。若无分叉可快进；有分叉时会产生合并提交，冲突需手动解决后提交。',
      usage: 'git merge <分支名> [选项]',
      example: 'git switch main\ngit merge feature/login\n# 将 feature/login 合并到当前 main\n\ngit merge --no-ff feature/login\n# 禁用快进，始终生成合并提交\n\ngit merge --squash feature/login\n# 将分支改动压缩为一次待提交改动\n\ngit merge --abort\n# 合并冲突时放弃本次合并',
      pitfalls: '1. 合并冲突后需手动解决文件，git add 标记已解决，再 git commit（或 git merge --continue）完成合并。\n2. --squash 会把改动合并为工作区改动，不会自动创建 merge commit，也不保留原分支提交历史。\n3. fast-forward 合并不会生成合并提交；团队若要保留分支历史可用 --no-ff。\n4. 合并前确认当前分支正确，并建议先 git status 保证工作区干净。',
      tags: ['合并', 'merge', '整合', '快进', '冲突', 'squash', 'no-ff']
    },
    {
      cmd: 'git rebase',
      title: '变基',
      cat: '合并',
      desc: '把当前分支的提交“搬移”到另一个基底之上，使历史更线性。交互式变基可整理提交。不要对已推送到共享远程的公共分支随意 rebase。',
      usage: 'git rebase <基底分支> [-i] [--onto] [--abort|--continue]',
      example: 'git rebase main\n# 将当前分支变基到 main 最新提交之上\n\ngit rebase -i HEAD~3\n# 交互式整理最近 3 次提交\n\ngit rebase --onto main server client\n# 将 client 上相对 server 的提交搬到 main 上\n\ngit rebase --continue\n# 解决冲突后继续\n\ngit rebase --abort\n# 放弃本次变基\n\ngit rebase --skip\n# 跳过当前冲突提交（谨慎）',
      pitfalls: '1. rebase 会改写提交历史，提交 ID 会变化；不要对已推送到公共/共享分支随意 rebase。\n2. 冲突可能在多个提交上逐个出现；每次解决后 git add，再 git rebase --continue。\n3. --skip 会丢弃当前正在应用的提交，确认该提交不需要再使用。\n4. 交互式 rebase 可以 squash/reword/drop，但会重写历史；已推送分支需谨慎处理。\n5. rebase 前可先建备份分支：git branch backup/my-branch。',
      tags: ['变基', '整理历史', '线性', 'interactive', 'rebase', 'onto']
    },
    {
      cmd: 'git cherry-pick',
      title: '拣选提交',
      cat: '合并',
      desc: '把某个或某些已有提交的改动应用到当前分支，生成新的提交。适合只引入特定修复而不合并整个分支。',
      usage: 'git cherry-pick <提交ID...> [选项]',
      example: 'git cherry-pick abc1234\n# 将指定提交应用到当前分支\n\ngit cherry-pick A B C\n# 按顺序应用多个提交\n\ngit cherry-pick A^..B\n# 拣选一个范围内的提交（注意左开右闭）\n\ngit cherry-pick -n abc1234\n# 只应用改动不自动提交\n\ngit cherry-pick --continue\n# 解决冲突后继续\n\ngit cherry-pick --abort\n# 放弃本次拣选',
      pitfalls: '1. cherry-pick 会生成新的提交 ID，即使内容相同；后续 merge 原分支时可能出现重复或冲突。\n2. 冲突后解决并 git add，再 git cherry-pick --continue；放弃用 --abort。\n3. 拣选多个提交时按顺序应用；范围语法 A^..B 容易写错，先用 git log --oneline A^..B 确认。\n4. 拣选 merge commit 需额外指定 -m 主线，行为较复杂，谨慎使用。',
      tags: ['拣选', '挑选', '提交', '应用', 'cherry', '范围']
    },
    {
      cmd: 'git pull',
      title: '拉取并整合远程更新',
      cat: '远程',
      desc: '从远程仓库获取更新并整合到当前分支，默认等价于 git fetch + git merge。用于同步远程最新代码。',
      usage: 'git pull [远程名] [分支名] [选项]',
      example: 'git pull\n# 拉取当前跟踪分支并合并\n\ngit pull origin main\n# 从 origin 的 main 拉取\n\ngit pull --rebase\n# 拉取后用 rebase 代替 merge，保持线性历史\n\ngit pull --rebase origin main\n# 明确指定远程和分支进行 rebase 拉取\n\ngit pull --ff-only\n# 仅在可快进时合并，避免意外合并提交',
      pitfalls: '1. 默认 pull = fetch + merge，可能产生额外合并提交；想保持线性历史用 --rebase。\n2. 本地有未提交改动时 pull 可能失败或产生复杂冲突；先 commit/stash，或使用 --rebase --autostash。\n3. pull --rebase 冲突按提交逐个处理：解决后 git add，再 git rebase --continue；放弃用 --abort。\n4. 当前分支未设置上游时 git pull 会报错；首次推送用 git push -u origin <branch>。',
      tags: ['拉取', '更新', '同步', 'fetch', 'merge', 'rebase', 'ff-only']
    },
    {
      cmd: 'git fetch',
      title: '获取远程更新（不合并）',
      cat: '远程',
      desc: '从远程下载最新的提交和引用信息，但不修改本地工作分支。适合先查看远程变化再决定如何整合。',
      usage: 'git fetch [远程名] [--all] [-p] [--tags]',
      example: 'git fetch origin\n# 获取 origin 的更新\n\ngit fetch --all\n# 获取所有远程的更新\n\ngit fetch -p\n# 同时清理已在远程删除的分支引用（prune）\n\ngit fetch --all -p\n# 获取所有远程并清理失效引用\n\ngit fetch --tags\n# 获取标签\n\ngit log HEAD..origin/main\n# fetch 后比较本地与远程差异',
      pitfalls: '1. fetch 只下载数据，不会修改当前工作分支；需要合并/变基时再执行 merge/rebase。\n2. -p/--prune 只清理本地的远程跟踪引用，不会删除本地分支。\n3. fetch 后可用 git status -sb 或 git log HEAD..origin/main 查看落后情况。\n4. 网络或权限问题会导致 fetch 失败；检查 git remote -v 和认证配置。',
      tags: ['获取', '下载', '远程', '同步', 'prune', 'fetch -p']
    },
    {
      cmd: 'git push',
      title: '推送到远程仓库',
      cat: '远程',
      desc: '将本地提交上传到远程仓库。首次推送新分支通常需要设置上游跟踪；推送会更新远程分支指针。',
      usage: 'git push [远程名] [分支名] [选项]',
      example: 'git push\n# 推送当前分支到已跟踪的远程分支\n\ngit push -u origin feature/login\n# 首次推送并建立跟踪关系\n\ngit push origin --tags\n# 推送本地标签\n\ngit push origin --delete feature/old\n# 删除远程分支\n\ngit push --force-with-lease\n# 更安全的强推（慎用，避免覆盖他人提交）',
      pitfalls: '1. 首次推送新分支记得 -u（或 --set-upstream），否则后续 git push/pull 可能提示无上游。\n2. push 被拒绝（non-fast-forward）时，先 fetch/pull 看远程变化，不要盲目强推。\n3. --force 会覆盖远程历史，风险很高；优先使用 --force-with-lease，但仍需确认无人基于旧提交工作。\n4. --force-with-lease 也不是绝对安全：如果本地远程跟踪引用过期，保护效果会降低；推送前先 fetch。\n5. 删除远程分支用 git push origin --delete <branch>；确认分支已合并或不再需要。',
      tags: ['推送', '上传', '发布', 'remote', 'upstream', 'delete', 'force-with-lease']
    },
    {
      cmd: 'git remote',
      title: '管理远程仓库',
      cat: '远程',
      desc: '查看、添加、修改、重命名或删除远程仓库配置。origin 通常是默认远程名。',
      usage: 'git remote [子命令] [选项]',
      example: 'git remote -v\n# 查看远程名称和地址\n\ngit remote add origin <url>\n# 添加远程仓库\n\ngit remote set-url origin <new-url>\n# 修改远程地址\n\ngit remote rename origin upstream\n# 重命名远程\n\ngit remote show origin\n# 查看远程详细信息\n\ngit remote prune origin\n# 清理本地已失效的 origin 远程跟踪分支\n\ngit remote remove origin\n# 删除远程配置',
      pitfalls: '1. git remote remove 只删除本地远程配置，不会删除远程仓库本身。\n2. set-url 后用 git remote -v 验证；HTTPS/SSH 地址切换时注意认证方式。\n3. remote prune origin 与 git fetch -p 类似，都是清理失效远程跟踪引用，不删除本地分支。\n4. 多远程协作（origin/upstream）时注意 pull/push 目标，避免推错仓库。',
      tags: ['远程', 'origin', '地址', '仓库', 'show', 'prune']
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
      pitfalls: '1. --hard 会丢弃工作区和暂存区未提交改动，通常不可恢复；执行前先 git status / git stash。\n2. reset 会移动分支指针；对已推送公共分支 reset 后再 push 通常需要强推，非常危险。\n3. 误 reset --hard 后，先用 git reflog 查找之前的 HEAD，再 git reset --hard HEAD@{n} 尝试找回（仅限本地 reflog 未过期）。\n4. 取消暂存文件优先使用更语义化的 git restore --staged <file>（新 Git）。',
      tags: ['回退', '撤销', '重置', 'soft', 'hard', 'HEAD', 'reflog']
    },
    {
      cmd: 'git revert',
      title: '反做提交（安全撤销）',
      cat: '撤销',
      desc: '创建一个新的提交来抵消指定提交的改动，不改写历史。适合撤销已经推送到公共分支的提交。',
      usage: 'git revert <提交ID...> [选项]',
      example: 'git revert abc1234\n# 生成反向提交撤销指定改动\n\ngit revert HEAD\n# 撤销最近一次提交\n\ngit revert -n abc1234\n# 只应用反向改动，不自动提交\n\ngit revert -m 1 <merge-commit>\n# 回滚合并提交（需指定主线）\n\ngit revert --abort\n# 放弃本次回滚',
      pitfalls: '1. revert 不改写历史，适合公共分支；但它会新增一个“反向提交”，历史中原提交仍存在。\n2. 回滚 merge commit 必须指定 -m 主线（通常 1 代表保留的主线）；选错会导致结果不符合预期。\n3. revert merge commit 后，再次合并同一分支时 Git 可能认为改动已合并，需要额外处理（如 revert 那个 revert）。\n4. 有冲突时解决后 git add 并 git revert --continue；放弃用 --abort。',
      tags: ['撤销', '回滚', '反做', '安全', '公共分支', 'merge commit']
    },
    {
      cmd: 'git clean',
      title: '清理未跟踪文件',
      cat: '撤销',
      desc: '删除工作区中未被 Git 跟踪的文件或目录。常用于清理构建产物或临时文件。建议先用 -n 预览。',
      usage: 'git clean -fd [-n] [-x|-X]',
      example: 'git clean -nfd\n# 预览将要删除的未跟踪文件/目录（不实际删除）\n\ngit clean -fd\n# 删除未跟踪文件和目录\n\ngit clean -fdx\n# 连同 .gitignore 忽略的文件也删除（非常谨慎）\n\ngit clean -fdX\n# 只删除被 .gitignore 忽略的文件',
      pitfalls: '1. clean 删除的是未跟踪文件，通常不可恢复；执行前务必先用 -n/--dry-run 预览。\n2. -x 会删除 .gitignore 忽略的文件（如本地构建产物、依赖、配置），风险很高。\n3. 需要保留某些未跟踪文件时，先移动或 add -N/commit；不要依赖事后恢复。\n4. clean 不会影响已跟踪文件的修改；丢弃已跟踪修改用 restore/reset。',
      tags: ['清理', '未跟踪', '删除', '临时文件', 'dry-run']
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
      pitfalls: '1. 默认 stash 不包含未跟踪文件；需要包含新文件用 -u/--include-untracked，包含忽略文件用 -a/--all（谨慎）。\n2. git stash pop 冲突时，stash 记录可能不会自动删除；解决冲突后检查 git stash list，必要时手动 drop。\n3. apply 保留 stash 记录，pop 会移除记录；不确定能否顺利恢复时先用 apply。\n4. stash 不是长期备份；重要改动还是尽快 commit 或建分支。',
      tags: ['暂存', '搁置', '临时', 'stash', 'pop', 'apply', '-u']
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
      example: 'git config --global user.name "Your Name"\n# 设置全局用户名\n\ngit config --global user.email "you@example.com"\n# 设置全局邮箱\n\ngit config --global init.defaultBranch main\n# 设置新仓库默认分支名\n\ngit config --global pull.rebase true\n# 设置 pull 默认使用 rebase（团队需共识）\n\ngit config --list --show-origin\n# 查看所有生效配置及来源\n\ngit config --global core.editor vim\n# 设置默认编辑器\n\ngit config --global core.autocrlf input\n# macOS/Linux 常用换行符设置\n\ngit config --global core.autocrlf true\n# Windows 常用换行符设置（按团队规范选择）\n\ngit config --global alias.st status\n# 设置命令别名',
      pitfalls: '1. --global/--local/--system 作用域不同；排查配置问题用 git config --list --show-origin 查看实际生效值和来源。\n2. core.autocrlf 配置不当会造成跨平台“假 diff”；团队项目优先用 .gitattributes 统一规范。\n3. pull.rebase true 会改变 git pull 默认行为；团队未达成共识时不要全局强开。\n4. 修改 user.name/user.email 只影响后续提交，不会自动改写历史提交作者信息。',
      tags: ['配置', '用户名', '邮箱', '设置', 'alias', 'config', 'autocrlf', 'defaultBranch', 'pull.rebase']
    },
    {
      cmd: 'git blame',
      title: '逐行追溯修改来源',
      cat: '排查',
      desc: '显示文件每一行最后一次被哪个提交修改、由谁在何时改动。排查问题、了解代码历史时很有用。',
      usage: 'git blame <文件> [-L 开始,结束] [-w]',
      example: 'git blame src/app.js\n# 查看整个文件每行的最后修改者\n\ngit blame -L 10,30 src/app.js\n# 只查看第 10 到 30 行\n\ngit blame -w src/app.js\n# 忽略空白改动\n\ngit blame -M -C src/app.js\n# 尝试识别文件内移动和跨文件拷贝来源',
      pitfalls: '1. blame 显示的是“最后修改该行的提交”，不一定是功能最初引入者；格式化/重命名提交可能掩盖真实来源。\n2. 大量格式化改动后可用 -w 忽略空白，或结合 -M -C 追踪移动/拷贝。\n3. 二分定位问题优先考虑 git bisect；blame 更适合定位某行最近变更。',
      tags: ['追溯', '作者', '修改', '排查', 'annotate', '移动拷贝']
    },
    {
      cmd: 'git reflog',
      title: '查看引用变更日志',
      cat: '排查',
      desc: '记录本地 HEAD 和分支引用的移动历史（如提交、reset、checkout、rebase）。误操作后常可通过 reflog 找回提交。',
      usage: 'git reflog [show] [-n]',
      example: 'git reflog\n# 查看最近的引用变动\n\ngit reflog -10\n# 最近 10 条\n\ngit reset --hard HEAD@{2}\n# 根据 reflog 恢复到之前的位置\n\ngit branch rescue HEAD@{2}\n# 为找回的提交创建救援分支（更安全）',
      pitfalls: '1. reflog 只存在于本地仓库，不会推送到远程；换机器或重新 clone 后不可用。\n2. reflog 条目会过期（受 gc 配置影响）；误操作后尽快查找并用分支/标签保护目标提交。\n3. 找回提交时优先创建 rescue 分支，再检查内容，避免再次误 reset。\n4. reflog 记录引用移动，不是所有文件内容快照；未提交且未 stash 的改动可能无法找回。',
      tags: ['恢复', '找回', '历史', 'reset', 'HEAD', 'reflog']
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
      example: 'git submodule add <url> path/to/submodule\n# 添加子模块\n\ngit submodule update --init --recursive\n# 初始化并更新子模块（克隆后常用）\n\ngit submodule status\n# 查看子模块状态\n\ngit submodule sync --recursive\n# 同步子模块远程地址配置\n\ngit clone --recurse-submodules <url>\n# 克隆仓库时一并拉取子模块',
      pitfalls: '1. 普通 git clone 不会自动拉取子模块内容；克隆后需要 git submodule update --init --recursive。\n2. 子模块固定在特定提交，不会自动跟随上游最新提交；需要更新时进入子模块或使用子模块更新命令并提交父仓库引用。\n3. 修改子模块后要在父仓库提交子模块指针变化，否则其他人拉取不到你的子模块版本。\n4. 删除子模块不只是 rm 目录；建议按 deinit + git rm + 清理 .git/modules 的流程操作。',
      tags: ['子模块', '依赖', '嵌套仓库', 'submodule', 'recurse-submodules']
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
      (item.usage || '') + ' ' + (item.example || '') + ' ' + (item.pitfalls || '') + ' ' + (item.tags || []).join(' ')
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
      if (item.pitfalls) {
        detail.appendChild(sectionBlock('常见坑 / 注意', item.pitfalls));
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