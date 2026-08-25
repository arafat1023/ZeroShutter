import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useViewStore } from '@/stores/useViewStore';

/**
 * Pinch-to-zoom on touch and ctrl/trackpad-pinch on desktop. Panning is left to
 * the container's native scrolling, which already works once zoomed in.
 */
export function useCanvasGestures(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;

    const currentZoom = () => {
      const view = useViewStore.getState();
      return view.zoom ?? view.fittedZoom;
    };

    const distance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        pinchStartDistance = distance();
        pinchStartZoom = currentZoom();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size !== 2 || pinchStartDistance <= 0) return;
      event.preventDefault();
      useViewStore.getState().zoomTo((pinchStartZoom * distance()) / pinchStartDistance);
    };

    const endPointer = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchStartDistance = 0;
    };

    // Trackpad pinch and ctrl+wheel arrive as wheel events with ctrlKey set.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      useViewStore.getState().zoomTo(currentZoom() * (event.deltaY < 0 ? 1.08 : 1 / 1.08));
    };

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove, { passive: false });
    node.addEventListener('pointerup', endPointer);
    node.addEventListener('pointercancel', endPointer);
    node.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', endPointer);
      node.removeEventListener('pointercancel', endPointer);
      node.removeEventListener('wheel', onWheel);
    };
  }, [ref]);
}
