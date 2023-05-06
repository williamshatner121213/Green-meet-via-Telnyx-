import { useState, useEffect } from 'react';
// Define general type for useWindowSize hook, which includes width and height
interface Size {
  width: number | undefined;
  height: number | undefined;
}

export function getWindowSize(width: number) {
  if (width <= 576) {
    return 'xsmall';
  }
  if (width > 576 && width <= 768) {
    return 'small';
  }
  if (width > 768 && width <= 992) {
    return 'medium';
  }

  if (width > 992 && width <= 1400) {
    return 'large';
  }

  if (width > 1400) {
    return 'xlarge';
  }

  return 'xsmall';
}

// Hook
export function useWindowSize(): Size {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<Size>({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}
