export function reportLogo(brand = {}, surface = 'light') {
  const logo = brand.assets?.logo
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  if (surface === 'dark') {
    return logo.reportDark || logo.companyDark || logo.dark || logo.report || logo.content || logo.cover || logo.default || ''
  }
  return logo.reportLight || logo.companyLight || logo.light || logo.report || logo.content || logo.default || logo.cover || ''
}

export function reportCustomerLogo(frontmatter = {}) {
  return frontmatter.customerLogo || frontmatter.customer?.logo || frontmatter.customer?.logoSrc || ''
}

export function reportSurface(frontmatter = {}) {
  const token = String(frontmatter.surface || frontmatter.reportSurface || frontmatter.reportTheme || frontmatter.theme || '')
    .trim()
    .toLowerCase()
  if (['dark', 'navy', 'black'].includes(token)) return 'dark'
  return 'light'
}

export function reportDocument({
  title,
  subtitle = '',
  content,
  css,
  logo = '',
  customerLogo = '',
  toc = [],
  surface = 'light',
  richHtmlJs = '',
  brandName = 'Brand',
  customerName = 'Customer',
}) {
  const hasToc = toc.length >= 4
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
  <main class="deck-report report-${escapeHtmlAttr(surface)}">
    <header class="report-cover">
      ${customerLogo ? `<img class="report-customer-logo" src="${escapeHtmlAttr(customerLogo)}" alt="${escapeHtmlAttr(customerName)} logo">` : ''}
      ${logo ? `<img class="report-logo" src="${escapeHtmlAttr(logo)}" alt="${escapeHtmlAttr(brandName)} logo">` : ''}
      <p class="report-kicker">Report</p>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="report-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </header>
    <div class="report-layout${hasToc ? ' has-toc' : ''}">
      ${hasToc ? renderReportToc(toc) : ''}
      <article class="report-body">
${content}
      </article>
    </div>
  </main>
  <script data-deckbuilder-rich-html>${richHtmlJs}</script>
</body>
</html>
`
}

function renderReportToc(toc = []) {
  const links = toc
    .map((item) => `<a href="#${escapeHtmlAttr(item.id)}">${escapeHtml(item.label)}</a>`)
    .join('\n')
  return `<aside class="report-toc" aria-label="Report contents">
        <div class="report-toc-title">Contents</div>
        <nav>${links}</nav>
      </aside>`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeHtmlAttr(value) {
  return escapeHtml(value)
}
