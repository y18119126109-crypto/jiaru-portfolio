"""Copy the user-provided originals and derive compact RMS waveform envelopes."""
from array import array
from pathlib import Path
import json
import math
import shutil
import subprocess
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
TRACKS = [
    ("stay-with-me", Path("/Users/bytedance/Downloads/Stay with Me.mp3")),
    ("rain-talk", Path("/Users/bytedance/Downloads/《Rain Talk》.mp3")),
]
destination = ROOT / "public/audio/music"
destination.mkdir(parents=True, exist_ok=True)
envelopes = {}
for slug, source in TRACKS:
    shutil.copy2(source, destination / f"{slug}.mp3")
    decoded = subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(source),
         "-f", "f32le", "-ac", "1", "-ar", "8000", "pipe:1"],
        check=True, capture_output=True,
    )
    samples = array("f", decoded.stdout)
    bars = []
    for index in range(120):
        chunk = samples[index * len(samples) // 120:(index + 1) * len(samples) // 120]
        bars.append(math.sqrt(sum(value * value for value in chunk) / max(1, len(chunk))))
    maximum = max(bars)
    envelopes[slug] = [round(value / maximum, 3) for value in bars]
    print(f"{slug}: {len(samples) / 8000:.2f}s, {len(bars)} waveform bars")
(ROOT / "src/data/music-waveforms.json").write_text(json.dumps(envelopes, indent=2) + "\n")
