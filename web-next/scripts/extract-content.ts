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

// Map MD image paths to actual diagram filenames in public/diagrams/
const IMAGE_PATH_MAP: Record<string, string> = {
  "/diagrams/s01-agent-loop-flow.png": "/diagrams/s01-agent-loop.png",
  "/diagrams/s02-tool-pipeline.png": "/diagrams/s02-tool-pipeline.png",
  "/diagrams/s04-permission-pipeline.png": "/diagrams/s04-permission-waterfall.png",
  "/diagrams/s07-compression-layers.png": "/diagrams/s07-compression.png",
};

function fixImagePaths(content: string): string {
  // Rewrite known image paths to match actual filenames
  for (const [from, to] of Object.entries(IMAGE_PATH_MAP)) {
    content = content.replace(from, to);
  }
  // Remove image references that have no corresponding file
  content = content.replace(/!\[[^\]]*\]\(\/diagrams\/[^)]+\)\n?/g, (match) => {
    const src = match.match(/\(([^)]+)\)/)?.[1] || "";
    if (Object.values(IMAGE_PATH_MAP).some(p => src === p)) {
      return match; // keep — file exists
    }
    return ""; // remove — no file
  });
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
    const sections = extractSections(withFixedImages);

    docs.push({ id, ...sections });
    console.log(`  ${id}: learn=${sections.learn.length}c source=${sections.source.length}c deep=${sections.deepDive.length}c`);
  }

  const output = JSON.stringify({ docs }, null, 2);
  fs.writeFileSync(path.join(OUT_DIR, "docs.json"), output);
  console.log(`\nWrote ${docs.length} lessons to docs.json`);
}

main();
