# AI Portfolio Inbox & Insights

`AI Portfolio Inbox & Insights` is a portfolio-ready FastAPI product demo that combines a bilingual inbox widget, AI message triage, SQLite thread grouping, email alerts, an executive dashboard, and optional Google Analytics 4 insights.

## Project overview

This project turns a portfolio contact surface into a lightweight AI product experience:

- Visitors can write in English or Spanish
- Every message is classified, summarized, prioritized, and grouped into a thematic thread
- Messages are stored in SQLite with message-level and thread-level metadata
- Owner notifications are emailed to `c.sanmiguelortega@gmail.com` by default
- A dashboard highlights trends, opportunities, recurring topics, and optional traffic correlations from GA4

## Core features

### Bilingual AI inbox

- Automatic language detection for `en` and `es`
- Reply acknowledgement generated in the same language as the visitor
- Structured analysis fields:
  - `language`
  - `category`
  - `priority`
  - `summary`
  - `key_points`
  - `theme_label`
  - `theme_slug`
  - `thread_title`
  - `reply_text`
  - `lead_score`
  - `sentiment`
- OpenAI structured JSON output when configured
- Local fallback heuristics when OpenAI is unavailable

### Thread grouping and summaries

- Messages are grouped primarily by `theme_slug`
- Threads keep a rolling summary regenerated from recent messages
- Thread priority is updated when newer messages are more urgent
- Thread detail endpoints expose recent related messages for UI and email context

### Email notifications

- Each inbound message is targeted to `OWNER_EMAIL`
- Default owner email is `c.sanmiguelortega@gmail.com`
- Notification includes:
  - sender name
  - sender email
  - original message
  - detected language
  - category
  - priority
  - summary
  - key points
  - sentiment
  - lead score
  - theme label
  - thread title
  - thread summary
  - recent related messages
- If SMTP is not configured, the app still stores messages and keeps working

### Dashboard and insights

- `GET /dashboard` provides a polished analytics-style dashboard
- Dashboard sections include:
  - total messages received
  - messages by priority
  - messages by category
  - messages by language
  - sentiment distribution
  - top themes/topics
  - highest lead-score messages
  - recent high-priority messages
  - message volume over time
  - top recurring interests
  - AI-generated executive summary with fallback
  - Top Opportunities
  - Most Requested Topics

### Google Analytics 4 integration

- Optional server-side GA4 retrieval
- No Google credentials are exposed in frontend code
- `GET /api/dashboard/analytics` returns:
  - total users
  - sessions
  - page views
  - engaged sessions
  - top visited pages
  - sessions/users over time
  - traffic sources/channels
- If GA4 is not configured, the endpoint returns a graceful `not_configured` state

### Combined insights

- `GET /api/dashboard/combined-insights` merges inbox patterns with GA4 data when available
- MVP correlation is a clean approximation based on:
  - top theme frequency
  - keyword overlap between theme labels and top visited pages
  - timing overlap between message volume and traffic trends

## Stack

- Python
- FastAPI
- SQLite
- Jinja2
- HTML/CSS/Vanilla JavaScript
- OpenAI API
- SMTP
- Google Analytics Data API for GA4

## Files

- `app.py`
- `requirements.txt`
- `.env.example`
- `templates/index.html`
- `templates/dashboard.html`
- `static/widget.css`
- `static/widget.js`
- `static/dashboard.js`
- `README.md`

## Routes

- `GET /`
- `GET /dashboard`
- `GET /health`
- `POST /api/inbox`
- `GET /api/messages`
- `GET /api/threads`
- `GET /api/threads/{thread_id}`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/messages`
- `GET /api/dashboard/analytics`
- `GET /api/dashboard/combined-insights`

## Setup

1. Create a virtual environment.

```bash
python -m venv .venv
```

2. Activate it.

Windows PowerShell:

```bash
.venv\Scripts\Activate.ps1
```

3. Install dependencies.

```bash
pip install -r requirements.txt
```

4. Create `.env` from the example.

```bash
copy .env.example .env
```

5. Run locally.

```bash
uvicorn app:app --reload
```

Open:

- [http://127.0.0.1:8000](http://127.0.0.1:8000)
- [http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard)

## Environment variables

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables OpenAI structured analysis and AI summaries |
| `OPENAI_MODEL` | Model used for message analysis and summaries |
| `SMTP_HOST` | SMTP hostname |
| `SMTP_PORT` | SMTP port |
| `SMTP_USERNAME` | SMTP username |
| `SMTP_PASSWORD` | SMTP password or app password |
| `SMTP_USE_TLS` | Enables STARTTLS when `true` |
| `EMAIL_FROM` | Outbound sender identity |
| `OWNER_EMAIL` | Owner inbox for notifications, defaults to `c.sanmiguelortega@gmail.com` |
| `APP_BASE_URL` | Base URL used in email links |
| `DATABASE_PATH` | SQLite file path |
| `AI_MATCH_THRESHOLD` | Reserved matching sensitivity setting |
| `GA4_PROPERTY_ID` | Google Analytics 4 property ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account credentials JSON for server-side GA4 access |

## SMTP behavior

- If SMTP is configured, every message sends a structured owner notification
- If SMTP is missing or fails, the app logs the issue and still stores the message
- Frontend behavior remains graceful even when email delivery is unavailable

## GA4 credentials setup

1. Create a Google Cloud service account with access to the GA4 property.
2. Grant the service account read access in Google Analytics.
3. Download the JSON credentials file.
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to that file path.
5. Set `GA4_PROPERTY_ID` to the numeric GA4 property ID.

The frontend never receives these credentials. All analytics retrieval is handled server-side.

## Fallback behavior

- No OpenAI key:
  - message analysis falls back to deterministic heuristics
  - thread summaries and executive summaries fall back to template summaries
- No SMTP:
  - message storage still works
  - email delivery is marked as skipped
- No GA4:
  - dashboard still renders inbox insights
  - analytics endpoints return `not_configured`

## Database notes

- The app creates tables automatically on startup
- Lightweight SQLite migration is handled by checking and adding missing columns with `ALTER TABLE`
- Existing older databases should upgrade safely for this MVP as long as the original `threads` and `messages` tables still exist

## Known limitations

- Cross-language semantic grouping is primarily normalized through `theme_slug`, not vector similarity
- Combined traffic-plus-inbox correlation is an honest approximation, not full attribution modeling
- Thread summaries and executive summaries are stronger when OpenAI is configured
- No authentication is included because this is a portfolio/demo MVP
- No background worker queue is used; email and AI calls happen inline

## Future improvements

- Admin authentication for the dashboard
- Async job queue for analysis and email delivery
- Better semantic clustering for multilingual threads
- CSV export and CRM/webhook integrations
- Richer GA4-to-page-to-inquiry attribution logic
- Manual thread management and labeling
