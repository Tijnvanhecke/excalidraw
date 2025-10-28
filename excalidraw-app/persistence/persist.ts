// Minimal export/import helpers for free-draw strokes (v1)

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

export type StrokeJSON = {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
};
export type SketchJSONv1 = {
  version: 1;
  timestamp: string;
  strokes: StrokeJSON[];
};

const isFreeDraw = (el: NonDeletedExcalidrawElement) => el.type === "freedraw";

// Extract only freedraw strokes from the current scene
export function exportStrokesJSON(api: ExcalidrawImperativeAPI): SketchJSONv1 {
  const elements = api.getSceneElements() as NonDeletedExcalidrawElement[];
  const strokes: StrokeJSON[] = elements
    .filter(isFreeDraw)
    .map((el) => {
      // el.points are relative to el.x/el.y; convert to absolute for portability
      const absPoints = (el as any).points?.map((p: any) => ({
        x: el.x + p.x,
        y: el.y + p.y,
      })) ?? [];
      return {
        id: el.id,
        points: absPoints,
        color: (el as any).strokeColor ?? "#1e1e1e",
        width: (el as any).strokeWidth ?? 2,
      };
    });

  return {
    version: 1 as const,
    timestamp: new Date().toISOString(),
    strokes,
  };
}

export function downloadJSON(data: unknown, filename = "sketch.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
