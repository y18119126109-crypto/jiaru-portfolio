import source from './playlists-source.json'

// Editorial labels come from section two of the portfolio. Track metadata is
// kept separately, exactly as retrieved from each original platform.
const themes = [
  { id: 'netease-kpop', name: 'Kpop 感性时刻', subtitle: '耳机里的情绪出口', english: 'After midnight', category: 'K-POP · 抒情', note: '侧重 Kpop 抒情与收录曲，适合深夜聆听。', tags: ['深夜', '独处', '情绪出口'], color: '#779f96', soft: '#d5e8e1', petal: '#9ac5b9', heart: '#e7b4a4' },
  { id: 'netease-cpop', name: '华语流行', subtitle: '那些刻进 DNA 里的旋律', english: 'Days we remember', category: 'C-POP · 青春', note: '周杰伦、孙燕姿、蔡依林、林俊杰等，前奏即青春。', tags: ['华语', '青春', '回忆'], color: '#b18a76', soft: '#f0dfd2', petal: '#e7bca5', heart: '#e5c6d3' },
  { id: 'netease-classical', name: '留学时听的古典乐', subtitle: '在谢菲尔德写论文的日子', english: 'A quiet study', category: 'CLASSICAL · 陪伴', note: '德彪西、巴赫、马勒等，全经典古典曲目。', tags: ['古典', '图书馆', '专注'], color: '#909e77', soft: '#e3e9d4', petal: '#bbc99e', heart: '#e6c9a8' },
  { id: 'qq-ost', name: '韩剧 OST', subtitle: '前奏一响，眼泪就绷不住了', english: 'Scenes that stay', category: 'K-DRAMA · 原声', note: '经典韩剧 OST，主题：前奏即回忆杀。', tags: ['韩剧', '故事', '回忆杀'], color: '#9a8faa', soft: '#e7e0ee', petal: '#b6b1d0', heart: '#e7b8b7' },
  { id: 'qq-kpop', name: '感性 Kpop', subtitle: '那些让你心动的旋律', english: 'Little heartbeats', category: 'K-POP · 心动', note: '女团男团混合，旋律热门、抒情偏多。', tags: ['旋律', '抒情', '心动'], color: '#aa8792', soft: '#eedce3', petal: '#d5aebd', heart: '#efc6ac' },
] as const

export type PlaylistTrack = typeof source[number]['tracks'][number]
export const playlists = source.map((playlist, index) => ({
  ...playlist,
  theme: themes[index],
  number: String(index + 1).padStart(2, '0'),
  platformName: playlist.platform === 'netease' ? '网易云音乐' : 'QQ 音乐',
}))
export type Playlist = typeof playlists[number]

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

const searchIndex = new Map<string, string[]>()
for (const playlist of playlists) for (const track of playlist.tracks) {
  const fields = [track.title, ...track.artists, track.album, ...track.aliases]
  searchIndex.set(`${playlist.id}:${track.id}`, fields.map(normalize))
}

export function searchTracks(playlist: Playlist, query: string) {
  const words = normalize(query).trim().split(/[\s,，、;；]+/u).filter(Boolean)
  if (!words.length) return playlist.tracks
  return playlist.tracks.filter(track => {
    const fields = searchIndex.get(`${playlist.id}:${track.id}`) ?? []
    return words.some(word => fields.some(field => field.includes(word)))
  })
}

export function playlistDuration(seconds: number) {
  const minutes = Math.round(seconds / 60)
  return minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`
}

export function trackDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
