# GitHub Secrets and Vercel Hosting

## GitHub Actions is the control plane

This project deliberately has no web dashboard that can write secrets, start jobs, stop jobs, or send test messages. Configure the worker in GitHub, where sensitive values are protected by repository Actions Secrets.

Open **GitHub repository → Settings → Secrets and variables → Actions** and add these secret names from `config.example.txt`:

| Secret | Purpose |
| --- | --- |
| `MONITOR_ENABLED` | Set `true` to allow the worker to run |
| `SOURCE_URL` | Read-only payment target URL or verified source endpoint |
| `SITE_ADAPTER` | `direct-payment-page` or a future verified adapter ID |
| `SOURCE_USERNAME` / `SOURCE_PASSWORD` | Optional source login credentials |
| `PAYMENT_AMOUNT` / `PAYMENT_METHOD` | Optional adapter configuration |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram notification destination |

After saving secrets, open **Actions → Payment Number Monitor → Run workflow** once. GitHub then runs it every five minutes. Each run makes bounded read-only checks for up to 55 seconds and sends Telegram only when the normalized phone number changes.

## Vercel hosts only a static status page

The Vercel project requires no environment variables for the monitor. It builds the Vite site using `vercel.json`; the page reads the public, non-secret state file from GitHub. There are no Vercel API routes for credential entry, workflow dispatch, or secret management.

> Because this is a public repository, the last detected phone number and worker event summaries in `state/monitor-state.json` are publicly readable. If that number must be private, use a private repository or replace the stored value with a non-reversible hash and do not display it.
