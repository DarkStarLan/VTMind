<div align="center">

# VTMind

**AI 驱动的思维导图工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

一个完全开源的 AI 思维导图工具，支持接入多种 AI 模型 API 来智能生成和编辑思维导图。

[English](README.md) | [简体中文](README_CN.md)

</div>

---

## 功能特性

### 核心能力

- **AI 智能生成**：支持多种 AI 模型（OpenAI、Claude、DeepSeek、Moonshot、阿里云百炼等）
- **智能结构推荐**：AI 智能推荐最适合的思维导图结构
- **多种布局**：支持树状、放射状、鱼骨图、网络图、时间轴等多种结构
- **自定义提示词**：自定义提示词，灵活控制内容生成
- **高级布局算法**：优化的布局算法，自动避免节点重叠

### 技术特性

- **现代技术栈**：基于 Vue 3 + TypeScript + Vite 构建
- **强大编辑器**：基于 AntV G6 的强大思维导图编辑功能
- **隐私优先**：本地数据存储，API Key 加密保存
- **导入导出**：支持 JSON、PNG 格式导入导出
- **状态管理**：使用 Pinia 进行状态管理
- **开源免费**：完全开源，可自由部署和定制

---

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/vtmind.git

# 进入项目目录
cd vtmind

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 部署

构建完成后，`dist` 目录包含所有静态文件，可以部署到任何静态服务器。

---

## 使用说明

### 基本流程

1. **配置 API Key**：在设置面板中配置你的 AI API Key
2. **输入主题**：输入思维导图主题
3. **生成导图**：让 AI 自动生成思维导图结构
4. **编辑调整**：手动编辑和调整节点内容
5. **导出保存**：导出保存你的思维导图

### 支持的 AI 模型

| 提供商 | 模型 | 状态 |
|--------|------|------|
| OpenAI | GPT-4, GPT-3.5 | 已支持 |
| Anthropic | Claude 3 | 已支持 |
| DeepSeek | DeepSeek Chat | 已支持 |
| Moonshot | Moonshot v1 | 已支持 |
| 阿里云 | 通义千问 | 已支持 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 |
| 开发语言 | TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 图形引擎 | AntV G6 |
| 样式方案 | 原生 CSS |

---

## 项目结构

```
VTMind/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── AIChatPanel.vue  # AI 对话界面
│   │   ├── MindMap.vue      # 思维导图画布
│   │   ├── Toolbar.vue      # 工具栏组件
│   │   └── ...
│   ├── mindmap-core/        # 思维导图核心引擎
│   │   ├── core/            # 核心逻辑
│   │   ├── layout/          # 布局算法
│   │   ├── render/          # 渲染引擎
│   │   └── theme/           # 主题管理
│   ├── services/            # 服务层
│   │   ├── aiService.ts     # AI 集成
│   │   └── storageService.ts # 本地存储
│   ├── stores/              # Pinia 状态管理
│   │   ├── mindMapStore.ts  # 思维导图状态
│   │   └── settingsStore.ts # 设置状态
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
├── public/                  # 静态资源
├── dist/                    # 构建输出
├── package.json             # 依赖配置
├── vite.config.ts           # Vite 配置
└── tsconfig.json            # TypeScript 配置
```

---

## 贡献指南

我们欢迎各种形式的贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 开发规范

- 遵循现有的代码风格
- 编写有意义的提交信息
- 为新功能添加测试
- 及时更新文档

---

## 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [AntV G6](https://g6.antv.vision/) - 图可视化引擎
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- 所有开源贡献者

---

## 联系方式

- 问题反馈：[GitHub Issues](https://github.com/yourusername/vtmind/issues)
- 讨论交流：[GitHub Discussions](https://github.com/yourusername/vtmind/discussions)

---

<div align="center">

用 ❤️ 制作 by VTMind 团队

</div>

