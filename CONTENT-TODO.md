# Content to confirm with IWS before launch

Everything factual on the site came from the old website (founded 1987, the
Minardi team, address, phone, email, socials, the three testimonials) or from the
new logo lockup (license #479690). The items below are marketing copy written to
position the Signature line and should be checked against how IWS actually runs it.

## Signature line (signature.html, index.html)
- The line is described as a **curated palette of door styles, wood species and
  finishes**, built to measure, with fully custom still available. Confirm this is
  how IWS defines Signature, and add the actual palette (door styles, species,
  finishes, hardware) when available.
- "How we keep the price down" lists: focused menu, CNC precision, shop direct
  (no dealer markup, no subcontracted installers), streamlined process. Confirm.
- Comparison table rows (design help included, IWS crew installs, "Mid" investment
  tier). Confirm each cell.
- FAQ answers, especially "Do you install?" and lead-time language.
- Testimonial attributions ("Kitchen client", "Custom cabinetry client") are
  generic labels added by us. Adjust if IWS knows the projects.

## Reviews page (reviews.html)
- Yelp reviews (Maureen J., Mary K., Marlene R., Ever M.) are verbatim from Yelp
  via its public listing mirror. Marlene R.'s review is shown up to the point the
  public snippet cuts off; paste the full text from Yelp if IWS wants it complete.
- All four Google reviews (R. Thomas, Shelly S., Paul L., Bret R.) are on the
  page verbatim with the owner replies. R. Thomas's reply is trimmed to its first
  three sentences for length.
- Shelly S.'s Google review has four photos. The vanity photo was already in the
  library and is on her card. Add the other three (hallway cabinet, laundry room,
  butler's nook) to assets/images/reviews/ and drop them into the commented slot.
- Facebook shows 5.0 across 6 reviews; none of the text is on the page yet.
- "Mark" (from the old website, source unknown) still appears on the home page
  but not on the reviews page. Add him to the reviews page if IWS can name the
  platform it came from.
- The Google links use a Maps search. Swap in the profile's short link
  (g.page/...) and its "write a review" link once IWS shares them.
- Ratings shown: Yelp 5.0, Google 5.0 (per Birdeye aggregate), BBB A+ with no
  complaints on file. Re-verify before launch.

## Logos and imagery
- Add `assets/images/logo/iws-logo-white.png` (new lockup, white on transparent)
  and `assets/images/logo/signature-logo.png` (transparent PNG). Both are wired up.
- Replace the typographic team cards on the About page with real photos if IWS
  wants faces on the site.
- Seven kitchen photos are only ~750x1000 and are kept out of hero positions.

## Contact form
- The form is set up for Netlify Forms (`data-netlify="true"`, posts to
  `/thank-you.html`). On any other host, point it at Formspree, Basin, or similar.
- Confirm the "within one business day" response promise.

## Legal and SEO
- License #479690 was read from the new horizontal logo lockup. Verify on CSLB.
- Add a privacy policy page if the site will run analytics or ads.
- Page titles and meta descriptions are drafted; adjust keywords as needed.
