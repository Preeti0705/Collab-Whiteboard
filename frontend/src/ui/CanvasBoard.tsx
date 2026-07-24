import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';
import { WebSocketClient } from '../network/WebSocketClient';
import { usePresence } from '../hooks/usePresence';
import { PresenceBar } from './PresenceBar';
import { Toolbar } from './Toolbar';
import { ExportMenu } from './ExportMenu';
import { Shape } from '../types';
import type { Point, ToolType } from '../types';
import { LWWElementSet } from '../crdt/LWWElementSet';
import { UndoManager } from '../crdt/UndoManager';

// Tools
import type { Tool } from '../tools/Tool';
import { PenTool } from '../tools/PenTool';
import { RectangleTool } from '../tools/RectangleTool';
import { EllipseTool } from '../tools/EllipseTool';
import { LineTool } from '../tools/LineTool';
import { TextTool } from '../tools/TextTool';
import { SelectTool } from '../tools/SelectTool';

import './CanvasBoard.css';

/**
 * CanvasBoard — The main orchestrator component.
 *
 * Composes:
 *   - CanvasEngine (rendering)
 *   - WebSocket connection (with optional JWT auth)
 *   - Presence system
 *   - Tool system (Strategy pattern)
 *   - Undo/Redo system
 *   - Export menu
 *   - Toolbar UI
 *   - Text input overlay
 *   - Connection status indicator
 *
 * Tool switching:
 *   The `toolMap` holds singleton instances of each tool.
 *   Switching tools just changes which instance receives pointer events.
 *   Keyboard shortcuts: V=select, P=pen, R=rect, O=ellipse, L=line, A=arrow, T=text
 */

const ROOM_ID = 'global-room';
const WS_BASE_URL = 'ws://localhost:3001';

interface CanvasBoardProps {
  userId: string;
  displayName: string;
  token: string;
  onLogout: () => void;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({ userId, displayName, token, onLogout }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const undoManagerRef = useRef(new UndoManager());

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [activeColor, setActiveColor] = useState('#89b4fa');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Text input overlay state
  const [textInput, setTextInput] = useState<{ shapeId: string; position: Point } | null>(null);
  const [textValue, setTextValue] = useState('');

  // Tool instances (singletons)
  const selectToolRef = useRef(new SelectTool());
  const textToolRef = useRef(new TextTool());
  const toolMapRef = useRef<Record<ToolType, Tool>>({
    select: selectToolRef.current,
    pen: new PenTool(),
    rectangle: new RectangleTool(),
    ellipse: new EllipseTool(),
    line: new LineTool(false),
    arrow: new LineTool(true),
    text: textToolRef.current,
  });

  // WebSocket client singleton — append JWT token if available
  if (!wsClientRef.current) {
    const wsUrl = token ? `${WS_BASE_URL}?token=${token}` : WS_BASE_URL;
    wsClientRef.current = new WebSocketClient(wsUrl);
  }

  const { peers, emitCursor } = usePresence(wsClientRef.current, ROOM_ID, userId);

  // Feed cursor data to engine
  useEffect(() => {
    engineRef.current?.setCursors(peers);
  }, [peers]);

  // Wire up SelectTool selection callback
  useEffect(() => {
    selectToolRef.current.onSelectionChange = (id) => {
      setSelectedShapeId(id);
      engineRef.current?.setSelectedShape(id);
    };
  }, []);

  // Wire up TextTool text input callback
  useEffect(() => {
    textToolRef.current.onRequestTextInput = (shapeId, position) => {
      setTextInput({ shapeId, position });
      setTextValue('');
    };
  }, []);

  // Track connection status
  useEffect(() => {
    if (!wsClientRef.current) return;
    const unsubscribe = wsClientRef.current.onConnectionChange((connected) => {
      setIsConnected(connected);
    });
    return unsubscribe;
  }, []);

  // Setup: create engine, connect WS, listen for messages
  useEffect(() => {
    if (!canvasRef.current) return;

    engineRef.current = new CanvasEngine(canvasRef.current);
    wsClientRef.current!.connect(ROOM_ID, userId);

    const unsubscribe = wsClientRef.current!.onMessage((msg) => {
      if (msg.type === 'draw_shape' || msg.type === 'draw_stroke') {
        const remoteShape = Shape.fromJSON(
          msg.type === 'draw_shape' ? msg.shape : (msg as any).stroke
        );
        engineRef.current?.addShape(remoteShape);
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
  }, [userId]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when typing in text input
      if (textInput) return;

      const key = e.key.toLowerCase();
      const shortcuts: Record<string, ToolType> = {
        v: 'select', p: 'pen', r: 'rectangle',
        o: 'ellipse', l: 'line', a: 'arrow', t: 'text',
      };

      if (shortcuts[key] && !e.ctrlKey && !e.metaKey) {
        setActiveTool(shortcuts[key]);
      }

      if ((key === 'delete' || key === 'backspace') && selectedShapeId) {
        handleDelete();
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedShapeId, textInput]);

  // -- Pointer event handlers --

  const getPointerPos = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getCurrentTool = (): Tool => {
    return toolMapRef.current[activeTool];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (textInput) return; // Don't draw while text input is open

    setIsDrawing(true);
    const pos = getPointerPos(e);
    const tool = getCurrentTool();
    const state = engineRef.current?.getState();
    if (!state) return;

    // Capture "before" snapshot for undo
    const zIndex = state.nextZIndex();

    // For select tool, capture the shape before moving
    if (activeTool === 'select') {
      const hit = selectToolRef.current['hitTest']?.(pos, state);
      if (hit) {
        undoManagerRef.current.record(hit.id, hit.toJSON(), null); // after filled on pointerUp
      }
    }

    const shape = tool.onPointerDown(pos, state, userId, activeColor, strokeWidth, zIndex);

    // For non-select tools, record the new shape creation
    if (shape && activeTool !== 'select') {
      undoManagerRef.current.record(shape.id, null, shape.toJSON());
    }

    setCurrentShape(shape);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const pos = getPointerPos(e);
    emitCursor(pos);

    if (!isDrawing) return;

    const tool = getCurrentTool();
    const state = engineRef.current?.getState();
    if (!state) return;

    const updated = tool.onPointerMove(pos, state, currentShape);
    if (updated) setCurrentShape(updated);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false);

    const pos = getPointerPos(e);
    const tool = getCurrentTool();
    const state = engineRef.current?.getState();
    if (!state) return;

    const finalShape = tool.onPointerUp(pos, state, currentShape);

    // Update undo entry with final "after" state
    if (finalShape && activeTool !== 'select') {
      // Update the last undo entry's "after" with the final shape
      const stack = undoManagerRef.current as any;
      if (stack.undoStack && stack.undoStack.length > 0) {
        stack.undoStack[stack.undoStack.length - 1].after = finalShape.toJSON();
      }
    }

    // For select tool move, update undo entry
    if (finalShape && activeTool === 'select' && currentShape) {
      const stack = undoManagerRef.current as any;
      if (stack.undoStack && stack.undoStack.length > 0) {
        stack.undoStack[stack.undoStack.length - 1].after = finalShape.toJSON();
      }
    }

    // Send to peers
    if (finalShape && wsClientRef.current && activeTool !== 'select') {
      wsClientRef.current.sendMessage({
        type: 'draw_shape',
        roomId: ROOM_ID,
        shape: finalShape.toJSON(),
      });
    }

    // For select tool move operations, also sync
    if (finalShape && wsClientRef.current && activeTool === 'select' && currentShape) {
      wsClientRef.current.sendMessage({
        type: 'draw_shape',
        roomId: ROOM_ID,
        shape: finalShape.toJSON(),
      });
    }

    setCurrentShape(null);
  };

  // -- Tool actions --

  const handleDelete = useCallback(() => {
    const state = engineRef.current?.getState();
    if (!state) return;

    // Record undo before deleting
    const shape = state.get(selectedShapeId || '');
    if (shape) {
      undoManagerRef.current.record(shape.id, shape.toJSON(), null);
    }

    const deleted = selectToolRef.current.deleteSelected(state, userId);
    if (deleted && wsClientRef.current) {
      // Update undo entry with the deleted shape as "after"
      const stack = undoManagerRef.current as any;
      if (stack.undoStack && stack.undoStack.length > 0) {
        stack.undoStack[stack.undoStack.length - 1].after = deleted.toJSON();
      }

      wsClientRef.current.sendMessage({
        type: 'draw_shape',
        roomId: ROOM_ID,
        shape: deleted.toJSON(),
      });
    }
    setSelectedShapeId(null);
    engineRef.current?.setSelectedShape(null);
  }, [selectedShapeId, userId]);

  const handleUndo = useCallback(() => {
    const state = engineRef.current?.getState();
    if (!state) return;

    const shape = undoManagerRef.current.undo(state, userId);
    if (shape && wsClientRef.current) {
      wsClientRef.current.sendMessage({
        type: 'draw_shape',
        roomId: ROOM_ID,
        shape: shape.toJSON(),
      });
    }
  }, [userId]);

  const handleRedo = useCallback(() => {
    const state = engineRef.current?.getState();
    if (!state) return;

    const shape = undoManagerRef.current.redo(state, userId);
    if (shape && wsClientRef.current) {
      wsClientRef.current.sendMessage({
        type: 'draw_shape',
        roomId: ROOM_ID,
        shape: shape.toJSON(),
      });
    }
  }, [userId]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null);
      return;
    }

    const state = engineRef.current?.getState();
    if (!state) return;

    TextTool.commitText(state, textInput.shapeId, textValue.trim(), userId);

    // Get the updated shape and send to peers
    const shape = state.get(textInput.shapeId);
    if (shape && wsClientRef.current) {
      wsClientRef.current.sendMessage({
        type: 'draw_shape',
        roomId: ROOM_ID,
        shape: shape.toJSON(),
      });
    }

    setTextInput(null);
    setTextValue('');
  }, [textInput, textValue, userId]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    // Clear selection when switching away from select tool
    if (tool !== 'select') {
      setSelectedShapeId(null);
      engineRef.current?.setSelectedShape(null);
      selectToolRef.current.selectedId = null;
    }
  };

  // Determine cursor style based on active tool
  const getCursorStyle = (): string => {
    switch (activeTool) {
      case 'select': return selectedShapeId ? 'grab' : 'default';
      case 'text': return 'text';
      default: return 'crosshair';
    }
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none', cursor: getCursorStyle() }}
      />

      <Toolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        activeColor={activeColor}
        onColorChange={setActiveColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        onDelete={handleDelete}
        hasSelection={selectedShapeId !== null}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoManagerRef.current.canUndo()}
        canRedo={undoManagerRef.current.canRedo()}
      />

      <ExportMenu
        canvasRef={canvasRef}
        state={engineRef.current?.getState() ?? null}
      />

      <PresenceBar
        currentUserId={userId}
        displayName={displayName}
        peers={peers}
        roomId={ROOM_ID}
        isConnected={isConnected}
        onLogout={onLogout}
      />

      {/* Text input overlay */}
      {textInput && (
        <div
          className="text-input-overlay"
          style={{
            left: textInput.position.x,
            top: textInput.position.y + 20,
          }}
        >
          <input
            autoFocus
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit();
              if (e.key === 'Escape') setTextInput(null);
            }}
            onBlur={handleTextSubmit}
            placeholder="Type here..."
            className="text-input-field"
          />
        </div>
      )}
    </div>
  );
};
