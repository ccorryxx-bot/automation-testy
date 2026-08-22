# Automation Testy

Automation Testy is a test-user monitoring dashboard. A user enters public source settings and any required credentials in the website form, starts the monitor, and receives Telegram notification only when the phone number changes.

## Test flow

1. Enter a **public source URL**, adapter, and public payment settings in the form.
2. Enter optional source login credentials and Telegram delivery values.
3. Click **Test Telegram connection** or **Start monitoring**.
4. The Vercel server seals sensitive values into GitHub Actions Secrets and writes only public source settings to `config/monitor-config.json`.
5. GitHub Actions runs the bounded, read-only checker and commits non-secret state to `state/monitor-state.json`.

The worker never submits a five-digit transfer or slip confirmation.

## Required Vercel environment variables

| Variable | Purpose |
| --- | --- |
| `GITHUB_OWNER` | GitHub repository owner, for example `ccorryxx-bot` |
| `GITHUB_REPO` | Repository name, `automation-testy` |
| `GITHUB_TOKEN` | Fine-grained GitHub token with Actions Secrets read/write, Actions workflow dispatch, and repository contents read/write access |

`GITHUB_TOKEN` stays only in Vercel Environment Variables. The form never asks a user to enter it.
