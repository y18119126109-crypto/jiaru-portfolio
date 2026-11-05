export const weatherModes = [
  { id: 'rain', name: '雨', symbol: '◌', note: '雨滴停留、汇聚，再沿着玻璃滑落。', sound: '稳定的粉噪雨声与细碎水花' },
  { id: 'drizzle', name: '细雨', symbol: '⋮', note: '更细、更疏的雨线，留一点轻柔的空白。', sound: '更明亮、轻盈的屋檐小雨' },
  { id: 'storm', name: '暴雨', symbol: 'ϟ', note: '密集的雨幕，把窗外和心里的世界隔开。', sound: '厚重雨声与低频雷鸣' },
  { id: 'snow', name: '雪', symbol: '✳', note: '远近不同的雪花，慢慢落进清冷的夜色。', sound: '低通粉噪与缓慢起伏的软风' },
  { id: 'fog', name: '雾', symbol: '≋', note: '只留下朦胧水气，让注意力回到文字。', sound: '380 Hz 的轻微低频呼吸声' },
] as const

export type WeatherId = (typeof weatherModes)[number]['id']
export type GuideSection = { title: string; items: { title: string; text: string }[] }

export type ProductRecording = {
  id: string; name: string; title: string; description: string; edition: string
  src: string; poster: string; duration: number; note: string
  chapters: { time: number; title: string }[]
}
export const productRecordings: Record<'rain' | 'forever', ProductRecording> = {
  rain: {
    id: 'rain-writer', name: '雨窗', title: '推开这扇窗，看一场真实的雨。',
    description: '从天气调节到 AI 抽屉，沿着一次实际操作，走进雨窗。',
    edition: 'RAIN WRITER / v0.4',
    src: '/video/products/rain-writer.mp4', poster: '/video/products/rain-writer-poster.jpg',
    duration: 119.91, note: '原始操作实录 · 无音轨 · 保留完整操作与响应等待，可点击章节跳看。',
    chapters: [{ time: 0, title: '天气与氛围' }, { time: 32, title: '心情分析' }, { time: 53, title: '笔记搜索' }, { time: 94, title: '对话陪伴' }],
  },
  forever: {
    id: 'forever', name: 'Forever', title: '一台电台，从一句话开始。',
    description: '看推荐如何进入队列，再走进 Lab，换一个听歌的空间。',
    edition: 'FOREVER / v1.0.0',
    src: '/video/products/swagger.mp4', poster: '/video/products/swagger-poster.jpg',
    duration: 124.10, note: '原始操作实录 · 无音轨 · 包含真实推荐等待、控制台与外观切换过程。',
    chapters: [{ time: 0, title: '经典电台' }, { time: 18, title: '对话推荐' }, { time: 66, title: '新队列' }, { time: 80, title: '推荐控制台' }, { time: 96, title: '切换外观' }, { time: 102, title: '唱片沉浸' }, { time: 114, title: '玻璃桌面' }],
  },
}

export const rainGuide: GuideSection[] = [
  {
    title: '天气与调节',
    items: [
      { title: '一键换一场天气', text: '原产品右上角的天气图标打开调节面板。雨、细雨、暴雨、雪、雾五个磁贴同时切换画面、图标与环境音；默认雨势会自然起伏，也可关闭自动波动。暴雨模式包含约每 9 秒一次的闪电脉冲，雪用四层雪花形成远近景深。' },
      { title: '六个参数，微调自己的氛围', text: '雨势 / 雪量调节密度；雾气调节玻璃模糊；折射率影响水滴透过的画面；时间流速控制动画快慢；背景缩放控制取景；自动波动幅度决定雨势起伏。' },
      ...weatherModes.map(mode => ({ title: mode.name, text: `${mode.note}原产品的程序化环境音：${mode.sound}。` })),
    ],
  },
  {
    title: '背景、环境音与快捷键',
    items: [
      { title: '把旅行中的窗外带进来', text: '底部工具栏可上传图片或视频，天气继续叠加在新背景上；旁边可恢复暖橙 × 雾灰的默认流动渐变。建议 JPG / PNG、3–10 秒循环短片，单文件 25 MB 以内。' },
      { title: '背景留在当前浏览器', text: 'v0.4 将上传素材从服务端临时目录迁到 IndexedDB，并按登录账号隔离。服务重启不影响本地素材；清除浏览器数据、换浏览器或换设备后，需要重新上传。' },
      { title: '让声音退到合适的位置', text: '原产品工具栏的扬声器开关和音量滑条控制环境音，也可用空格开关。切天气时声音平滑淡入淡出；偏好安静时可选细雨、雪或雾，再降低音量。本站交互预览保持静音。' },
    ],
  },
  {
    title: '随手记与 AI 陪伴',
    items: [
      { title: '不用先整理，直接写', text: '中央玻璃卡片可编辑标题与正文，停止输入片刻后自动保存。底部工具栏提供笔记列表、新建、删除、上一篇和下一篇；列表按更新时间倒序排列。' },
      { title: '对话：有人接住这句话', text: '右侧 AI 抽屉的「对话」可陪写或聊天，以雨窗的角色语气回应。例如：“今晚这场雨让你想起什么？”' },
      { title: '搜索：找回以前的自己', text: '「搜索」用自然语言检索旧笔记，例如“上周关于毕业旅行的那段”。不必记住准确标题。' },
      { title: '心情：把情绪说清楚', text: '「心情」接收当前笔记，给出情绪分析与一句安慰。三个分页均可回车或点击发送。原产品由服务端提供 AI 能力，本站不发送试写内容。' },
    ],
  },
  {
    title: '账号、数据与常见问题',
    items: [
      { title: '哪些内容可以跟随账号', text: '原产品使用已有飞书登录态，笔记、AI 对话 / 记忆和配置通过账号对应的后端同步；上传背景只在当前浏览器按账号隔离保存。跨设备同步需要原应用的登录和服务可用。' },
      { title: '背景突然不见了', text: '检查是否清除了浏览器数据、换了浏览器或设备；旧版服务端临时存储也会受服务重启影响。新版可重新上传恢复，不代表素材有跨设备备份。' },
      { title: '只想写字，或者只想看雨', text: '雾模式配合关闭环境音，能降低视觉与听觉干扰；也可以留空编辑器，只感受窗外天气。图标随天气变化是当前模式提示。' },
      { title: '上传或 AI 请求没有完成', text: '上传时检查文件是否选中、是否过大；AI 慢或报错时可检查网络后重试。笔记自动保存依赖服务返回，重要文字仍建议保留自己的副本。' },
    ],
  },
  {
    title: '从 v0.1 到 v0.4',
    items: [
      { title: 'v0.1 · 先让空间成立', text: '建立雨滴玻璃与玻璃拟态编辑器，让天气与书写共处一屏。' },
      { title: 'v0.2 · 增加陪伴', text: '加入对话 / 搜索 / 心情 AI 抽屉、环境音与自定义背景。' },
      { title: 'v0.3 · 留住个人内容', text: '接入登录，笔记、配置与 AI 记忆按账号隔离；雨势开始自然波动。' },
      { title: 'v0.4 · 天气成为选择', text: '扩展为五种天气，联动图标与声音；上传背景迁到浏览器本地存储。' },
      { title: '后续构想', text: '傍晚雷阵雨、雨后清晨、极光雪与烛火夜；按天回顾的笔记时间轴；以指定日期笔记为语境的聊天；常驻桌面的悬浮窗。以上为构想，尚未承诺交付时间。' },
    ],
  },
  {
    title: '实现手记',
    items: [
      { title: '天气、书写与陪伴分层', text: '附件源码使用 React / TypeScript 与 EdenX。雨滴玻璃由 WebGL 着色器绘制，编辑器与 AI 抽屉保持 DOM 交互；天气参数独立控制视觉，避免文字跟随背景变形。' },
      { title: '存储对应不同使用场景', text: '笔记与 AI 请求通过后端 API 携带账号身份；背景 Blob 进入 IndexedDB，本地恢复后交给图片 / 视频背景层。将大体积素材与可同步的文字分开，是 v0.4 的关键调整。' },
      { title: '本页体验范围', text: '这里重建天气氛围与单篇试写交互，供读者理解设计。试写仅保存到当前浏览器，不接入原项目账号、云端笔记或 AI 服务；上面的产品指南描述原应用的能力。' },
    ],
  },
]

export const radioViews = [
  { id: 'classic', name: '经典电台', description: '以时间为舞台，播放器、队列与助手稳定排布；可切换同步歌词和歌曲评论。' },
  { id: 'vinyl', name: '唱片沉浸', description: '真实专辑封面成为空间中心，两侧唱片形成透视队列，歌词与助手紧邻播放控制。' },
  { id: 'glass', name: '玻璃桌面', description: '左侧聚焦当前曲目，右侧用磨砂玻璃承载队列与对话，工作时也能轻松扫视。' },
] as const

export const radioFlow = [
  ['表达需求', '文字输入，或长按空格 / 手机输入框说话。'],
  ['理解与规划', 'Router 处理直接控制；复杂推荐组装品味、环境、历史与工具上下文。'],
  ['解析与播放', 'JSON 计划解析为歌曲 ID，更新共享队列，通过本地代理播放。'],
  ['播报与续接', 'TTS 播报后恢复音乐；真实播放才记历史，倒数第二首提前补充。'],
]

export const foreverGuide: GuideSection[] = [
  {
    title: '核心能力与第一次使用',
    items: [
      { title: '说出此刻的需要', text: '输入“来一点适合工作的低干扰音乐”，让 AI 规划曲目与 DJ 串场。暂停、下一首等直接操作由本地 Router 判断，不必每次调用模型。' },
      { title: '语音是一条完整路径', text: '桌面在非输入区域长按空格，手机长按输入框，松开结束识别并发送。云端 TTS 优先，失败回退浏览器语音；播报前记录音乐进度，结束后恢复同一首歌。' },
      { title: '播放器、歌词和助手共用状态', text: '音质、进度、音量、收藏、当前歌曲与真实封面保持关联；歌词按同一播放时钟高亮，评论来自网易云。助手可直接暂停、切歌或替换队列。' },
      { title: '阅读、听歌与聊天各得其所', text: '播放器支持吸顶与折叠，长队列阅读时仍能控制音乐；聊天专注模式把对话放大。切换显示方式不会重建播放器或清空消息。' },
      { title: '开场属于此刻', text: '按凌晨、早晨、上午、中午、下午、晚上、深夜分时，结合连接状态、当前歌曲、暂停状态、剩余队列和临时指令生成开场。浏览器记住上一条并避开重复，仅语义状态变化时更新。' },
      { title: '一条建议的体验路线', text: '启动电台并播放 → 自然语言推荐 → 长按语音 → 在 Lab 切换外观并保存 → 设置限时主题，观察到期后恢复通用推荐。' },
    ],
  },
  {
    title: '推荐策略：懂你，也服从当下',
    items: [
      { title: '候选来源', text: '合并 AI 推荐、网易云私人 FM、每日推荐、相似歌曲与新歌；用本地播放历史、网易云最近播放和当前队列过滤重复。' },
      { title: '默认熟悉度 17%', text: '通用模式下熟悉歌曲比例可在 0%–100% 间调整，默认约等于每 6 首中 1 首熟悉歌曲、5 首新发现。Lab 同时展示比例与数量换算。' },
      { title: '明确主题优先', text: '“接下来两小时只听白噪音”会生成临时策略，暂停通用熟悉度配比，只选择符合主题的候选；同主题补选也不混入通用候选。持续时间可设 15–1440 分钟，默认 120 分钟；策略与到期时间保存到 SQLite，可编辑、提前关闭，到期恢复通用模式。' },
      { title: '持续播出', text: '队列进入倒数第二首时静默预补充，原生 ended 事件切到下一首。音源失败重试一次，仍不可用再跳过，避免单首故障阻塞整档节目。' },
    ],
  },
  {
    title: 'Lab：六个分页，一次明确保存',
    items: [
      { title: '身份', text: '助理名称、头像和默认头像恢复；同步主页面、标题、消息作者与档案入口。' },
      { title: '记忆', text: '音乐风格标签与本地 taste.md 长期品味语料。' },
      { title: '推荐', text: '熟悉比例、当前策略、临时主题、剩余时间和到期时间。' },
      { title: '服务', text: '大模型、语音与网易云账号，不同服务商的 Key 独立保存。' },
      { title: '声音', text: '音色、复刻 ID、情绪、强度、语速、音量、导演提示与即时试听。' },
      { title: '外观', text: '经典电台、唱片沉浸与玻璃桌面，共享同一播放状态。' },
      { title: '草稿 → 保存并同步', text: '每页独立保存。修改先保留在草稿，分页状态点提示未保存内容，切页不提交；点击“保存并同步”才写入 SQLite，并通过 WebSocket 通知主电台。' },
    ],
  },
  {
    title: '技术架构与制作路径',
    items: [
      { title: '交互与实时同步', text: 'HTML / CSS / Vanilla JavaScript 构成 PWA 和离线壳；WebSocket 同步 ON AIR 状态、身份、配置与播放事件。三种外观共用 DOM 与唯一的 audio，仅切换 appearance.playerStyle 和样式标记，不重建音源、进度或消息。' },
      { title: '服务中枢与数据', text: 'Node.js / Express 负责 API、意图路由、上下文组装、代理与定时任务；SQLite 保存消息、播放、偏好与计划，Markdown 语料保存长期品味。' },
      { title: '可替换的能力层', text: '模型支持 Ark、OpenAI、Claude 或兼容接口；音乐通过 NetEaseCloudMusicApi 搜索、获取音源、歌词、评论及封面；语音支持 Volcengine、Fish Audio 与浏览器回退。' },
      { title: '封面也有明确边界', text: '从歌曲详情 al.picUrl 获取真实封面。代理仅接受合法数字歌曲 ID，并限制网易云图片域名，统一缓存与错误处理；无封面时显示空状态。' },
      { title: '先建立可靠内核', text: '制作顺序为：PWA 与 SQLite 骨架 → 接入真实模型、音乐和语音 → 单音频通道、ended 切歌、流代理、重试与播报恢复 → 长期记忆与去重。' },
      { title: '再把控制权交给用户', text: '继续实现可到期的临时主题 → 六页 Lab → 在共享内核上拓展三种外观 → 桌面、窄屏、手机的溢出、输入与媒体加载验收。' },
    ],
  },
  {
    title: '可靠性、数据与服务回退',
    items: [
      { title: '本地优先', text: '品味语料、播放记录、偏好和服务配置默认留在当前设备。启用外部模型、音乐或语音时，对应请求仍需要连接所选服务。' },
      { title: '配置与写入保护', text: '不同服务商的密钥分开保存，读取接口仅返回状态、来源与末四位；登录、配置、临时策略和历史写入执行同源校验。Lab 用于单用户本地管理，没有独立登录鉴权。' },
      { title: '服务不可用时', text: '模型不可用则使用本地规则；云端 TTS 回退 Browser Speech；网易云不可用时尝试缓存音源或本地音床。WebSocket 断开显示 RECONNECTING 并自动重连。回退效果取决于本地可用资源。' },
    ],
  },
  {
    title: '本地启动、当前边界与版本说明',
    items: [
      { title: '运行环境', text: 'v1.0.0 需要 Node.js 18+，推荐 20 或 22，npm 9+。解压本地发行包后，在项目目录依次执行 npm ci、cp .env.example .env、npm start。主电台在 http://localhost:8080，Lab 在 /debug.html，健康检查在 /api/health。网易云账号、LLM、TTS 可按需配置。' },
      { title: '现阶段限制', text: '单用户本地产品，暂无独立账号体系；主页面未接入真实天气与日历。音乐受账号、地区、版权与网络影响；语音识别取决于浏览器和系统权限。收藏仅在浏览器会话保存；定时节目为固定本地时刻，Lab 暂不支持编辑。' },
      { title: '材料版本说明', text: '本页已按 Forever AI Radio Local v1.0.0 发行包、PRODUCT.md 和部署说明更新，核对日期为 2026-09-24。新版源码包含三种播放器外观、默认 17% 熟悉度、限时主题策略、独立分页保存与实时同步；上方实录展示实际页面。' },
      { title: '换一台电脑运行', text: 'macOS / Linux 使用 cp .env.example .env；Windows PowerShell 使用 Copy-Item .env.example .env。新电脑首次启动会生成空的 state.db，个人数据不会自动迁移；完成 Lab 配置后，点击“保存并同步”再开始体验。' },
      { title: '备份与升级', text: '升级前停止服务，备份 .env、state.db、user/ 和 public/uploads/；解压新版本后迁入个人配置与数据，再执行 npm ci、npm run check、npm start。数据库、品味记忆、头像和服务配置不随公开发行包分发。' },
      { title: '本页体验范围', text: '本页的外观与推荐交互是设计演示，使用固定示例，不调用大模型、TTS 或音乐平台。完整电台依赖本地服务，不能直接作为静态页面部署；这份作品展示页可独立静态访问。' },
    ],
  },
]
