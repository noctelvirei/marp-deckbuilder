import * as cheerio from 'cheerio'

import { cleanText, escapeAttr, escapeHtml } from './report-components/utils.js'

export function prepareReportPresentation(content, frontmatter = {}) {
  const theme = normalizeReportTheme(frontmatter.reportTheme || frontmatter.themeSurface)
  const navEnabled = isTruthy(frontmatter.reportNav || frontmatter.nav)
  const navResult = navEnabled ? addGeneratedNavigation(content) : { content, hasLayout: false }

  return {
    content: navResult.content,
    hasLayout: navResult.hasLayout,
    theme,
  }
}

export function reportBodyClass(theme) {
  return theme === 'dark' ? 'report-theme-dark-page' : ''
}

export function reportMainClass(theme) {
  return ['deck-report', theme === 'dark' ? 'report-theme-dark' : ''].filter(Boolean).join(' ')
}

export function reportArticleClass(hasLayout) {
  return ['report-body', hasLayout ? 'report-body-has-layout' : ''].filter(Boolean).join(' ')
}

function addGeneratedNavigation(content) {
  const root = cheerio.load(`<root>${content}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  const headings = collectNavigationHeadings(root)
  const usedIds = new Set()
  const items = headings
    .map((heading) => {
      const element = root(heading)
      const title = cleanText(element.text())
      if (!title) return null
      const id = uniqueId(element.attr('id') || slugify(title), usedIds)
      element.attr('id', id)
      return { id, title }
    })
    .filter(Boolean)

  if (!items.length) return { content, hasLayout: false }

  return {
    content: `<div class="report-layout">
<aside class="report-sidebar" aria-label="Report contents">
<div class="report-sidebar-title">Contents</div>
<nav>
${items.map((item) => `<a href="#${escapeAttr(item.id)}">${escapeHtml(item.title)}</a>`).join('\n')}
</nav>
</aside>
<div class="report-main">
${root('root').html() || content}
</div>
</div>`,
    hasLayout: true,
  }
}

function collectNavigationHeadings(root) {
  const h2 = root('root > h2').toArray()
  if (h2.length) return h2
  return root('root > h1').toArray()
}

function normalizeReportTheme(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (token === 'dark' || token === 'navy' || token === 'black') return 'dark'
  return ''
}

function isTruthy(value) {
  if (value === true) return true
  return ['true', 'yes', 'on', '1', 'auto'].includes(String(value || '').trim().toLowerCase())
}

function uniqueId(value, usedIds) {
  const base = slugify(value) || 'section'
  let candidate = base
  let suffix = 2
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  usedIds.add(candidate)
  return candidate
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
