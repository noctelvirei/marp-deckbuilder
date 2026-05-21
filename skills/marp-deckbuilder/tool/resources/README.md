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

## Definitions

Brand and layout rules live in `definitions/`:

- `definitions/brand.json`: colors, fonts, slide size, and PPTX layout geometry.
- `definitions/theme.css`: Marp theme CSS for HTML output.

Replace that folder, or pass `--definitions <dir>`, to use a different brand
contract without editing CLI code.

## Templates

The `templates/` folder contains vendored Marp CLI/Bespoke presenter assets for
HTML slideshows. It is part of the runtime, not the brand contract. Keep it when
merging upstream skill updates.
