import React from "react";

export type DragHandler = () => {
  reset: () => void;
  start: (e: TouchEvent, touch: Touch) => void;
  move: (e: TouchEvent, touch: Touch) => void;
  end: (e: TouchEvent) => void;
};
type UseDragEventParams = {
  dragHandler: DragHandler;
  getElement: () => HTMLElement | null;
};
export function useDragEvent({ dragHandler, getElement }: UseDragEventParams) {
  React.useEffect(() => {
    const handler = dragHandler();
    function touchstart(e: TouchEvent) {
      if (getSelection()?.toString()) {
        return;
      }
      if (e.touches.length > 1) {
        // Disable pinch to zoom
        e.preventDefault();
        return;
      }
      if (e.touches.length !== 1) {
        handler.reset();
        return;
      }
      const [touch] = e.touches;
      handler.start(e, touch);
    }
    function touchmove(e: TouchEvent) {
      if (getSelection()?.toString()) {
        return;
      }
      const [touch] = e.touches;
      handler.move(e, touch);
    }
    function touchend(e: TouchEvent) {
      if (e.touches.length > 0) {
        return;
      }
      handler.end(e);
    }
    const element = getElement();
    if (!element) return;
    element.addEventListener("touchstart", touchstart, { passive: false });
    element.addEventListener("touchmove", touchmove, { passive: false });
    element.addEventListener("touchend", touchend, { passive: false });
    return () => {
      handler.reset();
      element.removeEventListener("touchstart", touchstart);
      element.removeEventListener("touchmove", touchmove);
      element.removeEventListener("touchend", touchend);
    };
  }, [dragHandler, getElement]);
}
export const noopDragHandler: ReturnType<DragHandler> = {
  reset: () => {},
  start: () => {},
  move: () => {},
  end: () => {},
};

export function getTransformsManager(transformOrigin?: string) {
  // it's typed as a string, but may also be a "matrix"
  type Transform = string;
  type Saved = {
    computed: Transform;
    style: Transform;
  };
  const map = new Map<HTMLElement, Saved>();

  type Options = { transformOrigin?: string };
  function transformTo(
    element: HTMLElement,
    transform: Transform,
    options?: Options,
  ) {
    const saved = map.get(element);
    let original = saved?.computed ?? "";
    if (!saved) {
      original = getComputedStyle(element).transform;
      map.set(element, {
        computed: original,
        style: element.style.transform,
      });
    }
    ensureNoTransition(element);
    const localTransformOrigin = options?.transformOrigin ?? transformOrigin;
    if (localTransformOrigin) {
      // needed if we scale up and down
      element.style.transformOrigin = localTransformOrigin;
    }
    if (original === "none") {
      element.style.transform = transform;
    } else {
      element.style.transform = original;
      element.style.transform += transform;
    }
  }
  function transformReset(element: HTMLElement) {
    const saved = map.get(element);
    if (saved) {
      element.style.transform = saved.style;
      map.delete(element);
    }
  }
  return {
    transformTo,
    transformReset,
    getTransformedElements: () => map.keys(),
  };
}

const transitionMap = new WeakMap<HTMLElement, () => void>();
function withSingleTransition(
  element: HTMLElement,
  func: (cleanup: () => void) => () => void,
) {
  const dispose = transitionMap.get(element);
  dispose?.();

  const callback = func(() => {
    transitionMap.delete(element);
  });

  transitionMap.set(element, () => {
    callback();
  });
}
function ensureNoTransition(element: HTMLElement) {
  const dispose = transitionMap.get(element);
  dispose?.();
}

export function transitionWrapper(
  element: HTMLElement,
  func: () => void,
  { transition, onEnd }: { transition?: string; onEnd?: () => void } = {},
) {
  withSingleTransition(element, (cleanup) => {
    const originalTransition = element.style.transition;
    element.style.transition = transition ?? "0.3s transform";
    const transitionend = () => {
      element.style.transition = originalTransition;
      cleanup();
      onEnd?.();
    };
    element.addEventListener("transitionend", transitionend, {
      once: true,
    });

    func();
    return () => {
      transitionend();
      element.removeEventListener("transitionend", transitionend);
    };
  });
}

type Point = { x: number; y: number };
type Constraints = {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
};
export type GestureOnMoveParams = {
  touchEvent: TouchEvent;
  moveX: number;
  moveY: number;
};
export type GestureOnEndParams = {
  touchEvent: TouchEvent;
  startPoint: Point;
  isReturningX: boolean;
  isReturningY: boolean;
  moveX: number;
  moveY: number;
};
export type GestureManagerParams = {
  getConstraints: () => Constraints;
  handlers: {
    onReset: () => void;
    onMove: (params: GestureOnMoveParams) => void;
    onEnd: (params: GestureOnEndParams) => void;
  };
  withMargin?: boolean;
};
export function getLinearGestureManager({
  getConstraints,
  handlers: { onReset, onMove, onEnd },
  withMargin,
}: GestureManagerParams): ReturnType<DragHandler> {
  let startPoint: Point | null = null;
  let lastPoint: Point | null = null;
  let lastDirection = { vertDown: false, horizRight: false };
  let isSwiping = false;
  let constraints = getConstraints();
  function reset(withoutReset?: boolean) {
    startPoint = null;
    lastPoint = null;
    isSwiping = false;
    lastDirection = { vertDown: false, horizRight: false };
    if (!withoutReset) {
      onReset();
    }
  }
  function start(e: TouchEvent, touch: Touch) {
    if (touch.screenX < 25) {
      // 25 from manual testing back swipe
      if (withMargin) {
        if (
          e.target instanceof HTMLAnchorElement ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          // compromise: don't prevent default for tappable elements
        } else {
          // disable back swipe on iOS
          // Note that this also disables other actions like scroll actions
          e.preventDefault();
        }
      } else {
        // don't mix back swipe and movement
        return;
      }
    }
    startPoint = { x: touch.pageX, y: touch.pageY };
    constraints = getConstraints();
  }
  function move(e: TouchEvent, touch: Touch) {
    if (!startPoint) {
      return;
    }
    const { up, down, left, right } = constraints;
    const x = touch.pageX;
    const y = touch.pageY;
    // coordinates is top left going right and down
    const isWrongWay =
      (!left && right && x < startPoint.x) ||
      (!right && left && x > startPoint.x) ||
      (!up && down && y < startPoint.y) ||
      (!down && up && y > startPoint.y);
    if (isWrongWay) {
      if (!isSwiping) {
        reset();
      }
      return;
    }
    const moveX = x - startPoint.x;
    const moveY = y - startPoint.y;
    if (!isSwiping) {
      if (Math.abs(moveX) > 10) {
        if (left || right) {
          isSwiping = true;
        } else {
          reset();
          return;
        }
      } else if (Math.abs(moveY) > 10) {
        if (up || down) {
          isSwiping = true;
        } else {
          reset();
          return;
        }
      }
    }
    if (lastPoint) {
      lastDirection.vertDown = touch.pageY >= lastPoint.y;
      lastDirection.horizRight = touch.pageX >= lastPoint.x;
    }
    lastPoint = { x: touch.pageX, y: touch.pageY };
    if (!isSwiping) {
      return;
    }
    onMove({ touchEvent: e, moveX, moveY });
  }
  function end(e: TouchEvent) {
    if (!isSwiping || !startPoint || !lastPoint) return;
    const { x, y } = lastPoint;
    const moveX = x - startPoint.x;
    const moveY = y - startPoint.y;
    const movingHorizRight = x >= startPoint.x;
    const movingVertDown = y >= startPoint.y;
    const isReturningX = movingHorizRight !== lastDirection.horizRight;
    const isReturningY = movingVertDown !== !lastDirection.vertDown;
    reset(true);
    onEnd({
      touchEvent: e,
      startPoint,
      isReturningX,
      isReturningY,
      moveX,
      moveY,
    });
  }
  return {
    start,
    reset,
    end,
    move,
  };
}

export function useAnimationScrollListener(
  callback: () => { element: HTMLElement | null; onScroll: () => void },
) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  React.useEffect(() => {
    const callback = callbackRef.current;
    const { element: el, onScroll } = callback();
    if (!el) return;
    const element = el;
    let timeoutId = 0;
    let isScrolling = false;
    function handleScroll() {
      isScrolling = true;
      cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(() => {
        onScroll();
        if (isScrolling) {
          handleScroll();
        }
      });
    }
    function onScrollEnd() {
      isScrolling = false;
    }
    element.addEventListener("scroll", handleScroll, { passive: true });
    element.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => {
      element.removeEventListener("scroll", handleScroll);
      element.removeEventListener("scrollend", onScrollEnd);
    };
  }, []);
}

export type GestureHandler = Partial<GestureManagerParams["handlers"]>;
export function composeGestureHandlers(
  handlers: GestureHandler[],
): GestureManagerParams["handlers"] {
  function onReset() {
    for (const handler of handlers) {
      handler.onReset?.();
    }
  }
  function onMove(params: GestureOnMoveParams) {
    for (const handler of handlers) {
      handler.onMove?.(params);
    }
  }
  function onEnd(params: GestureOnEndParams) {
    for (const handler of handlers) {
      handler.onEnd?.(params);
    }
  }
  return {
    onReset,
    onMove,
    onEnd,
  };
}

export function manualTransitionTransform(
  func: () => void,
  durationMs: number,
  { onEnd }: { onEnd: () => void },
) {
  const startTime = Date.now();
  function handler() {
    if (Date.now() - startTime > durationMs) {
      onEnd();
      return;
    }
    requestAnimationFrame(() => {
      func();
      handler();
    });
  }
  handler();
}

export function getResetable<T>() {
  const map = new Map<T, () => void>();
  function reset() {
    for (const [key, resetter] of map) {
      resetter();
      map.delete(key);
    }
  }
  function set(key: T, resetter: () => void) {
    map.set(key, resetter);
  }
  return {
    reset,
    set,
  };
}
