"use client";

import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

interface DocRendererProps {
  content: string;
}

function renderMarkdown(md: string): string {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(rehypeStringify)
    .processSync(md);
  return String(result);
}

function preProcessContainers(md: string): string {
  // Convert VitePress-style ::: containers to HTML before remark
  return md.replace(
    /^::: (info|warning|tip|danger)(?: (.+))?\n([\s\S]*?)^:::\s*$/gm,
    (_match, type: string, title: string | undefined, body: string) => {
      const heading = title ? `<p class="container-title">${title}</p>` : "";
      return `<div class="custom-container ${type}">${heading}\n\n${body.trim()}\n\n</div>`;
    }
  );
}

function postProcessHtml(html: string): string {
  // Make external links open in new tab
  html = html.replace(
    /<a href="(https?:\/\/[^"]+)">/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">'
  );
  // Add language labels to highlighted code blocks
  html = html.replace(
    /<pre><code class="hljs language-(\w+)">/g,
    '<pre class="code-block" data-language="$1"><code class="hljs language-$1">'
  );
  // Wrap plain pre>code in diagram container
  html = html.replace(
    /<pre><code(?! class="hljs)([^>]*)>/g,
    '<pre class="ascii-diagram"><code$1>'
  );
  return html;
}

export function DocRenderer({ content }: DocRendererProps) {
  const html = useMemo(() => {
    if (!content) return "<p class='text-zinc-500'>暂无内容</p>";
    const preprocessed = preProcessContainers(content);
    const raw = renderMarkdown(preprocessed);
    return postProcessHtml(raw);
  }, [content]);

  return (
    <div className="py-4">
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
