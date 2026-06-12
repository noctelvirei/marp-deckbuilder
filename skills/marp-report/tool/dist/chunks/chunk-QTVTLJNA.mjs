import { createRequire as __deckbuilderCreateRequire } from "node:module";
import { fileURLToPath as __deckbuilderFileURLToPath } from "node:url";
import { dirname as __deckbuilderDirname } from "node:path";
const require = __deckbuilderCreateRequire(import.meta.url);
const __filename = __deckbuilderFileURLToPath(import.meta.url);
const __dirname = __deckbuilderDirname(__filename);

// src/brand.js
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
var semanticColorFallbacks = {
  dark: "090909",
  white: "FFFFFF",
  carddark: "1D1E29",
  cardlight: "FDFDFD",
  blue: "0F82F5",
  lightblue: "59D6FD",
  cyan: "59D6FD",
  purple: "5143D5",
  primarypurple: "803584",
  green: "66CC8E",
  orange: "F9935B",
  yellow: "FBC546",
  red: "FC5161",
  body: "444444",
  border: "DEDEDE",
  muted: "888888",
  footnote: "888888",
  backgrounddark: "090909",
  backgroundlight: "FFFFFF",
  cardfilllight: "FDFDFD",
  borderlight: "DEDEDE",
  headinglight: "090909",
  bodylight: "444444",
  mutedlight: "666666",
  bodyondark: "C8D8F0",
  mutedondark: "8A95A8",
  execheading: "FFFFFF",
  execbody: "C9D2E8",
  execmuted: "8A95A8",
  execcard: "13213D",
  execcardlight: "FDFDFD",
  takeawayfill: "F0F0F0",
  takeawayfilllight: "F0F4FA",
  rowfilllight: "FDFDFD",
  leftfilllight: "FFF0F0",
  rightfilllight: "EEF6FE",
  lefttextlight: "CC3333",
  righttextlight: "0A5FAB"
};
async function loadDefinitions(definitionsDir) {
  const root = definitionsDir instanceof URL ? fileURLToPath(definitionsDir) : path.resolve(definitionsDir);
  const brandPath = path.join(root, "brand.json");
  const themePath = path.join(root, "theme.css");
  const templateRoot = path.resolve(root, "..", "templates");
  const bespokeCssPath = path.join(templateRoot, "bespoke.css");
  const bespokeJsPath = path.join(templateRoot, "bespoke.js");
  const [brandRaw, themeCss] = await Promise.all([
    readFile(brandPath, "utf8"),
    readFile(themePath, "utf8")
  ]);
  const brand = JSON.parse(brandRaw);
  validateBrand(brand, brandPath);
  return {
    root,
    brand,
    themeCss,
    bespokeCss: existsSync(bespokeCssPath) ? await readFile(bespokeCssPath, "utf8") : "",
    bespokeJs: existsSync(bespokeJsPath) ? await readFile(bespokeJsPath, "utf8") : ""
  };
}
function ptToIn(value) {
  return value / 72;
}
function pxToIn(value, slide) {
  return ptToIn(value * slide.pxToPt);
}
function color(brand, keyOrHex) {
  if (!keyOrHex) return brand.colors.dark;
  if (typeof keyOrHex !== "string") return keyOrHex;
  const value = keyOrHex.trim();
  const direct = brand.colors[value];
  if (direct) return direct;
  const normalizedKey = Object.keys(brand.colors || {}).find(
    (key) => key.toLowerCase() === value.toLowerCase()
  );
  if (normalizedKey) return brand.colors[normalizedKey];
  const semantic = semanticColorFallbacks[value.toLowerCase()];
  if (semantic) return semantic;
  const hex = value.match(/^#?([0-9a-f]{6})$/i);
  if (hex) return hex[1].toUpperCase();
  return value;
}
function font(brand, keyOrName = "regular") {
  return brand.fonts[keyOrName] || keyOrName;
}
function cssColorToHex(value, fallback = "090909") {
  if (!value) return fallback;
  const hex = value.trim().match(/^#?([0-9a-f]{6})$/i);
  if (hex) return hex[1].toUpperCase();
  const rgb = value.trim().match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i);
  if (!rgb) return fallback;
  if (rgb[4] !== void 0 && Number(rgb[4]) === 0) return fallback;
  return [rgb[1], rgb[2], rgb[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function validateBrand(brand, brandPath) {
  const required = [
    ["themeName", brand.themeName],
    ["slide.widthIn", brand.slide?.widthIn],
    ["slide.heightIn", brand.slide?.heightIn],
    ["slide.pxToPt", brand.slide?.pxToPt],
    ["colors.dark", brand.colors?.dark],
    ["fonts.regular", brand.fonts?.regular],
    ["layouts.header.title", brand.layouts?.header?.title]
  ];
  const missing = required.filter(([, value]) => value === void 0 || value === null || value === "").map(([name]) => name);
  if (missing.length) {
    throw new Error(`${brandPath} is missing required definition(s): ${missing.join(", ")}`);
  }
}

export {
  loadDefinitions,
  ptToIn,
  pxToIn,
  color,
  font,
  cssColorToHex
};
