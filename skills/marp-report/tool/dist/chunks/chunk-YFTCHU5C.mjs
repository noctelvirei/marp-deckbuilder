import { createRequire as __deckbuilderCreateRequire } from "node:module";
const require = __deckbuilderCreateRequire(import.meta.url);

// src/resources.js
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
var imageExtensions = [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
function normalizeResourceReference(value, options = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(data|https?|file):/i.test(raw)) return raw;
  if (raw.startsWith("resource:")) return raw;
  const normalized = raw.replace(/\\/g, "/");
  const defaultFolder = options.defaultFolder || "";
  const resourcePath = defaultFolder && !normalized.includes("/") ? `${defaultFolder}/${normalized}` : normalized;
  return `resource:${resourcePath}`;
}
function resolveResourceFile(value, resourcesDir = "resources") {
  const rawValue = String(value || "").trim();
  if (!rawValue) return null;
  if (/^(data|https?|file):/i.test(rawValue)) {
    throw new Error(
      `Unsupported resource URL "${rawValue}". Use files under the resources folder so the deck can embed them.`
    );
  }
  const root = path.resolve(resourcesDir);
  const resourcePath = rawValue.startsWith("resource:") ? rawValue.slice("resource:".length) : rawValue;
  const normalized = resourcePath.replace(/\\/g, "/");
  if (!normalized || normalized.includes("\0")) {
    throw new Error(`Invalid resource reference "${rawValue}".`);
  }
  const basePath = path.resolve(root, normalized);
  if (!isInsideOrSame(root, basePath)) {
    throw new Error(
      `Resource reference "${rawValue}" resolves outside the resources folder: ${basePath}`
    );
  }
  const candidates = candidatePaths(basePath);
  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) throw missingResourceError(rawValue, candidates);
  return {
    path: resolved,
    relativePath: normalizeResourcePath(path.relative(root, resolved))
  };
}
function resolveSurfaceResourceFile(value, resourcesDir = "resources", surface = "") {
  const rawValue = String(value || "").trim();
  if (!rawValue || !surface) return resolveResourceFile(value, resourcesDir);
  const variant = surfaceResourceCandidates(rawValue, surface);
  for (const candidate of variant) {
    try {
      return resolveResourceFile(candidate, resourcesDir);
    } catch {
    }
  }
  return resolveResourceFile(value, resourcesDir);
}
function resourceToDataUri(filePath) {
  const bytes = readFileSync(filePath);
  return `data:${mimeType(filePath)};base64,${bytes.toString("base64")}`;
}
function normalizeResourcePath(value) {
  return String(value || "").replace(/\\/g, "/");
}
function candidatePaths(basePath) {
  if (path.extname(basePath)) return [basePath];
  return imageExtensions.map((extension) => `${basePath}${extension}`);
}
function surfaceResourceCandidates(value, surface) {
  const token = String(surface || "").trim().toLowerCase();
  if (token !== "dark" && token !== "light") return [];
  const prefix = value.startsWith("resource:") ? "resource:" : "";
  const resourcePath = prefix ? value.slice(prefix.length) : value;
  const extension = path.extname(resourcePath);
  const withoutExtension = extension ? resourcePath.slice(0, -extension.length) : resourcePath;
  const suffixes = token === "dark" ? [".dark", "-dark", ".on-dark", "-on-dark"] : [".light", "-light", ".on-light", "-on-light"];
  if (!extension) {
    return suffixes.map((suffix) => `${prefix}${withoutExtension}${suffix}`);
  }
  const extensions = [
    extension,
    ...imageExtensions.filter((candidate) => candidate !== extension.toLowerCase())
  ];
  return suffixes.flatMap(
    (suffix) => extensions.map((candidateExtension) => `${prefix}${withoutExtension}${suffix}${candidateExtension}`)
  );
}
function missingResourceError(value, candidates) {
  return new Error(
    `Resource not found: ${value}. Looked for:
${candidates.map((candidate) => `  - ${candidate}`).join("\n")}`
  );
}
function isInsideOrSame(root, candidate) {
  const relative = path.relative(root, candidate);
  return !relative || !relative.startsWith("..") && !path.isAbsolute(relative);
}
function mimeType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export {
  normalizeResourceReference,
  resolveResourceFile,
  resolveSurfaceResourceFile,
  resourceToDataUri
};
