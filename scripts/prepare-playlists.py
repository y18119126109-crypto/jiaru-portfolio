"""Normalize verified platform responses, preserving playlist order and editions.

Sources: .artifacts/{netease-*,qq-*}-{detail,songs}.json.
QQ playlist IDs come from the QR codes in the user's portfolio.
No audio, artwork or account data is copied into the application.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    ("netease-kpop", "netease", "17983347132", 14),
    ("netease-cpop", "netease", "17983626111", 37),
    ("netease-classical", "netease", "17983561617", 21),
    ("qq-ost", "qq", "9716001654", 22),
    ("qq-kpop", "qq", "9716002709", 58),
]

def clean(value):
    return html.unescape(re.sub(r"<[^>]*>", "\n", value or "")).strip()

result = []
for slug, platform, ident, expected in SOURCES:
    raw = json.loads((ROOT / f".artifacts/{slug}-detail.json").read_text())
    if platform == "netease":
        playlist = raw["playlist"]
        details = json.loads((ROOT / f".artifacts/{slug}-songs.json").read_text())["songs"]
        by_id = {song["id"]: song for song in details}
        songs = [by_id[entry["id"]] for entry in playlist["trackIds"]]
        assert playlist["trackCount"] == len(songs) == expected
        tracks = [{
            "id": str(song["id"]), "title": clean(song["name"]),
            "artists": [clean(artist["name"]) for artist in song["artists"]],
            "album": clean(song["album"]["name"]),
            "duration": round(song["duration"] / 1000),
            "url": f'https://music.163.com/song?id={song["id"]}',
            "aliases": list(dict.fromkeys(song.get("alias", []) + song.get("transNames", []))),
        } for song in songs]
        title, description = playlist["name"], playlist["description"]
        url = f"https://music.163.com/playlist?id={ident}"
    else:
        playlist = raw["cdlist"][0]
        songs = playlist["songlist"]
        assert playlist["total_song_num"] == playlist["songnum"] == len(songs) == expected
        tracks = [{
            "id": song["songmid"], "title": clean(song["songname"]),
            "artists": [clean(artist["name"]) for artist in song["singer"]],
            "album": clean(song["albumname"]), "duration": song["interval"],
            "url": f'https://y.qq.com/n/ryqq/songDetail/{song["songmid"]}',
            "aliases": [],
        } for song in songs]
        title, description = playlist["dissname"], playlist["desc"]
        url = f"https://y.qq.com/n/ryqq/playlist/{ident}"
    assert len({track["id"] for track in tracks}) == expected
    result.append({
        "id": slug, "platform": platform, "platformId": ident,
        "title": clean(title), "description": clean(description), "url": url,
        "count": expected, "duration": sum(track["duration"] for track in tracks),
        "verifiedAt": "2026-09-24", "tracks": tracks,
    })
    print(slug, len(tracks), "verified tracks")
(ROOT / "src/data/playlists-source.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
