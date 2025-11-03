# 配置自动补全功能

## 功能说明

当加载 `.tnotes.json` 配置文件时，系统会自动检测缺失的配置字段，并使用默认值进行补全。

## 工作原理

1. **配置加载**：`ConfigManager` 加载 `.tnotes.json` 时会调用 `validateAndCompleteConfig()`
2. **字段检测**：对比当前配置与默认配置模板
3. **自动补全**：将缺失的字段使用默认值填充
4. **配置写回**：如果有修改，自动更新 `.tnotes.json` 文件

## 默认配置字段

### 必需字段

- `author`: 作者名称（默认：`"tnotesjs"`）
- `repoName`: 仓库名称（必需，无默认值）
- `keywords`: 关键词数组（默认：`[repoName]`）

### Sidebar 配置

- `sidebar_isNotesIDVisible`: 是否显示笔记 ID（默认：`true`）
- `sidebar_isCollapsed`: 是否默认折叠（默认：`true`）

### 目录配置

- `ignore_dirs`: 忽略的目录列表（默认：`[".vscode", "0000", "assets", "node_modules", "hidden", "demos"]`）
- `rootSidebarDir`: 根侧边栏目录（默认：`"../TNotes/sidebars"`）

### 服务配置

- `port`: 开发服务器端口（默认：`8000`）

### 根项目信息

- `root_item`: 项目基本信息
  - `icon`: 项目图标配置
  - `title`: 项目标题
  - `completed_notes_count`: 已完成笔记数量
  - `details`: 项目描述
  - `link`: 项目链接
  - `created_at`: 创建时间戳
  - `updated_at`: 更新时间戳
  - `days_since_birth`: 项目天数

### 导航配置

- `menuItems`: 菜单项数组
  - 默认包含：Home, Settings, TNotes, TNotes.yuque

### 社交链接

- `socialLinks`: 社交链接数组
  - 默认包含：语雀、B 站、GitHub

## 使用示例

### 最小配置

只需提供基本信息，其他字段会自动补全：

```json
{
  "author": "tnotesjs",
  "repoName": "TNotes.example",
  "keywords": ["example"],
  "root_item": {
    "title": "example",
    "completed_notes_count": 0,
    "details": "示例知识库",
    "link": "https://tnotesjs.github.io/TNotes.example/"
  }
}
```

### 自动补全结果

运行 `pnpm tn:update` 后会看到：

```
⚠️ 检测到配置缺失字段，已自动补全
ℹ️ 配置文件已更新
```

配置文件会自动添加所有缺失的字段。

## 技术细节

### 核心函数

#### `getDefaultConfig(repoName?: string)`

生成默认配置模板，根据仓库名动态生成相关配置。

#### `mergeConfig(target, source)`

深度合并配置对象，只添加缺失字段，不覆盖已有字段。

#### `validateAndCompleteConfig(config)`

验证并补全配置，返回补全后的配置和是否有修改的标志。

### 文件位置

- 默认配置模板：`.vitepress/tnotes/config/defaultConfig.ts`
- 配置管理器：`.vitepress/tnotes/config/ConfigManager.ts`
- 类型定义：`.vitepress/tnotes/types/config.ts`

## 注意事项

1. **不会覆盖现有字段**：只补全缺失的字段，保留用户自定义配置
2. **自动保存**：补全后会自动写回配置文件
3. **嵌套对象**：支持深度合并，例如 `root_item` 对象的字段也会被补全
4. **数组不合并**：如果字段已存在数组，不会与默认值合并，而是保留原值

## 测试

使用测试脚本验证配置补全功能：

```bash
pnpm exec tsx .vitepress/tnotes/scripts/testConfig.ts
```

测试结果会显示：

- 原始配置字段数量
- 补全后配置字段数量
- 新增的字段列表
- 生成完整配置文件供检查
