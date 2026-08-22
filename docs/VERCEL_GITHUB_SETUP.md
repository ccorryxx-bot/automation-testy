# Vercel and GitHub Setup

## 1. Create the Vercel project

Import this public GitHub repository in Vercel. The dashboard is the Vite application and the `api/` directory contains Vercel serverless functions.

## 2. Add Vercel environment variables

Create a fine-grained GitHub personal access token restricted to this repository. It needs repository Actions secrets read/write access and Actions workflow dispatch access. Add the following values only in Vercel Environment Variables:

| Variable | Value |
| --- | --- |
| `GITHUB_OWNER` | GitHub repository owner name |
| `GITHUB_REPO` | `automation-testy` |
| `GITHUB_TOKEN` | Fine-grained GitHub token with Actions secrets and workflow dispatch access |
| `DASHBOARD_ACCESS_KEY` | A long random passphrase used to protect dashboard API actions |

Redeploy Vercel after adding the variables.

## 3. Use the dashboard once

Open the deployed dashboard. Enter the source URL, site adapter, optional source login, Telegram bot token, Telegram chat ID, and the dashboard access key. Use **Test Telegram** first. Press **Start monitoring** to write encrypted GitHub Secrets and dispatch the worker. The access key is not persisted in the repository.

## 4. What the worker does

GitHub Actions runs every five minutes and can also be launched manually from the Actions tab. Each run remains bounded to 55 seconds and performs a read-only target check every 10 seconds, unless the target has already expired. The worker extracts a Myanmar phone number, compares it with `state/monitor-state.json`, and sends Telegram only when a real change occurs. It never submits a five-digit transfer/slip confirmation.

For the worker to commit updated non-secret state, GitHub repository **Settings → Actions → General → Workflow permissions** must permit read and write access.

## 5. Adding another website flow

Add a new adapter under `scripts/adapters/`, register it in `scripts/adapters/index.mjs`, and keep the same `fetchTarget(config)` interface. An adapter may fetch a verified read-only payment target. It must never submit a five-digit transfer/slip confirmation.
