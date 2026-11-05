# Cloudflare Pages 发布

此项目可作为纯静态 React + Vite 单页应用发布到 Cloudflare Pages。无需服务端、Pages Functions、数据库、API 密钥或额外的云存储。

## Vercel 发布（当前推荐）

项目已通过 `vercel.json` 配置 Vite 构建与 SPA 路由回退，生产地址：

<https://jiaru-personal-space.vercel.app>

后续在项目根目录执行：

```bash
npx vercel --prod
```

`.npmrc` 固定使用公开 npm registry，避免 Vercel 云端构建访问本机公司镜像失败；`.vercelignore` 排除本地缓存、测试产物与依赖目录。线上已验证 `/music` 和 `/products` 可直接刷新，MP3 与 MP4 Range 请求返回 `206 Partial Content`，播放及章节跳转不再触发 Cloudflare Pages 的整文件回退。

## Git 自动发布

在 Cloudflare 控制台的 Workers & Pages 中创建 **Pages** 项目，连接包含本项目的 GitHub / GitLab 仓库，使用以下配置：

| 配置 | 值 |
| --- | --- |
| 框架 | React (Vite) |
| 根目录 | 包含 `package.json` 的目录；本项目在仓库根目录时留空 |
| 构建命令 | `npm run build:pages` |
| 输出目录 | `dist` |
| Node.js | `22.20.0`（根目录 `.node-version` 已指定） |
| 运行时环境变量 | 无 |

提交源码、`package-lock.json` 和 `public/` 中的 MP3 / PDF / MP4 / 实录封面。`dist/`、`node_modules/`、`.npm-cache/`、`.artifacts/`、`.wrangler/` 已忽略。当前工作目录尚未初始化 Git；如选择此方式，需要先推送到自己的仓库。

`build:pages` 会先做 TypeScript 检查和 Vite 构建，再校验文件数量、单文件大小、生产入口、静态资源和 SPA 回退条件。Cloudflare 会自动安装依赖，无需把浏览器测试放入云端构建命令。

## 本地构建后直接上传

```bash
npm ci
npm run build:pages
```

在 Cloudflare Pages 选择直接上传，上传 **`dist` 文件夹的内容**，或者将其中内容压缩成 ZIP 后上传。上传包的根目录必须直接包含 `index.html`，不要上传整个源码目录或 `node_modules`。

也可使用项目已安装的 Wrangler：

```bash
npx wrangler login
npx wrangler pages project create jiaru-personal-space --production-branch main
npx wrangler pages deploy dist --project-name jiaru-personal-space --branch main
```

如使用已有项目，跳过创建步骤，并将名称替换为对应项目名。`wrangler.jsonc` 中的 `name` 也可同步修改。

直接上传项目以后不能原地改为 Git 集成；如果希望后续每次 Git push 自动发布，首次创建时就选择 Git 集成。

## 本地模拟 Pages

```bash
npm run build:pages
npm run preview:pages
```

打开 `http://127.0.0.1:8788`。另开终端可以针对这个生产构建运行浏览器测试：

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8788 npm run test:e2e
```

这会使用本机 Google Chrome，覆盖导航、音频、花朵和粒子动效、搜索、产品交互预览、320–1440px 布局及降级。首次安装需有 Google Chrome。默认 `npm run test:e2e` 仍测试 Vite 开发环境。

## 路由、资源与当前范围

- 使用 Pages 官方的 SPA 默认行为：构建根目录没有 `404.html` 时，`/resume`、`/music`、`/products#forever`、`/playlists?list=qq-kpop` 等路径回退到 `index.html`，由 React Router 处理；旧的 `#swagger` 会在页面内迁移为 `#forever`。
- 不添加 `/* /index.html 200`：当前 Wrangler 将此规则判为循环并忽略。`check:pages` 会防止根目录 `404.html` 或未经核验的 `_redirects` 改变回退行为。
- 所有音乐、溪流音效、产品实录、新版简历 PDF、JS 和 CSS 由同站点提供；音视频仍需用户点击才播放。外部网易云、QQ 音乐和 Suno 链接保持原平台跳转。
- Pages 当前可能对音频 Range 请求返回完整 `200` 响应，不能强制假设为 `206`。当浏览器报告的可跳转范围不包含目标时间时，播放器会按需取回当前原曲并缓存为 object URL，再恢复目标进度与播放/暂停状态。每首仅约 4.58 / 5.13 MiB，缓存仅留在当前页面，离开音乐页会释放；支持 Range 的主机继续直接播放原路径。
- 页面包括完整首页、简历、AI 音乐创作、精选歌单与星空幻梦主题的 AI 产品作品。`/products` 已按 Forever / 雨窗顺序整理两份站内案例与完整指南，不依赖原飞书文档访问权限。
- `/products` 已按 Forever v1.0.0 更新内容，提供百度网盘安装包入口和提取码，并加入两段完整无声实录：Forever 5.14 MiB，雨窗 18.84 MiB。视频为 H.264 / yuv420p / 24fps / 1920px 宽，带 faststart 与原片封面；直到访客点击播放或章节才设置视频源。章节跳转不受 Range 返回完整 `200` 影响：按需将不可寻址的视频缓存为一个 object URL，保留播放意图，离页撤销；两份缓存合计约 23.98 MiB。
- 产品页交互预览使用当前浏览器保存的试写与固定电台示例，不调用原项目账号、AI、音乐或语音服务。用户提供的源码 ZIP、原文响应、本地服务配置、数据库均不进入 `dist`。
- 歌单是 2026-09-24 核验的完整数据快照，不会在访客打开页面时重新调用音乐平台接口。
- 精选歌单路由在首页空闲时预加载；拼音词典仅在搜索框聚焦后按需加载。Vercel 对 HTML / SPA 路由发送 `no-store`，哈希静态资源发送长期 immutable 缓存，避免代理缓存旧入口后引用失效分包。
- 所有站内链接通过统一导航门控加载目标页面代码、CSS 和首屏关键视觉资源，准备期间留在当前页并显示等待提示，完成后再更新路由；音频、完整视频等大媒体不进入导航预载。
- `index.html` 内含无需 React 的首屏启动态；主应用挂载后淡出，15 秒仍未启动会显示网络提示和重新加载按钮。构建检查会验证该静态恢复入口存在。

## 平台限制

当前构建为 30 个文件，总计约 36.75 MiB；最大文件 `rain-writer.mp4` 为 18.84 MiB。

| 项目 | Cloudflare Pages 限制 | 当前构建 |
| --- | --- | --- |
| 单文件大小 | 25 MiB | 最大 18.84 MiB |
| Free 站点文件数 | 20,000 | 27 |
| 控制台拖放文件数 | 1,000 | 27 |

后续增加作品后重新执行 `npm run build:pages`，以脚本输出为准。

官方参考：[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[SPA 与静态资源](https://developers.cloudflare.com/pages/configuration/serving-pages/)、[平台限制](https://developers.cloudflare.com/pages/platform/limits/)、[直接上传](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## 本次核验结果（2026-09-24）

- `npm run build:pages` 通过，包含新行星渲染、两段实录、Forever v1.0.0 内容与此前的音频跳转兼容修复，报告见 `.artifacts/products-build.log`。
- Wrangler 4.137.0 的本地 Pages 环境正确提供子页面、MP3、MP4、封面和简历附件，所有资源都来自生产 `dist`。
- 29 项浏览器验证全部通过，涵盖整站及 9 项产品相关验证。报告见 `.artifacts/pages-products-v2-e2e.log`。
- 最终调整手机星环取景与视频章节时间后，9 项产品验证再次全部通过。覆盖 320–1440px 布局、GPU 动画/清理、真实视频解码/跳转、暂停时拖动、全屏、互斥播放、后台/离屏暂停、不可寻址回退、错误重试和 object URL 释放，报告见 `.artifacts/pages-products-v2-final.log`。
- 修复前 Pages 下跳转 86 秒返回 0；修复后 48 / 86 / 52 秒均准确跳转，刷新恢复 65 秒，暂停保持，缓存可复用并在离页后释放。
- 发布 ZIP：`.artifacts/jiaru-cloudflare-pages.zip`，约 35.35 MiB；27 个文件逐字节与 `dist` 对比一致，根目录包含 `index.html`，无源码附件或数据库；校验记录见 `.artifacts/pages-products-v2-package.json`。
- SHA-256：`023644d43bc426d4a7f0a7899b2cb531e82304fa698282c89a81202ae3557a92`。
- 当前自动验证覆盖桌面 Chrome 和移动视口；不等同于远端 CDN、真实手机或各地区访问质量的实测。

本次仅准备和本地核验发布内容，尚未创建远端 Pages 项目或上传站点。
