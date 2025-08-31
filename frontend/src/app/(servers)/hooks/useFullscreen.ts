import { useState, useEffect, useCallback } from "react";

interface UseFullscreenOptions {
  onToggle?: () => void;
  element?: HTMLElement;
}

export const useFullscreen = (options: UseFullscreenOptions = {}) => {
  const { onToggle, element } = options;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const targetElement =
    element ||
    (typeof document !== "undefined" ? document.documentElement : null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !isMounted) {
      return;
    }

    const handleFullscreenChange = () => {
      const currentIsFullscreen = !!document.fullscreenElement;
      setIsFullscreen(currentIsFullscreen);

      if (onToggle) {
        onToggle();
      }
    };

    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleFullscreenChange);
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.fullscreenElement) {
        handleFullscreenChange();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleFullscreenChange);
      });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onToggle, isMounted]);

  const enterFullscreen = useCallback(async () => {
    if (!targetElement) {
      if (onToggle) onToggle();
      return;
    }

    try {
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen();
      } else if ((targetElement as any).webkitRequestFullscreen) {
        await (targetElement as any).webkitRequestFullscreen();
      } else if ((targetElement as any).mozRequestFullScreen) {
        await (targetElement as any).mozRequestFullScreen();
      } else if ((targetElement as any).msRequestFullscreen) {
        await (targetElement as any).msRequestFullscreen();
      } else {
        if (onToggle) onToggle();
      }
    } catch (error) {
      console.error("Enter fullscreen failed:", error);
      if (onToggle) onToggle();
    }
  }, [targetElement, onToggle]);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error("Exit fullscreen failed:", error);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  const isSupported = useCallback(() => {
    if (typeof document === "undefined") {
      return false;
    }

    return !!(
      document.fullscreenEnabled ||
      (document as unknown as { webkitFullscreenEnabled: boolean }).webkitFullscreenEnabled ||
      (document as unknown as { mozFullScreenEnabled: boolean }).mozFullScreenEnabled ||
      (document as unknown as { msFullscreenEnabled: boolean }).msFullscreenEnabled
    );
  }, []);

  return {
    isFullscreen: isMounted ? isFullscreen : false,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    isSupported: isMounted ? isSupported() : false,
  };
};
