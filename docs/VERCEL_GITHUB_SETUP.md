# Test-user deployment setup

This version is intentionally optimized to test one complete setup → background monitoring → Telegram flow. The user-facing form asks only for information the user already has; source-specific technical behavior is handled in the background.

## 1. Configure Vercel environment variables

In **Vercel → automation-testy → Settings → Environment Variables**, add the following values for Production and Preview.

| Variable | Required value |
| --- | --- |
| `GITHUB_OWNER` | `ccorryxx-bot` |
| `GITHUB_REPO` | `automation-testy` |
| `GITHUB_TOKEN` | A fine-grained GitHub token restricted to this repository with Actions Secrets read/write, Actions workflow dispatch, and Contents read/write permissions |

The token is a Vercel server-side secret. Do not enter it into the website form.

## 2. Use the setup form

Open the website and enter only:

| Field | When to provide it |
| --- | --- |
| Source URL | Always |
| Source account and password | Only when the source requires a login |
| Telegram bot token and chat ID | Always, for alerts |

The form does **not** request a Vercel access key, adapter name, payment amount, payment method, channel code, request path, parsing rule, or polling setting. The background resolver identifies supported source URLs and selects the matching adapter automatically.

`Start monitoring` stores only the source URL and resolved source identifier in `config/monitor-config.json`. Account credentials, bot token, and chat ID are sealed through the GitHub Actions Secrets public-key API and never committed to the repository.

## 3. Run the test

Click **Test Telegram connection** first. Then click **Start monitoring**. The server dispatches the GitHub Actions workflow immediately; later it runs every five minutes. Each run makes one fresh, read-only source check, records a baseline on the first successful number, and sends Telegram only when a later number changes.

The dashboard shows source status and recent activity. A CAPTCHA, unavailable session, or unsupported source is shown as a clear background status rather than requiring the user to supply technical fields. No source adapter may submit a transfer, payment proof, five-digit slip/reference, or payment confirmation.

## Public-product next step

For many users, replace the single shared config file and shared GitHub Secrets with authenticated per-user jobs and an encrypted database. Do not expose this test controller publicly without user authentication and rate limiting.
