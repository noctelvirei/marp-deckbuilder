# Branding Contract

Use this file only when maintaining a branded fork of the skill or replacing the
default visual system. Normal deck authoring should use `SKILL.md` and
`REFERENCE.md`.

## Editable Brand Surface

Brand-specific changes belong in:

- `tool/resources/definitions/brand.json`: slide size, colors, fonts, PPTX
  geometry, optional asset references, and component layout values.
- `tool/resources/definitions/theme.css`: Marp theme CSS for HTML slides.
- `tool/resources/`: logos, screenshots, customer logo exports, fonts, and
  reusable image assets.
- `SKILL.md`: only brief workflow guidance that is genuinely specific to the
  branded environment.

The public upstream should stay unbranded. Branded forks may contain private
names, colors, fonts, and assets inside their own `tool/resources/definitions/`
and asset files.

## Runtime Surface

Do not edit these files for brand changes:

- `tool/dist/`
- `tool/resources/templates/`
- `scripts/build-deck.mjs`
- component names or syntax in `REFERENCE.md`

`tool/resources/templates/` contains the vendored Marp CLI/Bespoke presenter
shell used by HTML slideshows. Keep this folder from upstream unless deliberately
upgrading the presenter implementation.

## Branded Fork Merge Procedure

When pulling fixes from the public upstream into a branded fork:

1. Preserve the branded `tool/resources/definitions/` folder and any branded
   assets already under `tool/resources/`.
2. Import upstream runtime fixes, especially `tool/dist/`,
   `tool/resources/templates/`, `scripts/`, examples, and documentation.
3. Merge `SKILL.md` carefully: keep branded workflow notes, but keep upstream
   tool-usage instructions and component guidance.
4. Do not regenerate the renderer from prompts. Use the upstream built file.
5. Build a demo deck and check both HTML and PPTX before packaging the skill.

Use `REFERENCE.md` for component syntax. Use this file only to decide where brand
customization should live.

After importing upstream changes, ask the local agent to rewrite the branded
fork's own branding/import documentation from the upstream `README.md` and this
`BRANDING.md`, while preserving all private business-specific requirements,
brand names, colours, client workflow notes, and internal distribution steps.
This keeps the branded fork aligned with the upstream renderer contract without
overwriting private brand context.

## Optional Assets

Brand backgrounds and logos should be declared in `brand.json` when both HTML
and PPTX should use image assets. HTML embeds those `resource:` assets into the
generated file by default; PPTX inserts them into slides as native image media.
The renderer positions the company logo using `layouts.companyLogo` (or legacy
`layouts.logo`) and the customer logo using `layouts.customerLogo`.
Customer logos receive a white chip/backplate automatically on dark slides so
transparent customer SVGs remain readable without CSS filter inversion.

```json
{
  "assets": {
    "backgrounds": {
      "cover": "resource:brand-title-bg.png",
      "divider": "resource:brand-title-bg.png",
      "close": "resource:brand-title-bg.png",
      "content": "resource:brand-content-bg.png"
    },
    "logo": {
      "dark": "resource:brand-logo-light.svg",
      "light": "resource:brand-logo-dark.svg"
    }
  },
  "layouts": {
    "companyLogo": { "x": 36, "y": 21, "w": 98, "h": 24 },
    "customerLogo": { "x": 828, "y": 21, "w": 98, "h": 24 }
  }
}
```

Asset paths resolve relative to `tool/resources/`. If an asset is missing, the
renderer falls back to the configured solid colours.

## Slide Surface Contract

Surface is a design choice, not a fixed layout rule. Branded forks should
provide readable dark and light variants for the main deck styles, especially
executive layouts. Cover, divider, and close slides may default dark for
compatibility, but content/component slides can be dark or light depending on
the story and audience. Authors may use `defaultSurface: dark|light`,
`<!-- surface: dark|light -->`, `<!-- _class: dark|light -->`, or component
attributes such as `surface="dark"` to choose a surface. Ordinary deck Markdown
should not set global theme names or hand-position logos.

Avoid theme CSS rules that invert `.deck-customer-logo`; customer logos should
keep their original brand colours. The renderer handles dark-surface contrast by
placing the customer logo on a white chip/backplate.

Recommended optional colour tokens for light surfaces:

```json
{
  "colors": {
    "backgroundLight": "FFFFFF",
    "headingLight": "090909",
    "bodyLight": "444444",
    "mutedLight": "666666",
    "cardFillLight": "FDFDFD",
    "borderLight": "DEDEDE",
    "takeawayFillLight": "F0F4FA"
  }
}
```

If these tokens are absent, the renderer uses readable white-page fallbacks.
Keep dark-surface tokens such as `dark`, `body`, `muted`, `cardLight`, and
`border` for dark surfaces.
