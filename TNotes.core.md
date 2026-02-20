# TNotes.core 核心脚本优化方案

## 一、背景

当前 29 个 TNotes.xxx 知识库共享一套核心脚本（位于 `.vitepress/tnotes/`，161 个文件，约 22K 行代码）。脚本在任意知识库中开发，通过 `tn:sync-scripts` 全量复制到其他仓库。

### 现存问题

- 各仓库脚本版本严重滞后，TNotes.introduction 的脚本是最新的，其他仓库普遍落后
- 29 个仓库各自独立存储一份脚本代码，Git 历史中脚本变更和笔记内容混杂
- 缺乏版本追溯机制，无法快速确认各仓库使用的脚本版本

### 目标

将核心脚本抽离为独立的 GitHub 仓库 `TNotes.core`，所有 TNotes.xxx 知识库通过 Git Submodule 引用同一份脚本，而非复制。

---

## 二、方案概述

### 采用 Git Submodule

- **TNotes.core**：独立 GitHub 仓库，存放核心脚本
- **各 TNotes.xxx**：通过 submodule 引用 TNotes.core，挂载到 `.vitepress/tnotes/`
- 每个仓库本地有完整的 tnotes-core 代码，可在任意知识库中直接编辑并推送
- 其他仓库需手动执行 `git submodule update --remote` 来拉取最新版本

### 决策记录

| 决策点 | 选择 | 理由 |
| --- | --- | --- |
| Submodule 挂载点 | `.vitepress/tnotes/` | 与当前路径一致，零路径改动 |
| 外围文件处理 | 留在各仓库，极少变动时手动更新 | 大部分外围文件几乎不变，不值得为此增加复杂度 |
| 批量同步方式 | 暂不处理，先确保试点成功 | 后续再考虑一键同步脚本 |
| 新仓库初始化 | 编写初始化脚本 | 自动化 submodule 添加和模板文件复制 |
| 迁移策略 | 先试点 TNotes.introduction，再逐步推广 | 降低风险，验证通过后再批量迁移 |

---

## 三、仓库结构

### TNotes.core 仓库

```text
TNotes.core/
├── commands/                     # 命令层
├── config/                       # 配置层
├── core/                         # 核心业务逻辑
├── services/                     # 服务层（文件监听、Git、笔记等）
├── types/                        # 类型定义
├── utils/                        # 工具函数
├── vitepress/                    # VitePress 前端层（组件、配置、插件、主题）
├── index.ts                      # 入口
└── README.md
```

即当前 `.vitepress/tnotes/` 目录的全部内容，也是 TNotes.core 仓库的根目录。

### TNotes.xxx 仓库（以 TNotes.introduction 为例）

```text
TNotes.introduction/
├── .gitmodules                   # 新增：submodule 声明
├── .vitepress/
│   ├── tnotes/                   # submodule → TNotes.core
│   ├── theme/index.ts            # 留在本仓库（一行重导出，几乎不变）
│   ├── config.mts                # 留在本仓库（引用 tnotes/ 内模块）
│   ├── env.d.ts                  # 留在本仓库
│   └── cache/                    # 仓库独有
├── .tnotes.json                  # 仓库独有配置
├── notes/                        # 仓库独有笔记内容
├── README.md                     # 仓库独有
├── sidebar.json                  # 仓库独有
├── package.json                  # 留在本仓库（极少变动时手动更新）
├── tsconfig.json                 # 留在本仓库
├── .github/workflows/deploy.yml  # 留在本仓库
├── .vscode/                      # 留在本仓库
├── public/                       # 留在本仓库
├── Settings.md                   # 留在本仓库
└── Loading.md                    # 留在本仓库
```

### 文件归属划分

**TNotes.core 管理（submodule 内）：**

- 核心脚本全部 161 个文件（commands、config、core、services、types、utils、vitepress）

**各仓库自行管理（submodule 外）：**

- `.tnotes.json` — 仓库独有配置（repoName、port、socialLinks 等）
- `notes/` — 笔记内容
- `README.md`、`sidebar.json`、`index.md` — 笔记目录
- `.vitepress/config.mts` — VitePress 站点配置
- `.vitepress/theme/index.ts` — 主题入口（一行重导出）
- `.vitepress/env.d.ts` — 类型声明
- `package.json`、`tsconfig.json` — 项目配置
- `.github/workflows/deploy.yml` — CI/CD
- `.vscode/settings.json`、`.vscode/tasks.json` — 编辑器配置
- `public/`、`Settings.md`、`Loading.md` — 静态资源和共用页面

---

## 四、日常工作流

### 编辑脚本

在任意 TNotes.xxx 中直接编辑 `.vitepress/tnotes/` 内的文件，VitePress HMR 即时生效。

### 提交脚本变更

```bash
# 1. 进入 submodule 目录，提交并推送到 TNotes.core
cd .vitepress/tnotes
git add -A
git commit -m "fix: 修复文件监听事件重复触发"
git push

# 2. 回到父仓库，更新 submodule 指针并提交
cd ../..
git add .vitepress/tnotes
git commit -m "update TNotes.core"
git push
```

### 其他仓库拉取最新脚本

```bash
cd ~/tnotesjs/TNotes.javascript
git submodule update --remote
git add .vitepress/tnotes
git commit -m "update TNotes.core"
git push
```

### 回滚到旧版本

```bash
cd .vitepress/tnotes
git checkout <commit-hash-or-tag>
cd ../..
git add .vitepress/tnotes
git commit -m "rollback TNotes.core to <version>"
```

### 新仓库使用指定版本

```bash
git submodule add https://github.com/tnotesjs/TNotes.core.git .vitepress/tnotes
cd .vitepress/tnotes
git checkout v1.2.0
cd ../..
git add .vitepress/tnotes .gitmodules
git commit -m "init TNotes.core at v1.2.0"
```

---

## 五、版本管理

由 Git Submodule 机制天然完成：

- 每个 TNotes.xxx 在 Git 中记录引用的 TNotes.core **精确 commit hash**
- 各仓库独立锁定版本，互不影响
- 更新、回滚都通过 Git 命令完成，无需额外工具
- 可选在 TNotes.core 上打 tag 标记里程碑版本（如完成一轮大重构后）

---

## 六、CI/CD 调整

各仓库的 `.github/workflows/deploy.yml` 需要修改 checkout 步骤：

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    submodules: true
```

---

## 七、注意事项

### 路径引用

挂载点选择 `.vitepress/tnotes/`，与当前路径完全一致，脚本中所有基于 `import.meta.url` 和相对路径的引用无需修改。

### Git 状态管理

在知识库中编辑了 submodule 内的脚本但尚未提交时，父仓库的 `git status` 会显示 `.vitepress/tnotes (modified content)`。建议养成习惯：先处理 submodule 内的提交，再处理父仓库的提交。

### 文件监听服务

`fsWatcherAdapter` 监听的是 `notes/` 目录，与 `.vitepress/tnotes/` 无关，不受 submodule 影响。

### 外围文件维护

`config.mts`、`package.json` 等留在各仓库的文件，在极少需要变更时（如新增依赖、调整 VitePress 配置），需手动同步到其他仓库。可以保留一个精简版 sync 脚本专门处理这些文件，也可以手动操作。

---

## 八、迁移计划

### 第一阶段：创建 TNotes.core

1. 在 GitHub 上创建 `tnotesjs/TNotes.core` 仓库
2. 将 TNotes.introduction 的 `.vitepress/tnotes/` 内容复制到 TNotes.core
3. 首次 commit，打 tag `v1.0.0`

### 第二阶段：试点 TNotes.introduction

1. 给 TNotes.introduction 打 tag 或开分支，便于回滚
2. 删除 `.vitepress/tnotes/` 目录
3. 执行 `git submodule add` 添加 TNotes.core
4. 修改 `.github/workflows/deploy.yml`，添加 `submodules: true`
5. 验证 `tn:dev` 启动正常
6. 验证文件监听、AboutPannel 更新、重命名检测等功能正常
7. 验证 `tn:build` 构建正常
8. 验证 GitHub Actions 部署正常

### 第三阶段：逐步推广

1. 选择 2-3 个活跃仓库迁移并验证
2. 批量迁移剩余仓库
3. 编写新仓库初始化脚本

### 第四阶段：清理

1. 移除旧的 `tn:sync-scripts` 脚本逻辑（或改为仅处理外围文件）
2. 更新相关文档
