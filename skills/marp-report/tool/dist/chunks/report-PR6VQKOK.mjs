import { createRequire as __deckbuilderCreateRequire } from "node:module";
import { fileURLToPath as __deckbuilderFileURLToPath } from "node:url";
import { dirname as __deckbuilderDirname } from "node:path";
const require = __deckbuilderCreateRequire(import.meta.url);
const __filename = __deckbuilderFileURLToPath(import.meta.url);
const __dirname = __deckbuilderDirname(__filename);
import {
  require_punycode,
  resolveResourceUrls
} from "./chunk-FCDRB7MA.mjs";
import {
  decodeHTML,
  expandSelfClosingComponentTags,
  load,
  splitFrontmatter
} from "./chunk-J57QK4OG.mjs";
import "./chunk-MGQWBMZO.mjs";
import "./chunk-RQ4ZKSEQ.mjs";
import {
  normalizeResourceReference,
  resolveSurfaceResourceFile
} from "./chunk-OQTZ2PXJ.mjs";
import {
  __export,
  __toESM
} from "./chunk-FUPIT6VP.mjs";

// node_modules/markdown-it/lib/common/utils.mjs
var utils_exports = {};
__export(utils_exports, {
  arrayReplaceAt: () => arrayReplaceAt,
  assign: () => assign,
  escapeHtml: () => escapeHtml,
  escapeRE: () => escapeRE,
  fromCodePoint: () => fromCodePoint,
  has: () => has,
  isMdAsciiPunct: () => isMdAsciiPunct,
  isPunctChar: () => isPunctChar,
  isSpace: () => isSpace,
  isString: () => isString,
  isValidEntityCode: () => isValidEntityCode,
  isWhiteSpace: () => isWhiteSpace,
  lib: () => lib,
  normalizeReference: () => normalizeReference,
  unescapeAll: () => unescapeAll,
  unescapeMd: () => unescapeMd
});

// node_modules/mdurl/index.mjs
var mdurl_exports = {};
__export(mdurl_exports, {
  decode: () => decode_default,
  encode: () => encode_default,
  format: () => format,
  parse: () => parse_default
});

// node_modules/mdurl/lib/decode.mjs
var decodeCache = {};
function getDecodeCache(exclude) {
  let cache = decodeCache[exclude];
  if (cache) {
    return cache;
  }
  cache = decodeCache[exclude] = [];
  for (let i = 0; i < 128; i++) {
    const ch = String.fromCharCode(i);
    cache.push(ch);
  }
  for (let i = 0; i < exclude.length; i++) {
    const ch = exclude.charCodeAt(i);
    cache[ch] = "%" + ("0" + ch.toString(16).toUpperCase()).slice(-2);
  }
  return cache;
}
function decode(string, exclude) {
  if (typeof exclude !== "string") {
    exclude = decode.defaultChars;
  }
  const cache = getDecodeCache(exclude);
  return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
    let result = "";
    for (let i = 0, l = seq.length; i < l; i += 3) {
      const b1 = parseInt(seq.slice(i + 1, i + 3), 16);
      if (b1 < 128) {
        result += cache[b1];
        continue;
      }
      if ((b1 & 224) === 192 && i + 3 < l) {
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        if ((b2 & 192) === 128) {
          const chr = b1 << 6 & 1984 | b2 & 63;
          if (chr < 128) {
            result += "\uFFFD\uFFFD";
          } else {
            result += String.fromCharCode(chr);
          }
          i += 3;
          continue;
        }
      }
      if ((b1 & 240) === 224 && i + 6 < l) {
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        if ((b2 & 192) === 128 && (b3 & 192) === 128) {
          const chr = b1 << 12 & 61440 | b2 << 6 & 4032 | b3 & 63;
          if (chr < 2048 || chr >= 55296 && chr <= 57343) {
            result += "\uFFFD\uFFFD\uFFFD";
          } else {
            result += String.fromCharCode(chr);
          }
          i += 6;
          continue;
        }
      }
      if ((b1 & 248) === 240 && i + 9 < l) {
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        const b4 = parseInt(seq.slice(i + 10, i + 12), 16);
        if ((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128) {
          let chr = b1 << 18 & 1835008 | b2 << 12 & 258048 | b3 << 6 & 4032 | b4 & 63;
          if (chr < 65536 || chr > 1114111) {
            result += "\uFFFD\uFFFD\uFFFD\uFFFD";
          } else {
            chr -= 65536;
            result += String.fromCharCode(55296 + (chr >> 10), 56320 + (chr & 1023));
          }
          i += 9;
          continue;
        }
      }
      result += "\uFFFD";
    }
    return result;
  });
}
decode.defaultChars = ";/?:@&=+$,#";
decode.componentChars = "";
var decode_default = decode;

// node_modules/mdurl/lib/encode.mjs
var encodeCache = {};
function getEncodeCache(exclude) {
  let cache = encodeCache[exclude];
  if (cache) {
    return cache;
  }
  cache = encodeCache[exclude] = [];
  for (let i = 0; i < 128; i++) {
    const ch = String.fromCharCode(i);
    if (/^[0-9a-z]$/i.test(ch)) {
      cache.push(ch);
    } else {
      cache.push("%" + ("0" + i.toString(16).toUpperCase()).slice(-2));
    }
  }
  for (let i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }
  return cache;
}
function encode(string, exclude, keepEscaped) {
  if (typeof exclude !== "string") {
    keepEscaped = exclude;
    exclude = encode.defaultChars;
  }
  if (typeof keepEscaped === "undefined") {
    keepEscaped = true;
  }
  const cache = getEncodeCache(exclude);
  let result = "";
  for (let i = 0, l = string.length; i < l; i++) {
    const code2 = string.charCodeAt(i);
    if (keepEscaped && code2 === 37 && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }
    if (code2 < 128) {
      result += cache[code2];
      continue;
    }
    if (code2 >= 55296 && code2 <= 57343) {
      if (code2 >= 55296 && code2 <= 56319 && i + 1 < l) {
        const nextCode = string.charCodeAt(i + 1);
        if (nextCode >= 56320 && nextCode <= 57343) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }
      result += "%EF%BF%BD";
      continue;
    }
    result += encodeURIComponent(string[i]);
  }
  return result;
}
encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
encode.componentChars = "-_.!~*'()";
var encode_default = encode;

// node_modules/mdurl/lib/format.mjs
function format(url) {
  let result = "";
  result += url.protocol || "";
  result += url.slashes ? "//" : "";
  result += url.auth ? url.auth + "@" : "";
  if (url.hostname && url.hostname.indexOf(":") !== -1) {
    result += "[" + url.hostname + "]";
  } else {
    result += url.hostname || "";
  }
  result += url.port ? ":" + url.port : "";
  result += url.pathname || "";
  result += url.search || "";
  result += url.hash || "";
  return result;
}

// node_modules/mdurl/lib/parse.mjs
function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.pathname = null;
}
var protocolPattern = /^([a-z0-9.+-]+:)/i;
var portPattern = /:[0-9]*$/;
var simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
var delims = ["<", ">", '"', "`", " ", "\r", "\n", "	"];
var unwise = ["{", "}", "|", "\\", "^", "`"].concat(delims);
var autoEscape = ["'"].concat(unwise);
var nonHostChars = ["%", "/", "?", ";", "#"].concat(autoEscape);
var hostEndingChars = ["/", "?", "#"];
var hostnameMaxLen = 255;
var hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
var hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
var hostlessProtocol = {
  javascript: true,
  "javascript:": true
};
var slashedProtocol = {
  http: true,
  https: true,
  ftp: true,
  gopher: true,
  file: true,
  "http:": true,
  "https:": true,
  "ftp:": true,
  "gopher:": true,
  "file:": true
};
function urlParse(url, slashesDenoteHost) {
  if (url && url instanceof Url) return url;
  const u = new Url();
  u.parse(url, slashesDenoteHost);
  return u;
}
Url.prototype.parse = function(url, slashesDenoteHost) {
  let lowerProto, hec, slashes;
  let rest = url;
  rest = rest.trim();
  if (!slashesDenoteHost && url.split("#").length === 1) {
    const simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
      }
      return this;
    }
  }
  let proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    lowerProto = proto.toLowerCase();
    this.protocol = proto;
    rest = rest.substr(proto.length);
  }
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    slashes = rest.substr(0, 2) === "//";
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }
  if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
    let hostEnd = -1;
    for (let i = 0; i < hostEndingChars.length; i++) {
      hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }
    let auth, atSign;
    if (hostEnd === -1) {
      atSign = rest.lastIndexOf("@");
    } else {
      atSign = rest.lastIndexOf("@", hostEnd);
    }
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = auth;
    }
    hostEnd = -1;
    for (let i = 0; i < nonHostChars.length; i++) {
      hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }
    if (hostEnd === -1) {
      hostEnd = rest.length;
    }
    if (rest[hostEnd - 1] === ":") {
      hostEnd--;
    }
    const host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);
    this.parseHost(host);
    this.hostname = this.hostname || "";
    const ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!ipv6Hostname) {
      const hostparts = this.hostname.split(/\./);
      for (let i = 0, l = hostparts.length; i < l; i++) {
        const part = hostparts[i];
        if (!part) {
          continue;
        }
        if (!part.match(hostnamePartPattern)) {
          let newpart = "";
          for (let j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              newpart += "x";
            } else {
              newpart += part[j];
            }
          }
          if (!newpart.match(hostnamePartPattern)) {
            const validParts = hostparts.slice(0, i);
            const notHost = hostparts.slice(i + 1);
            const bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = notHost.join(".") + rest;
            }
            this.hostname = validParts.join(".");
            break;
          }
        }
      }
    }
    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = "";
    }
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
    }
  }
  const hash = rest.indexOf("#");
  if (hash !== -1) {
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  const qm = rest.indexOf("?");
  if (qm !== -1) {
    this.search = rest.substr(qm);
    rest = rest.slice(0, qm);
  }
  if (rest) {
    this.pathname = rest;
  }
  if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
    this.pathname = "";
  }
  return this;
};
Url.prototype.parseHost = function(host) {
  let port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ":") {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) {
    this.hostname = host;
  }
};
var parse_default = urlParse;

// node_modules/uc.micro/index.mjs
var uc_exports = {};
__export(uc_exports, {
  Any: () => regex_default,
  Cc: () => regex_default2,
  Cf: () => regex_default3,
  P: () => regex_default4,
  S: () => regex_default5,
  Z: () => regex_default6
});

// node_modules/uc.micro/properties/Any/regex.mjs
var regex_default = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;

// node_modules/uc.micro/categories/Cc/regex.mjs
var regex_default2 = /[\0-\x1F\x7F-\x9F]/;

// node_modules/uc.micro/categories/Cf/regex.mjs
var regex_default3 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;

// node_modules/uc.micro/categories/P/regex.mjs
var regex_default4 = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;

// node_modules/uc.micro/categories/S/regex.mjs
var regex_default5 = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/;

// node_modules/uc.micro/categories/Z/regex.mjs
var regex_default6 = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

// node_modules/markdown-it/lib/common/utils.mjs
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function isString(obj) {
  return _class(obj) === "[object String]";
}
var _hasOwnProperty = Object.prototype.hasOwnProperty;
function has(object, key) {
  return _hasOwnProperty.call(object, key);
}
function assign(obj) {
  const sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function(source) {
    if (!source) {
      return;
    }
    if (typeof source !== "object") {
      throw new TypeError(source + "must be object");
    }
    Object.keys(source).forEach(function(key) {
      obj[key] = source[key];
    });
  });
  return obj;
}
function arrayReplaceAt(src, pos, newElements) {
  return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
}
function isValidEntityCode(c) {
  if (c >= 55296 && c <= 57343) {
    return false;
  }
  if (c >= 64976 && c <= 65007) {
    return false;
  }
  if ((c & 65535) === 65535 || (c & 65535) === 65534) {
    return false;
  }
  if (c >= 0 && c <= 8) {
    return false;
  }
  if (c === 11) {
    return false;
  }
  if (c >= 14 && c <= 31) {
    return false;
  }
  if (c >= 127 && c <= 159) {
    return false;
  }
  if (c > 1114111) {
    return false;
  }
  return true;
}
function fromCodePoint(c) {
  if (c > 65535) {
    c -= 65536;
    const surrogate1 = 55296 + (c >> 10);
    const surrogate2 = 56320 + (c & 1023);
    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(c);
}
var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
var ENTITY_RE = /&([a-z#][a-z0-9]{1,31});/gi;
var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + "|" + ENTITY_RE.source, "gi");
var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function replaceEntityPattern(match2, name) {
  if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
    const code2 = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    if (isValidEntityCode(code2)) {
      return fromCodePoint(code2);
    }
    return match2;
  }
  const decoded = decodeHTML(match2);
  if (decoded !== match2) {
    return decoded;
  }
  return match2;
}
function unescapeMd(str) {
  if (str.indexOf("\\") < 0) {
    return str;
  }
  return str.replace(UNESCAPE_MD_RE, "$1");
}
function unescapeAll(str) {
  if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) {
    return str;
  }
  return str.replace(UNESCAPE_ALL_RE, function(match2, escaped, entity2) {
    if (escaped) {
      return escaped;
    }
    return replaceEntityPattern(match2, entity2);
  });
}
var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}
function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
}
var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
function escapeRE(str) {
  return str.replace(REGEXP_ESCAPE_RE, "\\$&");
}
function isSpace(code2) {
  switch (code2) {
    case 9:
    case 32:
      return true;
  }
  return false;
}
function isWhiteSpace(code2) {
  if (code2 >= 8192 && code2 <= 8202) {
    return true;
  }
  switch (code2) {
    case 9:
    // \t
    case 10:
    // \n
    case 11:
    // \v
    case 12:
    // \f
    case 13:
    // \r
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return true;
  }
  return false;
}
function isPunctChar(ch) {
  return regex_default4.test(ch) || regex_default5.test(ch);
}
function isMdAsciiPunct(ch) {
  switch (ch) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return true;
    default:
      return false;
  }
}
function normalizeReference(str) {
  str = str.trim().replace(/\s+/g, " ");
  if ("\u1E9E".toLowerCase() === "\u1E7E") {
    str = str.replace(/ẞ/g, "\xDF");
  }
  return str.toLowerCase().toUpperCase();
}
var lib = { mdurl: mdurl_exports, ucmicro: uc_exports };

// node_modules/markdown-it/lib/helpers/index.mjs
var helpers_exports = {};
__export(helpers_exports, {
  parseLinkDestination: () => parseLinkDestination,
  parseLinkLabel: () => parseLinkLabel,
  parseLinkTitle: () => parseLinkTitle
});

// node_modules/markdown-it/lib/helpers/parse_link_label.mjs
function parseLinkLabel(state, start, disableNested) {
  let level, found, marker, prevPos;
  const max = state.posMax;
  const oldPos = state.pos;
  state.pos = start + 1;
  level = 1;
  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);
    if (marker === 93) {
      level--;
      if (level === 0) {
        found = true;
        break;
      }
    }
    prevPos = state.pos;
    state.md.inline.skipToken(state);
    if (marker === 91) {
      if (prevPos === state.pos - 1) {
        level++;
      } else if (disableNested) {
        state.pos = oldPos;
        return -1;
      }
    }
  }
  let labelEnd = -1;
  if (found) {
    labelEnd = state.pos;
  }
  state.pos = oldPos;
  return labelEnd;
}

// node_modules/markdown-it/lib/helpers/parse_link_destination.mjs
function parseLinkDestination(str, start, max) {
  let code2;
  let pos = start;
  const result = {
    ok: false,
    pos: 0,
    str: ""
  };
  if (str.charCodeAt(pos) === 60) {
    pos++;
    while (pos < max) {
      code2 = str.charCodeAt(pos);
      if (code2 === 10) {
        return result;
      }
      if (code2 === 60) {
        return result;
      }
      if (code2 === 62) {
        result.pos = pos + 1;
        result.str = unescapeAll(str.slice(start + 1, pos));
        result.ok = true;
        return result;
      }
      if (code2 === 92 && pos + 1 < max) {
        pos += 2;
        continue;
      }
      pos++;
    }
    return result;
  }
  let level = 0;
  while (pos < max) {
    code2 = str.charCodeAt(pos);
    if (code2 === 32) {
      break;
    }
    if (code2 < 32 || code2 === 127) {
      break;
    }
    if (code2 === 92 && pos + 1 < max) {
      if (str.charCodeAt(pos + 1) === 32) {
        break;
      }
      pos += 2;
      continue;
    }
    if (code2 === 40) {
      level++;
      if (level > 32) {
        return result;
      }
    }
    if (code2 === 41) {
      if (level === 0) {
        break;
      }
      level--;
    }
    pos++;
  }
  if (start === pos) {
    return result;
  }
  if (level !== 0) {
    return result;
  }
  result.str = unescapeAll(str.slice(start, pos));
  result.pos = pos;
  result.ok = true;
  return result;
}

// node_modules/markdown-it/lib/helpers/parse_link_title.mjs
function parseLinkTitle(str, start, max, prev_state) {
  let code2;
  let pos = start;
  const state = {
    // if `true`, this is a valid link title
    ok: false,
    // if `true`, this link can be continued on the next line
    can_continue: false,
    // if `ok`, it's the position of the first character after the closing marker
    pos: 0,
    // if `ok`, it's the unescaped title
    str: "",
    // expected closing marker character code
    marker: 0
  };
  if (prev_state) {
    state.str = prev_state.str;
    state.marker = prev_state.marker;
  } else {
    if (pos >= max) {
      return state;
    }
    let marker = str.charCodeAt(pos);
    if (marker !== 34 && marker !== 39 && marker !== 40) {
      return state;
    }
    start++;
    pos++;
    if (marker === 40) {
      marker = 41;
    }
    state.marker = marker;
  }
  while (pos < max) {
    code2 = str.charCodeAt(pos);
    if (code2 === state.marker) {
      state.pos = pos + 1;
      state.str += unescapeAll(str.slice(start, pos));
      state.ok = true;
      return state;
    } else if (code2 === 40 && state.marker === 41) {
      return state;
    } else if (code2 === 92 && pos + 1 < max) {
      pos++;
    }
    pos++;
  }
  state.can_continue = true;
  state.str += unescapeAll(str.slice(start, pos));
  return state;
}

// node_modules/markdown-it/lib/renderer.mjs
var default_rules = {};
default_rules.code_inline = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  return "<code" + slf.renderAttrs(token) + ">" + escapeHtml(token.content) + "</code>";
};
default_rules.code_block = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  return "<pre" + slf.renderAttrs(token) + "><code>" + escapeHtml(tokens[idx].content) + "</code></pre>\n";
};
default_rules.fence = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  const info = token.info ? unescapeAll(token.info).trim() : "";
  let langName = "";
  let langAttrs = "";
  if (info) {
    const arr = info.split(/(\s+)/g);
    langName = arr[0];
    langAttrs = arr.slice(2).join("");
  }
  let highlighted;
  if (options.highlight) {
    highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }
  if (highlighted.indexOf("<pre") === 0) {
    return highlighted + "\n";
  }
  if (info) {
    const i = token.attrIndex("class");
    const tmpAttrs = token.attrs ? token.attrs.slice() : [];
    if (i < 0) {
      tmpAttrs.push(["class", options.langPrefix + langName]);
    } else {
      tmpAttrs[i] = tmpAttrs[i].slice();
      tmpAttrs[i][1] += " " + options.langPrefix + langName;
    }
    const tmpToken = {
      attrs: tmpAttrs
    };
    return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>
`;
  }
  return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>
`;
};
default_rules.image = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
  return slf.renderToken(tokens, idx, options);
};
default_rules.hardbreak = function(tokens, idx, options) {
  return options.xhtmlOut ? "<br />\n" : "<br>\n";
};
default_rules.softbreak = function(tokens, idx, options) {
  return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
};
default_rules.text = function(tokens, idx) {
  return escapeHtml(tokens[idx].content);
};
default_rules.html_block = function(tokens, idx) {
  return tokens[idx].content;
};
default_rules.html_inline = function(tokens, idx) {
  return tokens[idx].content;
};
function Renderer() {
  this.rules = assign({}, default_rules);
}
Renderer.prototype.renderAttrs = function renderAttrs(token) {
  let i, l, result;
  if (!token.attrs) {
    return "";
  }
  result = "";
  for (i = 0, l = token.attrs.length; i < l; i++) {
    result += " " + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
  }
  return result;
};
Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
  const token = tokens[idx];
  let result = "";
  if (token.hidden) {
    return "";
  }
  if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
    result += "\n";
  }
  result += (token.nesting === -1 ? "</" : "<") + token.tag;
  result += this.renderAttrs(token);
  if (token.nesting === 0 && options.xhtmlOut) {
    result += " /";
  }
  let needLf = false;
  if (token.block) {
    needLf = true;
    if (token.nesting === 1) {
      if (idx + 1 < tokens.length) {
        const nextToken = tokens[idx + 1];
        if (nextToken.type === "inline" || nextToken.hidden) {
          needLf = false;
        } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
          needLf = false;
        }
      }
    }
  }
  result += needLf ? ">\n" : ">";
  return result;
};
Renderer.prototype.renderInline = function(tokens, options, env) {
  let result = "";
  const rules = this.rules;
  for (let i = 0, len = tokens.length; i < len; i++) {
    const type = tokens[i].type;
    if (typeof rules[type] !== "undefined") {
      result += rules[type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options);
    }
  }
  return result;
};
Renderer.prototype.renderInlineAsText = function(tokens, options, env) {
  let result = "";
  for (let i = 0, len = tokens.length; i < len; i++) {
    switch (tokens[i].type) {
      case "text":
        result += tokens[i].content;
        break;
      case "image":
        result += this.renderInlineAsText(tokens[i].children, options, env);
        break;
      case "html_inline":
      case "html_block":
        result += tokens[i].content;
        break;
      case "softbreak":
      case "hardbreak":
        result += "\n";
        break;
      default:
    }
  }
  return result;
};
Renderer.prototype.render = function(tokens, options, env) {
  let result = "";
  const rules = this.rules;
  for (let i = 0, len = tokens.length; i < len; i++) {
    const type = tokens[i].type;
    if (type === "inline") {
      result += this.renderInline(tokens[i].children, options, env);
    } else if (typeof rules[type] !== "undefined") {
      result += rules[type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options, env);
    }
  }
  return result;
};
var renderer_default = Renderer;

// node_modules/markdown-it/lib/ruler.mjs
function Ruler() {
  this.__rules__ = [];
  this.__cache__ = null;
}
Ruler.prototype.__find__ = function(name) {
  for (let i = 0; i < this.__rules__.length; i++) {
    if (this.__rules__[i].name === name) {
      return i;
    }
  }
  return -1;
};
Ruler.prototype.__compile__ = function() {
  const self = this;
  const chains = [""];
  self.__rules__.forEach(function(rule) {
    if (!rule.enabled) {
      return;
    }
    rule.alt.forEach(function(altName) {
      if (chains.indexOf(altName) < 0) {
        chains.push(altName);
      }
    });
  });
  self.__cache__ = {};
  chains.forEach(function(chain) {
    self.__cache__[chain] = [];
    self.__rules__.forEach(function(rule) {
      if (!rule.enabled) {
        return;
      }
      if (chain && rule.alt.indexOf(chain) < 0) {
        return;
      }
      self.__cache__[chain].push(rule.fn);
    });
  });
};
Ruler.prototype.at = function(name, fn, options) {
  const index = this.__find__(name);
  const opt = options || {};
  if (index === -1) {
    throw new Error("Parser rule not found: " + name);
  }
  this.__rules__[index].fn = fn;
  this.__rules__[index].alt = opt.alt || [];
  this.__cache__ = null;
};
Ruler.prototype.before = function(beforeName, ruleName, fn, options) {
  const index = this.__find__(beforeName);
  const opt = options || {};
  if (index === -1) {
    throw new Error("Parser rule not found: " + beforeName);
  }
  this.__rules__.splice(index, 0, {
    name: ruleName,
    enabled: true,
    fn,
    alt: opt.alt || []
  });
  this.__cache__ = null;
};
Ruler.prototype.after = function(afterName, ruleName, fn, options) {
  const index = this.__find__(afterName);
  const opt = options || {};
  if (index === -1) {
    throw new Error("Parser rule not found: " + afterName);
  }
  this.__rules__.splice(index + 1, 0, {
    name: ruleName,
    enabled: true,
    fn,
    alt: opt.alt || []
  });
  this.__cache__ = null;
};
Ruler.prototype.push = function(ruleName, fn, options) {
  const opt = options || {};
  this.__rules__.push({
    name: ruleName,
    enabled: true,
    fn,
    alt: opt.alt || []
  });
  this.__cache__ = null;
};
Ruler.prototype.enable = function(list2, ignoreInvalid) {
  if (!Array.isArray(list2)) {
    list2 = [list2];
  }
  const result = [];
  list2.forEach(function(name) {
    const idx = this.__find__(name);
    if (idx < 0) {
      if (ignoreInvalid) {
        return;
      }
      throw new Error("Rules manager: invalid rule name " + name);
    }
    this.__rules__[idx].enabled = true;
    result.push(name);
  }, this);
  this.__cache__ = null;
  return result;
};
Ruler.prototype.enableOnly = function(list2, ignoreInvalid) {
  if (!Array.isArray(list2)) {
    list2 = [list2];
  }
  this.__rules__.forEach(function(rule) {
    rule.enabled = false;
  });
  this.enable(list2, ignoreInvalid);
};
Ruler.prototype.disable = function(list2, ignoreInvalid) {
  if (!Array.isArray(list2)) {
    list2 = [list2];
  }
  const result = [];
  list2.forEach(function(name) {
    const idx = this.__find__(name);
    if (idx < 0) {
      if (ignoreInvalid) {
        return;
      }
      throw new Error("Rules manager: invalid rule name " + name);
    }
    this.__rules__[idx].enabled = false;
    result.push(name);
  }, this);
  this.__cache__ = null;
  return result;
};
Ruler.prototype.getRules = function(chainName) {
  if (this.__cache__ === null) {
    this.__compile__();
  }
  return this.__cache__[chainName] || [];
};
var ruler_default = Ruler;

// node_modules/markdown-it/lib/token.mjs
function Token(type, tag, nesting) {
  this.type = type;
  this.tag = tag;
  this.attrs = null;
  this.map = null;
  this.nesting = nesting;
  this.level = 0;
  this.children = null;
  this.content = "";
  this.markup = "";
  this.info = "";
  this.meta = null;
  this.block = false;
  this.hidden = false;
}
Token.prototype.attrIndex = function attrIndex(name) {
  if (!this.attrs) {
    return -1;
  }
  const attrs = this.attrs;
  for (let i = 0, len = attrs.length; i < len; i++) {
    if (attrs[i][0] === name) {
      return i;
    }
  }
  return -1;
};
Token.prototype.attrPush = function attrPush(attrData) {
  if (this.attrs) {
    this.attrs.push(attrData);
  } else {
    this.attrs = [attrData];
  }
};
Token.prototype.attrSet = function attrSet(name, value) {
  const idx = this.attrIndex(name);
  const attrData = [name, value];
  if (idx < 0) {
    this.attrPush(attrData);
  } else {
    this.attrs[idx] = attrData;
  }
};
Token.prototype.attrGet = function attrGet(name) {
  const idx = this.attrIndex(name);
  let value = null;
  if (idx >= 0) {
    value = this.attrs[idx][1];
  }
  return value;
};
Token.prototype.attrJoin = function attrJoin(name, value) {
  const idx = this.attrIndex(name);
  if (idx < 0) {
    this.attrPush([name, value]);
  } else {
    this.attrs[idx][1] = this.attrs[idx][1] + " " + value;
  }
};
var token_default = Token;

// node_modules/markdown-it/lib/rules_core/state_core.mjs
function StateCore(src, md, env) {
  this.src = src;
  this.env = env;
  this.tokens = [];
  this.inlineMode = false;
  this.md = md;
}
StateCore.prototype.Token = token_default;
var state_core_default = StateCore;

// node_modules/markdown-it/lib/rules_core/normalize.mjs
var NEWLINES_RE = /\r\n?|\n/g;
var NULL_RE = /\0/g;
function normalize(state) {
  let str;
  str = state.src.replace(NEWLINES_RE, "\n");
  str = str.replace(NULL_RE, "\uFFFD");
  state.src = str;
}

// node_modules/markdown-it/lib/rules_core/block.mjs
function block(state) {
  let token;
  if (state.inlineMode) {
    token = new state.Token("inline", "", 0);
    token.content = state.src;
    token.map = [0, 1];
    token.children = [];
    state.tokens.push(token);
  } else {
    state.md.block.parse(state.src, state.md, state.env, state.tokens);
  }
}

// node_modules/markdown-it/lib/rules_core/inline.mjs
function inline(state) {
  const tokens = state.tokens;
  for (let i = 0, l = tokens.length; i < l; i++) {
    const tok = tokens[i];
    if (tok.type === "inline") {
      state.md.inline.parse(tok.content, state.md, state.env, tok.children);
    }
  }
}

// node_modules/markdown-it/lib/rules_core/linkify.mjs
function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}
function linkify(state) {
  const blockTokens = state.tokens;
  if (!state.md.options.linkify) {
    return;
  }
  for (let j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== "inline" || !state.md.linkify.pretest(blockTokens[j].content)) {
      continue;
    }
    let tokens = blockTokens[j].children;
    let htmlLinkLevel = 0;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const currentToken = tokens[i];
      if (currentToken.type === "link_close") {
        i--;
        while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") {
          i--;
        }
        continue;
      }
      if (currentToken.type === "html_inline") {
        if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
          htmlLinkLevel--;
        }
        if (isLinkClose(currentToken.content)) {
          htmlLinkLevel++;
        }
      }
      if (htmlLinkLevel > 0) {
        continue;
      }
      if (currentToken.type === "text" && state.md.linkify.test(currentToken.content)) {
        const text2 = currentToken.content;
        let links = state.md.linkify.match(text2);
        const nodes = [];
        let level = currentToken.level;
        let lastPos = 0;
        if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") {
          links = links.slice(1);
        }
        for (let ln = 0; ln < links.length; ln++) {
          const url = links[ln].url;
          const fullUrl = state.md.normalizeLink(url);
          if (!state.md.validateLink(fullUrl)) {
            continue;
          }
          let urlText = links[ln].text;
          if (!links[ln].schema) {
            urlText = state.md.normalizeLinkText("http://" + urlText).replace(/^http:\/\//, "");
          } else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) {
            urlText = state.md.normalizeLinkText("mailto:" + urlText).replace(/^mailto:/, "");
          } else {
            urlText = state.md.normalizeLinkText(urlText);
          }
          const pos = links[ln].index;
          if (pos > lastPos) {
            const token = new state.Token("text", "", 0);
            token.content = text2.slice(lastPos, pos);
            token.level = level;
            nodes.push(token);
          }
          const token_o = new state.Token("link_open", "a", 1);
          token_o.attrs = [["href", fullUrl]];
          token_o.level = level++;
          token_o.markup = "linkify";
          token_o.info = "auto";
          nodes.push(token_o);
          const token_t = new state.Token("text", "", 0);
          token_t.content = urlText;
          token_t.level = level;
          nodes.push(token_t);
          const token_c = new state.Token("link_close", "a", -1);
          token_c.level = --level;
          token_c.markup = "linkify";
          token_c.info = "auto";
          nodes.push(token_c);
          lastPos = links[ln].lastIndex;
        }
        if (lastPos < text2.length) {
          const token = new state.Token("text", "", 0);
          token.content = text2.slice(lastPos);
          token.level = level;
          nodes.push(token);
        }
        blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
      }
    }
  }
}

// node_modules/markdown-it/lib/rules_core/replacements.mjs
var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
var SCOPED_ABBR_RE = /\((c|tm|r)\)/ig;
var SCOPED_ABBR = {
  c: "\xA9",
  r: "\xAE",
  tm: "\u2122"
};
function replaceFn(match2, name) {
  return SCOPED_ABBR[name.toLowerCase()];
}
function replace_scoped(inlineTokens) {
  let inside_autolink = 0;
  for (let i = inlineTokens.length - 1; i >= 0; i--) {
    const token = inlineTokens[i];
    if (token.type === "text" && !inside_autolink) {
      token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
    }
    if (token.type === "link_open" && token.info === "auto") {
      inside_autolink--;
    }
    if (token.type === "link_close" && token.info === "auto") {
      inside_autolink++;
    }
  }
}
function replace_rare(inlineTokens) {
  let inside_autolink = 0;
  for (let i = inlineTokens.length - 1; i >= 0; i--) {
    const token = inlineTokens[i];
    if (token.type === "text" && !inside_autolink) {
      if (RARE_RE.test(token.content)) {
        token.content = token.content.replace(/\+-/g, "\xB1").replace(/\.{2,}/g, "\u2026").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1\u2014").replace(/(^|\s)--(?=\s|$)/mg, "$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1\u2013");
      }
    }
    if (token.type === "link_open" && token.info === "auto") {
      inside_autolink--;
    }
    if (token.type === "link_close" && token.info === "auto") {
      inside_autolink++;
    }
  }
}
function replace(state) {
  let blkIdx;
  if (!state.md.options.typographer) {
    return;
  }
  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== "inline") {
      continue;
    }
    if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
      replace_scoped(state.tokens[blkIdx].children);
    }
    if (RARE_RE.test(state.tokens[blkIdx].content)) {
      replace_rare(state.tokens[blkIdx].children);
    }
  }
}

// node_modules/markdown-it/lib/rules_core/smartquotes.mjs
var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = "\u2019";
function replaceAt(str, index, ch) {
  return str.slice(0, index) + ch + str.slice(index + 1);
}
function process_inlines(tokens, state) {
  let j;
  const stack = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const thisLevel = tokens[i].level;
    for (j = stack.length - 1; j >= 0; j--) {
      if (stack[j].level <= thisLevel) {
        break;
      }
    }
    stack.length = j + 1;
    if (token.type !== "text") {
      continue;
    }
    let text2 = token.content;
    let pos = 0;
    let max = text2.length;
    OUTER:
      while (pos < max) {
        QUOTE_RE.lastIndex = pos;
        const t = QUOTE_RE.exec(text2);
        if (!t) {
          break;
        }
        let canOpen = true;
        let canClose = true;
        pos = t.index + 1;
        const isSingle = t[0] === "'";
        let lastChar = 32;
        if (t.index - 1 >= 0) {
          lastChar = text2.charCodeAt(t.index - 1);
        } else {
          for (j = i - 1; j >= 0; j--) {
            if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
            if (!tokens[j].content) continue;
            lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
            break;
          }
        }
        let nextChar = 32;
        if (pos < max) {
          nextChar = text2.charCodeAt(pos);
        } else {
          for (j = i + 1; j < tokens.length; j++) {
            if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
            if (!tokens[j].content) continue;
            nextChar = tokens[j].content.charCodeAt(0);
            break;
          }
        }
        const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
        const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
        const isLastWhiteSpace = isWhiteSpace(lastChar);
        const isNextWhiteSpace = isWhiteSpace(nextChar);
        if (isNextWhiteSpace) {
          canOpen = false;
        } else if (isNextPunctChar) {
          if (!(isLastWhiteSpace || isLastPunctChar)) {
            canOpen = false;
          }
        }
        if (isLastWhiteSpace) {
          canClose = false;
        } else if (isLastPunctChar) {
          if (!(isNextWhiteSpace || isNextPunctChar)) {
            canClose = false;
          }
        }
        if (nextChar === 34 && t[0] === '"') {
          if (lastChar >= 48 && lastChar <= 57) {
            canClose = canOpen = false;
          }
        }
        if (canOpen && canClose) {
          canOpen = isLastPunctChar;
          canClose = isNextPunctChar;
        }
        if (!canOpen && !canClose) {
          if (isSingle) {
            token.content = replaceAt(token.content, t.index, APOSTROPHE);
          }
          continue;
        }
        if (canClose) {
          for (j = stack.length - 1; j >= 0; j--) {
            let item = stack[j];
            if (stack[j].level < thisLevel) {
              break;
            }
            if (item.single === isSingle && stack[j].level === thisLevel) {
              item = stack[j];
              let openQuote;
              let closeQuote;
              if (isSingle) {
                openQuote = state.md.options.quotes[2];
                closeQuote = state.md.options.quotes[3];
              } else {
                openQuote = state.md.options.quotes[0];
                closeQuote = state.md.options.quotes[1];
              }
              token.content = replaceAt(token.content, t.index, closeQuote);
              tokens[item.token].content = replaceAt(
                tokens[item.token].content,
                item.pos,
                openQuote
              );
              pos += closeQuote.length - 1;
              if (item.token === i) {
                pos += openQuote.length - 1;
              }
              text2 = token.content;
              max = text2.length;
              stack.length = j;
              continue OUTER;
            }
          }
        }
        if (canOpen) {
          stack.push({
            token: i,
            pos: t.index,
            single: isSingle,
            level: thisLevel
          });
        } else if (canClose && isSingle) {
          token.content = replaceAt(token.content, t.index, APOSTROPHE);
        }
      }
  }
}
function smartquotes(state) {
  if (!state.md.options.typographer) {
    return;
  }
  for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
      continue;
    }
    process_inlines(state.tokens[blkIdx].children, state);
  }
}

// node_modules/markdown-it/lib/rules_core/text_join.mjs
function text_join(state) {
  let curr, last;
  const blockTokens = state.tokens;
  const l = blockTokens.length;
  for (let j = 0; j < l; j++) {
    if (blockTokens[j].type !== "inline") continue;
    const tokens = blockTokens[j].children;
    const max = tokens.length;
    for (curr = 0; curr < max; curr++) {
      if (tokens[curr].type === "text_special") {
        tokens[curr].type = "text";
      }
    }
    for (curr = last = 0; curr < max; curr++) {
      if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") {
        tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
      } else {
        if (curr !== last) {
          tokens[last] = tokens[curr];
        }
        last++;
      }
    }
    if (curr !== last) {
      tokens.length = last;
    }
  }
}

// node_modules/markdown-it/lib/parser_core.mjs
var _rules = [
  ["normalize", normalize],
  ["block", block],
  ["inline", inline],
  ["linkify", linkify],
  ["replacements", replace],
  ["smartquotes", smartquotes],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", text_join]
];
function Core() {
  this.ruler = new ruler_default();
  for (let i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
}
Core.prototype.process = function(state) {
  const rules = this.ruler.getRules("");
  for (let i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};
Core.prototype.State = state_core_default;
var parser_core_default = Core;

// node_modules/markdown-it/lib/rules_block/state_block.mjs
function StateBlock(src, md, env, tokens) {
  this.src = src;
  this.md = md;
  this.env = env;
  this.tokens = tokens;
  this.bMarks = [];
  this.eMarks = [];
  this.tShift = [];
  this.sCount = [];
  this.bsCount = [];
  this.blkIndent = 0;
  this.line = 0;
  this.lineMax = 0;
  this.tight = false;
  this.ddIndent = -1;
  this.listIndent = -1;
  this.parentType = "root";
  this.level = 0;
  const s = this.src;
  for (let start = 0, pos = 0, indent2 = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
    const ch = s.charCodeAt(pos);
    if (!indent_found) {
      if (isSpace(ch)) {
        indent2++;
        if (ch === 9) {
          offset += 4 - offset % 4;
        } else {
          offset++;
        }
        continue;
      } else {
        indent_found = true;
      }
    }
    if (ch === 10 || pos === len - 1) {
      if (ch !== 10) {
        pos++;
      }
      this.bMarks.push(start);
      this.eMarks.push(pos);
      this.tShift.push(indent2);
      this.sCount.push(offset);
      this.bsCount.push(0);
      indent_found = false;
      indent2 = 0;
      offset = 0;
      start = pos + 1;
    }
  }
  this.bMarks.push(s.length);
  this.eMarks.push(s.length);
  this.tShift.push(0);
  this.sCount.push(0);
  this.bsCount.push(0);
  this.lineMax = this.bMarks.length - 1;
}
StateBlock.prototype.push = function(type, tag, nesting) {
  const token = new token_default(type, tag, nesting);
  token.block = true;
  if (nesting < 0) this.level--;
  token.level = this.level;
  if (nesting > 0) this.level++;
  this.tokens.push(token);
  return token;
};
StateBlock.prototype.isEmpty = function isEmpty(line) {
  return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
};
StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
  for (let max = this.lineMax; from < max; from++) {
    if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
      break;
    }
  }
  return from;
};
StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
  for (let max = this.src.length; pos < max; pos++) {
    const ch = this.src.charCodeAt(pos);
    if (!isSpace(ch)) {
      break;
    }
  }
  return pos;
};
StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
  if (pos <= min) {
    return pos;
  }
  while (pos > min) {
    if (!isSpace(this.src.charCodeAt(--pos))) {
      return pos + 1;
    }
  }
  return pos;
};
StateBlock.prototype.skipChars = function skipChars(pos, code2) {
  for (let max = this.src.length; pos < max; pos++) {
    if (this.src.charCodeAt(pos) !== code2) {
      break;
    }
  }
  return pos;
};
StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code2, min) {
  if (pos <= min) {
    return pos;
  }
  while (pos > min) {
    if (code2 !== this.src.charCodeAt(--pos)) {
      return pos + 1;
    }
  }
  return pos;
};
StateBlock.prototype.getLines = function getLines(begin, end, indent2, keepLastLF) {
  if (begin >= end) {
    return "";
  }
  const queue = new Array(end - begin);
  for (let i = 0, line = begin; line < end; line++, i++) {
    let lineIndent = 0;
    const lineStart = this.bMarks[line];
    let first = lineStart;
    let last;
    if (line + 1 < end || keepLastLF) {
      last = this.eMarks[line] + 1;
    } else {
      last = this.eMarks[line];
    }
    while (first < last && lineIndent < indent2) {
      const ch = this.src.charCodeAt(first);
      if (isSpace(ch)) {
        if (ch === 9) {
          lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
        } else {
          lineIndent++;
        }
      } else if (first - lineStart < this.tShift[line]) {
        lineIndent++;
      } else {
        break;
      }
      first++;
    }
    if (lineIndent > indent2) {
      queue[i] = new Array(lineIndent - indent2 + 1).join(" ") + this.src.slice(first, last);
    } else {
      queue[i] = this.src.slice(first, last);
    }
  }
  return queue.join("");
};
StateBlock.prototype.Token = token_default;
var state_block_default = StateBlock;

// node_modules/markdown-it/lib/rules_block/table.mjs
var MAX_AUTOCOMPLETED_CELLS = 65536;
function getLine(state, line) {
  const pos = state.bMarks[line] + state.tShift[line];
  const max = state.eMarks[line];
  return state.src.slice(pos, max);
}
function escapedSplit(str) {
  const result = [];
  const max = str.length;
  let pos = 0;
  let ch = str.charCodeAt(pos);
  let isEscaped = false;
  let lastPos = 0;
  let current = "";
  while (pos < max) {
    if (ch === 124) {
      if (!isEscaped) {
        result.push(current + str.substring(lastPos, pos));
        current = "";
        lastPos = pos + 1;
      } else {
        current += str.substring(lastPos, pos - 1);
        lastPos = pos;
      }
    }
    isEscaped = ch === 92;
    pos++;
    ch = str.charCodeAt(pos);
  }
  result.push(current + str.substring(lastPos));
  return result;
}
function table(state, startLine, endLine, silent) {
  if (startLine + 2 > endLine) {
    return false;
  }
  let nextLine = startLine + 1;
  if (state.sCount[nextLine] < state.blkIndent) {
    return false;
  }
  if (state.sCount[nextLine] - state.blkIndent >= 4) {
    return false;
  }
  let pos = state.bMarks[nextLine] + state.tShift[nextLine];
  if (pos >= state.eMarks[nextLine]) {
    return false;
  }
  const firstCh = state.src.charCodeAt(pos++);
  if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) {
    return false;
  }
  if (pos >= state.eMarks[nextLine]) {
    return false;
  }
  const secondCh = state.src.charCodeAt(pos++);
  if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) {
    return false;
  }
  if (firstCh === 45 && isSpace(secondCh)) {
    return false;
  }
  while (pos < state.eMarks[nextLine]) {
    const ch = state.src.charCodeAt(pos);
    if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) {
      return false;
    }
    pos++;
  }
  let lineText = getLine(state, startLine + 1);
  let columns = lineText.split("|");
  const aligns = [];
  for (let i = 0; i < columns.length; i++) {
    const t = columns[i].trim();
    if (!t) {
      if (i === 0 || i === columns.length - 1) {
        continue;
      } else {
        return false;
      }
    }
    if (!/^:?-+:?$/.test(t)) {
      return false;
    }
    if (t.charCodeAt(t.length - 1) === 58) {
      aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
    } else if (t.charCodeAt(0) === 58) {
      aligns.push("left");
    } else {
      aligns.push("");
    }
  }
  lineText = getLine(state, startLine).trim();
  if (lineText.indexOf("|") === -1) {
    return false;
  }
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  columns = escapedSplit(lineText);
  if (columns.length && columns[0] === "") columns.shift();
  if (columns.length && columns[columns.length - 1] === "") columns.pop();
  const columnCount = columns.length;
  if (columnCount === 0 || columnCount !== aligns.length) {
    return false;
  }
  if (silent) {
    return true;
  }
  const oldParentType = state.parentType;
  state.parentType = "table";
  const terminatorRules = state.md.block.ruler.getRules("blockquote");
  const token_to = state.push("table_open", "table", 1);
  const tableLines = [startLine, 0];
  token_to.map = tableLines;
  const token_tho = state.push("thead_open", "thead", 1);
  token_tho.map = [startLine, startLine + 1];
  const token_htro = state.push("tr_open", "tr", 1);
  token_htro.map = [startLine, startLine + 1];
  for (let i = 0; i < columns.length; i++) {
    const token_ho = state.push("th_open", "th", 1);
    if (aligns[i]) {
      token_ho.attrs = [["style", "text-align:" + aligns[i]]];
    }
    const token_il = state.push("inline", "", 0);
    token_il.content = columns[i].trim();
    token_il.children = [];
    state.push("th_close", "th", -1);
  }
  state.push("tr_close", "tr", -1);
  state.push("thead_close", "thead", -1);
  let tbodyLines;
  let autocompletedCells = 0;
  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) {
      break;
    }
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) {
      break;
    }
    lineText = getLine(state, nextLine).trim();
    if (!lineText) {
      break;
    }
    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      break;
    }
    columns = escapedSplit(lineText);
    if (columns.length && columns[0] === "") columns.shift();
    if (columns.length && columns[columns.length - 1] === "") columns.pop();
    autocompletedCells += columnCount - columns.length;
    if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) {
      break;
    }
    if (nextLine === startLine + 2) {
      const token_tbo = state.push("tbody_open", "tbody", 1);
      token_tbo.map = tbodyLines = [startLine + 2, 0];
    }
    const token_tro = state.push("tr_open", "tr", 1);
    token_tro.map = [nextLine, nextLine + 1];
    for (let i = 0; i < columnCount; i++) {
      const token_tdo = state.push("td_open", "td", 1);
      if (aligns[i]) {
        token_tdo.attrs = [["style", "text-align:" + aligns[i]]];
      }
      const token_il = state.push("inline", "", 0);
      token_il.content = columns[i] ? columns[i].trim() : "";
      token_il.children = [];
      state.push("td_close", "td", -1);
    }
    state.push("tr_close", "tr", -1);
  }
  if (tbodyLines) {
    state.push("tbody_close", "tbody", -1);
    tbodyLines[1] = nextLine;
  }
  state.push("table_close", "table", -1);
  tableLines[1] = nextLine;
  state.parentType = oldParentType;
  state.line = nextLine;
  return true;
}

// node_modules/markdown-it/lib/rules_block/code.mjs
function code(state, startLine, endLine) {
  if (state.sCount[startLine] - state.blkIndent < 4) {
    return false;
  }
  let nextLine = startLine + 1;
  let last = nextLine;
  while (nextLine < endLine) {
    if (state.isEmpty(nextLine)) {
      nextLine++;
      continue;
    }
    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      nextLine++;
      last = nextLine;
      continue;
    }
    break;
  }
  state.line = last;
  const token = state.push("code_block", "code", 0);
  token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + "\n";
  token.map = [startLine, state.line];
  return true;
}

// node_modules/markdown-it/lib/rules_block/fence.mjs
function fence(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  if (pos + 3 > max) {
    return false;
  }
  const marker = state.src.charCodeAt(pos);
  if (marker !== 126 && marker !== 96) {
    return false;
  }
  let mem = pos;
  pos = state.skipChars(pos, marker);
  let len = pos - mem;
  if (len < 3) {
    return false;
  }
  const markup = state.src.slice(mem, pos);
  const params = state.src.slice(pos, max);
  if (marker === 96) {
    if (params.indexOf(String.fromCharCode(marker)) >= 0) {
      return false;
    }
  }
  if (silent) {
    return true;
  }
  let nextLine = startLine;
  let haveEndMarker = false;
  for (; ; ) {
    nextLine++;
    if (nextLine >= endLine) {
      break;
    }
    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      break;
    }
    if (state.src.charCodeAt(pos) !== marker) {
      continue;
    }
    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      continue;
    }
    pos = state.skipChars(pos, marker);
    if (pos - mem < len) {
      continue;
    }
    pos = state.skipSpaces(pos);
    if (pos < max) {
      continue;
    }
    haveEndMarker = true;
    break;
  }
  len = state.sCount[startLine];
  state.line = nextLine + (haveEndMarker ? 1 : 0);
  const token = state.push("fence", "code", 0);
  token.info = params;
  token.content = state.getLines(startLine + 1, nextLine, len, true);
  token.markup = markup;
  token.map = [startLine, state.line];
  return true;
}

// node_modules/markdown-it/lib/rules_block/blockquote.mjs
function blockquote(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  const oldLineMax = state.lineMax;
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  if (state.src.charCodeAt(pos) !== 62) {
    return false;
  }
  if (silent) {
    return true;
  }
  const oldBMarks = [];
  const oldBSCount = [];
  const oldSCount = [];
  const oldTShift = [];
  const terminatorRules = state.md.block.ruler.getRules("blockquote");
  const oldParentType = state.parentType;
  state.parentType = "blockquote";
  let lastLineEmpty = false;
  let nextLine;
  for (nextLine = startLine; nextLine < endLine; nextLine++) {
    const isOutdented = state.sCount[nextLine] < state.blkIndent;
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    if (pos >= max) {
      break;
    }
    if (state.src.charCodeAt(pos++) === 62 && !isOutdented) {
      let initial = state.sCount[nextLine] + 1;
      let spaceAfterMarker;
      let adjustTab;
      if (state.src.charCodeAt(pos) === 32) {
        pos++;
        initial++;
        adjustTab = false;
        spaceAfterMarker = true;
      } else if (state.src.charCodeAt(pos) === 9) {
        spaceAfterMarker = true;
        if ((state.bsCount[nextLine] + initial) % 4 === 3) {
          pos++;
          initial++;
          adjustTab = false;
        } else {
          adjustTab = true;
        }
      } else {
        spaceAfterMarker = false;
      }
      let offset = initial;
      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;
      while (pos < max) {
        const ch = state.src.charCodeAt(pos);
        if (isSpace(ch)) {
          if (ch === 9) {
            offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
          } else {
            offset++;
          }
        } else {
          break;
        }
        pos++;
      }
      lastLineEmpty = pos >= max;
      oldBSCount.push(state.bsCount[nextLine]);
      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = offset - initial;
      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    }
    if (lastLineEmpty) {
      break;
    }
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) {
      state.lineMax = nextLine;
      if (state.blkIndent !== 0) {
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] -= state.blkIndent;
      }
      break;
    }
    oldBMarks.push(state.bMarks[nextLine]);
    oldBSCount.push(state.bsCount[nextLine]);
    oldTShift.push(state.tShift[nextLine]);
    oldSCount.push(state.sCount[nextLine]);
    state.sCount[nextLine] = -1;
  }
  const oldIndent = state.blkIndent;
  state.blkIndent = 0;
  const token_o = state.push("blockquote_open", "blockquote", 1);
  token_o.markup = ">";
  const lines = [startLine, 0];
  token_o.map = lines;
  state.md.block.tokenize(state, startLine, nextLine);
  const token_c = state.push("blockquote_close", "blockquote", -1);
  token_c.markup = ">";
  state.lineMax = oldLineMax;
  state.parentType = oldParentType;
  lines[1] = state.line;
  for (let i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
    state.sCount[i + startLine] = oldSCount[i];
    state.bsCount[i + startLine] = oldBSCount[i];
  }
  state.blkIndent = oldIndent;
  return true;
}

// node_modules/markdown-it/lib/rules_block/hr.mjs
function hr(state, startLine, endLine, silent) {
  const max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const marker = state.src.charCodeAt(pos++);
  if (marker !== 42 && marker !== 45 && marker !== 95) {
    return false;
  }
  let cnt = 1;
  while (pos < max) {
    const ch = state.src.charCodeAt(pos++);
    if (ch !== marker && !isSpace(ch)) {
      return false;
    }
    if (ch === marker) {
      cnt++;
    }
  }
  if (cnt < 3) {
    return false;
  }
  if (silent) {
    return true;
  }
  state.line = startLine + 1;
  const token = state.push("hr", "hr", 0);
  token.map = [startLine, state.line];
  token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
  return true;
}

// node_modules/markdown-it/lib/rules_block/list.mjs
function skipBulletListMarker(state, startLine) {
  const max = state.eMarks[startLine];
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const marker = state.src.charCodeAt(pos++);
  if (marker !== 42 && marker !== 45 && marker !== 43) {
    return -1;
  }
  if (pos < max) {
    const ch = state.src.charCodeAt(pos);
    if (!isSpace(ch)) {
      return -1;
    }
  }
  return pos;
}
function skipOrderedListMarker(state, startLine) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  let pos = start;
  if (pos + 1 >= max) {
    return -1;
  }
  let ch = state.src.charCodeAt(pos++);
  if (ch < 48 || ch > 57) {
    return -1;
  }
  for (; ; ) {
    if (pos >= max) {
      return -1;
    }
    ch = state.src.charCodeAt(pos++);
    if (ch >= 48 && ch <= 57) {
      if (pos - start >= 10) {
        return -1;
      }
      continue;
    }
    if (ch === 41 || ch === 46) {
      break;
    }
    return -1;
  }
  if (pos < max) {
    ch = state.src.charCodeAt(pos);
    if (!isSpace(ch)) {
      return -1;
    }
  }
  return pos;
}
function markTightParagraphs(state, idx) {
  const level = state.level + 2;
  for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
      state.tokens[i + 2].hidden = true;
      state.tokens[i].hidden = true;
      i += 2;
    }
  }
}
function list(state, startLine, endLine, silent) {
  let max, pos, start, token;
  let nextLine = startLine;
  let tight = true;
  if (state.sCount[nextLine] - state.blkIndent >= 4) {
    return false;
  }
  if (state.listIndent >= 0 && state.sCount[nextLine] - state.listIndent >= 4 && state.sCount[nextLine] < state.blkIndent) {
    return false;
  }
  let isTerminatingParagraph = false;
  if (silent && state.parentType === "paragraph") {
    if (state.sCount[nextLine] >= state.blkIndent) {
      isTerminatingParagraph = true;
    }
  }
  let isOrdered;
  let markerValue;
  let posAfterMarker;
  if ((posAfterMarker = skipOrderedListMarker(state, nextLine)) >= 0) {
    isOrdered = true;
    start = state.bMarks[nextLine] + state.tShift[nextLine];
    markerValue = Number(state.src.slice(start, posAfterMarker - 1));
    if (isTerminatingParagraph && markerValue !== 1) return false;
  } else if ((posAfterMarker = skipBulletListMarker(state, nextLine)) >= 0) {
    isOrdered = false;
  } else {
    return false;
  }
  if (isTerminatingParagraph) {
    if (state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]) return false;
  }
  if (silent) {
    return true;
  }
  const markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
  const listTokIdx = state.tokens.length;
  if (isOrdered) {
    token = state.push("ordered_list_open", "ol", 1);
    if (markerValue !== 1) {
      token.attrs = [["start", markerValue]];
    }
  } else {
    token = state.push("bullet_list_open", "ul", 1);
  }
  const listLines = [nextLine, 0];
  token.map = listLines;
  token.markup = String.fromCharCode(markerCharCode);
  let prevEmptyEnd = false;
  const terminatorRules = state.md.block.ruler.getRules("list");
  const oldParentType = state.parentType;
  state.parentType = "list";
  while (nextLine < endLine) {
    pos = posAfterMarker;
    max = state.eMarks[nextLine];
    const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine]);
    let offset = initial;
    while (pos < max) {
      const ch = state.src.charCodeAt(pos);
      if (ch === 9) {
        offset += 4 - (offset + state.bsCount[nextLine]) % 4;
      } else if (ch === 32) {
        offset++;
      } else {
        break;
      }
      pos++;
    }
    const contentStart = pos;
    let indentAfterMarker;
    if (contentStart >= max) {
      indentAfterMarker = 1;
    } else {
      indentAfterMarker = offset - initial;
    }
    if (indentAfterMarker > 4) {
      indentAfterMarker = 1;
    }
    const indent2 = initial + indentAfterMarker;
    token = state.push("list_item_open", "li", 1);
    token.markup = String.fromCharCode(markerCharCode);
    const itemLines = [nextLine, 0];
    token.map = itemLines;
    if (isOrdered) {
      token.info = state.src.slice(start, posAfterMarker - 1);
    }
    const oldTight = state.tight;
    const oldTShift = state.tShift[nextLine];
    const oldSCount = state.sCount[nextLine];
    const oldListIndent = state.listIndent;
    state.listIndent = state.blkIndent;
    state.blkIndent = indent2;
    state.tight = true;
    state.tShift[nextLine] = contentStart - state.bMarks[nextLine];
    state.sCount[nextLine] = offset;
    if (contentStart >= max && state.isEmpty(nextLine + 1)) {
      state.line = Math.min(state.line + 2, endLine);
    } else {
      state.md.block.tokenize(state, nextLine, endLine, true);
    }
    if (!state.tight || prevEmptyEnd) {
      tight = false;
    }
    prevEmptyEnd = state.line - nextLine > 1 && state.isEmpty(state.line - 1);
    state.blkIndent = state.listIndent;
    state.listIndent = oldListIndent;
    state.tShift[nextLine] = oldTShift;
    state.sCount[nextLine] = oldSCount;
    state.tight = oldTight;
    token = state.push("list_item_close", "li", -1);
    token.markup = String.fromCharCode(markerCharCode);
    nextLine = state.line;
    itemLines[1] = nextLine;
    if (nextLine >= endLine) {
      break;
    }
    if (state.sCount[nextLine] < state.blkIndent) {
      break;
    }
    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      break;
    }
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) {
      break;
    }
    if (isOrdered) {
      posAfterMarker = skipOrderedListMarker(state, nextLine);
      if (posAfterMarker < 0) {
        break;
      }
      start = state.bMarks[nextLine] + state.tShift[nextLine];
    } else {
      posAfterMarker = skipBulletListMarker(state, nextLine);
      if (posAfterMarker < 0) {
        break;
      }
    }
    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) {
      break;
    }
  }
  if (isOrdered) {
    token = state.push("ordered_list_close", "ol", -1);
  } else {
    token = state.push("bullet_list_close", "ul", -1);
  }
  token.markup = String.fromCharCode(markerCharCode);
  listLines[1] = nextLine;
  state.line = nextLine;
  state.parentType = oldParentType;
  if (tight) {
    markTightParagraphs(state, listTokIdx);
  }
  return true;
}

// node_modules/markdown-it/lib/rules_block/reference.mjs
function reference(state, startLine, _endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  let nextLine = startLine + 1;
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  if (state.src.charCodeAt(pos) !== 91) {
    return false;
  }
  function getNextLine(nextLine2) {
    const endLine = state.lineMax;
    if (nextLine2 >= endLine || state.isEmpty(nextLine2)) {
      return null;
    }
    let isContinuation = false;
    if (state.sCount[nextLine2] - state.blkIndent > 3) {
      isContinuation = true;
    }
    if (state.sCount[nextLine2] < 0) {
      isContinuation = true;
    }
    if (!isContinuation) {
      const terminatorRules = state.md.block.ruler.getRules("reference");
      const oldParentType = state.parentType;
      state.parentType = "reference";
      let terminate = false;
      for (let i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine2, endLine, true)) {
          terminate = true;
          break;
        }
      }
      state.parentType = oldParentType;
      if (terminate) {
        return null;
      }
    }
    const pos2 = state.bMarks[nextLine2] + state.tShift[nextLine2];
    const max2 = state.eMarks[nextLine2];
    return state.src.slice(pos2, max2 + 1);
  }
  let str = state.src.slice(pos, max + 1);
  max = str.length;
  let labelEnd = -1;
  for (pos = 1; pos < max; pos++) {
    const ch = str.charCodeAt(pos);
    if (ch === 91) {
      return false;
    } else if (ch === 93) {
      labelEnd = pos;
      break;
    } else if (ch === 10) {
      const lineContent = getNextLine(nextLine);
      if (lineContent !== null) {
        str += lineContent;
        max = str.length;
        nextLine++;
      }
    } else if (ch === 92) {
      pos++;
      if (pos < max && str.charCodeAt(pos) === 10) {
        const lineContent = getNextLine(nextLine);
        if (lineContent !== null) {
          str += lineContent;
          max = str.length;
          nextLine++;
        }
      }
    }
  }
  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 58) {
    return false;
  }
  for (pos = labelEnd + 2; pos < max; pos++) {
    const ch = str.charCodeAt(pos);
    if (ch === 10) {
      const lineContent = getNextLine(nextLine);
      if (lineContent !== null) {
        str += lineContent;
        max = str.length;
        nextLine++;
      }
    } else if (isSpace(ch)) {
    } else {
      break;
    }
  }
  const destRes = state.md.helpers.parseLinkDestination(str, pos, max);
  if (!destRes.ok) {
    return false;
  }
  const href = state.md.normalizeLink(destRes.str);
  if (!state.md.validateLink(href)) {
    return false;
  }
  pos = destRes.pos;
  const destEndPos = pos;
  const destEndLineNo = nextLine;
  const start = pos;
  for (; pos < max; pos++) {
    const ch = str.charCodeAt(pos);
    if (ch === 10) {
      const lineContent = getNextLine(nextLine);
      if (lineContent !== null) {
        str += lineContent;
        max = str.length;
        nextLine++;
      }
    } else if (isSpace(ch)) {
    } else {
      break;
    }
  }
  let titleRes = state.md.helpers.parseLinkTitle(str, pos, max);
  while (titleRes.can_continue) {
    const lineContent = getNextLine(nextLine);
    if (lineContent === null) break;
    str += lineContent;
    pos = max;
    max = str.length;
    nextLine++;
    titleRes = state.md.helpers.parseLinkTitle(str, pos, max, titleRes);
  }
  let title;
  if (pos < max && start !== pos && titleRes.ok) {
    title = titleRes.str;
    pos = titleRes.pos;
  } else {
    title = "";
    pos = destEndPos;
    nextLine = destEndLineNo;
  }
  while (pos < max) {
    const ch = str.charCodeAt(pos);
    if (!isSpace(ch)) {
      break;
    }
    pos++;
  }
  if (pos < max && str.charCodeAt(pos) !== 10) {
    if (title) {
      title = "";
      pos = destEndPos;
      nextLine = destEndLineNo;
      while (pos < max) {
        const ch = str.charCodeAt(pos);
        if (!isSpace(ch)) {
          break;
        }
        pos++;
      }
    }
  }
  if (pos < max && str.charCodeAt(pos) !== 10) {
    return false;
  }
  const label = normalizeReference(str.slice(1, labelEnd));
  if (!label) {
    return false;
  }
  if (silent) {
    return true;
  }
  if (typeof state.env.references === "undefined") {
    state.env.references = {};
  }
  if (typeof state.env.references[label] === "undefined") {
    state.env.references[label] = { title, href };
  }
  state.line = nextLine;
  return true;
}

// node_modules/markdown-it/lib/common/html_blocks.mjs
var html_blocks_default = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
];

// node_modules/markdown-it/lib/common/html_re.mjs
var attr_name = "[a-zA-Z_:][a-zA-Z0-9:._-]*";
var unquoted = "[^\"'=<>`\\x00-\\x20]+";
var single_quoted = "'[^']*'";
var double_quoted = '"[^"]*"';
var attr_value = "(?:" + unquoted + "|" + single_quoted + "|" + double_quoted + ")";
var attribute = "(?:\\s+" + attr_name + "(?:\\s*=\\s*" + attr_value + ")?)";
var open_tag = "<[A-Za-z][A-Za-z0-9\\-]*" + attribute + "*\\s*\\/?>";
var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
var comment = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->";
var processing = "<[?][\\s\\S]*?[?]>";
var declaration = "<![A-Za-z][^>]*>";
var cdata = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>";
var HTML_TAG_RE = new RegExp("^(?:" + open_tag + "|" + close_tag + "|" + comment + "|" + processing + "|" + declaration + "|" + cdata + ")");
var HTML_OPEN_CLOSE_TAG_RE = new RegExp("^(?:" + open_tag + "|" + close_tag + ")");

// node_modules/markdown-it/lib/rules_block/html_block.mjs
var HTML_SEQUENCES = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, true],
  [/^<!--/, /-->/, true],
  [/^<\?/, /\?>/, true],
  [/^<![A-Z]/, />/, true],
  [/^<!\[CDATA\[/, /\]\]>/, true],
  [new RegExp("^</?(" + html_blocks_default.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, true],
  [new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + "\\s*$"), /^$/, false]
];
function html_block(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  if (!state.md.options.html) {
    return false;
  }
  if (state.src.charCodeAt(pos) !== 60) {
    return false;
  }
  let lineText = state.src.slice(pos, max);
  let i = 0;
  for (; i < HTML_SEQUENCES.length; i++) {
    if (HTML_SEQUENCES[i][0].test(lineText)) {
      break;
    }
  }
  if (i === HTML_SEQUENCES.length) {
    return false;
  }
  if (silent) {
    return HTML_SEQUENCES[i][2];
  }
  let nextLine = startLine + 1;
  if (!HTML_SEQUENCES[i][1].test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) {
        break;
      }
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);
      if (HTML_SEQUENCES[i][1].test(lineText)) {
        if (lineText.length !== 0) {
          nextLine++;
        }
        break;
      }
    }
  }
  state.line = nextLine;
  const token = state.push("html_block", "", 0);
  token.map = [startLine, nextLine];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
  return true;
}

// node_modules/markdown-it/lib/rules_block/heading.mjs
function heading(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  let ch = state.src.charCodeAt(pos);
  if (ch !== 35 || pos >= max) {
    return false;
  }
  let level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 35 && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }
  if (level > 6 || pos < max && !isSpace(ch)) {
    return false;
  }
  if (silent) {
    return true;
  }
  max = state.skipSpacesBack(max, pos);
  const tmp = state.skipCharsBack(max, 35, pos);
  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
    max = tmp;
  }
  state.line = startLine + 1;
  const token_o = state.push("heading_open", "h" + String(level), 1);
  token_o.markup = "########".slice(0, level);
  token_o.map = [startLine, state.line];
  const token_i = state.push("inline", "", 0);
  token_i.content = state.src.slice(pos, max).trim();
  token_i.map = [startLine, state.line];
  token_i.children = [];
  const token_c = state.push("heading_close", "h" + String(level), -1);
  token_c.markup = "########".slice(0, level);
  return true;
}

// node_modules/markdown-it/lib/rules_block/lheading.mjs
function lheading(state, startLine, endLine) {
  const terminatorRules = state.md.block.ruler.getRules("paragraph");
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  const oldParentType = state.parentType;
  state.parentType = "paragraph";
  let level = 0;
  let marker;
  let nextLine = startLine + 1;
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    }
    if (state.sCount[nextLine] >= state.blkIndent) {
      let pos = state.bMarks[nextLine] + state.tShift[nextLine];
      const max = state.eMarks[nextLine];
      if (pos < max) {
        marker = state.src.charCodeAt(pos);
        if (marker === 45 || marker === 61) {
          pos = state.skipChars(pos, marker);
          pos = state.skipSpaces(pos);
          if (pos >= max) {
            level = marker === 61 ? 1 : 2;
            break;
          }
        }
      }
    }
    if (state.sCount[nextLine] < 0) {
      continue;
    }
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) {
      break;
    }
  }
  if (!level) {
    return false;
  }
  const content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  state.line = nextLine + 1;
  const token_o = state.push("heading_open", "h" + String(level), 1);
  token_o.markup = String.fromCharCode(marker);
  token_o.map = [startLine, state.line];
  const token_i = state.push("inline", "", 0);
  token_i.content = content;
  token_i.map = [startLine, state.line - 1];
  token_i.children = [];
  const token_c = state.push("heading_close", "h" + String(level), -1);
  token_c.markup = String.fromCharCode(marker);
  state.parentType = oldParentType;
  return true;
}

// node_modules/markdown-it/lib/rules_block/paragraph.mjs
function paragraph(state, startLine, endLine) {
  const terminatorRules = state.md.block.ruler.getRules("paragraph");
  const oldParentType = state.parentType;
  let nextLine = startLine + 1;
  state.parentType = "paragraph";
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    }
    if (state.sCount[nextLine] < 0) {
      continue;
    }
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) {
      break;
    }
  }
  const content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  state.line = nextLine;
  const token_o = state.push("paragraph_open", "p", 1);
  token_o.map = [startLine, state.line];
  const token_i = state.push("inline", "", 0);
  token_i.content = content;
  token_i.map = [startLine, state.line];
  token_i.children = [];
  state.push("paragraph_close", "p", -1);
  state.parentType = oldParentType;
  return true;
}

// node_modules/markdown-it/lib/parser_block.mjs
var _rules2 = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", table, ["paragraph", "reference"]],
  ["code", code],
  ["fence", fence, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", blockquote, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", hr, ["paragraph", "reference", "blockquote", "list"]],
  ["list", list, ["paragraph", "reference", "blockquote"]],
  ["reference", reference],
  ["html_block", html_block, ["paragraph", "reference", "blockquote"]],
  ["heading", heading, ["paragraph", "reference", "blockquote"]],
  ["lheading", lheading],
  ["paragraph", paragraph]
];
function ParserBlock() {
  this.ruler = new ruler_default();
  for (let i = 0; i < _rules2.length; i++) {
    this.ruler.push(_rules2[i][0], _rules2[i][1], { alt: (_rules2[i][2] || []).slice() });
  }
}
ParserBlock.prototype.tokenize = function(state, startLine, endLine) {
  const rules = this.ruler.getRules("");
  const len = rules.length;
  const maxNesting = state.md.options.maxNesting;
  let line = startLine;
  let hasEmptyLines = false;
  while (line < endLine) {
    state.line = line = state.skipEmptyLines(line);
    if (line >= endLine) {
      break;
    }
    if (state.sCount[line] < state.blkIndent) {
      break;
    }
    if (state.level >= maxNesting) {
      state.line = endLine;
      break;
    }
    const prevLine = state.line;
    let ok = false;
    for (let i = 0; i < len; i++) {
      ok = rules[i](state, line, endLine, false);
      if (ok) {
        if (prevLine >= state.line) {
          throw new Error("block rule didn't increment state.line");
        }
        break;
      }
    }
    if (!ok) throw new Error("none of the block rules matched");
    state.tight = !hasEmptyLines;
    if (state.isEmpty(state.line - 1)) {
      hasEmptyLines = true;
    }
    line = state.line;
    if (line < endLine && state.isEmpty(line)) {
      hasEmptyLines = true;
      line++;
      state.line = line;
    }
  }
};
ParserBlock.prototype.parse = function(src, md, env, outTokens) {
  if (!src) {
    return;
  }
  const state = new this.State(src, md, env, outTokens);
  this.tokenize(state, state.line, state.lineMax);
};
ParserBlock.prototype.State = state_block_default;
var parser_block_default = ParserBlock;

// node_modules/markdown-it/lib/rules_inline/state_inline.mjs
function StateInline(src, md, env, outTokens) {
  this.src = src;
  this.env = env;
  this.md = md;
  this.tokens = outTokens;
  this.tokens_meta = Array(outTokens.length);
  this.pos = 0;
  this.posMax = this.src.length;
  this.level = 0;
  this.pending = "";
  this.pendingLevel = 0;
  this.cache = {};
  this.delimiters = [];
  this._prev_delimiters = [];
  this.backticks = {};
  this.backticksScanned = false;
  this.linkLevel = 0;
}
StateInline.prototype.pushPending = function() {
  const token = new token_default("text", "", 0);
  token.content = this.pending;
  token.level = this.pendingLevel;
  this.tokens.push(token);
  this.pending = "";
  return token;
};
StateInline.prototype.push = function(type, tag, nesting) {
  if (this.pending) {
    this.pushPending();
  }
  const token = new token_default(type, tag, nesting);
  let token_meta = null;
  if (nesting < 0) {
    this.level--;
    this.delimiters = this._prev_delimiters.pop();
  }
  token.level = this.level;
  if (nesting > 0) {
    this.level++;
    this._prev_delimiters.push(this.delimiters);
    this.delimiters = [];
    token_meta = { delimiters: this.delimiters };
  }
  this.pendingLevel = this.level;
  this.tokens.push(token);
  this.tokens_meta.push(token_meta);
  return token;
};
StateInline.prototype.scanDelims = function(start, canSplitWord) {
  const max = this.posMax;
  const marker = this.src.charCodeAt(start);
  const lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 32;
  let pos = start;
  while (pos < max && this.src.charCodeAt(pos) === marker) {
    pos++;
  }
  const count = pos - start;
  const nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
  const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
  const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
  const isLastWhiteSpace = isWhiteSpace(lastChar);
  const isNextWhiteSpace = isWhiteSpace(nextChar);
  const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
  const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
  const can_open = left_flanking && (canSplitWord || !right_flanking || isLastPunctChar);
  const can_close = right_flanking && (canSplitWord || !left_flanking || isNextPunctChar);
  return { can_open, can_close, length: count };
};
StateInline.prototype.Token = token_default;
var state_inline_default = StateInline;

// node_modules/markdown-it/lib/rules_inline/text.mjs
function isTerminatorChar(ch) {
  switch (ch) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return true;
    default:
      return false;
  }
}
function text(state, silent) {
  let pos = state.pos;
  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
    pos++;
  }
  if (pos === state.pos) {
    return false;
  }
  if (!silent) {
    state.pending += state.src.slice(state.pos, pos);
  }
  state.pos = pos;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/linkify.mjs
var SCHEME_RE = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function linkify2(state, silent) {
  if (!state.md.options.linkify) return false;
  if (state.linkLevel > 0) return false;
  const pos = state.pos;
  const max = state.posMax;
  if (pos + 3 > max) return false;
  if (state.src.charCodeAt(pos) !== 58) return false;
  if (state.src.charCodeAt(pos + 1) !== 47) return false;
  if (state.src.charCodeAt(pos + 2) !== 47) return false;
  const match2 = state.pending.match(SCHEME_RE);
  if (!match2) return false;
  const proto = match2[1];
  const link2 = state.md.linkify.matchAtStart(state.src.slice(pos - proto.length));
  if (!link2) return false;
  let url = link2.url;
  if (url.length <= proto.length) return false;
  let urlEnd = url.length;
  while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) {
    urlEnd--;
  }
  if (urlEnd !== url.length) {
    url = url.slice(0, urlEnd);
  }
  const fullUrl = state.md.normalizeLink(url);
  if (!state.md.validateLink(fullUrl)) return false;
  if (!silent) {
    state.pending = state.pending.slice(0, -proto.length);
    const token_o = state.push("link_open", "a", 1);
    token_o.attrs = [["href", fullUrl]];
    token_o.markup = "linkify";
    token_o.info = "auto";
    const token_t = state.push("text", "", 0);
    token_t.content = state.md.normalizeLinkText(url);
    const token_c = state.push("link_close", "a", -1);
    token_c.markup = "linkify";
    token_c.info = "auto";
  }
  state.pos += url.length - proto.length;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/newline.mjs
function newline(state, silent) {
  let pos = state.pos;
  if (state.src.charCodeAt(pos) !== 10) {
    return false;
  }
  const pmax = state.pending.length - 1;
  const max = state.posMax;
  if (!silent) {
    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 32) {
      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 32) {
        let ws = pmax - 1;
        while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 32) ws--;
        state.pending = state.pending.slice(0, ws);
        state.push("hardbreak", "br", 0);
      } else {
        state.pending = state.pending.slice(0, -1);
        state.push("softbreak", "br", 0);
      }
    } else {
      state.push("softbreak", "br", 0);
    }
  }
  pos++;
  while (pos < max && isSpace(state.src.charCodeAt(pos))) {
    pos++;
  }
  state.pos = pos;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/escape.mjs
var ESCAPED = [];
for (let i = 0; i < 256; i++) {
  ESCAPED.push(0);
}
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
  ESCAPED[ch.charCodeAt(0)] = 1;
});
function escape(state, silent) {
  let pos = state.pos;
  const max = state.posMax;
  if (state.src.charCodeAt(pos) !== 92) return false;
  pos++;
  if (pos >= max) return false;
  let ch1 = state.src.charCodeAt(pos);
  if (ch1 === 10) {
    if (!silent) {
      state.push("hardbreak", "br", 0);
    }
    pos++;
    while (pos < max) {
      ch1 = state.src.charCodeAt(pos);
      if (!isSpace(ch1)) break;
      pos++;
    }
    state.pos = pos;
    return true;
  }
  let escapedStr = state.src[pos];
  if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
    const ch2 = state.src.charCodeAt(pos + 1);
    if (ch2 >= 56320 && ch2 <= 57343) {
      escapedStr += state.src[pos + 1];
      pos++;
    }
  }
  const origStr = "\\" + escapedStr;
  if (!silent) {
    const token = state.push("text_special", "", 0);
    if (ch1 < 256 && ESCAPED[ch1] !== 0) {
      token.content = escapedStr;
    } else {
      token.content = origStr;
    }
    token.markup = origStr;
    token.info = "escape";
  }
  state.pos = pos + 1;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/backticks.mjs
function backtick(state, silent) {
  let pos = state.pos;
  const ch = state.src.charCodeAt(pos);
  if (ch !== 96) {
    return false;
  }
  const start = pos;
  pos++;
  const max = state.posMax;
  while (pos < max && state.src.charCodeAt(pos) === 96) {
    pos++;
  }
  const marker = state.src.slice(start, pos);
  const openerLength = marker.length;
  if (state.backticksScanned && (state.backticks[openerLength] || 0) <= start) {
    if (!silent) state.pending += marker;
    state.pos += openerLength;
    return true;
  }
  let matchEnd = pos;
  let matchStart;
  while ((matchStart = state.src.indexOf("`", matchEnd)) !== -1) {
    matchEnd = matchStart + 1;
    while (matchEnd < max && state.src.charCodeAt(matchEnd) === 96) {
      matchEnd++;
    }
    const closerLength = matchEnd - matchStart;
    if (closerLength === openerLength) {
      if (!silent) {
        const token = state.push("code_inline", "code", 0);
        token.markup = marker;
        token.content = state.src.slice(pos, matchStart).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      state.pos = matchEnd;
      return true;
    }
    state.backticks[closerLength] = matchStart;
  }
  state.backticksScanned = true;
  if (!silent) state.pending += marker;
  state.pos += openerLength;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/strikethrough.mjs
function strikethrough_tokenize(state, silent) {
  const start = state.pos;
  const marker = state.src.charCodeAt(start);
  if (silent) {
    return false;
  }
  if (marker !== 126) {
    return false;
  }
  const scanned = state.scanDelims(state.pos, true);
  let len = scanned.length;
  const ch = String.fromCharCode(marker);
  if (len < 2) {
    return false;
  }
  let token;
  if (len % 2) {
    token = state.push("text", "", 0);
    token.content = ch;
    len--;
  }
  for (let i = 0; i < len; i += 2) {
    token = state.push("text", "", 0);
    token.content = ch + ch;
    state.delimiters.push({
      marker,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: state.tokens.length - 1,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close
    });
  }
  state.pos += scanned.length;
  return true;
}
function postProcess(state, delimiters) {
  let token;
  const loneMarkers = [];
  const max = delimiters.length;
  for (let i = 0; i < max; i++) {
    const startDelim = delimiters[i];
    if (startDelim.marker !== 126) {
      continue;
    }
    if (startDelim.end === -1) {
      continue;
    }
    const endDelim = delimiters[startDelim.end];
    token = state.tokens[startDelim.token];
    token.type = "s_open";
    token.tag = "s";
    token.nesting = 1;
    token.markup = "~~";
    token.content = "";
    token = state.tokens[endDelim.token];
    token.type = "s_close";
    token.tag = "s";
    token.nesting = -1;
    token.markup = "~~";
    token.content = "";
    if (state.tokens[endDelim.token - 1].type === "text" && state.tokens[endDelim.token - 1].content === "~") {
      loneMarkers.push(endDelim.token - 1);
    }
  }
  while (loneMarkers.length) {
    const i = loneMarkers.pop();
    let j = i + 1;
    while (j < state.tokens.length && state.tokens[j].type === "s_close") {
      j++;
    }
    j--;
    if (i !== j) {
      token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
}
function strikethrough_postProcess(state) {
  const tokens_meta = state.tokens_meta;
  const max = state.tokens_meta.length;
  postProcess(state, state.delimiters);
  for (let curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      postProcess(state, tokens_meta[curr].delimiters);
    }
  }
}
var strikethrough_default = {
  tokenize: strikethrough_tokenize,
  postProcess: strikethrough_postProcess
};

// node_modules/markdown-it/lib/rules_inline/emphasis.mjs
function emphasis_tokenize(state, silent) {
  const start = state.pos;
  const marker = state.src.charCodeAt(start);
  if (silent) {
    return false;
  }
  if (marker !== 95 && marker !== 42) {
    return false;
  }
  const scanned = state.scanDelims(state.pos, marker === 42);
  for (let i = 0; i < scanned.length; i++) {
    const token = state.push("text", "", 0);
    token.content = String.fromCharCode(marker);
    state.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker,
      // Total length of these series of delimiters.
      //
      length: scanned.length,
      // A position of the token this delimiter corresponds to.
      //
      token: state.tokens.length - 1,
      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end: -1,
      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open: scanned.can_open,
      close: scanned.can_close
    });
  }
  state.pos += scanned.length;
  return true;
}
function postProcess2(state, delimiters) {
  const max = delimiters.length;
  for (let i = max - 1; i >= 0; i--) {
    const startDelim = delimiters[i];
    if (startDelim.marker !== 95 && startDelim.marker !== 42) {
      continue;
    }
    if (startDelim.end === -1) {
      continue;
    }
    const endDelim = delimiters[startDelim.end];
    const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && // check that first two markers match and adjacent
    delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    delimiters[startDelim.end + 1].token === endDelim.token + 1;
    const ch = String.fromCharCode(startDelim.marker);
    const token_o = state.tokens[startDelim.token];
    token_o.type = isStrong ? "strong_open" : "em_open";
    token_o.tag = isStrong ? "strong" : "em";
    token_o.nesting = 1;
    token_o.markup = isStrong ? ch + ch : ch;
    token_o.content = "";
    const token_c = state.tokens[endDelim.token];
    token_c.type = isStrong ? "strong_close" : "em_close";
    token_c.tag = isStrong ? "strong" : "em";
    token_c.nesting = -1;
    token_c.markup = isStrong ? ch + ch : ch;
    token_c.content = "";
    if (isStrong) {
      state.tokens[delimiters[i - 1].token].content = "";
      state.tokens[delimiters[startDelim.end + 1].token].content = "";
      i--;
    }
  }
}
function emphasis_post_process(state) {
  const tokens_meta = state.tokens_meta;
  const max = state.tokens_meta.length;
  postProcess2(state, state.delimiters);
  for (let curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      postProcess2(state, tokens_meta[curr].delimiters);
    }
  }
}
var emphasis_default = {
  tokenize: emphasis_tokenize,
  postProcess: emphasis_post_process
};

// node_modules/markdown-it/lib/rules_inline/link.mjs
function link(state, silent) {
  let code2, label, res, ref;
  let href = "";
  let title = "";
  let start = state.pos;
  let parseReference = true;
  if (state.src.charCodeAt(state.pos) !== 91) {
    return false;
  }
  const oldPos = state.pos;
  const max = state.posMax;
  const labelStart = state.pos + 1;
  const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
  if (labelEnd < 0) {
    return false;
  }
  let pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 40) {
    parseReference = false;
    pos++;
    for (; pos < max; pos++) {
      code2 = state.src.charCodeAt(pos);
      if (!isSpace(code2) && code2 !== 10) {
        break;
      }
    }
    if (pos >= max) {
      return false;
    }
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = "";
      }
      start = pos;
      for (; pos < max; pos++) {
        code2 = state.src.charCodeAt(pos);
        if (!isSpace(code2) && code2 !== 10) {
          break;
        }
      }
      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos;
        for (; pos < max; pos++) {
          code2 = state.src.charCodeAt(pos);
          if (!isSpace(code2) && code2 !== 10) {
            break;
          }
        }
      }
    }
    if (pos >= max || state.src.charCodeAt(pos) !== 41) {
      parseReference = true;
    }
    pos++;
  }
  if (parseReference) {
    if (typeof state.env.references === "undefined") {
      return false;
    }
    if (pos < max && state.src.charCodeAt(pos) === 91) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }
    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }
    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }
  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;
    const token_o = state.push("link_open", "a", 1);
    const attrs = [["href", href]];
    token_o.attrs = attrs;
    if (title) {
      attrs.push(["title", title]);
    }
    state.linkLevel++;
    state.md.inline.tokenize(state);
    state.linkLevel--;
    state.push("link_close", "a", -1);
  }
  state.pos = pos;
  state.posMax = max;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/image.mjs
function image(state, silent) {
  let code2, content, label, pos, ref, res, title, start;
  let href = "";
  const oldPos = state.pos;
  const max = state.posMax;
  if (state.src.charCodeAt(state.pos) !== 33) {
    return false;
  }
  if (state.src.charCodeAt(state.pos + 1) !== 91) {
    return false;
  }
  const labelStart = state.pos + 2;
  const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
  if (labelEnd < 0) {
    return false;
  }
  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 40) {
    pos++;
    for (; pos < max; pos++) {
      code2 = state.src.charCodeAt(pos);
      if (!isSpace(code2) && code2 !== 10) {
        break;
      }
    }
    if (pos >= max) {
      return false;
    }
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = "";
      }
    }
    start = pos;
    for (; pos < max; pos++) {
      code2 = state.src.charCodeAt(pos);
      if (!isSpace(code2) && code2 !== 10) {
        break;
      }
    }
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;
      for (; pos < max; pos++) {
        code2 = state.src.charCodeAt(pos);
        if (!isSpace(code2) && code2 !== 10) {
          break;
        }
      }
    } else {
      title = "";
    }
    if (pos >= max || state.src.charCodeAt(pos) !== 41) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  } else {
    if (typeof state.env.references === "undefined") {
      return false;
    }
    if (pos < max && state.src.charCodeAt(pos) === 91) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }
    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }
    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }
  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);
    const tokens = [];
    state.md.inline.parse(
      content,
      state.md,
      state.env,
      tokens
    );
    const token = state.push("image", "img", 0);
    const attrs = [["src", href], ["alt", ""]];
    token.attrs = attrs;
    token.children = tokens;
    token.content = content;
    if (title) {
      attrs.push(["title", title]);
    }
  }
  state.pos = pos;
  state.posMax = max;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/autolink.mjs
var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function autolink(state, silent) {
  let pos = state.pos;
  if (state.src.charCodeAt(pos) !== 60) {
    return false;
  }
  const start = state.pos;
  const max = state.posMax;
  for (; ; ) {
    if (++pos >= max) return false;
    const ch = state.src.charCodeAt(pos);
    if (ch === 60) return false;
    if (ch === 62) break;
  }
  const url = state.src.slice(start + 1, pos);
  if (AUTOLINK_RE.test(url)) {
    const fullUrl = state.md.normalizeLink(url);
    if (!state.md.validateLink(fullUrl)) {
      return false;
    }
    if (!silent) {
      const token_o = state.push("link_open", "a", 1);
      token_o.attrs = [["href", fullUrl]];
      token_o.markup = "autolink";
      token_o.info = "auto";
      const token_t = state.push("text", "", 0);
      token_t.content = state.md.normalizeLinkText(url);
      const token_c = state.push("link_close", "a", -1);
      token_c.markup = "autolink";
      token_c.info = "auto";
    }
    state.pos += url.length + 2;
    return true;
  }
  if (EMAIL_RE.test(url)) {
    const fullUrl = state.md.normalizeLink("mailto:" + url);
    if (!state.md.validateLink(fullUrl)) {
      return false;
    }
    if (!silent) {
      const token_o = state.push("link_open", "a", 1);
      token_o.attrs = [["href", fullUrl]];
      token_o.markup = "autolink";
      token_o.info = "auto";
      const token_t = state.push("text", "", 0);
      token_t.content = state.md.normalizeLinkText(url);
      const token_c = state.push("link_close", "a", -1);
      token_c.markup = "autolink";
      token_c.info = "auto";
    }
    state.pos += url.length + 2;
    return true;
  }
  return false;
}

// node_modules/markdown-it/lib/rules_inline/html_inline.mjs
function isLinkOpen2(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose2(str) {
  return /^<\/a\s*>/i.test(str);
}
function isLetter(ch) {
  const lc = ch | 32;
  return lc >= 97 && lc <= 122;
}
function html_inline(state, silent) {
  if (!state.md.options.html) {
    return false;
  }
  const max = state.posMax;
  const pos = state.pos;
  if (state.src.charCodeAt(pos) !== 60 || pos + 2 >= max) {
    return false;
  }
  const ch = state.src.charCodeAt(pos + 1);
  if (ch !== 33 && ch !== 63 && ch !== 47 && !isLetter(ch)) {
    return false;
  }
  const match2 = state.src.slice(pos).match(HTML_TAG_RE);
  if (!match2) {
    return false;
  }
  if (!silent) {
    const token = state.push("html_inline", "", 0);
    token.content = match2[0];
    if (isLinkOpen2(token.content)) state.linkLevel++;
    if (isLinkClose2(token.content)) state.linkLevel--;
  }
  state.pos += match2[0].length;
  return true;
}

// node_modules/markdown-it/lib/rules_inline/entity.mjs
var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
function entity(state, silent) {
  const pos = state.pos;
  const max = state.posMax;
  if (state.src.charCodeAt(pos) !== 38) return false;
  if (pos + 1 >= max) return false;
  const ch = state.src.charCodeAt(pos + 1);
  if (ch === 35) {
    const match2 = state.src.slice(pos).match(DIGITAL_RE);
    if (match2) {
      if (!silent) {
        const code2 = match2[1][0].toLowerCase() === "x" ? parseInt(match2[1].slice(1), 16) : parseInt(match2[1], 10);
        const token = state.push("text_special", "", 0);
        token.content = isValidEntityCode(code2) ? fromCodePoint(code2) : fromCodePoint(65533);
        token.markup = match2[0];
        token.info = "entity";
      }
      state.pos += match2[0].length;
      return true;
    }
  } else {
    const match2 = state.src.slice(pos).match(NAMED_RE);
    if (match2) {
      const decoded = decodeHTML(match2[0]);
      if (decoded !== match2[0]) {
        if (!silent) {
          const token = state.push("text_special", "", 0);
          token.content = decoded;
          token.markup = match2[0];
          token.info = "entity";
        }
        state.pos += match2[0].length;
        return true;
      }
    }
  }
  return false;
}

// node_modules/markdown-it/lib/rules_inline/balance_pairs.mjs
function processDelimiters(delimiters) {
  const openersBottom = {};
  const max = delimiters.length;
  if (!max) return;
  let headerIdx = 0;
  let lastTokenIdx = -2;
  const jumps = [];
  for (let closerIdx = 0; closerIdx < max; closerIdx++) {
    const closer = delimiters[closerIdx];
    jumps.push(0);
    if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) {
      headerIdx = closerIdx;
    }
    lastTokenIdx = closer.token;
    closer.length = closer.length || 0;
    if (!closer.close) continue;
    if (!openersBottom.hasOwnProperty(closer.marker)) {
      openersBottom[closer.marker] = [-1, -1, -1, -1, -1, -1];
    }
    const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
    let openerIdx = headerIdx - jumps[headerIdx] - 1;
    let newMinOpenerIdx = openerIdx;
    for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
      const opener = delimiters[openerIdx];
      if (opener.marker !== closer.marker) continue;
      if (opener.open && opener.end < 0) {
        let isOddMatch = false;
        if (opener.close || closer.open) {
          if ((opener.length + closer.length) % 3 === 0) {
            if (opener.length % 3 !== 0 || closer.length % 3 !== 0) {
              isOddMatch = true;
            }
          }
        }
        if (!isOddMatch) {
          const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
          jumps[closerIdx] = closerIdx - openerIdx + lastJump;
          jumps[openerIdx] = lastJump;
          closer.open = false;
          opener.end = closerIdx;
          opener.close = false;
          newMinOpenerIdx = -1;
          lastTokenIdx = -2;
          break;
        }
      }
    }
    if (newMinOpenerIdx !== -1) {
      openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
    }
  }
}
function link_pairs(state) {
  const tokens_meta = state.tokens_meta;
  const max = state.tokens_meta.length;
  processDelimiters(state.delimiters);
  for (let curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      processDelimiters(tokens_meta[curr].delimiters);
    }
  }
}

// node_modules/markdown-it/lib/rules_inline/fragments_join.mjs
function fragments_join(state) {
  let curr, last;
  let level = 0;
  const tokens = state.tokens;
  const max = state.tokens.length;
  for (curr = last = 0; curr < max; curr++) {
    if (tokens[curr].nesting < 0) level--;
    tokens[curr].level = level;
    if (tokens[curr].nesting > 0) level++;
    if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") {
      tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
    } else {
      if (curr !== last) {
        tokens[last] = tokens[curr];
      }
      last++;
    }
  }
  if (curr !== last) {
    tokens.length = last;
  }
}

// node_modules/markdown-it/lib/parser_inline.mjs
var _rules3 = [
  ["text", text],
  ["linkify", linkify2],
  ["newline", newline],
  ["escape", escape],
  ["backticks", backtick],
  ["strikethrough", strikethrough_default.tokenize],
  ["emphasis", emphasis_default.tokenize],
  ["link", link],
  ["image", image],
  ["autolink", autolink],
  ["html_inline", html_inline],
  ["entity", entity]
];
var _rules22 = [
  ["balance_pairs", link_pairs],
  ["strikethrough", strikethrough_default.postProcess],
  ["emphasis", emphasis_default.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", fragments_join]
];
function ParserInline() {
  this.ruler = new ruler_default();
  for (let i = 0; i < _rules3.length; i++) {
    this.ruler.push(_rules3[i][0], _rules3[i][1]);
  }
  this.ruler2 = new ruler_default();
  for (let i = 0; i < _rules22.length; i++) {
    this.ruler2.push(_rules22[i][0], _rules22[i][1]);
  }
}
ParserInline.prototype.skipToken = function(state) {
  const pos = state.pos;
  const rules = this.ruler.getRules("");
  const len = rules.length;
  const maxNesting = state.md.options.maxNesting;
  const cache = state.cache;
  if (typeof cache[pos] !== "undefined") {
    state.pos = cache[pos];
    return;
  }
  let ok = false;
  if (state.level < maxNesting) {
    for (let i = 0; i < len; i++) {
      state.level++;
      ok = rules[i](state, true);
      state.level--;
      if (ok) {
        if (pos >= state.pos) {
          throw new Error("inline rule didn't increment state.pos");
        }
        break;
      }
    }
  } else {
    state.pos = state.posMax;
  }
  if (!ok) {
    state.pos++;
  }
  cache[pos] = state.pos;
};
ParserInline.prototype.tokenize = function(state) {
  const rules = this.ruler.getRules("");
  const len = rules.length;
  const end = state.posMax;
  const maxNesting = state.md.options.maxNesting;
  while (state.pos < end) {
    const prevPos = state.pos;
    let ok = false;
    if (state.level < maxNesting) {
      for (let i = 0; i < len; i++) {
        ok = rules[i](state, false);
        if (ok) {
          if (prevPos >= state.pos) {
            throw new Error("inline rule didn't increment state.pos");
          }
          break;
        }
      }
    }
    if (ok) {
      if (state.pos >= end) {
        break;
      }
      continue;
    }
    state.pending += state.src[state.pos++];
  }
  if (state.pending) {
    state.pushPending();
  }
};
ParserInline.prototype.parse = function(str, md, env, outTokens) {
  const state = new this.State(str, md, env, outTokens);
  this.tokenize(state);
  const rules = this.ruler2.getRules("");
  const len = rules.length;
  for (let i = 0; i < len; i++) {
    rules[i](state);
  }
};
ParserInline.prototype.State = state_inline_default;
var parser_inline_default = ParserInline;

// node_modules/linkify-it/lib/re.mjs
function re_default(opts) {
  const re = {};
  opts = opts || {};
  re.src_Any = regex_default.source;
  re.src_Cc = regex_default2.source;
  re.src_Z = regex_default6.source;
  re.src_P = regex_default4.source;
  re.src_ZPCc = [re.src_Z, re.src_P, re.src_Cc].join("|");
  re.src_ZCc = [re.src_Z, re.src_Cc].join("|");
  const text_separators = "[><\uFF5C]";
  re.src_pseudo_letter = "(?:(?!" + text_separators + "|" + re.src_ZPCc + ")" + re.src_Any + ")";
  re.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
  re.src_auth = "(?:(?:(?!" + re.src_ZCc + "|[@/\\[\\]()]).)+@)?";
  re.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?";
  re.src_host_terminator = "(?=$|" + text_separators + "|" + re.src_ZPCc + ")(?!" + (opts["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + re.src_ZPCc + "))";
  re.src_path = "(?:[/?#](?:(?!" + re.src_ZCc + "|" + text_separators + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + re.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + re.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + re.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + re.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + re.src_ZCc + "|[']).)+\\'|\\'(?=" + re.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + re.src_ZCc + "|[.]|$)|" + (opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  ",(?!" + re.src_ZCc + "|$)|;(?!" + re.src_ZCc + "|$)|\\!+(?!" + re.src_ZCc + "|[!]|$)|\\?(?!" + re.src_ZCc + "|[?]|$))+|\\/)?";
  re.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*';
  re.src_xn = "xn--[a-z0-9\\-]{1,59}";
  re.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + re.src_xn + "|" + re.src_pseudo_letter + "{1,63})";
  re.src_domain = "(?:" + re.src_xn + "|(?:" + re.src_pseudo_letter + ")|(?:" + re.src_pseudo_letter + "(?:-|" + re.src_pseudo_letter + "){0,61}" + re.src_pseudo_letter + "))";
  re.src_host = "(?:(?:(?:(?:" + re.src_domain + ")\\.)*" + re.src_domain + "))";
  re.tpl_host_fuzzy = "(?:" + re.src_ip4 + "|(?:(?:(?:" + re.src_domain + ")\\.)+(?:%TLDS%)))";
  re.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + re.src_domain + ")\\.)+(?:%TLDS%))";
  re.src_host_strict = re.src_host + re.src_host_terminator;
  re.tpl_host_fuzzy_strict = re.tpl_host_fuzzy + re.src_host_terminator;
  re.src_host_port_strict = re.src_host + re.src_port + re.src_host_terminator;
  re.tpl_host_port_fuzzy_strict = re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;
  re.tpl_host_port_no_ip_fuzzy_strict = re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;
  re.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + re.src_ZPCc + "|>|$))";
  re.tpl_email_fuzzy = "(^|" + text_separators + '|"|\\(|' + re.src_ZCc + ")(" + re.src_email_name + "@" + re.tpl_host_fuzzy_strict + ")";
  re.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|\uFF5C]|" + re.src_ZPCc + "))((?![$+<=>^`|\uFF5C])" + re.tpl_host_port_fuzzy_strict + re.src_path + ")";
  re.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|\uFF5C]|" + re.src_ZPCc + "))((?![$+<=>^`|\uFF5C])" + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ")";
  return re;
}

// node_modules/linkify-it/index.mjs
function assign2(obj) {
  const sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function(source) {
    if (!source) {
      return;
    }
    Object.keys(source).forEach(function(key) {
      obj[key] = source[key];
    });
  });
  return obj;
}
function _class2(obj) {
  return Object.prototype.toString.call(obj);
}
function isString2(obj) {
  return _class2(obj) === "[object String]";
}
function isObject(obj) {
  return _class2(obj) === "[object Object]";
}
function isRegExp(obj) {
  return _class2(obj) === "[object RegExp]";
}
function isFunction(obj) {
  return _class2(obj) === "[object Function]";
}
function escapeRE2(str) {
  return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
var defaultOptions = {
  fuzzyLink: true,
  fuzzyEmail: true,
  fuzzyIP: false
};
function isOptionsObj(obj) {
  return Object.keys(obj || {}).reduce(function(acc, k) {
    return acc || defaultOptions.hasOwnProperty(k);
  }, false);
}
var defaultSchemas = {
  "http:": {
    validate: function(text2, pos, self) {
      const tail = text2.slice(pos);
      if (!self.re.http) {
        self.re.http = new RegExp(
          "^\\/\\/" + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path,
          "i"
        );
      }
      if (self.re.http.test(tail)) {
        return tail.match(self.re.http)[0].length;
      }
      return 0;
    }
  },
  "https:": "http:",
  "ftp:": "http:",
  "//": {
    validate: function(text2, pos, self) {
      const tail = text2.slice(pos);
      if (!self.re.no_http) {
        self.re.no_http = new RegExp(
          "^" + self.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
          // with code comments
          "(?:localhost|(?:(?:" + self.re.src_domain + ")\\.)+" + self.re.src_domain_root + ")" + self.re.src_port + self.re.src_host_terminator + self.re.src_path,
          "i"
        );
      }
      if (self.re.no_http.test(tail)) {
        if (pos >= 3 && text2[pos - 3] === ":") {
          return 0;
        }
        if (pos >= 3 && text2[pos - 3] === "/") {
          return 0;
        }
        return tail.match(self.re.no_http)[0].length;
      }
      return 0;
    }
  },
  "mailto:": {
    validate: function(text2, pos, self) {
      const tail = text2.slice(pos);
      if (!self.re.mailto) {
        self.re.mailto = new RegExp(
          "^" + self.re.src_email_name + "@" + self.re.src_host_strict,
          "i"
        );
      }
      if (self.re.mailto.test(tail)) {
        return tail.match(self.re.mailto)[0].length;
      }
      return 0;
    }
  }
};
var tlds_2ch_src_re = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]";
var tlds_default = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444".split("|");
function resetScanCache(self) {
  self.__index__ = -1;
  self.__text_cache__ = "";
}
function createValidator(re) {
  return function(text2, pos) {
    const tail = text2.slice(pos);
    if (re.test(tail)) {
      return tail.match(re)[0].length;
    }
    return 0;
  };
}
function createNormalizer() {
  return function(match2, self) {
    self.normalize(match2);
  };
}
function compile(self) {
  const re = self.re = re_default(self.__opts__);
  const tlds2 = self.__tlds__.slice();
  self.onCompile();
  if (!self.__tlds_replaced__) {
    tlds2.push(tlds_2ch_src_re);
  }
  tlds2.push(re.src_xn);
  re.src_tlds = tlds2.join("|");
  function untpl(tpl) {
    return tpl.replace("%TLDS%", re.src_tlds);
  }
  re.email_fuzzy = RegExp(untpl(re.tpl_email_fuzzy), "i");
  re.link_fuzzy = RegExp(untpl(re.tpl_link_fuzzy), "i");
  re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), "i");
  re.host_fuzzy_test = RegExp(untpl(re.tpl_host_fuzzy_test), "i");
  const aliases = [];
  self.__compiled__ = {};
  function schemaError(name, val) {
    throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
  }
  Object.keys(self.__schemas__).forEach(function(name) {
    const val = self.__schemas__[name];
    if (val === null) {
      return;
    }
    const compiled = { validate: null, link: null };
    self.__compiled__[name] = compiled;
    if (isObject(val)) {
      if (isRegExp(val.validate)) {
        compiled.validate = createValidator(val.validate);
      } else if (isFunction(val.validate)) {
        compiled.validate = val.validate;
      } else {
        schemaError(name, val);
      }
      if (isFunction(val.normalize)) {
        compiled.normalize = val.normalize;
      } else if (!val.normalize) {
        compiled.normalize = createNormalizer();
      } else {
        schemaError(name, val);
      }
      return;
    }
    if (isString2(val)) {
      aliases.push(name);
      return;
    }
    schemaError(name, val);
  });
  aliases.forEach(function(alias) {
    if (!self.__compiled__[self.__schemas__[alias]]) {
      return;
    }
    self.__compiled__[alias].validate = self.__compiled__[self.__schemas__[alias]].validate;
    self.__compiled__[alias].normalize = self.__compiled__[self.__schemas__[alias]].normalize;
  });
  self.__compiled__[""] = { validate: null, normalize: createNormalizer() };
  const slist = Object.keys(self.__compiled__).filter(function(name) {
    return name.length > 0 && self.__compiled__[name];
  }).map(escapeRE2).join("|");
  self.re.schema_test = RegExp("(^|(?!_)(?:[><\uFF5C]|" + re.src_ZPCc + "))(" + slist + ")", "i");
  self.re.schema_search = RegExp("(^|(?!_)(?:[><\uFF5C]|" + re.src_ZPCc + "))(" + slist + ")", "ig");
  self.re.schema_at_start = RegExp("^" + self.re.schema_search.source, "i");
  self.re.pretest = RegExp(
    "(" + self.re.schema_test.source + ")|(" + self.re.host_fuzzy_test.source + ")|@",
    "i"
  );
  resetScanCache(self);
}
function Match(self, shift) {
  const start = self.__index__;
  const end = self.__last_index__;
  const text2 = self.__text_cache__.slice(start, end);
  this.schema = self.__schema__.toLowerCase();
  this.index = start + shift;
  this.lastIndex = end + shift;
  this.raw = text2;
  this.text = text2;
  this.url = text2;
}
function createMatch(self, shift) {
  const match2 = new Match(self, shift);
  self.__compiled__[match2.schema].normalize(match2, self);
  return match2;
}
function LinkifyIt(schemas, options) {
  if (!(this instanceof LinkifyIt)) {
    return new LinkifyIt(schemas, options);
  }
  if (!options) {
    if (isOptionsObj(schemas)) {
      options = schemas;
      schemas = {};
    }
  }
  this.__opts__ = assign2({}, defaultOptions, options);
  this.__index__ = -1;
  this.__last_index__ = -1;
  this.__schema__ = "";
  this.__text_cache__ = "";
  this.__schemas__ = assign2({}, defaultSchemas, schemas);
  this.__compiled__ = {};
  this.__tlds__ = tlds_default;
  this.__tlds_replaced__ = false;
  this.re = {};
  compile(this);
}
LinkifyIt.prototype.add = function add(schema, definition) {
  this.__schemas__[schema] = definition;
  compile(this);
  return this;
};
LinkifyIt.prototype.set = function set(options) {
  this.__opts__ = assign2(this.__opts__, options);
  return this;
};
LinkifyIt.prototype.test = function test(text2) {
  this.__text_cache__ = text2;
  this.__index__ = -1;
  if (!text2.length) {
    return false;
  }
  let m, ml, me, len, shift, next, re, tld_pos, at_pos;
  if (this.re.schema_test.test(text2)) {
    re = this.re.schema_search;
    re.lastIndex = 0;
    while ((m = re.exec(text2)) !== null) {
      len = this.testSchemaAt(text2, m[2], re.lastIndex);
      if (len) {
        this.__schema__ = m[2];
        this.__index__ = m.index + m[1].length;
        this.__last_index__ = m.index + m[0].length + len;
        break;
      }
    }
  }
  if (this.__opts__.fuzzyLink && this.__compiled__["http:"]) {
    tld_pos = text2.search(this.re.host_fuzzy_test);
    if (tld_pos >= 0) {
      if (this.__index__ < 0 || tld_pos < this.__index__) {
        if ((ml = text2.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {
          shift = ml.index + ml[1].length;
          if (this.__index__ < 0 || shift < this.__index__) {
            this.__schema__ = "";
            this.__index__ = shift;
            this.__last_index__ = ml.index + ml[0].length;
          }
        }
      }
    }
  }
  if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"]) {
    at_pos = text2.indexOf("@");
    if (at_pos >= 0) {
      if ((me = text2.match(this.re.email_fuzzy)) !== null) {
        shift = me.index + me[1].length;
        next = me.index + me[0].length;
        if (this.__index__ < 0 || shift < this.__index__ || shift === this.__index__ && next > this.__last_index__) {
          this.__schema__ = "mailto:";
          this.__index__ = shift;
          this.__last_index__ = next;
        }
      }
    }
  }
  return this.__index__ >= 0;
};
LinkifyIt.prototype.pretest = function pretest(text2) {
  return this.re.pretest.test(text2);
};
LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text2, schema, pos) {
  if (!this.__compiled__[schema.toLowerCase()]) {
    return 0;
  }
  return this.__compiled__[schema.toLowerCase()].validate(text2, pos, this);
};
LinkifyIt.prototype.match = function match(text2) {
  const result = [];
  let shift = 0;
  if (this.__index__ >= 0 && this.__text_cache__ === text2) {
    result.push(createMatch(this, shift));
    shift = this.__last_index__;
  }
  let tail = shift ? text2.slice(shift) : text2;
  while (this.test(tail)) {
    result.push(createMatch(this, shift));
    tail = tail.slice(this.__last_index__);
    shift += this.__last_index__;
  }
  if (result.length) {
    return result;
  }
  return null;
};
LinkifyIt.prototype.matchAtStart = function matchAtStart(text2) {
  this.__text_cache__ = text2;
  this.__index__ = -1;
  if (!text2.length) return null;
  const m = this.re.schema_at_start.exec(text2);
  if (!m) return null;
  const len = this.testSchemaAt(text2, m[2], m[0].length);
  if (!len) return null;
  this.__schema__ = m[2];
  this.__index__ = m.index + m[1].length;
  this.__last_index__ = m.index + m[0].length + len;
  return createMatch(this, 0);
};
LinkifyIt.prototype.tlds = function tlds(list2, keepOld) {
  list2 = Array.isArray(list2) ? list2 : [list2];
  if (!keepOld) {
    this.__tlds__ = list2.slice();
    this.__tlds_replaced__ = true;
    compile(this);
    return this;
  }
  this.__tlds__ = this.__tlds__.concat(list2).sort().filter(function(el, idx, arr) {
    return el !== arr[idx - 1];
  }).reverse();
  compile(this);
  return this;
};
LinkifyIt.prototype.normalize = function normalize2(match2) {
  if (!match2.schema) {
    match2.url = "http://" + match2.url;
  }
  if (match2.schema === "mailto:" && !/^mailto:/i.test(match2.url)) {
    match2.url = "mailto:" + match2.url;
  }
};
LinkifyIt.prototype.onCompile = function onCompile() {
};
var linkify_it_default = LinkifyIt;

// node_modules/markdown-it/lib/index.mjs
var import_punycode = __toESM(require_punycode(), 1);

// node_modules/markdown-it/lib/presets/default.mjs
var default_default = {
  options: {
    // Enable HTML tags in source
    html: false,
    // Use '/' to close single tags (<br />)
    xhtmlOut: false,
    // Convert '\n' in paragraphs into <br>
    breaks: false,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: false,
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "\u201C\u201D\u2018\u2019",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 100
  },
  components: {
    core: {},
    block: {},
    inline: {}
  }
};

// node_modules/markdown-it/lib/presets/zero.mjs
var zero_default = {
  options: {
    // Enable HTML tags in source
    html: false,
    // Use '/' to close single tags (<br />)
    xhtmlOut: false,
    // Convert '\n' in paragraphs into <br>
    breaks: false,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: false,
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "\u201C\u201D\u2018\u2019",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "text"
      ],
      rules2: [
        "balance_pairs",
        "fragments_join"
      ]
    }
  }
};

// node_modules/markdown-it/lib/presets/commonmark.mjs
var commonmark_default = {
  options: {
    // Enable HTML tags in source
    html: true,
    // Use '/' to close single tags (<br />)
    xhtmlOut: true,
    // Convert '\n' in paragraphs into <br>
    breaks: false,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: false,
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "\u201C\u201D\u2018\u2019",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "blockquote",
        "code",
        "fence",
        "heading",
        "hr",
        "html_block",
        "lheading",
        "list",
        "reference",
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "autolink",
        "backticks",
        "emphasis",
        "entity",
        "escape",
        "html_inline",
        "image",
        "link",
        "newline",
        "text"
      ],
      rules2: [
        "balance_pairs",
        "emphasis",
        "fragments_join"
      ]
    }
  }
};

// node_modules/markdown-it/lib/index.mjs
var config = {
  default: default_default,
  zero: zero_default,
  commonmark: commonmark_default
};
var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
function validateLink(url) {
  const str = url.trim().toLowerCase();
  return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
}
var RECODE_HOSTNAME_FOR = ["http:", "https:", "mailto:"];
function normalizeLink(url) {
  const parsed = parse_default(url, true);
  if (parsed.hostname) {
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = import_punycode.default.toASCII(parsed.hostname);
      } catch (er) {
      }
    }
  }
  return encode_default(format(parsed));
}
function normalizeLinkText(url) {
  const parsed = parse_default(url, true);
  if (parsed.hostname) {
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = import_punycode.default.toUnicode(parsed.hostname);
      } catch (er) {
      }
    }
  }
  return decode_default(format(parsed), decode_default.defaultChars + "%");
}
function MarkdownIt(presetName, options) {
  if (!(this instanceof MarkdownIt)) {
    return new MarkdownIt(presetName, options);
  }
  if (!options) {
    if (!isString(presetName)) {
      options = presetName || {};
      presetName = "default";
    }
  }
  this.inline = new parser_inline_default();
  this.block = new parser_block_default();
  this.core = new parser_core_default();
  this.renderer = new renderer_default();
  this.linkify = new linkify_it_default();
  this.validateLink = validateLink;
  this.normalizeLink = normalizeLink;
  this.normalizeLinkText = normalizeLinkText;
  this.utils = utils_exports;
  this.helpers = assign({}, helpers_exports);
  this.options = {};
  this.configure(presetName);
  if (options) {
    this.set(options);
  }
}
MarkdownIt.prototype.set = function(options) {
  assign(this.options, options);
  return this;
};
MarkdownIt.prototype.configure = function(presets) {
  const self = this;
  if (isString(presets)) {
    const presetName = presets;
    presets = config[presetName];
    if (!presets) {
      throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name');
    }
  }
  if (!presets) {
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  }
  if (presets.options) {
    self.set(presets.options);
  }
  if (presets.components) {
    Object.keys(presets.components).forEach(function(name) {
      if (presets.components[name].rules) {
        self[name].ruler.enableOnly(presets.components[name].rules);
      }
      if (presets.components[name].rules2) {
        self[name].ruler2.enableOnly(presets.components[name].rules2);
      }
    });
  }
  return this;
};
MarkdownIt.prototype.enable = function(list2, ignoreInvalid) {
  let result = [];
  if (!Array.isArray(list2)) {
    list2 = [list2];
  }
  ["core", "block", "inline"].forEach(function(chain) {
    result = result.concat(this[chain].ruler.enable(list2, true));
  }, this);
  result = result.concat(this.inline.ruler2.enable(list2, true));
  const missed = list2.filter(function(name) {
    return result.indexOf(name) < 0;
  });
  if (missed.length && !ignoreInvalid) {
    throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + missed);
  }
  return this;
};
MarkdownIt.prototype.disable = function(list2, ignoreInvalid) {
  let result = [];
  if (!Array.isArray(list2)) {
    list2 = [list2];
  }
  ["core", "block", "inline"].forEach(function(chain) {
    result = result.concat(this[chain].ruler.disable(list2, true));
  }, this);
  result = result.concat(this.inline.ruler2.disable(list2, true));
  const missed = list2.filter(function(name) {
    return result.indexOf(name) < 0;
  });
  if (missed.length && !ignoreInvalid) {
    throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + missed);
  }
  return this;
};
MarkdownIt.prototype.use = function(plugin) {
  const args = [this].concat(Array.prototype.slice.call(arguments, 1));
  plugin.apply(plugin, args);
  return this;
};
MarkdownIt.prototype.parse = function(src, env) {
  if (typeof src !== "string") {
    throw new Error("Input data should be a String");
  }
  const state = new this.core.State(src, this, env);
  this.core.process(state);
  return state.tokens;
};
MarkdownIt.prototype.render = function(src, env) {
  env = env || {};
  return this.renderer.render(this.parse(src, env), this.options, env);
};
MarkdownIt.prototype.parseInline = function(src, env) {
  const state = new this.core.State(src, this, env);
  state.inlineMode = true;
  this.core.process(state);
  return state.tokens;
};
MarkdownIt.prototype.renderInline = function(src, env) {
  env = env || {};
  return this.renderer.render(this.parseInline(src, env), this.options, env);
};
var lib_default = MarkdownIt;

// src/report-components/utils.js
function splitCsv(value = "") {
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}
function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}
function escapeHtml2(value = "") {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(value = "") {
  return escapeHtml2(value);
}
function parseDataTableNumber(value) {
  return Number(String(value || "").replace(/,/g, "").replace(/%$/, "").trim());
}
function formatReportNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value || "");
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(numeric);
}
function formatReportPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0%";
  const rounded = (Math.round(numeric * 10) / 10).toFixed(1);
  return `${rounded.replace(/\.0$/, "")}%`;
}
function normalizeHexColor(value = "") {
  const token = String(value || "").trim();
  const hex2 = token.match(/^#?([0-9a-f]{6})$/i);
  return hex2 ? `#${hex2[1].toUpperCase()}` : "";
}
function normalizeBadgeVariant(value = "muted") {
  const token = String(value || "muted").trim().toLowerCase();
  if (["green", "success", "active", "approved", "done", "complete", "completed", "pass"].includes(token)) {
    return "green";
  }
  if (["blue", "info", "live", "new"].includes(token)) return "blue";
  if (["orange", "warning", "warn", "review", "watch", "attention"].includes(token)) return "orange";
  if (["red", "danger", "error", "blocked", "fail", "failed"].includes(token)) return "red";
  if (["muted", "neutral", "pending", "draft", "gray", "grey"].includes(token)) return "muted";
  return "muted";
}
function isKnownBadgeVariant(value = "muted") {
  const token = String(value || "muted").trim().toLowerCase();
  return [
    "green",
    "success",
    "active",
    "approved",
    "done",
    "complete",
    "completed",
    "pass",
    "blue",
    "info",
    "live",
    "new",
    "orange",
    "warning",
    "warn",
    "review",
    "watch",
    "attention",
    "red",
    "danger",
    "error",
    "blocked",
    "fail",
    "failed",
    "muted",
    "neutral",
    "pending",
    "draft",
    "gray",
    "grey"
  ].includes(token);
}
function jsString(value = "") {
  return JSON.stringify(String(value || ""));
}
function jsValue(value) {
  return JSON.stringify(value);
}

// src/report-components/parsers.js
function parseReportChart(chart, index = 0) {
  const type = normalizeChartType(chart.attr("type") || "bar");
  const labels = splitCsv(chart.attr("labels"));
  const values = splitCsv(chart.attr("values")).map((value) => Number(value));
  const targets = splitCsv(chart.attr("targets") || chart.attr("target-values") || chart.attr("target")).map(
    (value) => Number(value)
  );
  const title = chart.attr("title") || cleanText(chart.find("h2,h3,figcaption").first().text());
  const series = chart.attr("series") || title || "Series 1";
  const colors = splitCsv(chart.attr("colors"));
  const height = parseDimension(chart.attr("height"), 320);
  const requestedId = chart.attr("id") || chart.attr("chart-id") || "";
  const valuePrefix = chart.attr("value-prefix") || chart.attr("prefix") || "";
  const valueSuffix = chart.attr("value-suffix") || chart.attr("suffix") || "";
  const xAxisLabel = chart.attr("x-label") || chart.attr("x-axis-label") || chart.attr("x-title") || "";
  const yAxisLabel = chart.attr("y-label") || chart.attr("y-axis-label") || chart.attr("y-title") || "";
  const dataRef = chart.attr("data-ref") || chart.attr("dataset") || "";
  const labelColumn = chart.attr("label-column") || chart.attr("label-field") || chart.attr("label") || "";
  const valueColumn = chart.attr("value-column") || chart.attr("value-field") || chart.attr("value") || "";
  const seriesColumns = splitPipe(
    chart.attr("series-columns") || chart.attr("value-columns") || chart.attr("series-fields") || chart.attr("value-fields") || ""
  );
  const targetColumn = chart.attr("target-column") || chart.attr("target-field") || "";
  const xColumn = chart.attr("x-column") || chart.attr("x-field") || "";
  const yColumn = chart.attr("y-column") || chart.attr("y-field") || "";
  const rColumn = chart.attr("r-column") || chart.attr("radius-column") || "";
  const binCount = Number.parseInt(chart.attr("bins") || chart.attr("bucket-count") || chart.attr("buckets") || "10", 10);
  const points = parseChartPoints(chart.attr("points") || chart.attr("data"));
  const links = parseChartLinks(chart.attr("links") || chart.attr("flows") || chart.attr("edges") || "");
  const seriesNames = splitPipe(chart.attr("series") || chart.attr("datasets") || chart.attr("series-labels"));
  const xLabels = splitPipe(chart.attr("x-labels") || chart.attr("columns") || chart.attr("x") || "");
  const yLabels = splitPipe(chart.attr("y-labels") || chart.attr("rows") || chart.attr("y") || "");
  const matrix = parseChartMatrix(
    chart.attr("matrix") || chart.attr("series-values") || (["grouped-bar", "stacked-bar", "heatmap", "boxplot"].includes(type) ? chart.attr("values") : "")
  );
  const derivedPoints = points.length > 0 ? points : labels.map((label, index2) => ({
    x: label,
    y: values[index2]
  }));
  return {
    type: "chart",
    chartType: type,
    id: requestedId,
    generatedId: `report-chart-${index + 1}`,
    title,
    series,
    labels,
    values,
    targets,
    colors,
    points: derivedPoints,
    links,
    seriesNames,
    xLabels,
    yLabels,
    matrix,
    height,
    valuePrefix,
    valueSuffix,
    xAxisLabel,
    yAxisLabel,
    binCount,
    dataRef,
    labelColumn,
    valueColumn,
    seriesColumns,
    targetColumn,
    xColumn,
    yColumn,
    rColumn,
    ariaLabel: chart.attr("aria-label") || title || `${type} chart`
  };
}
function parseReportDataset(dataset) {
  const columns = splitPipe(dataset.attr("columns") || dataset.attr("headers"));
  const rows = splitRows(dataset.attr("rows") || dataset.attr("data")).map((row) => splitPipe(row, { keepEmpty: true }));
  return {
    type: "dataset",
    id: dataset.attr("id") || dataset.attr("name") || "",
    columns,
    rows
  };
}
function parseReportMetricGrid(root, grid) {
  const metrics = [];
  grid.children("report-metric").each((_, element) => {
    const metric = root(element);
    const value = metric.attr("value") || cleanText(metric.find("value,strong").first().text());
    const label = metric.attr("label") || cleanText(metric.find("label,span").first().text() || metric.text());
    const sub = metric.attr("sub") || metric.attr("delta") || metric.attr("change") || "";
    if (value || label || sub) {
      metrics.push({
        value,
        label,
        sub,
        direction: normalizeMetricDirection(metric.attr("direction") || metric.attr("trend")),
        accent: normalizeAccent(metric.attr("accent") || metric.attr("color"))
      });
    }
  });
  return {
    type: "metric-grid",
    metrics
  };
}
function parseReportFigure(figure) {
  return {
    type: "figure",
    src: normalizeResourceReference(figure.attr("src") || figure.attr("image") || ""),
    alt: figure.attr("alt") || "",
    caption: figure.attr("caption") || cleanText(figure.text()),
    source: figure.attr("source") || "",
    size: normalizeFigureSize(figure.attr("size") || figure.attr("width") || "")
  };
}
function parseReportDataTable(table2) {
  const columns = splitPipe(table2.attr("columns") || table2.attr("headers"));
  const rawTypes = splitPipe(table2.attr("types") || table2.attr("formats"));
  const types = rawTypes.length ? rawTypes.map(normalizeDataTableType) : columns.map(() => "text");
  const rows = splitRows(table2.attr("rows") || table2.attr("data")).map((row) => splitPipe(row, { keepEmpty: true }));
  const totalsValue = table2.attr("totals") || table2.attr("total") || table2.attr("footer") || "";
  const totals = cleanText(totalsValue) ? splitPipe(totalsValue, { keepEmpty: true }) : [];
  return {
    type: "data-table",
    title: table2.attr("title") || cleanText(table2.find("caption,h2,h3").first().text()),
    columns,
    types,
    rows,
    compact: normalizeBoolean(table2.attr("compact") || table2.attr("dense")),
    align: parseDataTableAlignments(table2.attr("align") || table2.attr("alignment")),
    totals,
    rawTotals: cleanText(totalsValue),
    highlights: parseDataTableHighlights(table2.attr("highlights") || table2.attr("highlight")),
    dataRef: table2.attr("data-ref") || table2.attr("dataset") || "",
    caption: table2.attr("caption") || "",
    source: table2.attr("source") || ""
  };
}
function parseReportKeyValues(keyValues) {
  const rawItems = keyValues.attr("items") || keyValues.attr("data") || cleanText(keyValues.text());
  return {
    type: "key-values",
    title: keyValues.attr("title") || cleanText(keyValues.find("h2,h3").first().text()),
    items: parseKeyValueItems(rawItems),
    rawItems,
    columns: normalizeKeyValueColumns(keyValues.attr("columns") || keyValues.attr("cols") || "")
  };
}
function parseReportInsight(insight) {
  return {
    type: "insight",
    variant: normalizeCalloutVariant(insight.attr("variant") || insight.attr("type") || insight.attr("tone") || "info"),
    rawVariant: insight.attr("variant") || insight.attr("type") || insight.attr("tone") || "info",
    title: insight.attr("title") || cleanText(insight.find("h3,strong,b").first().text()),
    finding: insight.attr("finding") || insight.attr("text") || insight.attr("body") || cleanText(insight.text()),
    evidence: insight.attr("evidence") || "",
    impact: insight.attr("impact") || "",
    action: insight.attr("action") || insight.attr("next") || ""
  };
}
function parseReportRecommendation(recommendation) {
  return {
    type: "recommendation",
    title: recommendation.attr("title") || cleanText(recommendation.find("h3,strong,b").first().text()),
    body: recommendation.attr("body") || recommendation.attr("text") || cleanText(recommendation.text()),
    owner: recommendation.attr("owner") || "",
    priority: normalizeRecommendationPriority(recommendation.attr("priority") || ""),
    rawPriority: recommendation.attr("priority") || "",
    due: recommendation.attr("due") || recommendation.attr("date") || "",
    status: normalizeBadgeVariant(recommendation.attr("status") || recommendation.attr("state") || "pending"),
    rawStatus: recommendation.attr("status") || recommendation.attr("state") || "pending"
  };
}
function parseReportPageBreak(pageBreak) {
  return {
    type: "page-break",
    label: pageBreak.attr("label") || pageBreak.attr("title") || ""
  };
}
function parseReportCardGrid(root, grid) {
  const cards = [];
  grid.children("report-card").each((_, element) => {
    const card = root(element);
    const rawAccent = card.attr("accent") || card.attr("color") || card.attr("tone") || "blue";
    cards.push({
      title: card.attr("title") || cleanText(card.find("h3,strong,b").first().text()),
      body: card.attr("body") || card.attr("text") || cleanText(card.text()),
      accent: normalizeAccent(rawAccent) || String(rawAccent || "").trim().toLowerCase(),
      rawAccent
    });
  });
  return {
    type: "card-grid",
    title: grid.attr("title") || cleanText(grid.find("h2,h3").first().text()),
    columns: normalizeCardGridColumns(grid.attr("columns") || grid.attr("cols") || ""),
    cards
  };
}
function parseReportTimeline(root, timeline) {
  const events = [];
  timeline.children("report-event").each((_, element) => {
    const event = root(element);
    const rawStatus = event.attr("status") || event.attr("variant") || event.attr("tone") || "muted";
    events.push({
      date: event.attr("date") || event.attr("time") || event.attr("period") || "",
      title: event.attr("title") || cleanText(event.find("h3,strong,b").first().text()),
      body: event.attr("body") || event.attr("text") || cleanText(event.text()),
      status: normalizeBadgeVariant(rawStatus),
      rawStatus
    });
  });
  return {
    type: "timeline",
    title: timeline.attr("title") || cleanText(timeline.find("h2,h3").first().text()),
    events
  };
}
function parseReportSourceNote(sourceNote) {
  return {
    type: "source-note",
    title: sourceNote.attr("title") || sourceNote.attr("label") || "",
    body: sourceNote.attr("text") || sourceNote.attr("body") || cleanText(sourceNote.text()),
    source: sourceNote.attr("source") || "",
    date: sourceNote.attr("date") || sourceNote.attr("period") || ""
  };
}
function parseReportSourceList(root, sourceList) {
  const sources = [];
  sourceList.children("report-source").each((_, element) => {
    const source = root(element);
    sources.push({
      id: source.attr("id") || source.attr("source-id") || "",
      title: source.attr("title") || source.attr("label") || "",
      publisher: source.attr("publisher") || source.attr("source") || "",
      date: source.attr("date") || source.attr("period") || "",
      url: source.attr("url") || source.attr("href") || "",
      note: source.attr("note") || source.attr("text") || source.attr("body") || cleanText(source.text())
    });
  });
  return {
    type: "source-list",
    title: sourceList.attr("title") || sourceList.attr("label") || "Sources",
    sources
  };
}
function parseReportCite(cite) {
  return {
    type: "cite",
    source: cite.attr("source") || cite.attr("ref") || cite.attr("id") || "",
    label: cite.attr("label") || cleanText(cite.text())
  };
}
function parseReportCallout(callout) {
  return {
    type: "callout",
    variant: normalizeCalloutVariant(callout.attr("variant") || callout.attr("type") || callout.attr("tone")),
    rawVariant: callout.attr("variant") || callout.attr("type") || callout.attr("tone") || "info",
    title: callout.attr("title") || cleanText(callout.find("strong,b,h3").first().text()),
    body: callout.attr("text") || cleanText(callout.text())
  };
}
function parseReportAccentCard(card) {
  const rawAccent = card.attr("accent") || card.attr("color") || card.attr("tone") || "blue";
  return {
    type: "accent-card",
    accent: normalizeAccent(rawAccent) || String(rawAccent || "").trim().toLowerCase(),
    rawAccent,
    title: card.attr("title") || cleanText(card.find("h3,strong,b").first().text()),
    body: card.attr("body") || card.attr("text") || cleanText(card.text())
  };
}
function parseReportBadge(badge) {
  const label = badge.attr("label") || cleanText(badge.text());
  const rawVariant = badge.attr("variant") || badge.attr("color") || badge.attr("tone") || badge.attr("status") || label || "muted";
  return {
    type: "badge",
    variant: normalizeBadgeVariant(rawVariant),
    rawVariant,
    label
  };
}
function parseReportRateBars(rateBars) {
  return {
    type: "rate-bars",
    title: rateBars.attr("title") || cleanText(rateBars.find("h2,h3,figcaption").first().text()),
    labels: splitCsv(rateBars.attr("labels")),
    values: splitCsv(rateBars.attr("values")).map((value) => Number(value)),
    shares: splitCsv(rateBars.attr("shares") || rateBars.attr("percentages") || rateBars.attr("percents")).map(
      (value) => Number(value)
    ),
    colors: splitCsv(rateBars.attr("colors")),
    ariaLabel: rateBars.attr("aria-label") || rateBars.attr("title") || "Ranked distribution"
  };
}
function normalizeChartType(value = "bar") {
  const token = String(value || "bar").trim().toLowerCase();
  if (token === "column") return "bar";
  if (token === "donut") return "doughnut";
  if (token === "tree-map") return "treemap";
  if (["grouped", "groupedbar", "clustered", "clustered-bar", "clusteredbar"].includes(token)) return "grouped-bar";
  if (["stacked", "stackedbar"].includes(token)) return "stacked-bar";
  return token;
}
function normalizeFigureSize(value = "") {
  const token = String(value || "").trim().toLowerCase();
  if (["narrow", "normal", "wide"].includes(token)) return token;
  return token || "normal";
}
function normalizeDataTableType(value = "") {
  return String(value || "text").trim().toLowerCase();
}
function normalizeBoolean(value = "") {
  const token = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "on", "compact", "dense"].includes(token);
}
function parseDataTableAlignments(value = "") {
  return splitPipe(value).map((item) => {
    const token = String(item || "").trim().toLowerCase();
    if (token === "middle") return "center";
    if (["left", "center", "right"].includes(token)) return token;
    return token;
  });
}
function parseDataTableHighlights(value = "") {
  return splitRows(value).map((item) => {
    const separator = item.includes("=") ? "=" : ":";
    const [target, ...rest] = item.split(separator);
    const [row, column] = cleanText(target).split(".");
    return {
      row: Number.parseInt(row, 10),
      column: column ? Number.parseInt(column, 10) : 0,
      variant: normalizeBadgeVariant(rest.join(separator)),
      rawVariant: cleanText(rest.join(separator))
    };
  });
}
function splitPipe(value = "", options = {}) {
  const keepEmpty = Boolean(options.keepEmpty);
  const items = String(value || "").split("|").map((item) => cleanText(item));
  return keepEmpty ? items : items.filter(Boolean);
}
function splitRows(value = "") {
  return String(value || "").split(";").map((row) => row.trim()).filter(Boolean);
}
function parseKeyValueItems(value = "") {
  return splitRows(value).map((item) => {
    const separator = item.includes("=") ? "=" : ":";
    const [key, ...rest] = item.split(separator);
    return {
      key: cleanText(key),
      value: cleanText(rest.join(separator))
    };
  });
}
function normalizeKeyValueColumns(value = "") {
  const numeric = Number.parseInt(value || 2, 10);
  if (!Number.isFinite(numeric)) return 2;
  return numeric;
}
function normalizeCardGridColumns(value = "") {
  const numeric = Number.parseInt(value || 3, 10);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}
function parseChartPoints(value = "") {
  return splitCsv(value).map((item) => {
    const separator = item.includes("=") ? "=" : ":";
    const [x, y, ...rest] = item.split(separator);
    return {
      x: cleanText(x),
      y: Number(String(y || "").trim()),
      r: rest.length ? Number(rest.join(separator).trim()) : void 0
    };
  });
}
function parseChartLinks(value = "") {
  return splitCsv(value).map((item) => {
    const match2 = String(item || "").match(/^(.+?)(?:->|=>|>)(.+?)(?::|=)(.+)$/);
    if (!match2) {
      return {
        source: "",
        target: "",
        value: Number.NaN
      };
    }
    return {
      source: cleanText(match2[1]),
      target: cleanText(match2[2]),
      value: Number(String(match2[3] || "").trim().replace(/,/g, ""))
    };
  });
}
function parseChartMatrix(value = "") {
  return splitRows(value).map((row) => splitPipe(row, { keepEmpty: true }).map((cell) => Number(cell.replace(/,/g, ""))));
}
function parseDimension(value, fallback) {
  const numeric = Number.parseInt(value || fallback, 10);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(720, Math.max(180, numeric));
}
function normalizeMetricDirection(value = "") {
  const token = String(value || "").trim().toLowerCase();
  if (["down", "negative", "decrease", "bad"].includes(token)) return "down";
  return "";
}
function normalizeCalloutVariant(value = "info") {
  const token = String(value || "info").trim().toLowerCase();
  if (token === "danger" || token === "error") return "danger";
  if (token === "warn") return "warning";
  if (token === "positive") return "success";
  return token;
}
function normalizeRecommendationPriority(value = "") {
  const token = String(value || "").trim().toLowerCase();
  if (["critical", "high", "medium", "low"].includes(token)) return token;
  return token;
}
function normalizeAccent(value = "") {
  const token = String(value || "").trim().toLowerCase();
  if (["blue", "cyan", "purple", "green", "orange", "red"].includes(token)) return token;
  return "";
}

// src/report-components/renderers.js
function renderReportChartHtml(chart) {
  if (["area", "treemap", "funnel", "heatmap", "sankey"].includes(chart.chartType)) return renderReportPlotChartHtml(chart);
  return `<div class="report-chart report-chart-${escapeAttr(chart.chartType)}">
  ${chart.title ? `<div class="report-chart-title">${escapeHtml2(chart.title)}</div>` : ""}
  <div class="report-chart-stage" style="height:${chart.height}px">
    <canvas id="${escapeAttr(chart.id)}" role="img" aria-label="${escapeAttr(chart.ariaLabel)}"></canvas>
  </div>
</div>`;
}
function renderReportPlotChartHtml(chart) {
  return `<div class="report-chart report-chart-${escapeAttr(chart.chartType)}">
  ${chart.title ? `<div class="report-chart-title">${escapeHtml2(chart.title)}</div>` : ""}
  <div class="report-chart-stage" style="height:${chart.height}px">
    <div id="${escapeAttr(chart.id)}" class="report-chart-plot" role="img" aria-label="${escapeAttr(chart.ariaLabel)}"></div>
  </div>
</div>`;
}
function renderReportMetricGridHtml(grid) {
  return `<div class="report-metric-grid">
${grid.metrics.map(renderReportMetricHtml).join("\n")}
</div>`;
}
function renderReportFigureHtml(figure) {
  const className = ["report-figure", `report-figure-${figure.size}`].filter(Boolean).join(" ");
  const caption = [
    figure.caption ? `<span class="report-figure-caption">${escapeHtml2(figure.caption)}</span>` : "",
    figure.source ? `<span class="report-figure-source">${escapeHtml2(figure.source)}</span>` : ""
  ].filter(Boolean).join("\n    ");
  return `<figure class="${escapeAttr(className)}">
  <img src="${escapeAttr(figure.src)}" alt="${escapeAttr(figure.alt)}">
  ${caption ? `<figcaption>
    ${caption}
  </figcaption>` : ""}
</figure>`;
}
function renderReportDataTableHtml(table2) {
  const className = ["report-data-table", table2.compact ? "report-data-table-compact" : ""].filter(Boolean).join(" ");
  const caption = [
    table2.caption ? `<span class="report-data-table-caption">${escapeHtml2(table2.caption)}</span>` : "",
    table2.source ? `<span class="report-data-table-source">${escapeHtml2(table2.source)}</span>` : ""
  ].filter(Boolean).join("\n    ");
  const footer = table2.totals.length ? `      <tfoot>
${renderReportDataTableRow(table2.totals, table2.types, table2, "total")}
      </tfoot>
` : "";
  const footerHtml = footer ? `
${footer.trimEnd()}` : "";
  return `<figure class="${escapeAttr(className)}">
  ${table2.title ? `<div class="report-data-table-title">${escapeHtml2(table2.title)}</div>` : ""}
  <div class="report-data-table-scroll">
    <table>
      <thead>
        <tr>${table2.columns.map((column, index) => renderReportDataTableHeader(column, table2, index)).join("")}</tr>
      </thead>
      <tbody>
${table2.rows.map((row, index) => renderReportDataTableRow(row, table2.types, table2, index + 1)).join("\n")}
      </tbody>${footerHtml}
    </table>
  </div>
  ${caption ? `<figcaption>
    ${caption}
  </figcaption>` : ""}
</figure>`;
}
function renderReportKeyValuesHtml(keyValues) {
  return `<section class="report-key-values report-key-values-${escapeAttr(keyValues.columns)}" aria-label="${escapeAttr(
    keyValues.title || "Key details"
  )}">
  ${keyValues.title ? `<div class="report-key-values-title">${escapeHtml2(keyValues.title)}</div>` : ""}
  <dl>
${keyValues.items.map(renderReportKeyValueItem).join("\n")}
  </dl>
</section>`;
}
function renderReportInsightHtml(insight) {
  const sections = [
    ["Finding", insight.finding],
    ["Evidence", insight.evidence],
    ["Impact", insight.impact],
    ["Action", insight.action]
  ].filter(([, value]) => value);
  return `<article class="report-insight report-insight-${escapeAttr(insight.variant)}" role="note">
  ${insight.title ? `<div class="report-insight-title">${escapeHtml2(insight.title)}</div>` : ""}
  <dl>
${sections.map(renderReportInsightSection).join("\n")}
  </dl>
</article>`;
}
function renderReportRecommendationHtml(recommendation) {
  const meta = [
    recommendation.owner ? `<span class="report-recommendation-meta-item">Owner: ${escapeHtml2(recommendation.owner)}</span>` : "",
    recommendation.priority ? `<span class="report-recommendation-priority report-recommendation-priority-${escapeAttr(recommendation.priority)}">${escapeHtml2(recommendation.rawPriority || recommendation.priority)}</span>` : "",
    recommendation.due ? `<span class="report-recommendation-meta-item">Due: ${escapeHtml2(recommendation.due)}</span>` : "",
    recommendation.rawStatus ? `<span class="report-badge report-badge-${escapeAttr(recommendation.status)}">${escapeHtml2(recommendation.rawStatus)}</span>` : ""
  ].filter(Boolean).join("\n    ");
  return `<article class="report-recommendation">
  ${recommendation.title ? `<div class="report-recommendation-title">${escapeHtml2(recommendation.title)}</div>` : ""}
  ${recommendation.body ? `<div class="report-recommendation-body">${escapeHtml2(recommendation.body)}</div>` : ""}
  ${meta ? `<div class="report-recommendation-meta">
    ${meta}
  </div>` : ""}
</article>`;
}
function renderReportPageBreakHtml(pageBreak) {
  return `<div class="report-page-break" role="separator" aria-label="${escapeAttr(
    pageBreak.label || "Page break"
  )}">${pageBreak.label ? `<span>${escapeHtml2(pageBreak.label)}</span>` : ""}</div>`;
}
function renderReportCardGridHtml(grid) {
  return `<section class="report-card-grid report-card-grid-${escapeAttr(grid.columns)}" aria-label="${escapeAttr(
    grid.title || "Report cards"
  )}">
  ${grid.title ? `<div class="report-card-grid-title">${escapeHtml2(grid.title)}</div>` : ""}
  <div class="report-card-grid-items">
${grid.cards.map(renderReportCardGridItem).join("\n")}
  </div>
</section>`;
}
function renderReportTimelineHtml(timeline) {
  return `<section class="report-timeline" aria-label="${escapeAttr(timeline.title || "Timeline")}">
  ${timeline.title ? `<div class="report-timeline-title">${escapeHtml2(timeline.title)}</div>` : ""}
  <ol>
${timeline.events.map(renderReportTimelineEvent).join("\n")}
  </ol>
</section>`;
}
function renderReportSourceNoteHtml(sourceNote) {
  const meta = [
    sourceNote.source ? `<span>Source: ${escapeHtml2(sourceNote.source)}</span>` : "",
    sourceNote.date ? `<span>Date: ${escapeHtml2(sourceNote.date)}</span>` : ""
  ].filter(Boolean).join("\n    ");
  return `<aside class="report-source-note" role="note">
  ${sourceNote.title ? `<div class="report-source-note-title">${escapeHtml2(sourceNote.title)}</div>` : ""}
  ${sourceNote.body ? `<div class="report-source-note-body">${escapeHtml2(sourceNote.body)}</div>` : ""}
  ${meta ? `<div class="report-source-note-meta">
    ${meta}
  </div>` : ""}
</aside>`;
}
function renderReportSourceListHtml(sourceList) {
  return `<section class="report-source-list" aria-label="${escapeAttr(sourceList.title || "Sources")}">
  ${sourceList.title ? `<div class="report-source-list-title">${escapeHtml2(sourceList.title)}</div>` : ""}
  <ol>
${sourceList.sources.map(renderReportSourceItem).join("\n")}
  </ol>
</section>`;
}
function renderReportCiteHtml(cite) {
  const label = cite.label || `[${cite.number}]`;
  return `<a class="report-cite" href="#${escapeAttr(cite.domId)}" aria-label="${escapeAttr(
    `Source ${cite.number}: ${cite.title}`
  )}">${escapeHtml2(label)}</a>`;
}
function renderReportCalloutHtml(callout) {
  return `<div class="report-callout report-callout-${escapeAttr(callout.variant)}" role="note">
  ${callout.title ? `<div class="report-callout-title">${escapeHtml2(callout.title)}</div>` : ""}
  ${callout.body ? `<div class="report-callout-body">${escapeHtml2(callout.body)}</div>` : ""}
</div>`;
}
function renderReportAccentCardHtml(card) {
  return `<div class="report-accent-card report-accent-card-${escapeAttr(card.accent)}">
  ${card.title ? `<div class="report-accent-card-title">${escapeHtml2(card.title)}</div>` : ""}
  ${card.body ? `<div class="report-accent-card-body">${escapeHtml2(card.body)}</div>` : ""}
</div>`;
}
function renderReportBadgeHtml(badge) {
  return `<span class="report-badge report-badge-${escapeAttr(badge.variant)}">${escapeHtml2(badge.label)}</span>`;
}
function renderReportMetricHtml(metric) {
  const className = ["report-metric", metric.accent ? `report-metric-${metric.accent}` : ""].filter(Boolean).join(" ");
  const subClass = ["report-metric-sub", metric.direction === "down" ? "down" : ""].filter(Boolean).join(" ");
  return `<div class="${escapeAttr(className)}">
  ${metric.value ? `<div class="report-metric-value">${escapeHtml2(metric.value)}</div>` : ""}
  ${metric.label ? `<div class="report-metric-label">${escapeHtml2(metric.label)}</div>` : ""}
  ${metric.sub ? `<div class="${escapeAttr(subClass)}">${escapeHtml2(metric.sub)}</div>` : ""}
</div>`;
}
function renderReportDataTableHeader(column, table2, index) {
  const className = ["report-data-table-heading", reportDataTableAlignClass(table2, index)].filter(Boolean).join(" ");
  return `<th scope="col" class="${escapeAttr(className)}">${escapeHtml2(column)}</th>`;
}
function renderReportDataTableRow(row, types, table2, rowIndex) {
  const highlight = rowIndex === "total" ? "" : reportDataTableRowHighlight(table2, rowIndex);
  const className = ["report-data-table-row", rowIndex === "total" ? "report-data-table-total-row" : "", highlight].filter(Boolean).join(" ");
  return `        <tr class="${escapeAttr(className)}">${row.map((value, index) => renderReportDataTableCell(value, types[index], table2, rowIndex, index)).join("")}</tr>`;
}
function renderReportDataTableCell(value, type = "text", table2 = {}, rowIndex = 0, cellIndex = 0) {
  const className = [
    "report-data-table-cell",
    `report-data-table-cell-${type}`,
    reportDataTableAlignClass(table2, cellIndex),
    rowIndex === "total" ? "report-data-table-total-cell" : "",
    rowIndex === "total" ? "" : reportDataTableCellHighlight(table2, rowIndex, cellIndex + 1)
  ].filter(Boolean).join(" ");
  if (type === "number") {
    return `<td class="${escapeAttr(className)}">${escapeHtml2(formatReportNumber(parseDataTableNumber(value)))}</td>`;
  }
  if (type === "percent") {
    return `<td class="${escapeAttr(className)}">${escapeHtml2(formatReportPercent(parseDataTableNumber(value)))}</td>`;
  }
  if (type === "status") {
    if (!String(value || "").trim()) return `<td class="${escapeAttr(className)}"></td>`;
    const variant = normalizeBadgeVariant(value);
    return `<td class="${escapeAttr(className)}"><span class="report-badge report-badge-${escapeAttr(variant)}">${escapeHtml2(value)}</span></td>`;
  }
  return `<td class="${escapeAttr(className)}">${escapeHtml2(value)}</td>`;
}
function reportDataTableAlignClass(table2 = {}, index = 0) {
  const explicit = table2.align?.[index] || "";
  const type = table2.types?.[index] || "text";
  const align = explicit || (type === "number" || type === "percent" ? "right" : "left");
  return ["left", "center", "right"].includes(align) ? `report-data-table-align-${align}` : "";
}
function reportDataTableRowHighlight(table2 = {}, rowIndex = 0) {
  const highlight = table2.highlights?.find((item) => item.row === rowIndex && !item.column);
  return highlight ? `report-data-table-highlight-${highlight.variant}` : "";
}
function reportDataTableCellHighlight(table2 = {}, rowIndex = 0, columnIndex = 0) {
  const highlight = table2.highlights?.find((item) => item.row === rowIndex && item.column === columnIndex);
  return highlight ? `report-data-table-highlight-${highlight.variant}` : "";
}
function renderReportKeyValueItem(item) {
  return `    <div class="report-key-value">
      <dt>${escapeHtml2(item.key)}</dt>
      <dd>${escapeHtml2(item.value)}</dd>
    </div>`;
}
function renderReportInsightSection([label, value]) {
  return `    <div class="report-insight-section">
      <dt>${escapeHtml2(label)}</dt>
      <dd>${escapeHtml2(value)}</dd>
    </div>`;
}
function renderReportSourceItem(source) {
  const meta = [
    source.publisher ? `<span>${escapeHtml2(source.publisher)}</span>` : "",
    source.date ? `<span>${escapeHtml2(source.date)}</span>` : "",
    source.url ? `<a href="${escapeAttr(source.url)}">${escapeHtml2(source.url)}</a>` : ""
  ].filter(Boolean).join("\n        ");
  const blocks = [
    source.note ? `<div class="report-source-list-note">${escapeHtml2(source.note)}</div>` : "",
    meta ? `<div class="report-source-list-meta">
        ${meta}
      </div>` : ""
  ].filter(Boolean).join("\n      ");
  return `    <li id="${escapeAttr(source.domId)}">
      <div class="report-source-list-heading">
        <span class="report-source-list-number">[${escapeHtml2(source.number)}]</span>
        <span class="report-source-list-name">${escapeHtml2(source.title)}</span>
      </div>${blocks ? `
      ${blocks}` : ""}
    </li>`;
}
function renderReportCardGridItem(card) {
  return `    <article class="report-card-grid-card report-card-grid-card-${escapeAttr(card.accent)}">
      ${card.title ? `<div class="report-card-grid-card-title">${escapeHtml2(card.title)}</div>` : ""}
      ${card.body ? `<div class="report-card-grid-card-body">${escapeHtml2(card.body)}</div>` : ""}
    </article>`;
}
function renderReportTimelineEvent(event) {
  return `    <li class="report-timeline-event report-timeline-event-${escapeAttr(event.status)}">
      <div class="report-timeline-marker" aria-hidden="true"></div>
      <div class="report-timeline-content">
        <div class="report-timeline-meta">
          ${event.date ? `<span class="report-timeline-date">${escapeHtml2(event.date)}</span>` : ""}
          <span class="report-badge report-badge-${escapeAttr(event.status)}">${escapeHtml2(event.rawStatus)}</span>
        </div>
        ${event.title ? `<div class="report-timeline-event-title">${escapeHtml2(event.title)}</div>` : ""}
        ${event.body ? `<div class="report-timeline-event-body">${escapeHtml2(event.body)}</div>` : ""}
      </div>
    </li>`;
}
function renderReportRateBarsHtml(rateBars, context = {}) {
  const palette = rateBars.colors.length ? rateBars.colors : reportChartPalette(context.brand);
  const total = rateBars.values.reduce((sum, value) => sum + value, 0);
  const rows = rateBars.labels.map((label, index) => {
    const value = rateBars.values[index];
    const share = rateBars.shares.length ? rateBars.shares[index] : value / total * 100;
    const width = clampPercent(share);
    const color = normalizeHexColor(palette[index % palette.length]) || "#0F82F5";
    return renderReportRateBar({
      label,
      value,
      share,
      width,
      color
    });
  });
  return `<div class="report-rate-bars" role="list" aria-label="${escapeAttr(rateBars.ariaLabel)}">
  ${rateBars.title ? `<div class="report-rate-bars-title">${escapeHtml2(rateBars.title)}</div>` : ""}
${rows.join("\n")}
</div>`;
}
function renderReportRateBar(row) {
  const style = `--report-rate-width:${formatReportPercent(row.width)};--report-rate-color:${row.color}`;
  return `<div class="report-rate-bar" role="listitem">
  <span class="report-rate-label">${escapeHtml2(row.label)}</span>
  <div class="report-rate-track">
    <div class="report-rate-fill" style="${escapeAttr(style)}"></div>
    <span class="report-rate-value">${escapeHtml2(formatReportNumber(row.value))}</span>
  </div>
  <span class="report-rate-pct">${escapeHtml2(formatReportPercent(row.share))}</span>
</div>`;
}
function chartBoilerplate(chart, targetName = "canvas") {
  return `  const themeRoot = ${targetName}.closest(".deck-report") || document.body || document.documentElement;
  const rootStyle = getComputedStyle(themeRoot);
  const tickColor = rootStyle.getPropertyValue("--text-dim").trim() || "#64748b";
  const gridColor = rootStyle.getPropertyValue("--border").trim() || "rgba(148, 163, 184, 0.28)";
  const tooltipBg = rootStyle.getPropertyValue("--bg-card").trim() || "rgba(15, 23, 42, 0.92)";
  const tooltipText = rootStyle.getPropertyValue("--text").trim() || "#ffffff";
  const tooltipMuted = rootStyle.getPropertyValue("--text-dim").trim() || "#cbd5e1";
  const textColor = rootStyle.getPropertyValue("--text").trim() || "#ffffff";
  const mutedColor = rootStyle.getPropertyValue("--text-dim").trim() || "#94a3b8";
  const valuePrefix = ${jsString(chart.valuePrefix)};
  const valueSuffix = ${jsString(chart.valueSuffix)};
  const valueFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const formatAxisValue = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? valueFormatter.format(numeric) : String(value ?? "");
  };
  const formatTooltipValue = (value) => {
    const formatted = formatAxisValue(value);
    return valuePrefix + formatted + valueSuffix;
  };
  const reportStaticChartOptions = {
    animation: false,
    transitions: {
      active: { animation: { duration: 0 } },
      resize: { animation: { duration: 0 } }
    }
  };`;
}
function renderReportChartScript(chart, context = {}) {
  if (chart.chartType === "area") return renderReportAreaChartScript(chart, context);
  if (chart.chartType === "treemap") return renderReportTreemapChartScript(chart, context);
  if (chart.chartType === "funnel") return renderReportFunnelChartScript(chart, context);
  if (chart.chartType === "heatmap") return renderReportHeatmapChartScript(chart, context);
  if (chart.chartType === "sankey") return renderReportSankeyChartScript(chart, context);
  if (chart.chartType === "grouped-bar") return renderReportMultiBarChartScript(chart, context, { stacked: false });
  if (chart.chartType === "stacked-bar") return renderReportMultiBarChartScript(chart, context, { stacked: true });
  if (chart.chartType === "waterfall") return renderReportWaterfallChartScript(chart, context);
  if (chart.chartType === "bullet") return renderReportBulletChartScript(chart, context);
  if (chart.chartType === "scatter") return renderReportScatterChartScript(chart, context);
  if (chart.chartType === "bubble") return renderReportBubbleChartScript(chart, context);
  if (chart.chartType === "histogram") return renderReportHistogramChartScript(chart, context);
  if (chart.chartType === "boxplot") return renderReportBoxplotChartScript(chart, context);
  if (chart.chartType === "pareto") return renderReportParetoChartScript(chart, context);
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const colors = chart.labels.map((_, index) => normalizeChartColor(palette[index % palette.length]));
  const primaryColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const chartJsType = chart.chartType === "line" ? "line" : chart.chartType === "doughnut" ? "doughnut" : "bar";
  const datasetOptions = chart.chartType === "doughnut" ? `        backgroundColor: ${jsValue(colors)},
        borderColor: tooltipBg,
        borderWidth: 2,
        hoverOffset: 8` : chart.chartType === "line" ? `        borderColor: ${jsString(primaryColor)},
        backgroundColor: ${jsString(hexToRgba(primaryColor, 0.18))},
        pointBackgroundColor: ${jsString(primaryColor)},
        pointBorderColor: tooltipBg,
        pointHoverRadius: 6,
        pointRadius: 4,
        borderWidth: 3,
        tension: 0.35,
        fill: false` : `        backgroundColor: ${jsValue(colors)},
        borderRadius: 5`;
  const legendOptions = chart.chartType === "doughnut" ? 'legend: { display: true, position: "right", labels: { color: tickColor } }' : `legend: { display: ${chart.series && chart.series !== chart.title ? "true" : "false"} }`;
  const chartScales = chart.chartType === "doughnut" ? "" : `,
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }`;
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  new Chart(canvas, {
    type: ${jsString(chartJsType)},
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series)},
        data: ${jsValue(chart.values)},
${datasetOptions}
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      hover: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        ${legendOptions},
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ? context.dataset.label + ": " : "";
              const parsedValue = context.parsed && typeof context.parsed === "object" ? context.parsed.y : context.parsed;
              return label + formatTooltipValue(parsedValue);
            }
          }
        }
      }
${chartScales}
    }
  });
})();`;
}
function renderReportParetoChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const barColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const lineColor = normalizeChartColor(palette[5]) || "#FC5161";
  const rows = chart.labels.map((label, index) => ({ label, value: chart.values[index] })).sort((left, right) => right.value - left.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  let running = 0;
  const cumulative = rows.map((row) => {
    running += row.value;
    return Math.round(running / total * 1e4) / 100;
  });
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  new Chart(canvas, {
    data: {
      labels: ${jsValue(rows.map((row) => row.label))},
      datasets: [{
        type: "bar",
        label: ${jsString(chart.series || "Value")},
        data: ${jsValue(rows.map((row) => row.value))},
        yAxisID: "y",
        order: 2,
        backgroundColor: ${jsString(hexToRgba(barColor, 0.82))},
        borderColor: ${jsString(barColor)},
        borderWidth: 1,
        borderRadius: 5
      }, {
        type: "line",
        label: "Cumulative %",
        data: ${jsValue(cumulative)},
        yAxisID: "yPercent",
        order: 1,
        borderColor: ${jsString(lineColor)},
        backgroundColor: ${jsString(lineColor)},
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: true, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              if (context.dataset.yAxisID === "yPercent") return "Cumulative: " + valueFormatter.format(context.parsed.y) + "%";
              return context.dataset.label + ": " + formatTooltipValue(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          position: "left",
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        yPercent: {
          beginAtZero: true,
          max: 100,
          position: "right",
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString() + "%"
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
})();`;
}
function renderReportBoxplotChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const boxColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const medianColor = normalizeChartColor(palette[5]) || "#FC5161";
  const stats = chart.labels.map((label, index) => {
    const values = [...chart.matrix[index]].sort((left, right) => left - right);
    return {
      label,
      min: values[0],
      q1: quantile(values, 0.25),
      median: quantile(values, 0.5),
      q3: quantile(values, 0.75),
      max: values[values.length - 1]
    };
  });
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  const stats = ${jsValue(stats)};
  const medianColor = ${jsString(medianColor)};
  const boxplotPlugin = {
    id: "reportBoxplotWhiskers",
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      const yScale = chart.scales.y;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = medianColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      stats.forEach((item, index) => {
        const bar = meta.data[index];
        if (!bar) return;
        const x = bar.x;
        const halfWidth = Math.max(10, Math.min(28, Math.abs(bar.width || 28) / 2));
        const minY = yScale.getPixelForValue(item.min);
        const maxY = yScale.getPixelForValue(item.max);
        const medianY = yScale.getPixelForValue(item.median);
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x, maxY);
        ctx.moveTo(x - halfWidth, minY);
        ctx.lineTo(x + halfWidth, minY);
        ctx.moveTo(x - halfWidth, maxY);
        ctx.lineTo(x + halfWidth, maxY);
        ctx.moveTo(x - halfWidth, medianY);
        ctx.lineTo(x + halfWidth, medianY);
        ctx.stroke();
      });
      ctx.restore();
    }
  };
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series || "Interquartile range")},
        data: stats.map((item) => [item.q1, item.q3]),
        backgroundColor: ${jsString(hexToRgba(boxColor, 0.52))},
        borderColor: ${jsString(boxColor)},
        borderWidth: 2,
        borderSkipped: false,
        borderRadius: 4,
        barPercentage: 0.58,
        categoryPercentage: 0.7
      }]
    },
    plugins: [boxplotPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              const item = stats[context.dataIndex];
              return [
                "Min: " + formatTooltipValue(item.min),
                "Q1: " + formatTooltipValue(item.q1),
                "Median: " + formatTooltipValue(item.median),
                "Q3: " + formatTooltipValue(item.q3),
                "Max: " + formatTooltipValue(item.max)
              ];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          title: {
            display: ${chart.yAxisLabel ? "true" : "false"},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`;
}
function renderReportHistogramChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const barColor = normalizeChartColor(palette[2] || palette[0]) || "#5A49F8";
  const minValue = Math.min(...chart.values);
  const maxValue = Math.max(...chart.values);
  const binCount = chart.binCount;
  const span = maxValue - minValue;
  const width = span === 0 ? 1 : span / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = span === 0 ? minValue - 0.5 + index * width : minValue + index * width;
    const end = start + width;
    return {
      start,
      end,
      count: 0
    };
  });
  chart.values.forEach((value) => {
    const rawIndex = span === 0 ? Math.floor(binCount / 2) : Math.floor((value - minValue) / width);
    const index = Math.max(0, Math.min(binCount - 1, rawIndex));
    bins[index].count += 1;
  });
  const labels = bins.map((bin) => `${formatBinLabel(bin.start)}-${formatBinLabel(bin.end)}`);
  const counts = bins.map((bin) => bin.count);
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  const ranges = ${jsValue(labels)};
  const counts = ${jsValue(counts)};
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ranges,
      datasets: [{
        label: ${jsString(chart.series || "Frequency")},
        data: counts,
        backgroundColor: ${jsString(hexToRgba(barColor, 0.82))},
        borderColor: ${jsString(barColor)},
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 1,
        categoryPercentage: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            title: (items) => {
              const index = items && items.length ? items[0].dataIndex : 0;
              return "Range: " + ranges[index];
            },
            label: (context) => "Count: " + valueFormatter.format(context.parsed.y)
          }
        }
      },
      scales: {
        x: {
          title: {
            display: ${chart.xAxisLabel ? "true" : "false"},
            text: ${jsString(chart.xAxisLabel)},
            color: tickColor
          },
          ticks: { color: tickColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          title: {
            display: ${chart.yAxisLabel ? "true" : "false"},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            precision: 0,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`;
}
function renderReportBubbleChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const bubbleColor = normalizeChartColor(palette[1] || palette[0]) || "#66D9EF";
  const points = chart.points.map((point) => ({
    x: Number(point.x),
    y: point.y,
    r: point.r
  }));
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  new Chart(canvas, {
    type: "bubble",
    data: {
      datasets: [{
        label: ${jsString(chart.series || chart.title || "Series 1")},
        data: ${jsValue(points)},
        backgroundColor: ${jsString(hexToRgba(bubbleColor, 0.42))},
        borderColor: ${jsString(bubbleColor)},
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        legend: { display: ${chart.series && chart.series !== chart.title ? "true" : "false"}, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: true,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              const raw = context.raw || {};
              return "X: " + formatAxisValue(raw.x) + ", Y: " + formatTooltipValue(raw.y) + ", Size: " + formatAxisValue(raw.r);
            }
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: ${chart.xAxisLabel ? "true" : "false"},
            text: ${jsString(chart.xAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        y: {
          title: {
            display: ${chart.yAxisLabel ? "true" : "false"},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`;
}
function renderReportScatterChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const pointColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const points = chart.points.map((point) => ({
    x: Number(point.x),
    y: point.y
  }));
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [{
        label: ${jsString(chart.series || chart.title || "Series 1")},
        data: ${jsValue(points)},
        backgroundColor: ${jsString(hexToRgba(pointColor, 0.82))},
        borderColor: ${jsString(pointColor)},
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        legend: { display: ${chart.series && chart.series !== chart.title ? "true" : "false"}, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: true,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              return "X: " + formatAxisValue(context.parsed.x) + ", Y: " + formatTooltipValue(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: ${chart.xAxisLabel ? "true" : "false"},
            text: ${jsString(chart.xAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        y: {
          title: {
            display: ${chart.yAxisLabel ? "true" : "false"},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`;
}
function renderReportBulletChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const barColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const targetColor = normalizeChartColor(palette[5]) || "#FC5161";
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  const targets = ${jsValue(chart.targets)};
  const targetColor = ${jsString(targetColor)};
  const targetMarkerPlugin = {
    id: "reportBulletTargetMarkers",
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      const xScale = chart.scales.x;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      targets.forEach((target, index) => {
        const bar = meta.data[index];
        if (!bar) return;
        const x = xScale.getPixelForValue(target);
        const markerHeight = Math.min(34, Math.max(16, Math.abs(bar.height || 24) + 8));
        ctx.beginPath();
        ctx.moveTo(x, bar.y - markerHeight / 2);
        ctx.lineTo(x, bar.y + markerHeight / 2);
        ctx.stroke();
      });
      ctx.restore();
    }
  };
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series || "Actual")},
        data: ${jsValue(chart.values)},
        backgroundColor: ${jsString(barColor)},
        borderRadius: 5,
        borderSkipped: false,
        barPercentage: 0.58,
        categoryPercentage: 0.72
      }]
    },
    plugins: [targetMarkerPlugin],
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: true,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              const target = targets[context.dataIndex];
              return [
                "Actual: " + formatTooltipValue(context.parsed.x),
                "Target: " + formatTooltipValue(target)
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: tickColor },
          grid: { display: false }
        }
      }
    }
  });
})();`;
}
function renderReportHeatmapChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const highColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const lowColor = hexToRgba(highColor, 0.12);
  const cells = chart.yLabels.flatMap(
    (rowLabel, rowIndex) => chart.xLabels.map((columnLabel, columnIndex) => ({
      x: columnLabel,
      y: rowLabel,
      value: chart.matrix[rowIndex][columnIndex]
    }))
  );
  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "target")}
  const xLabels = ${jsValue(chart.xLabels)};
  const yLabels = ${jsValue(chart.yLabels)};
  const cells = ${jsValue(cells)};
  const width = Math.max(320, target.clientWidth || 720);
  const height = ${chart.height};
  const margin = { top: 22, right: 24, bottom: 44, left: Math.max(76, Math.min(148, Math.max(...yLabels.map((label) => String(label).length)) * 9 + 28)) };
  const plotWidth = Math.max(1, width - margin.left - margin.right);
  const plotHeight = Math.max(1, height - margin.top - margin.bottom);
  const cellWidth = plotWidth / Math.max(1, xLabels.length);
  const cellHeight = plotHeight / Math.max(1, yLabels.length);
  const values = cells.map((cell) => Number(cell.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const color = d3.scaleSequential()
    .domain(minValue === maxValue ? [minValue - 1, maxValue + 1] : [minValue, maxValue])
    .interpolator(d3.interpolateRgb(${jsString(lowColor)}, ${jsString(highColor)}));
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", ${jsString(chart.ariaLabel)})
    .style("display", "block")
    .style("width", "100%")
    .style("height", "100%");
  const plot = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  plot.selectAll("rect")
    .data(cells)
    .join("rect")
    .attr("class", "report-heatmap-cell")
    .attr("x", (cell) => xLabels.indexOf(cell.x) * cellWidth)
    .attr("y", (cell) => yLabels.indexOf(cell.y) * cellHeight)
    .attr("width", Math.max(1, cellWidth - 3))
    .attr("height", Math.max(1, cellHeight - 3))
    .attr("rx", 5)
    .attr("fill", (cell) => color(Number(cell.value)))
    .attr("stroke", tooltipBg)
    .attr("stroke-width", 1)
    .on("mousemove", (event, cell) => {
      const rect = target.getBoundingClientRect();
      tooltip.textContent = cell.y + " \xB7 " + cell.x + ": " + formatTooltipValue(cell.value);
      tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
      tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
      tooltip.hidden = false;
      d3.select(event.currentTarget).attr("stroke", gridColor).attr("stroke-width", 2);
    })
    .on("mouseleave", (event) => {
      tooltip.hidden = true;
      d3.select(event.currentTarget).attr("stroke", tooltipBg).attr("stroke-width", 1);
    });
  svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + (margin.top + plotHeight + 10) + ")")
    .selectAll("text")
    .data(xLabels)
    .join("text")
    .attr("x", (_, index) => index * cellWidth + cellWidth / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("fill", tickColor)
    .attr("font-size", 12)
    .text((label) => label);
  svg.append("g")
    .attr("transform", "translate(" + (margin.left - 12) + "," + margin.top + ")")
    .selectAll("text")
    .data(yLabels)
    .join("text")
    .attr("x", 0)
    .attr("y", (_, index) => index * cellHeight + cellHeight / 2 + 4)
    .attr("text-anchor", "end")
    .attr("fill", tickColor)
    .attr("font-size", 12)
    .text((label) => label);
  svg.append("text")
    .attr("x", width - margin.right)
    .attr("y", height - 8)
    .attr("text-anchor", "end")
    .attr("fill", tickColor)
    .attr("font-size", 11)
    .text("Low " + formatTooltipValue(minValue) + "   High " + formatTooltipValue(maxValue));
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
  target.append(svg.node());
  target.append(tooltip);
})();`;
}
function renderReportWaterfallChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const positiveColor = normalizeChartColor(palette[4]) || "#66CC8E";
  const negativeColor = normalizeChartColor(palette[5]) || "#FC5161";
  let runningTotal = 0;
  const ranges = chart.values.map((value) => {
    const start = runningTotal;
    runningTotal += value;
    return [Math.min(start, runningTotal), Math.max(start, runningTotal)];
  });
  const colors = chart.values.map((value) => value < 0 ? negativeColor : positiveColor);
  const deltas = chart.values;
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  const deltas = ${jsValue(deltas)};
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series || "Change")},
        data: ${jsValue(ranges)},
        backgroundColor: ${jsValue(colors)},
        borderRadius: 5,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              const delta = deltas[context.dataIndex];
              return "Change: " + formatTooltipValue(delta);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`;
}
function renderReportMultiBarChartScript(chart, context = {}, options = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const datasets = chart.seriesNames.map((series, seriesIndex) => ({
    label: series,
    data: chart.matrix.map((row) => row[seriesIndex]),
    backgroundColor: normalizeChartColor(palette[seriesIndex % palette.length]) || "#0F82F5",
    borderRadius: 5
  }));
  const stacked = Boolean(options.stacked);
  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "canvas")}
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: ${jsValue(datasets)}
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: true, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ? context.dataset.label + ": " : "";
              return label + formatTooltipValue(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          stacked: ${stacked},
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          stacked: ${stacked},
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`;
}
function renderReportFunnelChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const fallbackColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const data = chart.labels.map((label, index) => ({
    label,
    value: chart.values[index],
    color: normalizeChartColor(palette[index % palette.length]) || fallbackColor
  }));
  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
  if (!target) return;
${chartBoilerplate(chart, "target")}
  const data = ${jsValue(data)};
  const uid = (${jsString(chart.id)} || "funnel").replace(/[^a-zA-Z0-9_-]/g, "");
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const height = ${chart.height};

  const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const isHex = (c) => /^#[0-9a-fA-F]{6}$/.test(c);
  const shade = (hex, amount, toWhite) => {
    if (!isHex(hex)) return hex;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const t = toWhite ? 255 : 0;
    const m = (x) => clampByte(x + (t - x) * amount);
    return "#" + [m(r), m(g), m(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  const convText = (item) => item.conversion === null ? "Start" : (Math.round(item.conversion * 10) / 10).toString().replace(/\\.0$/, "") + "% from prior";

  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;

  function draw() {
    target.querySelectorAll("svg").forEach((node) => node.remove());
    // Render at the true on-screen size so it is crisp on large/high-DPI displays.
    const width = Math.max(360, Math.round(target.clientWidth || 760));
    const keyWidth = Math.min(300, Math.max(200, width * 0.34));
    const funnelWidth = width - keyWidth;
    const padTop = 16, padBottom = 16, gap = 6;
    const n = data.length;
    const segmentHeight = Math.max(28, (height - padTop - padBottom - gap * Math.max(0, n - 1)) / Math.max(1, n));
    const marginX = 26;
    const maxBand = Math.max(60, funnelWidth - marginX * 2);
    const minBand = Math.max(46, maxBand * 0.18);
    const bandFor = (value) => Math.max(minBand, (Number(value) / maxValue) * maxBand);
    const cx = funnelWidth / 2;

    const segments = data.map((item, index) => {
      const y0 = padTop + index * (segmentHeight + gap);
      const y1 = y0 + segmentHeight;
      const topWidth = bandFor(item.value);
      const next = data[index + 1];
      const bottomWidth = bandFor(next ? next.value : item.value * 0.72);
      const previous = index === 0 ? null : data[index - 1];
      const conversion = previous && previous.value > 0 ? (item.value / previous.value) * 100 : null;
      return Object.assign({}, item, {
        index, y0, y1, mid: (y0 + y1) / 2, topWidth, conversion,
        path: ["M", cx - topWidth / 2, y0, "L", cx + topWidth / 2, y0, "L", cx + bottomWidth / 2, y1, "L", cx - bottomWidth / 2, y1, "Z"].join(" ")
      });
    });

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", ${jsString(chart.ariaLabel)})
      .attr("shape-rendering", "geometricPrecision")
      .style("display", "block")
      .style("width", "100%")
      .style("height", "auto")
      .style("overflow", "visible");

    // theme-aware vertical sheen per segment (sharp vector, adds depth without blur)
    const defs = svg.append("defs");
    segments.forEach((segment, index) => {
      const grad = defs.append("linearGradient").attr("id", uid + "-g" + index)
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 1);
      grad.append("stop").attr("offset", "0%").attr("stop-color", shade(segment.color, 0.16, true));
      grad.append("stop").attr("offset", "58%").attr("stop-color", segment.color);
      grad.append("stop").attr("offset", "100%").attr("stop-color", shade(segment.color, 0.12, false));
    });

    const cell = svg.append("g").selectAll("g").data(segments).join("g").attr("class", "report-funnel-segment");
    cell.append("path")
      .attr("d", (segment) => segment.path)
      .attr("fill", (segment, index) => isHex(segment.color) ? "url(#" + uid + "-g" + index + ")" : segment.color)
      .attr("stroke", tooltipBg)
      .attr("stroke-width", 1.25)
      .attr("stroke-linejoin", "round");
    // crisp top-edge highlight for a polished, dimensional feel
    cell.append("line")
      .attr("x1", (segment) => cx - segment.topWidth / 2 + 1.5)
      .attr("y1", (segment) => segment.y0 + 0.75)
      .attr("x2", (segment) => cx + segment.topWidth / 2 - 1.5)
      .attr("y2", (segment) => segment.y0 + 0.75)
      .attr("stroke", (segment) => shade(segment.color, 0.45, true))
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.5)
      .attr("pointer-events", "none");

    // always-visible key on the right (swatch + label + value/conversion)
    const keyX = funnelWidth + 12;
    const rows = svg.append("g").attr("class", "report-funnel-key").selectAll("g").data(segments).join("g")
      .attr("transform", (segment) => "translate(" + keyX + "," + segment.mid + ")");
    rows.append("rect").attr("x", 0).attr("y", -10).attr("width", 13).attr("height", 13).attr("rx", 3.5)
      .attr("fill", (segment) => segment.color);
    rows.append("text").attr("x", 22).attr("y", -1).attr("fill", textColor)
      .attr("font-size", 13).attr("font-weight", 600).text((segment) => segment.label);
    rows.append("text").attr("x", 22).attr("y", 15).attr("fill", mutedColor)
      .attr("font-size", 12).attr("font-weight", 500).text((segment) => formatTooltipValue(segment.value) + " \xB7 " + convText(segment));

    cell.style("cursor", "default")
      .on("mousemove", (event, segment) => {
        const rect = target.getBoundingClientRect();
        tooltip.textContent = segment.label + ": " + formatTooltipValue(segment.value) + " \xB7 " + convText(segment);
        tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
        tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
        tooltip.hidden = false;
        d3.select(event.currentTarget).select("path").attr("stroke", gridColor);
      })
      .on("mouseleave", (event) => {
        tooltip.hidden = true;
        d3.select(event.currentTarget).select("path").attr("stroke", tooltipBg);
      });

    target.appendChild(svg.node());
  }

  target.textContent = "";
  draw();
  target.appendChild(tooltip);
  target.addEventListener("mouseleave", () => { tooltip.hidden = true; });
  if (typeof ResizeObserver !== "undefined") {
    let raf = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); });
    ro.observe(target);
  }
})();`;
}
function renderReportSankeyChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const fallbackColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const nodeColors = /* @__PURE__ */ new Map();
  const nodes = [];
  chart.links.forEach((link2) => {
    ;
    [link2.source, link2.target].forEach((label) => {
      if (!nodeColors.has(label)) {
        nodeColors.set(label, normalizeChartColor(palette[nodeColors.size % palette.length]) || fallbackColor);
        nodes.push(label);
      }
    });
  });
  const data = {
    nodes: nodes.map((label) => ({ label, color: nodeColors.get(label) })),
    links: chart.links.map((link2) => ({ ...link2, color: nodeColors.get(link2.source) || fallbackColor }))
  };
  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "target")}
  const data = ${jsValue(data)};
  const width = Math.max(320, target.clientWidth || 720);
  const height = ${chart.height};
  const nodeWidth = 18;
  const margin = { top: 18, right: 28, bottom: 18, left: 28 };
  const innerHeight = Math.max(120, height - margin.top - margin.bottom);
  const innerWidth = Math.max(220, width - margin.left - margin.right - nodeWidth);
  const nodeMap = new Map(data.nodes.map((node) => [node.label, {
    ...node,
    incoming: 0,
    outgoing: 0,
    depth: 0,
    sourceLinks: [],
    targetLinks: []
  }]));
  const links = data.links.map((link) => {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    source.outgoing += link.value;
    target.incoming += link.value;
    const resolved = { ...link, source, target };
    source.sourceLinks.push(resolved);
    target.targetLinks.push(resolved);
    return resolved;
  });
  for (let pass = 0; pass < nodeMap.size; pass += 1) {
    links.forEach((link) => {
      link.target.depth = Math.max(link.target.depth, link.source.depth + 1);
    });
  }
  const maxDepth = Math.max(...Array.from(nodeMap.values(), (node) => node.depth), 1);
  const columns = d3.group(Array.from(nodeMap.values()), (node) => node.depth);
  columns.forEach((column) => {
    column.sort((a, b) => Math.max(b.incoming, b.outgoing) - Math.max(a.incoming, a.outgoing));
    const gap = column.length > 1 ? 12 : 0;
    const available = Math.max(24, innerHeight - gap * Math.max(0, column.length - 1));
    const totalWeight = d3.sum(column, (node) => Math.max(node.incoming, node.outgoing, 1));
    const minHeight = column.length * 16 <= available ? 16 : Math.max(6, available / Math.max(1, column.length));
    let y = margin.top;
    column.forEach((node) => {
      const weight = Math.max(node.incoming, node.outgoing, 1);
      node.x = margin.left + (node.depth / maxDepth) * innerWidth;
      node.y = y;
      node.height = Math.max(minHeight, (weight / Math.max(totalWeight, 1)) * available);
      node.width = nodeWidth;
      y += node.height + gap;
    });
  });
  const maxColumnWeight = Math.max(...Array.from(columns.values(), (column) =>
    d3.sum(column, (node) => Math.max(node.incoming, node.outgoing, 1))
  ), 1);
  const linkScale = innerHeight / maxColumnWeight;
  links.forEach((link) => {
    const maxLinkWidth = Math.max(2, Math.min(link.source.height, link.target.height, innerHeight * 0.24));
    link.width = Math.min(maxLinkWidth, Math.max(2, link.value * linkScale));
  });
  nodeMap.forEach((node) => {
    node.sourceLinks.sort((a, b) => a.target.y - b.target.y);
    node.targetLinks.sort((a, b) => a.source.y - b.source.y);
    let sourceOffset = 0;
    node.sourceLinks.forEach((link) => {
      link.y0 = node.y + Math.min(node.height - link.width / 2, sourceOffset + link.width / 2);
      sourceOffset += link.width;
    });
    let targetOffset = 0;
    node.targetLinks.forEach((link) => {
      link.y1 = node.y + Math.min(node.height - link.width / 2, targetOffset + link.width / 2);
      targetOffset += link.width;
    });
  });
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", ${jsString(chart.ariaLabel)})
    .style("display", "block")
    .style("width", "100%")
    .style("height", "100%");
  const pathFor = (link) => {
    const x0 = link.source.x + nodeWidth;
    const x1 = link.target.x;
    const mid = x0 + (x1 - x0) * 0.5;
    return "M" + x0 + "," + link.y0 + "C" + mid + "," + link.y0 + " " + mid + "," + link.y1 + " " + x1 + "," + link.y1;
  };
  const linkSelection = svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("class", "report-sankey-link")
    .attr("d", pathFor)
    .attr("stroke", (link) => link.color)
    .attr("stroke-opacity", 0.36)
    .attr("stroke-width", (link) => link.width)
    .attr("stroke-linecap", "round");
  linkSelection.on("mousemove", (event, link) => {
    const rect = target.getBoundingClientRect();
    tooltip.textContent = link.source.label + " -> " + link.target.label + ": " + formatTooltipValue(link.value);
    tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
    tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
    tooltip.hidden = false;
    d3.select(event.currentTarget).attr("stroke-opacity", 0.72);
  });
  linkSelection.on("mouseleave", (event) => {
    tooltip.hidden = true;
    d3.select(event.currentTarget).attr("stroke-opacity", 0.36);
  });
  const nodeSelection = svg.append("g")
    .selectAll("g")
    .data(Array.from(nodeMap.values()))
    .join("g")
    .attr("class", "report-sankey-node")
    .attr("transform", (node) => "translate(" + node.x + "," + node.y + ")");
  nodeSelection.append("rect")
    .attr("width", nodeWidth)
    .attr("height", (node) => node.height)
    .attr("rx", 5)
    .attr("fill", (node) => node.color)
    .attr("stroke", gridColor)
    .attr("stroke-width", 1);
  nodeSelection.append("text")
    .attr("x", (node) => node.depth === maxDepth ? -8 : nodeWidth + 8)
    .attr("y", (node) => Math.max(12, node.height / 2))
    .attr("dy", "0.35em")
    .attr("text-anchor", (node) => node.depth === maxDepth ? "end" : "start")
    .attr("fill", textColor)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .text((node) => node.label)
    .each(function() {
      const text = d3.select(this);
      const maxWidth = Math.max(54, width / (maxDepth + 1) - 48);
      let label = text.text();
      while (this.getComputedTextLength && this.getComputedTextLength() > maxWidth && label.length > 4) {
        label = label.slice(0, -2).trim();
        text.text(label + "...");
      }
    });
  nodeSelection.append("title")
    .text((node) => node.label + ": in " + formatTooltipValue(node.incoming) + ", out " + formatTooltipValue(node.outgoing));
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", height - 3)
    .attr("fill", mutedColor)
    .attr("font-size", 11)
    .text(${jsString(chart.series || "Flow")});
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
  target.append(svg.node());
  target.append(tooltip);
})();`;
}
function renderReportTreemapChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const fallbackColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const data = chart.labels.map((label, index) => ({
    label,
    value: chart.values[index],
    color: normalizeChartColor(palette[index % palette.length]) || fallbackColor
  }));
  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "target")}
  const data = ${jsValue(data)};
  const width = Math.max(320, target.clientWidth || 720);
  const height = ${chart.height};
  const root = d3.hierarchy({ children: data })
    .sum((node) => node.value)
    .sort((a, b) => b.value - a.value);
  d3.treemap()
    .size([width, height])
    .paddingInner(5)
    .round(true)(root);
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", ${jsString(chart.ariaLabel)})
    .style("display", "block")
    .style("width", "100%")
    .style("height", "100%");
  const cell = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (node) => "translate(" + node.x0 + "," + node.y0 + ")");
  cell.append("rect")
    .attr("width", (node) => Math.max(0, node.x1 - node.x0))
    .attr("height", (node) => Math.max(0, node.y1 - node.y0))
    .attr("rx", 6)
    .attr("fill", (node) => node.data.color)
    .attr("fill-opacity", 0.88)
    .attr("stroke", tooltipBg)
    .attr("stroke-width", 1.5);
  cell.append("text")
    .attr("x", 12)
    .attr("y", 18)
    .attr("fill", textColor)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .style("paint-order", "stroke")
    .style("stroke", "rgba(0, 0, 0, 0.32)")
    .style("stroke-linejoin", "round")
    .style("stroke-width", "2px")
    .style("pointer-events", "none")
    .each(function(node) {
      const cellWidth = node.x1 - node.x0;
      const cellHeight = node.y1 - node.y0;
      if (cellWidth < 76 || cellHeight < 42) return;
      const text = d3.select(this);
      text.append("tspan").attr("x", 12).text(node.data.label);
      text.append("tspan")
        .attr("x", 12)
        .attr("dy", 18)
        .attr("fill", textColor)
        .attr("fill-opacity", 0.78)
        .attr("font-weight", 600)
        .text(formatTooltipValue(node.data.value));
    });
  cell.on("mousemove", (event, node) => {
    const rect = target.getBoundingClientRect();
    tooltip.textContent = node.data.label + ": " + formatTooltipValue(node.data.value);
    tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
    tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
    tooltip.hidden = false;
    d3.select(event.currentTarget).select("rect").attr("stroke", gridColor).attr("fill-opacity", 1);
  });
  cell.on("mouseleave", (event) => {
    tooltip.hidden = true;
    d3.select(event.currentTarget).select("rect").attr("stroke", tooltipBg).attr("fill-opacity", 0.88);
  });
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
  target.append(svg.node());
  target.append(tooltip);
})();`;
}
function renderReportAreaChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand);
  const primaryColor = normalizeChartColor(palette[0]) || "#0F82F5";
  const fillColor = hexToRgba(primaryColor, 0.24);
  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, "target")}
  const parseX = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed;
  };
  const data = ${jsValue(chart.points)}.map((point) => ({
    x: parseX(point.x),
    label: point.x,
    y: Number(point.y)
  }));
  const usesOrdinalXScale = data.every((point) => !(point.x instanceof Date));
  const tickStep = Math.max(1, Math.ceil(data.length / 6));
  const xTickValues = data
    .filter((point, index) => data.length <= 8 || index === 0 || index === data.length - 1 || index % tickStep === 0)
    .map((point) => point.x);
  const xScale = {
    grid: true,
    label: null,
    ticks: xTickValues,
    tickFormat: (value) => value instanceof Date ? value.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : String(value)
  };
  if (usesOrdinalXScale) {
    xScale.domain = Array.from(new Set(data.map((point) => point.x)));
  }
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  target.append(Plot.plot({
    width: Math.max(320, target.clientWidth || 720),
    height: ${chart.height},
    marginLeft: 58,
    marginRight: 24,
    marginTop: 18,
    marginBottom: 42,
    style: {
      background: "transparent",
      color: tickColor,
      fontFamily: rootStyle.getPropertyValue("font-family").trim() || "Arial, sans-serif"
    },
    x: xScale,
    y: {
      grid: true,
      label: null,
      tickFormat: (value) => Number(value).toLocaleString()
    },
    marks: [
      Plot.ruleY([0], { stroke: gridColor }),
      Plot.areaY(data, { x: "x", y: "y", fill: ${jsString(fillColor)} }),
      Plot.lineY(data, { x: "x", y: "y", stroke: ${jsString(primaryColor)}, strokeWidth: 3, curve: "catmull-rom" }),
      Plot.dot(data, { x: "x", y: "y", fill: ${jsString(primaryColor)}, stroke: tooltipBg, r: 4 }),
      Plot.tip(data, Plot.pointerX({
        x: "x",
        y: "y",
        title: (point) => point.label + ": " + formatTooltipValue(point.y),
        fill: tooltipBg,
        stroke: gridColor,
        fontSize: 12,
        color: textColor
      }))
    ]
  }));
  target.append(tooltip);
  target.addEventListener("mousemove", (event) => {
    const rect = target.getBoundingClientRect();
    const plotLeft = 58;
    const plotRight = 24;
    const plotTop = 18;
    const plotBottom = 42;
    const plotWidth = Math.max(1, rect.width - plotLeft - plotRight);
    const plotHeight = Math.max(1, rect.height - plotTop - plotBottom);
    const relativeX = Math.min(1, Math.max(0, (event.clientX - rect.left - plotLeft) / plotWidth));
    const index = Math.min(data.length - 1, Math.max(0, Math.round(relativeX * (data.length - 1))));
    const point = data[index];
    const maxY = Math.max(...data.map((item) => item.y), 0);
    const minY = Math.min(...data.map((item) => item.y), 0);
    const yRange = Math.max(1, maxY - minY);
    const x = plotLeft + (data.length <= 1 ? 0 : (index / (data.length - 1)) * plotWidth);
    const y = plotTop + (1 - (point.y - minY) / yRange) * plotHeight;
    tooltip.textContent = point.label + ": " + formatTooltipValue(point.y);
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.hidden = false;
  });
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
})();`;
}
function reportChartPalette(brand = {}) {
  const colors = brand.colors || {};
  return [
    colors.blue || "0F82F5",
    colors.cyan || colors.lightBlue || "59D6FD",
    colors.purple || "5143D5",
    colors.orange || "F9935B",
    colors.green || "66CC8E",
    colors.red || "FC5161"
  ];
}
function normalizeChartColor(value = "") {
  const token = String(value || "").trim();
  const hex2 = token.match(/^#?([0-9a-f]{6})$/i);
  return hex2 ? `#${hex2[1]}` : token;
}
function hexToRgba(value, alpha = 1) {
  const hex2 = String(value || "").trim().match(/^#?([0-9a-f]{6})$/i);
  if (!hex2) return value;
  const numeric = Number.parseInt(hex2[1], 16);
  const red = numeric >> 16 & 255;
  const green = numeric >> 8 & 255;
  const blue = numeric & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
function formatBinLabel(value) {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
function quantile(values, fraction) {
  if (!values.length) return 0;
  const position = (values.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return values[lower];
  const weight = position - lower;
  return values[lower] * (1 - weight) + values[upper] * weight;
}
function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

// src/report-components.js
var dataRefChartTypes = ["bar", "line", "doughnut", "waterfall", "bullet", "pareto", "grouped-bar", "stacked-bar"];
var dataRefChartTypeList = formatReportList(dataRefChartTypes);
var singleSeriesLabelValueChartTypes = /* @__PURE__ */ new Set([
  "bar",
  "line",
  "doughnut",
  "area",
  "treemap",
  "funnel",
  "waterfall",
  "bullet",
  "scatter",
  "histogram",
  "pareto"
]);
var knownReportTags = /* @__PURE__ */ new Set([
  "report-accent-card",
  "report-badge",
  "report-callout",
  "report-card-grid",
  "report-card",
  "report-chart",
  "report-cite",
  "report-data-table",
  "report-dataset",
  "report-figure",
  "report-insight",
  "report-key-values",
  "report-metric-grid",
  "report-metric",
  "report-page-break",
  "report-rate-bars",
  "report-recommendation",
  "report-source-list",
  "report-source-note",
  "report-source",
  "report-timeline",
  "report-event"
]);
var reportComponentAttributeAllowList = /* @__PURE__ */ new Map([
  ["report-accent-card", ["accent", "color", "tone", "title", "body", "text"]],
  ["report-badge", ["label", "variant", "color", "tone", "status"]],
  ["report-callout", ["variant", "type", "tone", "title", "text"]],
  ["report-card-grid", ["title", "columns", "cols"]],
  ["report-card", ["title", "body", "text", "accent", "color", "tone"]],
  [
    "report-chart",
    [
      "type",
      "labels",
      "values",
      "targets",
      "target-values",
      "target",
      "title",
      "series",
      "datasets",
      "series-labels",
      "colors",
      "height",
      "id",
      "chart-id",
      "value-prefix",
      "prefix",
      "value-suffix",
      "suffix",
      "x-label",
      "x-axis-label",
      "x-title",
      "y-label",
      "y-axis-label",
      "y-title",
      "data-ref",
      "dataset",
      "label-column",
      "label-field",
      "label",
      "value-column",
      "value-field",
      "value",
      "series-columns",
      "value-columns",
      "series-fields",
      "value-fields",
      "target-column",
      "target-field",
      "x-column",
      "x-field",
      "y-column",
      "y-field",
      "r-column",
      "radius-column",
      "bins",
      "bucket-count",
      "buckets",
      "points",
      "data",
      "links",
      "flows",
      "edges",
      "x-labels",
      "columns",
      "x",
      "y-labels",
      "rows",
      "y",
      "matrix",
      "series-values",
      "aria-label"
    ]
  ],
  ["report-cite", ["source", "ref", "id", "label"]],
  ["report-data-table", ["title", "columns", "headers", "types", "formats", "rows", "data", "compact", "dense", "align", "alignment", "totals", "total", "footer", "highlights", "highlight", "data-ref", "dataset", "caption", "source"]],
  ["report-dataset", ["id", "name", "columns", "headers", "rows", "data"]],
  ["report-figure", ["src", "image", "alt", "caption", "source", "size", "width"]],
  ["report-insight", ["variant", "type", "tone", "title", "finding", "text", "body", "evidence", "impact", "action", "next"]],
  ["report-key-values", ["title", "items", "data", "columns", "cols"]],
  ["report-metric-grid", []],
  ["report-metric", ["value", "label", "sub", "delta", "change", "direction", "trend", "accent", "color"]],
  ["report-page-break", ["label", "title"]],
  ["report-rate-bars", ["title", "labels", "values", "shares", "percentages", "percents", "colors", "aria-label"]],
  ["report-recommendation", ["title", "body", "text", "owner", "priority", "due", "date", "status", "state"]],
  ["report-source-list", ["title", "label"]],
  ["report-source-note", ["title", "label", "text", "body", "source", "date", "period"]],
  ["report-source", ["id", "source-id", "title", "label", "publisher", "source", "date", "period", "url", "href", "note", "text", "body"]],
  ["report-timeline", ["title"]],
  ["report-event", ["date", "time", "period", "title", "body", "text", "status", "variant", "tone"]]
]);
function compileReportComponents(source, options = {}) {
  const context = reportComponentContext(options);
  validateReportComponentSyntax(source, context);
  const parseSource = expandSelfClosingComponentTags(source, knownReportTags, "report");
  const root = load(`<root>${parseSource}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true
  });
  validateReportComponentTree(root, context);
  validateReportComponentAttributes(root, context);
  const scripts = [];
  const usedIds = /* @__PURE__ */ new Set();
  const sourceRegistry = /* @__PURE__ */ new Map();
  const datasetRegistry = /* @__PURE__ */ new Map();
  root("report-dataset").each((_, element) => {
    const datasetElement = root(element);
    const dataset = parseReportDataset(datasetElement);
    prepareReportDataset(dataset, datasetRegistry, context);
    datasetElement.remove();
  });
  root("report-metric-grid").each((_, element) => {
    const metricGridElement = root(element);
    const metricGrid = parseReportMetricGrid(root, metricGridElement);
    validateReportMetricGrid(metricGrid, context);
    metricGridElement.replaceWith(renderReportMetricGridHtml(metricGrid));
  });
  root("report-rate-bars").each((_, element) => {
    const rateBarsElement = root(element);
    const rateBars = parseReportRateBars(rateBarsElement);
    validateReportRateBars(rateBars, context);
    rateBarsElement.replaceWith(renderReportRateBarsHtml(rateBars, context));
  });
  root("report-callout").each((_, element) => {
    const calloutElement = root(element);
    const callout = parseReportCallout(calloutElement);
    validateReportCallout(callout, context);
    calloutElement.replaceWith(renderReportCalloutHtml(callout));
  });
  root("report-figure").each((_, element) => {
    const figureElement = root(element);
    const figure = parseReportFigure(figureElement);
    validateReportFigure(figure, context);
    figureElement.replaceWith(renderReportFigureHtml(figure));
  });
  root("report-data-table").each((_, element) => {
    const tableElement = root(element);
    const table2 = parseReportDataTable(tableElement);
    resolveReportDataTableDataset(table2, datasetRegistry, context);
    validateReportDataTable(table2, context);
    tableElement.replaceWith(renderReportDataTableHtml(table2));
  });
  root("report-key-values").each((_, element) => {
    const keyValuesElement = root(element);
    const keyValues = parseReportKeyValues(keyValuesElement);
    validateReportKeyValues(keyValues, context);
    keyValuesElement.replaceWith(renderReportKeyValuesHtml(keyValues));
  });
  root("report-insight").each((_, element) => {
    const insightElement = root(element);
    const insight = parseReportInsight(insightElement);
    validateReportInsight(insight, context);
    insightElement.replaceWith(renderReportInsightHtml(insight));
  });
  root("report-recommendation").each((_, element) => {
    const recommendationElement = root(element);
    const recommendation = parseReportRecommendation(recommendationElement);
    validateReportRecommendation(recommendation, context);
    recommendationElement.replaceWith(renderReportRecommendationHtml(recommendation));
  });
  root("report-page-break").each((_, element) => {
    const pageBreakElement = root(element);
    const pageBreak = parseReportPageBreak(pageBreakElement);
    pageBreakElement.replaceWith(renderReportPageBreakHtml(pageBreak));
  });
  root("report-card-grid").each((_, element) => {
    const cardGridElement = root(element);
    const cardGrid = parseReportCardGrid(root, cardGridElement);
    validateReportCardGrid(cardGrid, context);
    cardGridElement.replaceWith(renderReportCardGridHtml(cardGrid));
  });
  root("report-source-note").each((_, element) => {
    const sourceNoteElement = root(element);
    const sourceNote = parseReportSourceNote(sourceNoteElement);
    validateReportSourceNote(sourceNote, context);
    sourceNoteElement.replaceWith(renderReportSourceNoteHtml(sourceNote));
  });
  root("report-source-list").each((_, element) => {
    const sourceListElement = root(element);
    const sourceList = parseReportSourceList(root, sourceListElement);
    prepareReportSourceList(sourceList, sourceRegistry, context);
    sourceListElement.replaceWith(renderReportSourceListHtml(sourceList));
  });
  root("report-cite").each((_, element) => {
    const citeElement = root(element);
    const cite = parseReportCite(citeElement);
    resolveReportCite(cite, sourceRegistry, context);
    citeElement.replaceWith(renderReportCiteHtml(cite));
  });
  root("report-timeline").each((_, element) => {
    const timelineElement = root(element);
    const timeline = parseReportTimeline(root, timelineElement);
    validateReportTimeline(timeline, context);
    timelineElement.replaceWith(renderReportTimelineHtml(timeline));
  });
  root("report-accent-card").each((_, element) => {
    const cardElement = root(element);
    const card = parseReportAccentCard(cardElement);
    validateReportAccentCard(card, context);
    cardElement.replaceWith(renderReportAccentCardHtml(card));
  });
  root("report-badge").each((_, element) => {
    const badgeElement = root(element);
    const badge = parseReportBadge(badgeElement);
    validateReportBadge(badge, context);
    badgeElement.replaceWith(renderReportBadgeHtml(badge));
  });
  root("report-chart").each((index, element) => {
    const chartElement = root(element);
    const chart = parseReportChart(chartElement, index);
    resolveReportChartDataset(chart, datasetRegistry, context);
    chart.id = uniqueDomId(chart.id || chart.generatedId, usedIds, "report-chart");
    validateReportChart(chart, context);
    scripts.push(renderReportChartScript(chart, context));
    chartElement.replaceWith(renderReportChartHtml(chart));
  });
  const compiledSource = root("root").html() || source;
  return {
    source: appendReportComponentScripts(compiledSource, scripts),
    scripts
  };
}
function prepareReportDataset(dataset, datasetRegistry, context) {
  if (!dataset.id) {
    fail("report-dataset requires an id attribute.", context);
  }
  if (!/^[a-z0-9_-]+$/i.test(dataset.id)) {
    fail("report-dataset id may contain only letters, numbers, hyphens, and underscores.", context);
  }
  if (datasetRegistry.has(dataset.id)) {
    fail(`Duplicate report-dataset id "${dataset.id}". Dataset ids must be unique.`, context);
  }
  if (dataset.columns.length === 0) {
    fail(`report-dataset "${dataset.id}" requires columns or headers.`, context);
  }
  if (dataset.rows.length === 0) {
    fail(`report-dataset "${dataset.id}" requires at least one row in rows or data.`, context);
  }
  dataset.rows.forEach((row, rowIndex) => {
    if (row.length !== dataset.columns.length) {
      fail(
        `report-dataset "${dataset.id}" row ${rowIndex + 1} has ${row.length} cell(s), but ${dataset.columns.length} column(s) were declared.`,
        context
      );
    }
  });
  datasetRegistry.set(dataset.id, dataset);
}
function formatReportList(items = []) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
function resolveReportDataTableDataset(table2, datasetRegistry, context) {
  if (!table2.dataRef) return;
  const dataset = datasetRegistry.get(table2.dataRef);
  if (!dataset) {
    fail(`report-data-table data-ref "${table2.dataRef}" does not match a report-dataset id.`, context);
  }
  if (table2.columns.length > 0 || table2.rows.length > 0) {
    fail("report-data-table data-ref cannot be combined with columns or rows. Use the dataset or inline table data, not both.", context);
  }
  table2.columns = [...dataset.columns];
  table2.rows = dataset.rows.map((row) => [...row]);
  if (table2.types.length === 0) {
    table2.types = table2.columns.map(() => "text");
  }
}
function resolveReportChartDataset(chart, datasetRegistry, context) {
  if (!chart.dataRef) return;
  const dataset = datasetRegistry.get(chart.dataRef);
  if (!dataset) {
    fail(`report-chart data-ref "${chart.dataRef}" does not match a report-dataset id.`, context);
  }
  const supportedChartDatasetTypes = new Set(dataRefChartTypes);
  if (!supportedChartDatasetTypes.has(chart.chartType)) {
    fail(
      `report-chart data-ref currently supports ${dataRefChartTypeList} charts. Ask the skill maker to add dataset support for type "${chart.chartType}".`,
      context
    );
  }
  if (chart.labels.length > 0 || chart.values.length > 0 || chart.targets.length > 0 || chart.matrix.length > 0) {
    fail(
      "report-chart data-ref cannot be combined with labels, values, targets, or matrix data. Use the dataset or inline chart data, not both.",
      context
    );
  }
  const labelIndex = reportDatasetColumnIndex(dataset, chart.labelColumn || dataset.columns[0], "label-column", context);
  if (chart.chartType === "grouped-bar" || chart.chartType === "stacked-bar") {
    resolveReportMultiSeriesChartDataset(chart, dataset, labelIndex, context);
    return;
  }
  const defaultValueColumn = chart.valueColumn || dataset.columns.find((column, index) => index !== labelIndex) || "";
  const valueIndex = reportDatasetColumnIndex(dataset, defaultValueColumn, "value-column", context);
  chart.labels = dataset.rows.map((row) => row[labelIndex]);
  chart.values = dataset.rows.map((row) => parseDatasetNumber(row[valueIndex]));
  if (chart.chartType === "bullet") {
    const targetIndex = reportDatasetColumnIndex(dataset, chart.targetColumn, "target-column", context);
    chart.targets = dataset.rows.map((row) => parseDatasetNumber(row[targetIndex]));
  }
}
function resolveReportMultiSeriesChartDataset(chart, dataset, labelIndex, context) {
  if (chart.valueColumn) {
    fail("report-chart data-ref grouped-bar and stacked-bar charts use series-columns, not value-column.", context);
  }
  const explicitColumns = chart.seriesColumns || [];
  const seriesIndexes = explicitColumns.length > 0 ? explicitColumns.map((column) => reportDatasetColumnIndex(dataset, column, "series-columns", context)) : dataset.columns.map((_, index) => index).filter((index) => index !== labelIndex && reportDatasetColumnIsNumeric(dataset, index));
  if (seriesIndexes.length === 0) {
    fail("report-chart data-ref grouped-bar and stacked-bar charts require series-columns or at least one numeric dataset column.", context);
  }
  const duplicateColumns = seriesIndexes.filter((index, position) => seriesIndexes.indexOf(index) !== position);
  if (duplicateColumns.length > 0) {
    fail("report-chart data-ref series-columns must not repeat dataset columns.", context);
  }
  if (chart.seriesNames.length > 0 && chart.seriesNames.length !== seriesIndexes.length) {
    fail("report-chart data-ref series-labels must match the number of selected series-columns.", context);
  }
  chart.labels = dataset.rows.map((row) => row[labelIndex]);
  chart.seriesNames = chart.seriesNames.length > 0 ? chart.seriesNames : seriesIndexes.map((index) => dataset.columns[index]);
  chart.matrix = dataset.rows.map(
    (row, rowIndex) => seriesIndexes.map((columnIndex) => {
      const value = parseDatasetNumber(row[columnIndex]);
      if (!Number.isFinite(value)) {
        fail(
          `report-chart data-ref row ${rowIndex + 1} column "${dataset.columns[columnIndex]}" values must all be numeric.`,
          context
        );
      }
      return value;
    })
  );
}
function reportDatasetColumnIndex(dataset, columnName, attributeName, context) {
  const normalized = String(columnName || "").trim().toLowerCase();
  if (!normalized) {
    fail(`report-chart data-ref requires ${attributeName}.`, context);
  }
  const index = dataset.columns.findIndex((column) => column.trim().toLowerCase() === normalized);
  if (index === -1) {
    fail(`report dataset "${dataset.id}" does not include ${attributeName} "${columnName}".`, context);
  }
  return index;
}
function reportDatasetColumnIsNumeric(dataset, columnIndex) {
  return dataset.rows.every((row) => Number.isFinite(parseDatasetNumber(row[columnIndex])));
}
function parseDatasetNumber(value) {
  return Number(String(value || "").replace(/,/g, "").replace(/%$/, "").trim());
}
function validateReportComponentTree(root, context) {
  root("report-metric").each((_, element) => {
    const parent = root(element).parent();
    if (!parent.is("report-metric-grid")) {
      fail("<report-metric> must be placed directly inside <report-metric-grid>.", context);
    }
  });
  root("report-card").each((_, element) => {
    const parent = root(element).parent();
    if (!parent.is("report-card-grid")) {
      fail("<report-card> must be placed directly inside <report-card-grid>.", context);
    }
  });
  root("report-event").each((_, element) => {
    const parent = root(element).parent();
    if (!parent.is("report-timeline")) {
      fail("<report-event> must be placed directly inside <report-timeline>.", context);
    }
  });
  root("report-source").each((_, element) => {
    const parent = root(element).parent();
    if (!parent.is("report-source-list")) {
      fail("<report-source> must be placed directly inside <report-source-list>.", context);
    }
  });
}
function validateReportComponentAttributes(root, context) {
  for (const [tag, supportedAttributes] of reportComponentAttributeAllowList.entries()) {
    const supported = new Set(supportedAttributes);
    root(tag).each((_, element) => {
      const attributes = root(element).attr() || {};
      const unsupported = Object.keys(attributes).find((attribute2) => !supported.has(attribute2));
      if (!unsupported) return;
      fail(unsupportedReportAttributeMessage(tag, unsupported, supportedAttributes), context);
    });
  }
}
function unsupportedReportAttributeMessage(tag, attribute2, supportedAttributes = []) {
  const supported = supportedAttributes.length ? supportedAttributes.join(", ") : "none";
  if (tag === "report-source" && attribute2 === "description") {
    return `Unsupported <${tag}> attribute "description". Use note="..." instead, or put the source detail in the <${tag}> body. Supported attributes: ${supported}.`;
  }
  return `Unsupported <${tag}> attribute "${attribute2}". Fix the report Markdown or ask the skill maker to add support. Supported attributes: ${supported}.`;
}
function appendReportComponentScripts(source, scripts = []) {
  if (!scripts.length) return source;
  return `${source}

<script data-report-component-script="chart">
window.__marpReportComponentsReady = new Promise(function(resolve) {
  function finish() {
    requestAnimationFrame(function() {
      requestAnimationFrame(resolve);
    });
  }
  document.addEventListener("DOMContentLoaded", function() {
${scripts.map((script) => indent(script, 2)).join("\n\n")}
    finish();
  });
});
</script>`;
}
function validateReportComponentSyntax(source, context) {
  const stack = [];
  const tagPattern = /<\/?\s*(report-[a-z0-9-]+)\b[^>]*>/gi;
  for (const match2 of source.matchAll(tagPattern)) {
    const raw = match2[0];
    const tag = match2[1].toLowerCase();
    const line = lineNumberAt(source, match2.index);
    if (!knownReportTags.has(tag)) {
      fail(
        `Report component <${tag}> is not available. Use a supported report-* component or ask the skill maker to add it.`,
        context,
        line
      );
    }
    const isClosing = /^<\s*\//.test(raw);
    const isSelfClosing = /\/\s*>$/.test(raw);
    if (isClosing) {
      const opened = stack.pop();
      if (!opened) fail(`Closing </${tag}> has no matching opening tag.`, context, line);
      if (opened.tag !== tag) {
        fail(
          `Mismatched report component tags: opened <${opened.tag}> on line ${opened.line}, but found </${tag}>.`,
          context,
          line
        );
      }
    } else if (!isSelfClosing) {
      stack.push({ tag, line });
    }
  }
  if (stack.length > 0) {
    const opened = stack[stack.length - 1];
    fail(`Unclosed report component <${opened.tag}> opened on line ${opened.line}.`, context, opened.line);
  }
}
function validateReportChart(chart, context) {
  const supportedTypes = /* @__PURE__ */ new Set([
    "bar",
    "line",
    "doughnut",
    "area",
    "treemap",
    "funnel",
    "waterfall",
    "bullet",
    "scatter",
    "bubble",
    "histogram",
    "boxplot",
    "pareto",
    "sankey",
    "grouped-bar",
    "stacked-bar",
    "heatmap"
  ]);
  if (!supportedTypes.has(chart.chartType)) {
    fail(
      `report-chart type "${chart.chartType}" is not available. Supported types: bar, line, doughnut, area, treemap, funnel, grouped-bar, stacked-bar, heatmap, waterfall, bullet, scatter, bubble, histogram, boxplot, pareto, sankey. Ask the skill maker to add missing chart types.`,
      context
    );
  }
  if (singleSeriesLabelValueChartTypes.has(chart.chartType)) {
    validateReportChartLabelValueCount(chart, context);
  }
  if (chart.chartType === "area") {
    if (chart.points.length === 0) {
      fail('report-chart type="area" requires non-empty points or labels/values attributes.', context);
    }
    if (chart.points.some((point) => !point.x || !Number.isFinite(point.y))) {
      fail("report-chart area points must be x:y pairs with numeric y values.", context);
    }
    return;
  }
  if (chart.chartType === "treemap") {
    validateReportChartLabelsAndValues(chart, context);
    if (chart.values.some((value) => value < 0)) {
      fail("report-chart treemap values must be zero or positive.", context);
    }
    if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
      fail("report-chart treemap values must sum to more than zero.", context);
    }
    return;
  }
  if (chart.chartType === "funnel") {
    validateReportChartLabelsAndValues(chart, context);
    if (chart.values.some((value) => value < 0)) {
      fail("report-chart funnel values must be zero or positive.", context);
    }
    if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
      fail("report-chart funnel values must sum to more than zero.", context);
    }
    return;
  }
  if (chart.chartType === "grouped-bar" || chart.chartType === "stacked-bar") {
    validateReportMultiSeriesChart(chart, context);
    return;
  }
  if (chart.chartType === "heatmap") {
    validateReportHeatmapChart(chart, context);
    return;
  }
  if (chart.chartType === "scatter") {
    validateReportScatterChart(chart, context);
    return;
  }
  if (chart.chartType === "bubble") {
    validateReportBubbleChart(chart, context);
    return;
  }
  if (chart.chartType === "histogram") {
    validateReportHistogramChart(chart, context);
    return;
  }
  if (chart.chartType === "boxplot") {
    validateReportBoxplotChart(chart, context);
    return;
  }
  if (chart.chartType === "pareto") {
    validateReportParetoChart(chart, context);
    return;
  }
  if (chart.chartType === "sankey") {
    validateReportSankeyChart(chart, context);
    return;
  }
  validateReportChartLabelsAndValues(chart, context);
  if (chart.chartType === "bullet") {
    validateReportBulletChart(chart, context);
    return;
  }
  if (chart.chartType === "waterfall") {
    return;
  }
  if (chart.chartType === "doughnut") {
    if (chart.values.some((value) => value < 0)) {
      fail("report-chart doughnut values must be zero or positive.", context);
    }
    if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
      fail("report-chart doughnut values must sum to more than zero.", context);
    }
  }
}
function validateReportChartLabelsAndValues(chart, context) {
  if (chart.labels.length === 0 || chart.values.length === 0) {
    fail("report-chart requires non-empty labels and values attributes.", context);
  }
  validateReportChartLabelValueCount(chart, context);
  if (chart.values.some((value) => !Number.isFinite(value))) {
    fail("report-chart values must all be numeric.", context);
  }
}
function validateReportChartLabelValueCount(chart, context) {
  if (chart.labels.length > 0 && chart.values.length > 0 && chart.labels.length !== chart.values.length) {
    fail(
      `report-chart type="${chart.chartType}" labels/values length mismatch: ${chart.labels.length} label(s), ${chart.values.length} value(s).`,
      context
    );
  }
}
function validateReportParetoChart(chart, context) {
  validateReportChartLabelsAndValues(chart, context);
  if (chart.values.some((value) => value < 0)) {
    fail("report-chart pareto values must be zero or positive.", context);
  }
  if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail("report-chart pareto values must sum to more than zero.", context);
  }
}
function validateReportSankeyChart(chart, context) {
  if (chart.links.length === 0) {
    fail('report-chart type="sankey" requires non-empty links.', context);
  }
  chart.links.forEach((link2, index) => {
    if (!link2.source || !link2.target) {
      fail(`report-chart type="sankey" link ${index + 1} must use source>target:value syntax.`, context);
    }
    if (!Number.isFinite(link2.value)) {
      fail(`report-chart type="sankey" link ${index + 1} value must be numeric.`, context);
    }
    if (link2.value <= 0) {
      fail(`report-chart type="sankey" link ${index + 1} value must be greater than zero.`, context);
    }
    if (link2.source === link2.target) {
      fail(`report-chart type="sankey" link ${index + 1} cannot connect a node to itself.`, context);
    }
  });
  validateReportSankeyAcyclic(chart, context);
}
function validateReportSankeyAcyclic(chart, context) {
  const graph = /* @__PURE__ */ new Map();
  chart.links.forEach((link2) => {
    if (!graph.has(link2.source)) graph.set(link2.source, []);
    graph.get(link2.source).push(link2.target);
    if (!graph.has(link2.target)) graph.set(link2.target, []);
  });
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (node) => {
    if (visiting.has(node)) return false;
    if (visited.has(node)) return true;
    visiting.add(node);
    for (const next of graph.get(node) || []) {
      if (!visit(next)) return false;
    }
    visiting.delete(node);
    visited.add(node);
    return true;
  };
  for (const node of graph.keys()) {
    if (!visit(node)) {
      fail('report-chart type="sankey" links must not contain cycles.', context);
    }
  }
}
function validateReportBoxplotChart(chart, context) {
  if (chart.labels.length === 0) {
    fail('report-chart type="boxplot" requires non-empty labels.', context);
  }
  if (chart.matrix.length === 0) {
    fail('report-chart type="boxplot" requires matrix values in values, matrix, or series-values.', context);
  }
  if (chart.matrix.length !== chart.labels.length) {
    fail(
      `report-chart type="boxplot" labels/rows length mismatch: ${chart.labels.length} label(s), ${chart.matrix.length} row(s).`,
      context
    );
  }
  chart.matrix.forEach((row, rowIndex) => {
    if (row.length < 5) {
      fail(`report-chart type="boxplot" row ${rowIndex + 1} must include at least 5 numeric observations.`, context);
    }
    if (row.some((value) => !Number.isFinite(value))) {
      fail(`report-chart type="boxplot" row ${rowIndex + 1} values must all be numeric.`, context);
    }
  });
}
function validateReportHistogramChart(chart, context) {
  if (chart.values.length === 0) {
    fail('report-chart type="histogram" requires non-empty numeric values.', context);
  }
  if (chart.values.some((value) => !Number.isFinite(value))) {
    fail('report-chart type="histogram" values must all be numeric.', context);
  }
  if (!Number.isInteger(chart.binCount) || chart.binCount < 2 || chart.binCount > 30) {
    fail('report-chart type="histogram" bins must be an integer between 2 and 30.', context);
  }
}
function validateReportBubbleChart(chart, context) {
  if (chart.points.length === 0) {
    fail('report-chart type="bubble" requires non-empty points as numeric x:y:r triples.', context);
  }
  if (chart.points.some((point) => !Number.isFinite(Number(point.x)) || !Number.isFinite(point.y) || !Number.isFinite(point.r))) {
    fail('report-chart type="bubble" points must be numeric x:y:r triples.', context);
  }
  if (chart.points.some((point) => point.r <= 0)) {
    fail('report-chart type="bubble" point radii must be greater than zero.', context);
  }
}
function validateReportScatterChart(chart, context) {
  if (chart.points.length === 0) {
    fail('report-chart type="scatter" requires non-empty points or numeric labels/values attributes.', context);
  }
  if (chart.points.some((point) => !Number.isFinite(Number(point.x)) || !Number.isFinite(point.y))) {
    fail('report-chart type="scatter" points must be numeric x:y pairs.', context);
  }
}
function validateReportBulletChart(chart, context) {
  if (chart.targets.length === 0) {
    fail('report-chart type="bullet" requires targets or target-values.', context);
  }
  if (chart.targets.length !== chart.labels.length) {
    fail(
      `report-chart type="bullet" labels/targets length mismatch: ${chart.labels.length} label(s), ${chart.targets.length} target(s).`,
      context
    );
  }
  if (chart.targets.some((value) => !Number.isFinite(value))) {
    fail('report-chart type="bullet" targets must all be numeric.', context);
  }
  if (chart.values.some((value) => value < 0) || chart.targets.some((value) => value < 0)) {
    fail('report-chart type="bullet" values and targets must be zero or positive.', context);
  }
  if ([...chart.values, ...chart.targets].reduce((max, value) => Math.max(max, value), 0) <= 0) {
    fail('report-chart type="bullet" values and targets must include at least one value above zero.', context);
  }
}
function validateReportMultiSeriesChart(chart, context) {
  if (chart.labels.length === 0) {
    fail(`report-chart type="${chart.chartType}" requires non-empty labels.`, context);
  }
  if (chart.seriesNames.length === 0) {
    fail(`report-chart type="${chart.chartType}" requires series names in the series attribute.`, context);
  }
  if (chart.matrix.length === 0) {
    fail(`report-chart type="${chart.chartType}" requires matrix values in values, matrix, or series-values.`, context);
  }
  if (chart.matrix.length !== chart.labels.length) {
    fail(
      `report-chart type="${chart.chartType}" labels/rows length mismatch: ${chart.labels.length} label(s), ${chart.matrix.length} row(s).`,
      context
    );
  }
  chart.matrix.forEach((row, rowIndex) => {
    if (row.length !== chart.seriesNames.length) {
      fail(
        `report-chart type="${chart.chartType}" row ${rowIndex + 1} has ${row.length} value(s), but ${chart.seriesNames.length} series were declared.`,
        context
      );
    }
    if (row.some((value) => !Number.isFinite(value))) {
      fail(`report-chart type="${chart.chartType}" row ${rowIndex + 1} values must all be numeric.`, context);
    }
  });
}
function validateReportHeatmapChart(chart, context) {
  if (chart.xLabels.length === 0) {
    fail('report-chart type="heatmap" requires x-labels or columns.', context);
  }
  if (chart.yLabels.length === 0) {
    fail('report-chart type="heatmap" requires y-labels or rows.', context);
  }
  if (chart.matrix.length === 0) {
    fail('report-chart type="heatmap" requires matrix values in values, matrix, or series-values.', context);
  }
  if (chart.matrix.length !== chart.yLabels.length) {
    fail(
      `report-chart type="heatmap" y-labels/rows length mismatch: ${chart.yLabels.length} y-label(s), ${chart.matrix.length} row(s).`,
      context
    );
  }
  chart.matrix.forEach((row, rowIndex) => {
    if (row.length !== chart.xLabels.length) {
      fail(
        `report-chart type="heatmap" row ${rowIndex + 1} has ${row.length} value(s), but ${chart.xLabels.length} x-label(s) were declared.`,
        context
      );
    }
    if (row.some((value) => !Number.isFinite(value))) {
      fail(`report-chart type="heatmap" row ${rowIndex + 1} values must all be numeric.`, context);
    }
  });
}
function validateReportMetricGrid(metricGrid, context) {
  if (metricGrid.metrics.length === 0) {
    fail("report-metric-grid must include at least one report-metric.", context);
  }
  metricGrid.metrics.forEach((metric, index) => {
    if (!metric.value && !metric.label) {
      fail(`report-metric at position ${index + 1} must include value and/or label.`, context);
    }
  });
}
function validateReportFigure(figure, context) {
  const sizes = /* @__PURE__ */ new Set(["narrow", "normal", "wide"]);
  if (!figure.src) {
    fail("report-figure requires a src attribute.", context);
  }
  if (!figure.alt) {
    fail("report-figure requires an alt attribute for accessibility.", context);
  }
  if (!sizes.has(figure.size)) {
    fail("report-figure size must be narrow, normal, or wide.", context);
  }
}
function validateReportDataTable(table2, context) {
  const supportedTypes = /* @__PURE__ */ new Set(["text", "number", "percent", "status"]);
  const supportedAlignments = /* @__PURE__ */ new Set(["left", "center", "right"]);
  if (table2.columns.length === 0) {
    fail("report-data-table requires columns or headers.", context);
  }
  if (table2.rows.length === 0) {
    fail("report-data-table requires at least one row in rows or data.", context);
  }
  if (isBooleanAttributeToken(table2.rawTotals)) {
    fail('report-data-table totals must be a pipe-separated footer row, not a boolean. Example: totals="Total|5580|71.9|".', context);
  }
  if (table2.types.length !== table2.columns.length) {
    fail(
      `report-data-table types/columns length mismatch: ${table2.types.length} type(s), ${table2.columns.length} column(s).`,
      context
    );
  }
  table2.types.forEach((type) => {
    if (!supportedTypes.has(type)) {
      fail(
        `report-data-table type "${type}" is not available. Supported types: text, number, percent, status. Ask the skill maker to add missing table cell types.`,
        context
      );
    }
  });
  if (table2.align.length > 0 && table2.align.length !== table2.columns.length) {
    fail(
      `report-data-table align/columns length mismatch: ${table2.align.length} alignment(s), ${table2.columns.length} column(s).`,
      context
    );
  }
  table2.align.forEach((align) => {
    if (!supportedAlignments.has(align)) {
      fail("report-data-table align supports only left, center, or right.", context);
    }
  });
  if (table2.totals.length > 0) {
    if (table2.totals.length !== table2.columns.length) {
      fail(
        `report-data-table totals row has ${table2.totals.length} cell(s), but ${table2.columns.length} column(s) were declared.`,
        context
      );
    }
    table2.totals.forEach((value, cellIndex) => {
      const type = table2.types[cellIndex];
      if ((type === "number" || type === "percent") && !Number.isFinite(parseDataTableNumber(value))) {
        fail(`report-data-table totals column "${table2.columns[cellIndex]}" must be numeric.`, context);
      }
    });
  }
  table2.highlights.forEach((highlight) => {
    if (!Number.isInteger(highlight.row) || highlight.row < 1 || highlight.row > table2.rows.length) {
      fail("report-data-table highlights must target an existing 1-based row number.", context);
    }
    if (highlight.column && (!Number.isInteger(highlight.column) || highlight.column < 1 || highlight.column > table2.columns.length)) {
      fail("report-data-table cell highlights must target an existing 1-based column number.", context);
    }
    if (!isKnownBadgeVariant(highlight.rawVariant)) {
      fail(
        `report-data-table highlight "${highlight.rawVariant}" is not available. Supported highlights: blue, green, orange, red, muted.`,
        context
      );
    }
  });
  table2.rows.forEach((row, index) => {
    if (row.length !== table2.columns.length) {
      fail(
        `report-data-table row ${index + 1} has ${row.length} cell(s), but ${table2.columns.length} column(s) were declared.`,
        context
      );
    }
    row.forEach((value, cellIndex) => {
      const type = table2.types[cellIndex];
      if ((type === "number" || type === "percent") && !Number.isFinite(parseDataTableNumber(value))) {
        fail(`report-data-table row ${index + 1} column "${table2.columns[cellIndex]}" must be numeric.`, context);
      }
    });
  });
}
function validateReportKeyValues(keyValues, context) {
  if (keyValues.items.length === 0) {
    fail("report-key-values requires at least one item in items or data.", context);
  }
  if (looksLikePipeDelimitedKeyValueItems(keyValues.rawItems)) {
    fail(
      'report-key-values items must separate items with semicolons, not pipes. Use items="Scope: Pilot (P001); Platform: v2; Period: Demo period". Pipes are reserved for fields inside table rows, datasets, and matrix values.',
      context
    );
  }
  if (keyValues.columns < 1 || keyValues.columns > 4) {
    fail("report-key-values columns must be between 1 and 4.", context);
  }
  keyValues.items.forEach((item, index) => {
    if (!item.key || !item.value) {
      fail(`report-key-values item ${index + 1} must use "Label: Value" or "Label=Value".`, context);
    }
  });
}
function validateReportInsight(insight, context) {
  const supportedVariants = /* @__PURE__ */ new Set(["info", "warning", "success", "danger"]);
  if (!supportedVariants.has(insight.variant)) {
    fail(
      `report-insight variant "${insight.rawVariant}" is not available. Supported variants: info, warning, success, danger. Ask the skill maker to add missing insight variants.`,
      context
    );
  }
  if (!insight.title && !insight.finding && !insight.evidence && !insight.impact && !insight.action) {
    fail("report-insight requires title, finding/body text, evidence, impact, or action.", context);
  }
}
function validateReportRecommendation(recommendation, context) {
  const supportedPriorities = /* @__PURE__ */ new Set(["", "critical", "high", "medium", "low"]);
  if (!recommendation.title && !recommendation.body) {
    fail("report-recommendation requires title or body text.", context);
  }
  if (!supportedPriorities.has(recommendation.priority)) {
    fail(
      `report-recommendation priority "${recommendation.rawPriority}" is not available. Supported priorities: critical, high, medium, low. Ask the skill maker to add missing recommendation priorities.`,
      context
    );
  }
}
function validateReportSourceNote(sourceNote, context) {
  if (!sourceNote.title && !sourceNote.body && !sourceNote.source && !sourceNote.date) {
    fail("report-source-note requires title, body text, source, or date.", context);
  }
}
function prepareReportSourceList(sourceList, sourceRegistry, context) {
  if (sourceList.sources.length === 0) {
    fail("report-source-list must include at least one report-source.", context);
  }
  sourceList.sources.forEach((source) => {
    if (!source.id) {
      fail("report-source requires an id attribute so report-cite can reference it.", context);
    }
    if (!/^[a-z0-9_-]+$/i.test(source.id)) {
      fail("report-source id may contain only letters, numbers, hyphens, and underscores.", context);
    }
    if (!source.title && !source.publisher && !source.date && !source.url && !source.note) {
      fail(`report-source "${source.id}" requires title, publisher/source, date, url, or note text.`, context);
    }
    if (sourceRegistry.has(source.id)) {
      fail(`Duplicate report-source id "${source.id}". Source ids must be unique.`, context);
    }
    source.number = sourceRegistry.size + 1;
    source.domId = reportSourceDomId(source.id);
    source.title = source.title || source.publisher || source.id;
    sourceRegistry.set(source.id, source);
  });
}
function resolveReportCite(cite, sourceRegistry, context) {
  if (!cite.source) {
    fail("report-cite requires a source, ref, or id attribute.", context);
  }
  const source = sourceRegistry.get(cite.source);
  if (!source) {
    fail(`report-cite source "${cite.source}" was not declared in a report-source-list.`, context);
  }
  cite.number = source.number;
  cite.domId = source.domId;
  cite.title = source.title;
}
function validateReportCardGrid(cardGrid, context) {
  const accents = /* @__PURE__ */ new Set(["blue", "cyan", "purple", "green", "orange", "red"]);
  if (cardGrid.columns < 1 || cardGrid.columns > 4) {
    fail("report-card-grid columns must be between 1 and 4.", context);
  }
  if (cardGrid.cards.length === 0) {
    fail("report-card-grid must include at least one report-card.", context);
  }
  cardGrid.cards.forEach((card, index) => {
    if (!accents.has(card.accent)) {
      fail(
        `Unsupported report-card accent "${card.rawAccent}". Supported accents: blue, cyan, purple, green, orange, red.`,
        context
      );
    }
    if (!card.title && !card.body) {
      fail(`report-card at position ${index + 1} must include title and/or body text.`, context);
    }
  });
}
function validateReportTimeline(timeline, context) {
  if (timeline.events.length === 0) {
    fail("report-timeline must include at least one report-event.", context);
  }
  timeline.events.forEach((event, index) => {
    if (!isKnownBadgeVariant(event.rawStatus)) {
      fail(
        `Unsupported report-event status "${event.rawStatus}". Supported statuses map to blue, green, orange, red, or muted.`,
        context
      );
    }
    if (!event.date && !event.title && !event.body) {
      fail(`report-event at position ${index + 1} must include date, title, and/or body text.`, context);
    }
  });
}
function validateReportRateBars(rateBars, context) {
  if (rateBars.labels.length === 0 || rateBars.values.length === 0) {
    fail("report-rate-bars requires non-empty labels and values attributes.", context);
  }
  if (rateBars.labels.length !== rateBars.values.length) {
    fail(
      `report-rate-bars labels/values length mismatch: ${rateBars.labels.length} label(s), ${rateBars.values.length} value(s).`,
      context
    );
  }
  if (rateBars.values.some((value) => !Number.isFinite(value))) {
    fail("report-rate-bars values must all be numeric.", context);
  }
  if (rateBars.values.some((value) => value < 0)) {
    fail("report-rate-bars values must be zero or positive.", context);
  }
  if (rateBars.shares.length > 0) {
    if (rateBars.shares.length !== rateBars.labels.length) {
      fail(
        `report-rate-bars shares length mismatch: ${rateBars.shares.length} share(s), ${rateBars.labels.length} label(s).`,
        context
      );
    }
    if (rateBars.shares.some((share) => !Number.isFinite(share))) {
      fail("report-rate-bars shares must all be numeric.", context);
    }
    if (rateBars.shares.some((share) => share < 0)) {
      fail("report-rate-bars shares must be zero or positive.", context);
    }
  } else if (rateBars.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail("report-rate-bars values must sum to more than zero when shares are omitted.", context);
  }
  if (rateBars.colors.some((color) => !isSixDigitHexColor(color))) {
    fail("report-rate-bars colors must be six-digit hex colors.", context);
  }
}
function validateReportCallout(callout, context) {
  const variants = /* @__PURE__ */ new Set(["info", "warning", "success", "danger"]);
  if (!variants.has(callout.variant)) {
    fail(
      `Unsupported report-callout variant "${callout.rawVariant}". Supported variants: info, warning, success, danger.`,
      context
    );
  }
  if (!callout.title && !callout.body) {
    fail("report-callout requires title and/or text content.", context);
  }
}
function validateReportAccentCard(card, context) {
  const accents = /* @__PURE__ */ new Set(["blue", "cyan", "purple", "green", "orange", "red"]);
  if (!accents.has(card.accent)) {
    fail(
      `Unsupported report-accent-card accent "${card.rawAccent}". Supported accents: blue, cyan, purple, green, orange, red.`,
      context
    );
  }
  if (!card.title && !card.body) {
    fail("report-accent-card requires title and/or text content.", context);
  }
}
function validateReportBadge(badge, context) {
  if (!isKnownBadgeVariant(badge.rawVariant)) {
    fail(
      `Unsupported report-badge variant "${badge.rawVariant}". Supported variants: blue, green, orange, red, muted.`,
      context
    );
  }
  if (!badge.label) {
    fail("report-badge requires label or text content.", context);
  }
  if (isIdentifierLikeBadgeLabel(badge.label)) {
    fail(
      `report-badge label "${badge.label}" looks like a product, field, or identifier. Use plain Markdown text for named products and identifiers; reserve report-badge for short statuses such as Active, Review, Blocked, or Pending.`,
      context
    );
  }
}
function uniqueDomId(value, usedIds, prefix) {
  const base = sanitizeDomId(value) || prefix;
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
}
function sanitizeDomId(value) {
  return String(value || "").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
}
function isSixDigitHexColor(value) {
  return /^#?[0-9a-f]{6}$/i.test(String(value || "").trim());
}
function isBooleanAttributeToken(value = "") {
  return ["true", "false", "yes", "no", "on", "off", "1", "0"].includes(String(value || "").trim().toLowerCase());
}
function isIdentifierLikeBadgeLabel(value = "") {
  const token = String(value || "").trim();
  if (!token || /\s/.test(token)) return false;
  return /^[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*$/.test(token) || /^[A-Za-z][A-Za-z0-9]*(?:[_-][A-Za-z0-9]+)+$/.test(token);
}
function looksLikePipeDelimitedKeyValueItems(value = "") {
  const source = String(value || "").trim();
  if (!source.includes("|") || source.includes(";")) return false;
  const segments = source.split("|").map((item) => item.trim()).filter(Boolean);
  if (segments.length < 2) return false;
  return segments.filter((segment) => /^[^:=|]{1,80}\s*[:=]\s*\S/.test(segment)).length >= 2;
}
function reportSourceDomId(id = "") {
  return `report-source-${String(id).replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}`;
}
function indent(source, spaces) {
  const padding = " ".repeat(spaces);
  return String(source || "").split("\n").map((line) => `${padding}${line}`).join("\n");
}
function reportComponentContext(options = {}) {
  return options.reportName ? `report "${options.reportName}"` : "report";
}
function lineNumberAt(source, index = 0) {
  return String(source || "").slice(0, index).split(/\r?\n/).length;
}
function fail(message, context = "report", line = 0) {
  throw new Error(`Invalid report Markdown in ${context}${line ? `, line ${line}` : ""}: ${message}`);
}

// src/report-layout.js
function prepareReportPresentation(content, frontmatter = {}) {
  const theme = normalizeReportTheme(frontmatter.reportTheme || frontmatter.themeSurface);
  const navEnabled = isTruthy(frontmatter.reportNav || frontmatter.nav);
  const navResult = navEnabled ? addGeneratedNavigation(content) : { content, hasLayout: false };
  return {
    content: navResult.content,
    hasLayout: navResult.hasLayout,
    theme
  };
}
function reportBodyClass(theme) {
  return theme === "dark" ? "report-theme-dark-page" : "";
}
function reportMainClass(theme) {
  return ["deck-report", theme === "dark" ? "report-theme-dark" : ""].filter(Boolean).join(" ");
}
function reportArticleClass(hasLayout) {
  return ["report-body", hasLayout ? "report-body-has-layout" : ""].filter(Boolean).join(" ");
}
function addGeneratedNavigation(content) {
  const root = load(`<root>${content}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true
  });
  const headings = collectNavigationHeadings(root);
  const usedIds = /* @__PURE__ */ new Set();
  const items = headings.map((heading2) => {
    const element = root(heading2);
    const title = cleanText(element.text());
    if (!title) return null;
    const id = uniqueId(element.attr("id") || slugify(title), usedIds);
    element.attr("id", id);
    return { id, title };
  }).filter(Boolean);
  if (!items.length) return { content, hasLayout: false };
  return {
    content: `<div class="report-layout">
<aside class="report-sidebar" aria-label="Report contents">
<div class="report-sidebar-title">Contents</div>
<nav>
${items.map((item) => `<a href="#${escapeAttr(item.id)}">${escapeHtml2(item.title)}</a>`).join("\n")}
</nav>
</aside>
<div class="report-main">
${root("root").html() || content}
</div>
</div>`,
    hasLayout: true
  };
}
function collectNavigationHeadings(root) {
  const h2 = root("root > h2").toArray();
  if (h2.length) return h2;
  return root("root > h1").toArray();
}
function normalizeReportTheme(value = "") {
  const token = String(value || "").trim().toLowerCase();
  if (token === "dark" || token === "navy" || token === "black") return "dark";
  return "";
}
function isTruthy(value) {
  if (value === true) return true;
  return ["true", "yes", "on", "1", "auto"].includes(String(value || "").trim().toLowerCase());
}
function uniqueId(value, usedIds) {
  const base = slugify(value) || "section";
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
}
function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/&[a-z0-9#]+;/gi, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// src/report.js
var markdown = new lib_default({
  html: true,
  linkify: true,
  typographer: true
});
function renderReportHtml(source, options = {}) {
  const definitions = options.definitions || {};
  const brand = definitions.brand || {};
  const { frontmatter, body } = splitFrontmatter(source);
  const assetMap = options.collectResources ? /* @__PURE__ */ new Map() : null;
  const resolverOptions = {
    assetMap,
    inlineAssets: options.inlineAssets,
    assetUrlPrefix: options.assetUrlPrefix
  };
  const title = frontmatter.title || firstHeading(body) || "Report";
  const subtitle = frontmatter.subtitle || "";
  const metadata = reportMetadata(frontmatter);
  const prepared = normalizeReportImageReferences(body);
  const compiled = compileReportComponents(prepared, { brand, reportName: title });
  const presentation = prepareReportPresentation(markdown.render(compiled.source), frontmatter);
  const content = resolveResourceUrls(presentation.content, options.resourcesDir, resolverOptions);
  const css = resolveResourceUrls(reportCss(brand, presentation.theme), options.resourcesDir, resolverOptions);
  const logo = reportLogo(brand, presentation.theme || "light", options.resourcesDir);
  const legal = reportLegalNotice(brand);
  const document = resolveResourceUrls(
    reportDocument({
      title,
      subtitle,
      metadata,
      content,
      css,
      logo,
      brandName: brand.name || "Brand",
      legal,
      bodyClass: reportBodyClass(presentation.theme),
      mainClass: reportMainClass(presentation.theme),
      articleClass: reportArticleClass(presentation.hasLayout)
    }),
    options.resourcesDir,
    resolverOptions
  );
  return {
    // `html` is the rendered report body content; `document` is the full standalone HTML page.
    html: content,
    css,
    frontmatter,
    document,
    assets: assetMap ? [...assetMap.entries()].map(([relativePath, sourcePath]) => ({
      relativePath,
      sourcePath
    })) : []
  };
}
function normalizeReportImageReferences(source) {
  return String(source || "").replace(
    /!\[([^\]]*)]\(([^)\s]+)(\s+["'][^"']*["'])?\)/g,
    (full, alt, src, title = "") => {
      const normalized = normalizeResourceReference(src);
      return `![${alt}](${normalized}${title})`;
    }
  );
}
function reportLogo(brand = {}, surface = "light", resourcesDir = "resources") {
  const logo = brand.assets?.logo;
  if (!logo) return "";
  if (typeof logo === "string") return surfaceResourceReference(logo, resourcesDir, surface);
  const candidate = surface === "dark" ? logo.reportDark || logo.reportOnDark || logo.companyDark || logo.contentDark || logo.dark || logo.report || logo.content || logo.cover || logo.default || "" : logo.reportLight || logo.reportOnLight || logo.companyLight || logo.contentLight || logo.light || logo.report || logo.content || logo.default || logo.cover || "";
  return surfaceResourceReference(candidate, resourcesDir, surface);
}
function surfaceResourceReference(src, resourcesDir, surface = "light") {
  if (!src || /^(data|https?|file):/i.test(String(src))) return src;
  try {
    return `resource:${resolveSurfaceResourceFile(src, resourcesDir, surface).relativePath}`;
  } catch {
    return src;
  }
}
function reportDocument({
  title,
  subtitle = "",
  metadata = [],
  content,
  css,
  logo = "",
  brandName = "Brand",
  legal = null,
  bodyClass = "",
  mainClass = "deck-report",
  articleClass = "report-body"
}) {
  const bodyClassAttr = bodyClass ? ` class="${escapeAttr(bodyClass)}"` : "";
  const htmlClassAttr = bodyClass ? ` class="${escapeAttr(bodyClass)}"` : "";
  return `<!doctype html>
<html lang="en"${htmlClassAttr}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml2(title)}</title>
  <style>${css}</style>
</head>
<body${bodyClassAttr}>
  <main class="${escapeAttr(mainClass)}">
    <header class="report-cover">
      ${logo ? `<img class="report-logo" src="${escapeAttr(logo)}" alt="${escapeAttr(brandName)} logo">` : ""}
      <p class="report-kicker">Report</p>
      <h1>${escapeHtml2(title)}</h1>
      ${subtitle ? `<p class="report-subtitle">${escapeHtml2(subtitle)}</p>` : ""}
      ${metadata.length ? renderReportMetadata(metadata) : ""}
    </header>
    <article class="${escapeAttr(articleClass)}">
${content}
    </article>
    ${renderReportLegalNotice(legal)}
  </main>
</body>
</html>
`;
}
function reportLegalNotice(brand = {}) {
  const candidate = brand.report?.legal || brand.report?.legalNotice || brand.report?.boilerplate || brand.legal || brand.legalNotice || brand.reportLegal || null;
  if (!candidate) return null;
  if (typeof candidate === "string") {
    const text2 = cleanLegalText(candidate);
    return text2 ? { title: "", paragraphs: [text2] } : null;
  }
  if (Array.isArray(candidate)) {
    const paragraphs2 = candidate.map(cleanLegalText).filter(Boolean);
    return paragraphs2.length ? { title: "", paragraphs: paragraphs2 } : null;
  }
  const title = cleanLegalText(candidate.title || candidate.heading || "Legal notice");
  const paragraphs = [];
  const body = candidate.text ?? candidate.body ?? candidate.notice ?? candidate.paragraphs ?? "";
  if (Array.isArray(body)) {
    paragraphs.push(...body.map(cleanLegalText).filter(Boolean));
  } else {
    paragraphs.push(...String(body || "").split(/\n{2,}/).map(cleanLegalText).filter(Boolean));
  }
  return title || paragraphs.length ? { title, paragraphs } : null;
}
function renderReportLegalNotice(legal) {
  if (!legal) return "";
  const title = legal.title ? `<div class="report-legal-title">${escapeHtml2(legal.title)}</div>` : "";
  const paragraphs = legal.paragraphs.map((paragraph2) => `<p>${escapeHtml2(paragraph2)}</p>`).join("\n");
  return `<footer class="report-legal" aria-label="Legal notice">
  ${title}
  ${paragraphs}
</footer>`;
}
function cleanLegalText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
function reportMetadata(frontmatter = {}) {
  return [
    ["Report date", frontmatter.reportDate],
    ["Prepared for", frontmatter.preparedFor],
    ["Prepared by", frontmatter.preparedBy],
    ["Classification", frontmatter.classification],
    ["Version", frontmatter.version]
  ].filter(([, value]) => value !== void 0 && value !== null && String(value).trim()).map(([label, value]) => ({ label, value: reportMetadataValue(value) }));
}
function reportMetadataValue(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}
function renderReportMetadata(metadata = []) {
  return `<dl class="report-cover-meta">
${metadata.map(
    (item) => `        <div>
          <dt>${escapeHtml2(item.label)}</dt>
          <dd>${escapeHtml2(item.value)}</dd>
        </div>`
  ).join("\n")}
      </dl>`;
}
function reportCss(brand = {}, theme = "light") {
  const colors = brand.colors || {};
  const dark = hex(colors.dark, "060D18");
  const white = hex(colors.white, "FFFFFF");
  const blue = hex(colors.blue, "0F82F5");
  const cyan = hex(colors.cyan, "59D6FD");
  const cardDark = hex(colors.cardDark, "0D1D36");
  const body = hex(colors.body, "C8D8F0");
  const muted = hex(colors.muted, "8B9AB5");
  const border = hex(colors.border, "1E3A5F");
  const darkBody = hex(colors.bodyOnDark || colors.reportBodyDark, "C8D8F0");
  const darkMuted = hex(colors.mutedOnDark || colors.reportMutedDark, "8B9AB5");
  const darkBorder = hex(colors.borderDark || colors.reportBorderDark, "1E3A5F");
  const printPageBackground = theme === "dark" ? "071228" : "FFFFFF";
  const printPageNumber = theme === "dark" ? "9DB5D2" : "64748B";
  const font = fontFamily(brand);
  const background = brand.assets?.backgrounds?.content || "";
  const backgroundRule = background ? `
.report-cover {
  background-image: linear-gradient(90deg, rgba(6, 13, 24, 0.96), rgba(6, 13, 24, 0.78)), url("${escapeCssUrl(background)}");
  background-size: cover;
  background-position: center;
}` : "";
  return `
:root {
  color-scheme: light;
  --report-dark: #${dark};
  --report-white: #${white};
  --report-blue: #${blue};
  --report-cyan: #${cyan};
  --report-card: #${cardDark};
  --report-body: #${body};
  --report-muted: #${muted};
  --report-border: #${border};
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f4f7fb;
  color: #111827;
  font-family: ${font};
  line-height: 1.62;
}

.deck-report {
  max-width: 1080px;
  margin: 0 auto;
  background: #ffffff;
  min-height: 100vh;
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.12);
}

.report-cover {
  position: relative;
  min-height: 310px;
  padding: 64px 76px 72px;
  background: linear-gradient(135deg, var(--report-dark), #0a1730);
  color: var(--report-white);
  overflow: hidden;
}

.report-cover::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--report-blue), var(--report-cyan));
}

.report-logo {
  position: absolute;
  top: 34px;
  right: 56px;
  max-width: 150px;
  max-height: 42px;
  object-fit: contain;
}

.report-kicker {
  margin: 0 0 14px;
  color: var(--report-cyan);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-cover h1 {
  max-width: 780px;
  margin: 0;
  color: var(--report-white);
  font-size: 48px;
  font-weight: 500;
  line-height: 1.08;
}

.report-subtitle {
  max-width: 760px;
  margin: 22px 0 0;
  color: var(--report-body);
  font-size: 21px;
}

.report-cover-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 860px;
  margin: 30px 0 0;
}

.report-cover-meta div {
  min-width: 135px;
  padding: 10px 12px;
  border: 1px solid rgba(200, 216, 240, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.report-cover-meta dt {
  margin: 0 0 4px;
  color: var(--report-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-cover-meta dd {
  margin: 0;
  color: var(--report-white);
  font-size: 13px;
  font-weight: 650;
}

.report-body {
  padding: 54px 76px 76px;
}

.report-body.report-body-has-layout {
  padding: 0;
}

.report-legal {
  max-width: 1080px;
  margin: 0 auto;
  padding: 22px 76px 30px;
  border-top: 1px solid var(--border-dim, #e2e8f0);
  color: var(--text-dim, #64748b);
  font-size: 11px;
  line-height: 1.45;
}

.report-legal-title {
  margin: 0 0 6px;
  color: var(--text, #334155);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-legal p {
  margin: 0;
}

.report-legal p + p {
  margin-top: 7px;
}

.report-body > *:first-child {
  margin-top: 0;
}

.report-body h1,
.report-body h2,
.report-body h3 {
  color: #0b1220;
  line-height: 1.18;
}

.report-body h1 {
  margin: 46px 0 18px;
  font-size: 34px;
}

.report-body h2 {
  margin: 42px 0 16px;
  padding-top: 18px;
  border-top: 1px solid #dbe5f2;
  font-size: 27px;
}

.report-body h3 {
  margin: 30px 0 10px;
  font-size: 20px;
}

.report-body p,
.report-body li {
  font-size: 16px;
}

.report-body a {
  color: #${blue};
}

.report-body blockquote {
  margin: 28px 0;
  padding: 18px 22px;
  border-left: 5px solid #${blue};
  background: #eef6fe;
  color: #1f2937;
}

.report-body table {
  width: 100%;
  margin: 28px 0;
  border-collapse: collapse;
  font-size: 14px;
}

.report-body th,
.report-body td {
  padding: 12px 14px;
  border: 1px solid #dbe5f2;
  text-align: left;
  vertical-align: top;
}

.report-body th {
  background: #071228;
  color: #ffffff;
  font-weight: 600;
}

.report-body tr:nth-child(even) td {
  background: #f8fbff;
}

.report-body img,
.report-body svg {
  max-width: 100%;
  height: auto;
}

.report-figure {
  margin: 28px auto;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.report-figure-normal {
  max-width: 760px;
}

.report-figure-narrow {
  max-width: 560px;
}

.report-figure-wide {
  max-width: 100%;
}

.report-figure img {
  display: block;
  width: 100%;
  border-radius: 6px;
}

.report-figure figcaption {
  display: grid;
  gap: 5px;
  margin-top: 12px;
  color: var(--text-dim, #64748b);
  font-size: 13px;
  line-height: 1.35;
}

.report-figure-caption {
  color: var(--text, #334155);
  font-weight: 600;
}

.report-figure-source {
  font-size: 12px;
}

.report-data-table {
  margin: 28px 0;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  overflow: hidden;
}

.report-data-table-title {
  padding: 18px 20px 0;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-data-table-scroll {
  overflow-x: auto;
}

.report-data-table table {
  width: 100%;
  min-width: 560px;
  margin: 0;
  border: 0;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.report-data-table th,
.report-data-table td {
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid var(--border-dim, #e2e8f0);
  color: var(--text, #334155);
  text-align: left;
  vertical-align: middle;
}

.report-data-table-compact th,
.report-data-table-compact td {
  padding: 8px 10px;
  font-size: 12px;
}

.report-data-table th {
  background: var(--bg-subtle, #071228);
  color: var(--white, #ffffff);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-data-table tbody tr:nth-child(even) td {
  background: rgba(15, 130, 245, 0.04);
}

.report-data-table tbody tr:last-child td {
  border-bottom: 0;
}

.report-data-table tfoot td {
  border-top: 2px solid var(--border, #dbe5f2);
  border-bottom: 0;
  background: rgba(15, 130, 245, 0.09);
  color: var(--text, #0f172a);
  font-weight: 750;
}

.report-data-table-cell-number,
.report-data-table-cell-percent {
  font-family: Consolas, "SFMono-Regular", monospace;
  white-space: nowrap;
}

.report-data-table .report-data-table-align-left {
  text-align: left;
}

.report-data-table .report-data-table-align-center {
  text-align: center;
}

.report-data-table .report-data-table-align-right {
  text-align: right;
}

.report-data-table-cell-status {
  white-space: nowrap;
}

.report-data-table-highlight-blue td,
.report-data-table-cell.report-data-table-highlight-blue {
  background: rgba(15, 130, 245, 0.16);
}

.report-data-table-highlight-green td,
.report-data-table-cell.report-data-table-highlight-green {
  background: rgba(31, 169, 93, 0.16);
}

.report-data-table-highlight-orange td,
.report-data-table-cell.report-data-table-highlight-orange {
  background: rgba(245, 158, 11, 0.18);
}

.report-data-table-highlight-red td,
.report-data-table-cell.report-data-table-highlight-red {
  background: rgba(239, 68, 68, 0.16);
}

.report-data-table-highlight-muted td,
.report-data-table-cell.report-data-table-highlight-muted {
  background: rgba(100, 116, 139, 0.14);
}

.report-data-table figcaption {
  display: grid;
  gap: 5px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--border-dim, #e2e8f0);
  color: var(--text-dim, #64748b);
  font-size: 12px;
  line-height: 1.35;
}

.report-data-table-caption {
  color: var(--text, #334155);
  font-weight: 600;
}

.report-data-table-source {
  font-size: 12px;
}

.report-key-values {
  margin: 24px 0;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.report-key-values-title {
  margin: 0 0 14px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-key-values dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.report-key-values-1 dl {
  grid-template-columns: minmax(0, 1fr);
}

.report-key-values-3 dl {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.report-key-values-4 dl {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.report-key-value {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-dim, #e2e8f0);
  border-radius: 6px;
  background: var(--bg-subtle, #f8fbff);
}

.report-key-value dt {
  margin: 0 0 5px;
  color: var(--text-dim, #64748b);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-key-value dd {
  min-width: 0;
  margin: 0;
  color: var(--text, #0f172a);
  font-size: 15px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.report-insight,
.report-recommendation {
  margin: 24px 0;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.report-insight {
  border-left: 4px solid var(--blue, var(--report-blue, #0F82F5));
}

.report-insight-warning {
  border-left-color: var(--orange, #f59e0b);
}

.report-insight-success {
  border-left-color: var(--green, #1FA95D);
}

.report-insight-danger {
  border-left-color: #ef4444;
}

.report-insight-title,
.report-recommendation-title {
  margin: 0 0 12px;
  color: var(--text, #0f172a);
  font-size: 17px;
  font-weight: 750;
  line-height: 1.25;
}

.report-insight dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

.report-insight-section {
  display: grid;
  grid-template-columns: minmax(90px, 0.28fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.report-insight-section dt {
  margin: 0;
  color: var(--text-dim, #64748b);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-insight-section dd {
  min-width: 0;
  margin: 0;
  color: var(--text, #334155);
  font-size: 14px;
  line-height: 1.45;
}

.report-recommendation {
  border-top: 4px solid var(--green, #1FA95D);
}

.report-recommendation-body {
  color: var(--text, #334155);
  font-size: 15px;
  line-height: 1.45;
}

.report-recommendation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.report-recommendation-meta-item,
.report-recommendation-priority {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 4px 9px;
  border: 1px solid var(--border-dim, #e2e8f0);
  border-radius: 999px;
  color: var(--text-dim, #64748b);
  font-size: 12px;
  font-weight: 650;
}

.report-recommendation-priority-critical,
.report-recommendation-priority-high {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.report-recommendation-priority-medium {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.12);
  color: #92400e;
}

.report-recommendation-priority-low {
  border-color: rgba(31, 169, 93, 0.35);
  background: rgba(31, 169, 93, 0.12);
  color: #166534;
}

.report-source-note {
  margin: 22px 0;
  padding: 13px 16px;
  border: 1px solid var(--border-dim, #e2e8f0);
  border-left: 4px solid var(--cyan, var(--report-cyan, #59D6FD));
  border-radius: 7px;
  background: rgba(89, 214, 253, 0.07);
  color: var(--text-dim, #64748b);
}

.report-source-note-title {
  margin-bottom: 4px;
  color: var(--text, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.report-source-note-body {
  color: var(--text, #334155);
  font-size: 13px;
  line-height: 1.45;
}

.report-source-note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 7px;
  color: var(--text-dim, #64748b);
  font-size: 12px;
}

.report-source-list {
  margin: 28px 0;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.report-source-list-title {
  margin: 0 0 14px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-source-list ol {
  display: grid;
  gap: 13px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.report-source-list li {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-dim, #e2e8f0);
  border-radius: 6px;
  background: var(--bg-subtle, #f8fbff);
}

.report-source-list-heading {
  display: flex;
  gap: 8px;
  align-items: baseline;
  color: var(--text, #0f172a);
  font-size: 14px;
  font-weight: 750;
}

.report-source-list-number {
  color: var(--cyan, var(--report-cyan, #59D6FD));
  font-family: Consolas, "SFMono-Regular", monospace;
  font-size: 12px;
}

.report-source-list-note {
  margin-top: 6px;
  color: var(--text, #334155);
  font-size: 13px;
  line-height: 1.4;
}

.report-source-list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 8px;
  color: var(--text-dim, #64748b);
  font-size: 12px;
}

.report-source-list-meta a {
  color: var(--cyan, var(--report-cyan, #59D6FD));
  overflow-wrap: anywhere;
}

.report-cite {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 1px 5px;
  border: 1px solid rgba(89, 214, 253, 0.4);
  border-radius: 999px;
  background: rgba(89, 214, 253, 0.12);
  color: var(--cyan, var(--report-cyan, #59D6FD));
  font-family: Consolas, "SFMono-Regular", monospace;
  font-size: 0.82em;
  font-weight: 700;
  text-decoration: none;
  vertical-align: baseline;
}

.report-cite:hover {
  background: rgba(89, 214, 253, 0.2);
}

.report-page-break {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 42px 0;
  color: var(--text-dim, #64748b);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-page-break::before,
.report-page-break::after {
  content: "";
  flex: 1 1 auto;
  border-top: 1px dashed var(--border-dim, #e2e8f0);
}

.report-page-break:empty::after {
  display: none;
}

.report-card-grid {
  margin: 28px 0;
}

.report-card-grid-title {
  margin: 0 0 14px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-card-grid-items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.report-card-grid-1 .report-card-grid-items {
  grid-template-columns: minmax(0, 1fr);
}

.report-card-grid-2 .report-card-grid-items {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.report-card-grid-4 .report-card-grid-items {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.report-card-grid-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border, #dbe5f2);
  border-top: 4px solid var(--report-card-accent, var(--blue, #0F82F5));
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.report-card-grid-card-title {
  margin-bottom: 7px;
  color: var(--report-card-accent, var(--blue, #0F82F5));
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-card-grid-card-body {
  min-width: 0;
  color: var(--text, #334155);
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.report-card-grid-card-blue { --report-card-accent: var(--blue, #0F82F5); }
.report-card-grid-card-cyan { --report-card-accent: var(--cyan, #59D6FD); }
.report-card-grid-card-purple { --report-card-accent: var(--purple, #5143D5); }
.report-card-grid-card-green { --report-card-accent: var(--green, #16a34a); }
.report-card-grid-card-orange { --report-card-accent: var(--orange, #F9935B); }
.report-card-grid-card-red { --report-card-accent: var(--red, #dc2626); }

.report-timeline {
  margin: 28px 0;
}

.report-timeline-title {
  margin: 0 0 16px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-timeline ol {
  position: relative;
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.report-timeline ol::before {
  content: "";
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 11px;
  width: 2px;
  background: var(--border, #dbe5f2);
}

.report-timeline-event {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
}

.report-timeline-marker {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
  border: 4px solid var(--bg, #ffffff);
  border-radius: 999px;
  background: var(--report-timeline-color, var(--blue, #0F82F5));
  box-shadow: 0 0 0 1px var(--border, #dbe5f2);
}

.report-timeline-content {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.report-timeline-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
}

.report-timeline-date {
  color: var(--text-dim, #64748b);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.report-timeline-event-title {
  color: var(--text, #0f172a);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
}

.report-timeline-event-body {
  margin-top: 5px;
  color: var(--text, #334155);
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.report-timeline-event-blue { --report-timeline-color: var(--blue, #0F82F5); }
.report-timeline-event-green { --report-timeline-color: var(--green, #16a34a); }
.report-timeline-event-orange { --report-timeline-color: var(--orange, #F9935B); }
.report-timeline-event-red { --report-timeline-color: var(--red, #dc2626); }
.report-timeline-event-muted { --report-timeline-color: var(--text-dim, #64748b); }

.report-chart {
  margin: 28px 0;
  padding: 22px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  overflow: hidden;
}

.report-chart-title {
  margin: 0 0 16px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-chart-stage {
  position: relative;
  width: 100%;
  min-height: 180px;
  overflow: hidden;
}

.report-chart-stage canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.report-chart-plot {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.report-chart-plot svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.report-chart-floating-tooltip {
  position: absolute;
  z-index: 2;
  max-width: 240px;
  padding: 9px 11px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.35));
  border-radius: 6px;
  background: var(--bg-card, rgba(15, 23, 42, 0.94));
  color: var(--text, #ffffff);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 10px));
  white-space: nowrap;
}

.report-chart-floating-tooltip[hidden] {
  display: none;
}

.report-funnel-print-label {
  display: none;
}

.report-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin: 22px 0;
}

.report-metric {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  text-align: center;
}

.report-metric-value {
  margin-bottom: 6px;
  color: var(--text, #0b1220);
  font-size: 31px;
  font-weight: 300;
  line-height: 1;
}

.report-metric-label {
  color: var(--text-dim, #64748b);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-metric-sub {
  margin-top: 8px;
  color: var(--green, #16a34a);
  font-size: 13px;
}

.report-metric-sub.down {
  color: var(--red, #dc2626);
}

.report-metric-blue .report-metric-value { color: var(--blue, #0F82F5); }
.report-metric-cyan .report-metric-value { color: var(--cyan, #59D6FD); }
.report-metric-purple .report-metric-value { color: var(--purple, #5143D5); }
.report-metric-green .report-metric-value { color: var(--green, #16a34a); }
.report-metric-orange .report-metric-value { color: var(--orange, #F9935B); }
.report-metric-red .report-metric-value { color: var(--red, #dc2626); }

.report-rate-bars {
  margin: 28px 0;
}

.report-rate-bars-title {
  margin: 0 0 16px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-rate-bar {
  display: grid;
  grid-template-columns: minmax(84px, 128px) minmax(0, 1fr) max-content;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.report-rate-label {
  min-width: 0;
  color: var(--text, #0f172a);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.report-rate-track {
  position: relative;
  min-width: 0;
  height: 24px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 5px;
  background: var(--bg-subtle, #e8f4fe);
  overflow: hidden;
}

.report-rate-fill {
  width: var(--report-rate-width, 0%);
  height: 100%;
  border-radius: 4px;
  background: var(--report-rate-color, var(--report-blue, #0F82F5));
}

.report-rate-value {
  position: absolute;
  inset: 0 auto 0 10px;
  display: flex;
  align-items: center;
  max-width: calc(100% - 20px);
  color: var(--white, #ffffff);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-rate-pct {
  min-width: 46px;
  color: var(--text-dim, #64748b);
  font-family: "Consolas", "SFMono-Regular", monospace;
  font-size: 12px;
  text-align: right;
}

.report-callout {
  margin: 22px 0;
  padding: 16px 18px;
  border: 1px solid var(--report-callout-border, rgba(15, 130, 245, 0.32));
  border-left-width: 5px;
  border-radius: 8px;
  background: var(--report-callout-bg, rgba(15, 130, 245, 0.08));
  color: var(--report-callout-text, var(--text, #0f172a));
}

.report-callout-title {
  margin-bottom: 4px;
  color: var(--report-callout-title, var(--text, #0f172a));
  font-size: 14px;
  font-weight: 700;
}

.report-callout-body {
  color: var(--report-callout-text, var(--text, #334155));
  font-size: 15px;
}

.report-callout-info {
  --report-callout-bg: rgba(15, 130, 245, 0.1);
  --report-callout-border: rgba(15, 130, 245, 0.38);
  --report-callout-title: var(--blue, #0F82F5);
}

.report-callout-warning {
  --report-callout-bg: rgba(249, 147, 91, 0.12);
  --report-callout-border: rgba(249, 147, 91, 0.42);
  --report-callout-title: var(--orange, #F9935B);
}

.report-callout-success {
  --report-callout-bg: rgba(102, 204, 142, 0.12);
  --report-callout-border: rgba(102, 204, 142, 0.42);
  --report-callout-title: var(--green, #16a34a);
}

.report-callout-danger {
  --report-callout-bg: rgba(252, 81, 97, 0.12);
  --report-callout-border: rgba(252, 81, 97, 0.44);
  --report-callout-title: var(--red, #dc2626);
}

.report-accent-card {
  margin: 22px 0;
  padding: 18px 20px;
  border: 1px solid var(--border, #dbe5f2);
  border-top: 4px solid var(--report-accent-color, var(--blue, #0F82F5));
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.report-accent-card-title {
  margin-bottom: 7px;
  color: var(--report-accent-color, var(--blue, #0F82F5));
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-accent-card-body {
  min-width: 0;
  color: var(--text, #334155);
  font-size: 15px;
  overflow-wrap: anywhere;
}

.report-accent-card-blue { --report-accent-color: var(--blue, #0F82F5); }
.report-accent-card-cyan { --report-accent-color: var(--cyan, #59D6FD); }
.report-accent-card-purple { --report-accent-color: var(--purple, #5143D5); }
.report-accent-card-green { --report-accent-color: var(--green, #16a34a); }
.report-accent-card-orange { --report-accent-color: var(--orange, #F9935B); }
.report-accent-card-red { --report-accent-color: var(--red, #dc2626); }

.report-badge {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  max-width: 100%;
  padding: 3px 8px;
  border: 1px solid var(--report-badge-border, rgba(100, 116, 139, 0.32));
  border-radius: 999px;
  background: var(--report-badge-bg, rgba(100, 116, 139, 0.1));
  color: var(--report-badge-text, #475569);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.1;
  text-transform: uppercase;
  vertical-align: middle;
  white-space: nowrap;
}

.report-badge-blue {
  --report-badge-bg: rgba(15, 130, 245, 0.12);
  --report-badge-border: rgba(15, 130, 245, 0.35);
  --report-badge-text: #075AAB;
}

.report-badge-green {
  --report-badge-bg: rgba(102, 204, 142, 0.12);
  --report-badge-border: rgba(102, 204, 142, 0.35);
  --report-badge-text: #166534;
}

.report-badge-orange {
  --report-badge-bg: rgba(249, 147, 91, 0.12);
  --report-badge-border: rgba(249, 147, 91, 0.35);
  --report-badge-text: #9A3412;
}

.report-badge-red {
  --report-badge-bg: rgba(252, 81, 97, 0.12);
  --report-badge-border: rgba(252, 81, 97, 0.38);
  --report-badge-text: #B91C1C;
}

.report-badge-muted {
  --report-badge-bg: rgba(139, 154, 181, 0.1);
  --report-badge-border: rgba(139, 154, 181, 0.28);
  --report-badge-text: var(--text-dim, #64748b);
}

.deck-report.report-theme-dark .report-badge-blue {
  --report-badge-bg: rgba(89, 214, 253, 0.16);
  --report-badge-border: rgba(89, 214, 253, 0.42);
  --report-badge-text: #DDF6FF;
}

.deck-report.report-theme-dark .report-badge-green {
  --report-badge-bg: rgba(102, 204, 142, 0.16);
  --report-badge-border: rgba(102, 204, 142, 0.42);
  --report-badge-text: #DFFBEA;
}

.deck-report.report-theme-dark .report-badge-orange {
  --report-badge-bg: rgba(249, 147, 91, 0.18);
  --report-badge-border: rgba(249, 147, 91, 0.44);
  --report-badge-text: #FFE8D6;
}

.deck-report.report-theme-dark .report-badge-red {
  --report-badge-bg: rgba(252, 81, 97, 0.18);
  --report-badge-border: rgba(252, 81, 97, 0.44);
  --report-badge-text: #FFE2E6;
}

.deck-report.report-theme-dark .report-badge-muted {
  --report-badge-bg: rgba(139, 154, 181, 0.18);
  --report-badge-border: rgba(139, 154, 181, 0.42);
  --report-badge-text: #D7E2F2;
}

.report-layout {
  display: grid;
  grid-template-columns: minmax(160px, 200px) minmax(0, 1fr);
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.report-sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  padding: 20px;
  border: 1px solid #dbe5f2;
  border-radius: 8px;
  background: #f8fbff;
}

.report-sidebar-title {
  margin-bottom: 12px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-sidebar a {
  display: block;
  padding: 7px 10px;
  border-radius: 4px;
  color: #475569;
  font-size: 13px;
  text-decoration: none;
}

.report-sidebar a:hover {
  background: #e8f4fe;
  color: #0F82F5;
}

.report-main {
  min-width: 0;
  padding: 32px 40px 60px;
}

body.report-theme-dark-page {
  --bg: #060D18;
  --bg-card: #${cardDark};
  --bg-subtle: #071228;
  --border: #${darkBorder};
  --border-dim: rgba(30, 58, 95, 0.45);
  --blue: #${blue};
  --cyan: #${cyan};
  --purple: #${hex(colors.purple, "5143D5")};
  --green: #${hex(colors.green, "66CC8E")};
  --orange: #${hex(colors.orange, "F9935B")};
  --red: #${hex(colors.red, "FC5161")};
  --white: #${white};
  --text: #${darkBody};
  --text-dim: #${darkMuted};
  background: var(--bg);
  color: var(--text);
}

.deck-report.report-theme-dark {
  max-width: 1200px;
  background: var(--bg-subtle);
  color: var(--text);
  box-shadow: none;
}

.deck-report.report-theme-dark .report-cover {
  background: linear-gradient(135deg, var(--bg), #0a1730);
}

.deck-report.report-theme-dark .report-body h1,
.deck-report.report-theme-dark .report-body h2,
.deck-report.report-theme-dark .report-body h3 {
  color: var(--cyan);
}

.deck-report.report-theme-dark .report-body h2 {
  border-top: 0;
  border-bottom: 1px solid var(--border);
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding-bottom: 8px;
}

.deck-report.report-theme-dark .report-body p,
.deck-report.report-theme-dark .report-body li {
  color: var(--text);
}

.deck-report.report-theme-dark .report-legal {
  border-color: var(--border);
  color: var(--text-dim);
}

.deck-report.report-theme-dark .report-legal-title {
  color: var(--text);
}

.deck-report.report-theme-dark .report-body table {
  color: var(--text);
  font-size: 14px;
}

.deck-report.report-theme-dark .report-body th {
  border-color: var(--border);
  background: var(--bg-card);
  color: var(--white);
}

.deck-report.report-theme-dark .report-body td {
  border-color: var(--border-dim);
  color: var(--text);
}

.deck-report.report-theme-dark .report-body tr:nth-child(even) td {
  background: rgba(13, 31, 56, 0.4);
}

.deck-report.report-theme-dark .report-sidebar {
  border-color: var(--border);
  background: var(--bg-card);
}

.deck-report.report-theme-dark .report-sidebar-title {
  color: var(--text-dim);
}

.deck-report.report-theme-dark .report-sidebar a {
  color: var(--text-dim);
}

.deck-report.report-theme-dark .report-sidebar a:hover {
  background: rgba(89, 214, 253, 0.08);
  color: var(--cyan);
}

.deck-report.report-theme-dark .report-chart {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-data-table {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-key-values {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-insight,
.deck-report.report-theme-dark .report-recommendation,
.deck-report.report-theme-dark .report-source-list {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-card-grid-card {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-timeline-content {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-accent-card {
  box-shadow: none;
}

.report-body hr {
  margin: 42px 0;
  border: 0;
  border-top: 1px solid #dbe5f2;
}

pre,
code {
  font-family: Consolas, "SFMono-Regular", monospace;
}

pre {
  overflow-x: auto;
  padding: 16px 18px;
  border: 1px solid #dbe5f2;
  background: #071228;
  color: #e2e8f0;
}

code {
  padding: 2px 5px;
  border-radius: 4px;
  background: #eef2f7;
}

pre code {
  padding: 0;
  background: transparent;
}

.deck-report.report-theme-dark .report-body code {
  border: 1px solid rgba(89, 214, 253, 0.26);
  background: rgba(89, 214, 253, 0.12);
  color: var(--white);
}

.deck-report.report-theme-dark .report-body pre code {
  border: 0;
  background: transparent;
  color: inherit;
}

@media (max-width: 760px) {
  .report-cover {
    padding: 54px 32px 60px;
  }

  .report-cover h1 {
    font-size: 44px;
  }

  .report-cover-meta {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .report-body {
    padding: 40px 32px 56px;
  }

  .report-layout {
    display: block;
    padding: 24px;
  }

  .report-sidebar {
    position: static;
    margin-bottom: 24px;
  }

  .report-main {
    padding: 0;
  }

  .report-key-values dl,
  .report-key-values-3 dl,
  .report-key-values-4 dl,
  .report-insight-section,
  .report-card-grid-items,
  .report-card-grid-2 .report-card-grid-items,
  .report-card-grid-4 .report-card-grid-items {
    grid-template-columns: minmax(0, 1fr);
  }
}

${backgroundRule}

@page {
  size: A4;
  margin: 12mm 14mm 16mm;
  background: #${printPageBackground};

  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    color: #${printPageNumber};
    font-family: ${font};
    font-size: 8px;
  }
}

@media print {
  *,
  *::before,
  *::after {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  html,
  body {
    background: var(--bg, #ffffff) !important;
    margin: 0;
    min-height: 100%;
  }

  html.report-theme-dark-page,
  body.report-theme-dark-page {
    background: var(--bg, #060D18) !important;
  }

  html.report-theme-dark-page {
    --bg: #060D18;
    --bg-subtle: #071228;
  }

  body.report-theme-dark-page::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    background: var(--bg-subtle, #071228) !important;
  }

  .report-layout {
    display: block;
    gap: 0;
    max-width: none;
    padding: 0;
  }

  .deck-report {
    max-width: none;
    width: 100%;
    box-shadow: none;
    background: var(--surface, #ffffff) !important;
  }

  .deck-report.report-theme-dark {
    background: var(--bg-subtle, #071228) !important;
    color: var(--text, #${darkBody});
  }

  .report-sidebar {
    display: none !important;
  }

  .report-main {
    padding: 0;
  }

  .report-cover {
    min-height: 220px;
    padding: 10mm 0 12mm;
    background: linear-gradient(135deg, var(--bg, #${dark}), #0a1730) !important;
  }

  .report-logo {
    top: 8mm;
    right: 0;
  }

  .report-body {
    padding: 10mm 0 0;
  }

  .report-legal {
    max-width: none;
    padding: 8mm 0 0;
    border-color: var(--border, #dbe5f2) !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .report-body h1,
  .report-body h2 {
    break-after: avoid;
  }

  .report-chart,
  .report-chart-stage,
  .report-data-table,
  .report-key-values,
  .report-metric-grid,
  .report-insight,
  .report-recommendation,
  .report-source-note,
  .report-source-list,
  .report-legal,
  .report-card-grid-card,
  .report-timeline-event,
  .report-accent-card,
  .report-callout,
  .report-figure {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .deck-report.report-theme-dark .report-chart,
  .deck-report.report-theme-dark .report-data-table,
  .deck-report.report-theme-dark .report-key-values,
  .deck-report.report-theme-dark .report-insight,
  .deck-report.report-theme-dark .report-recommendation,
  .deck-report.report-theme-dark .report-source-list,
  .deck-report.report-theme-dark .report-card-grid-card,
  .deck-report.report-theme-dark .report-timeline-content,
  .deck-report.report-theme-dark .report-accent-card,
  .deck-report.report-theme-dark .report-callout {
    background: var(--bg-card, #${cardDark}) !important;
    border-color: var(--border, #${darkBorder}) !important;
  }

  .report-chart canvas,
  .report-chart svg,
  .report-figure img,
  .report-logo {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .report-funnel-print-label {
    display: block;
    fill: var(--white, #FFFFFF);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0;
    pointer-events: none;
  }

  .report-funnel-print-label-value {
    fill: rgba(255, 255, 255, 0.78);
    font-size: 11px;
    font-weight: 700;
  }

  .report-page-break {
    break-before: page;
    page-break-before: always;
    break-after: auto;
    page-break-after: auto;
    height: 0;
    margin: 0;
    overflow: hidden;
  }

  .report-page-break::before,
  .report-page-break::after,
  .report-page-break span {
    display: none;
  }

  .report-body table,
  .report-body ol,
  .report-body ul,
  .report-body blockquote,
  pre {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  p,
  li {
    orphans: 3;
    widows: 3;
  }

  li {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`;
}
function firstHeading(source) {
  const match2 = String(source || "").match(/^\s*#\s+(.+)$/m);
  return match2 ? stripInline(match2[1]) : "";
}
function stripInline(value) {
  return String(value || "").replace(/!\[[^\]]*]\([^)]+\)/g, "").replace(/\[([^\]]+)]\([^)]+\)/g, "$1").replace(/[*_`~]/g, "").trim();
}
function fontFamily(brand = {}) {
  const fonts = brand.fonts || {};
  return `"${fonts.regular || "Poppins"}", "${fonts.fallback || "Segoe UI"}", Arial, sans-serif`;
}
function hex(value, fallback) {
  return String(value || fallback).replace(/^#/, "");
}
function escapeCssUrl(value) {
  return String(value).replace(/["\\\n\r\f]/g, "\\$&");
}
export {
  renderReportHtml
};
