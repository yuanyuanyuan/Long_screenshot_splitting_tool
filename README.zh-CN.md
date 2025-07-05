# 长截图分割工具

**一个强大的、纯客户端的网页工具，用于智能地将长截图分割成多个易于管理的片段。**  
**[体验工具 »](https://yuanyuanyuan.github.io/Long_screenshot_splitting_tool/)**

---

[English](../readme.md) | 简体中文 | [繁體中文](./README.zh-TW.md)

---

## 关于项目

**长截图分割工具** 是一个纯客户端的网页工具，旨在解决管理和分享过长截图的普遍问题。无论是一段冗长的聊天记录、一个长篇网页，还是一篇详细的文章，这个工具都能让您上传图片，根据指定的高度将其分割成易于管理的片段，选择最相关的部分，然后将它们导出为ZIP压缩包中的独立图片或一个整合的PDF文档。

它速度快，安全（因为所有处理都在您的浏览器中完成，文件不会上传到任何服务器），而且极其直观。

### 技术栈

-   **HTML5, CSS3, JavaScript (ES6+)**
-   **Tailwind CSS**: 用于构建现代化的响应式界面。
-   **JSZip.js**: 用于在客户端创建ZIP压缩包。
-   **jsPDF.js**: 用于在浏览器中直接生成PDF文档。
-   **FileSaver.js**: 用于在浏览器中下载文件。

## 主要功能

✨ **纯客户端处理**: 无需上传文件。您的数据 100% 安全，保留在您的浏览器中。
🖼️ **自定义分割**: 您可以定义一个自定义的像素高度，将长截图精确地切割成大小合适的片段。
🖱️ **交互式选择**: 轻松选择或取消选择您想要保留的图片片段。
📦 **多种导出选项**: 将您选择的片段下载为 `.zip` 压缩包，或将它们编译成一个 `.pdf` 文件。
🌍 **多语言支持**: 完整的用户界面支持英语、简体中文和繁體中文。
🚀 **轻量且快速**: 无需后端依赖，确保了快速流畅的使用体验。

## 如何开始

无需安装！只需访问我们的官方网站：

**[https://yuanyuanyuan.github.io/Long_screenshot_splitting_tool/](https://yuanyuanyuan.github.io/Long_screenshot_splitting_tool/)**

### 使用方法

1.  **访问网站**: 打开上面的链接。
2.  **上传图片**: 将您的长截图拖放到上传区域，或点击选择文件。
3.  **设置分割高度**: 调整每个片段所需的高度。
4.  **处理**: 点击"开始分割"按钮。
5.  **选择片段**: 勾选您希望导出的片段。
6.  **下载**: 选择将您的成果下载为 ZIP 或 PDF 文件。

## 发展路线图

-   [x] 核心分割与导出逻辑 (ZIP/PDF)
-   [x] 多语言支持
-   [x] 现代化的响应式界面
-   [x] 为保护隐私而设的纯客户端处理
-   [ ] OCR文字识别，使图片内容可搜索
-   [ ] 为PDF导出提供智能排版/布局选项
-   [ ] 支持更多图片格式

请查看开放的 issues 以获取完整的功能建议（和已知问题）列表。

## 贡献

开源社区因贡献而成为一个学习、启发和创造的绝佳场所。我们**非常感谢**您所做的任何贡献。

如果您有任何能让这个项目变得更好的建议，请 fork 本仓库并创建一个 pull request。您也可以直接提交一个带有 "enhancement" 标签的 issue。

1.  Fork 本项目
2.  创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  将分支推送到远程 (`git push origin feature/AmazingFeature`)
5.  开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

Stark Yuan - [@StarkYuan_Pro](https://x.com/StarkYuan_Pro)

项目链接: [https://github.com/yuanyuanyuan/Long_screenshot_splitting_tool](https://github.com/yuanyuanyuan/Long_screenshot_splitting_tool)

---

Crafted with ❤️ by Stark Yuan 