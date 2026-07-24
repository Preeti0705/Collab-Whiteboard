import { Shape } from '../types';
import type { UserPresence } from '../types';
import { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * CanvasEngine — The rendering heart of the whiteboard.
 *
 * Rendering layers (drawn in order):
 *   1. Background clear
 *   2. Dot grid
 *   3. All shapes from the CRDT state (sorted by zIndex)
 *   4. Selection handles (if a shape is selected)
 *   5. Remote user cursors
 *
 * Shape rendering dispatches on `shape.shapeType.value`:
 *   - 'freehand' → polyline through all points
 *   - 'rectangle' → stroked/filled rect from two corner points
 *   - 'ellipse' → stroked/filled ellipse inscribed in bounding box
 *   - 'line' → straight line between two points
 *   - 'arrow' → line with arrowhead at the end
 *   - 'text' → fillText at position
 */
export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: LWWElementSet = new LWWElementSet();
  private cursors: Map<string, UserPresence> = new Map();
  private selectedShapeId: string | null = null;
  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }

  private handleResize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  };

  private startRenderLoop = () => {
    const render = () => {
      this.draw();
      this.rafId = requestAnimationFrame(render);
    };
    this.rafId = requestAnimationFrame(render);
  };

  public stopRenderLoop = () => {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
  };

  // -- Public API --

  public getState(): LWWElementSet {
    return this.state;
  }

  public addShape(shape: Shape) {
    this.state.set(shape);
  }

  // Backward compatibility alias
  public addStroke(stroke: Shape) {
    this.state.set(stroke);
  }

  public setState(remoteState: LWWElementSet) {
    this.state.merge(remoteState);
  }

  public setCursors(cursors: Map<string, UserPresence>) {
    this.cursors = cursors;
  }

  public setSelectedShape(id: string | null) {
    this.selectedShapeId = id;
  }

  // -- Main draw loop --

  private draw() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.ctx.clearRect(0, 0, w, h);
    this.drawDotGrid(w, h);
    this.drawShapes();
    this.drawSelectionHandles();
    this.drawCursors();
  }

  // -- Layer: Dot grid --

  private drawDotGrid(width: number, height: number) {
    const spacing = 24;
    this.ctx.fillStyle = 'rgba(69, 71, 90, 0.4)';
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  // -- Layer: Shapes --

  private drawShapes() {
    for (const shape of this.state.values()) {
      const type = shape.shapeType.value;
      switch (type) {
        case 'freehand': this.drawFreehand(shape); break;
        case 'rectangle': this.drawRectangle(shape); break;
        case 'ellipse': this.drawEllipse(shape); break;
        case 'line': this.drawLine(shape); break;
        case 'arrow': this.drawArrow(shape); break;
        case 'text': this.drawText(shape); break;
      }
    }
  }

  private drawFreehand(shape: Shape) {
    const points = shape.points.value;
    if (points.length < 2) return;

    this.ctx.strokeStyle = shape.color.value;
    this.ctx.lineWidth = shape.strokeWidth.value;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
  }

  private drawRectangle(shape: Shape) {
    const pts = shape.points.value;
    if (pts.length < 2) return;

    const [tl, br] = pts;
    const w = br.x - tl.x;
    const h = br.y - tl.y;

    // Fill
    if (shape.fillColor.value !== 'transparent') {
      this.ctx.fillStyle = shape.fillColor.value;
      this.ctx.fillRect(tl.x, tl.y, w, h);
    }

    // Stroke
    this.ctx.strokeStyle = shape.color.value;
    this.ctx.lineWidth = shape.strokeWidth.value;
    this.ctx.lineJoin = 'miter';
    this.ctx.strokeRect(tl.x, tl.y, w, h);
  }

  private drawEllipse(shape: Shape) {
    const pts = shape.points.value;
    if (pts.length < 2) return;

    const [tl, br] = pts;
    const cx = (tl.x + br.x) / 2;
    const cy = (tl.y + br.y) / 2;
    const rx = Math.abs(br.x - tl.x) / 2;
    const ry = Math.abs(br.y - tl.y) / 2;

    if (rx === 0 || ry === 0) return;

    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (shape.fillColor.value !== 'transparent') {
      this.ctx.fillStyle = shape.fillColor.value;
      this.ctx.fill();
    }

    this.ctx.strokeStyle = shape.color.value;
    this.ctx.lineWidth = shape.strokeWidth.value;
    this.ctx.stroke();
  }

  private drawLine(shape: Shape) {
    const pts = shape.points.value;
    if (pts.length < 2) return;

    this.ctx.strokeStyle = shape.color.value;
    this.ctx.lineWidth = shape.strokeWidth.value;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(pts[0].x, pts[0].y);
    this.ctx.lineTo(pts[1].x, pts[1].y);
    this.ctx.stroke();
  }

  private drawArrow(shape: Shape) {
    const pts = shape.points.value;
    if (pts.length < 2) return;

    const [start, end] = pts;

    // Draw the line
    this.ctx.strokeStyle = shape.color.value;
    this.ctx.lineWidth = shape.strokeWidth.value;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 14;

    this.ctx.fillStyle = shape.color.value;
    this.ctx.beginPath();
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawText(shape: Shape) {
    const pts = shape.points.value;
    if (pts.length < 1 || !shape.text.value) return;

    const { x, y } = pts[0];
    this.ctx.fillStyle = shape.color.value;
    this.ctx.font = '16px Inter, system-ui, sans-serif';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(shape.text.value, x, y);
  }

  // -- Layer: Selection handles --

  private drawSelectionHandles() {
    if (!this.selectedShapeId) return;

    const shape = this.state.get(this.selectedShapeId);
    if (!shape || shape.isDeleted.value) {
      this.selectedShapeId = null;
      return;
    }

    const bounds = shape.getBounds();
    const pad = 6;

    // Dashed selection border
    this.ctx.save();
    this.ctx.strokeStyle = '#89b4fa';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([6, 4]);
    this.ctx.strokeRect(
      bounds.minX - pad,
      bounds.minY - pad,
      bounds.maxX - bounds.minX + pad * 2,
      bounds.maxY - bounds.minY + pad * 2
    );
    this.ctx.setLineDash([]);

    // Corner handles
    const handleSize = 7;
    const corners = [
      { x: bounds.minX - pad, y: bounds.minY - pad },
      { x: bounds.maxX + pad, y: bounds.minY - pad },
      { x: bounds.minX - pad, y: bounds.maxY + pad },
      { x: bounds.maxX + pad, y: bounds.maxY + pad },
    ];

    this.ctx.fillStyle = '#1e1e2e';
    this.ctx.strokeStyle = '#89b4fa';
    this.ctx.lineWidth = 2;
    for (const c of corners) {
      this.ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      this.ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    }

    this.ctx.restore();
  }

  // -- Layer: Cursors --

  private drawCursors() {
    for (const [, presence] of this.cursors) {
      if (!presence.cursor) continue;

      const { x, y } = presence.cursor;
      const color = presence.color;

      this.ctx.save();
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      this.ctx.lineWidth = 1;

      // Pointer arrow
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + 18);
      this.ctx.lineTo(x + 5, y + 14);
      this.ctx.lineTo(x + 12, y + 18);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Name badge
      const name = presence.displayName || presence.userId;
      const fontSize = 11;
      this.ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      const textWidth = this.ctx.measureText(name).width;
      const badgePad = 6;
      const badgeX = x + 4;
      const badgeY = y + 20;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.roundRect(badgeX, badgeY, textWidth + badgePad * 2, fontSize + badgePad * 2, 4);
      this.ctx.fill();

      this.ctx.fillStyle = '#1e1e2e';
      this.ctx.fillText(name, badgeX + badgePad, badgeY + badgePad + fontSize - 2);

      this.ctx.restore();
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
  }
}
