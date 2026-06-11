# Resources

Drop deck assets here. The CLI defaults to this folder.

Recommended contents:

- `Brand-PPT-Template.pptx`
- `Brand Logo Slides.pptx`
- logo images
- exported customer logo walls
- screenshots and product images
- fonts

For branded baselines, corporate/company logo assets belong in
`definitions/brand.json` under `assets.logo` and render top left. Customer logos
are supplied by deck/report frontmatter and render top right when present. Keep
dark/light variants next to the logical asset, such as `logo.dark.png`,
`logo-on-dark.png`, `logo.light.png`, or `logo-on-light.png`; the renderer will
prefer those variants for the selected surface.

Markdown can refer to files here with `resource:` URLs:

```md
![Trusted by](resource:trusted-by.png)
```

The path is resolved relative to this directory at build time.

Missing referenced resources fail the build. This is deliberate: a deck should
not render with broken images or empty component content.

## Icons

Put reusable card icons in `icons/`.

```text
resources/
  icons/
    face-scan.svg
    document-check.svg
```

Then reference them from cards by filename stem:

```md
<deck-card title="Face scan" icon="face-scan">Capture identity.</deck-card>
```

The renderer resolves that to `resource:icons/face-scan` and checks supported
image extensions (`.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`).

## Definitions

Brand and layout rules live in `definitions/`:

- `definitions/brand.json`: colors, fonts, slide size, and PPTX layout geometry.
- `definitions/theme.css`: Marp theme CSS for HTML output.

Replace that folder, or pass `--definitions <dir>`, to use a different brand
contract without editing CLI code.

## Agent Branding Checklist

When adapting a baseline skill to a corporate brand, change this resource layer
first:

1. Put the corporate logo contract in `definitions/brand.json` under
   `assets.logo`. Use `dark`, `light`, `reportDark`, or `reportLight` variants
   when the same logo file will not work on every surface.
2. Keep customer logos out of the corporate brand definition. Deck and report
   authors provide `customerLogo` / `customer.logo` in frontmatter; the renderer
   places that logo top right.
3. Put corporate/company logo geometry in `layouts.companyLogo` and customer
   logo geometry in `layouts.customerLogo`. Baseline default is corporate top
   left and customer top right.
4. Put approved background assets in `assets.backgrounds` so agents use
   `resource:` references owned by the renderer, not raw image paths in
   Markdown.
5. Put icons, product screenshots, fonts, and light/dark customer logo variants
   in this folder. Keep sibling names such as `customer.dark.png` or
   `customer-on-light.png` next to the logical asset.
6. Preserve `templates/`, `vendor/`, and generated `dist/` runtime bundles in
   packaged skills. Brand changes should not require hand-editing renderer
   JavaScript.

## Templates

The `templates/` folder contains vendored Marp CLI/Bespoke presenter assets for
HTML slideshows. It is part of the runtime, not the brand contract. Keep it when
merging upstream skill updates.

## Vendor

The `vendor/` folder contains minified browser chart libraries used by premium
HTML output. Build wrappers inject these files into generated HTML so Chart.js,
Observable Plot, and D3 visuals work offline after generation.
