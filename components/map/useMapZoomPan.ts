"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export type ViewBox = { minX: number; minY: number; width: number; height: number };
export type Transform = { scale: number; x: number; y: number };

const MIN_SCALE_MULTIPLIER = 0.6;
const MAX_SCALE_MULTIPLIER = 6;
const ZOOM_BUTTON_STEP = 1.4;

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Vlastní pinch-to-zoom/pan implementace nad Pointer Events (funguje
 * jednotně pro touch i myš, žádná knihovna navíc — viz zadání "minimum
 * závislostí"). Souřadný systém: SVG má fixní `viewBox` (jednotky mapy),
 * `transform` škáluje/posouvá VIEWBOX (ne DOM), takže SVG element
 * zůstává responsivní na šířku kontejneru přes CSS.
 */
export function useMapZoomPan(baseViewBox: ViewBox) {
  const fitTransform: Transform = useMemo(
    () => ({ scale: 1, x: baseViewBox.minX, y: baseViewBox.minY }),
    [baseViewBox.minX, baseViewBox.minY]
  );
  const [transform, setTransform] = useState<Transform>(fitTransform);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinchDistance = useRef<number | null>(null);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);

  const minScale = MIN_SCALE_MULTIPLIER;
  const maxScale = MAX_SCALE_MULTIPLIER;

  // Přepočet klientských (px) souřadnic na souřadnice mapy (viewBox
  // jednotky) — potřeba pro zoom "okolo bodu pod prstem/kurzorem".
  const clientToMap = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const currentViewWidth = baseViewBox.width / transform.scale;
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      return {
        x: transform.x + px * currentViewWidth,
        y: transform.y + py * (currentViewWidth * (rect.height / rect.width)),
      };
    },
    [baseViewBox.width, transform]
  );

  const zoomAt = useCallback(
    (factor: number, mapPoint: { x: number; y: number }) => {
      setTransform((prev) => {
        const nextScale = Math.min(maxScale, Math.max(minScale, prev.scale * factor));
        const actualFactor = nextScale / prev.scale;
        return {
          scale: nextScale,
          x: mapPoint.x - (mapPoint.x - prev.x) / actualFactor,
          y: mapPoint.y - (mapPoint.y - prev.y) / actualFactor,
        };
      });
    },
    [maxScale, minScale]
  );

  const zoomButton = useCallback(
    (factor: number) => {
      const el = containerRef.current;
      const rect = el?.getBoundingClientRect();
      const center = rect
        ? clientToMap(rect.left + rect.width / 2, rect.top + rect.height / 2)
        : { x: baseViewBox.minX + baseViewBox.width / 2, y: baseViewBox.minY + baseViewBox.height / 2 };
      zoomAt(factor, center);
    },
    [baseViewBox, clientToMap, zoomAt]
  );

  const resetView = useCallback(() => setTransform(fitTransform), [fitTransform]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      lastPanPoint.current = { x: event.clientX, y: event.clientY };
    }
    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      lastPinchDistance.current = distance(p1, p2);
    }
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.current.size === 2) {
        const [p1, p2] = [...pointers.current.values()];
        const newDistance = distance(p1, p2);
        const previous = lastPinchDistance.current;
        lastPinchDistance.current = newDistance;
        if (previous && previous > 0) {
          const mid = midpoint(p1, p2);
          const mapMid = clientToMap(mid.x, mid.y);
          zoomAt(newDistance / previous, mapMid);
        }
        return;
      }

      if (pointers.current.size === 1 && lastPanPoint.current) {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const unitsPerPixel = baseViewBox.width / transform.scale / rect.width;
        const dx = (event.clientX - lastPanPoint.current.x) * unitsPerPixel;
        const dy = (event.clientY - lastPanPoint.current.y) * unitsPerPixel;
        lastPanPoint.current = { x: event.clientX, y: event.clientY };
        setTransform((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
      }
    },
    [baseViewBox.width, clientToMap, transform.scale, zoomAt]
  );

  const endPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) lastPinchDistance.current = null;
    if (pointers.current.size === 1) {
      const [remaining] = [...pointers.current.values()];
      lastPanPoint.current = remaining;
    } else if (pointers.current.size === 0) {
      lastPanPoint.current = null;
    }
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(factor, clientToMap(event.clientX, event.clientY));
    },
    [clientToMap, zoomAt]
  );

  const currentViewBox = `${transform.x} ${transform.y} ${baseViewBox.width / transform.scale} ${
    (baseViewBox.width / transform.scale) * (baseViewBox.height / baseViewBox.width)
  }`;

  return {
    containerRef,
    currentViewBox,
    scale: transform.scale,
    resetView,
    zoomIn: () => zoomButton(ZOOM_BUTTON_STEP),
    zoomOut: () => zoomButton(1 / ZOOM_BUTTON_STEP),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onWheel,
    },
  };
}
