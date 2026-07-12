import { Stroke } from '../types';
import { LWWElementSet } from '../crdt/LWWElementSet';

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: LWWElementSet = new LWWElementSet();
  
  // Animation frame ID
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
    // Handle high DPI displays (retina)
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
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    window.removeEventListener('resize', this.handleResize);
  };

  public addStroke(stroke: Stroke) {
    this.state.set(stroke);
  }

  public setState(remoteState: LWWElementSet) {
    this.state.merge(remoteState);
  }

  private draw() {
    // Clear canvas
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw all strokes
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = 3;

    for (const stroke of this.state.values()) {
      const points = stroke.points.value;
      const color = stroke.color.value;

      if (points.length < 2) continue;
      
      this.ctx.strokeStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      this.ctx.stroke();
    }
  }
}
