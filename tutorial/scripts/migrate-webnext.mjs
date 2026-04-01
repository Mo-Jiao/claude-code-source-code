#!/usr/bin/env node
/**
 * migrate-webnext.mjs
 *
 * Reads scenario and annotation JSON files from web-next/src/data/
 * and outputs markdown fragment files to tutorial/guide/_fragments/.
 *
 * Zero external dependencies -- only fs and path.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const SCENARIOS_DIR = join(ROOT, 'web-next', 'src', 'data', 'scenarios');
const ANNOTATIONS_DIR = join(ROOT, 'web-next', 'src', 'data', 'annotations');
const FRAGMENTS_DIR = join(ROOT, 'tutorial', 'guide', '_fragments');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape HTML and convert newlines to <br> to avoid blank lines inside HTML blocks */
function escapeHtmlInline(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

const STEP_ICONS = {
  user_message: '👤 用户消息',
  assistant_text: '🤖 助手回复',
  tool_call: '🔧 Tool Call',
  tool_result: '✅ Tool Result',
  system_event: '⚙️ 系统事件',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function tryReadJson(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// ---------------------------------------------------------------------------
// Scenario -> sim-sXX.md
// ---------------------------------------------------------------------------

function buildScenarioFragment(scenario) {
  const lines = [];
  lines.push('<div class="simulator-container">');
  lines.push(`<h4>${escapeHtml(scenario.title)}</h4>`);
  lines.push(`<p class="sim-description">${escapeHtml(scenario.description)}</p>`);

  for (const step of scenario.steps) {
    const typeCss = step.type; // e.g. "tool_call"
    let header = STEP_ICONS[step.type] || step.type;
    if (step.toolName && (step.type === 'tool_call' || step.type === 'tool_result')) {
      header += ` \u00b7 ${escapeHtml(step.toolName)}`;
    }

    lines.push(`<div class="sim-step sim-${typeCss}">`);
    lines.push(`  <div class="sim-step-header">${header}</div>`);
    lines.push(`  <div class="sim-step-content">${escapeHtmlInline(step.content)}</div>`);
    if (step.annotation) {
      lines.push(`  <div class="sim-step-annotation">${escapeHtmlInline(step.annotation)}</div>`);
    }
    lines.push('</div>');
  }

  lines.push('</div>');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Annotation -> ann-sXX.md
// ---------------------------------------------------------------------------

function buildAnnotationFragment(annotation) {
  const blocks = [];

  for (const d of annotation.decisions) {
    const title = d.zh?.title || d.title;
    const description = d.zh?.description || d.description;

    // alternatives is a plain string; split into bullet if it contains multiple sentences,
    // but per spec just prefix with "- "
    const altText = d.alternatives
      ? d.alternatives
          .split('\n')
          .filter(Boolean)
          .map((line) => `- ${line}`)
          .join('\n')
      : '';

    const lines = [];
    lines.push('<details>');
    lines.push(`<summary><strong>设计决策：${title}</strong></summary>`);
    lines.push('');
    lines.push(description);
    lines.push('');
    if (altText) {
      lines.push('::: tip 替代方案');
      lines.push(altText);
      lines.push(':::');
    }
    lines.push('</details>');

    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  mkdirSync(FRAGMENTS_DIR, { recursive: true });

  const created = [];

  // Process scenarios s01-s16
  for (let i = 1; i <= 16; i++) {
    const id = `s${pad(i)}`;
    const data = tryReadJson(join(SCENARIOS_DIR, `${id}.json`));
    if (!data) continue;
    const md = buildScenarioFragment(data);
    const outPath = join(FRAGMENTS_DIR, `sim-${id}.md`);
    writeFileSync(outPath, md + '\n', 'utf-8');
    created.push(`sim-${id}.md`);
  }

  // Process annotations s00-s16
  for (let i = 0; i <= 16; i++) {
    const id = `s${pad(i)}`;
    const data = tryReadJson(join(ANNOTATIONS_DIR, `${id}.json`));
    if (!data) continue;
    const md = buildAnnotationFragment(data);
    const outPath = join(FRAGMENTS_DIR, `ann-${id}.md`);
    writeFileSync(outPath, md + '\n', 'utf-8');
    created.push(`ann-${id}.md`);
  }

  console.log(`Created ${created.length} fragment files in tutorial/guide/_fragments/:`);
  for (const f of created) {
    console.log(`  ${f}`);
  }
}

main();
