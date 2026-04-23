import fs from 'node:fs';
import path from 'node:path';

const WPM = 220;

// Read the raw source file for a collection entry (handles both .md and
// .mdx) and returns an estimated read time in minutes, minimum 1.
export function estimateReadTimeFromFile(
  collectionBase: string,
  entryId: string,
): number | undefined {
  const candidates = [
    path.resolve(collectionBase, `${entryId}.mdx`),
    path.resolve(collectionBase, `${entryId}.md`),
  ];
  for (const filePath of candidates) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return wordsToReadTime(countWords(raw));
    } catch {
      // Try next extension
    }
  }
  return undefined;
}

// Count words in an absolute file path. Used by hand-crafted essay
// pages where the prose lives inside the .astro file itself.
export function estimateReadTimeFromPath(absolutePath: string): number | undefined {
  try {
    const raw = fs.readFileSync(absolutePath, 'utf-8');
    return wordsToReadTime(countWords(raw));
  } catch {
    return undefined;
  }
}

// Count prose words in a raw markdown/mdx source after stripping
// frontmatter, imports, code blocks, inline code, and HTML/JSX tags.
export function countWords(source: string): number {
  let body = source;
  body = body.replace(/^---[\s\S]*?---\s*/, '');     // frontmatter
  body = body.replace(/^import .*$/gm, '');          // MDX imports
  body = body.replace(/```[\s\S]*?```/g, '');        // fenced code blocks
  body = body.replace(/`[^`]*`/g, '');               // inline code
  body = body.replace(/<[^>]*>/g, '');               // HTML/JSX tags
  body = body.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // markdown links → link text
  body = body.replace(/[*_~#>]/g, ' ');              // markdown punctuation
  return body.trim().split(/\s+/).filter(Boolean).length;
}

export function wordsToReadTime(words: number): number {
  return Math.max(1, Math.round(words / WPM));
}
