import React, { useCallback, useRef } from 'react';

export function useLongPress(
  onLongPress: (e: React.PointerEvent) => void,
  onClick: (e: React.PointerEvent) => void,
  { delay = 500 } = {}
) {
  const timeout = useRef<NodeJS.Timeout>();
  const isLongPress = useRef(false);

  const start = useCallback(
    (event: React.PointerEvent) => {
      // Don't trigger on right click
      if (event.button === 2) return;
      
      isLongPress.current = false;
      timeout.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (event: React.PointerEvent, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      if (shouldTriggerClick && !isLongPress.current) {
        onClick(event);
      }
      isLongPress.current = false;
    },
    [onClick]
  );

  return {
    onPointerDown: (e: React.PointerEvent) => start(e),
    onPointerUp: (e: React.PointerEvent) => clear(e),
    onPointerMove: (e: React.PointerEvent) => clear(e, false),
    onPointerCancel: (e: React.PointerEvent) => clear(e, false),
  };
}
