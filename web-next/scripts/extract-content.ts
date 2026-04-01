import * as fs from "fs";
import * as path from "path";

/**
 * Extract content from tutorial/guide/s*.md files and generate docs.json.
 *
 * Each MD file is split by `## ` headings into three tab categories:
 *   - source:   sections with headings containing "源码映射" or "Python 伪代码"
 *   - deepDive: sections with headings containing "Why", "动手试试", or "推荐阅读"
 *   - learn:    everything else
 *
 * The generated docs.json is committed to the repo so the site can build
 * without the tutorial/guide source files (e.g. on Vercel).
 */

interface DocContent {
  id: string;
  learn: string;
  source: string;
  deepDive: string;
}

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GUIDE_DIR = path.join(REPO_ROOT, "tutorial", "guide");
const OUT_DIR = path.join(__dirname, "..", "src", "data", "generated");

// Section heading → tab mapping
const SOURCE_SECTIONS = ["源码映射", "Python 伪代码"];
const DEEP_DIVE_SECTIONS = ["Why", "动手试试", "推荐阅读"];
// Everything else goes to "learn"

// Reference citation URLs — maps [RX-N] tags to their source URLs
const REFERENCE_URLS: Record<string, { title: string; url: string }> = {
  // R1 series — from docs/research/05-harness-trends-deep-20260401.md
  "R1-1":  { title: "Philschmid", url: "https://www.philschmid.de/agent-harness-2026" },
  "R1-2":  { title: "LangChain", url: "https://blog.langchain.com/improving-deep-agents-with-harness-engineering/" },
  "R1-3":  { title: "LangChain", url: "https://blog.langchain.com/context-engineering/" },
  "R1-4":  { title: "Harrison Chase", url: "https://www.linkedin.com/posts/harrison-chase-961287118_agent-framework-vs-runtime-vs-harness-activity-7387885717261078529-_Mn_" },
  "R1-5":  { title: "Anthropic", url: "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents" },
  "R1-6":  { title: "The AI Corner", url: "https://www.the-ai-corner.com/p/context-engineering-guide-2026" },
  "R1-7":  { title: "Epsilla", url: "https://www.epsilla.com" },
  "R1-12": { title: "AI Positive", url: "https://aipositive.substack.com" },
  "R1-11": { title: "Kushal Banda", url: "https://medium.com" },
  "R1-13": { title: "Aakash Gupta", url: "https://aakashgupta.medium.com/2025-was-agents-2026-is-agent-harnesses-heres-why-that-changes-everything-073e9877655e" },
  // R2 series — from docs/research/06-agent-architecture-deep-20260401.md
  "R2-1":  { title: "sketch.dev", url: "https://sketch.dev/blog/agent-loop" },
  "R2-2":  { title: "Browser Use", url: "https://browser-use.com/posts/bitter-lesson" },
  "R2-3":  { title: "Browser Use", url: "https://github.com/browser-use/agent-sdk" },
  "R2-4":  { title: "Vercel", url: "https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools" },
  "R2-5":  { title: "Vercel", url: "https://x.com/vercel" },
  "R2-7":  { title: "Arcade.dev", url: "https://www.arcade.dev/blog/skills-vs-tools" },
  "R2-9":  { title: "ZenML", url: "https://www.zenml.io/blog/evaluating-context-compression-strategies" },
  "R2-10": { title: "Factory AI", url: "https://www.facebook.com" },
  "R2-11": { title: "Manus", url: "https://medium.com" },
  "R2-12": { title: "Manus/ZenML", url: "https://www.zenml.io" },
  "R2-13": { title: "Cursor/ZenML", url: "https://www.zenml.io" },
  "R2-14": { title: "Level Up Coding", url: "https://levelup.gitconnected.com" },
  "R2-15": { title: "Indium", url: "https://www.indium.tech" },
  "R2-16": { title: "AgileSoftLabs", url: "https://www.agilesoftlabs.com" },
  "R2-18": { title: "Dev.to", url: "https://dev.to" },
  "R2-21": { title: "MorphLLM", url: "https://morphllm.com" },
  "R2-25": { title: "Daniel Miessler", url: "https://danielmiessler.com/p/bitter-lesson-engineering" },
  "R2-6":  { title: "The New Stack", url: "https://thenewstack.io" },
  "R2-17": { title: "Google Developers", url: "https://developers.googleblog.com" },
  "R2-19": { title: "Infosec Conferences", url: "https://infosec-conferences.com" },
  "R2-24": { title: "Alexander Yue", url: "https://www.linkedin.com" },
  "R2-26": { title: "Armin Ronacher", url: "https://lucumr.pocoo.org" },
};

function linkifyCitations(content: string): string {
  // First pass: when "Name [RX-N]" and Name matches the ref title, merge into one link
  // e.g. "Philschmid [R1-1]" → "[Philschmid](url)" instead of "Philschmid [Philschmid](url)"
  let result = content;
  for (const [key, ref] of Object.entries(REFERENCE_URLS)) {
    // Escape special regex chars in title
    const escaped = ref.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}\\s*\\[${key}\\]`, "g");
    result = result.replace(pattern, `[${ref.title}](${ref.url})`);
  }
  // Second pass: replace remaining standalone [RX-N] citations
  result = result.replace(/\[R(\d+-\d+)\]/g, (_match, id: string) => {
    const ref = REFERENCE_URLS[`R${id}`];
    if (!ref) return _match;
    return `[${ref.title}](${ref.url})`;
  });
  return result;
}

// Map MD image paths to actual diagram filenames in public/diagrams/
const IMAGE_PATH_MAP: Record<string, string> = {
  "/diagrams/s01-agent-loop-flow.png": "/diagrams/s01-agent-loop.png",
  "/diagrams/s02-tool-pipeline.png": "/diagrams/s02-tool-pipeline.png",
  "/diagrams/s04-permission-pipeline.png": "/diagrams/s04-permission-waterfall.png",
  "/diagrams/s07-compression-layers.png": "/diagrams/s07-compression.png",
};

function fixImagePaths(content: string): string {
  // Only rewrite known image paths to match actual filenames; keep all other references as-is
  for (const [from, to] of Object.entries(IMAGE_PATH_MAP)) {
    content = content.replace(from, to);
  }
  return content;
}

function extractSections(content: string): { learn: string; source: string; deepDive: string } {
  const sections = content.split(/(?=^## )/m);

  const learn: string[] = [];
  const source: string[] = [];
  const deepDive: string[] = [];

  for (const section of sections) {
    const headingMatch = section.match(/^## (.+)/m);
    if (!headingMatch) {
      learn.push(section);
      continue;
    }

    const heading = headingMatch[1].trim();

    if (SOURCE_SECTIONS.some((s) => heading.includes(s))) {
      source.push(section);
    } else if (DEEP_DIVE_SECTIONS.some((s) => heading.includes(s))) {
      deepDive.push(section);
    } else {
      learn.push(section);
    }
  }

  return {
    learn: learn.join("\n").trim(),
    source: source.join("\n").trim(),
    deepDive: deepDive.join("\n").trim(),
  };
}

function main() {
  console.log("Extracting content from tutorial/guide...");

  // Skip extraction if guide directory doesn't exist (e.g. Vercel build).
  // Pre-committed docs.json will be used instead.
  if (!fs.existsSync(GUIDE_DIR)) {
    console.log("  Guide directory not found, skipping extraction.");
    console.log("  Using pre-committed docs.json.");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(GUIDE_DIR)
    .filter((f) => f.match(/^s\d+-.*\.md$/))
    .sort();

  const docs: DocContent[] = [];

  for (const file of files) {
    const id = file.match(/^(s\d+)/)?.[1];
    if (!id) continue;

    const content = fs.readFileSync(path.join(GUIDE_DIR, file), "utf-8");
    const withoutH1 = content.replace(/^# .+\n/, "");
    const withFixedImages = fixImagePaths(withoutH1);
    const withLinkedCitations = linkifyCitations(withFixedImages);
    const sections = extractSections(withLinkedCitations);

    docs.push({ id, ...sections });
    console.log(`  ${id}: learn=${sections.learn.length}c source=${sections.source.length}c deep=${sections.deepDive.length}c`);
  }

  const output = JSON.stringify({ docs }, null, 2);
  fs.writeFileSync(path.join(OUT_DIR, "docs.json"), output);
  console.log(`\nWrote ${docs.length} lessons to docs.json`);
}

main();
