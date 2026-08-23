# Security Policy

The project separates the one public monitor setting from sensitive user-supplied values. The setup form intentionally excludes technical source settings such as adapter names, payment channels, amounts, encrypted-login options, request paths, and polling settings.

| Category | Examples | Storage |
| --- | --- | --- |
| Public configuration | Source URL and automatically resolved source identifier | `config/monitor-config.json` |
| Sensitive values | Source username/password, Telegram bot token, Telegram User ID | GitHub Actions Secrets, sealed by the Vercel server before storage |
| Service secret | `GITHUB_TOKEN` | Vercel Environment Variables only |

Never commit source passwords, Telegram tokens, Telegram User IDs, GitHub tokens, Vercel tokens, cookies, authorization values, encrypted login payloads, or session data. The server stores the User ID in its internal `TELEGRAM_CHAT_ID` secret only because Telegram's send-message API uses that internal parameter name. The shared source-adapter safety guard rejects payment-completion paths; the worker never submits a transfer, payment proof, five-digit slip/reference, or deposit confirmation.

This release is a **test-user controller**. Before general public availability, add real user authentication, per-user data isolation, rate limits, and per-user encrypted secret storage.
