# Automation Testy

Automation Testy is a Vercel-ready dashboard for detecting payment phone-number changes and sending Telegram alerts. It is designed for public repositories: credentials stay in Vercel environment variables and GitHub Actions Secrets, while only non-secret monitoring state is committed to the repository.

## What it does

1. The dashboard accepts a source URL, site adapter, optional source login details, Telegram bot token, and Telegram chat ID.
2. Vercel API routes encrypt and save setup values as GitHub Actions Secrets.
3. The GitHub Actions worker runs every five minutes or on manual dispatch.
4. The worker performs bounded 10-second read-only checks inside each five-minute scheduled run, extracts Myanmar phone numbers, compares them with the last detected value, and notifies Telegram only on a change.
5. The worker never submits a five-digit transfer/slip confirmation.

## Repository layout

| Path | Purpose |
| --- | --- |
| `client/` | Minimal Scandinavian dashboard UI |
| `api/` | Vercel serverless routes for secure GitHub Secrets configuration |
| `scripts/worker.mjs` | Scheduled number-checking worker |
| `scripts/adapters/` | Reusable source-site adapters |
| `state/monitor-state.json` | Non-secret last-number and activity state |
| `.github/workflows/` | Scheduled and manual GitHub Actions workflow |
| `docs/VERCEL_GITHUB_SETUP.md` | Deployment and configuration guide |

## Security rules

Do not commit real credentials. See [SECURITY.md](./SECURITY.md), [configuration names](./config.example.txt), and [Vercel/GitHub setup](./docs/VERCEL_GITHUB_SETUP.md).
