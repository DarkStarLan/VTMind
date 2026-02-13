<div align="center">

# VTMind

**AI-Powered Mind Mapping Tool**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

A fully open-source AI mind mapping tool that supports integration with various AI model APIs for intelligent mind map generation and editing.

[English](README.md) | [简体中文](README_CN.md)

</div>

---

## Features

### Core Capabilities

- **AI-Powered Generation**: Support for multiple AI models (OpenAI, Claude, DeepSeek, Moonshot, Alibaba Cloud, etc.)
- **Intelligent Structure**: AI intelligently recommends the most suitable mind map structure
- **Multiple Layouts**: Support for tree, radial, fishbone, network, timeline, and other structures
- **Custom Prompts**: Customize prompts for flexible content generation
- **Advanced Layout**: Optimized layout algorithm that automatically avoids node overlap

### Technical Features

- **Modern Stack**: Built with Vue 3 + TypeScript + Vite
- **Powerful Editor**: Powerful mind map editing based on AntV G6
- **Privacy First**: Local data storage with encrypted API Key storage
- **Import/Export**: Support for JSON and PNG format import/export
- **State Management**: State management using Pinia
- **Open Source**: Fully open source, freely deployable and customizable

---

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/DarkStarLan/VTMind.git

# Navigate to project directory
cd vtmind

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

After building, the `dist` directory contains all static files that can be deployed to any static server.

---

## Usage

### Basic Workflow

1. **Configure API Key**: Configure your AI API Key in the settings panel
2. **Enter Topic**: Enter your mind map topic
3. **Generate**: Let AI automatically generate the mind map structure
4. **Edit**: Manually edit and adjust node content
5. **Export**: Export and save your mind map

### Supported AI Models

| Provider  | Models         | Status    |
| --------- | -------------- | --------- |
| OpenAI    | GPT-4, GPT-3.5 | Supported |
| Anthropic | Claude 3       | Supported |
| DeepSeek  | DeepSeek Chat  | Supported |
| Moonshot  | Moonshot v1    | Supported |
| Alibaba   | Qwen           | Supported |

---

## Tech Stack

| Category         | Technology |
| ---------------- | ---------- |
| Framework        | Vue 3      |
| Language         | TypeScript |
| Build Tool       | Vite       |
| State Management | Pinia      |
| Graph Engine     | AntV G6    |
| Styling          | Native CSS |

---

## Project Structure

```
VTMind/
├── src/
│   ├── components/          # Vue components
│   │   ├── AIChatPanel.vue  # AI chat interface
│   │   ├── MindMap.vue      # Mind map canvas
│   │   ├── Toolbar.vue      # Toolbar component
│   │   └── ...
│   ├── mindmap-core/        # Mind map core engine
│   │   ├── core/            # Core logic
│   │   ├── layout/          # Layout algorithms
│   │   ├── render/          # Rendering engine
│   │   └── theme/           # Theme management
│   ├── services/            # Service layer
│   │   ├── aiService.ts     # AI integration
│   │   └── storageService.ts # Local storage
│   ├── stores/              # Pinia stores
│   │   ├── mindMapStore.ts  # Mind map state
│   │   └── settingsStore.ts # Settings state
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── dist/                    # Build output
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
└── tsconfig.json            # TypeScript configuration
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [AntV G6](https://g6.antv.vision/) - Graph Visualization Engine
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- All open source contributors

---

## Contact

- Issues: [GitHub Issues](https://github.com/yourusername/vtmind/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/vtmind/discussions)

---

<div align="center">

Made with ❤️ by the VTMind Team

</div>
