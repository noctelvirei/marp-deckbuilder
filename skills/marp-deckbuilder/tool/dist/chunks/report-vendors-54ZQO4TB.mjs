import { createRequire as __deckbuilderCreateRequire } from "node:module";
import { fileURLToPath as __deckbuilderFileURLToPath } from "node:url";
import { dirname as __deckbuilderDirname } from "node:path";
const require = __deckbuilderCreateRequire(import.meta.url);
const __filename = __deckbuilderFileURLToPath(import.meta.url);
const __dirname = __deckbuilderDirname(__filename);
import "./chunk-FUPIT6VP.mjs";

// src/report-vendors.js
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
var reportVendorMarker = "data-marp-report-vendor";
var reportVendors = [
  { file: "d3.min.js", label: "d3" },
  { file: "plot.min.js", label: "observable-plot" },
  { file: "chart.min.js", label: "chart.js" }
];
async function injectReportVendorScripts(html, resourcesDir, options = {}) {
  let document = stripKnownReportCdnTags(html);
  if (document.includes(reportVendorMarker)) {
    return { html: document, injected: [], missing: [] };
  }
  const vendorDir = path.join(resourcesDir, "vendor");
  const scripts = [];
  const injected = [];
  const missing = [];
  for (const { file, label } of reportVendors) {
    const vendorPath = path.join(vendorDir, file);
    if (!existsSync(vendorPath)) {
      missing.push({ file, label, path: vendorPath });
      continue;
    }
    const source = await readFile(vendorPath, "utf8");
    scripts.push(`<script ${reportVendorMarker}="${label}">
${source}
</script>`);
    injected.push({ file, label, path: vendorPath });
    options.log?.(`${label}: injected into <head> (offline-safe)`);
  }
  if (!scripts.length) return { html: document, injected, missing };
  document = injectBeforeClosingHead(document, `${scripts.join("\n")}
`);
  return { html: document, injected, missing };
}
function stripKnownReportCdnTags(html) {
  return String(html || "").replace(/<script\s+src=["']https?:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@[^"']*["']\s*><\/script>\s*/gi, "").replace(/<script\s+src=["']https?:\/\/cdn\.jsdelivr\.net\/npm\/@observablehq\/plot@[^"']*["']\s*><\/script>\s*/gi, "").replace(/<script\s+src=["']https?:\/\/cdn\.jsdelivr\.net\/npm\/d3@[^"']*["']\s*><\/script>\s*/gi, "");
}
function injectBeforeClosingHead(html, injection) {
  const headCloseIndex = String(html || "").toLowerCase().lastIndexOf("</head>");
  if (headCloseIndex < 0) return `${injection}${html}`;
  return `${html.slice(0, headCloseIndex)}${injection}${html.slice(headCloseIndex)}`;
}
export {
  injectReportVendorScripts,
  reportVendorMarker,
  stripKnownReportCdnTags
};
