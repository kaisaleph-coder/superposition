# External identity normalization — Phase D gate

Status: **prepared, blocked from production until both external profiles are normalized and reverified**

Canonical person:
- Name: `Kais Abu-Hussein`
- Alternate name: `Kais Abu Hussein`
- Person ID: `https://kaisabuhussein.com/#person`
- Canonical site: `https://kaisabuhussein.com/`

Approved sameAs targets, in canonical order:
1. `https://www.linkedin.com/in/kaisabuhussein/`
2. `https://github.com/kaisaleph-coder`

## LinkedIn release gate

Required before sameAs promotion:
- Public name is exactly **Kais Abu-Hussein**.
- Vanity URL remains `/in/kaisabuhussein/`.
- Headline reflects current identity rather than a stale employer. Recommended factual form:
  `CFO | Restaurant & Construction Executive | Investor/Trader | Entrepreneur & Consultant`
- About section uses the same core identity as the site and does not introduce unsupported claims.
- Contact info includes `https://kaisabuhussein.com/`.
- Current/selected experience is reconciled to the canonical résumé; do not invent dates that are not already verified.
- Remove or demote stale identity signals that imply an obsolete primary employer/role.

## GitHub release gate

Required before sameAs promotion:
- Public display name: **Kais Abu-Hussein**.
- Profile website: `https://kaisabuhussein.com/`.
- Recommended bio:
  `Multidisciplinary executive | Finance, restaurants, construction, investing, entrepreneurship & systems`
- Do not publish private project details solely for SEO.
- Optional but recommended: create the special public profile repository `kaisaleph-coder/kaisaleph-coder` with a minimal README linking the canonical site.
- Existing public `superposition` repository README must identify the canonical production site.
- Legacy GitHub Pages copy must remain `noindex,follow` and canonicalize to `https://kaisabuhussein.com/`.

## Promotion rule

Do not merge the Phase D sameAs candidate to the Cloudflare production branch until:
1. both profile URLs resolve publicly;
2. the visible profile name is canonical on both;
3. GitHub displays the canonical site URL;
4. LinkedIn no longer presents a stale primary identity;
5. a fresh anonymous/public audit confirms the two URLs represent the same person as the site.

No additional social/profile URLs are authorized for sameAs at this checkpoint.
