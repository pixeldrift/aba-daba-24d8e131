# Architecture Notes — Plan

## 1. User-prefs hooks (future-ready)

`useUserPrefs()` already planned for alerts. Extend with:

- `snoozeMs` (default 60_000)
- `autofadeAlertMs` (default 5_000)
- `autofadeInfoMs` (default 6_000)
- `maxStackVisible` (default 3)
- `notificationSounds: { chime: boolean }`
