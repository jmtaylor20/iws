# Interior Woodwork Specialist — website

Marketing site for IWS (Rancho Cucamonga, CA) with the new **Signature** cabinet
line as the primary focus. Plain HTML, CSS and vanilla JavaScript: no build step,
no framework, deploys to any static host (Netlify, Cloudflare Pages, GitHub Pages,
plain S3).

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home. Signature-led hero, why Signature, selected work, process, testimonials, about teaser, CTA. |
| `signature.html` | The Signature line: positioning, how the price stays down, comparison table, gallery, FAQ. |
| `work.html` | Filterable gallery of all 51 project photos with a lightbox. Generated from `assets/images/index.json`. |
| `about.html` | Story since 1987, fully custom and commercial work, CNC, the team. |
| `contact.html` | Contact details, estimate form (Netlify Forms ready), map. |
| `thank-you.html` | Form success page. |

## Structure

```
css/styles.css        all styles (design tokens at the top)
css/fonts.css         self-hosted @font-face rules
js/main.js            header, mobile nav, reveal-on-scroll, filters, lightbox
assets/fonts/         Cormorant Garamond, Manrope, Pinyon Script, Bodoni Moda, Jost (OFL)
assets/images/        optimized photos (2400px) by category, plus 1200/ grid copies
assets/images/logo/   logo files (see below)
```

## Logos

The header and footer look for `assets/images/logo/iws-logo-white.png` (the new
lowercase "iws" lockup, white on transparent). Until that file exists they render a
typographic recreation of the lockup in Bodoni Moda and Jost. The Signature hero
looks for `assets/images/logo/signature-logo.png` (transparent PNG) and falls back
to a gold script wordmark. Drop the real files in place and the site picks them up
with no code change.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Content still to confirm

See `CONTENT-TODO.md`.
