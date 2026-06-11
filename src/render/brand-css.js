export function brandBackgroundCss(brand = {}) {
  const backgrounds = brand.assets?.backgrounds || {}
  const rules = [
    backgroundRule('section', backgrounds.content || backgrounds.default),
    lightBackgroundRule(backgrounds.light || backgrounds.contentLight),
    backgroundRule('section.cover', backgrounds.cover),
    backgroundRule(
      'section.deck-divider-slide, section:has(.deck-divider), .deck-divider',
      backgrounds.divider || backgrounds.cover,
    ),
    backgroundRule(
      'section.deck-close-slide, section:has(.deck-close), .deck-close',
      backgrounds.close || backgrounds.cover,
    ),
  ].filter(Boolean)

  return rules.length ? rules.join('\n') : ''
}

export function brandLogoCss(brand = {}) {
  const companyBox = brand.layouts?.companyLogo || brand.layouts?.logo || { x: 36, y: 21, w: 98, h: 24 }
  const customerBox = brand.layouts?.customerLogo || { x: 828, y: 21, w: 98, h: 24 }
  return `.deck-brand-logo,
.deck-company-logo {
  position: absolute;
  left: ${ptToPxCss(brand, companyBox.x)};
  top: ${ptToPxCss(brand, companyBox.y)};
  width: ${ptToPxCss(brand, companyBox.w)};
  height: ${ptToPxCss(brand, companyBox.h)};
  display: block;
  object-fit: contain;
  z-index: 20;
  pointer-events: none;
}

.deck-customer-logo-frame {
  position: absolute;
  left: ${ptToPxCss(brand, customerBox.x)};
  top: ${ptToPxCss(brand, customerBox.y)};
  width: ${ptToPxCss(brand, customerBox.w)};
  height: ${ptToPxCss(brand, customerBox.h)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  object-fit: contain;
  z-index: 20;
  pointer-events: none;
}

${customerLogoBackplateEnabled(brand) ? `.deck-customer-logo-frame.deck-logo-on-dark {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 4px;
}` : ''}

.deck-customer-logo {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: none !important;
  mix-blend-mode: normal !important;
}`
}

export function brandSurfaceCss(brand = {}) {
  const darkBackground = cssColor(brand, 'backgroundDark', cssColor(brand, 'dark', '090909'))
  const lightBackground = cssColor(brand, 'backgroundLight', cssColor(brand, 'white', 'FFFFFF'))
  const darkText = readableDarkCssColor(brand, 'body', 'C8D8F0')
  const darkMuted = readableDarkCssColor(brand, 'muted', '8B9AB5')
  const darkHeading = readableDarkCssColor(brand, 'white', 'FFFFFF')
  const darkCard = cssColor(brand, 'cardDark', cssColor(brand, 'cardLight', '0D1D36'))
  const darkBorder = cssColor(brand, 'border', '1E3A5F')
  const lightHeading = cssColor(brand, 'headingLight', '090909')
  const lightText = cssColor(brand, 'bodyLight', '444444')
  const lightMuted = cssColor(brand, 'mutedLight', '666666')
  const lightCard = cssColor(brand, 'cardFillLight', 'FDFDFD')
  const lightBorder = cssColor(brand, 'borderLight', 'DEDEDE')

  return `section.dark {
  background-color: ${darkBackground};
  color: ${darkText};
}

section.light {
  background-color: ${lightBackground};
}

section.dark h1,
section.dark h2,
section.dark h3,
section.dark .card-grid h2,
section.dark .deck-lane h2,
section.dark .deck-lane-steps h3,
section.dark .deck-chart figcaption {
  color: ${darkHeading};
}

section.dark p,
section.dark li,
section.dark .card-grid p,
section.dark .deck-lane-steps p,
section.dark .deck-chart-label,
section.dark .deck-chart-value {
  color: ${darkText};
}

section.dark .deck-visual-caption,
section.dark .deck-arrow {
  color: ${darkMuted};
}

section.dark .card-grid article,
section.dark .deck-chart,
section.dark .deck-lane,
section.dark .deck-lane-steps article,
section.dark .deck-proof,
section.dark .deck-logo-tile {
  background: ${darkCard};
  border-color: ${darkBorder};
}

section.light h1,
section.light h2,
section.light h3,
section.light .card-grid h2,
section.light .deck-lane h2,
section.light .deck-lane-steps h3,
section.light .deck-chart figcaption {
  color: ${lightHeading};
}

section.light p,
section.light li,
section.light .card-grid p,
section.light .deck-lane-steps p,
section.light .deck-chart-label,
section.light .deck-chart-value {
  color: ${lightText};
}

section.light .deck-visual-caption,
section.light .deck-arrow {
  color: ${lightMuted};
}

section.light .card-grid article,
section.light .deck-chart,
section.light .deck-lane,
section.light .deck-lane-steps article,
section.light .deck-proof,
section.light .deck-logo-tile {
  background: ${lightCard};
  border-color: ${lightBorder};
}

section.dark .deck-lane-blue .deck-lane-steps article,
section.dark .deck-lane-lightBlue .deck-lane-steps article,
section.dark .deck-lane-cyan .deck-lane-steps article,
section.dark .deck-lane-purple .deck-lane-steps article,
section.dark .deck-lane-green .deck-lane-steps article,
section.dark .deck-lane-orange .deck-lane-steps article,
section.dark .deck-lane-red .deck-lane-steps article,
section.dark .deck-lane-yellow .deck-lane-steps article {
  background: ${darkCard};
}

section.dark .deck-lane-blue .deck-lane-steps article { border-left-color: ${cssColor(brand, 'blue', '0F82F5')}; }
section.dark .deck-lane-lightBlue .deck-lane-steps article,
section.dark .deck-lane-cyan .deck-lane-steps article { border-left-color: ${cssColor(brand, 'lightBlue', '59D6FD')}; }
section.dark .deck-lane-purple .deck-lane-steps article { border-left-color: ${cssColor(brand, 'purple', '5143D5')}; }
section.dark .deck-lane-green .deck-lane-steps article { border-left-color: ${cssColor(brand, 'green', '66CC8E')}; }
section.dark .deck-lane-orange .deck-lane-steps article { border-left-color: ${cssColor(brand, 'orange', 'F9935B')}; }
section.dark .deck-lane-red .deck-lane-steps article { border-left-color: ${cssColor(brand, 'red', 'FC5161')}; }
section.dark .deck-lane-yellow .deck-lane-steps article { border-left-color: ${cssColor(brand, 'yellow', 'FBC546')}; }

section.light .deck-lane-blue .deck-lane-steps article {
  background: #e8f4fe;
  border-left-color: ${cssColor(brand, 'blue', '0F82F5')};
}

section.light .deck-lane-lightBlue .deck-lane-steps article,
section.light .deck-lane-cyan .deck-lane-steps article {
  background: #e9f9ff;
  border-left-color: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-lane-purple .deck-lane-steps article {
  background: #f0edfe;
  border-left-color: ${cssColor(brand, 'purple', '5143D5')};
}

section.light .deck-lane-green .deck-lane-steps article {
  background: #ecf9f1;
  border-left-color: ${cssColor(brand, 'green', '66CC8E')};
}

section.light .deck-lane-orange .deck-lane-steps article {
  background: #fff3ea;
  border-left-color: ${cssColor(brand, 'orange', 'F9935B')};
}

section.light .deck-lane-red .deck-lane-steps article {
  background: #fff0f2;
  border-left-color: ${cssColor(brand, 'red', 'FC5161')};
}

section.light .deck-lane-yellow .deck-lane-steps article {
  background: #fff8df;
  border-left-color: ${cssColor(brand, 'yellow', 'FBC546')};
}`
}

function backgroundRule(selector, resource) {
  if (!resource) return ''
  return `${selector} {
  background-image: url("${escapeCssUrl(resource)}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}`
}

function lightBackgroundRule(resource) {
  if (resource) {
    return backgroundRule('section.light', resource)
  }
  return `section.light {
  background-color: #ffffff;
  background-image: none;
}`
}

function customerLogoBackplateEnabled(brand = {}) {
  const value = brand.customerLogoBackplate ?? brand.assets?.customerLogoBackplate ?? false
  return value === true || ['true', 'yes', 'on', '1', 'chip', 'backplate'].includes(
    String(value || '').trim().toLowerCase(),
  )
}

function escapeCssUrl(value) {
  return String(value).replace(/["\\\n\r\f]/g, '\\$&')
}

function cssColor(brand, keyOrHex, fallback = '') {
  const raw = brand.colors?.[keyOrHex] || keyOrHex || fallback
  const value = /^#?[0-9a-f]{6}$/i.test(String(raw)) ? raw : fallback
  if (!value) return ''
  return /^#/.test(String(value)) ? String(value) : `#${value}`
}

function readableDarkCssColor(brand, token, fallback) {
  const value = cssColor(brand, token, fallback)
  return isDarkCssColor(value) ? `#${fallback}` : value
}

function isDarkCssColor(value) {
  const rgb = hexRgb(value)
  if (!rgb) return false
  return relativeLuminance(rgb) < 0.35
}

function hexRgb(value) {
  const match = String(value || '').match(/^#?([0-9a-f]{6})$/i)
  if (!match) return null
  const hex = match[1]
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function ptToPxCss(brand, value) {
  const pxToPt = brand.slide?.pxToPt || 0.75
  const numeric = Number(value || 0)
  return `${Number((numeric / pxToPt).toFixed(3))}px`
}
