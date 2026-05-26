# 🏠 Chore Tracker — DEPRECATED

> ## ⚠️ This repo is deprecated and will be archived
>
> **Why:** Chore Tracker is a browser-only family-task app — it does not call any
> HA service or write to HA state, so HACS reviewers correctly flagged it as
> **out-of-scope for HACS**. Persisting family data in `localStorage` also means
> it is silently lost when the browser cache is cleared, which is the wrong
> trade-off for a chore tracker.
>
> **HACS status:** [PR #6258](https://github.com/hacs/default/pull/6258) was closed by HACS reviewers for the reasons above.
>
> **What to use instead:** a dedicated chore app (e.g. Sweepy, OurChores, or a
> simple shared note in Google Keep / Apple Reminders). Future direction for this
> idea would be a standalone PWA, not a HACS plugin.
>
> Existing installs will continue to work as-is, but no further updates will be
> published. **Back up your chore history from the browser's `localStorage`
> (key prefix `ha-chore-tracker-…`) if you want to keep it.**

![Preview](banner.png)

Track household chores, who did what and when.

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1+-blue.svg?logo=homeassistant)](https://www.home-assistant.io/) [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![Version](https://img.shields.io/badge/Version-4.0.0-success.svg)](#changelog)

> Part of the [HA Tools](https://github.com/MacSiem) ecosystem — split into individual HACS-installable plugins.

## Installation (HACS)

1. Open HACS → Frontend → ⋮ → **Custom repositories**
2. Repository URL: `https://github.com/MacSiem/ha-chore-tracker` — Category: **Lovelace**
3. Install **Chore Tracker** from HACS
4. Restart Home Assistant

## Usage

### Lovelace card

```yaml
type: custom:ha-chore-tracker
```

### Optional sidebar panel (`configuration.yaml`)

```yaml
panel_custom:
  - name: ha-chore-tracker
    sidebar_title: Chore Tracker
    sidebar_icon: mdi:home-assistant
    url_path: ha-chore-tracker
    js_url: /local/community/ha-chore-tracker/ha-chore-tracker.js
    embed_iframe: false
    config: {}
```

After restart, **Chore Tracker** appears in the HA sidebar.

## Features

- Track household chores, who did what and when.
- Bundled Bento Design System (light + dark mode, mobile-friendly)
- Self-contained — no shared HA Tools dependency
- HA `frontend/set_user_data` cross-device persistence (with `localStorage` cache fallback)

## Privacy

- No telemetry, no analytics, no tracking
- No external network calls, no CDN-hosted assets (system fonts only)
- All data stays on your Home Assistant instance

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Support

If this tool makes your Home Assistant life easier, consider supporting development:

- [☕ Buy Me a Coffee](https://buymeacoffee.com/macsiem)
- [💳 PayPal](https://www.paypal.com/donate/?hosted_button_id=Y967H4PLRBN8W)

## License

MIT — see [LICENSE](LICENSE).
