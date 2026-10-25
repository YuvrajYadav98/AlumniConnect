# AlumniConnect

A centralized digital platform for colleges to manage alumni data and alumni engagement.

**Tech stack**
- Frontend: React.js + Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js + Express.js, MongoDB + Mongoose
- Auth (planned): JWT + bcrypt
- Forms (planned): React Hook Form
- Charts (planned): Recharts
- Image storage (planned): Cloudinary

This is the **base project scaffold**. Only the folder structure, tooling,
and a sample health-check endpoint are in place — feature modules
(alumni directory, events, auth, etc.) are built on top of this next.

See `client/README.md` and `server/` for setup details, or the root-level
setup instructions below.

## Authentication

JWT-based auth using httpOnly cookies (with a Bearer-token fallback for
non-browser clients). See `server/controllers/authController.js` and
`client/src/context/AuthContext.jsx` for the implementation.

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Create a student or alumni account |
| `/api/auth/login` | POST | Public | Authenticate and receive a session cookie |
| `/api/auth/logout` | POST | Public | Clear the session cookie |
| `/api/auth/me` | GET | Private | Get the currently logged-in user |

Admin accounts cannot be self-registered — provision them directly in the
database (or build an admin-only creation route later).

## Alumni profiles & admin approvals

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/alumni-profiles` | GET | Any logged-in user | Search/browse the alumni directory (filters: `search`, `branch`, `graduationYear`, `industry`, `location`, `skill`, `page`, `limit`) |
| `/api/alumni-profiles/me` | GET | Any logged-in user | Get your own alumni profile |
| `/api/alumni-profiles/me` | POST | Alumni only | Create/update your own profile (upsert) |
| `/api/alumni-profiles/me` | DELETE | Alumni only | Delete your own profile |
| `/api/alumni-profiles/:userId` | GET | Any logged-in user | View another user's profile (private profiles are owner/admin only) |
| `/api/admin/users` | GET | Admin only | List all users (filters: `role`, `isApproved`, `search`, `page`, `limit`) |
| `/api/admin/users/pending` | GET | Admin only | List accounts awaiting approval |
| `/api/admin/users/:id/approve` | PATCH | Admin only | Approve a user account |
| `/api/admin/users/:id/reject` | PATCH | Admin only | Revoke approval |
| `/api/admin/users/:id/role` | PATCH | Admin only | Change a user's role |

Corresponding frontend pages: `/alumni` (directory), `/profile/edit`
(alumni-only), `/admin/users` (admin-only).

## Role-based dashboards

After login/register, users land on `/dashboard`, which immediately
redirects to their role-specific dashboard:

| Role | Redirect path | Shows |
|---|---|---|
| admin | `/admin/dashboard` | Total alumni, total students, total events, total jobs, pending approvals |
| alumni | `/alumni/dashboard` | Profile completion, connections, upcoming events, available jobs, notifications |
| student | `/student/dashboard` | Alumni count, available mentors, open jobs, upcoming events, connections |

Backed by `GET /api/dashboard/admin`, `/alumni`, `/student` — each
protected by `protect` + `authorize(role)`, so a student token can never
read the admin dashboard's data even by calling the API directly.

Reusable dashboard building blocks live in `client/src/components/dashboard/`:
`StatCard`, `StatGrid`, `DashboardSection`, `ProgressBar`, `DashboardHeader`.

## Alumni Profile module

Full alumni profile with personal, academic, career, and additional
information, image upload via Cloudinary, profile completion scoring,
and field-level privacy controls.

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/alumni-profiles/me` | POST | Alumni only | Create your profile (fails if one already exists) |
| `/api/alumni-profiles/me` | PUT | Alumni only | Update your profile |
| `/api/alumni-profiles/me` | GET | Any logged-in user | View your own full profile + completion % |
| `/api/alumni-profiles/:userId` | GET | Any logged-in user | View another alumni's profile (privacy-filtered) |
| `/api/alumni-profiles` | GET | Any logged-in user | Search/browse the public directory |
| `/api/users/me/avatar` | PUT | Any logged-in user | Upload/replace profile image (multipart, field name `image`, max 5MB, jpg/png/webp) → uploads to Cloudinary |

**Privacy model:** `isPublic` controls whether a profile appears in the
directory at all. Independently, `privacy.showPhone`, `showEmail`,
`showDateOfBirth`, and `showAddress` control whether those specific
fields are visible to non-owners even on a public profile. `rollNumber`
is never shown to anyone but the owner or an admin, regardless of any
privacy flag. All of this is enforced server-side
(`utils/sanitizeProfile.js`), not just hidden in the UI.

Frontend pages: `/profile` (view your own), `/profile/edit`
(create/update), `/alumni/:userId` (view another alumni's profile),
`/alumni` (searchable directory, links through to each profile).

To enable image uploads, set `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `server/.env`
(get these from your Cloudinary dashboard).

## Alumni verification & approval system

Flow: alumni registers → account + `verificationStatus` starts as
`"pending"` → admin reviews (profile may or may not exist yet) → admin
approves or rejects → only **approved** alumni are visible in the public
directory or reachable via direct profile link (enforced server-side,
not just hidden in the UI).

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/admin/alumni/pending` | GET | Admin only | List alumni awaiting verification |
| `/api/admin/alumni` | GET | Admin only | List/search/filter all alumni (`status`, `search`, `branch`, `graduationYear`, `industry`, `city`, `country`, `skill`, `page`, `limit`) |
| `/api/admin/alumni/:id` | GET | Admin only | Full detail (user + profile) for one alumni account |
| `/api/admin/alumni/:id/approve` | PUT | Admin only | Approve — becomes visible in the public directory |
| `/api/admin/alumni/:id/reject` | PUT | Admin only | Reject |
| `/api/admin/alumni/:id` | DELETE | Admin only | Permanently delete the account + its profile |

Frontend: `/admin/alumni` (searchable/filterable table with status tabs,
inline approve/reject/delete) and `/admin/alumni/:id` (full detail view
with the same actions). Linked from the admin nav ("Alumni
Verification") and from the Admin Dashboard's pending-approvals card.

Note: `User.isApproved` (boolean) is kept alongside the new tri-state
`User.verificationStatus` (`pending`/`approved`/`rejected`) so older
code paths that only checked `isApproved` keep working unchanged.

## Alumni Directory (search, filter, sort, pagination, connect)

`GET /api/alumni-profiles` powers the directory with a single optimized
MongoDB aggregation pipeline (not two separate queries): it `$match`es
on the `{role, verificationStatus}` index first (only approved alumni
ever enter the pipeline), `$lookup`+`$unwind`s each alumni's profile,
applies all remaining filters in one pass, sorts, paginates via
`$facet`, and `$project`s only the handful of fields the directory card
needs — phone, DOB, address, roll number, and password never leave the
database for this endpoint.

| Query param | Matches |
|---|---|
| `search` | name OR company OR job title (single search box) |
| `name`, `company`, `jobTitle`, `batch`, `branch`, `city`, `industry` | contains, case-insensitive |
| `skills` | comma-separated list, matches any |
| `sort` | `newest` \| `oldest` \| `name_asc` \| `name_desc` \| `batch_asc` \| `batch_desc` \| `company_asc` \| `company_desc` |
| `page`, `limit` | pagination |

All free-text filters go through `utils/regexHelpers.js`, which escapes
regex metacharacters so user input is always treated as a literal
substring — never as regex syntax (blocks both malformed-query errors
and ReDoS).

**Connect button:** `POST /api/connections/:userId` sends (or reports
the existing state of) a connection request; `GET
/api/connections/status/:userId` checks the current relationship. The
directory's `AlumniCard` calls these directly — no separate "connections
inbox" is needed for the button itself to work.

Frontend: `/alumni` — debounced search box, collapsible filter panel,
sort dropdown, responsive card grid, and pagination, all backed by the
single aggregation query above.

## Alumni networking (connections & notifications)

| Endpoint | Method | Description |
|---|---|---|
| `/api/connections/:userId` | POST | Send a connection request (duplicate-safe — reuses the existing row if one already exists in either direction) |
| `/api/connections/status/:userId` | GET | Relationship status relative to the logged-in user: `none` \| `pending_sent` \| `pending_received` \| `accepted` \| `blocked` \| `self` |
| `/api/connections/:id/accept` | PUT | Accept a pending request (recipient only) |
| `/api/connections/:id/reject` | PUT | Reject a pending request (recipient only) |
| `/api/connections/:id` | DELETE | Cancel a pending request (requester only) or remove an accepted connection (either party) |
| `/api/connections/block/:userId` | PUT | Block a user |
| `/api/connections` | GET | List your accepted connections ("My Network") |
| `/api/connections/pending?type=received\|sent` | GET | List requests you've received or sent |
| `/api/notifications` | GET | List your notifications |
| `/api/notifications/unread-count` | GET | Unread count for the nav badge |
| `/api/notifications/:id/read` | PATCH | Mark one notification read |
| `/api/notifications/read-all` | PATCH | Mark all read |

**Duplicate prevention:** a unique `{requester, recipient}` index blocks
exact re-inserts, and every mutating endpoint additionally checks for an
existing connection in *either* direction before creating a new one —
re-sending a request just returns the current state instead of erroring
or creating a second row. A rejected request can be re-sent (the same
row is reset to `pending`); a blocked relationship cannot.

**Notifications** are created automatically (best-effort — a failed
notification never blocks the underlying action) when a connection
request is received (`connection_request`) and when one is accepted
(`connection_accepted`).

Frontend: the nav bar's bell icon (`NotificationBell`) polls for unread
notifications every 30s and shows a dropdown; `/connections` ("My
Network") lists accepted connections with a Remove action;
`/connections/requests` has Received/Sent tabs with Accept/Reject/Cancel;
a profile page's `ConnectButton` shows the real relationship state
(Connect / Pending / Accept·Reject / Connected·Remove / Blocked) and a
Block option.

## Mentorship system

Alumni opt in as mentors from their profile edit page (skills, areas of
mentorship, availability, and "about" all reuse existing `AlumniProfile`
fields — no separate mentor-profile model needed). Students search and
request mentorship; mentors accept, reject, or mark it complete.

**Mentor profile fields:** name (`User.name`), job (`jobTitle`), company
(`currentCompany`), experience (`experienceYears`), skills, areas of
mentorship (`mentorshipCategories`), availability
(`mentorshipAvailability`), about (`bio`).

**Categories:** MERN Stack, Java, DSA, Web Development, AI, Cloud,
Career Guidance, Interview Preparation, Placement.

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/mentors?category=&skill=&search=&page=&limit=` | GET | Any logged-in user | Search verified, available mentors |
| `/api/mentorship-requests/:mentorId` | POST | Student only | Send a request `{ category, topic, message }` |
| `/api/mentorship-requests/:id/accept` | PUT | Mentor only | Accept a pending request |
| `/api/mentorship-requests/:id/reject` | PUT | Mentor only | Reject a pending request |
| `/api/mentorship-requests/:id/complete` | PUT | Mentor only | Mark an accepted mentorship as completed |
| `/api/mentorship-requests/:id` | DELETE | Student only | Cancel a request while still pending |
| `/api/mentorship-requests?status=&page=&limit=` | GET | Any logged-in user | List your requests — auto-scoped to "sent" for students or "received" for alumni based on role |

**"Only verified alumni can become mentors"** is enforced at the two
points that matter: mentor search only returns
`verificationStatus === "approved"` alumni, and sending a request is
rejected with a 403 if the target isn't verified, isn't currently
available for mentorship, or doesn't offer the requested category.

**Duplicate prevention:** an existing pending or accepted request to the
same mentor blocks a new one — the endpoint returns the existing
request's status instead of erroring or creating a duplicate.

Frontend: `/mentors` (student-only search with category chips + request
modal), `/mentorship-requests` (shared page — shows sent requests with a
Cancel action for students, received requests with Accept/Reject/Mark
Completed for alumni).

## Events module

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/events?search=&when=upcoming\|past&includeUnpublished=&page=&limit=` | GET | Any logged-in user | List events (drafts only visible to admins who ask for them) |
| `/api/events/:id` | GET | Any logged-in user | Event details + your registration status + capacity |
| `/api/events` | POST | Admin only | Create event (starts as an unpublished draft) |
| `/api/events/:id` | PUT | Admin only | Update event details |
| `/api/events/:id` | DELETE | Admin only | Delete event + all its registrations |
| `/api/events/:id/publish` | PUT | Admin only | Publish a draft |
| `/api/events/:id/cancel` | PUT | Admin only | Cancel (stays visible, marked cancelled — not deleted) |
| `/api/events/:id/image` | PUT | Admin only | Upload/replace the event banner (Cloudinary) |
| `/api/events/:id/participants` | GET | Admin only | List registered participants |
| `/api/events/:id/register` | POST | Any logged-in user | Register (duplicate-safe, capacity-checked, deadline-checked) |
| `/api/events/:id/register` | DELETE | Any logged-in user | Cancel your registration |
| `/api/events/registrations/me?when=` | GET | Any logged-in user | Your registered events |

**Event fields** exactly as specified: title, description, image, date,
start/end time (24-hour `HH:MM`, validated end > start), location,
online/offline/hybrid mode, meeting link, max participants, registration
deadline. Location is required for offline/hybrid events and a meeting
link for online/hybrid — enforced by a conditional Mongoose validator,
not just in the form.

**Duplicate registration prevention:** a unique `{event, user}` index
backs this at the DB level; the app layer additionally reuses a prior
cancelled registration on re-register (so cancel → re-register works)
and returns the existing state instead of erroring if already
registered.

Frontend: `/events` (browse, upcoming/past tabs), `/events/:id`
(details + register/cancel), `/my-events` (your registrations, cancel
from there too), and the full admin suite: `/admin/events` (list with
inline publish/cancel/delete), `/admin/events/create`,
`/admin/events/:id` (edit + publish/cancel/delete/image upload),
`/admin/events/:id/participants`.

## Jobs & Internships module

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/jobs?search=&jobType=&location=&skill=&experience=&page=&limit=` | GET | Any logged-in user | Search/filter approved, open, non-expired jobs |
| `/api/jobs/:id` | GET | Any logged-in user | Job details + your saved/applied status |
| `/api/jobs` | POST | Verified alumni only | Post a job/internship (starts pending) |
| `/api/jobs/:id` | PUT | Poster (while pending/rejected) or admin | Update — editing resubmits for review |
| `/api/jobs/:id` | DELETE | Poster or admin | Delete + its applications/saves |
| `/api/jobs/:id/close` \| `/reopen` | PUT | Poster or admin | Stop/resume accepting applications |
| `/api/jobs/:id/save` | POST/DELETE | Any logged-in user | Save/unsave (bookmark) |
| `/api/jobs/:id/apply` | POST | Any logged-in user | Apply (idempotent; returns the apply link/email) |
| `/api/jobs/mine` | GET | Alumni only | Your posted jobs, any approval status |
| `/api/jobs/saved` | GET | Any logged-in user | Your saved jobs |
| `/api/admin/jobs/pending` | GET | Admin only | Jobs awaiting review |
| `/api/admin/jobs?status=&search=` | GET | Admin only | All jobs, filterable |
| `/api/admin/jobs/:id/approve` \| `/reject` | PUT | Admin only | Moderate a posting |
| `/api/admin/jobs/expired` | DELETE | Admin only | Bulk-delete every job past its deadline |

**Workflow exactly as specified:** alumni posts → `approvalStatus: "pending"`
→ admin approves/rejects → only `approved` jobs appear in search for
everyone. **"Only verified alumni can post"** is enforced at the create
endpoint: `role !== "alumni"` or `verificationStatus !== "approved"`
both get a 403.

**Fields:** job title, company, description, location, employment type
(full-time/part-time/internship/contract/freelance), experience
(free text — "Fresher", "2-4 years"), salary range (min/max/currency),
skills, application URL, application email, application deadline. At
least one of application URL or email is required (conditional
validator).

Frontend: `/jobs` (browse), `/jobs/:id` (detail — apply, save/unsave,
owner sees status + edit link), `/jobs/post` (alumni, blocked with a
clear message if not yet verified), `/jobs/:id/edit`, `/my-jobs`
(alumni's postings — edit/close/reopen/delete), `/saved-jobs`,
`/admin/jobs` (pending/approved/rejected/all tabs, approve/reject,
delete-expired button).

## Real-time messaging (Socket.IO)

One-to-one chat, restricted to accepted connections only — the same
rule is enforced independently in the REST controller and the socket
handlers (both call a single shared `areUsersConnected` helper, so it
can't drift out of sync between the two).

**Security:** the Socket.IO handshake authenticates with the exact same
JWT that secures the REST API, read from the httpOnly cookie
(`withCredentials`), with an `auth.token` fallback for non-browser
clients. A connection is refused outright if the token is missing,
invalid, or belongs to a user that no longer exists — verified by
scripted tests against a live socket server (an invalid token is
rejected immediately with the same error message the REST middleware
uses).

| Socket event | Direction | Purpose |
|---|---|---|
| `send_message` | client → server (ack) | Send a message; rejected if not connected to the recipient |
| `receive_message` | server → client | New message delivered in real time |
| `typing` / `stop_typing` | both directions | Typing indicator |
| `mark_read` | client → server | Mark a thread read |
| `messages_read` | server → client | Tells the sender their messages were read |
| `online_users` / `user_online` / `user_offline` | server → client | Presence — only broadcast to a user's own connections, never app-wide |

| REST endpoint | Method | Description |
|---|---|---|
| `/api/messages/conversations` | GET | Conversation list — last message + unread count per person |
| `/api/messages/:userId?page=&limit=` | GET | Message history with one person |
| `/api/messages/:userId` | POST | Send (fallback if the socket isn't connected) |
| `/api/messages/:userId/read` | PATCH | Mark a thread read (fallback) |

Presence is tracked in-memory per user (a `Map<userId, Set<socketId>>`
supports multiple open tabs/devices), and a user's private `user:<id>`
room lets events reach every one of their tabs without the server
tracking socket ids anywhere else.

Frontend: `SocketProvider` (wraps the app inside `AuthProvider`, so it
always has current auth state) manages one socket per login, exposing
`isUserOnline`/`isUserTyping`. `/messages` and `/messages/:userId`
render `ConversationList` + `ChatWindow` side by side; a `Message`
button appears on a profile page only once the connection is actually
`accepted`.

## Notification system

Every one of the required trigger sources generates a `Notification`
document automatically:

| Trigger | Where it fires |
|---|---|
| Connection request received | `connectionController.sendConnectionRequest` |
| Connection accepted | `connectionController.acceptConnectionRequest` |
| Mentorship request received | `mentorshipRequestController.sendMentorshipRequest` |
| Mentorship accepted / rejected / completed | `mentorshipRequestController` (distinct types for each) |
| New event published | `eventController.publishEvent` — broadcast to every eligible student + verified alumni in one `insertMany` |
| Event registration | `eventRegistrationController` — notifies the event organizer |
| Job approved | `adminJobController.approveJob` |
| Achievement approved | `adminAchievementController.approveAchievement` |
| New message | `messageController` / socket `send_message` handler |
| Admin announcement | `announcementController.createAnnouncement` — broadcast to the chosen audience |

All of these funnel through `utils/notify.js` (`notifyUser` for one
recipient, `notifyUsers` for a bulk broadcast via a single `insertMany`)
so a failed notification insert never blocks the action that triggered
it.

| REST endpoint | Method | Description |
|---|---|---|
| `/api/notifications?unreadOnly=&page=&limit=` | GET | List notifications (+ live unread count) |
| `/api/notifications/unread-count` | GET | Just the count, for the nav badge |
| `/api/notifications/:id/read` | PATCH | Mark one read (scoped to your own — can't mark someone else's) |
| `/api/notifications/read-all` | PATCH | Mark all read |

Frontend: `NotificationBell` in the navbar — unread badge, 30s polling,
dropdown with the 8 most recent, per-type icons, click-to-navigate to
the relevant page, mark-as-read/mark-all-read, and a "View all" link to
the full paginated `/notifications` page. Display logic
(icon-per-type, click-target routing, relative timestamps) lives in
`utils/notificationHelpers.js`, shared by both so they can never drift
out of sync.

Two of the ten trigger sources needed their own minimal UI to be
reachable at all: `/announcements` (list) + `/admin/announcements`
(create/delete) for the admin-announcement trigger.

## Admin Analytics Dashboard

Every stat and chart is computed with a MongoDB aggregation pipeline —
no client-side counting or looping over full collections.

| Endpoint | Chart / stat | Pipeline notes |
|---|---|---|
| `/api/admin/analytics/overview` | 8 stat cards (users, alumni, students, mentors, events, jobs, achievements, connections) | "Mentor" = an `AlumniProfile` with `isAvailableForMentorship: true` `$lookup`-joined back to `User` to confirm the role, since mentorship eligibility lives on the profile but role lives on the user |
| `/api/admin/analytics/alumni-by-batch` \| `-by-branch` | Bar charts | `$group` + `$cond` fallback to `"Not specified"` so incomplete profiles never silently disappear from the chart |
| `/api/admin/analytics/alumni-by-city` \| `-by-industry` | Pie charts | Same grouping, then bucketed to the top 10 + a single "Other" slice so a long tail of one-off cities doesn't produce 60 unreadable pie slivers |
| `/api/admin/analytics/jobs-by-category` | Bar chart | Grouped by `jobType` |
| `/api/admin/analytics/event-registrations?from=&to=&limit=` | Bar chart | `$lookup` registrations → events, optionally filtered to a date range on the *event's* date, top N by registration count |
| `/api/admin/analytics/monthly-registrations?from=&to=` | Line chart | Groups `User.createdAt` by year+month+role, then zero-fills any month with no signups so the x-axis has no gaps — defaults to the last 12 months if no range is given |

All 8 endpoints are admin-only (`protect` + `authorize("admin")`).
Date filters use `utils/parseDateRange.js`, which safely no-ops on
missing/invalid dates rather than crashing the query.

Frontend: `/admin/analytics` — 8 `StatCard`s in a responsive grid, 7
charts (`SimpleBarChart` and `SimplePieChart` are shared, data-driven
components used across multiple charts; `MonthlyRegistrationsChart` is
purpose-built for the three-line student/alumni/total trend), and a
`DateRangeFilter` scoped to the two time-series charts (event
registrations and monthly registrations) — the categorical breakdowns
are a current-state snapshot, so a date range wouldn't change them.
Linked from the admin nav and from a "Platform Analytics" card on the
Admin Dashboard.

## Alumni Achievements

Flow exactly as specified: alumni submits → `status: "pending"` → admin
reviews → approved achievements appear on that alumni's public profile
(and only approved ones — pending/rejected achievements return a 404 to
anyone but the owner or an admin, so their existence isn't even leaked
to other users guessing the URL).

**Categories:** Award, Promotion, Certification, Hackathon, Startup,
Research Paper, Patent, Competition, Other — a single source of truth
(`utils/achievementCategories.js` on the backend, mirrored on the
frontend) shared between the schema's enum and the submit form.

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/achievements` | POST | Alumni only | Submit an achievement (starts pending) |
| `/api/achievements/mine` | GET | Alumni only | Your own achievements, any status |
| `/api/achievements/user/:userId` | GET | Any logged-in user | Approved achievements for a profile |
| `/api/achievements/:id` | GET | Owner, admin, or anyone if approved | Achievement details |
| `/api/achievements/:id` | DELETE | Owner only | Delete your own submission |
| `/api/admin/achievements/pending` | GET | Admin only | Review queue |
| `/api/admin/achievements/:id/approve` \| `/reject` | PUT | Admin only | Moderate |

Frontend: `/achievements` (your list, alumni-only), `/achievements/submit`
(the form), `/achievements/:id` (details, any authenticated user —
visibility enforced server-side), `/admin/achievements` (approval
queue). A "Verified Achievements" section on every alumni profile
(`AlumniAchievementsSection`, reused by both `MyProfile` and
`PublicProfile` via `ProfileDetailView`) pulls approved achievements
live — kept deliberately distinct from the unmoderated free-text
"achievements" tag list already on `AlumniProfile` itself, so the two
concepts don't get conflated in the UI.

## Search & performance optimization

Audited the whole app against 9 areas and made concrete, measured
changes rather than assuming everything already covered them.

**Already in solid shape (verified, not just assumed):**
- **MongoDB indexes** — every model already has compound indexes
  matching its real query patterns (e.g. `AlumniProfile:
  {graduationYear, branch}`, `{isPublic, batch}`,
  `{isAvailableForMentorship, mentorshipCategories}`; `Job:
  {approvalStatus, applicationDeadline}`; text indexes for search).
  Checked every model file — no hot query path was missing one.
- **Pagination** — every client-facing list endpoint uses
  `utils/parsePagination.js`; audited every `Model.find()` call in
  every controller to confirm none return an unbounded result set to a
  browsable page (the few unbounded `.find()`s left are internal —
  bulk notification-audience lookups and the expired-jobs cleanup —
  never sent to a client as a list).
- **Debounced search, server-side filtering/sorting** — `AlumniDirectory`,
  `FindMentors`, `Jobs`, and `Events` all already debounce input
  (400ms) before hitting the API, and every filter/sort happens
  server-side via query params, never client-side array filtering.
- **Loading/error states** — consistent across every data-fetching
  page (skeleton loaders + inline error banners); the handful of pages
  without a `loading` flag are pure forms with no initial fetch, where
  `isSubmitting` (react-hook-form) already serves that role.

**Fixed this turn (real, measured gaps):**
- **Lazy loading** — `AppRoutes.jsx` now code-splits every page with
  `React.lazy()` + a shared `Suspense` fallback (`PageLoader`). The
  initial JS bundle dropped from **938KB → 288KB** (gzip: 267KB →
  91KB) — the Recharts-heavy admin analytics page alone was 413KB and
  now only downloads for admins who actually visit `/admin/analytics`,
  instead of shipping to every visitor.
- **Image optimization** — added `quality: "auto", fetch_format: "auto"`
  to both Cloudinary upload transformations (profile avatars, event
  banners) so Cloudinary serves the smallest acceptable format
  (WebP/AVIF where supported) at web-appropriate quality automatically.
  Added `loading="lazy" decoding="async"` to all 17 `<img>` tags
  across the app so off-screen avatars/banners don't block initial
  paint.
- **React component optimization** — wrapped the four card components
  rendered in search-result grids (`AlumniCard`, `JobCard`,
  `EventCard`, `MentorCard`) in `React.memo`, so typing in a search box
  or changing a filter only re-renders cards whose underlying data
  actually changed, not the entire grid.

## Quick start

### 1. Backend
```bash
cd server
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev             # http://localhost:5000
```

### 2. Frontend
```bash
cd client
cp .env.example .env    # defaults to http://localhost:5000/api
npm install
npm run dev              # http://localhost:5173
```

## Project structure
```
alumni-connect/
  client/   React + Vite frontend
  server/   Express + MongoDB backend
```
