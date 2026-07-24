import React, { useState, useRef, useEffect } from 'react';
import type { LWWElementSet } from '../crdt/LWWElementSet';
import type { Shape, Point } from '../types';
import './ExportMenu.css';

/**
 * ExportMenu — Dropdown for exporting the canvas in various formats.
 *
 * Supported formats:
 *   - PNG: Renders the canvas to a data URL and triggers download
 *   - SVG: Reconstructs shapes as SVG elements
 *   - JSON: Serializes the CRDT state
 *
 * Design: Small floating button that expands into a dropdown on click.
 */

interface ExportMenuProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: LWWElementSet | null;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ canvasRef, state }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // ── PNG Export ─────────────────────────────────────────────────────
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, 'whiteboard.png');
    }, 'image/png');
  };

  // ── SVG Export ─────────────────────────────────────────────────────
  const exportSVG = () => {
    if (!state) return;

    const shapes = state.values();
    const canvas = canvasRef.current;
    const w = canvas?.getBoundingClientRect().width || 1920;
    const h = canvas?.getBoundingClientRect().height || 1080;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n`;
    svg += `  <rect width="${w}" height="${h}" fill="#1e1e2e"/>\n`;

    for (const shape of shapes) {
      svg += shapeToSVG(shape);
    }

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    triggerDownload(blob, 'whiteboard.svg');
  };

  // ── JSON Export ────────────────────────────────────────────────────
  const exportJSON = () => {
    if (!state) return;

    const json = JSON.stringify(state.toJSON(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, 'whiteboard.json');
  };

  return (
    <div className="export-menu" ref={menuRef} id="export-menu">
      <button
        className="export-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Export"
      >
        📥
      </button>

      {isOpen && (
        <div className="export-menu__dropdown">
          <button className="export-menu__item" onClick={exportPNG}>
            <span className="export-menu__icon">🖼️</span>
            Export as PNG
          </button>
          <button className="export-menu__item" onClick={exportSVG}>
            <span className="export-menu__icon">📐</span>
            Export as SVG
          </button>
          <button className="export-menu__item" onClick={exportJSON}>
            <span className="export-menu__icon">📄</span>
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
};

// ── Helper: Convert a Shape to an SVG element string ─────────────────

function shapeToSVG(shape: Shape): string {
  const type = shape.shapeType.value;
  const pts = shape.points.value;
  const color = shape.color.value;
  const fill = shape.fillColor.value;
  const sw = shape.strokeWidth.value;

  switch (type) {
    case 'freehand':
      if (pts.length < 2) return '';
      const d = pts.map((p: Point, i: number) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
      return `  <path d="${d}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>\n`;

    case 'rectangle':
      if (pts.length < 2) return '';
      const rx = Math.min(pts[0].x, pts[1].x);
      const ry = Math.min(pts[0].y, pts[1].y);
      const rw = Math.abs(pts[1].x - pts[0].x);
      const rh = Math.abs(pts[1].y - pts[0].y);
      return `  <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" stroke="${color}" stroke-width="${sw}" fill="${fill === 'transparent' ? 'none' : fill}"/>\n`;

    case 'ellipse':
      if (pts.length < 2) return '';
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const erx = Math.abs(pts[1].x - pts[0].x) / 2;
      const ery = Math.abs(pts[1].y - pts[0].y) / 2;
      return `  <ellipse cx="${cx}" cy="${cy}" rx="${erx}" ry="${ery}" stroke="${color}" stroke-width="${sw}" fill="${fill === 'transparent' ? 'none' : fill}"/>\n`;

    case 'line':
      if (pts.length < 2) return '';
      return `  <line x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[1].x}" y2="${pts[1].y}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>\n`;

    case 'arrow': {
      if (pts.length < 2) return '';
      const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      const hl = 14;
      const ax1 = pts[1].x - hl * Math.cos(angle - Math.PI / 6);
      const ay1 = pts[1].y - hl * Math.sin(angle - Math.PI / 6);
      const ax2 = pts[1].x - hl * Math.cos(angle + Math.PI / 6);
      const ay2 = pts[1].y - hl * Math.sin(angle + Math.PI / 6);
      return `  <line x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[1].x}" y2="${pts[1].y}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>\n` +
        `  <polygon points="${pts[1].x},${pts[1].y} ${ax1},${ay1} ${ax2},${ay2}" fill="${color}"/>\n`;
    }

    case 'text':
      if (pts.length < 1 || !shape.text.value) return '';
      return `  <text x="${pts[0].x}" y="${pts[0].y + 16}" fill="${color}" font-family="Inter, system-ui, sans-serif" font-size="16">${escapeXml(shape.text.value)}</text>\n`;

    default:
      return '';
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
