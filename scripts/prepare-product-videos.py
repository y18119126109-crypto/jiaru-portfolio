"""Prepare full-length, silent product recordings for static Pages hosting.

Run with ffmpeg on PATH, or imageio_ffmpeg on PYTHONPATH.
Optional arguments replace the two original input paths; originals stay untouched.
"""
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/video/products"
OUTPUT.mkdir(parents=True, exist_ok=True)
ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

sources = sys.argv[1:] or [
    "/Users/bytedance/Library/Application Support/LarkShell/screenshot/20260924153027_rec_.mp4",
    "/Users/bytedance/Library/Application Support/LarkShell/screenshot/20260924153549_rec_.mp4",
]
if len(sources) != 2:
    raise SystemExit("Pass Rain Writer and Swagger recordings, in that order.")

manifest = []
for source, slug, poster_time in zip(sources, ["rain-writer", "swagger"], [15, 112]):
    video = OUTPUT / f"{slug}.mp4"
    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "warning", "-i", source,
        "-map", "0:v:0", "-an", "-vf", "scale=1920:-2:flags=lanczos,fps=24",
        "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "1400k",
        "-bufsize", "2800k", "-pix_fmt", "yuv420p", "-threads", "2",
        "-g", "48", "-movflags", "+faststart", str(video),
    ], check=True)
    if video.stat().st_size >= 25 * 1024 * 1024:
        raise SystemExit(f"{video.name} exceeds the Pages per-file size limit")
    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "warning", "-ss", str(poster_time),
        "-i", str(video), "-frames:v", "1", "-update", "1", "-q:v", "2",
        str(OUTPUT / f"{slug}-poster.jpg"),
    ], check=True)
    manifest.append({"file": video.name, "bytes": video.stat().st_size, "posterSecond": poster_time})
    print(f"{video.name}: {video.stat().st_size / 1048576:.2f} MiB", flush=True)

report = ROOT / ".artifacts/product-video/encoded.json"
report.parent.mkdir(parents=True, exist_ok=True)
report.write_text(json.dumps(manifest, indent=2))
