# AUDIO_TODO.md — Phase 6 audio-asset drop list

Phase 6 restructured the audio CODE paths but did not ship audio FILES. The
gameplay currently uses Bruno's horn MP3 as a placeholder so the cluck code
path works end-to-end. Once you drop in the real files below and flip the
path strings, you're done.

Everything below must be **CC0 / public domain** to keep the MIT license
clean. Bruno's original sounds are licensed per-file (check
`static/sounds/vehicle/*` tags); GCT-added sounds should be CC0 only.

---

## Files to acquire (all CC0)

| Target path (under `static/`)        | What it is                                 | Length        | Source hint                                                          |
|---------------------------------------|--------------------------------------------|---------------|----------------------------------------------------------------------|
| `sounds/chicken/cluck-01.mp3`         | Single sharp chicken cluck (primary)       | 0.3–0.8 s     | freesound.org search "chicken cluck" filter CC0                      |
| `sounds/chicken/cluck-02.mp3`         | Second cluck variant, different pitch/tone | 0.3–0.8 s     | same                                                                  |
| `sounds/chicken/cluck-03.mp3` (opt)   | Third variant for more variety             | 0.3–0.8 s     | same                                                                  |
| `sounds/chicken/cluck-04.mp3` (opt)   | Fourth variant                              | 0.3–0.8 s     | same                                                                  |
| `sounds/chicken/kukdu-ku-loop.mp3`    | Background coop ambience (seamless loop)   | 15–30 s       | freesound.org search "rooster loop" / "farmyard ambience" filter CC0 |

Target loudness: peak -6 dBFS, LUFS ~-16. Run through `ffmpeg -af loudnorm`
if raw files are hot.

---

## Code edits once files are in place

### 1. `sources/Game/Player.js` — swap the cluck placeholder path

Find the block marked `// GCT Phase 6 — one-shot cluck`. Change:

```js
path: 'sounds/vehicle/honk/Car Horn Long 4.mp3', // TODO: replace with 'sounds/chicken/cluck-01.mp3'
```

to:

```js
path: 'sounds/chicken/cluck-01.mp3',
```

### 2. `sources/Game/Player.js` — register the extra cluck variants

Below the primary `this.sounds.cluck` registration there are 2 commented
`this.game.audio.register({ group: 'clucks', ... })` stubs for cluck-02 and
cluck-03. Uncomment them (and add a 4th if you grabbed one). Each new
variant joins the `clucks` audio group automatically — `group.play()` in
`honk()` will cycle through all registered variants in round-robin order.

If you want **random-next instead of round-robin** (so the cluck doesn't
feel predictable), change the call in `honk()` from:

```js
clucksGroup.play()
```

to:

```js
clucksGroup.playRandomNext()
```

Note: `playRandomNext` requires **at least 2 items** in the group, otherwise
it divides by a negative length. Guard check: do this only after registering
at least one variant beyond cluck-01.

### 3. `sources/Game/Player.js` — enable the ambient coop bed

Find the block marked `// GCT Phase 6 — ambient kukdu-ku coop bed`.
Uncomment the `this.sounds.kukduKu = this.game.audio.register({ ... })`
block. It's already set to `autoplay: true, loop: true, volume: 0.08`.

If `0.08` is too loud or too quiet under the music bed, tune the `volume`
there. Howler respects the global mute toggle already, so muting via the
in-game UI also mutes the coop ambience.

### 4. Also swap the tire / engine / suspension sounds? (Optional — Phase 6.5)

These are Bruno's originals and they still fit a driving/racing vibe, but
if you want the chicken physics to sound more "hop-like" than "drive-like",
you could:

- Replace `sounds/vehicle/suspensions/Robotic_Lifeforms_2_..._Chair_07.mp3`
  with a soft squish / feather ruffle CC0 sample (around the spring hit).
- Lower the engine loop volume floor in `Player.js` (currently
  `Math.max(0.05, ...)` — drop to `0`) so you don't hear an idle engine
  when the chicken is stationary. That's a 1-character change.
- Leave wheels-on-pebbles alone — running feet on dirt actually sounds
  right for the chicken at speed.

This is v2 territory — not blocking launch.

---

## Verification after the swap

1. `npm run dev`
2. Press H in the game. Expect a cluck per press, no car horn.
3. Leave the tab idle with audio enabled — expect quiet coop ambience.
4. Open devtools console — no "Audio > Load error" lines.
5. Mute button still works — everything stops together.
