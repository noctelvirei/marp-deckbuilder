# Marp Deckbuilder

Marp Deckbuilder is a narrow, branded wrapper around Marp-style Markdown.

It keeps the authoring experience close to Marp, renders rich HTML slides with
brand styling, and builds editable PPTX from known deck components.

## Why This Exists

Marp is excellent for writing and presenting rich HTML/CSS slides. Editable
PPTX is harder because arbitrary HTML and CSS do not map cleanly to PowerPoint
objects. This project intentionally narrows the problem:

- Markdown remains the source of truth.
- Brand rules live in replaceable definition files.
- Rich HTML output stays beautiful.
- PPTX output uses native PowerPoint objects for known components.
- Explicit screenshot-backed modes remain available for image-only escape hatches.

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

For screenshot-backed PPTX backdrops, opt into hybrid mode and provide a
Chromium-family browser executable:

```powershell
npx marp-deckbuilder build samples/demo.md --pptx dist/demo.pptx --mode hybrid --browser "D:\path\to\browser.exe"
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

Known components render to both HTML and native PPTX objects:

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
pretended to be editable; convert it into a known component or use an explicit
image-backed mode.

## PPTX Editability Contract

The native renderer only promises editability for known deck components:

- Markdown headings and paragraphs become editable text.
- `deck-stat-grid` becomes editable text and simple shapes.
- `deck-card-grid` becomes editable cards, text, and borders.
- `deck-chart` becomes a native PowerPoint chart.
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

## Commands

```powershell
marp-deckbuilder build <input.md> [--html out.html] [--pptx out.pptx] [--images dir]
```

Key options:

- `--resources <dir>`: resource folder, defaults to `resources`.
- `--definitions <dir>`: brand definition folder, defaults to `resources/definitions`.
- `--browser <path>`: browser executable for screenshots and DOM extraction.
- `--mode native|hybrid|editable|image`: PPTX mode, defaults to `native`.
- `--no-backdrop`: build editable text without rendered slide image backdrops.

## Claude Skill

The portable Claude skill lives in `skills/marp-deckbuilder/`.

It includes a small `SKILL.md`, examples, a build wrapper, and a bundled copy of
the native renderer under `tool/`. The skill can produce HTML and editable PPTX
without LibreOffice, PowerPoint automation, Chromium, or other `.exe`
dependencies. Branding updates are made by replacing
`skills/marp-deckbuilder/tool/resources/definitions/`.
