# Security Policy

The project separates public monitor settings from sensitive user data.

| Category | Examples | Storage |
| --- | --- | --- |
| Public configuration | Source URL, site adapter, amount, payment method | `config/monitor-config.json` |
| Sensitive values | Source username/password, Telegram bot token, Telegram chat ID | GitHub Actions Secrets, sealed by the Vercel server before storage |
| Service secret | `GITHUB_TOKEN` | Vercel Environment Variables only |

Never commit source passwords, Telegram tokens, Telegram chat IDs, GitHub tokens, Vercel tokens, cookies, or session data. The worker never submits a five-digit transfer or slip confirmation.

This release is a **test-user controller**. Before general public availability, add real user authentication, per-user data isolation, rate limits, and per-user encrypted secret storage.
