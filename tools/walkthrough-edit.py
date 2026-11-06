#!/usr/bin/env python3
"""Lay real footage of the device and the phone beside the walkthrough.

    python3 tools/walkthrough-edit.py <work dir> <out.mp4>

The work dir holds: base.mp4 (from tools/walkthrough.mjs), the footage converted to ordinary colour
(sdr_8854.mp4 = the Ledger, portrait; sdr_1567.mp4 and sdr_1568.mp4 = the phone, landscape), and two labels.
Where the walkthrough waits for a hold or for World, the screen recording goes to the left and the real footage
plays on the right, so the two are seen side by side; the caption line stays as it is. Every time below was read
off the footage of this take. Nothing is re-ordered: each piece of footage sits where it happened.
"""
import subprocess, sys, os

W = sys.argv[1]; OUT = sys.argv[2]
RAW = os.path.join(W, 'base.mp4')
BASE = os.path.join(W, 'base_fixed.mp4')
ENC = ['-an', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-video_track_timescale', '15360']
BG = '0xEBE8E3'
PW, PH = 596, 885           # the panel for the footage, right of the app
parts = []

def run(args):
    r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + args, cwd=W)
    if r.returncode: sys.exit('ffmpeg failed: ' + ' '.join(args)[:300])

def fix_captions():
    """In this take the caption line is cut off from 80.77 s on (the window changed size when another page was
    pictured). The captions of those scenes are drawn again, whole, over the same place."""
    caps = [('cap1.png', 80.767, 85.0), ('cap2.png', 85.0, 90.2), ('cap3.png', 90.2, 93.8), ('cap4.png', 93.8, 98.6), ('cap5.png', 98.6, 102.0), ('cap6.png', 102.0, 106.0)]
    ins, fc, last = ['-i', RAW], [], '0:v'
    for i, (f, a, b) in enumerate(caps):
        ins += ['-i', f]; fc.append(f"[{last}][{i + 1}:v]overlay=0:925:enable='between(t,{a},{b - 0.001})'[v{i}]"); last = f'v{i}'
    run(ins + ['-filter_complex', ';'.join(fc), '-map', f'[{last}]', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', BASE])

def clip(f, speed=1.0):
    """A scene recorded on its own (tools/walkthrough.mjs with SCENE=…), laid in whole."""
    name = f'p{len(parts):03d}.mp4'
    run(['-i', f, '-vf', f'setpts=PTS/{speed},fps=30,scale=1920:1080,setsar=1'] + ENC + [name]); parts.append(name)

def full(a, b):
    """A stretch of the walkthrough, as recorded."""
    if b - a < 0.05: return
    name = f'p{len(parts):03d}.mp4'
    run(['-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', BASE, '-vf', 'fps=30,setsar=1'] + ENC + [name])
    parts.append(name)

def scene(a, b, cut=0.0, tail=0.7):
    """A scene with `cut` seconds of standing still taken out, just before its last `tail` seconds."""
    if cut <= 0: return full(a, b)
    full(a, b - tail - cut); full(b - tail, b)

def footage(name, clips):
    """Footage for the right panel: [(file, in, out, speed, crop)], joined, each cropped to the panel's shape."""
    ins, fl = [], []
    for i, (f, a, b, sp, crop) in enumerate(clips):
        ins += ['-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', f]
        fl.append(f'[{i}:v]setpts=PTS/{sp},fps=30,{crop},scale={PW - 8}:{PH - 8},setsar=1[c{i}]')
    fl.append(''.join(f'[c{i}]' for i in range(len(clips))) + f'concat=n={len(clips)}:v=1:a=0,pad={PW}:{PH}:4:4:color=0x1B1630[o]')
    run(ins + ['-filter_complex', ';'.join(fl), '-map', '[o]'] + ENC + [name])
    return sum((b - a) / sp for _, a, b, sp, _ in clips)

def split(a, b, right, dur, label):
    """The walkthrough from a to b on the left (held on its last frame until `dur` is over), the footage on the right."""
    name = f'p{len(parts):03d}.mp4'
    hold = max(0.0, dur - (b - a))
    fc = (f'[0:v]fps=30,setsar=1,tpad=stop_mode=clone:stop_duration={hold:.3f},trim=0:{dur:.3f},setpts=PTS-STARTPTS,split=2[la][lb];'
          f'[la]crop=1500:925:210:0,scale=1268:-2[app];[lb]crop=1920:155:0:925[cap];'
          f'color=c={BG}:s=1920x1080:r=30:d={dur:.3f}[bg];[bg][app]overlay=18:(925-h)/2[t1];[t1][cap]overlay=0:925[t2];'
          f'[1:v]fps=30,trim=0:{dur:.3f},setpts=PTS-STARTPTS[r];[t2][r]overlay=1304:20:eof_action=repeat[t3];[t3][2:v]overlay=1308:24[o]')
    run(['-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', BASE, '-i', right, '-loop', '1', '-t', f'{dur:.3f}', '-i', label,
         '-filter_complex', fc, '-map', '[o]', '-t', f'{dur:.3f}'] + ENC + [name])
    parts.append(name)

LED = 'crop=1080:1604:0:158'                      # the Ledger, portrait footage
def PHN(x0): return f'crop=727:1080:{x0}:0'        # the phone, cut out of landscape footage
B, A, C = 'sdr_8854.mp4', 'sdr_1567.mp4', 'sdr_1568.mp4'

def still(image, dur):
    """A still card (the title, redrawn so that it says what this cut is)."""
    name = f'p{len(parts):03d}.mp4'
    run(['-loop', '1', '-t', f'{dur:.3f}', '-i', image, '-vf', 'scale=1920:1080,fps=30,setsar=1'] + ENC + [name]); parts.append(name)

fix_captions()
# ── who, the problem, what she does, the switchboard, adding a row ──
if os.path.exists(os.path.join(W, 'title.png')): still('title.png', 2.4)
else: full(1.0, 3.3)
scene(3.3, 6.7, 0.5); scene(6.7, 11.1, 0.6); scene(11.1, 18.5, 0.9); scene(18.5, 22.3, 1.1)
clip('scene-row.mp4', 1.15)        # choosing the API from the list (recorded on its own: the list is the page's own now)
scene(26.0, 30.8, 1.0)
# ── approve: the page waits, the Ledger asks, she taps "See it", reads four lines, holds ──
d = footage('r1.mp4', [(B, 26.6, 37.5, 1.6, LED)]); split(30.8, 34.10, 'r1.mp4', d, 'label-ledger.png')
d = footage('r1s.mp4', [(B, 37.6, 40.4, 1.4, LED)]); split(34.4, 34.4 + d, 'r1s.mp4', d, 'label-ledger.png')
scene(34.4 + d, 40.8, 1.2)
# ── a routine call, and 0G's request id ──
scene(40.8, 45.6, 0.8); scene(45.6, 49.3, 0.5); scene(49.3, 53.3, 0.6)
# ── a heavy call: the refund waits, she holds, it goes out once ──
full(53.3, 55.6)
d = footage('r2.mp4', [(B, 64.6, 76.0, 1.6, LED)]); split(55.6, 60.40, 'r2.mp4', d, 'label-ledger.png')
d = footage('r2s.mp4', [(B, 76.2, 79.0, 1.4, LED)]); split(60.6, 60.6 + d, 'r2s.mp4', d, 'label-ledger.png')
full(60.6 + d, 65.4)
# ── refused: an email sends the tool somewhere else (the chat, recorded on its own), and the Ledger shows it too ──
clip('scene-refuse.mp4')
d = footage('r3.mp4', [(B, 83.2, 87.5, 1.0, LED)]); split(65.9, 70.2, 'r3.mp4', d, 'label-ledger.png')
# ── the trail, and the proof ──
scene(70.2, 74.6, 1.0); scene(74.6, 80.8, 1.4); scene(80.8, 85.0, 0.6)
# ── lighting the tool: the code on the page, her phone, World App, and the page changing by itself ──
scene(85.0, 90.2, 1.4)
d = footage('rw.mp4', [(C, 1.8, 3.8, 1.0, PHN(820)), (A, 6.0, 8.4, 1.3, PHN(790)), (A, 17.6, 22.6, 1.5, PHN(730)), (C, 7.2, 9.2, 1.0, PHN(790))])
split(90.2, 93.50, 'rw.mp4', d, 'label-phone.png')
d = footage('rws.mp4', [(C, 13.4, 15.9, 1.0, PHN(420))]); split(93.8, 93.8 + d, 'rws.mp4', d, 'label-phone.png')
full(93.8 + d, 98.6)
scene(98.6, 102.0, 0.6); scene(102.0, 106.0, 1.0)
full(106.0, 109.4)

open(os.path.join(W, 'parts.txt'), 'w').write(''.join(f"file '{p}'\n" for p in parts))
# Joined by decoding every part into one stream: the result has one clean clock, whatever the parts carried.
ins = [x for p in parts for x in ('-i', p)]
run(ins + ['-filter_complex', ''.join(f'[{i}:v]' for i in range(len(parts))) + f'concat=n={len(parts)}:v=1:a=0,fps=30[o]', '-map', '[o]',
           '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT])
print(len(parts), 'parts ->', OUT)
