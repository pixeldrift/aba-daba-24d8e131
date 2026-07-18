# UI sound effects

Drop a `.wav` or `.mp3` in this folder named to match one of the keys
below and it's wired up automatically — no code changes needed (see
`src/lib/soundEffects.ts`, which globs this folder at build time).

| Trigger (in the app)                          | File name           |
| ---------------------------------------------- | -------------------- |
| Startup / welcome (on app load)                | `startup`            |
| New Session                                    | `session-start`      |
| Resume Session (unpause, or continue previous) | `session-resume`     |
| Pause Session                                  | `session-pause`      |
| Discard Session                                | `session-discard`    |
| Submit Data                                    | `submit`              |
| Tally up (Frequency / Rate increment)          | `tally-up`            |
| Tally down (Frequency / Rate decrement)        | `tally-down`          |
| Yes / Correct / Independent                    | `correct`             |
| No / Error                                     | `error`               |
| Cancel / No Response                           | `no-response`         |
| Prompted                                       | `prompted`            |
| Click / check / toggle                         | `click`               |
| Drawer slide (open)                            | `drawer-slide`        |
| Twirldown (card expands to show all trials)    | `twirldown`           |
| Question / confirm dialog                      | `question`            |
| Popup / dropdown opens                         | `popup`               |
| Warning (destructive-action confirm)           | `warning`             |
| Success / completion                           | `success`             |

Both extensions are supported per key — `tally-up.wav` and `tally-up.mp3`
both resolve the same way, so use whichever you have. Until a file exists
for a given key, that trigger is a silent no-op.
