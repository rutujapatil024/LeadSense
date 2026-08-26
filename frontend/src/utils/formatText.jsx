/**
 * formatText.jsx — Text & Markdown Formatting Utility
 * ====================================================
 * Cleans up raw Markdown asterisks (**bold**, *italic*) and renders
 * structured JSX with strong tags, clean line breaks, and bullets.
 */

import React from 'react';

/**
 * Parses text containing **bold** or *italic* tags and returns clean React nodes.
 */
export function renderFormattedText(text) {
  if (!text) return null;

  // Split by double newlines into paragraphs or bullet blocks
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    let trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} style={{ height: 8 }} />;

    // Check if line is a bullet point (starts with -, *, or •)
    const isBullet = /^[•\-\*]\s+/.test(trimmed);
    if (isBullet) {
      trimmed = trimmed.replace(/^[•\-\*]\s+/, '');
    }

    // Process **bold** syntax within the line
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const cleanContent = part.slice(2, -2);
        return <strong key={partIdx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cleanContent}</strong>;
      }
      // Clean up stray single asterisks if any
      const cleaned = part.replace(/\*/g, '');
      return <span key={partIdx}>{cleaned}</span>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '4px 0 4px 12px' }}>
          <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>•</span>
          <div>{content}</div>
        </div>
      );
    }

    return <p key={lineIdx} style={{ margin: '4px 0' }}>{content}</p>;
  });
}

/**
 * Strips all ** and * characters from plain string.
 */
export function cleanText(str) {
  if (!str) return '';
  return str.replace(/\*\*/g, '').replace(/\*/g, '').trim();
}
