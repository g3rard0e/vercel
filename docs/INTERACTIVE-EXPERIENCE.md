# Geamy interactive service experience

## Scope

The homepage replaces the static services grid with eight original product stories:
network segmentation, cloud migration, layered security, CCTV views, responsive
website design, automation with approval, backup/recovery, and IT support.

The hero contains a dimensional, connected service map. Its eight satellites are
real anchor links. A global animation control complements system reduced-motion
preferences. The original network journey, About, Terms, Contact, and Footer remain.

## Implementation

- `src/components/ServiceExperience.js`: native custom elements, static service
  catalog, inline SVG illustrations, and local-only interactive demonstrations.
- `src/components/ServiceExperience.css`: dimensional artwork, motion, responsive
  layouts, focusable controls and offscreen animation suspension.
- `src/sections/Hero.jsx` / `Hero.css`: the animated homepage introduction.
- `src/experience-layout.css`: integration with existing business sections.

No runtime dependency, remote image, video download, analytics integration, or
external demo request was added. The visuals use CSS 3D transforms and original
SVG geometry rather than heavyweight WebGL models. All simulated feeds, attacks,
migrations, workflows, restores and support actions are explicitly identified as
demos. They do not access a visitor's camera, devices or data.

CSS animation is paused for offscreen service panels and hidden tabs. The event-driven
scroll handler schedules at most one frame at a time and updates only nearby cards.
Motion preferences disable decorative movement; interactive buttons remain usable.
Finite demo sequences clear their timers when the element is disconnected.

## Validation

Run `npm test` for the existing backend tests and the new zero-dependency experience
checks. `npm run build` continues to run tests before the Vite production build.

Local Chromium component-fixture checks exercised all eight demos at 1440x960,
390x844 and 768x1024, including camera selection, night view, palette and viewport
changes, human approval, restore, reduced motion, and element reconnection. No
horizontal page overflow or JavaScript exceptions were observed in those checks.
Those are component-fixture tests, not an assertion of live-domain verification.
The integrated application must also pass the Vercel preview build before merging.

The existing Microsoft Graph contact code and environment variables are unchanged.
This release does not activate CAPTCHA, change mailbox permissions, or send test mail.
