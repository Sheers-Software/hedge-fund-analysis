# Self-shoot guide — record each ad yourself (pixel-perfect screen capture)

> **Why this beats the AI clips.** Generative video (Kling) re-draws frames and smears the UI text/
> numbers. Recording the real app keeps every pixel sharp, matches the Sterling VO exactly, and reads as
> authentic — the highest-converting + most compliant option. The Higgsfield `clip-*.mp4` files stay in
> each folder as motion reference only; these recordings replace them.

Per-hook caption beats + VO timings live in [video-build.md](./video-build.md). VO tracks:
`vo-h*-sterling.mp3` in each hook folder.

---

## 1. One-time setup (5 min)
- **Browser:** Chrome, clean. Hide the bookmarks bar (Ctrl+Shift+B), close other tabs, use a fresh
  window. No extensions visible.
- **Account:** log in as **Premium** so the full report / valuation / intelligence are unlocked (the
  screens must match what the ad shows). Have your data/API keys set so prices load.
- **Pre-load:** open the page and let data load BEFORE recording, so there's no spinner on camera
  (except H3, where the generating animation IS the moment).
- **Cursor:** move slowly and deliberately; no jitter. Click decisively.

## 2. Recording tool + settings
- **Easiest (Windows):** Game Bar — `Win+Alt+R` to start/stop, records the active window. Or **macOS:**
  `Cmd+Shift+5` → record selected portion.
- **Best control:** **OBS Studio** (free). Add a *Window Capture* of Chrome, canvas 1920×1080, 30 fps,
  high bitrate. Gives clean, consistent takes.
- Record at **1080p minimum, 30 fps**. Do **2–3 takes** of each — pick the smoothest.

## 3. Getting a 9:16 vertical frame (two options)
- **Option A — record desktop, frame to 9:16 in the editor (recommended).** Record the normal wide app
  (matches your screenshots, pixel-perfect). In the editor, drop the clip on a 1080×1920 canvas, scale
  it up, and keyframe a **slow zoom/pan (Ken Burns)** across the key panel. Pixel-perfect + motion + no
  warping. This is the approach to use.
- **Option B — record a vertical viewport.** Chrome DevTools (`F12`) → device toolbar (`Ctrl+Shift+M`) →
  set a custom size `1080×1920` → record just that region. Only use if the app's narrow layout still
  looks good (the nav collapses to a hamburger at narrow widths — check first).
- For **1:1 feed** variants, the same recording cropped to a centered square.

## 4. Per-hook shoot (pace the on-screen action to the VO; full beats in video-build.md)

### H3 — 5-second demo (the hero) · VO 15.3s
The whole point is "instant analysis." Capture the wow of type → result.
1. Start on the Research Hub home (empty state).
2. Type or click a ticker (**MU**) and hit Search.
3. Let the company data load, then the **AI memo "Generating Intelligence…"** bar + Executive Summary
   stream in.
4. Slow-scroll the streaming memo. End ~15s.

### H1 — is it overvalued? · VO 14.5s
1. Company header with the price (**$1048.51**).
2. Scroll to **Mandatory Metrics**; pause on `TTM PE 23.70 — many stocks trade at 20–28` (the over/under
   read).
3. Hold / drift down the benchmark column. End ~14.5s.

### H2 — ex-newsletter (the memo) · VO 14.6s
1. Open the report (MU).
2. Click **Generate**; let the memo stream — **Executive Summary → Core Thesis** (bull/bear).
3. Slow, steady scroll so the text is readable. End ~14.6s.

### H5 — stop guessing valuation · VO 14.2s
1. Valuation page (MU), **Bull case** visible.
2. **Drag an assumption** (e.g. rev-growth or PE) and let the **share-price / fair-value recalculate**
   on camera — this is the proof.
3. Scroll **Bull → Base → Bear**. End ~14.2s.

> Tip: while recording, play the matching `vo-h*-sterling.mp3` so your pacing lands on the beats. Or
> record a relaxed take and trim to the VO in the editor.

## 5. Assembly in CapCut (free; best for captions + 9:16)
1. New project → canvas **9:16 (1080×1920)**.
2. Import your screen-recording → scale/position; add a slow zoom (Ken Burns) if using Option A.
3. Import `vo-h*-sterling.mp3` → place on the audio track; **trim the video to the VO length** and nudge
   so the key moment lands on the spoken beat.
4. **Captions:** auto-caption from the VO (CapCut “Captions → Auto”), then restyle to bold white +
   accent highlight, bottom-third inside the Reels safe area (per video-build.md). Or type them to match
   the beat table.
5. Add the **end-card**: screenshot the 9:16 end-card from `static-ads.html`, drop it on the last ~1.5s.
6. Keep "Research & education — not investment advice." on screen (a persistent small caption is fine).
7. **Export:** 1080×1920, H.264, 30 fps, ~8–15s. Also export a 1:1 / 4:5 crop for feed.

## 6. Compliance recap (every cut)
- Real screens only ✓ (this is real capture). No returns / "get rich" / performance guarantee.
- Not-advice line legible. Prices shown are the real in-app prices. No synthetic presenter.

## 7. Naming + where to save
Save final cuts next to each hook's assets: `h<n>-.../final-9x16.mp4`, `final-1x1.mp4`. Log them in the
[README](./README.md) tracker (replace the ⏳ in the “Final assemble” column).
