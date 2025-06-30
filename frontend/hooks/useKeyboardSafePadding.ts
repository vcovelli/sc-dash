import { useEffect, useState } from "react";

/**
 * Returns the number of pixels that should be used as bottom padding to ensure UI is above the keyboard.
 * Optionally, pass `adjust` (positive or negative number) to tweak the offset.
 * 
 * Example: const keyboardPadding = useKeyboardSafePadding(32);
 */
export function useKeyboardSafePadding(adjust: number = 0) {
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    function handleViewportChange() {
      if (window.visualViewport) {
        const offset = Math.max(
          0,
          window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
        );
        setBottomOffset(offset);
      } else {
        setBottomOffset(0);
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
      handleViewportChange();
      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", handleViewportChange);
          window.visualViewport.removeEventListener("scroll", handleViewportChange);
        }
      };
    }
  }, []);

  // Add the adjustment (clamp final value to >= 0)
  return Math.max(0, bottomOffset + adjust);
}
