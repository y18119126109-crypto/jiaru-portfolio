import { pinyin } from 'pinyin-pro'
import type { Playlist, PlaylistTrack } from './playlists'

const indexes = new Map<string, Map<string, string[]>>()

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function getIndex(playlist: Playlist) {
  const existing = indexes.get(playlist.id)
  if (existing) return existing
  const index = new Map<string, string[]>()
  for (const track of playlist.tracks) {
    const fields = [track.title, ...track.artists, track.album, ...track.aliases]
    index.set(String(track.id), fields.flatMap(field => [
      normalize(pinyin(field, { toneType: 'none', type: 'array' }).join('')),
      normalize(pinyin(field, { pattern: 'first', toneType: 'none', type: 'array' }).join('')),
    ]))
  }
  indexes.set(playlist.id, index)
  return index
}

export function searchTracksWithPinyin(playlist: Playlist, query: string): PlaylistTrack[] {
  const words = normalize(query).trim().split(/[\s,，、;；]+/u).filter(Boolean)
  if (!words.length) return playlist.tracks
  const index = getIndex(playlist)
  return playlist.tracks.filter(track => {
    const fields = index.get(String(track.id)) ?? []
    return words.some(word => fields.some(field => field.includes(word)))
  })
}
