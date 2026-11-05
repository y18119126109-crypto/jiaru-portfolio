export const resumeProfile = {
  name: '周珈如',
  englishName: 'Jiaru Zhou',
  direction: '音乐内容运营 / AI 产品与内容创作',
  email: 'zhoujiaru2324@163.com',
  phone: '15553313138',
  portfolio: 'https://www.zhoujiaru-portfolio.cloud/',
  file: '/files/zhou-jiaru-resume.pdf',
  downloadName: '周珈如-个人简历.pdf',
}

export const resumeChapters = [
  { id: 'education', title: '学习经历', english: 'EDUCATION', number: '01' },
  { id: 'projects', title: '项目经历', english: 'SELECTED PROJECTS', number: '02' },
  { id: 'experience', title: '实习经历', english: 'EXPERIENCE', number: '03' },
  { id: 'skills', title: '技能', english: 'SKILLS & TOOLS', number: '04' },
] as const

export type ChapterId = typeof resumeChapters[number]['id']

export interface ResumeProjectMedia {
  src: string
  thumbnail: string
  alt: string
  caption: string
  position?: string
  aspectRatio?: number
}

export interface ResumeProjectGallery {
  title: string
  items: ResumeProjectMedia[]
  previewIndices?: number[]
}

export const education = [
  {
    school: '谢菲尔德大学',
    english: 'The University of Sheffield',
    degree: '音乐学 · 硕士',
    period: '2024.09 — 2026.01',
    badge: 'QS Top 100',
    courses: ['音乐产业领导力原理', '批判音乐学', '音乐学专题研究', '研究与沟通技能'],
  },
  {
    school: '中国石油大学（华东）',
    english: 'China University of Petroleum',
    degree: '音乐学 · 本科',
    period: '2017.09 — 2021.06',
    badge: '双一流 · 211',
    courses: ['小提琴演奏', '室内乐', '乐理', '音乐美学', '中西方音乐史', '和声曲式', '视唱练耳'],
  },
]

export interface ResumeEntry {
  title: string
  role: string
  period: string
  tags: string[]
  details: { label: string; text: string }[]
  highlights: { value: string; label: string; path?: '/music' | '/playlists' }[]
  action?: { label: string; path: '/music' | '/products#forever' }
  media?: ResumeProjectGallery
}

export const projects: ResumeEntry[] = [
  {
    title: '音乐内容创作与运营',
    role: '流行音乐创作 · AI 企划 · 歌单策划',
    period: '2026.05 — 至今',
    tags: ['Cubase', 'Suno AI', '歌单策划'],
    details: [
      { label: '创作与 AI 企划', text: '使用 Cubase 编辑音乐工程并进行流行音乐创作，结合 Suno AI 完成多首原创歌曲；负责主题定位、歌词与结构设计、提示词迭代及成品筛选，并依据试听反馈优化作品。' },
      { label: '主题歌单策划', text: '面向留学古典乐、K-pop、华语流行、韩剧 OST 等用户场景，在网易云音乐、QQ 音乐策划 5 个主题歌单，完成选曲、标题及推荐语设计。' },
    ],
    highlights: [{ value: '5', label: '个主题歌单' }],
  },
  {
    title: 'Forever｜AI 私人电台',
    role: '个人 Vibe Coding 应用',
    period: '个人项目',
    tags: ['Vibe Coding', 'AI Radio', 'Windows / macOS'],
    details: [
      { label: '产品规划与交付', text: '面向专注、放松与助眠场景，完成产品规划与交互设计，并通过 Vibe Coding 将想法落地为可运行应用。融合自然语言点歌、语音交互与多音源播放，结合用户长期音乐偏好和临时场景指令，实现个性化推荐与连续播放；设计直接播放、歌单卡片、互动选择三种推荐模式，适配不同选歌习惯。完善多主题播放界面、新手引导与个性化配置，完成 Windows / macOS 桌面交付及核心流程验证，覆盖从需求定义到产品交付的完整过程。' },
    ],
    highlights: [
      { value: '3', label: '种电台推荐模式' },
      { value: '2', label: '个桌面系统交付' },
    ],
  },
]

export const internships: ResumeEntry[] = [
  {
    title: '猴子音悦',
    role: '音乐内容运营 · AI 创作与宣发方向',
    period: '2025.10 — 2026.02',
    tags: ['创作者拓展', 'AI 音乐', '作品发行'],
    details: [
      { label: '创作者拓展与推广', text: '围绕歌曲在抖音、小红书的推广需求，结合曲风、目标受众及内容调性筛选创作者，跟进合作邀约、内容沟通、素材对接与发布；四个月累计筛选约 180 位创作者、建联约 50 位，协助推动 23 条推广内容上线。' },
      { label: '原创内容企划与筛选', text: '根据团队音乐创作需求，使用 Suno 生成 Demo，结合试听反馈迭代曲风、情绪及人声等提示词，整理候选方案供团队评审；累计生成 1000+ 版 Demo，其中 12 首进入后续制作。' },
      { label: '作品管理与发行', text: '维护音频、歌曲信息及发行物料，跟进 QQ 音乐、网易云音乐、汽水音乐等平台的上传与提交进度，累计支持 30 余首作品的发行提交。' },
    ],
    highlights: [{ value: '23', label: '条推广内容上线' }, { value: '12', label: '首进入后续制作' }, { value: '30 余', label: '首作品发行提交' }],
  },
  {
    title: '京东零售',
    role: '商品运营 · 商品治理与 AI 数据专项',
    period: '2022.07 — 2022.10',
    tags: ['商品治理', 'AI 数据', 'MRD'],
    details: [
      { label: '品牌治理专项', text: '依托集团内部违规识别模型，结合历史违规案例特征，从地域聚集、时间爆发等维度搭建动态风险分析看板；联动外包团队完成样本打标校验，看板识别准确率达 95%+。基于风险系数搭建「违规识别—商品降权—禁止推荐—违规屏蔽」全自动化处置链路，3 个月推动品牌违规问题下降 10%。' },
      { label: '商品详情治理专项', text: '抽样定位女装、3C 电子等商详信息填写错误高频品类，输出品类化治理 SOP，协同外包产出标准化训练数据集，为 AI 模型迭代提供数据底座；从业务视角输出商详劝返自动化链路 MRD，通过预填充内容、二次提交校验、正向激励等多重策略，使 3C 品类商品详情正确率提升至 90% 以上。' },
    ],
    highlights: [
      { value: '95%+', label: '风险看板识别准确率' },
      { value: '10%', label: '品牌违规问题下降' },
      { value: '90%+', label: '3C 商详正确率' },
    ],
  },
]

export interface ResumeSkill {
  icon: 'music' | 'spark' | 'globe'
  title: string
  text: string
  note?: string
}

export const skills: ResumeSkill[] = [
  { icon: 'music' as const, title: '音乐与内容', text: '音乐学本硕背景，具备流行音乐创作、AI 音乐企划、主题歌单策划、创作者拓展与作品发行经验。' },
  { icon: 'spark' as const, title: 'Vibe Coding 与 AI Agent', text: '使用 Trae、Codex、Cursor 完成产品原型与桌面应用交付；常用豆包 Work、WorkBuddy 辅助内容与工作流。' },
  { icon: 'globe' as const, title: '语言与数据', text: '英语 · 雅思 6.5 / 韩语 · 基础', note: '基础数据分析 · Excel / SQL' },
]

export const tools = ['Trae', 'Codex', 'Cursor', '豆包 Work', 'WorkBuddy', 'Excel', 'SQL', 'Cubase', 'Suno AI']

export interface ResumeData {
  profile: typeof resumeProfile
  education: typeof education
  projects: ResumeEntry[]
  internships: ResumeEntry[]
  skills: ResumeSkill[]
  tools: string[]
}

export const defaultResumeData: ResumeData = {
  profile: resumeProfile,
  education,
  projects,
  internships,
  skills,
  tools,
}

export const resumeVariants = {
  'music-content': {
    profile: {
      name: '周珈如',
      englishName: 'Jiaru Zhou',
      direction: '原创音乐内容拓展 / 音乐内容运营',
      email: 'zhoujiaru2324@163.com',
      phone: '15553313138',
      portfolio: 'https://dcnpzhkntn0i.feishu.cn/wiki/Zvi4wqfH1ioarokfzKNc35E0nKh',
      file: '/files/zhou-jiaru-resume-music-content.pdf',
      downloadName: '周珈如-音乐内容运营简历.pdf',
    },
    education,
    projects: [
      {
        title: '音乐内容创作与运营',
        role: '原创歌曲企划与制作 · 音乐内容洞察',
        period: '2026.05 — 至今',
        tags: ['Cubase', 'Suno AI', '主题歌单'],
        details: [
          { label: '原创歌曲企划与制作', text: '使用 Cubase 编辑音乐工程并创作流行音乐，结合 Suno AI 完成多首原创歌曲；负责主题定位、歌词与结构设计、提示词迭代、版本筛选及试听优化，形成从内容创意到成品判断的完整流程。' },
          { label: '音乐内容洞察', text: '围绕留学古典乐、K-pop、华语流行、韩剧 OST 等细分场景，在网易云音乐、QQ 音乐策划 5 个主题歌单，完成选曲、标题及推荐语设计，持续关注不同音乐圈层的内容偏好。' },
        ],
        highlights: [
          { value: '2', label: '首原创音乐', path: '/music' },
          { value: '5', label: '个主题歌单', path: '/playlists' },
        ],
      },
      {
        title: '谢菲尔德大学中国作品专场音乐会',
        role: '内容策划与宣发',
        period: '2025.02 — 2025.03',
        tags: ['内容策划', 'Instagram', '小红书'],
        details: [
          { label: '宣传策划', text: '围绕 10+ 个中国传统节目制定内容宣传方案，以 Instagram、小红书为核心渠道，统筹线上内容与线下海报推广，并依据互动反馈迭代传播方向。' },
          { label: '传播转化', text: '单条内容曝光 2000+，二次传播获 300+ 点赞，实现线上曝光到线下到场转化，促进跨文化交流。' },
        ],
        highlights: [
          { value: '10+', label: '个中国传统节目' },
          { value: '2000+', label: '单条内容曝光' },
          { value: '300+', label: '二次传播点赞' },
        ],
        media: {
          title: '谢菲尔德大学中国作品专场音乐会',
          previewIndices: [0, 1, 2],
          items: [
            {
              src: '/images/resume/chinese-heritage-concert/01-stage-finale.jpg',
              thumbnail: '/images/resume/chinese-heritage-concert/thumbs/01-stage-finale.jpg',
              alt: '中国作品音乐会结束后，演职人员在谢菲尔德 Firth Hall 舞台合影',
              caption: '演出结束后的全体谢幕',
              aspectRatio: 1.5,
            },
            {
              src: '/images/resume/chinese-heritage-concert/02-concert-poster.jpg',
              thumbnail: '/images/resume/chinese-heritage-concert/thumbs/02-concert-poster.jpg',
              alt: '2025 年 3 月 19 日中国作品音乐会活动海报',
              caption: '中国作品音乐会主视觉海报',
              position: 'center top',
              aspectRatio: 0.71,
            },
            {
              src: '/images/resume/chinese-heritage-concert/03-event-moment.jpg',
              thumbnail: '/images/resume/chinese-heritage-concert/thumbs/03-event-moment.jpg',
              alt: '受邀摄影师发布的音乐会现场记录截图',
              caption: '演出现场互动记录',
              position: 'center 32%',
              aspectRatio: 0.55,
            },
            {
              src: '/images/resume/chinese-heritage-concert/04-audience-post.jpg',
              thumbnail: '/images/resume/chinese-heritage-concert/thumbs/04-audience-post.jpg',
              alt: '观众在社交平台发布音乐会照片与推荐',
              caption: '社交平台观众反馈',
              aspectRatio: 2.27,
            },
            {
              src: '/images/resume/chinese-heritage-concert/05-staff-performance-roster.jpg',
              thumbnail: '/images/resume/chinese-heritage-concert/thumbs/05-staff-performance-roster.jpg',
              alt: '中国作品音乐会工作人员及演出阵容海报',
              caption: '工作人员与演出阵容',
              position: 'center top',
              aspectRatio: 0.7,
            },
            {
              src: '/images/resume/chinese-heritage-concert/06-team-photo.jpg',
              thumbnail: '/images/resume/chinese-heritage-concert/thumbs/06-team-photo.jpg',
              alt: '中国作品音乐会活动团队合影照片',
              caption: '活动团队合影',
              position: 'center 65%',
              aspectRatio: 0.75,
            },
          ],
        },
      },
      {
        title: '谢菲尔德市华人春节联欢晚会（市级）',
        role: '演出统筹',
        period: '2025.02',
        tags: ['演出统筹', '现场执行', '活动报道'],
        details: [
          { label: '现场执行', text: '负责舞蹈组 30 人、3 个节目现场执行，在 30+ 节目、100+ 演员高压环境下保障平均转场 30 秒内。' },
          { label: '活动传播', text: '参与撰写活动报道，获当地华媒转载；因工作表现突出，获市政府颁发的春晚工作奖状。' },
        ],
        highlights: [
          { value: '100+', label: '名演员协同' },
          { value: '30 秒内', label: '平均转场' },
        ],
        media: {
          title: '谢菲尔德市华人春节联欢晚会',
          items: [
            {
              src: '/images/resume/sheffield-chinese-new-year/01-venue-crew.jpg',
              thumbnail: '/images/resume/sheffield-chinese-new-year/thumbs/01-venue-crew.jpg',
              alt: '周珈如佩戴谢菲尔德华人春晚场内工作证并手持对讲机参与现场执行',
              caption: '持场内工作证参与现场执行',
              position: 'center 60%',
              aspectRatio: 0.75,
            },
            {
              src: '/images/resume/sheffield-chinese-new-year/02-event-coverage.jpg',
              thumbnail: '/images/resume/sheffield-chinese-new-year/thumbs/02-event-coverage.jpg',
              alt: '当地摄影师在社交平台发布谢菲尔德华人春晚活动报道',
              caption: '当地摄影师发布的活动报道',
              position: 'center 25%',
              aspectRatio: 0.59,
            },
            {
              src: '/images/resume/sheffield-chinese-new-year/03-appreciation-certificate.jpg',
              thumbnail: '/images/resume/sheffield-chinese-new-year/thumbs/03-appreciation-certificate.jpg',
              alt: '颁给 Jiaru Zhou 的 2025 谢菲尔德华人春节活动工作感谢证书',
              caption: '春晚工作感谢证书',
              aspectRatio: 1.43,
            },
          ],
        },
      },
    ],
    internships: [
      {
        title: '猴子音悦',
        role: '音乐内容运营 · AI 创作与宣发方向',
        period: '2025.10 — 2026.02',
        tags: ['创作者拓展', 'AI 音乐', '作品发行'],
        details: [
          { label: '原创音乐人及创作者拓展', text: '围绕原创歌曲宣发需求，根据曲风、目标受众及内容调性挖掘、筛选并匹配音乐人及内容创作者，跟进邀约、合作沟通、素材对接与发布；四个月累计筛选约 180 位创作者、建联约 50 位，协助推动 23 条推广内容上线。' },
          { label: '原创歌曲企划与内容评估', text: '根据团队音乐创作需求，使用 Suno 生成 Demo，围绕曲风、情绪、人声与结构拆解试听维度并迭代提示词，整理候选版本供团队评审；累计生成 1000+ 版 Demo，其中 12 首进入后续制作。' },
          { label: '作品管理与项目协同', text: '维护音频、歌曲信息及发行物料，跟进候选 Demo 评审、资料准备及 QQ 音乐、网易云音乐、汽水音乐等平台的上传提交进度，累计支持 30 余首作品发行，并及时同步节点与异常情况。' },
        ],
        highlights: [
          { value: '23', label: '条推广内容上线' },
          { value: '12', label: '首进入后续制作' },
          { value: '30 余', label: '首作品发行' },
        ],
      },
      {
        title: '青岛西海岸新区实验初级中学',
        role: '音乐内容助理',
        period: '2021.03 — 2021.06',
        tags: ['演出统筹', '内容转化', '排练计划'],
        details: [
          { label: '演出统筹与跨角色协作', text: '协助校园演出内容策划与落地，协调声部、排练计划及现场执行；演出获青岛电视台报道。' },
          { label: '内容转化与生产', text: '面向青少年受众，将专业音乐知识转化为易理解、可参与的教学内容，设计 20+ 场分组排练计划，使学生合奏准确率提升 25%。' },
        ],
        highlights: [
          { value: '20+', label: '场分组排练计划' },
          { value: '25%', label: '合奏准确率提升' },
        ],
      },
    ],
    skills: [
      { icon: 'music' as const, title: '音乐审美与制作', text: '音乐学本硕背景，熟悉流行、R&B、古典等风格，具备曲风、结构、编配与内容质量判断能力；可使用 Cubase 编辑音乐工程，并使用 Suno 辅助原创歌曲企划与版本筛选。' },
      { icon: 'spark' as const, title: '内容拓展与项目运营', text: '具备创作者筛选建联、歌曲推广、作品资料管理、发行跟进及主题歌单策划经验，有音乐版权意识；熟悉短视频与流媒体平台生态，能够协调创作者、制作及发行环节并跟进项目节点。' },
      { icon: 'globe' as const, title: '语言能力', text: '英语 · 雅思 6.5 / 韩语 · 基础' },
    ],
    tools: ['飞书', 'Office', 'Canva', '剪映', 'Cubase', 'Suno', 'Codex', 'Claude Code'],
  },
  'ai-music-product': {
    profile: {
      name: '周珈如',
      englishName: 'Jiaru Zhou',
      direction: '音乐产品经理 / AI 音乐产品运营',
      email: 'zhoujiaru2324@163.com',
      phone: '15553313138',
      portfolio: '/products',
      file: '/files/zhou-jiaru-resume-ai-music-product.pdf',
      downloadName: '周珈如-AI音乐产品运营简历.pdf',
    },
    education,
    projects: [
      {
        title: 'AI 音乐生成与评测实践',
        role: '用户场景 · 评测方案 · 数据服务',
        period: '2026.05 — 至今',
        tags: ['Suno', '评测体系', 'Agent 工作流'],
        details: [
          { label: '用户场景与评测方案', text: '围绕音乐创作者使用 AI 生成工具的场景，使用 Suno 开展多轮生成，将质量目标拆解为提示词遵循、旋律、曲式结构、编配、人声和音质等维度；结合试听反馈识别用户体验与模型输出问题，形成可执行的评测口径。' },
          { label: '数据服务与迭代', text: '使用 Agent 工具辅助文件整理、信息抽取、结果汇总和问题归类，沉淀样本标签与问题类型；根据评测结论迭代提示词、评测规则及复核流程，为后续产品优化提供结构化反馈。' },
        ],
        highlights: [
          { value: '6', label: '类质量评测维度' },
          { value: '闭环', label: '评测与复核流程' },
        ],
        action: { label: '查看 AI 音乐创作', path: '/music' },
      },
      {
        title: '私人智能 AI 电台',
        role: 'AI 应用开发',
        period: '2026.03 — 2026.05',
        tags: ['Vibe Coding', 'AI DJ', '多端部署'],
        details: [
          { label: '产品设计与落地', text: '通过 Vibe Coding 独立完成私人 AI 电台从 0 到 1 的产品设计与实现，围绕用户情绪、场景和音乐偏好，支持自然语言点歌、主题化播放和连续收听。产品支持 MAC / Win / 手机端部署且全功能可用。' },
          { label: '推荐机制与 AI 交互', text: '设计个性化推荐与交互机制，结合用户品味、收听历史和临时指令进行推荐，并支持 AI DJ 使用文字 / 语音进行交流、歌曲串场和节目介绍。' },
          { label: 'AI 应用框架设计', text: '通过 API 接入大模型、网易云音乐和 TTS 服务，设计本地数据持久化、服务配置、异常处理和多端访问机制，并根据实际使用反馈持续迭代产品体验。' },
        ],
        highlights: [
          { value: '0 → 1', label: '独立产品落地' },
          { value: '3', label: '类终端全功能可用' },
        ],
        action: { label: '查看 Forever 产品作品', path: '/products#forever' },
      },
      {
        title: '《小提琴持弓方法探究》',
        role: '跨学科创新项目 · 校级结题',
        period: '2020.05',
        tags: ['传感设备', '数据可视化', '反馈闭环'],
        details: [
          { label: '用户需求与方案验证', text: '作为核心成员与物理学科协作，共同研发可佩戴于琴弓的小型传感设备，连接电脑实时采集并可视化呈现持弓角度与运弓轨迹，验证音乐训练场景中的数据化辅助方案。' },
          { label: '指标拆解与反馈闭环', text: '将持弓姿态拆解为角度、轨迹等可量化指标，辅助演奏者客观评估并调整动作，建立从用户问题、数据指标到反馈验证的产品思路。' },
        ],
        highlights: [
          { value: '校级', label: '创新项目结题' },
          { value: '实时', label: '动作数据可视化' },
        ],
        media: {
          title: '《小提琴持弓方法探究》',
          items: [
            {
              src: '/images/resume/violin-bow-research/01-sensor-visualization.jpg',
              thumbnail: '/images/resume/violin-bow-research/thumbs/01-sensor-visualization.jpg',
              alt: '持弓传感数据可视化程序界面，显示三维曲面及三项实时数值',
              caption: '持弓传感数据实时可视化',
              aspectRatio: 1.91,
            },
            {
              src: '/images/resume/violin-bow-research/02-violin-model.jpg',
              thumbnail: '/images/resume/violin-bow-research/thumbs/02-violin-model.jpg',
              alt: '项目使用的小提琴三维模型界面',
              caption: '小提琴三维模型界面',
              aspectRatio: 2.03,
            },
            {
              src: '/images/resume/violin-bow-research/03-completion-certificate.jpg',
              thumbnail: '/images/resume/violin-bow-research/thumbs/03-completion-certificate.jpg',
              alt: '小提琴持弓方法探究大学生创新创业训练计划结题证书',
              caption: '校级创新训练项目结题证书',
              aspectRatio: 1.33,
            },
          ],
        },
      },
    ],
    internships: [
      {
        title: '猴子音悦',
        role: '音乐内容运营 · AI 生成与评测方向',
        period: '2025.10 — 2026.02',
        tags: ['需求拆解', '数据生产', '跨部门协作'],
        details: [
          { label: '需求拆解与数据生产', text: '根据团队音乐创作需求，使用 Suno 批量生成 Demo，结合曲风匹配度、旋律完整性、结构合理性、人声自然度及整体可用性完成试听筛选；累计生成 1000+ 版 Demo，其中 12 首进入后续制作。' },
          { label: '跨部门协作与项目推进', text: '对接上游产研明确评测目标、维度、口径与交付节点，向下游一线作业同学同步标准并跟进执行；汇总进度、异常样本及试听结论，推动复核、问题回传与按期交付。' },
          { label: '作品数据管理', text: '维护音频、歌曲信息及发行物料，跟进 QQ 音乐、网易云音乐、汽水音乐等平台的上传与提交进度，累计支持 30 余首作品的发行提交。' },
        ],
        highlights: [
          { value: '1000+', label: '版 Demo 数据生产' },
          { value: '12', label: '首进入后续制作' },
          { value: '30 余', label: '首作品发行提交' },
        ],
      },
    ],
    skills: [
      { icon: 'music' as const, title: '音乐制作与分析', text: '音乐学本硕背景，熟悉流行、R&B、古典等风格，具备乐理、曲式、和声及内容质量判断能力；可使用 Cubase 编辑音乐工程并创作流行音乐。' },
      { icon: 'spark' as const, title: '产品与 AI 工具', text: '能够将音乐用户场景拆解为需求、指标和流程；使用 Suno、ChatGPT、Codex、Claude Code，通过 Agent 工作流辅助样本整理、文本与表格清洗、结果汇总和重复流程自动化。' },
      { icon: 'globe' as const, title: '语言与协作工具', text: '英语 · 雅思 6.5 / 韩语 · 基础', note: '熟悉飞书、Office、Canva、剪映' },
    ],
    tools: ['Suno', 'ChatGPT', 'Codex', 'Claude Code', '飞书', 'Office', 'Canva', '剪映', 'Cubase'],
  },
} satisfies Record<'music-content' | 'ai-music-product', ResumeData>

export function getResumeData(variant?: keyof typeof resumeVariants): ResumeData {
  return variant ? resumeVariants[variant] : defaultResumeData
}
