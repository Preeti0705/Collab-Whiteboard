import React, { useEffect, useRef, useState } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';
import { WebSocketClient } from '../network/WebSocketClient';
import { Stroke } from '../types';
import type { Point } from '../types';
import { LWWElementSet } from '../crdt/LWWElementSet';
import './CanvasBoard.css';

const ROOM_ID = 'global-room';
const USER_ID = `user-${Math.floor(Math.random() * 1000)}`;
const WS_URL = 'ws://localhost:3001';

export const CanvasBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    engineRef.current = new CanvasEngine(canvasRef.current);
    wsClientRef.current = new WebSocketClient(WS_URL);
    wsClientRef.current.connect(ROOM_ID, USER_ID);

    const unsubscribe = wsClientRef.current.onMessage((msg) => {
      if (msg.type === 'draw_stroke') {
        const remoteStroke = Stroke.fromJSON(msg.stroke);
        engineRef.current?.addStroke(remoteStroke);
      } else if (msg.type === 'sync_state') {
        const remoteState = LWWElementSet.fromJSON(msg.state);
        engineRef.current?.setState(remoteState);
      }
    });

    return () => {
      engineRef.current?.stopRenderLoop();
      wsClientRef.current?.disconnect();
      unsubscribe();
    };
  }, []);

  const getPointerPos = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const pos = getPointerPos(e);
    const ts = Date.now();
    const newStroke = new Stroke(
      `${USER_ID}-${ts}`, 
      [pos], 
      'var(--cursor-self)', 
      ts, 
      USER_ID
    );
    setCurrentStroke(newStroke);
    engineRef.current?.addStroke(newStroke);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !currentStroke) return;
    
    const pos = getPointerPos(e);
    const ts = Date.now();
    
    // Create an updated CRDT stroke with a newer timestamp so it overwrites the old one
    const updatedStroke = new Stroke(
      currentStroke.id,
      [...currentStroke.points.value, pos],
      currentStroke.color.value,
      ts,
      USER_ID
    );
    
    setCurrentStroke(updatedStroke);
    engineRef.current?.addStroke(updatedStroke);
  };

  const onPointerUp = () => {
    setIsDrawing(false);
    if (currentStroke && wsClientRef.current) {
      wsClientRef.current.sendMessage({
        type: 'draw_stroke',
        roomId: ROOM_ID,
        stroke: currentStroke.toJSON()
      });
    }
    setCurrentStroke(null);
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none' }}
      />
      <div className="status-bar">
        <span>Room: {ROOM_ID}</span>
        <span>User: {USER_ID}</span>
      </div>
    </div>
  );
};
