# Support Request Workflow Design

## Objectives
- Capture structured briefs from customers at `/requests/new`, including files, specs, and contact preferences.
- Issue an auto-generated tracking token and confirmation screen/email immediately after submission.
- Alert internal staff via a configurable email (`NOTIFY_EMAIL`) and persist records for admin follow-up.
- Allow admins to review requests in `/admin/requests`, reply to customers, and trigger email notifications.
- Offer a public tracking view `/request/track/{token}` showing status, timeline, and replies.

## Data Model

### `support_requests`
| Column | Type | Notes |
| --- | --- | --- |
| id | big integer | Primary key |
| reference | string(32) | Human-readable identifier (e.g. `REQ-20251021-0012`) |
| tracking_token | uuid/ulid string | For `/request/track/{token}` |
| status | string | `approved` on submit, future states: `in_review`, `awaiting_customer`, `completed`, `closed` |
| name | string | Required |
| company | string nullable | Optional |
| email | string | Required |
| phone_whatsapp | string | Required WhatsApp-capable number |
| category | string | Enum values: `x-banner`, `pull-up`, `stickers`, `business-cards`, `other`, etc. |
| other_category | string nullable | Free text support when category = `other` |
| title | string | Short job name |
| description | text | Free-form notes |
| specs | json | `{ size: { width, height, unit }, quantity, sides, color, material, finishing, delivery_type }` |
| desired_date | date nullable | Target completion date |
| flexibility | string nullable | `exact` or `plusminus` (±1–2 days) |
| budget_min | decimal(12,2) nullable | Optional |
| budget_max | decimal(12,2) nullable | Optional |
| approved_at | timestamp nullable | Auto-filled on submission |
| last_customer_reply_at | timestamp nullable | |
| last_admin_reply_at | timestamp nullable | |
| metadata | json nullable | Room for future flags |
| created_at / updated_at | timestamps | |

### `support_request_files`
| Column | Type | Notes |
| --- | --- | --- |
| id | big integer | Primary key |
| support_request_id | foreign id | |
| disk | string | Storage disk (`public` or `s3`) |
| path | string | Relative path |
| original_name | string | |
| mime_type | string | |
| size | unsigned big integer | Bytes |
| created_at / updated_at | timestamps | |

### `support_request_messages`
| Column | Type | Notes |
| --- | --- | --- |
| id | big integer | Primary key |
| support_request_id | foreign id | |
| sender_type | string | `customer`, `admin`, `system` |
| sender_id | foreign id nullable | References `users.id` when admin replies |
| body | text | The message content |
| attachments | json nullable | For future multi-file replies |
| notified_at | timestamp nullable | When customer notification sent |
| created_at / updated_at | timestamps | |

### File Storage
- Store uploads on configurable disk (`support_requests` directory).
- Limit: max 5 files, each ≤ 50 MB, allowed types `png,jpg,jpeg,pdf,ai,psd`.
- Persist metadata in `support_request_files` and attach to request responses.

## Notifications
- On submission:
  1. Auto-generate `reference` + `tracking_token`.
  2. Set `status=approved`, `approved_at=now()`.
  3. Send customer confirmation (`SupportRequestSubmitted` mailable) with tracking link, summary, and contact channels.
  4. Send admin alert (`SupportRequestAdminAlert`) to `config('support-requests.notify_email')`.
- On admin reply/status change:
  - Persist `support_request_messages` entry.
  - Email the customer (`SupportRequestUpdated`) including latest message, status, and tracking link.
- Mailables should queue when queue is configured; fall back to sync otherwise.

## HTTP & Inertia Endpoints
- `GET /requests/new` — Inertia `SupportRequests/Create` wizard.
- `POST /requests` — Store new request; returns redirect to thank-you.
- `GET /request/track/{token}` — Inertia `SupportRequests/Track` page.
- `POST /request/track/{token}/messages` — Customer replies (phase 2; optional this iteration).
- `GET /admin/requests` — Inertia index with filters/search.
- `GET /admin/requests/{supportRequest}` — Detail view with timeline, files, specs, and reply box.
- `POST /admin/requests/{supportRequest}/messages` — Admin reply (requires `message` and optional status update).
- `POST /admin/requests/{supportRequest}/status` — Update status without reply (optional for MVP).

## Frontend Experience
- Client form uses multi-step wizard (contact → needs → specs → timeline/budget → files → consent).
- Auto-save draft via `localStorage` keyed by email or token to reduce friction.
- On submit, show confirmation with request reference, summary, and buttons to copy tracking link or start new request.
- Tracking page displays current status, timeline of admin/customer messages, and attachments overview.
- Admin dashboard leverages `AdminDashboard` layout, table with quick filters (status, category, due date), and detail panel for replies.

## Config & Env
- Add `NOTIFY_EMAIL` to `.env.example`.
- Provide `config/support-requests.php` that reads `env('NOTIFY_EMAIL', 'printair2@gmail.com')`.
- Centralize allowed categories/spec options in config for reuse on both sides (exposed via API).

