# Markdown Transfer

一款简洁优雅的 Markdown 转富文本工具，支持实时预览、一键复制，以及导出为 Word (.docx) 和 TXT 文件。

## 功能

- **实时预览**：左侧输入 Markdown，右侧即时显示富文本效果
- **复制富文本**：一键复制到剪贴板，直接粘贴到 Word、WPS 等文档中
- **导出 Word**：将 Markdown 转换为 `.docx` 文件下载
- **导出 TXT**：将 Markdown 导出为纯文本文件
- **客户端处理**：所有转换在浏览器本地完成，数据不上传服务器，保护隐私

## 技术栈

- [Next.js](https://nextjs.org/) - React 框架
- [TypeScript](https://www.typescriptlang.org/)
- [marked](https://marked.js.org/) - Markdown 解析
- [docx](https://docx.js.org/) - Word 文档生成
- CSS Modules

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 构建

```bash
npm run build
```

构建输出位于 `.next/` 目录。

## 部署

支持部署到 Vercel、Netlify 或任何支持静态/服务端渲染的托管平台。

## 支持的 Markdown 语法

- 标题（H1-H6）
- **粗体** 和 *斜体*
- 有序列表和无序列表
- 代码块和行内代码
- 引用块
- 链接
- 表格

## License

Apache License 2.0
