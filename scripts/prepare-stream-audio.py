"""Create a quiet, seamless loop from gluckose's CC0 woodland stream recording.

Source and provenance: public/audio/CREDITS.md.
Requires ffmpeg (or imageio-ffmpeg); pass the downloaded source as argv[1].
"""
import os
from pathlib import Path
import shutil
import subprocess
import sys

ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / "public/audio/woodland-stream.mp3"
target.parent.mkdir(parents=True, exist_ok=True)

# Preserve the recording's spatial detail and natural burbles. Only remove
# sub-bass rumble and soften the very top end; never synthesize or pitch-shift.
# Swapping the halves puts the join inside the file. A 3-second equal-power
# crossfade hides the source endpoints; the loop boundary stays consecutive.
filters = (
    "[0:a]atrim=start=32:duration=24,asetpts=PTS-STARTPTS[tail];"
    "[1:a]atrim=start=8:duration=24,asetpts=PTS-STARTPTS[head];"
    "[tail][head]acrossfade=d=3:c1=qsin:c2=qsin,"
    "highpass=f=65,highshelf=f=5500:g=-3,loudnorm=I=-23:TP=-6:LRA=7[out]"
)
subprocess.run([
    ffmpeg, "-hide_banner", "-nostdin", "-y", "-i", os.fspath(source), "-i", os.fspath(source),
    "-filter_complex", filters, "-map", "[out]", "-ar", "44100",
    "-c:a", "libmp3lame", "-b:a", "160k",
    "-metadata", "title=Woodland stream",
    "-metadata", "artist=gluckose",
    "-metadata", "comment=CC0; Freesound 333987; trimmed, EQ, loop crossfade",
    os.fspath(target),
], check=True)
if target.stat().st_size < 100_000:
    raise RuntimeError("Audio export produced no usable recording")
