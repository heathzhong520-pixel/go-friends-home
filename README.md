# GoFriends Home

GoFriends 独立开发者官网。页面包含作品发布、产品文档、订阅方案、开发理念与联系信息，并适配桌面端和移动端。

## 本地开发

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 构建

```bash
npm run build
npm run start
```

## 主要目录

- `app/page.tsx`：官网内容与交互
- `app/globals.css`：视觉样式与响应式布局
- `public/`：公开静态资源
- `.openai/hosting.json`：站点托管配置
