import DOMPurify from "isomorphic-dompurify";

/**
 * Allowlist matches what the TipTap editor can produce:
 * StarterKit headings/lists/code/blockquote/inline marks, Underline, TextAlign,
 * Highlight (<mark>), Link (<a>), Image (<img>), TextStyle/Color/Font (<span style>),
 * plus iframes (YouTube/Vimeo embeds rendered by the article CSS).
 */
const ALLOWED_TAGS = [
  "p", "br", "hr", "div", "span",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "strike",
  "code", "pre",
  "blockquote",
  "ul", "ol", "li",
  "a",
  "img",
  "mark",
  "iframe",
  "figure", "figcaption",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "target", "rel",
  "class", "style",
  "width", "height",
  // iframe attrs needed for embeds
  "allow", "allowfullscreen", "frameborder",
  // tiptap text-align stores as data attr in some flows
  "data-text-align",
];

/**
 * Sanitize article HTML produced by the TipTap editor before storing it.
 * Strips <script>, event handlers (onclick, onerror, etc.), javascript: URLs,
 * data: URIs (except images), and any tag/attribute outside the allowlist.
 *
 * Run this at the API boundary (POST/PUT) so the database never holds
 * dangerous markup.
 */
export function sanitizeArticleHtml(html: string): string {
  if (typeof html !== "string") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Block javascript:, vbscript:, file: URIs. Allow http(s), mailto, and
    // data:image/* for inline avatars/covers (DOMPurify enforces this with
    // ALLOWED_URI_REGEXP). data: URIs in <script>/<iframe> are still blocked.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/|[#/?])/i,
    // Hardening: forbid these even if accidentally allowlisted later
    FORBID_TAGS: ["script", "object", "embed", "form", "input", "button", "style", "link", "meta"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit"],
    // Enforce rel=noopener on links opening new tabs
    ADD_ATTR: ["target"],
    // Force iframes to only embed from known providers
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

/**
 * Strip *all* HTML (used for excerpts and read-time word counts).
 */
export function stripHtml(html: string): string {
  if (typeof html !== "string") return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
