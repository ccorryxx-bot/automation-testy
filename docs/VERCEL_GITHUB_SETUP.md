# Test-user deployment setup

This version is intentionally optimized to test the full setup → worker → Telegram flow with one test user.

## 1. Configure Vercel environment variables

In **Vercel → automation-testy → Settings → Environment Variables**, add the following values for Production and Preview.

| Variable | Required value |
| --- | --- |
| `GITHUB_OWNER` | `ccorryxx-bot` |
| `GITHUB_REPO` | `automation-testy` |
| `GITHUB_TOKEN` | A fine-grained GitHub token restricted to this repository with Actions Secrets read/write, Actions workflow dispatch, and Contents read/write permissions |

The token is a Vercel server-side secret. Do not enter it into the website form.

## 2. Use the public setup form

Open the website, then enter the source URL, adapter, optional source credentials, payment settings, Telegram bot token, and Telegram chat ID. The form does **not** request a Vercel access key.

`Start monitoring` stores only public source settings in `config/monitor-config.json`. Source credentials, bot token, and chat ID are sealed via the GitHub Actions Secrets public-key API and never committed to the repository.

## 3. Run the test

Click **Test Telegram connection** first. Then click **Start monitoring**. The server dispatches the GitHub Actions workflow immediately; later it runs every five minutes. The worker checks the configured source read-only and sends a Telegram message only when the extracted phone number changes.

## Public-product next step

For many users, replace the single shared config file and shared GitHub Secrets with authenticated per-user jobs and an encrypted database. Do not expose this test controller publicly without user authentication and rate limiting.
