export const richHtmlCssMarker = '/* Renderer-owned rich HTML components.'
export const richHtmlCssEndMarker = '/* End renderer-owned rich HTML components. */'

export function splitRichHtmlCss(themeCss = '') {
  const css = String(themeCss || '')
  const markerIndex = css.indexOf(richHtmlCssMarker)
  if (markerIndex < 0) {
    return {
      themeCss: css,
      richHtmlCss: '',
    }
  }
  const endMarkerIndex = css.indexOf(richHtmlCssEndMarker, markerIndex)
  if (endMarkerIndex >= 0) {
    const richEndIndex = endMarkerIndex + richHtmlCssEndMarker.length
    const before = css.slice(0, markerIndex).trimEnd()
    const after = css.slice(richEndIndex).trimStart()
    return {
      themeCss: [before, after].filter(Boolean).join('\n'),
      richHtmlCss: css.slice(markerIndex, richEndIndex).trimStart(),
    }
  }

  return {
    themeCss: css.slice(0, markerIndex).trimEnd(),
    richHtmlCss: css.slice(markerIndex).trimStart(),
  }
}
