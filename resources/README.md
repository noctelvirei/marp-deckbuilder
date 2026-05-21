# Resources

Drop deck assets here. The CLI defaults to this folder.

Recommended contents:

- `Brand-PPT-Template.pptx`
- `Brand Logo Slides.pptx`
- logo images
- exported customer logo walls
- screenshots and product images
- fonts

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
