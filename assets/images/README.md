# IWS image library (pulled from the old website)

Every photo, logo and video from the old Interior Woodwork Specialist site
(https://www.interiorwoodworkspecialist.com, WordPress hosted at
travis-minardi.dreamhosters.com), pulled on 2026-09-11 so the new site can use
them until IWS provides fresh photography.

Theme demo images, stock placeholders and two watermarked 123RF stock photos that
were sitting in the old media library were deliberately left out. Exact
duplicate uploads were dropped and are listed under `duplicates_of_this` in
`manifest.json`.

## Folders

| Folder | What is in it |
| --- | --- |
| `originals/<category>/` | Full-resolution originals exactly as uploaded to WordPress (HEIC photos converted to full-size JPG, EXIF rotation applied). |
| `web/<category>/` | Web-ready copies: EXIF rotation applied, longest edge 1600px, progressive JPEG at quality 82. Use these on the new site. |
| `optimized/<category>/` | **Use these first.** The 52 photos worth reusing on the new site, hand-picked and enhanced: colors converted to sRGB, EXIF rotation applied, gentle auto-levels, contrast and saturation, resized to a 2400px long edge, sharpened, saved at JPEG quality 88 with descriptive filenames. Duplicate screenshots, low-res copies, personal photos and maps are left out. `optimized/index.json` maps each file back to its original. |
| `heic-source/` | The raw iPhone `.heic` files, kept only as a backup of the source. |
| `manifest.json` | One entry per asset: category, original and web paths, dimensions, source URL, WordPress media ID, upload date, which old-site pages used it, and notes. |

## Categories

| Category | Count |
| --- | --- |
| `bathrooms` | 11 |
| `built-ins-offices` | 14 |
| `kitchens` | 38 |
| `location-maps` | 3 |
| `logo` | 5 |
| `team` | 6 |
| `video` | 1 |

* `kitchens`: kitchen cabinetry, islands, pantries.
* `bathrooms`: vanities and bathroom cabinetry.
* `built-ins-offices`: home offices, window seats, fireplace built-ins, closets and detail shots.
* `team`: personal and team photos that the old site used in its About and Home sections (beach portraits, family, wedding, AWFS trade show). Confirm with IWS before reusing these.
* `logo`: the IWS mark at several sizes. `originals/logo/LOGO-Minardi.jpg` is the largest clean copy (2000x2000).
* `location-maps`: Google Maps screenshots of the North Cucamonga area, probably from an old contact page.
* `video`: the CNC-cut Eiffel Tower clip shown on the old About page.

## Which photos the live site actually shows

`manifest.json` records `used_on_pages` for each asset. 31 of the 78 assets
are visible on the current site (home, about-us, kitchens, bathrooms, gallery,
contact-us). The rest were uploaded to WordPress but never placed on a page, so
they are fresh material for the new site.

## Regenerating

The images were fetched from the WordPress REST API
(`/wp-json/wp/v2/media`) and organized with a one-off Python script using
Pillow and pillow-heif. Nothing here is generated at build time.
