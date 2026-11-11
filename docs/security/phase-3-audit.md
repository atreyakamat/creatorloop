# Security audit: Phase 3 (creator profiles, open briefs, applications, uploads, review)

Date: 11 Nov 2026 · Scope: migration `0004`, `src/app/creator/**`, reel review in `src/app/business/**`, storage access · Method: manual review of each new policy, trigger, server action and client upload path, with a database test per finding.

## Summary

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| B1 | Every signed-in account could list all creators with rates, follower counts and Instagram | Medium | Fixed, tested (C3d, C9, C12b) |
| B2 | Portfolio links and Instagram handles were validated only by the form; the API accepted `javascript:` links | Medium | Fixed, tested (C3c) and re-checked at render |
| B3 | "Complete your profile before applying" was enforced only in the app | Low | Fixed, tested (C3b) |
| B4 | A creator could approve their own reel or move a brief's status | Checked | Not possible (C12) |
| B5 | A creator could deliver to a brief before being assigned or after it was approved | Checked | Not possible (C5, C6) |
| B6 | One business reading or reviewing another business's reels | Checked | Not possible (C16) |
| B7 | Applications visible to other creators or to businesses | Checked | Not possible (C7, C8) |

## Details

**B1.** The Phase 1 policy let any signed-in user read `creator_profiles`. A business could scrape every creator's rate, and creators could see each other's. Access is now: the creator themself, admins, and a business only for the creator assigned to one of its briefs.

**B2.** The profile form checks links, but the database is also reachable through Supabase's API with the user's own session. Check constraints now require `http(s)://` links and plain Instagram handles. Views that turn these into links validate again before rendering and use `rel="noopener noreferrer nofollow"`.

**B3.** The insert policy for applications now requires a complete profile (name, bio, Instagram, at least one niche).

## How uploads are protected

1. The browser uploads straight to a private bucket. The storage policy accepts the file only in `<creator id>/<brief id>/…`, only if that brief is assigned to that creator and in progress, and only MP4/MOV/WebM up to 50 MB.
2. The server then records the reel. It re-derives the allowed path from the session (never from the form), and the database trigger checks it again.
3. Videos are never public. Pages hand out signed links that expire after one hour, and only the creator, the owning business or an admin can get one.
4. Stored files cannot be overwritten or deleted by creators.

## Brief status cannot be forced

Status moves with the deliveries through a database trigger: a waiting reel means "in review", enough approved reels means "approved", otherwise back to the creator. Businesses can only review each reel once; creators cannot change review status at all.

## Accepted for now

- **Any account that signs up as a creator can read open briefs** (business name, area and the brief). That is how a marketplace works, but it does mean a competitor could sign up and look. If that becomes a concern, change the "creators read open" policy to verified creators only; the admin panel can already verify creators.
- **File type is taken from the upload's declared type.** A non-video renamed to `.mp4` would be stored but will not play, and it is served only as a video download from Supabase's domain, so it cannot run in the app.
- **Signed video links work for anyone who has the link for one hour.**
