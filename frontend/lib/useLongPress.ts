import { useRef } from "react";

export function useLongPress(
  onLongPress: (e: TouchEvent | React.TouchEvent) => void,
  ms = 600
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function start(e: React.TouchEvent) {
    timerRef.current = setTimeout(() => {
      onLongPress(e);
    }, ms);
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onTouchCancel: clear,
  };
}
