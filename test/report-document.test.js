import assert from 'node:assert/strict'
import { test } from 'node:test'

import { reportCustomerLogo, reportDocument, reportLogo, reportSurface } from '../src/report/document.js'

test('report document boundary owns shell escaping and toc layout', () => {
  const html = reportDocument({
    title: 'Q2 <Usage>',
    subtitle: 'Executive & operations',
    content: '<p>Body</p>',
    css: '.report-body{}',
    logo: 'resource:logo.svg',
    customerLogo: 'resource:customer.svg',
    brandName: 'Lightico & Co',
    customerName: 'Example Bank',
    surface: 'dark',
    toc: [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
      { id: 'three', label: 'Three' },
      { id: 'four', label: 'Four' },
    ],
    richHtmlJs: 'window.__ok = true;',
  })

  assert.match(html, /<title>Q2 &lt;Usage&gt;<\/title>/)
  assert.match(html, /class="deck-report report-dark"/)
  assert.match(html, /alt="Lightico &amp; Co logo"/)
  assert.match(html, /class="report-customer-logo"/)
  assert.match(html, /alt="Example Bank logo"/)
  assert.match(html, /class="report-layout has-toc"/)
  assert.match(html, /href="#four">Four<\/a>/)
  assert.match(html, /window.__ok = true;/)
})

test('report document boundary resolves logo and surface defaults', () => {
  assert.equal(reportLogo({ assets: { logo: 'resource:logo.svg' } }), 'resource:logo.svg')
  assert.equal(reportLogo({ assets: { logo: { reportLight: 'light.svg', reportDark: 'dark.svg' } } }, 'dark'), 'dark.svg')
  assert.equal(reportLogo({ assets: { logo: { report: 'report.svg', default: 'default.svg' } } }), 'report.svg')
  assert.equal(reportLogo({ assets: { logo: { default: 'default.svg' } } }), 'default.svg')
  assert.equal(reportCustomerLogo({ customerLogo: 'customer.svg' }), 'customer.svg')
  assert.equal(reportSurface({ surface: 'navy' }), 'dark')
  assert.equal(reportSurface({ reportTheme: 'light' }), 'light')
})
