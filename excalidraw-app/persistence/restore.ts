import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { SketchJSONv1, StrokeJSON } from "./persist";

// Build an Excalidraw freedraw element from a stroke.json (absolute points)
function buildFreedrawFromStroke(s: StrokeJSON): NonDeletedExcalidrawElement {
  // Compute bounding box
  const minX = Math.min(...s.points.map(p => p.x));
  const minY = Math.min(...s.points.map(p => p.y));
  const maxX = Math.max(...s.points.map(p => p.x));
  const maxY = Math.max(...s.points.map(p => p.y));

  const relPoints = s.points.map(p => ({ x: p.x - minX, y: p.y - minY }));
  const width = Math.max(1, Math.round(maxX - minX));
  const height = Math.max(1, Math.round(maxY - minY));

  // Minimal viable freedraw element for Excalidraw
  const el: any = {
    id: s.id,
    type: "freedraw",
    x: minX,
    y: minY,
    width,
    height,
    angle: 0,
    strokeColor: s.color,
    backgroundColor: "transparent",
    fillStyle: "hachure",
    strokeWidth: s.width,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),

    // freedraw-specific
    points: relPoints,
    pressures: [],
    simulatePressure: false,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
  };
  return el as NonDeletedExcalidrawElement;
}

export function validateSketchJSON(raw: unknown): SketchJSONv1 {
  const obj = raw as any;
  if (!obj || typeof obj !== "object") throw new Error("Invalid JSON: not an object");
  if (obj.version !== 1) throw new Error("Unsupported version");
  if (!Array.isArray(obj.strokes)) throw new Error("Invalid strokes array");
  obj.strokes.forEach((s: any, i: number) => {
    if (!s?.id || !Array.isArray(s.points)) throw new Error(`Invalid stroke at index ${i}`);
  });
  return obj as SketchJSONv1;
}

export function importStrokesJSON(api: ExcalidrawImperativeAPI, sketch: SketchJSONv1) {
  const elements = api.getSceneElements() as NonDeletedExcalidrawElement[];
  const others = elements.filter((el) => el.type !== "freedraw"); // leave shapes/images intact
  const rebuilt = sketch.strokes.map(buildFreedrawFromStroke);
  api.updateScene({
    elements: [...others, ...rebuilt],
    captureUpdate: CaptureUpdateAction.NEVER, // bulk apply without polluting history
  });
}
