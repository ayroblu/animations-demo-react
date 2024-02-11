import React from "react";
import { isTouchDevice } from ".";

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
  const getElementRef = React.useRef(getElement);
  getElementRef.current = getElement;
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
    const getElement = getElementRef.current;
    const element = getElement();
    if (!element) return;
    const disposeMouse = !isTouchDevice()
      ? getEmulateTouch(element, {
          touchstart,
          touchmove,
          touchend,
        })
      : null;
    element.addEventListener("touchstart", touchstart, { passive: false });
    element.addEventListener("touchmove", touchmove, { passive: false });
    element.addEventListener("touchend", touchend, { passive: false });
    return () => {
      handler.reset();
      disposeMouse?.();
      element.removeEventListener("touchstart", touchstart);
      element.removeEventListener("touchmove", touchmove);
      element.removeEventListener("touchend", touchend);
    };
  }, [dragHandler]);
}
export const noopDragHandler: ReturnType<DragHandler> = {
  reset: () => {},
  start: () => {},
  move: () => {},
  end: () => {},
};

type Point = { x: number; y: number };
type Constraints = {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
};
export type GestureOnMoveParams = {
  touchEvent: TouchEvent;
  touch: Touch;
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
const safeAreaInsetBottom = getComputedStyle(
  document.documentElement,
).getPropertyValue("--safe-area-inset-bottom");
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
    if (touch.screenX < 35) {
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
    const viewportHeight = document.documentElement.clientHeight;
    if (touch.screenY > viewportHeight - parseFloat(safeAreaInsetBottom)) {
      // user is swiping home, nothing you should do
      return;
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
    onMove({ touchEvent: e, moveX, moveY, touch });
  }
  function end(e: TouchEvent) {
    if (!isSwiping || !startPoint || !lastPoint) return;
    const { x, y } = lastPoint;
    const moveX = x - startPoint.x;
    const moveY = y - startPoint.y;
    const movingHorizRight = x >= startPoint.x;
    const movingVertDown = y >= startPoint.y;
    const isReturningX = movingHorizRight !== lastDirection.horizRight;
    const isReturningY = movingVertDown !== lastDirection.vertDown;
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

/** Safari polyfill */
declare global {
  interface Array<T> {
    item(index: number): T;
  }
}
function getEmulateTouch(
  element: HTMLElement,
  {
    touchstart,
    touchmove,
    touchend,
  }: {
    touchstart: (e: TouchEvent) => void;
    touchmove: (e: TouchEvent) => void;
    touchend: (e: TouchEvent) => void;
  },
) {
  function getTouchEvent(
    e: MouseEvent,
    touchType: "touchstart" | "touchend" | "touchmove" | "touchcancel",
    { withoutTouch }: { withoutTouch?: boolean } = {},
  ): TouchEvent {
    polyfillTouch();
    const touchEvent = new TouchEvent(touchType, {
      touches: withoutTouch
        ? []
        : [
            new Touch({
              target: e.target!,
              identifier: 0,
              pageX: e.pageX,
              pageY: e.pageY,
              screenX: e.screenX,
              screenY: e.screenY,
              clientX: e.clientX,
              clientY: e.clientY,
            }),
          ],
    });
    touchEvent.stopPropagation = () => e.stopPropagation();
    touchEvent.preventDefault = () => e.preventDefault();
    return touchEvent;
  }

  function mousedown(e: MouseEvent) {
    const touchEvent = getTouchEvent(e, "touchstart");
    touchstart(touchEvent);
  }
  function mousemove(e: MouseEvent) {
    if ((e.buttons & 1) !== 1) {
      return;
    }
    const touchEvent = getTouchEvent(e, "touchmove");
    touchmove(touchEvent);
  }
  function mouseup(e: MouseEvent) {
    const touchEvent = getTouchEvent(e, "touchend", { withoutTouch: true });
    touchend(touchEvent);
  }
  element.style.userSelect = "none";
  element.style.webkitUserSelect = "none";
  element.addEventListener("mousedown", mousedown);
  element.addEventListener("mousemove", mousemove);
  element.addEventListener("mouseup", mouseup);
  return () => {
    element.removeEventListener("mousedown", mousedown);
    element.removeEventListener("mousemove", mousemove);
    element.removeEventListener("mouseup", mouseup);
  };
}

function polyfillTouch() {
  if (!("TouchEvent" in window)) {
    globalThis.TouchEvent = class TouchEvent extends UIEvent {
      constructor(type: string, { touches }: TouchEventInit = {}) {
        super(type);
        if (touches) {
          this.touches = touches;
        }
      }
      readonly altKey: boolean = false;
      readonly changedTouches: TouchList = [];
      readonly ctrlKey: boolean = false;
      readonly metaKey: boolean = false;
      readonly shiftKey: boolean = false;
      readonly targetTouches: TouchList = [];
      readonly touches: TouchList = [];
    };
    globalThis.Touch = class Touch {
      constructor(options: TouchInit) {
        for (const option in options) {
          if (option in this && options[option as keyof TouchInit]) {
            // @ts-expect-error - `keyof Touch` not quite there
            this[option as keyof Touch] = options[option as keyof TouchInit];
          }
        }
      }
      readonly clientX: number = 0;
      readonly clientY: number = 0;
      readonly force: number = 0;
      readonly identifier: number = 0;
      readonly pageX: number = 0;
      readonly pageY: number = 0;
      readonly radiusX: number = 0;
      readonly radiusY: number = 0;
      readonly rotationAngle: number = 0;
      readonly screenX: number = 0;
      readonly screenY: number = 0;
      readonly target: EventTarget = new EventTarget();
    };
  }
}