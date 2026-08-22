# Source Adapter Contract

## Purpose

Automation Testy keeps the setup experience intentionally small. A user supplies only a **source URL**, optional **source-account username and password**, and Telegram delivery values. The monitor determines the source workflow in the background; it never asks users for an adapter name, payment channel code, request payload, amount, polling setting, encrypted-login setting, or parsing selector.

## Background flow

Each five-minute scheduled run resolves the persisted source URL to a background adapter. The adapter performs only the source-specific read-only work required to identify a current payment recipient number. The shared worker owns the rest: result classification, Myanmar-number normalization, baseline/change comparison, Telegram notification, state persistence, and user-visible activity messages.

| Layer | Responsibility | User input required |
| --- | --- | --- |
| Setup | Store source URL and sealed account/Telegram credentials | Yes, only values the user already knows |
| Resolver | Identify a known source from its URL or use the public-page probe | No |
| Source adapter | Authenticate when supported, discover a fresh target, and return a normalized result | No technical fields |
| Shared worker | Compare numbers, deduplicate alerts, save non-secret status, and notify Telegram | No |
| Dashboard | Start, stop, test Telegram, and show concise source status | No technical fields |

## Normalized adapter result

Every adapter returns one normalized result rather than exposing raw site behavior to the worker.

| Outcome | Meaning | Worker action |
| --- | --- | --- |
| `found` | A current target was read; adapter supplies page content or normalized phone numbers | Extract, compare, and notify only on a true change |
| `blocked` | The source requires a CAPTCHA, human challenge, or unavailable authenticated session | Save a clear blocked status; do not retry a state-changing request |
| `unsupported` | The source cannot yet be inspected by a known adapter | Save a supported-source discovery status; do not ask for technical fields |
| `expired` | A read-only target reported expiry | Save expiry status; never renew through payment confirmation |
| `error` | Network or upstream failure | Save a sanitized failure status and retry on the next scheduled run |

Adapters must provide only sanitized details for the public state file. They must not return passwords, cookies, authorization values, encrypted request bodies, raw upstream error bodies, slip references, or payment-confirmation data.

## Mandatory safety boundary

An adapter may inspect a public page, create an authenticated session where the source permits it, request source metadata, or use an already verified read-only target-discovery request. It **must never** invoke a transfer, upload payment proof, submit a five-digit slip/reference, confirm a deposit, or call a payment-completion endpoint. This deny-list is enforced in source-adapter code and is not a user-configurable setting.

## New source handling

Unknown URLs first receive the generic public-page probe. When the page exposes a usable recipient number, no custom user configuration is needed. When the source uses a different authenticated flow, the dashboard reports a neutral source-discovery status while a dedicated adapter is added behind the same contract. The user is never asked to reverse-engineer that source or enter technical implementation values.

## MMK1053 current adapter status

MMK1053 is automatically recognized from its source URL. The verified encrypted login evidence shows that the source currently requires a Geetest CAPTCHA before issuing an authenticated session. The adapter therefore records `blocked` with a concise explanation instead of attempting to bypass the challenge or create a payment target. A future source-approved, non-interactive authentication method can be added only inside this adapter; the form and shared worker do not need to change.
