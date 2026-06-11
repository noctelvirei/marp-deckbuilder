import { runtimeChartsScript } from './rich-html/runtime-charts.js'
import { runtimeCoreScript } from './rich-html/runtime-core.js'
import { runtimeInteractionsScript } from './rich-html/runtime-interactions.js'
import { runtimePrintScript } from './rich-html/runtime-print.js'

export function richHtmlRuntimeScript() {
  return `
(function () {
${runtimeCoreScript()}
${runtimeChartsScript()}
${runtimeInteractionsScript()}
${runtimePrintScript()}
}());
`
}
