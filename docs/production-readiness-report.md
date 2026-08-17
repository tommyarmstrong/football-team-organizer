# Production Readiness Report

**Date:** 2026-08-15  
**Target Scale:** 5 teams, 60 players (club size)  
**Status:** Review of security, scalability, and operational readiness

---

## Executive Summary

The Football Team Organizer is functionally complete for MVP but requires **critical** production hardening before accepting real users. The invite-only authentication system will scale adequately for the target size (5 teams, 60 players), but production deployment requires immediate attention to secrets management, email delivery, monitoring, and data protection.

**Production Blocker:** Service role key is currently required for invite operations but has no deployment-ready secret management strategy documented.

---

## 1. Security Assessment

### 1.1 Authentication & Authorization

**Current State:**

- Invite-only onboarding via Supabase Auth (`inviteUserByEmail`)
- Email/password authentication (OAuth not yet implemented per docs)
- Row Level Security (RLS) enabled on all tables with SECURITY DEFINER helpers
- Middleware enforces session + team membership on protected routes
- Service role key required for invite/onboarding operations

**✅ Strengths:**

- **P0 PRIORITY:** RLS policies prevent unauthorized data access at the database level
- **P0 PRIORITY:** SECURITY DEFINER functions avoid RLS recursion while maintaining security
- Invite tokens use SHA-256 hashing; raw tokens never stored in database
- Single-use invitations with 7-day expiry enforced at DB level
- Auth middleware properly gates routes based on session and membership

**🔴 Critical Issues:**

1. **P0 PRIORITY — Service Role Key Exposure Risk**
   - **Issue:** `SUPABASE_SERVICE_ROLE_KEY` is required for invite operations (`src/lib/supabase/admin.ts`) but `.env.example` documents it without deployment guidance
   - **Risk:** If exposed to browser or committed to version control, this key grants full database access bypassing all RLS
   - **Required Action:**
     - Add explicit warning comments in `admin.ts` that this file must NEVER be imported from client components
     - Document service role key rotation procedure in this report (see Required Production Steps)
     - Configure Vercel environment variables for Production/Preview with access restrictions
     - Add pre-commit hook or linter rule to prevent client-side imports of `admin.ts`
   - **Testing:** Search codebase for any client component imports of admin client (currently clean)

2. **P1 PRIORITY — Password Policy Not Enforced**
   - **Issue:** Supabase Auth allows weak passwords by default; no minimum requirements enforced
   - **Risk:** User accounts vulnerable to brute force attacks
   - **Required Action:**
     - Configure Supabase Auth password policy in dashboard: minimum 12 characters, require uppercase/lowercase/digit/special
     - Document password requirements in onboarding UI and help text

3. **P1 PRIORITY — No Rate Limiting on Invite Operations**
   - **Issue:** `sendPersonInvitation()` has no rate limiting; club management can trigger unlimited emails
   - **Risk:** Abuse potential for spam, Supabase email quota exhaustion
   - **Required Action:**
     - Implement rate limiting on invite send (e.g., 10 invites per user per hour)
     - Add confirmation step for bulk invites if sending to multiple people
     - Monitor Supabase email quota usage

4. **P2 PRIORITY — Session Management**
   - **Issue:** No documented session timeout or refresh token rotation policy
   - **Risk:** Stale sessions remain valid indefinitely
   - **Required Action:**
     - Configure Supabase Auth session timeout (recommend 7 days with refresh, 24 hours without)
     - Enable refresh token rotation in Supabase dashboard
     - Document session behavior in user-facing documentation

**✅ No Critical Flaws Found:**

- RLS policies correctly implement role-based access (management → coach → guardian → player)
- Sensitive player contact details properly restricted via stricter RLS on `player_contacts`
- Middleware correctly exempts onboarding/auth routes from membership checks
- Invite token collision risk negligible (UUID + SHA-256)

### 1.2 Data Protection

**Current State:**

- All PII stored in Supabase PostgreSQL
- Sensitive contact details segregated in `player_contacts` table
- Email addresses normalized and uniquely indexed on `people` table
- Phone numbers stored as plain text

**✅ Strengths:**

- **P0 PRIORITY:** RLS prevents cross-club data leakage
- Field-level access control for sensitive player contacts (emergency contact, medical notes, address)
- Migration conflict tracking preserves data integrity during schema changes

**🟡 Moderate Concerns:**

1. **P1 PRIORITY — No Encryption at Rest for Sensitive Fields**
   - **Issue:** Medical notes, emergency contacts, addresses stored as plain text in PostgreSQL
   - **Risk:** Database dump or backup exposure leaks sensitive health information
   - **Mitigation Options:**
     - **Recommended for target scale:** Rely on Supabase platform encryption (AWS RDS encryption at rest is enabled by default for paid plans)
     - **If handling more sensitive data:** Implement application-level encryption for `player_contacts.medical_notes` using KMS
   - **Required Action (P1):** Verify Supabase project has platform encryption enabled; document in README

2. **P2 PRIORITY — No PII Anonymization on Player Deletion**
   - **Issue:** Player records are hard-deleted or retained with full PII; no anonymization strategy
   - **Risk:** GDPR right-to-erasure compliance gap
   - **Required Action:**
     - Implement soft-delete with PII anonymization for players who leave the club
     - Retain goal/match history with anonymized "Former Player #123" display name
     - Add "Delete Personal Data" action for club management

3. **P2 PRIORITY — No Audit Logging**
   - **Issue:** No record of who viewed or edited sensitive player data
   - **Risk:** No compliance trail for data access investigations
   - **Required Action:**
     - Enable Supabase audit logging (available on Pro plan)
     - Log sensitive actions (invite sends, player contact edits, bulk exports)
     - Document data access procedures for guardians inquiring about their data

### 1.3 Dependency Security

**Current State:**

- Next.js 16.2.11, React 19.2.4, Supabase JS client 2.110.8
- No automated dependency scanning in CI
- Husky pre-commit hooks for linting only

**🟡 Moderate Concerns:**

1. **P1 PRIORITY — No Automated Vulnerability Scanning**
   - **Issue:** `npm audit` not run in CI; no Dependabot or Snyk integration
   - **Required Action:**
     - Add `npm audit --production --audit-level=moderate` to CI workflow
     - Enable Dependabot alerts in GitHub repository settings
     - Schedule monthly dependency update reviews

2. **P2 PRIORITY — Supabase Client Pinned to Specific Version**
   - **Issue:** `@supabase/supabase-js` pinned to `^2.110.8`; no plan for updates
   - **Required Action:**
     - Monitor Supabase changelog for security releases
     - Test minor version upgrades in preview environments before production

### 1.4 Infrastructure Security

**Current State:**

- Hosted on Vercel (Next.js optimized)
- Database on Supabase managed PostgreSQL
- No custom backend services
- Environment variables configured per-environment in Vercel

**✅ Strengths:**

- **P0 PRIORITY:** Vercel enforces HTTPS; no HTTP access possible
- Platform-level DDoS protection via Vercel Edge Network
- Supabase RLS enforced at database query level (not application layer)

**🟡 Moderate Concerns:**

1. **P1 PRIORITY — CORS Configuration Not Documented**
   - **Issue:** No documented Supabase CORS policy; defaults may be permissive
   - **Required Action:**
     - Review Supabase project CORS settings (API Settings → CORS)
     - Restrict to production domains only: `https://your-domain.com`, `https://*.vercel.app` (for previews)
     - Document CORS policy in this report

2. **P2 PRIORITY — No WAF or Bot Protection**
   - **Issue:** Vercel free tier has basic DDoS protection but no WAF rules
   - **Risk:** Automated scraping, credential stuffing attacks
   - **Mitigation:** Vercel Pro includes WAF; evaluate if needed based on usage patterns post-launch
   - **Required Action (P2):** Monitor failed login attempts via Supabase Auth logs; add WAF if abuse detected

---

## 2. Scalability Assessment

### 2.1 Target Scale: 5 Teams, 60 Players

**Analysis:**

- **Users:** ~70-80 total users (60 players + 10-15 coaches/managers + guardians)
- **Data Volume:**
  - 5 teams × 12 players avg = 60 players
  - ~30 matches per team per season = 150 matches/year
  - ~3 goals per match = 450 goals/year
  - ~200 total people records (players + coaches + guardians + family)
- **Write Operations:** Low (fixture creation, match results 2-3x per week per team)
- **Read Operations:** Moderate (dashboard views, stats pages ~100-500 req/day estimated)

**✅ Assessment: Scale is WELL within limits**

### 2.2 Database Performance

**Current State:**

- PostgreSQL indexes on all foreign keys and date fields
- RLS SECURITY DEFINER helpers prevent N+1 query problems
- No reported performance issues in development

**✅ Strengths:**

- **P0 PRIORITY:** Proper indexing on `team_id`, `club_id`, `player_id`, `match_id`, `date`
- Unique indexes prevent duplicate shirt numbers, email addresses
- `people` table merge logic during migration handles deduplication correctly

**🟢 Low-Priority Optimizations:**

1. **P3 — No Query Performance Monitoring**
   - **Issue:** No slow query tracking or explain analysis
   - **Action:** Enable Supabase query insights (Pro plan feature); review after 1 month of production traffic
   - **Non-blocking:** Current query patterns are simple CRUD; no joins exceed 3 tables

2. **P3 — Dashboard Aggregations Not Cached**
   - **Issue:** Top scorers, recent results computed on every dashboard load
   - **Impact:** Negligible at target scale (60 players = trivial aggregation)
   - **Action:** Monitor dashboard response times; add caching only if >500ms p95 latency observed
   - **Note:** Next.js React cache already memoizes team lookups per request

### 2.3 Email Scalability

**Current State:**

- Supabase Auth `inviteUserByEmail()` for initial invites
- No custom email service; relies on Supabase default transactional email
- Fallback manual invite URL provided when Supabase email fails

**✅ Assessment: Adequate for Target Scale**

**Current Limits:**

- Supabase free tier: 2 emails/hour, 30/day (insufficient)
- Supabase Pro tier: 1,000 emails/hour, 10,000/month (sufficient for 60-80 users)

**🟡 Moderate Concerns:**

1. **P1 PRIORITY — Email Deliverability Not Tested**
   - **Issue:** Default Supabase email uses shared sending domain; may land in spam
   - **Required Action:**
     - Send test invites to Gmail, Outlook, Yahoo to verify inbox delivery
     - Configure custom SMTP (e.g., SendGrid, Postmark) if spam rate >10%
     - Add SPF/DKIM records for custom domain email
   - **Fallback:** Manual invite URL (`acceptUrl`) already implemented for email failures

2. **P1 PRIORITY — No Email Content Customization**
   - **Issue:** Supabase default email template uses generic branding
   - **Required Action:**
     - Customize Supabase Auth email templates (Settings → Email Templates)
     - Include club name, app branding, support contact
     - Test email rendering on mobile clients

3. **P2 PRIORITY — No Automated Reminder System**
   - **Issue:** Users who don't accept invites within 7 days receive no reminder
   - **Risk:** Low adoption rate; admins must manually track pending invites
   - **Required Action (P2):**
     - Add UI for club management to view pending invites and resend
     - Optional: Implement reminder email at day 5 (requires cron job or Edge Function)

**✅ Invite Scheme Scales for 5 Teams / 60 Players:**

- Initial onboarding: 60 player invites + 15 staff/guardian invites = 75 emails
- If sent over 3 days: 25 emails/day (well within Pro tier limit)
- Ongoing invites: ~5-10 per month as players join/leave (trivial load)
- **Verdict:** Supabase Pro tier email quota is sufficient; no custom email service required

### 2.4 Frontend Performance

**Current State:**

- Next.js App Router with React Server Components
- Recharts for data visualization (lazy-loaded on `/stats`)
- No image optimization (no user-uploaded images yet)
- Tailwind CSS for styling

**✅ Strengths:**

- Server components reduce client-side JS bundle
- Recharts lazy-loaded to avoid impacting initial page load
- Static pages cached at edge via Vercel

**🟢 Low-Priority Optimizations:**

1. **P3 — No Lighthouse Audit in CI**
   - **Action:** Add Lighthouse CI checks for accessibility and performance scores
   - **Non-blocking:** App is functional; performance acceptable on 3G

2. **P3 — Match List Not Paginated**
   - **Issue:** `/matches` page loads all matches for a team (unbounded query)
   - **Impact:** At 30 matches/season, no performance issue for 3-5 seasons
   - **Action:** Add pagination when match count exceeds 100 per team

---

## 3. Operational Readiness

### 3.1 Monitoring & Observability

**Current State:**

- No application performance monitoring (APM)
- No error tracking service (e.g., Sentry)
- Vercel dashboard shows deployment status and function logs
- Supabase dashboard shows database metrics

**🔴 Critical Gaps:**

1. **P0 PRIORITY — No Error Tracking**
   - **Issue:** Client-side errors invisible; user-reported bugs have no stack traces
   - **Required Action:**
     - Integrate Sentry (or Vercel Error Tracking) before launch
     - Configure source maps upload for production builds
     - Set up alerting for error rate spikes (>10 errors/hour)
   - **Blocking:** Cannot diagnose production issues without error tracking

2. **P1 PRIORITY — No Uptime Monitoring**
   - **Issue:** No external health checks; team unaware of outages until users report
   - **Required Action:**
     - Configure uptime monitor (e.g., Vercel Monitoring, UptimeRobot, Pingdom)
     - Monitor `/api/health` endpoint (needs to be created) with 5-minute checks
     - Alert on-call admin via email/SMS on downtime

3. **P1 PRIORITY — No Audit Trail for Admin Actions**
   - **Issue:** No record of who sent invites, edited team rosters, or modified match results
   - **Required Action:**
     - Log admin actions to separate audit table with user ID, timestamp, action type
     - Make audit log read-only and visible only to club management
     - Retain audit logs for 2 years minimum

### 3.2 Backup & Disaster Recovery

**Current State:**

- Supabase manages automatic daily database backups (Pro plan: 7-day retention)
- No documented restore procedure
- No application-level backup strategy

**🟡 Moderate Concerns:**

1. **P1 PRIORITY — No Documented Restore Procedure**
   - **Issue:** If database corruption or accidental deletion occurs, team cannot recover
   - **Required Action:**
     - Document Supabase backup restore steps in operations runbook
     - Test restore process in staging environment before launch
     - Verify 7-day backup retention is enabled in Supabase Pro plan

2. **P1 PRIORITY — No Point-in-Time Recovery**
   - **Issue:** Supabase free tier has no PITR; Pro tier has PITR but requires manual request
   - **Required Action:**
     - Upgrade to Supabase Pro before production launch (required for PITR)
     - Document PITR request procedure for emergency scenarios
     - Communicate backup policy to club management (daily backups, 7-day retention)

3. **P2 PRIORITY — No Export Functionality**
   - **Issue:** Club cannot export their data in portable format (CSV, JSON)
   - **Risk:** Vendor lock-in; difficulty migrating to alternative platform
   - **Required Action (P2):**
     - Add "Export Club Data" feature for management (all tables as CSV/JSON)
     - Include export timestamp and version in export metadata
     - Test export/re-import round-trip

### 3.3 Deployment Process

**Current State:**

- GitHub → Vercel automatic deployments
- `main` branch deploys to production
- PR branches deploy to preview URLs
- CI runs lint, format, test, build on every PR
- Branch protection requires passing CI before merge

**✅ Strengths:**

- **P0 PRIORITY:** Production deploys blocked by failing CI
- Preview deployments enable testing before production merge
- Immutable deployments via Vercel (instant rollback)

**🟢 Low-Priority Improvements:**

1. **P2 — No Deployment Smoke Tests**
   - **Issue:** Production deployment doesn't verify app is functional
   - **Action:** Add post-deploy smoke test (Playwright or Cypress) to verify login flow
   - **Non-blocking:** CI build includes test suite; low risk of broken deployment

2. **P3 — No Deployment Notifications**
   - **Action:** Enable Vercel deployment notifications to team Slack/email
   - **Non-blocking:** Team can monitor deployments via Vercel dashboard

### 3.4 User Support & Documentation

**Current State:**

- README covers local development setup
- `docs/` folder has requirements, data model, onboarding design
- No user-facing documentation or help system
- No support contact documented in app

**🔴 Critical Gaps:**

1. **P0 PRIORITY — No User Documentation**
   - **Issue:** New users don't know how to use the app (e.g., create team, add fixtures)
   - **Required Action:**
     - Create user guide (markdown or in-app help) covering:
       - How to accept invitation and create password
       - How to add players to a team
       - How to create and enter match results
       - How to view stats and reports
     - Add link to documentation in app header or footer

2. **P0 PRIORITY — No Support Contact**
   - **Issue:** Users experiencing issues have no way to get help
   - **Required Action:**
     - Add support email address to app footer (e.g., support@yourclub.com)
     - Document expected response time (e.g., 48 hours)
     - Add "Report a Problem" link in app that opens pre-filled email

3. **P1 PRIORITY — No Onboarding Guidance**
   - **Issue:** First-time club setup has no wizard or guidance
   - **Risk:** Clubs abandon setup due to confusion
   - **Required Action:**
     - Add welcome modal on first login with setup checklist:
       - ✓ Create your first team
       - ✓ Add players
       - ✓ Invite coaches
       - ✓ Schedule your first match
     - Mark tasks complete as user progresses

---

## 4. Required Production Steps (Prioritized)

### Priority 0 (Blocking) — Cannot Launch Without These

1. **Service Role Key Security**
   - Add explicit "SERVER-ONLY" warnings to `src/lib/supabase/admin.ts`
   - Configure `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables with access restrictions
   - Verify no client component imports of admin client
   - Add linter rule to block client-side imports of admin module
   - **Verification:** Audit import paths; test that service role key never reaches browser

2. **Error Tracking Integration**
   - Sign up for Sentry (or enable Vercel Error Tracking)
   - Install `@sentry/nextjs` package
   - Configure error reporting in `next.config.ts`
   - Set up alerting rules (>10 errors/hour = page admin)
   - **Verification:** Trigger test error; confirm appears in Sentry dashboard

3. **User Documentation**
   - Write user guide covering: invitation acceptance, team setup, player management, match entry
   - Add documentation link to app footer
   - Add support email to app footer
   - Test documentation with non-technical user
   - **Verification:** Can a new user complete setup without assistance?

4. **Supabase Pro Upgrade**
   - Upgrade Supabase project to Pro plan (required for email quota, backups, PITR)
   - Verify daily automatic backups enabled
   - Verify platform encryption at rest enabled
   - Document PITR restore procedure
   - **Verification:** Confirm backup retention in Supabase dashboard

5. **Backup Restore Test**
   - Create staging Supabase project
   - Perform backup restore in staging
   - Verify all data restored correctly
   - Document restore procedure in operations runbook
   - **Verification:** Can restore from backup without data loss?

### Priority 1 (Pre-Launch) — Launch Risky Without These

1. **Password Policy Configuration**
   - Set Supabase Auth minimum password length: 12 characters
   - Require uppercase, lowercase, digit, special character
   - Update onboarding UI with password requirements
   - **Verification:** Attempt to create account with weak password; should be rejected

2. **Email Deliverability Testing**
   - Send test invites to Gmail, Outlook, Yahoo, iCloud
   - Verify >90% inbox delivery rate (not spam folder)
   - If spam rate >10%, configure custom SMTP provider (SendGrid/Postmark)
   - Customize Supabase email templates with club branding
   - **Verification:** 9/10 test emails land in inbox, not spam

3. **CORS Configuration**
   - Review Supabase CORS settings (API → CORS)
   - Restrict to production domains only (no wildcard `*`)
   - Document allowed origins in this report
   - **Verification:** API call from unauthorized domain returns CORS error

4. **Uptime Monitoring**
   - Create `/api/health` endpoint (returns 200 OK)
   - Configure uptime monitor (5-minute checks)
   - Set up alerting to admin email/SMS on downtime
   - **Verification:** Disable Vercel app; confirm alert sent within 10 minutes

5. **Invite Rate Limiting**
   - Add rate limit: 10 invites per user per hour
   - Display remaining quota in invite UI
   - Log rate limit violations for abuse monitoring
   - **Verification:** Send 11 invites in 1 hour; 11th should be blocked

6. **Audit Logging for Admin Actions**
   - Create `admin_audit_log` table (user_id, action, timestamp, details)
   - Log invite sends, roster changes, match result edits
   - Make audit log visible to club management only
   - **Verification:** Send invite; verify audit log entry created

7. **Onboarding Wizard**
   - Create welcome modal with setup checklist
   - Show on first login or when club has no teams
   - Track completion state in user preferences
   - **Verification:** New user sees welcome modal; steps mark complete

### Priority 2 (Post-Launch) — Improve Before Scaling

1. **PII Anonymization on Player Deletion**
   - Implement soft-delete for players
   - Replace name with "Former Player #123"
   - Clear medical notes, contact details
   - Retain goal history with anonymized name
   - **Timeline:** Within 3 months post-launch

2. **Invite Reminder Emails**
   - Add UI to view pending invites
   - Implement "Resend Invite" button
   - Optional: Day-5 reminder email via Edge Function
   - **Timeline:** Within 2 months post-launch

3. **Data Export Feature**
   - Add "Export Club Data" to management settings
   - Generate CSV/JSON for all tables
   - Include export timestamp and version
   - Test import to verify data portability
   - **Timeline:** Within 3 months post-launch

4. **Automated Dependency Scanning**
   - Add `npm audit` to CI workflow (fail on high/critical)
   - Enable GitHub Dependabot alerts
   - Schedule monthly dependency review
   - **Timeline:** Within 1 month post-launch

### Priority 3 (Optimization) — Nice to Have

1. **Performance Monitoring**
   - Enable Vercel Analytics or Supabase Query Insights
   - Set up dashboard for response times, error rates
   - Review monthly; optimize slow queries
   - **Timeline:** Within 6 months post-launch

2. **Deployment Smoke Tests**
   - Add Playwright smoke test (login, view dashboard)
   - Run post-deploy on production
   - Alert on failure
   - **Timeline:** When team has time for test infrastructure

3. **Match List Pagination**
   - Add pagination to `/matches` page
   - Implement when match count >100 per team
   - **Timeline:** When database contains 3+ seasons of data

---

## 5. Production Environment Checklist

### Vercel Configuration

- [ ] Production environment variables set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production Supabase project)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production publishable key)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (restricted access, encrypted, SERVER-ONLY)
  - [ ] `NEXT_PUBLIC_APP_URL` (production domain, for invite emails)
- [ ] Preview environment variables set (separate for preview branches)
- [ ] Custom domain configured and SSL active
- [ ] Branch protection enabled on `main`
- [ ] CI check required before merge
- [ ] Deployment notifications enabled

### Supabase Configuration

- [ ] Pro plan active (email quota, backups, PITR)
- [ ] Database platform encryption verified enabled
- [ ] Daily automatic backups enabled (7-day retention minimum)
- [ ] CORS restricted to production domains only
- [ ] Auth password policy configured (12 chars, complexity)
- [ ] Email templates customized with club branding
- [ ] Custom SMTP configured (if default email spam rate >10%)
- [ ] RLS policies reviewed and tested on all tables
- [ ] Migration history applied (`supabase/migrations/`)

### Monitoring & Alerting

- [ ] Error tracking active (Sentry or Vercel)
- [ ] Uptime monitor configured (5-minute checks)
- [ ] Admin email/SMS alerting on downtime
- [ ] Supabase email quota monitoring
- [ ] Failed login attempt monitoring

### Security

- [ ] Service role key restricted to server-only (never in browser)
- [ ] Linter rule blocks client imports of `admin.ts`
- [ ] Dependency vulnerability scanning in CI
- [ ] Password policy enforced (12 chars, complexity)
- [ ] Session timeout configured (7 days with refresh)
- [ ] Invite rate limiting active (10/hour per user)

### Documentation & Support

- [ ] User guide published (invitation, setup, match entry)
- [ ] Documentation link in app footer
- [ ] Support email in app footer
- [ ] Operations runbook created (backup restore, PITR, incident response)
- [ ] Onboarding wizard active for new users

### Testing

- [ ] Backup restore tested in staging
- [ ] Email deliverability tested (Gmail, Outlook, Yahoo)
- [ ] Invite flow tested end-to-end
- [ ] CORS policy tested (unauthorized domain blocked)
- [ ] Rate limiting tested (11th invite blocked)
- [ ] Error tracking tested (test error appears in dashboard)

---

## 6. Scalability Forecast

### Current Target: 5 Teams, 60 Players

**Infrastructure Costs (Estimated Monthly):**

- Vercel Pro: $20/seat (1-2 seats) = $20-40
- Supabase Pro: $25/month (includes 8GB database, 100GB bandwidth, 1M read/write ops)
- Domain: $10-15/year (~$1/month)
- **Total: $46-66/month** (can start with free tiers for MVP, upgrade at launch)

**Estimated Load:**

- Concurrent users: 5-10 during peak (match day evenings)
- Requests per day: 500-1,000 (dashboard views, stats, match entry)
- Database size: <1GB (60 players × 5 seasons = ~10,000 rows total)
- Email volume: ~10/month (new player invites, roster changes)

**Verdict: Current architecture easily supports target scale.**

### Scale Ceiling Before Re-Architecture

**10× Scale (50 Teams, 600 Players):**

- Database: 10GB data, 100K rows (still within Supabase Pro limits)
- Concurrent users: 50-100 (no application changes required)
- Requests per day: 10,000 (Next.js + Vercel Edge scales horizontally)
- **No code changes required; Supabase Pro + Vercel Pro sufficient**

**100× Scale (500 Teams, 6,000 Players):**

- Database: 100GB data, 1M rows (requires Supabase Team plan)
- Concurrent users: 500-1,000 (consider CDN caching, read replicas)
- Requests per day: 100,000+ (requires database query optimization)
- **May need:**
  - Read replicas for dashboard queries
  - Redis caching layer for aggregations
  - Supabase Team plan or migrate to self-hosted Postgres
  - Edge Functions for heavy compute (stats calculations)

**Current architecture scales to 10× target without re-architecture.**

---

## 7. Production Launch Recommendation

**Go/No-Go Assessment:**

| Criteria             | Status       | Blocking?         |
| -------------------- | ------------ | ----------------- |
| **P0 Security**      | 🔴 Not Ready | **YES**           |
| **P0 Monitoring**    | 🔴 Not Ready | **YES**           |
| **P0 Documentation** | 🔴 Not Ready | **YES**           |
| **P0 Backups**       | 🔴 Not Ready | **YES**           |
| **P1 Email**         | 🟡 Risky     | No (fallback URL) |
| **P1 Auth**          | 🟡 Risky     | No (functional)   |
| **Scalability**      | ✅ Ready     | No                |
| **Functionality**    | ✅ Ready     | No                |

**Recommendation: DO NOT LAUNCH until P0 items completed.**

**Estimated Effort to Production-Ready:**

- P0 items: 2-3 days (service role security, error tracking, docs, backups)
- P1 items: 3-4 days (password policy, email testing, monitoring, rate limiting)
- **Total: 5-7 days to safe production launch**

**Launch Sequence:**

1. Week 1: Complete P0 items + backup restore test
2. Week 2: Complete P1 items + email deliverability testing
3. Week 3: Soft launch with 1 pilot club (5-10 users)
4. Week 4: Monitor errors, uptime, email delivery; fix issues
5. Week 5: Full launch to target clubs

**Post-Launch 90-Day Priorities:**

1. Month 1: P2 audit logging, PII anonymization planning
2. Month 2: Automated dependency scanning, invite reminders
3. Month 3: Data export feature, performance monitoring

---

## 8. Invite Scheme Scalability Analysis

### Current Implementation

**Mechanism:**

1. Club management creates `people` record with email
2. Server action `sendPersonInvitation()` calls Supabase `inviteUserByEmail()`
3. Supabase sends email with magic link to `/auth/callback`
4. User completes password setup on `/onboarding/accept`
5. Server links Auth user to `people` record via `auth_user_id`

**Email Volume for Target Scale (5 Teams, 60 Players):**

- Initial onboarding: 60 players + 15 coaches/guardians = **75 invites**
- Staggered over 3-5 days (realistic roster input time): **15-25 emails/day**
- Ongoing: 5-10 new players/month = **5-10 emails/month**
- Resends (assuming 20% no-response rate): **15 emails/month**
- **Total: 75 initial + 20/month ongoing**

**Supabase Email Limits:**

- Free tier: 2/hour, 30/day (**insufficient for initial onboarding**)
- Pro tier: 1,000/hour, 10,000/month (**sufficient**)

### Scalability Verdict

**✅ Invite scheme scales adequately for 5 teams, 60 players:**

- Supabase Pro email quota (10,000/month) exceeds requirement by 100×
- Initial 75-invite burst fits within daily quota if staggered over 3 days
- Fallback manual invite URL (`acceptUrl`) handles email delivery failures
- Invite token expiry (7 days) and revocation prevent abuse

**Potential Issues:**

1. **Spam folder delivery:** Mitigated by custom SMTP + SPF/DKIM (P1 task)
2. **Onboarding abandonment:** Mitigated by resend UI + reminder emails (P2 task)
3. **Email quota exhaustion:** Non-issue at target scale; monitor via Supabase dashboard

**If Scaling to 50 Teams (600 Players):**

- Initial: 600 invites over 1 week = ~100/day (**still within Pro limits**)
- Ongoing: 50/month (**trivial**)
- No architecture changes required until 5,000+ users

### Recommendations

1. **P0:** Upgrade to Supabase Pro before launch (email quota critical)
2. **P1:** Test email deliverability; configure custom SMTP if needed
3. **P1:** Add resend invite UI so admins can manually trigger retries
4. **P2:** Implement day-5 reminder email for pending invites (improves adoption)
5. **P3:** Monitor email quota usage monthly; alert if >50% consumed

**Conclusion: No changes needed to invite scheme for target scale.**

---

## Appendix A: Service Role Key Rotation Procedure

**When to Rotate:**

- Immediately if key is exposed (committed to git, logged, sent to client)
- Every 90 days as preventive security measure
- When team member with access leaves organization

**Rotation Steps:**

1. Generate new service role key in Supabase dashboard (Settings → API → Reset Service Role Key)
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel production environment
3. Update key in Vercel preview environment
4. Update local `.env.local` for development (communicate to team)
5. Trigger production redeployment to pick up new key
6. Verify invite operations functional in production
7. Old key invalidated automatically; no further action needed

**Verification:**

- Test invite send in production
- Check error tracking for auth failures
- Confirm no server errors in Vercel function logs

---

## Appendix B: Emergency Contact

**For Production Incidents:**

- On-call admin: [to be defined]
- Vercel support: https://vercel.com/support
- Supabase support: support@supabase.io (Pro plan includes priority support)

**Incident Response Priorities:**

1. Database outage: Contact Supabase support immediately
2. Service role key exposure: Rotate key per Appendix A (do not wait)
3. Mass data deletion: Restore from backup per operations runbook
4. Email delivery failure: Switch to manual invite URLs; investigate SMTP config
5. Spike in errors: Check Sentry dashboard; rollback via Vercel if critical

---

**Report End**
