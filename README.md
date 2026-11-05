# JIARU · 个人空间

采用暖白、薄荷青与淡杏粉玻璃质感的个人博客：粒子小提琴首页、水元素个人简历、可试听的 AI 音乐创作作品集、花元素精选歌单，以及星空幻梦主题的 AI 产品作品页。

## 本地运行

需要 Node.js 22.20+（`.node-version` 固定为 22.20.0）。

```bash
npm install
npm run dev
```

打开终端中 Vite 输出的地址，默认 `http://localhost:5173`。

```bash
npm run typecheck
npm run build
npm run preview
```

项目使用自己的 `.npm-cache`，避免当前机器全局 npm 缓存的文件权限问题，不修改全局配置。

## Cloudflare Pages

已配置静态 Pages 项目，构建命令 `npm run build:pages`，输出目录 `dist`。Node 版本已固定，无需运行时环境变量。

`npm run preview:pages` 可在 `http://127.0.0.1:8788` 模拟 Pages；支持子页面直接打开和刷新。Git 自动发布、ZIP 上传、Wrangler 命令与核验说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。发布前先运行 `npm run build:pages`，不要上传源码目录。

## Vercel

当前生产版本发布于 <https://jiaru-personal-space.vercel.app>。`vercel.json` 提供 Vite SPA 深层路由回退，`.vercelignore` 排除本地缓存与测试产物；后续可在项目根目录运行 `npx vercel --prod` 更新。Vercel 线上媒体请求已验证返回 `206 Partial Content`，更适合当前站点的音频进度和产品视频章节跳转。

## 浏览器验证

```bash
npm run test:e2e
```

使用本机 Google Chrome。测试覆盖实际 WebGL 绘制与暂停、分类入口、返回键及键盘、320–1440px 布局、移动导航、减少动态效果和 WebGL 不可用时的降级。简历额外验证章节跳转、新版 PDF 下载、音频实际信号与空闲淡出、音频关闭和路由离开时的资源释放。音乐页验证两首原曲播放、进度、静音、快速切歌、状态恢复、离页清理，以及真实频谱向 GPU uniform 的传递。歌单页验证五份完整曲目与原始数据的顺序、版本和链接，拼音/多关键词/输入法搜索，历史恢复，以及真实 GPU 花朵开合与资源清理。产品页验证两份完整站内指南、试写 IME 与本地保存、三种外观共享选择、限时主题优先级和银河生命周期；实录验证真实视频解码、章节跳转、暂停时拖动、全屏、互斥播放、后台/离屏暂停、加载重试和缓存清理。截图写入 `.artifacts/`，包括五页的桌面和移动端截图。

## 页面与内容

- `/`：完整首页。
- `/resume`：完整个人简历，按学习经历、项目经历、实习经历、技能组织，含新版 PDF 下载与作品链接。
- `/music`：AI 音乐创作作品集，两首原曲页内播放与频谱粒子、创作理念、创作流程和运营构想。
- `/playlists`：五份精选歌单、完整曲目信息与原平台跳转，以及可开合、随光标转动的三维轻纱花朵。
- `/products`：Forever v1.0.0 与雨窗两份完整案例、实际操作录屏、交互预览与 12 个可展开指南章节，首屏为实时粒子银河与云带行星。
- 未知地址：返回首页提示。
- 品牌暂用 `JIARU`，分类标题、简介、地址、预览文案集中在 `src/data/site.ts`。
- 简历事实与成果来自用户上传的内容拓展专员版 PDF，集中在 `src/data/resume.ts`；原始文件位于 `public/files/zhou-jiaru-resume.pdf`。
- 水声默认关闭，点击「开启水声」才创建音频上下文；页面没有自动播放音频。

## 组件结构

```text
src/
  App.tsx
  styles.css                  视觉变量、玻璃材质、响应式
  data/site.ts                品牌与分类内容
  data/resume.ts              简历资料、项目、实习和技能
  data/music.ts               两首作品的文档内容、试听链接和音频资料
  data/music-waveforms.json   从原曲提取的 RMS 波形
  data/playlists-source.json  原平台核实的五份歌单与全部曲目
  data/playlists.ts           策划主题、显示配置与拼音搜索索引
  data/products.ts            两份产品指南、功能、架构与版本边界
  pages/
    ResumePage.tsx            独立简历页面、章节导航和阅读进度
    resume.css                水元素玻璃样式、响应式布局
    MusicPage.tsx             音乐试听、两首歌的完整创作故事
    music.css                 声环、粘性播放器与作品排版
    PlaylistsPage.tsx          花卉歌单卡片、搜索、逐曲跳转和 URL 选择
    playlists.css             音乐花园、曲目排版与手机横向主题选择
    ProductsPage.tsx           产品案例、站内章节和完整指南
    products.css              星空夜景、玻璃预览和响应式布局
  hooks/
    useWaterSound.ts          手势解锁的自然溪流录音、淡出和音频清理
    useMusicPlayer.ts         单一音频实例、频谱采样、状态保存与清理
  components/
    Navbar.tsx                桌面导航、移动菜单
    HeroSection.tsx           首屏、动态时间问候、行动按钮
    ParticleRibbon.tsx        Three.js 生命周期、鼠标交互与动效控制
    WaterBackdrop.tsx         水面渲染、指针涟漪与生命周期
    MusicParticles.tsx        音频响应的矩形粒子声环
    MusicTransport.tsx        播放、切歌、原曲波形与音量控制
    PlaylistFlower.tsx        花朵交互、动效控制、降级与生命周期
    DreamGalaxy.tsx           银河生命周期、光标视差与动效控制
    ProductFilm.tsx           按需实录、章节/进度/全屏、互斥播放和释放
    ProductDemos.tsx          本地试写、天气与电台外观/推荐策略演示
    ExploreGrid.tsx           四个导览入口及对应图形
    StatsBar.tsx              页脚与主题信息
    SectionPreview.tsx        原生 dialog，URL/返回键/键盘支持
    Icon.tsx                  统一 SVG 图标
  graphics/
    particleShaders.ts        粒子顶点/片元着色器
    waterShaders.ts           低幅度水面法线、光照与局部涟漪
    musicShaders.ts           低频呼吸、中频形变、高频细节与环形扫描
    flower.ts                 花瓣开合曲面、轻纱着色器、花茎与飘落花瓣
    galaxy.ts                 星尘旋臂、程序化星云、行星与光环着色器
    dreamPlanet.ts            气体云带、昼夜交界、大气与星环相互投影
```

UI 使用 Tailwind CSS 4 和自定义材质样式，入场动画使用 Framer Motion。独立页面和粒子组件按需加载，Three.js 与动画依赖分别拆包。

## 粒子实现

- 单个 `BufferGeometry`、`Points`、`ShaderMaterial`；桌面 6000 个粒子、初始化时窄屏 4000 个。
- 粒子位置在 GPU 中由稳定随机种子计算；琴身、琴颈、四根琴弦、琴头、弦轴、拉弦板、琴弓及外围数据流共同构成轮廓。
- 片元着色器裁切矩形，并用细微切面明暗模拟微型方块。没有视频、GIF、圆形点精灵或粒子图片。
- 顶点着色器负责垂直流动、慢速摆转、正弦扭曲、扰动、闪烁、呼吸脉冲和沿螺旋上升的扫描。
- 鼠标经射线映射到粒子平面，局部粒子避让；离开后以指数平滑回归。
- 限制像素比；页面隐藏或粒子离开视口时停止 RAF；清理观察器、监听器和 GPU 资源。
- 默认遵循 `prefers-reduced-motion`，用户仍可手动播放/暂停。WebGL 不可用或上下文丢失时显示静态示意及重试按钮。

调整轮廓与扫描：`src/graphics/particleShaders.ts`。
调整数量、配色、镜头：`src/components/ParticleRibbon.tsx`。

## 简历的水元素

- 地址：`http://localhost:5173/resume`，支持 `#education`、`#projects`、`#experience`、`#skills` 直接定位。
- 参考 [liquid-refraction-lab](https://github.com/feitangyuan/liquid-refraction-lab) 的液面折射思路，独立实现 GLSL 背景；没有引入或复制其 liquid1 实现。
- 背景通过浅水面法线折射薄荷与杏粉色域，叠加柔和焦散；光标每隔至少 135ms、移动至少 22px 才产生一圈衰减涟漪，最多保留 8 圈，触屏仅点击响应。
- 内容使用真实 DOM，正文不参与水面变形；小水滴雕塑用 CSS 透明材质制作，没有图片、视频或 GIF。
- 水面绘制限制为约 30fps、像素比不超过 1.25；隐藏页面暂停 RAF，离开路由释放 Three.js 几何体、材质和上下文。暂停开关同时冻结水滴雕塑；减少动态效果默认静止。
- 水声采用 gluckose 的 CC0 林间溪流实地立体声录音，保留真实水流细节；45 秒循环在素材内做 3 秒交叉淡化，并轻柔处理低频轰鸣和高频。来源与授权见 `public/audio/CREDITS.md`，制备脚本见 `scripts/prepare-stream-audio.py`。
- 音频在用户点击后按需加载，光标仅小幅改变音量，不改变音高和音色；以 0.28 秒时间常数渐入，停止移动 0.65 秒后以 0.55 秒时间常数渐弱。关闭时平滑淡出并暂停 AudioContext，离开页面取消未完成加载并关闭上下文。音频不可用时提供状态提示。
- 桌面采用左侧粘性章节导航，手机为粘性横向章节栏，音效开关始终可达。邮箱与电话仅由用户点击打开客户端。

## 音乐创作与声音可视化

- 地址：`http://localhost:5173/music`，支持 `#stay-with-me` 和 `#rain-talk` 定位作品。
- 内容来自[周珈如-音乐内容创作作品集](https://dcnpzhkntn0i.feishu.cn/wiki/Zvi4wqfH1ioarokfzKNc35E0nKh)第一部分，版本 404；运营延伸标注为构想，未将设想写成已取得的成果。
- `public/audio/music/` 保留两份上传 MP3 原件，未压缩或转码。`scripts/prepare-music.py` 使用 `imageio_ffmpeg` 解码单声道采样，提取每首 120 段 RMS 包络，归一化后仅用于进度条绘制。
- 单个 HTMLAudioElement 与 MediaElementAudioSourceNode，用户点击后才建立 AudioContext。输出经 GainNode 控制音量，再经 AnalyserNode 送至扬声器；两首歌共享这条链路，切歌不会叠播。
- FFT 2048，分别采样 35–220 Hz、220–2400 Hz、2400–10000 Hz 及时间域 RMS；平滑后的强度传入 GPU，驱动呼吸、形变、亮度和细节。暂停音乐时能量衰减，声环恢复缓慢流动。
- 声环使用桌面 6000 / 窄屏 4000 个矩形粒子、BufferGeometry / Points / 自定义 ShaderMaterial；沿用首页的矩形切面片元着色器。没有视频或 GIF。
- 播放器在阅读作品时粘在页面顶部。保存选曲、位置、音量及静音状态，刷新保持暂停。播放结束后可重播；快速切歌取消旧的播放请求，离开音乐页停止音频并释放 AudioContext 和 GPU 资源。
- 兼容 Cloudflare Pages 的完整音频响应：请求跳转的位置不可寻址时，按需将原曲缓存为 object URL 后恢复进度；保留暂停意图，切歌取消旧请求，离页撤销所有 object URL。支持 Range 的主机保持原路径播放。
- 粒子可单独暂停；系统减少动态效果默认静止，播放音乐不强制启动动画。后台或离屏停止渲染；WebGL / Web Audio 不可用时仍保留原曲播放和正文。

## 后续扩展

五个页面均已实现。首次打开时，`index.html` 内置的启动画面会在 React 与主样式尚未执行前立即显示；15 秒仍未启动则给出网络提示和重新加载按钮。站内链接统一通过 `PreparedNavigation`：悬停、聚焦或按下时预加载，点击后在当前页面显示等待层，目标代码、样式和首屏关键视觉资源完成后才切换；音频与视频仍按用户操作加载。增加新分类时需同时在 `App.tsx` 与 `pageLoaders.ts` 注册页面和关键资源。`SectionPreview` 目前仅用于未知地址提示。静态托管需将非资源地址回退到 `index.html`，以支持 BrowserRouter 的直接访问和刷新。

## 精选歌单与交互花朵

- 地址：`http://localhost:5173/playlists`，可用 `?list=netease-kpop`、`netease-cpop`、`netease-classical`、`qq-ost`、`qq-kpop` 分享所选歌单。浏览器返回和刷新均恢复选择。
- 内容来自作品集第二部分。2026-09-24 核验网易云 14 / 37 / 21 首，QQ 音乐 22 / 58 首，共 152 条收录，包含跨歌单重复。网易云通过公开作者歌单定位；QQ 通过文档海报二维码还原原始歌单 ID。
- `scripts/prepare-playlists.py` 将 `.artifacts/` 中的平台响应整理到 `src/data/playlists-source.json`。网易云按 `trackIds` 补全歌曲并保持曲序，QQ 保留完整 `songlist`；保留 Live、Remix、翻唱和古典演奏版本，不依赖截图推测标题。
- 默认显示 8 首，可展开完整歌单。搜索匹配歌名、歌手、专辑和别名，支持多关键词 OR、中文全拼与简拼；组合输入结束前不更新搜索结果。首页空闲时预加载约 49 KiB 的歌单路由，`pinyin-pro` 仅在搜索框获得焦点后按需加载并为当前歌单建立索引，不阻塞页面跳转。
- 歌曲和完整歌单通过 HTTPS 链接在新标签页打开原平台；不代理播放或下载平台音频。页面记录核验日期，后续原平台变化不会自动同步至本地快照。
- 花朵独立实现，参考用户照片和补充视频的半透明花瓣、开合与飘动。47 片三维花瓣分为六层，每层有开放/闭合两组曲面；顶点着色器插值与轻微风动，片元着色器提供褶皱光照、细丝与叶脉。茎叶和四片飘落花瓣同场景渲染，无图片、视频或 GIF 替代。
- 光标轻转花朵，点击、触屏或 Enter / 空格切换开合；主题切换插值配色。约 30fps、像素比最高 1.65。支持独立暂停、减少动态效果、离屏/后台停帧和路由离开清理；WebGL 不可用时显示矢量花卉与重试，所有歌单功能继续可用。

## AI 产品与星空幻梦

- 地址：`http://localhost:5173/products`，支持 `#forever` 和 `#rain-writer`；旧的 `#swagger` 会兼容跳转到 `#forever`。两份飞书文档重组为可直接阅读的产品定位、交互、设计理念与完整指南，页面没有原文跳转依赖。
- 内容依据：原 Swagger 文档版本 29 已按当前品牌名 Forever 呈现，并以用户最新提供的 Forever AI Radio Local v1.0.0、PRODUCT.md 和 DEPLOYMENT.md 更新；雨窗文档版本 99。核验三外观共享播放器、17% 默认熟悉度、严格同主题候选、限时策略持久化、Lab 分页保存与 WebSocket 同步；补充本地安装、配置、备份和升级。
- 星空参考用户提供的银河视频，使用首页薄荷青、杏粉、雾紫与暖白高光，夜色样式限定在 `.products-theme` 内，离页不改变其他页面。
- Three.js `BufferGeometry / Points / ShaderMaterial` 绘制桌面 8800 / 手机 5200 个星尘，带散射的三个旋臂围绕噪声星云。行星用多尺度湍流云带、统一物体空间侧光、昼夜交界与大气边缘；星环为带不同密度和间隙的透明环面，与球面相互投影。整个银河不使用图片、视频或 GIF。
- 光标轻移改变视角；30fps、像素比上限 1.6、MSAA 抗锯齿；支持独立暂停、减少动态效果、后台与离屏停帧、WebGL 静态降级和路由离开资源释放。
- 各案例中的实际录屏保留完整时长（Forever 约 124 秒，雨窗约 120 秒），与交互预览分别呈现。视频封面取自原始实录，注明无音轨，不自动播放；章节入口按实际操作划分。支持全屏、键盘进度、同时只播放一个，后台/离屏暂停，离页取消请求并释放媒体和 object URL。
- `public/video/products/` 包含两份 H.264 / yuv420p / faststart / 24fps / 1920px 宽的视频与封面；雨窗 18.84 MiB，Forever 5.14 MiB，均低于 Pages 单文件 25 MiB。`scripts/prepare-product-videos.py` 可从用户原件重复制备，不更改原件；Forever 的媒体文件继续保留旧的 `swagger` 文件名以避免资源迁移。视频无 `src` 直到用户操作；不支持目标寻址的主机在手动跳转时按需取回当前视频为 Blob，每份至多缓存一份，离页撤销。
- 雨窗预览可切五种天气，试写保存到 `localStorage` 的 `jiaru-rain-writer-preview-v1`，组合输入期间不触发保存；存储失败有明确提示。预览不连接原应用账号或 AI，不自动播放声音。
- Forever 用固定示例展示经典电台 / 唱片沉浸 / 玻璃桌面共享选中内容；熟悉比例默认 17%，临时白噪音主题覆盖通用比例，“演示到期”恢复原值。页面以阿里云 OSS 提供四个桌面安装包直链，并保留百度网盘和夸克网盘链接及各自提取码。没有真实歌曲播放、联网推荐或虚构 AI 应答。
- 原项目账号、Node.js / SQLite 服务与第三方服务配置均不移植到展示页。原文、源码 ZIP 与核验材料只在忽略目录 `.artifacts/` 中，不包含在 Pages 发布包。
