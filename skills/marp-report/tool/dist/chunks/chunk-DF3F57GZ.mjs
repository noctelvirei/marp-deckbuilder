import { createRequire as __deckbuilderCreateRequire } from "node:module";
import { fileURLToPath as __deckbuilderFileURLToPath } from "node:url";
import { dirname as __deckbuilderDirname } from "node:path";
const require = __deckbuilderCreateRequire(import.meta.url);
const __filename = __deckbuilderFileURLToPath(import.meta.url);
const __dirname = __deckbuilderDirname(__filename);
import {
  __commonJS,
  __require
} from "./chunk-FUPIT6VP.mjs";

// node_modules/util-deprecate/node.js
var require_node = __commonJS({
  "node_modules/util-deprecate/node.js"(exports, module) {
    module.exports = __require("util").deprecate;
  }
});

// src/charts-svg/styles.js
function selfContainedSvg(svg) {
  return svg.replace(/(<svg\b[^>]*>)/, `$1<style>${svgChartCss()}</style>`);
}
function svgChartCss() {
  return `
  .dsvg { width: 100%; height: auto; display: block; font-family: "Poppins", "Aptos", system-ui, sans-serif; overflow: visible; }
  .dsvg-title { font-size: 19px; font-weight: 600; }
  .dsvg-grid { stroke-width: 1; }
  .dsvg-axis { stroke-width: 1.4; }
  .dsvg-ytick, .dsvg-xtick { font-size: 12.5px; font-weight: 500; }
  .dsvg-linepath { fill: none; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .dsvg-halo { opacity: 0.22; transition: opacity .12s ease, r .12s ease; }
  .dsvg-dot { fill: #fff; stroke-width: 2.5; transition: r .12s ease; }
  .dsvg-hit { fill: transparent; }
  .dsvg-val { font-size: 11.5px; font-weight: 600; }
  .dsvg-legend { font-size: 12.5px; font-weight: 600; dominant-baseline: middle; }
  .dsvg-bar { cursor: default; }
  .dsvg-bar > path, .dsvg-bar { transition: opacity .12s ease; }
  .dsvg-bar:hover { opacity: 0.82; }
  .dsvg-point { cursor: default; }
  .dsvg-point > circle { stroke-width: 1.5; transition: r .12s ease; }
  .dsvg-point:hover > circle { stroke-width: 2.5; }
  .dsvg-point-label { font-size: 11.5px; font-weight: 600; }
  .dsvg-axislabel { font-size: 12.5px; font-weight: 600; }
  .dsvg-slice { cursor: default; transition: opacity .12s ease; }
  .dsvg-slice:hover { opacity: 0.82; }
  .dsvg-doughnut-cap { font-size: 13px; font-weight: 500; }
  .dsvg-doughnut-total { font-size: 26px; font-weight: 700; }
  .dsvg-key-name { font-size: 14px; font-weight: 600; }
  .dsvg-key-value { font-size: 12.5px; font-weight: 500; }
  .dsvg-marker { cursor: default; }
  .dsvg-marker:hover .dsvg-halo { opacity: 0.4; r: 11; }
  .dsvg-marker:hover .dsvg-dot { r: 6; }
  /* tooltip injected by the hover runtime */
  .dsvg-tip { position: fixed; z-index: 9999; pointer-events: none; transform: translate(-50%, -120%);
    background: rgba(9,21,38,.96); color: #eaf2ff; border: 1px solid #27406b; border-radius: 8px;
    padding: 6px 10px; font: 600 12.5px "Poppins","Aptos",sans-serif; white-space: nowrap;
    box-shadow: 0 6px 20px rgba(0,0,0,.35); opacity: 0; transition: opacity .1s ease; }
  .dsvg-tip.is-on { opacity: 1; }
`;
}

export {
  require_node,
  selfContainedSvg,
  svgChartCss
};
