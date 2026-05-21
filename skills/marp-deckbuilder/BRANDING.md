# Branding Contract

Use this file only when maintaining a branded fork of the skill or replacing the
default visual system. Normal deck authoring should use `SKILL.md` and
`REFERENCE.md`.

## Editable Brand Surface

Brand-specific changes belong in:

- `tool/resources/definitions/brand.json`: slide size, colors, fonts, PPTX
  geometry, and component layout values.
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
