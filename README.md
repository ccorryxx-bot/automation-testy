# Automation Testy

Automation Testy is a Vercel-hosted, read-only status interface for a GitHub Actions payment phone-number monitor. The website contains no control plane and accepts no credentials. GitHub Actions Secrets own the confidential configuration, GitHub Actions owns execution, and the repository holds only non-secret worker state.

## Security model

| Location | What belongs there |
| --- | --- |
| GitHub Actions Secrets | Source URL, site adapter, source credentials, amount/method settings, Telegram bot token, Telegram chat ID, and `MONITOR_ENABLED` |
| GitHub Actions workflow | Bounded read-only monitoring and Telegram notification on a number change |
| Repository `state/monitor-state.json` | Last detected phone number, timestamps, and non-secret event summaries |
| Vercel | Static read-only status page only; no secret configuration or write API |

## Setup

Open [GitHub Actions Secrets](https://github.com/ccorryxx-bot/automation-testy/settings/secrets/actions) and add values using the names listed in [`config.example.txt`](./config.example.txt). Then use the [Payment Number Monitor workflow](https://github.com/ccorryxx-bot/automation-testy/actions/workflows/payment-number-monitor.yml) to run manually once or wait for the five-minute schedule.

The worker never submits a five-digit transfer or slip confirmation.
