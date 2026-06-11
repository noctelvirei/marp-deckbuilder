export function htmlDocument({
  html,
  css,
  deckbuilderCss = '',
  comments = [],
  bespokeCss = '',
  bespokeJs = '',
  richHtmlJs = '',
  title = 'Deck',
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
  <style data-deckbuilder-theme>${deckbuilderCss}</style>
  <style>${bespokeCss}</style>
</head>
<body>
${bespokeOsc()}
${html}
${renderNotes(comments)}
<script>${bespokeJs}</script>
<script data-deckbuilder-rich-html>${richHtmlJs}</script>
</body>
</html>
`
}

function bespokeOsc() {
  return `<div class="bespoke-marp-osc">
  <button data-bespoke-marp-osc="prev" tabindex="-1" title="Previous slide">Previous slide</button>
  <span data-bespoke-marp-osc="page"></span>
  <button data-bespoke-marp-osc="next" tabindex="-1" title="Next slide">Next slide</button>
  <button data-bespoke-marp-osc="fullscreen" tabindex="-1" title="Toggle fullscreen (f)">Toggle fullscreen</button>
  <button data-bespoke-marp-osc="overview" tabindex="-1" title="Toggle overview view (o)">Toggle overview view</button>
  <button data-bespoke-marp-osc="presenter" tabindex="-1" title="Open presenter view (p)">Open presenter view</button>
</div>`
}

function renderNotes(comments = []) {
  return comments
    .map((notes, index) => {
      if (!notes?.length) return ''
      const paragraphs = notes
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('')
      return `<div class="bespoke-marp-note" data-index="${index}" tabindex="0">${paragraphs}</div>`
    })
    .join('\n')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
