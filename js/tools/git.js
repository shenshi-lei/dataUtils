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
      title: '列出本地分支',
      cat: '分支',
      desc: '列出本地分支，当前分支前带 *。不带参数时只显示本地分支。',
      usage: 'git branch [--list]',
      example: 'git branch\n# 列出本地分支\n\ngit branch --list "feature/*"\n# 按模式过滤分支',
      pitfalls: '1. 只显示本地分支；要看远程分支用 git branch -r，全部用 git branch -a。\n2. 当前分支不能直接删除；需先切换到其他分支。',
      tags: ['分支', '列表', 'branch', 'local']
    },
    {
      cmd: 'git branch -a',
      title: '查看所有分支（本地+远程）',
      cat: '分支',
      desc: '列出本地分支和远程跟踪分支，便于查看整体分支情况。',
      usage: 'git branch -a',
      example: 'git branch -a\n# 查看本地和远程所有分支\n\ngit branch -r\n# 只查看远程跟踪分支',
      pitfalls: '1. 远程跟踪分支是本地缓存，可能过期；先 git fetch -p 再查看更准确。\n2. 看到的 remotes/origin/* 不是真正可直接编辑的本地分支，切换时通常用 git switch <name> 或创建跟踪分支。',
      tags: ['分支', '全部', '远程', 'branch', '-a', '-r']
    },
    {
      cmd: 'git branch -vv',
      title: '查看分支跟踪关系',
      cat: '分支',
      desc: '显示本地分支、最近提交、上游跟踪分支及 ahead/behind 状态，适合排查推送/拉取状态。',
      usage: 'git branch -vv',
      example: 'git branch -vv\n# 查看本地分支及上游跟踪关系\n\ngit fetch -p && git branch -vv\n# 先同步远程状态再查看',
      pitfalls: '1. ahead/behind 信息基于本地已知的远程跟踪状态；不 fetch 可能不准确。\n2. 上游显示 gone 表示远程分支已删除，确认后可清理本地分支。',
      tags: ['分支', '跟踪', 'upstream', 'ahead', 'behind', 'branch', '-vv']
    },
    {
      cmd: 'git branch <name>',
      title: '创建新分支（不切换）',
      cat: '分支',
      desc: '基于当前提交创建新分支，但不会切换过去。需要创建并切换时用 git switch -c。',
      usage: 'git branch <分支名> [起点]',
      example: 'git branch feature/login\n# 基于当前提交创建分支\n\ngit branch feature/login main\n# 基于 main 创建分支',
      pitfalls: '1. 只创建不切换；创建后当前分支不变。\n2. 分支名应符合团队规范，避免空格、特殊字符和大小写混乱。\n3. 需要立即开始开发通常用 git switch -c <name> 更方便。',
      tags: ['分支', '创建', 'branch']
    },
    {
      cmd: 'git branch -d',
      title: '删除已合并本地分支',
      cat: '分支',
      desc: '删除已合并到当前分支（或上游）的本地分支。安全性较高，未合并分支会拒绝删除。',
      usage: 'git branch -d <分支名>',
      example: 'git branch -d feature/login\n# 删除已合并的本地分支\n\ngit branch --merged\n# 先查看可安全清理的分支',
      pitfalls: '1. 只能删除已合并分支；未合并分支会报错。\n2. 只删除本地分支，不删除远程分支。\n3. 当前所在分支不能删除；先切换到其他分支。',
      tags: ['分支', '删除', '已合并', 'branch', '-d']
    },
    {
      cmd: 'git branch -D',
      title: '强制删除本地分支',
      cat: '分支',
      desc: '强制删除本地分支，即使它未合并。用于丢弃不再需要的分支，但要确认不会丢失重要提交。',
      usage: 'git branch -D <分支名>',
      example: 'git branch -D experiment/tmp\n# 强制删除未合并分支（谨慎）',
      pitfalls: '1. -D 会删除未合并分支，可能丢失未合并提交；删除前确认提交是否已备份或不再需要。\n2. 误删后可尝试通过 git reflog 找回提交哈希并重建分支，但不保证一定可找回。\n3. 只删本地，不删远程。',
      tags: ['分支', '强制删除', '未合并', 'branch', '-D', '谨慎']
    },
    {
      cmd: 'git branch -m',
      title: '重命名分支',
      cat: '分支',
      desc: '重命名本地分支。可重命名当前分支或指定分支。',
      usage: 'git branch -m [旧分支名] <新分支名>',
      example: 'git branch -m old-name new-name\n# 重命名指定分支\n\ngit branch -m new-name\n# 重命名当前分支',
      pitfalls: '1. 重命名已推送分支后，还需推送新分支并删除旧远程分支：git push origin -u new-name && git push origin --delete old-name。\n2. 协作者本地需要更新跟踪关系，否则可能继续使用旧分支名。\n3. 大小写修改在 Windows/macOS 上可能受文件系统大小写不敏感影响，必要时分两步改名。',
      tags: ['分支', '重命名', 'rename', 'branch', '-m']
    },
    {
      cmd: 'git branch --merged',
      title: '查看已合并分支',
      cat: '分支',
      desc: '列出相对当前分支（或指定提交）已经合并的分支，常用于清理已完成分支。',
      usage: 'git branch --merged [提交]',
      example: 'git branch --merged\n# 查看已合并到当前分支的分支\n\ngit branch --merged main\n# 查看相对 main 已合并的分支',
      pitfalls: '1. 判断基准是当前分支或指定提交；在不同分支执行结果不同。\n2. squash merge 后，原分支提交可能不被识别为 merged，清理前人工确认。\n3. 删除前仍要确认远程/CI/发布状态。',
      tags: ['分支', 'merged', '已合并', '清理', 'branch']
    },
    {
      cmd: 'git branch --no-merged',
      title: '查看未合并分支',
      cat: '分支',
      desc: '列出相对当前分支（或指定提交）尚未合并的分支，便于确认哪些工作还未合入。',
      usage: 'git branch --no-merged [提交]',
      example: 'git branch --no-merged\n# 查看未合并到当前分支的分支\n\ngit branch --no-merged main\n# 查看相对 main 未合并的分支',
      pitfalls: '1. 未合并不代表无用，可能是未完成或待发布分支；删除前确认。\n2. squash merge 场景下可能出现“实际已合并但仍显示未合并”的误判，需要人工核对。\n3. 判断基准不同结果不同，必要时显式指定 main/master。',
      tags: ['分支', 'no-merged', '未合并', '清理', 'branch']
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
      example: 'git switch main\ngit merge feature/login\n# 将 feature/login 合并到当前 main\n\ngit merge --no-ff feature/login\n# 禁用快进，始终生成合并提交\n\ngit merge --squash feature/login\n# 将分支改动压缩为一次待提交改动',
      pitfalls: '1. 合并冲突后需手动解决文件，git add 标记已解决，再 git commit（或 git merge --continue）完成合并。\n2. --squash 会把改动合并为工作区改动，不会自动创建 merge commit，也不保留原分支提交历史。\n3. fast-forward 合并不会生成合并提交；团队若要保留分支历史可用 --no-ff。\n4. 合并前确认当前分支正确，并建议先 git status 保证工作区干净。',
      tags: ['合并', 'merge', '整合', '快进', '冲突', 'squash', 'no-ff']
    },
    {
      cmd: 'git merge --abort',
      title: '放弃合并',
      cat: '合并',
      desc: '在合并冲突或合并过程中放弃本次合并，尝试恢复到合并前状态。',
      usage: 'git merge --abort',
      example: 'git merge --abort\n# 放弃当前合并，回到合并前状态',
      pitfalls: '1. 仅在合并进行中可用；没有进行中的合并会报错。\n2. 放弃前确认是否需要保留已手动解决的冲突结果。\n3. 如果工作区还有其他未提交改动，恢复效果需结合实际状态确认。',
      tags: ['merge', 'abort', '放弃合并', '冲突']
    },
    {
      cmd: 'git merge --continue',
      title: '继续合并',
      cat: '合并',
      desc: '合并冲突解决并 git add 后，继续完成合并流程。',
      usage: 'git merge --continue',
      example: 'git add conflict-file.txt\ngit merge --continue\n# 解决冲突后继续合并',
      pitfalls: '1. 继续前必须先解决冲突并 git add 标记已解决。\n2. 也可以用 git commit 完成合并提交；--continue 是更明确的写法。\n3. 若仍有未解决冲突，Git 会阻止继续。',
      tags: ['merge', 'continue', '继续合并', '冲突']
    },
    {
      cmd: 'git rebase',
      title: '变基',
      cat: '合并',
      desc: '把当前分支的提交“搬移”到另一个基底之上，使历史更线性。交互式变基可整理提交。不要对已推送到共享远程的公共分支随意 rebase。',
      usage: 'git rebase <基底分支> [-i] [--onto]',
      example: 'git rebase main\n# 将当前分支变基到 main 最新提交之上\n\ngit rebase -i HEAD~3\n# 交互式整理最近 3 次提交\n\ngit rebase --onto main server client\n# 将 client 上相对 server 的提交搬到 main 上',
      pitfalls: '1. rebase 会改写提交历史，提交 ID 会变化；不要对已推送到公共/共享分支随意 rebase。\n2. 冲突可能在多个提交上逐个出现；每次解决后 git add，再 git rebase --continue。\n3. 交互式 rebase 可以 squash/reword/drop，但会重写历史；已推送分支需谨慎处理。\n4. rebase 前可先建备份分支：git branch backup/my-branch。',
      tags: ['变基', '整理历史', '线性', 'interactive', 'rebase', 'onto']
    },
    {
      cmd: 'git rebase --continue',
      title: '继续变基',
      cat: '合并',
      desc: '变基过程中冲突解决并 git add 后，继续应用剩余提交。',
      usage: 'git rebase --continue',
      example: 'git add conflict-file.txt\ngit rebase --continue\n# 解决冲突后继续 rebase',
      pitfalls: '1. 继续前必须解决冲突并 git add；否则 Git 会拒绝继续。\n2. rebase 冲突可能在多个提交上反复出现，需耐心逐个处理。\n3. 如果发现当前提交不应保留，考虑 --skip（谨慎）。',
      tags: ['rebase', 'continue', '继续变基', '冲突']
    },
    {
      cmd: 'git rebase --abort',
      title: '放弃变基',
      cat: '合并',
      desc: '放弃当前 rebase 过程，尝试恢复到 rebase 开始前的状态。',
      usage: 'git rebase --abort',
      example: 'git rebase --abort\n# 放弃本次 rebase',
      pitfalls: '1. 仅在 rebase 进行中可用。\n2. 放弃前确认是否需要保留已解决的冲突结果。\n3. rebase 复杂冲突处理不下去时，abort 是安全退出方式。',
      tags: ['rebase', 'abort', '放弃变基', '回退']
    },
    {
      cmd: 'git rebase --skip',
      title: '跳过当前变基提交',
      cat: '合并',
      desc: '在 rebase 过程中跳过当前正在应用的提交。该提交的改动将不会出现在 rebase 后的历史中。',
      usage: 'git rebase --skip',
      example: 'git rebase --skip\n# 跳过当前冲突提交（谨慎）',
      pitfalls: '1. --skip 会丢弃当前提交引入的改动，使用前确认该提交确实不需要。\n2. 误 skip 后可通过 reflog 找回原提交，但操作成本高。\n3. 如果只是冲突难解，通常先尝试正确解决冲突而不是 skip。',
      tags: ['rebase', 'skip', '跳过提交', '谨慎']
    },
    {
      cmd: 'git cherry-pick',
      title: '拣选提交',
      cat: '合并',
      desc: '把某个或某些已有提交的改动应用到当前分支，生成新的提交。适合只引入特定修复而不合并整个分支。',
      usage: 'git cherry-pick <提交ID...> [选项]',
      example: 'git cherry-pick abc1234\n# 将指定提交应用到当前分支\n\ngit cherry-pick A B C\n# 按顺序应用多个提交\n\ngit cherry-pick A^..B\n# 拣选一个范围内的提交（注意左开右闭）\n\ngit cherry-pick -n abc1234\n# 只应用改动不自动提交',
      pitfalls: '1. cherry-pick 会生成新的提交 ID，即使内容相同；后续 merge 原分支时可能出现重复或冲突。\n2. 冲突后解决并 git add，再 git cherry-pick --continue；放弃用 --abort。\n3. 拣选多个提交时按顺序应用；范围语法 A^..B 容易写错，先用 git log --oneline A^..B 确认。\n4. 拣选 merge commit 需额外指定 -m 主线，行为较复杂，谨慎使用。',
      tags: ['拣选', '挑选', '提交', '应用', 'cherry', '范围']
    },
    {
      cmd: 'git cherry-pick --continue',
      title: '继续拣选提交',
      cat: '合并',
      desc: 'cherry-pick 冲突解决并 git add 后，继续应用剩余提交。',
      usage: 'git cherry-pick --continue',
      example: 'git add conflict-file.txt\ngit cherry-pick --continue\n# 解决冲突后继续 cherry-pick',
      pitfalls: '1. 继续前必须先解决冲突并 git add。\n2. 多提交 cherry-pick 时，可能会多次遇到冲突。\n3. 如果当前冲突提交不想要，可考虑 --skip（谨慎）。',
      tags: ['cherry-pick', 'continue', '继续', '冲突']
    },
    {
      cmd: 'git cherry-pick --abort',
      title: '放弃拣选提交',
      cat: '合并',
      desc: '放弃当前 cherry-pick 过程，尝试恢复到操作前状态。',
      usage: 'git cherry-pick --abort',
      example: 'git cherry-pick --abort\n# 放弃本次 cherry-pick',
      pitfalls: '1. 仅在 cherry-pick 进行中可用。\n2. 放弃前确认是否需要保留已手动解决的冲突结果。\n3. 复杂冲突无法快速解决时，abort 是安全退出方式。',
      tags: ['cherry-pick', 'abort', '放弃', '冲突']
    },
    {
      cmd: 'git cherry-pick --skip',
      title: '跳过当前拣选提交',
      cat: '合并',
      desc: '在 cherry-pick 多个提交时跳过当前冲突提交，继续处理后续提交。',
      usage: 'git cherry-pick --skip',
      example: 'git cherry-pick --skip\n# 跳过当前冲突提交（谨慎）',
      pitfalls: '1. 会跳过当前提交，意味着该提交改动不会被应用。\n2. 跳过前确认该提交确实不需要，或后续会单独处理。\n3. 误 skip 后可通过 reflog/原提交哈希重新 cherry-pick。',
      tags: ['cherry-pick', 'skip', '跳过', '谨慎']
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
      cmd: 'git pull --rebase',
      title: '拉取并变基（远程类单列）',
      cat: '远程',
      desc: '拉取远程更新后将本地提交变基到远程分支之上，保持线性历史。与工作流中的组合命令对应，这里作为远程单命令单列。',
      usage: 'git pull --rebase [远程名] [分支名]',
      example: 'git pull --rebase\n# 拉取当前跟踪分支并 rebase\n\ngit pull --rebase origin main\n# 指定远程和分支\n\ngit pull --rebase --autostash\n# 自动暂存并恢复本地未提交改动',
      pitfalls: '1. 会改写本地未推送提交的基底；不要对公共分支随意 rebase。\n2. 冲突可能按提交逐个出现：解决后 git add + git rebase --continue。\n3. 工作区不干净时先 stash/commit，或使用 --autostash。',
      tags: ['pull', 'rebase', '同步', '线性历史', '远程']
    },
    {
      cmd: 'git pull --ff-only',
      title: '仅快进拉取',
      cat: '远程',
      desc: '只允许 fast-forward 合并的 pull。如果远程和本地有分叉，会失败而不是自动创建合并提交。',
      usage: 'git pull --ff-only [远程名] [分支名]',
      example: 'git pull --ff-only\n# 仅在可快进时拉取\n\ngit pull --ff-only origin main\n# 指定远程分支',
      pitfalls: '1. 有分叉时会失败，这是保护行为；需要你决定 merge 还是 rebase。\n2. 适合希望避免意外合并提交的场景。\n3. 失败后可用 git pull --rebase 或普通 git pull，再处理冲突。',
      tags: ['pull', 'ff-only', '快进', '同步', '远程']
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
      cmd: 'git fetch --all -p',
      title: '获取所有远程并清理失效引用',
      cat: '远程',
      desc: '从所有远程获取更新，并清理本地已失效的远程跟踪分支引用。适合同步远程状态前的常用命令。',
      usage: 'git fetch --all -p',
      example: 'git fetch --all -p\n# 获取所有远程更新并 prune 失效引用\n\ngit branch -vv\n# 随后检查本地分支上游状态',
      pitfalls: '1. 只清理远程跟踪引用，不删除本地分支。\n2. 多远程仓库场景下会请求所有远程，耗时可能更长。\n3. 清理后本地分支可能显示 gone，需要手动确认是否删除本地分支。',
      tags: ['fetch', 'all', 'prune', '远程', '同步']
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
      cmd: 'git push -u origin <branch>',
      title: '首次推送并设置上游分支',
      cat: '远程',
      desc: '将本地分支推送到远程并建立跟踪关系，之后可直接使用 git push / git pull。',
      usage: 'git push -u origin <分支名>',
      example: 'git push -u origin feature/login\n# 首次推送并建立跟踪\n\ngit push -u origin HEAD\n# 推送当前分支并建立同名上游',
      pitfalls: '1. 不设置 upstream 时，后续 push/pull 可能需要手动指定远程和分支。\n2. 远程分支名建议与本地一致，除非团队有明确命名规则。\n3. 推送前确认当前分支就是你要发布的分支。',
      tags: ['push', 'upstream', '首次推送', '远程', '-u']
    },
    {
      cmd: 'git push --force-with-lease',
      title: '更安全的强制推送',
      cat: '远程',
      desc: '在确认远程分支未被他人更新的前提下强制推送。比 --force 更安全，但仍会改写远程历史。',
      usage: 'git push --force-with-lease [远程名] [分支名]',
      example: 'git push --force-with-lease\n# 更安全的强推\n\ngit push --force-with-lease origin feature/my-branch\n# 指定远程分支强推',
      pitfalls: '1. 仍然会改写远程历史；使用前确认分支是个人分支或已与协作者沟通。\n2. lease 保护依赖本地远程跟踪引用；推送前建议先 git fetch。\n3. 如果远程有他人新提交，push 会被拒绝，这是预期保护行为。\n4. 公共主分支通常禁止 force push，应遵循仓库保护规则。',
      tags: ['push', 'force-with-lease', '强推', '改写历史', '谨慎', '远程']
    },
    {
      cmd: 'git push origin --delete <branch>',
      title: '删除远程分支',
      cat: '远程',
      desc: '删除远程仓库中的指定分支。不会删除本地分支。',
      usage: 'git push <远程名> --delete <分支名>',
      example: 'git push origin --delete feature/old\n# 删除远程分支\n\ngit fetch -p\n# 清理本地失效远程跟踪引用',
      pitfalls: '1. 删除前确认该分支已合并或不再需要；远程分支删除后其他人将无法直接拉取该分支。\n2. 只删远程分支，本地分支需用 git branch -d/-D。\n3. 受保护分支可能无法删除，需要在远程平台调整保护规则或权限。',
      tags: ['push', 'delete', '远程分支', '删除', '远程']
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
      cmd: 'git remote add',
      title: '添加远程仓库',
      cat: '远程',
      desc: '为本地仓库添加一个远程仓库配置，常用于把本地 init 的仓库关联到 GitHub/GitLab 等远程。',
      usage: 'git remote add <远程名> <仓库URL>',
      example: 'git remote add origin git@github.com:user/repo.git\n# 添加名为 origin 的远程\n\ngit remote -v\n# 验证远程配置',
      pitfalls: '1. 同名远程已存在时 add 会失败；需改用 git remote set-url 或先 remove。\n2. 添加远程只是配置关联，不会自动 fetch/push。\n3. URL 写错会导致后续 fetch/push 失败，添加后用 git remote -v 检查。',
      tags: ['远程', 'add', 'origin', '关联仓库', 'remote']
    },
    {
      cmd: 'git remote -v',
      title: '查看远程仓库地址',
      cat: '远程',
      desc: '列出本地配置的远程仓库名称及其 fetch/push 地址，是排查远程问题的第一步。',
      usage: 'git remote -v',
      example: 'git remote -v\n# 查看所有远程的 fetch/push 地址',
      pitfalls: '1. 看不到预期远程说明尚未配置；用 git remote add 添加。\n2. fetch 和 push 地址可能不同（少见但可能）；排查推送问题时要看 push 地址。\n3. 这只显示本地配置，不代表远程仓库可访问；连通性问题还要检查网络/权限。',
      tags: ['远程', '查看', '地址', 'remote', '-v']
    },
    {
      cmd: 'git remote show',
      title: '查看远程详细信息',
      cat: '远程',
      desc: '显示指定远程的详细信息，包括 fetch/push URL、HEAD 分支、远程分支跟踪关系和 push/pull 配置。',
      usage: 'git remote show <远程名>',
      example: 'git remote show origin\n# 查看 origin 的详细信息',
      pitfalls: '1. 该命令可能需要访问远程仓库；离线或无权限时信息不完整。\n2. 输出较多，重点关注 HEAD branch、local/remote 分支跟踪状态。\n3. 远程已删除分支仍可能在本地显示 stale，可用 git fetch -p 或 git remote prune 清理。',
      tags: ['远程', 'show', '详情', '跟踪', 'remote']
    },
    {
      cmd: 'git remote rename',
      title: '重命名远程仓库',
      cat: '远程',
      desc: '修改本地远程配置的名称，同时会更新对应的远程跟踪分支引用名称。',
      usage: 'git remote rename <旧名称> <新名称>',
      example: 'git remote rename origin upstream\n# 将 origin 重命名为 upstream\n\ngit remote -v\n# 验证重命名结果',
      pitfalls: '1. 重命名后，原远程跟踪分支引用会变化（如 origin/main -> upstream/main）。\n2. 本地分支的 upstream 配置可能需要重新确认；用 git branch -vv 检查。\n3. 脚本/CI 若写死远程名，重命名后需要同步修改。',
      tags: ['远程', 'rename', '重命名', 'remote']
    },
    {
      cmd: 'git remote set-url',
      title: '修改远程仓库地址',
      cat: '远程',
      desc: '更新已有远程的 URL，常用于 HTTPS/SSH 切换、仓库迁移或远程地址变更。',
      usage: 'git remote set-url <远程名> <新URL>',
      example: 'git remote set-url origin git@github.com:user/repo.git\n# 将 origin 改为 SSH 地址\n\ngit remote -v\n# 验证修改结果',
      pitfalls: '1. 修改后用 git remote -v 验证 fetch/push 地址是否符合预期。\n2. 从 HTTPS 切到 SSH（或反向）时，认证方式也会变化，确保凭据/SSH key 已配置。\n3. 只改本地配置，不影响远程仓库；确认新 URL 指向正确仓库。',
      tags: ['远程', 'set-url', '修改地址', 'SSH', 'HTTPS', 'remote']
    },
    {
      cmd: 'git remote remove',
      title: '移除远程仓库绑定',
      cat: '远程',
      desc: '移除本地仓库与指定远程仓库的关联配置，仅删除本地的远程引用，不会删除远程仓库本身，也不会影响本地提交历史。取消后无法再对该远程执行 fetch/pull/push，除非重新添加。',
      usage: 'git remote remove <远程名>\n# 等价旧写法：git remote rm <远程名>',
      example: 'git remote -v\n# 先查看当前远程配置\n\ngit remote remove origin\n# 取消与 origin 的绑定\n\ngit remote -v\n# 再次确认，origin 应已消失\n\n# 如需重新绑定其他地址\n# git remote add origin <new-url>',
      pitfalls: '1. 只删除本地远程配置，不会删除远程仓库，也不会删除本地提交。\n2. 移除后本地分支的 upstream 可能失效；用 git branch -vv 检查。\n3. 如果只是临时不推送，不必 remove；真正需要解除绑定时再操作。',
      tags: ['远程', '取消绑定', '解绑', '删除远程', 'remove', 'rm', 'origin', 'remote']
    },
    {
      cmd: 'git remote prune',
      title: '清理失效远程跟踪分支',
      cat: '远程',
      desc: '删除本地已经不存在于远程的远程跟踪引用（如 origin/old-branch）。不会删除本地分支。',
      usage: 'git remote prune <远程名>',
      example: 'git remote prune origin\n# 清理 origin 下失效的远程跟踪引用\n\ngit fetch -p\n# 等价的常用写法（fetch 同时 prune）',
      pitfalls: '1. 只清理远程跟踪引用，不删除本地分支；本地 gone 分支需手动 git branch -d。\n2. prune 前可用 git remote show origin 查看 stale 分支。\n3. 团队协作中远程分支被删除是正常现象；清理前确认本地是否还有未合并工作。',
      tags: ['远程', 'prune', '清理', 'stale', 'remote']
    },
    {
      cmd: 'git remote get-url',
      title: '查看远程仓库 URL',
      cat: '远程',
      desc: '输出指定远程的 URL。适合脚本中读取远程地址，或快速确认单个远程配置。',
      usage: 'git remote get-url [--push] <远程名>',
      example: 'git remote get-url origin\n# 查看 origin 的 fetch URL\n\ngit remote get-url --push origin\n# 查看 origin 的 push URL',
      pitfalls: '1. 只输出 URL，不检查连通性。\n2. push URL 可能与 fetch URL 不同；排查推送问题时用 --push。\n3. 远程不存在时会报错。',
      tags: ['远程', 'get-url', 'URL', '查看', 'remote']
    },
    {
      cmd: 'git remote set-head',
      title: '设置远程 HEAD 引用',
      cat: '远程',
      desc: '设置或删除本地的远程 HEAD 引用（如 origin/HEAD），用于确定远程默认分支。',
      usage: 'git remote set-head <远程名> (-a | -d | <分支>)',
      example: 'git remote set-head origin -a\n# 自动查询远程并设置 origin/HEAD\n\ngit remote set-head origin main\n# 显式设置 origin/HEAD 为 main\n\ngit remote set-head origin -d\n# 删除 origin/HEAD 引用',
      pitfalls: '1. origin/HEAD 只是本地引用，不改变远程仓库真实默认分支。\n2. 自动设置 -a 需要能访问远程。\n3. 日常开发很少需要手动改它；遇到 origin/HEAD 指向异常时再处理。',
      tags: ['远程', 'set-head', 'HEAD', '默认分支', 'remote']
    },
    {
      cmd: '删除本地仓库实例（删除目录）',
      title: '本地删除 Git 仓库实例',
      cat: '基础',
      desc: '本地 Git “实例”就是仓库所在目录。删除本地实例即删除该目录，包含工作区文件和 .git 历史。此操作不可恢复，请先确认没有未推送提交、未备份改动或未保存的 stash；如只想解除远程绑定，请使用 git remote remove。',
      usage: '# Windows PowerShell\nRemove-Item -Recurse -Force <仓库目录>\n\n# Linux / macOS / Git Bash\nrm -rf <仓库目录>',
      example: '# 先确认当前仓库状态，避免丢失未推送内容\ngit status\ngit remote -v\ngit stash list\n\n# Windows PowerShell：删除本地仓库目录\nRemove-Item -Recurse -Force .\\my-repo\n\n# Linux / macOS / Git Bash：删除本地仓库目录\nrm -rf ./my-repo',
      pitfalls: '1. 删除目录会同时删除 .git 历史和工作区文件，通常不可恢复。\n2. 删除前检查未推送提交：git log --branches --not --remotes 或 git status -sb。\n3. 只想解除远程绑定用 git remote remove；只想清理未跟踪文件用 git clean（谨慎）。\n4. 当前终端/IDE 如果正占用该目录，删除可能失败；先关闭占用程序。',
      tags: ['删除', '本地', '实例', '仓库', '目录', 'rm', 'Remove-Item', '清理']
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
      title: '重置 HEAD / 暂存区（通用）',
      cat: '撤销',
      desc: '移动当前分支指针并可选择性地重置暂存区和工作区。--soft 只移动 HEAD；--mixed（默认）重置暂存区；--hard 同时丢弃工作区改动（危险）。',
      usage: 'git reset [--soft|--mixed|--hard] <提交> [-- 路径]',
      example: 'git reset --soft HEAD~1\n# 撤销最近一次提交，改动保留在暂存区\n\ngit reset HEAD~1\n# 撤销提交且取消暂存，改动保留在工作区\n\ngit reset --hard HEAD~1\n# 彻底回退并丢弃改动（谨慎）\n\ngit reset HEAD -- file.txt\n# 取消暂存指定文件（旧写法，等价于 git restore --staged）',
      pitfalls: '1. --hard 会丢弃工作区和暂存区未提交改动，通常不可恢复；执行前先 git status / git stash。\n2. reset 会移动分支指针；对已推送公共分支 reset 后再 push 通常需要强推，非常危险。\n3. 误 reset --hard 后，先用 git reflog 查找之前的 HEAD，再 git reset --hard HEAD@{n} 尝试找回（仅限本地 reflog 未过期）。\n4. 取消暂存文件优先使用更语义化的 git restore --staged <file>（新 Git）。',
      tags: ['回退', '撤销', '重置', 'soft', 'mixed', 'hard', 'HEAD']
    },
    {
      cmd: 'git reset --soft',
      title: '软重置（保留暂存和工作区）',
      cat: '撤销',
      desc: '只移动 HEAD 到指定提交，不改暂存区和工作区。常用于“撤销提交但保留改动继续编辑/重新提交”。',
      usage: 'git reset --soft <提交>',
      example: 'git reset --soft HEAD~1\n# 撤销最近一次提交，改动保留在暂存区\n\ngit reset --soft origin/main\n# 移动 HEAD 到 origin/main，保留本地改动在暂存区/工作区状态',
      pitfalls: '1. 只撤销提交，不撤销改动；改动仍在暂存区。\n2. 对已推送提交 soft reset 后重新提交会改写历史，推送需谨慎。\n3. 适合重做提交说明或合并多个提交前的准备。',
      tags: ['reset', 'soft', '撤销提交', '保留暂存']
    },
    {
      cmd: 'git reset --mixed',
      title: '混合重置（默认，取消暂存）',
      cat: '撤销',
      desc: '移动 HEAD 并重置暂存区，但保留工作区改动。是 git reset 的默认模式。',
      usage: 'git reset --mixed <提交> | git reset <提交>',
      example: 'git reset HEAD~1\n# 默认 mixed：撤销提交并取消暂存，改动保留在工作区\n\ngit reset --mixed HEAD~1\n# 显式写法，效果相同',
      pitfalls: '1. 会取消暂存，但不会丢弃工作区改动。\n2. 如果想连工作区一起丢弃，用 --hard（谨慎）；如果想保留暂存，用 --soft。\n3. 对已推送提交 reset 后再推送会涉及历史改写。',
      tags: ['reset', 'mixed', '取消暂存', '默认']
    },
    {
      cmd: 'git reset --hard',
      title: '硬重置（丢弃改动，危险）',
      cat: '撤销',
      desc: '移动 HEAD 并重置暂存区和工作区，丢弃未提交改动。常用于彻底回退到某个提交状态。',
      usage: 'git reset --hard <提交>',
      example: 'git reset --hard HEAD~1\n# 彻底回退一个提交（谨慎）\n\ngit reset --hard origin/main\n# 强制对齐到远程分支（会丢本地改动）',
      pitfalls: '1. 会丢弃工作区和暂存区未提交改动，通常不可恢复；执行前先 git status / git stash。\n2. 对已推送公共分支执行后再强推风险极高。\n3. 误操作后立即用 git reflog 查找旧 HEAD，并用 git reset --hard HEAD@{n} 或创建 rescue 分支尝试找回。',
      tags: ['reset', 'hard', '危险', '丢弃改动', '回退']
    },
    {
      cmd: 'git revert',
      title: '反做提交（安全撤销）',
      cat: '撤销',
      desc: '创建一个新的提交来抵消指定提交的改动，不改写历史。适合撤销已经推送到公共分支的提交。',
      usage: 'git revert <提交ID...> [选项]',
      example: 'git revert abc1234\n# 生成反向提交撤销指定改动\n\ngit revert HEAD\n# 撤销最近一次提交\n\ngit revert -n abc1234\n# 只应用反向改动，不自动提交\n\ngit revert -m 1 <merge-commit>\n# 回滚合并提交（需指定主线）',
      pitfalls: '1. revert 不改写历史，适合公共分支；但它会新增一个“反向提交”，历史中原提交仍存在。\n2. 回滚 merge commit 必须指定 -m 主线（通常 1 代表保留的主线）；选错会导致结果不符合预期。\n3. revert merge commit 后，再次合并同一分支时 Git 可能认为改动已合并，需要额外处理（如 revert 那个 revert）。\n4. 有冲突时解决后 git add 并 git revert --continue；放弃用 --abort。',
      tags: ['撤销', '回滚', '反做', '安全', '公共分支', 'merge commit']
    },
    {
      cmd: 'git revert --continue',
      title: '继续反做提交',
      cat: '撤销',
      desc: 'revert 冲突解决并 git add 后，继续完成反做提交。',
      usage: 'git revert --continue',
      example: 'git add conflict-file.txt\ngit revert --continue\n# 解决冲突后继续 revert',
      pitfalls: '1. 继续前必须先解决冲突并 git add。\n2. 多个提交 revert 时可能逐个出现冲突。\n3. 若要放弃本次 revert，用 git revert --abort。',
      tags: ['revert', 'continue', '继续', '冲突']
    },
    {
      cmd: 'git revert --abort',
      title: '放弃反做提交',
      cat: '撤销',
      desc: '放弃当前 revert 过程，恢复到 revert 开始前的状态。',
      usage: 'git revert --abort',
      example: 'git revert --abort\n# 放弃本次 revert',
      pitfalls: '1. 仅在 revert 进行中可用。\n2. 放弃前确认是否需要保留已手动解决的冲突结果。\n3. 冲突复杂时 abort 是安全退出方式。',
      tags: ['revert', 'abort', '放弃', '冲突']
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
      title: '暂存当前改动（快速保存）',
      cat: '暂存',
      desc: '把当前工作区和暂存区的改动临时保存起来，使工作区变干净。等价于 git stash push 的常见简写用法。',
      usage: 'git stash [push] [-m "说明"] [-u|-a]',
      example: 'git stash\n# 临时保存当前改动\n\ngit stash -m "临时保存登录页修改"\n# 带说明保存\n\ngit stash -u\n# 同时保存未跟踪文件（谨慎确认）',
      pitfalls: '1. 默认不包含未跟踪文件；需要包含新文件用 -u/--include-untracked，包含忽略文件用 -a/--all（非常谨慎）。\n2. stash 不是长期备份；重要改动还是尽快 commit 或建分支。\n3. 多次 stash 会堆叠，记得用 git stash list 查看并写清说明。',
      tags: ['暂存', '搁置', '临时', 'stash', '保存']
    },
    {
      cmd: 'git stash push',
      title: '创建暂存条目（推荐写法）',
      cat: '暂存',
      desc: '将当前改动保存为一个 stash 条目。相比裸 git stash，push 支持更明确的参数，如说明、包含未跟踪文件、指定路径等。',
      usage: 'git stash push [-m "说明"] [-u|-a] [-- <路径...>]',
      example: 'git stash push -m "临时保存登录页修改"\n# 带说明保存\n\ngit stash push -u -m "含未跟踪文件"\n# 同时保存未跟踪文件\n\ngit stash push -m "只暂存某文件" -- src/app.js\n# 只暂存指定路径',
      pitfalls: '1. 不加 -u 默认不包含未跟踪新文件；不加 -a 默认不包含忽略文件。\n2. 指定路径时只会暂存对应文件改动，其他改动仍留在工作区。\n3. 建议始终加 -m 说明，避免 stash 列表难以辨认。',
      tags: ['暂存', 'stash', 'push', '保存', '-u', 'message']
    },
    {
      cmd: 'git stash list',
      title: '查看暂存列表',
      cat: '暂存',
      desc: '列出当前仓库中的所有 stash 条目，包括索引、所在分支/提交基线和说明。',
      usage: 'git stash list',
      example: 'git stash list\n# 查看所有暂存条目\n\ngit stash list --stat\n# 查看每条暂存的文件变更统计',
      pitfalls: '1. stash 是本地仓库状态，不会随 push 推送到远程。\n2. 列表中的 stash@{n} 编号会随 drop/pop 变化，操作前先确认目标条目。\n3. 长期积累的 stash 容易混淆，定期清理无用条目。',
      tags: ['暂存', 'stash', 'list', '列表', '查看']
    },
    {
      cmd: 'git stash show',
      title: '查看暂存内容',
      cat: '暂存',
      desc: '查看某条 stash 的改动摘要或详细 diff。默认显示最近一条，也可指定 stash@{n}。',
      usage: 'git stash show [-p] [stash@{n}]',
      example: 'git stash show\n# 查看最近一条 stash 的改动摘要\n\ngit stash show -p stash@{0}\n# 查看指定 stash 的详细 diff\n\ngit stash show --stat stash@{1}\n# 查看指定 stash 的文件统计',
      pitfalls: '1. 不加 -p 默认只显示摘要，不显示完整 diff。\n2. 查看包含未跟踪文件的 stash 时，显示内容可能不如普通改动直观，必要时结合 apply 到临时分支检查。\n3. 指定 stash@{n} 前先 git stash list 确认编号。',
      tags: ['暂存', 'stash', 'show', 'diff', '查看']
    },
    {
      cmd: 'git stash pop',
      title: '恢复暂存并移除记录',
      cat: '暂存',
      desc: '将指定 stash 应用到当前工作区，并在应用成功后从 stash 列表中删除该条目。默认恢复最近一条。',
      usage: 'git stash pop [stash@{n}]',
      example: 'git stash pop\n# 恢复最近一条 stash 并移除记录\n\ngit stash pop stash@{1}\n# 恢复指定 stash 并移除记录',
      pitfalls: '1. pop 冲突时，stash 记录可能不会自动删除；解决冲突后用 git stash list 检查，必要时手动 git stash drop。\n2. 不确定能否顺利恢复时优先用 git stash apply，确认无误后再 drop。\n3. pop 会把改动应用到当前工作区，当前分支/状态不对时可能产生冲突或混乱。',
      tags: ['暂存', 'stash', 'pop', '恢复', '移除']
    },
    {
      cmd: 'git stash apply',
      title: '恢复暂存但保留记录',
      cat: '暂存',
      desc: '将指定 stash 应用到当前工作区，但保留 stash 列表中的该条目。适合想重复应用或先验证恢复结果的场景。',
      usage: 'git stash apply [stash@{n}]',
      example: 'git stash apply\n# 应用最近一条 stash，保留记录\n\ngit stash apply stash@{1}\n# 应用指定 stash，保留记录',
      pitfalls: '1. apply 不会删除 stash 记录；确认不再需要后手动 git stash drop。\n2. 多次 apply 同一条 stash 可能重复引入改动或冲突，注意当前工作区状态。\n3. 冲突处理与普通合并冲突类似：解决后 git add，但不需要 commit 来完成 stash apply。',
      tags: ['暂存', 'stash', 'apply', '恢复', '保留']
    },
    {
      cmd: 'git stash drop',
      title: '删除单条暂存记录',
      cat: '暂存',
      desc: '删除指定的 stash 条目。默认删除最近一条。删除后通常不可恢复。',
      usage: 'git stash drop [stash@{n}]',
      example: 'git stash drop\n# 删除最近一条 stash\n\ngit stash drop stash@{2}\n# 删除指定 stash 条目',
      pitfalls: '1. drop 删除后通常不可恢复；删除前用 git stash show -p 确认内容。\n2. stash@{n} 编号会变化，连续删除时先 list 再操作。\n3. 如果只是想应用并删除，用 git stash pop；不要先 pop 再误 drop 其他条目。',
      tags: ['暂存', 'stash', 'drop', '删除', '清理']
    },
    {
      cmd: 'git stash clear',
      title: '清空所有暂存记录',
      cat: '暂存',
      desc: '删除当前仓库中的所有 stash 条目。该操作不可恢复，执行前务必确认。',
      usage: 'git stash clear',
      example: 'git stash clear\n# 清空所有 stash（谨慎）\n\ngit stash list\n# 清空前先确认列表',
      pitfalls: '1. clear 会删除所有 stash，通常不可恢复；执行前务必 git stash list / git stash show -p 检查。\n2. 不要把 clear 当作日常清理唯一方式；优先逐条 drop 明确目标。\n3. 误 clear 后极少数情况下可通过 fsck/悬空对象找回，但不可靠，不应作为依赖。',
      tags: ['暂存', 'stash', 'clear', '清空', '删除', '谨慎']
    },
    {
      cmd: 'git stash branch',
      title: '基于暂存创建分支',
      cat: '暂存',
      desc: '以创建 stash 时的提交为基点创建并切换到新分支，然后应用该 stash；成功后通常会删除该 stash 条目。',
      usage: 'git stash branch <新分支名> [stash@{n}]',
      example: 'git stash branch fix-bug stash@{0}\n# 基于 stash@{0} 创建分支并应用暂存\n\ngit stash branch feature/temp\n# 基于最近一条 stash 创建分支',
      pitfalls: '1. 适合 stash 应用冲突较多或想隔离恢复现场的场景。\n2. 成功应用后 stash 条目通常会被删除；如需保留请先确认行为或改用 apply。\n3. 新分支基点是 stash 创建时的提交，不一定是当前 HEAD。',
      tags: ['暂存', 'stash', 'branch', '分支', '恢复']
    },
    {
      cmd: 'git tag',
      title: '列出标签',
      cat: '标签',
      desc: '列出本地仓库中的标签。常用于查看发布版本标记。',
      usage: 'git tag [-l "模式"] [--sort=-v:refname]',
      example: 'git tag\n# 列出所有标签\n\ngit tag -l "v1.*"\n# 按模式过滤标签\n\ngit tag --sort=-v:refname\n# 按版本号倒序查看（较新版本在前）',
      pitfalls: '1. git tag 默认列出本地标签；远程标签用 git ls-remote --tags origin 或 git fetch --tags 后查看。\n2. 标签名排序默认是字典序，版本号排序建议用 --sort=-v:refname。',
      tags: ['标签', '版本', '列表', 'tag', 'list']
    },
    {
      cmd: 'git tag <tagname>',
      title: '创建轻量标签',
      cat: '标签',
      desc: '在当前提交（或指定提交）创建轻量标签。轻量标签只是一个名称指针，不包含额外说明信息。',
      usage: 'git tag <标签名> [提交]',
      example: 'git tag v1.0.0\n# 在当前提交创建轻量标签\n\ngit tag v1.0.0 abc1234\n# 在指定提交创建轻量标签',
      pitfalls: '1. 轻量标签没有说明、打标签者和日期；正式发布建议用附注标签 git tag -a。\n2. 标签名已存在时会失败；需要移动标签应谨慎处理（通常不建议改已发布标签）。\n3. 创建本地标签后不会自动推送到远程，需要 git push origin <tag>。',
      tags: ['标签', '轻量标签', '版本', 'tag']
    },
    {
      cmd: 'git tag -a',
      title: '创建附注标签',
      cat: '标签',
      desc: '创建附注标签（annotated tag），可包含说明、打标签者、日期。适合正式发布版本。',
      usage: 'git tag -a <标签名> -m "说明" [提交]',
      example: 'git tag -a v1.0.0 -m "发布 1.0.0"\n# 在当前提交创建附注标签\n\ngit tag -a v1.0.0 -m "发布 1.0.0" abc1234\n# 在指定提交创建附注标签',
      pitfalls: '1. 不带 -m 时会打开编辑器要求输入说明。\n2. 附注标签是推荐的发布标签形式，包含元数据，便于追溯。\n3. 已推送的发布标签不要随意改动或删除，否则会影响他人和 CI/CD。',
      tags: ['标签', '附注标签', '版本', '发布', 'tag', 'annotate']
    },
    {
      cmd: 'git tag -d',
      title: '删除本地标签',
      cat: '标签',
      desc: '删除本地仓库中的指定标签。不会影响远程标签。',
      usage: 'git tag -d <标签名>',
      example: 'git tag -d v1.0.0\n# 删除本地标签',
      pitfalls: '1. 只删除本地标签；远程标签需用 git push origin --delete <tag>。\n2. 删除已发布标签前确认是否有 CI/CD、包管理器或团队依赖该标签。\n3. 误删本地标签如果远程还有，可 git fetch --tags 重新获取（取决于远程状态）。',
      tags: ['标签', '删除', '本地', 'tag', '-d']
    },
    {
      cmd: 'git push origin <tag>',
      title: '推送单个标签到远程',
      cat: '标签',
      desc: '将指定本地标签推送到远程仓库。',
      usage: 'git push <远程名> <标签名>',
      example: 'git push origin v1.0.0\n# 推送单个标签到 origin',
      pitfalls: '1. git push 默认不会推送标签；标签需要显式推送。\n2. 推送前确认标签指向的提交正确，特别是发布标签。\n3. 如果远程已存在同名标签，可能被拒绝；不要轻易强推标签。',
      tags: ['标签', '推送', '远程', 'tag', 'push']
    },
    {
      cmd: 'git push origin --tags',
      title: '推送所有本地标签到远程',
      cat: '标签',
      desc: '将本地所有标签推送到远程仓库。适合批量发布标签，但要注意不要误推本地临时标签。',
      usage: 'git push <远程名> --tags',
      example: 'git push origin --tags\n# 推送所有本地标签到 origin',
      pitfalls: '1. 会推送所有本地标签，包括你可能不想发布的临时/测试标签；推送前用 git tag 检查。\n2. 正式发布通常更推荐显式推送单个标签 git push origin v1.0.0。\n3. 远程已有同名标签时行为可能受冲突影响；避免覆盖已发布标签。',
      tags: ['标签', '推送', '全部', 'tags', 'remote']
    },
    {
      cmd: 'git push origin --delete <tag>',
      title: '删除远程标签',
      cat: '标签',
      desc: '删除远程仓库中的指定标签。本地标签需另外用 git tag -d 删除。',
      usage: 'git push <远程名> --delete <标签名>',
      example: 'git push origin --delete v1.0.0\n# 删除远程标签\n\ngit tag -d v1.0.0\n# 如需同时删除本地标签',
      pitfalls: '1. 删除已发布的远程标签会影响依赖该标签的用户/CI/构建；谨慎操作。\n2. 该命令只删远程标签，本地标签仍需 git tag -d 删除。\n3. 团队协作中删除发布标签前务必通知相关人员。',
      tags: ['标签', '删除', '远程', 'tag', 'push', 'delete']
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
      cmd: 'git bisect start',
      title: '开始二分定位',
      cat: '排查',
      desc: '启动 bisect 会话，准备通过二分查找定位引入问题的提交。',
      usage: 'git bisect start [坏提交] [好提交]',
      example: 'git bisect start\n# 开始二分会话\n\ngit bisect start HEAD v1.0.0\n# 开始并同时指定坏/好提交',
      pitfalls: '1. 开始后 Git 会切换到中间提交（分离 HEAD 状态）；结束后用 git bisect reset 恢复。\n2. 二分前确保工作区干净，避免切换提交时冲突。\n3. 好/坏提交范围要尽量准确，能减少二分步数。',
      tags: ['bisect', 'start', '二分', '排查']
    },
    {
      cmd: 'git bisect bad',
      title: '标记问题提交',
      cat: '排查',
      desc: '在 bisect 会话中标记当前或指定提交为“有问题”。',
      usage: 'git bisect bad [提交]',
      example: 'git bisect bad\n# 标记当前提交有问题\n\ngit bisect bad HEAD\n# 显式标记 HEAD 有问题',
      pitfalls: '1. 至少要标记一个 bad 和一个 good，Git 才能开始二分。\n2. 标记错误会导致定位结果不可信；不确定时重新开始 bisect。\n3. 测试标准应一致，否则好坏判断会混乱。',
      tags: ['bisect', 'bad', '二分', '问题提交']
    },
    {
      cmd: 'git bisect good',
      title: '标记正常提交',
      cat: '排查',
      desc: '在 bisect 会话中标记当前或指定提交为“正常”。',
      usage: 'git bisect good [提交...]',
      example: 'git bisect good v1.0.0\n# 标记已知正常版本\n\ngit bisect good\n# 测试当前提交后标记为正常',
      pitfalls: '1. 可以一次标记多个已知正常提交。\n2. “正常”标准要与 bad 标准一致。\n3. 如果 good/bad 标记反了，结果会指向错误提交，需 reset 后重来。',
      tags: ['bisect', 'good', '二分', '正常提交']
    },
    {
      cmd: 'git bisect reset',
      title: '结束二分并恢复',
      cat: '排查',
      desc: '结束 bisect 会话并恢复到开始 bisect 前的分支/状态。',
      usage: 'git bisect reset [提交]',
      example: 'git bisect reset\n# 结束二分，恢复原分支\n\ngit bisect reset main\n# 结束二分并切换到指定提交/分支',
      pitfalls: '1. bisect 结束后一定要 reset，否则可能停留在分离 HEAD 状态。\n2. reset 前记录定位到的问题提交哈希，方便后续修复。\n3. 如果工作区有临时测试改动，reset 前先清理。',
      tags: ['bisect', 'reset', '结束二分', '恢复']
    },
    {
      cmd: 'git bisect run',
      title: '自动运行二分测试',
      cat: '排查',
      desc: '自动对每个二分点运行脚本/命令，根据退出码判断 good/bad，加速定位。',
      usage: 'git bisect run <命令>',
      example: 'git bisect run npm test\n# 自动运行测试判定好坏\n\ngit bisect run ./test.sh\n# 用脚本自动二分（退出码 0=good，1-124/126/127=bad，125=skip）',
      pitfalls: '1. 脚本退出码约定：0 表示 good，1-124/126/127 通常表示 bad，125 表示跳过当前提交（不可测试）。\n2. 测试脚本必须可靠且可重复，否则 bisect 结果不可信。\n3. 自动运行前先手动验证几个点，确认测试标准正确。',
      tags: ['bisect', 'run', '自动化', '测试', '排查']
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
      cmd: 'git show-ref',
      title: '查看本地引用',
      cat: '排查',
      desc: '列出本地仓库中的引用（分支、标签等）及其对应的提交哈希，常用于脚本或排查引用状态。',
      usage: 'git show-ref [--heads|--tags] [模式]',
      example: 'git show-ref\n# 列出所有本地引用及哈希\n\ngit show-ref --heads\n# 只查看本地分支引用\n\ngit show-ref --tags\n# 只查看标签引用',
      pitfalls: '1. show-ref 默认显示本地引用；查看远程引用用 git ls-remote。\n2. 引用异常（如分支丢失、tag 指向不对）时可结合 git reflog / git fsck 排查。\n3. 输出适合脚本处理，但日常查看分支更常用 git branch -vv。',
      tags: ['引用', 'ref', '哈希', '分支', '标签', '排查']
    },
    {
      cmd: 'git rev-parse',
      title: '解析修订参数与仓库信息',
      cat: '排查',
      desc: '解析 Git 修订参数（如 HEAD、分支名、相对引用）并输出对应哈希或仓库路径信息，常用于脚本和自动化。',
      usage: 'git rev-parse <参数>',
      example: 'git rev-parse HEAD\n# 输出当前提交完整哈希\n\ngit rev-parse --short HEAD\n# 输出短哈希\n\ngit rev-parse --abbrev-ref HEAD\n# 输出当前分支名（分离 HEAD 时输出 HEAD）\n\ngit rev-parse --show-toplevel\n# 输出仓库根目录路径\n\ngit rev-parse --git-dir\n# 输出 .git 目录路径',
      pitfalls: '1. 在分离 HEAD 状态下，--abbrev-ref HEAD 返回 HEAD，不是分支名。\n2. rev-parse 失败通常说明不在 Git 仓库内或引用不存在；脚本中应检查退出码。\n3. 用于脚本时注意跨平台路径输出格式和引号处理。',
      tags: ['引用', '哈希', '分支名', '脚本', '解析', 'rev-parse']
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
      title: '查看子模块状态（概览）',
      cat: '子模块',
      desc: '列出当前仓库配置的子模块及其提交状态。子模块让一个仓库以固定提交引用另一个仓库。',
      usage: 'git submodule [status]',
      example: 'git submodule\n# 等价于 git submodule status\n\ngit submodule status\n# 查看子模块状态',
      pitfalls: '1. 子模块是“固定提交引用”，不会自动跟随上游最新提交。\n2. clone 后子模块目录可能为空，需要 init/update。\n3. 子模块状态异常时，结合 git submodule status 和子模块目录内 git status 排查。',
      tags: ['子模块', 'submodule', '状态', '概览']
    },
    {
      cmd: 'git submodule add',
      title: '添加子模块',
      cat: '子模块',
      desc: '将外部仓库作为子模块添加到当前仓库指定路径，并记录子模块配置。',
      usage: 'git submodule add <仓库URL> [路径]',
      example: 'git submodule add https://github.com/example/lib.git libs/lib\n# 添加子模块到 libs/lib\n\ngit status\n# 会看到 .gitmodules 和子模块路径变更',
      pitfalls: '1. 添加子模块会修改 .gitmodules 和索引，需要提交这些变更。\n2. 子模块路径应避免与现有目录冲突。\n3. 私有子模块仓库需要配置访问权限，否则协作者无法初始化。',
      tags: ['子模块', 'add', '添加', 'submodule']
    },
    {
      cmd: 'git submodule init',
      title: '初始化子模块配置',
      cat: '子模块',
      desc: '根据 .gitmodules 初始化本地子模块配置。通常与 git submodule update 配合使用。',
      usage: 'git submodule init [-- <路径...>]',
      example: 'git submodule init\n# 初始化所有子模块配置\n\ngit submodule init -- libs/lib\n# 只初始化指定子模块',
      pitfalls: '1. init 只初始化配置，不会拉取子模块内容；需要 git submodule update。\n2. clone 后常用组合是 git submodule update --init --recursive。\n3. .gitmodules 变更后可能需要 git submodule sync。',
      tags: ['子模块', 'init', '初始化', 'submodule']
    },
    {
      cmd: 'git submodule update',
      title: '更新子模块内容',
      cat: '子模块',
      desc: '根据父仓库记录的子模块提交，更新子模块工作目录内容。clone 后或切换分支后常用。',
      usage: 'git submodule update [--init] [--recursive]',
      example: 'git submodule update --init --recursive\n# 初始化并更新所有子模块（含嵌套）\n\ngit submodule update --remote\n# 按子模块跟踪分支更新到远程最新（谨慎，会改指针）',
      pitfalls: '1. 默认更新到父仓库记录的提交，不是子模块远程最新提交。\n2. --remote 会把子模块更新到远程跟踪分支最新提交，父仓库会出现子模块指针变更，需要提交。\n3. 切换父仓库分支后如果子模块指针变化，记得执行 submodule update。',
      tags: ['子模块', 'update', '更新', 'recursive', 'submodule']
    },
    {
      cmd: 'git submodule sync',
      title: '同步子模块远程配置',
      cat: '子模块',
      desc: '将 .gitmodules 中的子模块 URL 同步到本地 git 配置。子模块远程地址变更后常用。',
      usage: 'git submodule sync [--recursive]',
      example: 'git submodule sync --recursive\n# 同步所有子模块远程地址配置\n\ngit submodule update --init --recursive\n# 同步后通常再更新',
      pitfalls: '1. 只同步配置，不会拉取代码。\n2. 子模块 URL 变更后，协作者需要 sync + update。\n3. 不要手工随意改 .git/config 中的子模块 URL 而不同步 .gitmodules。',
      tags: ['子模块', 'sync', '同步', 'URL', 'submodule']
    },
    {
      cmd: 'git submodule deinit',
      title: '取消子模块初始化',
      cat: '子模块',
      desc: '取消子模块的本地初始化状态，清理工作目录中的子模块内容（按 Git 版本行为）。用于移除子模块前的步骤之一。',
      usage: 'git submodule deinit [-f] [-- <路径>]',
      example: 'git submodule deinit -f libs/lib\n# 取消指定子模块初始化\n\ngit rm -f libs/lib\n# 从索引和工作区移除子模块记录',
      pitfalls: '1. deinit 不会自动删除 .gitmodules 记录或 .git/modules 目录残留；完整移除需要额外步骤。\n2. 有本地修改时可能需要 -f，注意会丢弃子模块本地改动。\n3. 删除子模块流程建议：deinit -> git rm -> 清理 .git/modules/<path> -> 提交。',
      tags: ['子模块', 'deinit', '移除', 'submodule']
    },
    {
      cmd: 'git worktree list',
      title: '查看工作树列表',
      cat: '分支',
      desc: '列出当前仓库关联的所有工作树，包括主工作树和附加工作树的路径、HEAD 提交和分支。',
      usage: 'git worktree list [--porcelain]',
      example: 'git worktree list\n# 查看所有工作树\n\ngit worktree list --porcelain\n# 机器可读格式输出（脚本用）',
      pitfalls: '1. 主工作树和附加工作树共享同一个 .git 仓库对象库，但各自有独立工作区和索引。\n2. 看到 locked/prunable 状态可帮助排查无法移除或清理的问题。',
      tags: ['worktree', 'list', '工作树', '查看', '分支']
    },
    {
      cmd: 'git worktree add',
      title: '添加工作树',
      cat: '分支',
      desc: '为指定分支或新分支创建一个新的工作树目录，实现同一仓库多分支并行开发。',
      usage: 'git worktree add <路径> [<分支>] | git worktree add -b <新分支> <路径> [<起点>]',
      example: 'git worktree add ../hotfix hotfix-branch\n# 为已有分支创建工作树\n\ngit worktree add -b feature/x ../feature-x main\n# 基于 main 创建新分支并添加工作树\n\ngit worktree add ../tmp-detach --detach HEAD\n# 创建分离 HEAD 工作树（谨慎）',
      pitfalls: '1. 同一个分支不能同时被两个工作树检出。\n2. 新工作树目录路径通常放同级目录，避免放进当前仓库内部造成混乱。\n3. 每个工作树有独立暂存区和未提交改动，互不影响。',
      tags: ['worktree', 'add', '添加', '并行开发', '分支']
    },
    {
      cmd: 'git worktree remove',
      title: '移除工作树',
      cat: '分支',
      desc: '移除一个附加工作树。工作树中有未提交改动时默认会拒绝移除。',
      usage: 'git worktree remove <工作树路径>',
      example: 'git worktree remove ../hotfix\n# 移除工作树\n\ngit worktree remove --force ../hotfix\n# 强制移除（谨慎）',
      pitfalls: '1. 有未提交改动或锁定时可能无法移除；先确认改动已提交/stash。\n2. --force 会强制移除，可能丢失该工作树未提交改动。\n3. remove 只移除工作树，不删除分支本身。',
      tags: ['worktree', 'remove', '移除', '清理', '分支']
    },
    {
      cmd: 'git worktree prune',
      title: '清理失效工作树记录',
      cat: '分支',
      desc: '清理已手动删除目录但仍残留在 Git 元数据中的工作树记录。',
      usage: 'git worktree prune [-n] [-v]',
      example: 'git worktree prune -n\n# 预览将清理的失效工作树记录\n\ngit worktree prune\n# 清理失效工作树记录',
      pitfalls: '1. 先用 -n/--dry-run 预览，避免误清理。\n2. 如果工作树目录被手工删除，Git 仍可能保留管理记录，需要 prune。\n3. locked 的工作树不会被 prune，除非先 unlock（谨慎）。',
      tags: ['worktree', 'prune', '清理', '失效', '分支']
    },
    {
      cmd: 'git worktree lock',
      title: '锁定工作树',
      cat: '分支',
      desc: '锁定工作树，防止被 prune 清理。适合工作树位于移动存储或临时不可访问路径的场景。',
      usage: 'git worktree lock [--reason <原因>] <工作树路径>',
      example: 'git worktree lock --reason "移动硬盘未挂载" ../hotfix\n# 锁定工作树并记录原因',
      pitfalls: '1. 锁定后 prune 不会清理它；不再需要时记得 unlock。\n2. lock 不会保护未提交改动不被删除，只是保护 worktree 元数据记录。',
      tags: ['worktree', 'lock', '锁定', '分支']
    },
    {
      cmd: 'git worktree unlock',
      title: '解锁工作树',
      cat: '分支',
      desc: '解除工作树锁定，使其可被 prune 清理（如果已失效）。',
      usage: 'git worktree unlock <工作树路径>',
      example: 'git worktree unlock ../hotfix\n# 解锁工作树',
      pitfalls: '1. 解锁前确认该工作树目录确实可用或确实要允许 prune。\n2. unlock 不会删除工作树，只是取消锁定状态。',
      tags: ['worktree', 'unlock', '解锁', '分支']
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
      cmd: 'git format-patch',
      title: '将提交导出为补丁文件',
      cat: '合并',
      desc: '将提交导出为补丁文件（邮件格式），可用于邮件工作流、代码审阅或跨仓库传递提交。',
      usage: 'git format-patch [选项] <范围/提交>',
      example: 'git format-patch -1 HEAD\n# 将最近一次提交导出为补丁\n\ngit format-patch origin/main..HEAD\n# 导出本地未推送提交为补丁\n\ngit format-patch -o patches HEAD~3..HEAD\n# 导出最近 3 个提交到 patches 目录',
      pitfalls: '1. format-patch 导出的是提交（含作者、时间、说明），与 git diff 生成的纯 diff 不同。\n2. 范围写错会导出过多或过少提交；导出前用 git log --oneline <范围> 确认。\n3. 补丁应用到不同基线时可能冲突，需要用 git am 或 git apply 处理。',
      tags: ['补丁', 'patch', '邮件', '导出', 'format-patch']
    },
    {
      cmd: 'git am',
      title: '应用补丁邮件为提交',
      cat: '合并',
      desc: '将 format-patch 生成的补丁邮件应用到当前分支，并创建对应提交。常用于邮件工作流。',
      usage: 'git am [选项] <补丁文件...>',
      example: 'git am 0001-fix.patch\n# 应用补丁文件\n\ngit am patches/*.patch\n# 按顺序应用多个补丁\n\ngit am --3way 0001-fix.patch\n# 冲突时尝试三方合并\n\ngit am --abort\n# 应用冲突时放弃',
      pitfalls: '1. am 应用的是邮件格式补丁；普通 diff 文件通常用 git apply。\n2. 冲突时解决后 git add，再 git am --continue；放弃用 --abort。\n3. 应用前确认当前分支和基线正确，避免把补丁应用到错误分支。',
      tags: ['补丁', 'patch', '邮件', '应用', 'am']
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
      cmd: 'git help',
      title: '查看命令帮助文档',
      cat: '配置',
      desc: '查看 Git 命令的帮助文档。遇到参数不确定、行为差异或平台差异时，优先查官方帮助。',
      usage: 'git help <命令> | git <命令> -h',
      example: 'git help commit\n# 打开 commit 的详细帮助（通常是 man page/浏览器）\n\ngit commit -h\n# 查看 commit 的简要参数\n\ngit help -a\n# 列出所有可用命令（较长）',
      pitfalls: '1. git help <cmd> 通常显示完整文档；git <cmd> -h 显示简要用法，更快。\n2. 不同 Git 版本参数和行为可能不同；遇到奇怪行为先确认 git --version。\n3. Windows 下 help 的打开方式可能与 Linux/macOS 不同，取决于安装配置。',
      tags: ['帮助', '文档', 'help', '用法']
    },
    {
      cmd: 'git version',
      title: '查看 Git 版本',
      cat: '配置',
      desc: '显示当前安装的 Git 版本。排查命令兼容性、行为差异或新特性支持时很有用。',
      usage: 'git --version | git version',
      example: 'git --version\n# 查看 Git 版本\n\ngit version\n# 等价写法',
      pitfalls: '1. 不同版本对 switch/restore、默认分支、部分参数行为可能有差异。\n2. CI/服务器/本地 Git 版本不一致时，可能出现同命令表现不同的问题。\n3. 需要升级时按操作系统官方方式安装，避免多版本冲突。',
      tags: ['版本', 'version', '兼容性', '配置']
    },
    {
      cmd: 'git gc',
      title: '仓库垃圾回收与优化',
      cat: '排查',
      desc: '执行垃圾回收和仓库优化，包括压缩对象、清理不可达对象等。一般 Git 会自动运行，手动用于维护或排查。',
      usage: 'git gc [--prune=<日期>|--aggressive]',
      example: 'git gc\n# 执行常规垃圾回收与优化\n\ngit gc --prune=now\n# 立即清理不可达对象（谨慎）\n\ngit count-objects -vH\n# 查看仓库对象统计',
      pitfalls: '1. --prune=now 会立即清理不可达对象，可能导致误删后难以通过 reflog/悬空对象找回；谨慎使用。\n2. gc 会改变仓库内部存储形式，但不应改变提交历史语义。\n3. 大仓库执行 gc 可能较慢；在 CI 或磁盘紧张时评估影响。',
      tags: ['维护', '优化', '垃圾回收', 'gc', 'prune']
    },
    {
      cmd: 'git fsck',
      title: '检查仓库完整性',
      cat: '排查',
      desc: '检查 Git 对象数据库的完整性和一致性，用于排查仓库损坏、悬空对象或引用问题。',
      usage: 'git fsck [--full] [--no-reflogs]',
      example: 'git fsck\n# 检查仓库完整性\n\ngit fsck --full\n# 更彻底检查\n\ngit fsck --no-reflogs\n# 不把 reflog 引用视为可达（排查悬空对象）',
      pitfalls: '1. 悬空对象（dangling）不一定是错误；可能是正常垃圾回收前的残留。\n2. 发现 missing/corrupt 对象时先备份仓库，再评估恢复方案。\n3. fsck 主要用于诊断，不会自动修复损坏对象。',
      tags: ['检查', '完整性', 'fsck', '悬空对象', '排查']
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