export const musicPortfolioUrl = 'https://dcnpzhkntn0i.feishu.cn/wiki/Zvi4wqfH1ioarokfzKNc35E0nKh'

export const musicTracks = [
  {
    id: 'stay-with-me',
    number: '01',
    title: 'Stay with Me',
    subtitle: '把遗憾，留成仍在跳动的脉搏。',
    genre: 'K-pop · Dreamy R&B',
    language: '韩英混合',
    mood: '青春 / 怀旧 / 微苦',
    tone: 'peach',
    src: '/audio/music/stay-with-me.mp3',
    duration: 236.59,
    suno: 'https://suno.com/s/DJfb6xDHhTTzw55M',
    quote: 'Not as a past,\nbut as a pulse.',
    quoteNote: '不是过去，而是脉搏。',
    concept: [
      '受 NewJeans《Ditto》的青春怀旧氛围与 ROSÉ《Gone》的叙事声线启发，这是我的第一首原创 AI 音乐作品。描绘青春末期「明知会结束，却还想停留」的遗憾心境。',
      '以韩英混合歌词承载情绪，Bridge 的点睛句 “Not as a past but as a pulse”，将遗憾从死去的记忆，转译为仍在跳动的脉搏。',
    ],
    prompt: 'Kpop dreamy R&B, female vocal with soft husky tone, nostalgic and bittersweet mood',
    process: [
      { title: '定义声音的情绪', text: '以梦幻 R&B 为方向，明确柔和沙哑的女声、怀旧而微苦的情绪。' },
      { title: '让想法成为歌曲', text: '使用 Suno 独立完成词、曲、编、唱。钢琴、吉他与轻律动构成极简编曲。' },
      { title: '迭代，直到情绪对了', text: '多轮提示词迭代与输出筛选，让 NewJeans 的梦幻感与 ROSÉ 式的叙事沙哑质感相遇。' },
    ],
    operation: {
      tag: '#StillStay',
      title: '让「未完成的告别」有一个出口。',
      intro: '假设投放抖音 / 网易云，将歌曲里的私人情绪，延伸为听众可以参与的故事。',
      ideas: [
        { label: '副歌成为入口', text: '截取副歌段落作为 BGM，让情绪在短视频里先被听见。' },
        { label: '话题连接故事', text: '发起 #StillStay 话题，引导用户分享「未完成的告别」。' },
        { label: '一句歌词的回响', text: '将 “Not as a past but as a pulse” 用作情感类短视频标题或评论区金句。' },
      ],
    },
  },
  {
    id: 'rain-talk',
    number: '02',
    title: 'Rain Talk',
    subtitle: '没发出的消息，先说给雨听。',
    genre: 'R&B · K-pop OST',
    language: '英文',
    mood: '雨夜 / 暧昧 / 陪伴',
    tone: 'mint',
    src: '/audio/music/rain-talk.mp3',
    duration: 209.54,
    suno: 'https://suno.com/s/KQSE3YKCGKBm68tk',
    quote: 'I wanna tell you,\nbut I don’t know how.',
    quoteNote: '想对你说，却不知如何开口。',
    concept: [
      '写给「暧昧期」的韩式 OST 英文小情歌。捕捉深夜两点、雨声未停、手机屏幕亮了又暗的瞬间——想发消息却打了又删，最后关上手机，听着雨声继续想 TA。',
      '副歌 “I wanna tell you, but I don’t know how” 简单重复，卡住「想说不敢说」的情绪。不教你勇敢，也不劝你放弃，只是陪着你。',
    ],
    prompt: 'K-pop OST style, modern R&B with dreamy electronic textures, mid-tempo 80 BPM',
    process: [
      { title: '设定雨夜的底色', text: '以韩式 OST、梦幻电子质感的现代 R&B 为方向，在提示词中设定 80 BPM 的中速律动。' },
      { title: '用钢琴打开故事', text: '使用 Suno 独立完成词、曲、编、唱；前奏引用肖邦《夜曲》Op.9 No.2 前五个音作为钢琴 motif。' },
      { title: '留住呼吸与停顿', text: '通过多轮迭代，寻找「嘟囔式说唱」的呼吸感，以及像省略号一样欲言又止的停顿。' },
    ],
    operation: {
      tag: '#雨声替我保密',
      title: '让未发出的消息，在雨声里被听见。',
      intro: '围绕雨夜与暧昧的陪伴感，构想歌曲在内容场景中的更多可能。',
      ideas: [
        { label: '走进情绪场景', text: '作为短剧 OST、深夜情感 Vlog 或雨天氛围短视频的 BGM。' },
        { label: '收藏未发出的消息', text: '在抖音发起 #雨声替我保密# 话题，鼓励用户分享「未发出的消息」。' },
        { label: '把副歌交给听众', text: '围绕简单重复、易于记忆的副歌，设计评论区接唱挑战。' },
      ],
    },
  },
] as const

export type MusicTrack = typeof musicTracks[number]

export function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}
