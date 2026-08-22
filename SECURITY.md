# Security Policy

This repository is intentionally public. Never commit Telegram bot tokens, source-site passwords, cookies, session values, GitHub tokens, Vercel tokens, dashboard access keys, or real payment URLs containing private order data.

The dashboard sends sensitive setup values only to Vercel serverless API routes. Those routes encrypt and write values to GitHub Actions Secrets. The scheduled worker reads credentials from GitHub Secrets and commits only non-secret monitoring state to `state/monitor-state.json`.

If a credential is committed accidentally, revoke or rotate it immediately and remove it from Git history before continuing.
