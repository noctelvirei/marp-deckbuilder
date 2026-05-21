#!/usr/bin/env node
import { createRequire as __deckbuilderCreateRequire } from "node:module";
const require = __deckbuilderCreateRequire(import.meta.url);

// src/cli.js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
async function main() {
  const argv = parseArgs(process.argv.slice(2));
  if (argv.help || argv.command !== "build" || !argv.input) {
    console.log(helpText());
    process.exitCode = argv.help ? 0 : 1;
    return;
  }
  await buildCommand(argv);
}
async function buildCommand(argv) {
  const [{ loadDefinitions }, { parseDeckMarkdown }] = await Promise.all([
    import("./chunks/brand-N2HHKH3N.mjs"),
    import("./chunks/markdown-DVS7OVBD.mjs")
  ]);
  const inputPath = path.resolve(argv.input);
  const projectRoot = process.cwd();
  const resourcesDir = path.resolve(projectRoot, argv.resources);
  const definitionsDir = path.resolve(
    projectRoot,
    argv.definitions || path.join(argv.resources, "definitions")
  );
  const definitions = await loadDefinitions(definitionsDir);
  const markdown = await readFile(inputPath, "utf8");
  const deck = parseDeckMarkdown(markdown);
  const wantsHtml = Boolean(argv.html) || !argv.html && !argv.pptx;
  let rendered;
  if (wantsHtml) {
    const { renderDeckHtml } = await import("./chunks/render-P4AY7DHM.mjs");
    rendered = renderDeckHtml(deck, { resourcesDir, definitions });
  }
  if (argv.html && rendered) {
    const htmlPath = path.resolve(argv.html);
    await mkdir(path.dirname(htmlPath), { recursive: true });
    await writeFile(htmlPath, rendered.document, "utf8");
    console.log(`HTML written to ${htmlPath}`);
  }
  if (argv.pptx) {
    const { writePptx } = await import("./chunks/pptx-XUQVPPHE.mjs");
    const pptxPath = path.resolve(argv.pptx);
    await mkdir(path.dirname(pptxPath), { recursive: true });
    await writePptx({
      deck,
      outputPath: pptxPath,
      brand: definitions.brand,
      resourcesDir,
      mode: argv.mode || "native"
    });
    console.log(`PPTX written to ${pptxPath}`);
  }
  if (!argv.html && !argv.pptx && rendered) {
    console.log(rendered.document);
  }
}
function parseArgs(args) {
  const parsed = {
    command: args[0],
    input: "",
    resources: "resources",
    mode: "native"
  };
  for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.slice(2).split("=", 2);
      const value = inlineValue ?? args[i + 1];
      if (inlineValue === void 0) i += 1;
      parsed[toCamelCase(key)] = value;
    } else if (!parsed.input) {
      parsed.input = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  if (!["native", "editable"].includes(parsed.mode)) {
    throw new Error(`Unsupported --mode "${parsed.mode}". Use "native" or "editable".`);
  }
  return parsed;
}
function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
function helpText() {
  return `marp-deckbuilder build <input>

Build HTML and native editable PPTX slides from Marp-flavored Markdown.

Options:
  --html <path>         Write rich HTML output.
  --pptx <path>         Write editable PPTX output.
  --resources <dir>     Resource folder. Defaults to resources.
  --definitions <dir>   Folder containing brand.json and theme.css.
  --mode <mode>         native or editable. Defaults to native.
  --help, -h            Show this help.
`;
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
