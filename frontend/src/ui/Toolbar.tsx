import React from 'react';
import type { ToolType } from '../types';
import './Toolbar.css';

/**
 * Toolbar — The primary tool selection bar at the top of the canvas.
 *
 * Design: Floating bar centered at the top, glassmorphism style.
 * Each tool is a button with an SVG icon and a tooltip.
 * The active tool is highlighted with the accent color.
 *
 * Now also includes undo/redo buttons.
 */

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (w: number) => void;
  onDelete: () => void;
  hasSelection: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: 'Select (V)', icon: '↖' },
  { type: 'pen', label: 'Pen (P)', icon: '✏️' },
  { type: 'rectangle', label: 'Rectangle (R)', icon: '▭' },
  { type: 'ellipse', label: 'Ellipse (O)', icon: '○' },
  { type: 'line', label: 'Line (L)', icon: '╱' },
  { type: 'arrow', label: 'Arrow (A)', icon: '→' },
  { type: 'text', label: 'Text (T)', icon: 'T' },
];

const PALETTE = [
  '#89b4fa', '#f38ba8', '#a6e3a1', '#fab387',
  '#cba6f7', '#f9e2af', '#94e2d5', '#74c7ec',
  '#eba0ac', '#b4befe', '#cdd6f4', '#585b70',
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onDelete,
  hasSelection,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="toolbar" id="toolbar">
      {/* Undo / Redo */}
      <div className="toolbar__actions">
        <button
          className={`toolbar__btn ${!canUndo ? 'toolbar__btn--disabled' : ''}`}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          id="tool-undo"
          disabled={!canUndo}
        >
          <span className="toolbar__icon">↩</span>
        </button>
        <button
          className={`toolbar__btn ${!canRedo ? 'toolbar__btn--disabled' : ''}`}
          onClick={onRedo}
          title="Redo (Ctrl+Shift+Z)"
          id="tool-redo"
          disabled={!canRedo}
        >
          <span className="toolbar__icon">↪</span>
        </button>
      </div>

      <div className="toolbar__sep" />

      {/* Tool buttons */}
      <div className="toolbar__tools">
        {TOOLS.map(({ type, label, icon }) => (
          <button
            key={type}
            className={`toolbar__btn ${activeTool === type ? 'toolbar__btn--active' : ''}`}
            onClick={() => onToolChange(type)}
            title={label}
            id={`tool-${type}`}
          >
            <span className="toolbar__icon">{icon}</span>
          </button>
        ))}
      </div>

      <div className="toolbar__sep" />

      {/* Color picker */}
      <div className="toolbar__colors">
        {PALETTE.map((c) => (
          <button
            key={c}
            className={`toolbar__color ${activeColor === c ? 'toolbar__color--active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
            title={c}
          />
        ))}
      </div>

      <div className="toolbar__sep" />

      {/* Stroke width */}
      <div className="toolbar__width">
        <label title="Stroke width">
          <input
            type="range"
            min="1"
            max="12"
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            className="toolbar__slider"
          />
        </label>
        <span className="toolbar__width-label">{strokeWidth}px</span>
      </div>

      {/* Delete button (only when selected) */}
      {hasSelection && (
        <>
          <div className="toolbar__sep" />
          <button
            className="toolbar__btn toolbar__btn--danger"
            onClick={onDelete}
            title="Delete (Del)"
            id="tool-delete"
          >
            🗑️
          </button>
        </>
      )}
    </div>
  );
};
