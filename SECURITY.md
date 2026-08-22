# Security Policy

This repository is public. Never commit Telegram bot tokens, source-site passwords, cookies, session values, GitHub tokens, Vercel tokens, or real private payment URLs.

Secrets belong only in **GitHub Actions Secrets**. The Vercel deployment is static and contains no configuration API, no workflow dispatch endpoint, and no credential input fields.

Only `state/monitor-state.json` is committed by the worker. It contains non-secret monitoring state, but its last detected phone number and event summaries are publicly visible in this public repository. If that is not acceptable, use a private repository or store only a non-reversible hash.
