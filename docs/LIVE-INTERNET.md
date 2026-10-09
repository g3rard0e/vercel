# Live Internet observatory

The Live section is an original illustrated world inspired conceptually by AP Transit's geographic movement, retaining Geamy branding and services.

[RIPE NCC RIS Live](https://ris-live.ripe.net/manual/) supplies public BGP observations, not traffic capture. The browser subscribes to UPDATE announcements involving AS3356 from RRC00, RRC01, RRC06, RRC11, RRC15 and RRC19. Approximate city locations come from [RIPE's directory](https://ris.ripe.net/docs/route-collectors/). Multihop collectors can observe peers elsewhere. Logical AS paths do not establish physical cable routes or network locations.

The panel counts accepted announcements received during the browser session. Visuals sample at most ten pulses/second and retain eight recent announcements. Messages older than 120 seconds and malformed/oversized messages are rejected. Teal pulses mark observation collectors. Amber packets, hubs, continents and intercity cables are illustrative, not measured global traffic. No fake events or attack detections enter the panel.

The feed disconnects outside view, in hidden tabs and on pause, with bounded exponential reconnect. Rendering is capped at 30fps/DPR2. Reduced motion disables movement but preserves readings and explicit controls. Drag to pan; click a collector or choose it in the keyboard-accessible selector to fly closer. Globe/perspective/plan, zoom and reset controls are keyboard accessible. Pause and reduced motion make camera changes immediate and disable parallax and staged entrances. No visitor geolocation is collected. Direct browser connections expose normal connection metadata including visitor IP to RIPE.

## Optional attack statistics

The user chose to continue with RIPE live and prepare Radar for later configuration. Until configured, the UI displays “Attack source not connected”; no simulated red attacks appear.

Set **server-only** `RADAR_API_TOKEN` in Cloudflare Pages Production and Vercel Production runtime environments, then redeploy. Never prefix with `VITE_`, commit it or expose it in browser code. Follow [Cloudflare's current Radar token instructions](https://developers.cloudflare.com/radar/get-started/first-request/) and grant only the required read access. Permission names may differ in the dashboard; never use a Global API key.

`GET /api/network` proxies exactly `/radar/attacks/layer3/top/locations/origin?dateRange=1d&limit=20&format=JSON` from Cloudflare. This gives percentage distribution of layer 3 attack origins over the latest day, not individual live attacks or a complete global count. Polling and per-runtime caching/coalescing occur every five minutes, with a 128KiB response limit and eight-second timeout. Failures back off five minutes. Data older than an hour is rejected. Fields are allowlisted; tokens/upstream errors are never returned. The actual dataset timestamp and date window are preserved. Country markers are approximate; countries do not identify attackers. Unmapped countries remain in textual statistics.

Responses are no-store. Arbitrary URLs are never accepted. CSP adds only `wss://ris-live.ripe.net`; Radar is server-to-server. GSAP and its bundled ScrollTrigger plugin provide staged entrances, scroll-linked perspective and eased camera flights. No animation CDN is required.

## Validation

`npm run build` runs contact, service, routing parser and Radar adapter tests before bundling. Fixtures test contracts and failures, not production observations. Verify recent AS paths in the deployed browser and the actual attack-source state. Mocked Radar tests cannot verify a user's future token.

## Visual direction

The original Geamy globe uses sampled low-detail continent outlines, orthographic spherical projection, raised great-circle schematic connections and front-face picking. Drag or arrow keys rotate it; selecting a collector rotates its city into view. No third-party map assets, textures, telemetry or extra dependencies are loaded. The planar atlas remains available.

Conceptual references reviewed: [11 mois sans toi(t)](https://11moissanstoit.com/) for geographic exploration; [WeEvolveIT](https://weevolveit.com/) for technology storytelling; [Cartier Roadster](https://www.cartier.com/en-us/roadster-universe.html) and [Spyker](https://spykercars.com/) for product-scale composition and lighting; [USAvionix](https://www.usavionix.com/) for technical scene transitions; [Edolus](https://edolus.com/) for planetary scale. No designs, copy, media or source code were copied.

The chapter rail uses normal hash anchors and tracks the current section. GSAP adds clipped line entrances and bounded hero parallax; pause and reduced-motion preference revert these effects without hiding content.
