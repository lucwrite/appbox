export type BuildMode = "single" | "parts";

export interface BuildInput {
  mode: BuildMode;
  title: string;
  singleCode: string;
  htmlPart: string;
  cssPart: string;
  jsPart: string;
  iconDataUrl: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strips a single leading/trailing markdown code fence, e.g. ```html ... ``` */
export function stripCodeFences(code: string): string {
  const trimmed = code.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n?```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

export function isFullDocument(code: string): boolean {
  return /<html[\s>]/i.test(code) || /<!doctype\s+html/i.test(code);
}

function stripExistingIcons(head: string): string {
  return head.replace(/<link[^>]+rel=["']?(?:shortcut icon|icon)["']?[^>]*>\s*/gi, "");
}

function stripExistingTitle(head: string): string {
  return head.replace(/<title>[\s\S]*?<\/title>\s*/i, "");
}

function buildHead(existingHeadInner: string, title: string, iconDataUrl: string): string {
  let head = existingHeadInner;
  head = stripExistingIcons(head);
  head = stripExistingTitle(head);

  const metaCharset = /<meta[^>]+charset/i.test(head) ? "" : `<meta charset="UTF-8">\n`;
  const metaViewport = /<meta[^>]+viewport/i.test(head)
    ? ""
    : `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
  const titleTag = title ? `<title>${escapeHtml(title)}</title>\n` : "";
  const iconTag = iconDataUrl
    ? `<link rel="icon" href="${iconDataUrl}">\n<link rel="shortcut icon" href="${iconDataUrl}">\n`
    : "";

  return `${metaCharset}${metaViewport}${titleTag}${iconTag}${head}`;
}

function injectIntoFullDocument(code: string, title: string, iconDataUrl: string): string {
  const headMatch = code.match(/<head[^>]*>([\s\S]*?)<\/head>/i);

  if (headMatch) {
    const newHeadInner = buildHead(headMatch[1], title, iconDataUrl);
    return code.replace(headMatch[0], `<head>\n${newHeadInner}</head>`);
  }

  const newHeadInner = buildHead("", title, iconDataUrl);
  const headBlock = `<head>\n${newHeadInner}</head>\n`;
  const htmlMatch = code.match(/<html[^>]*>/i);

  if (htmlMatch) {
    const idx = code.indexOf(htmlMatch[0]) + htmlMatch[0].length;
    return code.slice(0, idx) + "\n" + headBlock + code.slice(idx);
  }

  return headBlock + code;
}

function buildFromParts(html: string, css: string, js: string, title: string, iconDataUrl: string): string {
  const headInner = buildHead("", title, iconDataUrl);
  const styleBlock = css.trim() ? `<style>\n${css}\n</style>\n` : "";
  const scriptBlock = js.trim() ? `<script>\n${js}\n</script>\n` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
${headInner}${styleBlock}</head>
<body>
${html}
${scriptBlock}</body>
</html>
`;
}

export function buildOutputHtml(input: BuildInput): string {
  const title = input.title.trim() || "My App";

  if (input.mode === "parts") {
    return buildFromParts(
      stripCodeFences(input.htmlPart),
      stripCodeFences(input.cssPart),
      stripCodeFences(input.jsPart),
      title,
      input.iconDataUrl
    );
  }

  const code = stripCodeFences(input.singleCode);

  if (!code.trim()) {
    return buildFromParts("", "", "", title, input.iconDataUrl);
  }

  if (isFullDocument(code)) {
    const withDoctype = /<!doctype/i.test(code) ? code : `<!DOCTYPE html>\n${code}`;
    return injectIntoFullDocument(withDoctype, title, input.iconDataUrl);
  }

  return buildFromParts(code, "", "", title, input.iconDataUrl);
}
