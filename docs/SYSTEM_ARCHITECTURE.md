# Vaibhav Dhus LMS — Complete System Architecture & Engineering Blueprint

This document specifies the end-to-end technical blueprint for the **Modern, Scalable Online Course / Learning Management System (LMS)** built with **React.js**, **Node.js (Express)**, and **MySQL**.

---

## 1. System Overview & High-Level Architecture

```
                    +------------------------------------------+
                    |             Client Devices               |
                    | (Desktop / Tablet / Mobile Browser)      |
                    +--------------------+---------------------+
                                         |
                                         | HTTPS / WSS
                                         v
                    +--------------------+---------------------+
                    |           React.js Frontend              |
                    |  - Custom Secure HTML5/HLS Player        |
                    |  - Dynamic Canvas Watermark Overlay      |
                    |  - Anti-Download & DevTools Defense      |
                    |  - Theme System (CSS Variables Token Engine)
                    |  - Student & Admin Responsive Portals    |
                    +--------------------+---------------------+
                                         |
                                         | REST API (JSON + Bearer JWT + Device UUID)
                                         v
                    +--------------------+---------------------+
                    |       Node.js / Express Backend          |
                    |  - Helmet, Rate Limiting, CORS, HPP      |
                    |  - RBAC (Admin, Instructor, Student)     |
                    |  - Device & Concurrent Session Manager   |
                    |  - Signed Playback Token Signer & Verifier|
                    |  - Range-based Chunked Protected Stream  |
                    |  - Download Access Verification Engine   |
                    +---------+--------------------+-----------+
                              |                    |
             SQL Queries / Pool                    | Secure File I/O / Signed URLs
                              v                    v
                 +------------+---+     +----------+---------------+
                 |  MySQL Engine  |     |   Protected Storage /    |
                 |  (InnoDB ACID) |     |   Local / S3 / CDN       |
                 +----------------+     |  - Protected Videos      |
                                        |  - Downloadable PDFs     |
                                        |  - Public Thumbnails     |
                                        +--------------------------+
```

---

## 2. Database ER Structure (MySQL InnoDB)

The schema is normalized, indexed for high-concurrency read operations, and supports scaling from 12 lessons to 100,000+ lessons without structural modifications.

### Core Tables & Relationships

1. **`roles`**: System roles (`admin`, `instructor`, `student`).
2. **`users`**: User identities, hashed credentials (bcrypt), status (`active`, `suspended`, `pending`), email verification.
3. **`user_sessions`**: Active sessions tracking device name, client IP, user agent, device fingerprint hash, refresh tokens, active status, and heartbeat timestamps.
4. **`course_categories`**: Category taxonomy for catalog organization.
5. **`courses`**: Course metadata, slug, thumbnail, price, discount price, publish status, difficulty level, prerequisites, instructor ID.
6. **`course_sections`**: Modules/Sections inside courses, order sequence, title, description.
7. **`lessons`**: Individual video/content units, section ID, title, description, duration in seconds, order sequence, preview flag (`is_preview`), free flag (`is_free`).
8. **`video_assets`**: Video file metadata, raw duration, resolution, storage path, HLS manifest path, DRM encryption key ID, storage driver.
9. **`video_progress`**: Per-user playback state: `last_watched_second`, `highest_watched_second`, `watch_percentage`, `is_completed`, `completed_at`.
10. **`course_resources`**: Downloadable files (PDF notes, cheat sheets), course ID, optional lesson ID, title, file size, access type (`free`, `enrolled_only`).
11. **`user_downloads`**: Audit log of every PDF download with user ID, IP address, timestamp.
12. **`enrollments`**: Course enrollment records, status (`active`, `expired`, `revoked`), enrollment date, expiry date.
13. **`orders` & `payments`**: Financial transaction ledgers, payment gateway reference, amount, currency, order status.
14. **`coupons`**: Discount coupons, percentage/flat amount, valid date ranges, usage limits.
15. **`reviews`**: Course reviews, rating (1-5), comment, approval status.
16. **`certificates`**: Issued certificates with cryptographic verification code, issue date, template reference.
17. **`platform_settings`**: Key-value platform configurations (theme colors, platform branding, max concurrent sessions, video watermark frequency, DRM settings).
18. **`audit_logs`**: Security & administrative audit logs (session revocation, permission changes, login alerts).

---

## 3. Video Security & Anti-Download Architecture

Direct public access to MP4 file paths is strictly prohibited. The system enforces multi-layered defense:

### Layer 1: Ephemeral Signed Playback Tokens
1. Client requests playback for `lessonId`.
2. Backend validates:
   - User authentication (valid JWT).
   - Valid active session (not revoked, within concurrent device quota).
   - Course enrollment OR preview/free status for the lesson.
3. Backend generates an **HMAC-SHA256 signed playback token**:
   ```
   Payload: { userId, lessonId, sessionId, clientIpHash, exp: now + 120s }
   Signature: HMAC_SHA256(payload, VIDEO_SIGNING_KEY)
   ```
4. Client requests video stream via `/api/videos/stream/:lessonId?token=...` or via chunked range headers.
5. Stream handler validates signature, expiration, and session status before serving media bytes with `Accept-Ranges: bytes`.

### Layer 2: Player-Level Anti-Download Protections
- Custom UI overlay completely disabling native browser context menu (`onContextMenu="return false"`).
- Video tags configured with `controlsList="nodownload nofullscreen nopictureinpicture"`.
- `disablePictureInPicture` enabled.
- Blob/Stream abstraction: chunks are buffered into video memory rather than rendering a clickable direct download anchor.

### Layer 3: Dynamic Forensics Watermark
- The player features a dynamic, randomized Canvas watermark layer moving across the screen at configurable intervals (every 10-20 seconds).
- Displays: `User Email` + `User ID` + `Session ID / Timestamp`.
- Opacity is subtly configured (0.15 - 0.25) so it is non-intrusive to legitimate learners, but permanently brands screen-recordings and phone camera captures with forensic evidence identifying the leaker.

### Layer 4: DRM Readiness (Modular ClearKey & FairPlay/Widevine Pipeline)
- Architecture defines a standard `DrmService` adapter interface:
  - `generateDrmLicense(contentId, userId)`
  - `getManifestUrl(contentId)`
- For commercial DRM upgrades (e.g. EZDRM, Axinom), the video streamer easily switches from signed range streaming to DASH/HLS encrypted with CENC (Common Encryption).

---

## 4. Anti-Account Sharing & Concurrent Session Architecture

To prevent password sharing across multiple people:
1. Every login registers a unique session entry in `user_sessions` containing:
   - Device Name / Browser / OS parsed from User-Agent.
   - Client IP.
   - Device Fingerprint Hash.
   - Session Token (UUID v4) + Heartbeat timestamp.
2. System checks `MAX_CONCURRENT_SESSIONS` setting (default: 1 device at a time, or configurable up to N).
3. If user logs in from a second device when limit is reached:
   - System flags concurrent conflict.
   - User is presented with a choice: "Log out other active device" or "Cancel".
   - If user confirms, existing active sessions are marked as `revoked`.
4. Subsequent API and video requests from the old device receive `401 Session Revoked` and are redirected to login.
5. Admin dashboard provides real-time view of all active sessions per student, with one-click revocation capability.

---

## 5. Free PDF Resources Architecture

1. Course resources can be marked as `is_free: 1` or `0` (enrolled only).
2. Free resources are downloadable by all registered users without purchasing the course.
3. Protected resources verify active enrollment.
4. Download requests pass through `/api/resources/:resourceId/download`.
5. Backend verifies access permissions, increments download counter, records audit log entry in `user_downloads`, and streams the PDF securely with `Content-Disposition: attachment; filename="..."`.

---

## 6. Dynamic Theme System Architecture

The UI adheres to a flexible token-driven design system:
1. **Design Tokens**:
   - `--color-primary`, `--color-primary-hover`
   - `--color-bg-base`, `--color-bg-surface`, `--color-bg-elevated`
   - `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
   - `--color-border-subtle`, `--color-border-strong`
   - `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`
2. **Persistence**:
   - System supports user-toggleable Light/Dark modes stored in `localStorage`.
   - Admin settings allow global platform branding (default theme, brand primary hue, company name, logo).
   - Global tokens inject into `:root` on startup via a lightweight theme provider.

---

## 7. REST API Specifications

| Domain | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Auth** | POST | `/api/auth/register` | Register new student | No |
| **Auth** | POST | `/api/auth/login` | Authenticate user & start session | No |
| **Auth** | POST | `/api/auth/logout` | Terminate current session | Yes |
| **Auth** | GET | `/api/auth/me` | Fetch active profile & session info | Yes |
| **Auth** | POST | `/api/auth/sessions/revoke-others` | Terminate all other sessions | Yes |
| **Courses**| GET | `/api/courses` | List public courses with filter | No |
| **Courses**| GET | `/api/courses/:slug` | Course details with curriculum overview | Optional |
| **Enroll** | POST | `/api/enrollments/enroll/:courseId` | Enroll into course | Yes |
| **Progress**| GET | `/api/progress/:courseId` | Get user progress across lessons | Yes |
| **Progress**| POST | `/api/progress/:lessonId` | Update video watch progress | Yes |
| **Videos** | GET | `/api/videos/token/:lessonId` | Generate signed playback token | Yes |
| **Videos** | GET | `/api/videos/stream/:lessonId` | Secure stream with token verification | Valid Token |
| **Resources**| GET | `/api/resources/:resourceId/download` | Download PDF resource | Yes |
| **Admin** | GET | `/api/admin/courses` | List and manage all courses | Admin |
| **Admin** | POST | `/api/admin/courses` | Create new course | Admin |
| **Admin** | POST | `/api/admin/sections` | Create module section | Admin |
| **Admin** | POST | `/api/admin/lessons` | Create lesson with video & PDF | Admin |
| **Admin** | GET | `/api/admin/students` | Manage users and enrollments | Admin |
| **Admin** | GET | `/api/admin/sessions` | View active sessions across platform | Admin |
| **Admin** | POST | `/api/admin/sessions/:sessionId/revoke` | Force-logout user session | Admin |
| **Admin** | GET | `/api/admin/analytics` | Completion rates, watch stats | Admin |
| **Settings**| GET | `/api/settings` | Public platform branding & theme | No |
| **Settings**| PUT | `/api/settings` | Update platform settings & colors | Admin |

---

## 8. Implementation Phases

1. **Database Schema & Migrations**: Create MySQL tables, foreign keys, indexes, and full seeders (Admin, Student, 12-lesson course, sections, resources, settings).
2. **Backend Engine**: Express REST API, security middleware, authentication, session tracker, video streamer with HMAC token validation, resource downloader, admin controllers.
3. **Frontend Core**: React + Vite, dynamic token theme system, routing, API client, AuthContext.
4. **Student Experience**: Course catalog, course landing page, student dashboard with "Continue Learning", responsive course player with watermark overlay & anti-download protection.
5. **Admin Suite**: Dashboard, course management, student & session inspector, settings & theme customizer.
6. **Testing & Verification**: Verify streaming, range requests, watermark, concurrent session logout, and mobile responsiveness.
