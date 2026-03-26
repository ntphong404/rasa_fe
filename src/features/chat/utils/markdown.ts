export function stripMarkdown(input: string): string {
  if (!input) return "";

  let text = input;

  // Remove fenced code blocks but keep content
  text = text.replace(/```[^\n]*\n?/g, "");
  text = text.replace(/```/g, "");

  // Inline code
  text = text.replace(/`([^`]+)`/g, "$1");

  // Images: ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Links: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Headings: remove leading # symbols
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");

  // Blockquotes: remove leading >
  text = text.replace(/^\s{0,3}>\s?/gm, "");

  // Lists: remove leading markers (-, *, +, 1.)
  text = text.replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "");

  // Horizontal rules
  text = text.replace(/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/gm, "");

  // Emphasis and strong
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");

  // Strikethrough
  text = text.replace(/~~(.*?)~~/g, "$1");

  // Remove HTML tags
  text = text.replace(/<\/?[^>]+>/g, "");

  return text.trim();
}
