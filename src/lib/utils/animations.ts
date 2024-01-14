import React from "react";

export type DragHandler = () => {
  reset: () => void;
  start: (e: TouchEvent, touch: Touch) => void;
  move: (e: TouchEvent, touch: Touch) => void;
  end: (e: TouchEvent) => void;
};
export function useDragEvent({
  dragHandler,
  getElement,
}: {
  dragHandler: DragHandler;
  getElement: () => HTMLElement;
}) {
  React.useEffect(() => {
    const handler = dragHandler();
    function touchstart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        handler.reset();
        return;
      }
      const [touch] = e.touches;
      handler.start(e, touch);
    }
    function touchmove(e: TouchEvent) {
      if (e.touches.length !== 1) {
        handler.reset();
        return;
      }
      const [touch] = e.touches;
      handler.move(e, touch);
    }
    function touchend(e: TouchEvent) {
      handler.end(e);
      handler.reset();
    }
    const element = getElement();
    element.addEventListener("touchstart", touchstart, { passive: false });
    element.addEventListener("touchmove", touchmove, { passive: false });
    element.addEventListener("touchend", touchend, { passive: false });
    return () => {
      element.removeEventListener("touchstart", touchstart);
      element.removeEventListener("touchmove", touchmove);
      element.removeEventListener("touchend", touchend);
    };
  }, [dragHandler, getElement]);
}

export function useTransformsManager() {
  const [transformsManager] = React.useState(() => getTransformsManager());
  return transformsManager;
}
export function getTransformsManager() {
  // it's typed as a string, but isn't actually
  type Transform = string;
  type Saved = { computed: Transform; style: Transform };
  const wmap = new WeakMap<HTMLElement, Saved>();

  function transformTo(element: HTMLElement, transform: Transform) {
    const saved = wmap.get(element);
    let original = saved?.computed ?? "";
    if (!saved) {
      original = getComputedStyle(element).transform;
      wmap.set(element, {
        computed: original,
        style: element.style.transform,
      });
    }
    if (original === "none") {
      element.style.transform = transform;
    } else {
      element.style.transform = original;
      element.style.transform += transform;
    }
  }
  function transformReset(element: HTMLElement) {
    const saved = wmap.get(element);
    if (saved) {
      element.style.transform = saved.style;
    }
    wmap.delete(element);
  }
  return { transformTo, transformReset };
}

export function transitionWrapper(element: HTMLElement, func: () => void) {
  const originalTransition = element.style.transition;
  element.style.transition = "0.3s transform";
  const transitionend = () => {
    element.style.transition = originalTransition;
  };
  element.addEventListener("transitionend", transitionend, { once: true });
  requestAnimationFrame(() => {
    func();
  });
}

type Point = { x: number; y: number };
type Constraints = {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
};
export type GestureManagerParams = {
  getConstraints: ()=>Constraints;
  handlers: {
    onMove: (
      e: TouchEvent,
      touch: Touch,
      attributes: { moveX: number; moveY: number },
    ) => void;
    onEnd: (
      e: TouchEvent,
      params: {
        startPoint: Point;
        isReturningX: boolean;
        isReturningY: boolean;
        moveX: number;
        moveY: number;
      },
    ) => void;
  };
};
export function getLinearGestureManager({
  getConstraints,
  handlers: { onMove, onEnd },
}: GestureManagerParams): ReturnType<DragHandler> {
  let startPoint: Point | null = null;
  let lastPoint: Point | null = null;
  let lastDirection = { vertDown: false, horizRight: false };
  let isSwiping = false;
  let constraints = getConstraints();
  function reset() {
    startPoint = null;
    lastPoint = null;
    isSwiping = false;
    lastDirection = { vertDown: false, horizRight: false };
  }
  function start(_e: TouchEvent, touch: Touch) {
    startPoint = { x: touch.pageX, y: touch.pageY };
    constraints = getConstraints();
  }
  function move(e: TouchEvent, touch: Touch) {
    if (!startPoint) {
      return;
    }
    const {up, down, left, right} = constraints;
    const x = touch.pageX;
    const y = touch.pageY;
    // coordinates is top left going right and down
    const isWrongWay =
      (!left && right && x < startPoint.x) ||
      (!right && left && x > startPoint.x) ||
      (!up && down && y < startPoint.y) ||
      (!down && up && y > startPoint.y);
    if (isWrongWay) {
      reset();
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
      }
      if (Math.abs(moveY) > 10) {
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
    onMove(e, touch, { moveX, moveY });
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
    reset();
    onEnd(e, { startPoint, isReturningX, isReturningY, moveX, moveY });
  }
  return {
    start,
    reset,
    end,
    move,
  };
}
