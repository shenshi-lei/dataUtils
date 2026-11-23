/* =========================================================
 * 工具：Docker 命令速查
 * 可搜索的常用 Docker / Docker Compose 命令参考，附中文说明、用法与示例。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  var CATS = ['全部', '镜像', '容器', '卷', '网络', 'Compose', '系统', '日志', '构建'];

  var COMMANDS = [
    {
      cmd: 'docker version',
      title: '查看 Docker 版本',
      cat: '系统',
      desc: '显示客户端与服务端（Docker Engine）的版本信息，用于确认安装与版本兼容性。',
      usage: 'docker version [选项]',
      example: 'docker version\n# 查看客户端与服务端版本\n\ndocker version --format "{{.Server.Version}}"\n# 只输出服务端版本号',
      tags: ['版本', '客户端', '服务端', 'engine']
    },
    {
      cmd: 'docker info',
      title: '查看 Docker 系统信息',
      cat: '系统',
      desc: '显示 Docker 引擎的详细信息，如容器/镜像数量、存储驱动、内核信息、运行时等。',
      usage: 'docker info [选项]',
      example: 'docker info\n# 查看完整系统信息\n\ndocker info --format "{{.ServerVersion}}"\n# 提取服务端版本',
      tags: ['信息', '系统', '存储', '驱动']
    },
    {
      cmd: 'docker pull',
      title: '拉取镜像',
      cat: '镜像',
      desc: '从镜像仓库（如 Docker Hub）拉取镜像。可指定标签（tag），不写默认是 latest。',
      usage: 'docker pull [选项] 镜像[:标签]',
      example: 'docker pull nginx\n# 拉取 nginx:latest\n\ndocker pull nginx:1.25\n# 拉取指定标签\n\ndocker pull registry.example.com/app:1.0\n# 拉取私有仓库镜像',
      tags: ['拉取', '下载', '镜像', 'registry']
    },
    {
      cmd: 'docker images',
      title: '列出本地镜像',
      cat: '镜像',
      desc: '列出本机已存在的镜像，可按名称过滤并查看大小、标签与创建时间。',
      usage: 'docker images [选项] [仓库[:标签]]',
      example: 'docker images\n# 列出全部本地镜像\n\ndocker images nginx\n# 过滤 nginx 相关镜像\n\ndocker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"\n# 自定义格式输出',
      tags: ['列表', '镜像', '查看']
    },
    {
      cmd: 'docker rmi',
      title: '删除镜像',
      cat: '镜像',
      desc: '删除本地镜像。若有容器正在使用该镜像，需先删除容器或使用 -f 强制（不推荐）。',
      usage: 'docker rmi [选项] 镜像 [镜像...]',
      example: 'docker rmi nginx:1.25\n# 删除指定镜像\n\ndocker rmi $(docker images -q)\n# 删除全部镜像（谨慎）\n\ndocker rmi -f <image_id>\n# 强制删除（谨慎）',
      tags: ['删除', '镜像', '移除']
    },
    {
      cmd: 'docker tag',
      title: '为镜像打标签',
      cat: '镜像',
      desc: '给本地镜像添加一个新的标签，通常用于准备推送到远程仓库。',
      usage: 'docker tag 源镜像[:标签] 目标镜像[:标签]',
      example: 'docker tag myapp:latest myrepo/myapp:v1.0\n# 打新标签\n\ndocker tag myapp:latest registry.example.com/team/myapp:dev\n# 准备推送到私有仓库',
      tags: ['标签', 'tag', '镜像', '推送']
    },
    {
      cmd: 'docker push',
      title: '推送镜像到仓库',
      cat: '镜像',
      desc: '将本地镜像推送到镜像仓库（需先 docker login 并打好对应标签）。',
      usage: 'docker push [选项] 镜像[:标签]',
      example: 'docker login\n# 登录仓库\n\ndocker push myrepo/myapp:v1.0\n# 推送镜像\n\ndocker push registry.example.com/team/myapp:dev',
      tags: ['推送', '上传', '仓库', 'registry']
    },
    {
      cmd: 'docker build',
      title: '构建镜像',
      cat: '构建',
      desc: '根据 Dockerfile 构建镜像。常用 -t 指定名称标签，. 表示当前目录为构建上下文。',
      usage: 'docker build [选项] 路径',
      example: 'docker build -t myapp:latest .\n# 在当前目录构建并打标签\n\ndocker build -f Dockerfile.dev -t myapp:dev .\n# 指定 Dockerfile\n\ndocker build --no-cache -t myapp:latest .\n# 不使用缓存重新构建',
      tags: ['构建', 'build', 'Dockerfile', '镜像']
    },
    {
      cmd: 'docker run',
      title: '创建并启动容器',
      cat: '容器',
      desc: '基于镜像创建并启动一个容器。常用 -d 后台运行、-p 端口映射、-v 挂载卷、--name 命名。',
      usage: 'docker run [选项] 镜像 [命令]',
      example: 'docker run hello-world\n# 运行测试镜像\n\ndocker run -d --name web -p 8080:80 nginx\n# 后台运行并映射端口\n\ndocker run -it --rm ubuntu bash\n# 交互式运行，退出后删除容器\n\ndocker run -d -v D:\\data:/data --name app myapp:latest\n# 挂载主机目录到容器（Windows 路径需注意）',
      tags: ['运行', '启动', '容器', 'run', '端口', '挂载']
    },
    {
      cmd: 'docker ps',
      title: '查看容器列表',
      cat: '容器',
      desc: '列出容器。默认只显示运行中的容器，使用 -a 可查看全部（含已停止）。',
      usage: 'docker ps [选项]',
      example: 'docker ps\n# 查看运行中的容器\n\ndocker ps -a\n# 查看全部容器（含已停止）\n\ndocker ps -q\n# 只输出容器 ID\n\ndocker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
      tags: ['列表', '容器', '查看', 'ps']
    },
    {
      cmd: 'docker start / stop / restart',
      title: '启动/停止/重启容器',
      cat: '容器',
      desc: '管理已存在容器的运行状态。start 启动已停止的容器，stop 发送 SIGTERM 后停止，restart 相当于先停后启。',
      usage: 'docker start 容器 | docker stop 容器 | docker restart 容器',
      example: 'docker start web\n# 启动名为 web 的容器\n\ndocker stop web\n# 停止容器\n\ndocker restart web\n# 重启容器\n\ndocker stop $(docker ps -q)\n# 停止所有运行中的容器（谨慎）',
      tags: ['启动', '停止', '重启', '容器']
    },
    {
      cmd: 'docker rm',
      title: '删除容器',
      cat: '容器',
      desc: '删除已停止的容器。运行中的容器需先停止，或使用 -f 强制删除（谨慎）。',
      usage: 'docker rm [选项] 容器 [容器...]',
      example: 'docker rm web\n# 删除已停止的容器\n\ndocker rm -f web\n# 强制删除（即使在运行）\n\ndocker rm $(docker ps -aq)\n# 删除全部容器（谨慎）',
      tags: ['删除', '容器', '移除']
    },
    {
      cmd: 'docker exec',
      title: '在运行容器中执行命令',
      cat: '容器',
      desc: '在正在运行的容器里执行命令，常用于进入 shell 调试。-it 用于交互式终端。',
      usage: 'docker exec [选项] 容器 命令 [参数...]',
      example: 'docker exec -it web sh\n# 进入容器的 shell（Alpine 常用 sh）\n\ndocker exec -it web bash\n# 进入 bash（部分镜像支持）\n\ndocker exec web ls /app\n# 在容器中执行单条命令',
      tags: ['执行', '进入', 'shell', 'bash', '调试']
    },
    {
      cmd: 'docker logs',
      title: '查看容器日志',
      cat: '日志',
      desc: '查看容器的标准输出/错误日志。-f 可持续跟随输出，适合排查问题。',
      usage: 'docker logs [选项] 容器',
      example: 'docker logs web\n# 查看全部日志\n\ndocker logs -f web\n# 持续跟随日志\n\ndocker logs --tail 100 web\n# 只看最后 100 行\n\ndocker logs -t web\n# 显示时间戳',
      tags: ['日志', '查看', 'follow', '排查']
    },
    {
      cmd: 'docker inspect',
      title: '查看对象详细信息',
      cat: '系统',
      desc: '以 JSON 格式输出容器/镜像/网络/卷等的详细元数据，适合脚本化或排查配置。',
      usage: 'docker inspect [选项] 名称|ID [名称|ID...]',
      example: 'docker inspect web\n# 查看容器详情\n\ndocker inspect --format "{{.NetworkSettings.IPAddress}}" web\n# 提取 IP 地址\n\ndocker inspect nginx:latest\n# 查看镜像详情',
      tags: ['详情', 'inspect', 'JSON', '元数据']
    },
    {
      cmd: 'docker cp',
      title: '容器与主机之间复制文件',
      cat: '容器',
      desc: '在容器和宿主机之间复制文件/目录。注意容器内路径写法是 容器名:路径。',
      usage: 'docker cp 源 目标',
      example: 'docker cp web:/app/log.txt .\\log.txt\n# 从容器复制到主机（Windows）\n\ndocker cp .\\config.json web:/app/config.json\n# 从主机复制到容器',
      tags: ['复制', '文件', 'cp', '传输']
    },
    {
      cmd: 'docker volume ls',
      title: '列出数据卷',
      cat: '卷',
      desc: '列出 Docker 管理的数据卷。数据卷用于持久化容器数据，独立于容器生命周期。',
      usage: 'docker volume ls [选项]',
      example: 'docker volume ls\n# 列出全部数据卷\n\ndocker volume inspect myvol\n# 查看数据卷详情',
      tags: ['卷', 'volume', '列表', '持久化']
    },
    {
      cmd: 'docker volume create / rm',
      title: '创建或删除数据卷',
      cat: '卷',
      desc: '创建新的命名卷，或删除不再使用的卷。删除前确保没有容器在使用。',
      usage: 'docker volume create 名称 | docker volume rm 名称',
      example: 'docker volume create appdata\n# 创建数据卷\n\ndocker volume rm appdata\n# 删除数据卷（需未被使用）',
      tags: ['卷', '创建', '删除', 'volume']
    },
    {
      cmd: 'docker network ls',
      title: '列出网络',
      cat: '网络',
      desc: '列出 Docker 网络。容器可加入同一网络以通过服务名互相访问。',
      usage: 'docker network ls [选项]',
      example: 'docker network ls\n# 列出全部网络\n\ndocker network inspect bridge\n# 查看默认 bridge 网络详情',
      tags: ['网络', 'network', '列表']
    },
    {
      cmd: 'docker network create',
      title: '创建网络',
      cat: '网络',
      desc: '创建自定义网络，便于多容器通过容器名互联（比默认 bridge 更适合 Compose/多容器场景）。',
      usage: 'docker network create [选项] 名称',
      example: 'docker network create mynet\n# 创建桥接网络\n\ndocker run -d --name web --network mynet nginx\n# 将容器加入指定网络',
      tags: ['网络', '创建', 'network', '互联']
    },
    {
      cmd: 'docker system df',
      title: '查看磁盘占用',
      cat: '系统',
      desc: '查看镜像、容器、本地卷等占用的磁盘空间，用于判断是否需要清理。',
      usage: 'docker system df [选项]',
      example: 'docker system df\n# 查看磁盘占用概览\n\ndocker system df -v\n# 显示更详细信息',
      tags: ['磁盘', '占用', '清理', 'system']
    },
    {
      cmd: 'docker system prune',
      title: '清理未使用资源',
      cat: '系统',
      desc: '清理已停止容器、悬空镜像、未使用网络等。谨慎使用，可能删除你还想保留的缓存数据。',
      usage: 'docker system prune [选项]',
      example: 'docker system prune\n# 交互式清理未使用资源\n\ndocker system prune -a\n# 同时删除未被任何容器使用的镜像（更激进）\n\ndocker system prune -f\n# 不提示确认（谨慎）',
      tags: ['清理', 'prune', '磁盘', '悬空镜像']
    },
    {
      cmd: 'docker compose up',
      title: '启动 Compose 服务',
      cat: 'Compose',
      desc: '根据 docker-compose.yml（或 compose.yaml）创建并启动服务。常用 -d 后台运行。',
      usage: 'docker compose up [选项] [服务...]',
      example: 'docker compose up\n# 前台启动并查看日志\n\ndocker compose up -d\n# 后台启动\n\ndocker compose up -d --build\n# 重新构建镜像后启动\n\ndocker compose up web db\n# 只启动指定服务',
      tags: ['compose', '启动', '多容器', 'yml']
    },
    {
      cmd: 'docker compose down',
      title: '停止并移除 Compose 资源',
      cat: 'Compose',
      desc: '停止并移除由 up 创建的容器、网络等。默认保留数据卷，使用 -v 可同时删除卷（谨慎）。',
      usage: 'docker compose down [选项]',
      example: 'docker compose down\n# 停止并移除容器与网络\n\ndocker compose down -v\n# 同时删除数据卷（会丢数据，谨慎）\n\ndocker compose down --rmi local\n# 同时删除本地构建的镜像',
      tags: ['compose', '停止', '删除', 'down']
    },
    {
      cmd: 'docker compose ps',
      title: '查看 Compose 服务状态',
      cat: 'Compose',
      desc: '列出当前 Compose 项目中各服务对应的容器状态。',
      usage: 'docker compose ps [选项] [服务...]',
      example: 'docker compose ps\n# 查看当前项目服务状态\n\ndocker compose ps -a\n# 包含已停止的容器',
      tags: ['compose', '状态', '列表']
    },
    {
      cmd: 'docker compose logs',
      title: '查看 Compose 日志',
      cat: 'Compose',
      desc: '查看 Compose 项目中服务的日志，可跟随输出或指定服务。',
      usage: 'docker compose logs [选项] [服务...]',
      example: 'docker compose logs\n# 查看全部服务日志\n\ndocker compose logs -f web\n# 跟随 web 服务日志\n\ndocker compose logs --tail 50 db',
      tags: ['compose', '日志', 'follow']
    },
    {
      cmd: 'docker compose exec',
      title: '在 Compose 服务容器中执行命令',
      cat: 'Compose',
      desc: '在某个已运行的 Compose 服务容器中执行命令，语法类似 docker exec。',
      usage: 'docker compose exec [选项] 服务 命令',
      example: 'docker compose exec web sh\n# 进入 web 服务容器 shell\n\ndocker compose exec db psql -U postgres\n# 在 db 服务中执行 psql',
      tags: ['compose', 'exec', '进入', '调试']
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
      title: 'Docker 命令速查',
      desc: '常用 Docker / Docker Compose 命令参考：支持按关键词搜索，查看命令含义、用法与示例。',
      search: true
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var searchInput = ui.el('input', 't-input cmdref-search');
    searchInput.type = 'search';
    searchInput.placeholder = '搜索命令、用途或关键词，如 run / compose / volume…';
    searchInput.setAttribute('aria-label', '搜索 Docker 命令');
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
    id: 'docker',
    group: '命令参考',
    title: 'Docker 命令',
    desc: '常用 Docker / Docker Compose 命令速查：支持搜索并查看含义、用法与示例',
    icon: 'i-code',
    keywords: ['docker', '容器', '镜像', 'compose', 'dockerfile', 'container', 'image'],
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