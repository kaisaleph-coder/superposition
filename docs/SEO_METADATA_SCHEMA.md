# SEO metadata and schema contract

This document is the implementation pattern for current and future canonical pages on kaisabuhussein.com.

## Persistent identity

- Canonical person name: `Kais Abu-Hussein`
- Alternate public name: `Kais Abu Hussein`
- Persistent Person ID: `https://kaisabuhussein.com/#person`
- Canonical WebSite ID: `https://kaisabuhussein.com/#website`

Do not create additional Person IDs for résumé, project or research pages.

## Homepage

The homepage is the canonical identity/profile page and carries one JSON-LD `@graph` containing:

- `WebSite`
- `ProfilePage`
- `Person`

`ProfilePage.mainEntity` must reference the persistent Person ID.

Until external identity normalization is complete:

- omit `sameAs`
- omit `Person.image` unless a real, user-approved portrait is published
- do not infer affiliations, awards, education, location or credentials not visible and verified

The social card at `/assets/og.png` is page/social imagery, not a Person portrait.

## Résumé

`/resume/` carries:

- unique title and description
- self-referential canonical
- complete Open Graph/Twitter metadata
- a `WebPage` node whose `about` references the persistent Person ID
- a minimal Person reference using the same persistent ID

Do not create a second Person identity for the résumé.

## Future projects

Create `/projects/` and individual project URLs only when substantive public content exists.

Each project page should use:

- `WebPage` as the page node
- a relevant visible work type when justified, such as `CreativeWork` or `SoftwareSourceCode`
- `creator: { "@id": "https://kaisabuhussein.com/#person" }`
- `isPartOf: { "@id": "https://kaisabuhussein.com/#website" }`
- unique title, description and canonical
- social metadata based on the page's actual content

Do not invent project dates, collaborators, awards, usage statistics or outcomes.

## Future research

Create `/research/` and research detail pages only when the material is substantive and intended to be public.

Use:

- `WebPage` for the page node
- `CreativeWork`, `Article` or another specific type only when the visible page satisfies that type
- `author` or `creator` referencing the persistent Person ID
- unique metadata and canonical URL

## Social image

The canonical identity social card is:

`https://kaisabuhussein.com/assets/og.png`

Requirements:

- PNG
- 1200 × 630
- no placeholders
- no unverifiable claims
- deterministic generation via `tools/og.mjs`

## Regression rules

Automated tests must fail if:

- the persistent Person ID changes
- homepage `ProfilePage.mainEntity` does not reference the Person
- résumé does not reference the same Person
- `sameAs` appears before external profile normalization is explicitly completed
- a placeholder/default image is used as `Person.image`
- OG image dimensions drift from 1200 × 630
- canonical/social URLs become staging URLs
