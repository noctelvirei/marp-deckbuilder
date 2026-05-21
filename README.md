# Marp Deckbuilder

Marp Deckbuilder is a narrow, brandable wrapper around Marp-style Markdown.

It keeps the authoring experience close to Marp, renders rich HTML slides with
brand styling, and builds editable PPTX from known deck components.
HTML output uses the vendored Marp CLI/Bespoke presenter shell: full-viewport
slides, keyboard/touch/wheel navigation, on-screen controls, overview mode,
presenter view, and fullscreen.

## Why This Exists

Marp is excellent for writing and presenting rich HTML/CSS slides. Editable
PPTX is harder because arbitrary HTML and CSS do not map cleanly to PowerPoint
objects. This project intentionally narrows the problem:

- Markdown remains the source of truth.
- Brand rules live in replaceable definition files.
- Rich HTML output stays beautiful.
- PPTX output uses native PowerPoint objects for known components.

## Resource Folder

Drop project resources into `resources/`:

- `Brand-PPT-Template.pptx`
- `Brand Logo Slides.pptx`
- logo PNGs/SVGs
- customer logo exports
- fonts
- reusable screenshots or product images

Markdown can reference assets with `resource:` URLs:

```md
![Logo wall](resource:logo-wall.png)
```

The CLI resolves those paths against `resources/` during rendering.

## Usage

Install dependencies:

```powershell
npm install
```

Render HTML and native editable PPTX:

```powershell
npx marp-deckbuilder build samples/demo.md --html dist/demo.html --pptx dist/demo.pptx
```

Native mode is the default because it produces editable PowerPoint objects.

## Markdown Conventions

Slides are separated with `---`, like Marp. Use normal Markdown and HTML.

Optional slide comments guide the PPTX renderer:

```md
<!-- layout: three-stat -->
<!-- eyebrow: EXECUTIVE SNAPSHOT -->
<!-- takeaway: Focus first on reducing manual handoffs. -->

# Three pressure points stand out

<deck-stat-grid>
  <deck-stat value="42%" label="manual handoffs"></deck-stat>
  <deck-stat value="3.8 days" label="average completion time"></deck-stat>
  <deck-stat value="27%" label="rework rate"></deck-stat>
</deck-stat-grid>
```

Known components render to both HTML and native PPTX output:

```md
<deck-card-grid columns="3">
  <deck-card title="Intake">
    <p>Standardize required data capture.</p>
  </deck-card>
</deck-card-grid>

<deck-chart
  type="bar"
  title="Average completion time"
  series="Days"
  labels="Digital, Branch, Contact centre"
  values="2.1, 3.8, 4.6"
></deck-chart>
```

Arbitrary HTML remains valid for HTML output. For PPTX, arbitrary HTML is not
pretended to be editable; convert it into a known component when the slide needs
to stay editable in PowerPoint.

## PPTX Editability Contract

The native renderer only promises editability for known deck components:

- Markdown headings and paragraphs become editable text.
- `deck-stat-grid` becomes editable text and simple shapes.
- `deck-card-grid` becomes editable cards, text, and borders.
- `deck-chart` becomes a native PowerPoint chart.
- `deck-visual` embeds inline SVG as crisp PPTX media while keeping the SVG inline in HTML. Essential styling should live inside the SVG.
- `deck-comparison` becomes editable table-like shapes.
- `deck-swimlane` becomes editable lane, step, and arrow objects.
- `deck-proof` becomes editable stats, context, bridge, and optional logo area.
- `deck-next-steps` becomes editable numbered row cards.
- `deck-logo-wall` places real image assets when present, otherwise editable text tiles.
- `deck-divider` and `deck-close` become editable dark section/close slides.

Arbitrary HTML is still useful for HTML-only reports, but the native PPTX
renderer will not infer editable PowerPoint structure from arbitrary CSS.

## Supported Components

```md
<deck-divider act="ACT 01" title="The Moment." subtitle="A short transition line."></deck-divider>

<deck-stat-grid>
  <deck-stat value="42%" label="manual handoffs"></deck-stat>
</deck-stat-grid>

<deck-card-grid columns="3">
  <deck-card title="Intake"><p>Standardize required data capture.</p></deck-card>
</deck-card-grid>

<deck-chart type="bar" title="Average completion time" labels="Digital, Branch" values="2.1, 3.8"></deck-chart>

<deck-visual title="Scenario operating model" caption="Embedded as SVG in PPTX.">
  <svg viewBox="0 0 920 360" role="img" aria-label="Scenario operating model">
    <rect x="18" y="18" width="884" height="324" fill="#fdfdfd" stroke="#dedede"/>
    <rect x="178" y="104" width="210" height="18" fill="#0f82f5"/>
  </svg>
</deck-visual>

<deck-comparison left-title="Internal build" right-title="Deckbuilder">
  <deck-row label="Timeline" left="12-18 months" right="6-8 weeks"></deck-row>
</deck-comparison>

<deck-swimlane>
  <deck-lane title="HR" color="blue">
    <deck-step title="Invite"><p>Send secure journey link.</p></deck-step>
  </deck-lane>
</deck-swimlane>

<deck-proof customer="Example Bank" bridge="Prospect relevance: same controls apply.">
  <deck-stat value="55%" label="less manual handling"></deck-stat>
  <p>Context paragraph.</p>
</deck-proof>

<deck-logo-wall>
  <deck-logo name="Bank A" image="resource:logos/bank-a.png"></deck-logo>
</deck-logo-wall>

<deck-next-steps>
  <deck-step title="Confirm scope"><p>Pick one journey.</p></deck-step>
</deck-next-steps>

<deck-close title="Thank you" name="Jane Smith" role="VP Solutions"></deck-close>
```

## Proof Demos

The `samples/` folder includes proof decks that exercise the bundle-only skill path:

- `proof-executive-brief.md`: all core business deck components.
- `proof-report-pack.md`: reporting charts, cards, comparison, and next steps.
- `proof-rich-html.md`: raw HTML for the high-fidelity web deck plus editable PPTX components.
- `proof-html-showcase.md`: premium HTML/SVG storytelling paired with editable PPTX fallback slides.

Build one through the Claude skill wrapper:

```powershell
node skills\marp-deckbuilder\scripts\build-deck.mjs samples\proof-rich-html.md --out-dir dist\proof-rich-html
```

## Commands

```powershell
marp-deckbuilder build <input.md> [--html out.html] [--pptx out.pptx]
```

Key options:

- `--resources <dir>`: resource folder, defaults to `resources`.
- `--definitions <dir>`: brand definition folder, defaults to `resources/definitions`.
- `--mode native|editable`: PPTX mode, defaults to `native`.

## Claude Skill

The portable Claude skill lives in `skills/marp-deckbuilder/`.

It includes a small `SKILL.md`, examples, a build wrapper, replaceable
definitions, a `BRANDING.md` contract for branded forks, and a bundled
single-file copy of the native renderer under
`tool/dist/`. The skill also vendors the Marp CLI/Bespoke HTML presenter assets
under `tool/resources/templates/`, so the HTML deck behaves like a real Marp
slideshow without needing Marp CLI at runtime. The skill can produce HTML and
editable PPTX without `node_modules`, `npm install`, LibreOffice, PowerPoint
automation, Chromium, Marp CLI, or other `.exe` dependencies. Branding updates
are made by replacing `skills/marp-deckbuilder/tool/resources/definitions/`.

Use the repo root as the full developer project and treat `skills/marp-deckbuilder/`
as the distributable skill payload. Build a fresh uploadable zip with:

```powershell
npm run package:skill
```

The package step rebuilds `tool/dist/deckbuilder.cjs`, excludes local output and
cache folders, and fails if the uncompressed skill exceeds 30 MB.

## Branded Forks

For branded internal copies, merge public upstream changes rather than asking an
agent to recreate the renderer. Preserve or reapply the branded files in
`skills/marp-deckbuilder/tool/resources/definitions/`, keep the vendored
`tool/resources/templates/` presenter assets from upstream, replace the bundled
`tool/dist/deckbuilder.cjs`, and follow
`skills/marp-deckbuilder/BRANDING.md` for what is allowed to diverge.
