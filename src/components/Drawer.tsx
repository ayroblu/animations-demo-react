import React from "react";
import styles from "./Drawer.module.css";
import { useDimensions } from "../lib/utils/hooks";

type Props = {
  children: React.ReactNode;
  shiftRefs: { current: HTMLElement | null }[];
};
export function Drawer({ children, shiftRefs }: Props) {
  const { width } = useDimensions();
  if (width > 600) {
    return <div>{children}</div>;
  }
  return <DragDrawer children={children} shiftRefs={shiftRefs} />;
}

function DragDrawer({ children, shiftRefs }: Props) {
  const isVisibleState = React.useState(false);
  const [isVisible] = isVisibleState;
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const uiDragHandler = useUiDragHandler({
    isVisibleState,
    shiftRefs,
    drawerRef,
  });
  useDragDrawer(uiDragHandler);
  return (
    <div className={styles.drawer} ref={drawerRef}>
      {isVisible ? children : null}
    </div>
  );
}

type UiDragHandlerParams = {
  isVisibleState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  shiftRefs: Props["shiftRefs"];
  drawerRef: React.MutableRefObject<HTMLDivElement | null>;
};
function useUiDragHandler({
  isVisibleState,
  shiftRefs,
  drawerRef,
}: UiDragHandlerParams): UiDragHandler {
  const [isVisible, setIsVisible] = isVisibleState;
  const isVisibleRef = React.useRef(isVisible);
  isVisibleRef.current = isVisible;
  return React.useCallback(() => {
    const transformsManager = createTransformsManager();
    function move({ x }: { x: number; y: number }) {
      const isVisible = isVisibleRef.current;
      if (!isVisible) {
        setIsVisible(true);
      }
      for (const ref of shiftRefs) {
        const el = ref.current;
        if (!el) continue;
        const element = el;
        transformsManager.drag(element, `translateX(${x}px)`);
      }
    }
    function release(isOpen: boolean) {
      const drawerEl = drawerRef.current;
      if (!drawerEl) return;
      const width = drawerEl.getBoundingClientRect().width;
      const transform = isOpen ? `translateX(${width}px)` : "";
      for (const ref of shiftRefs) {
        const el = ref.current;
        if (!el) continue;
        const element = el;
        transformsManager.animate(element, transform);
      }
    }
    return {
      move,
      release,
    };
  }, [drawerRef, setIsVisible, shiftRefs]);
}
function createTransformsManager() {
  // it's typed as a string, but isn't actually
  type Transform = string;
  const wmap = new WeakMap<HTMLElement, Transform>();
  function drag(element: HTMLElement, transform: Transform) {
    const original = wmap.get(element);
    if (!original) {
      wmap.set(element, getComputedStyle(element).transform);
    } else {
      element.style.transform = original;
      element.style.transform += transform;
    }
  }
  function animate(
    element: HTMLElement,
    transform: Transform,
    callback?: () => void,
  ) {
    const original = wmap.get(element);
    if (!original) {
      element.style.transform = transform;
    } else {
      element.style.transform = original;
      element.style.transform += transform;
      element.style.transition = "0.2s transform";
      const transitionend = () => {
        element.removeEventListener("transitionend", transitionend);
        callback?.();
      };
      element.addEventListener("transitionend", transitionend);
    }
  }
  return {
    drag,
    animate,
  };
}
function useDragDrawer(uiDragHandlerFn: UiDragHandler) {
  const dragHandler: DragHandler = React.useCallback(() => {
    const uiDragHandler = uiDragHandlerFn();
    let startPoint: { x: number; y: number } | null = null;
    let lastPoint: { x: number; y: number } | null = null;
    let isOpen = false;
    function reset() {
      startPoint = null;
    }
    function start(_e: TouchEvent, touch: Touch) {
      startPoint = { x: touch.pageX, y: touch.pageY };
    }
    function move(e: TouchEvent, touch: Touch) {
      if (!startPoint) {
        return;
      }
      const x = touch.pageX;
      const isWrongWay =
        (!isOpen && x > startPoint.x) || (isOpen && x < startPoint.x);
      if (isWrongWay) {
        reset();
        return;
      }

      e.preventDefault();
      if (lastPoint) {
        isOpen = x > lastPoint.x;
      }
      lastPoint = { x: touch.pageX, y: touch.pageY };
      uiDragHandler.move({
        x: touch.pageX - startPoint.x,
        y: touch.pageY - startPoint.y,
      });
    }
    function end() {
      uiDragHandler.release(isOpen);
    }

    return {
      reset,
      start,
      move,
      end,
    };
  }, [uiDragHandlerFn]);
  useDragEvent({ dragHandler });
}
type DragHandler = () => {
  reset: () => void;
  start: (e: TouchEvent, touch: Touch) => void;
  move: (e: TouchEvent, touch: Touch) => void;
  end: (e: TouchEvent, touch: Touch) => void;
};
type UiDragHandler = () => {
  move: (pos: { x: number; y: number }) => void;
  release: (isOpen: boolean) => void;
};
function useDragEvent({ dragHandler }: { dragHandler: DragHandler }) {
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
      if (e.touches.length !== 1) {
        handler.reset();
        return;
      }
      const [touch] = e.touches;
      handler.end(e, touch);
    }
    window.addEventListener("touchstart", touchstart);
    window.addEventListener("touchmove", touchmove);
    window.addEventListener("touchend", touchend);
    return () => {
      window.removeEventListener("touchstart", touchstart);
      window.removeEventListener("touchmove", touchmove);
      window.removeEventListener("touchend", touchend);
    };
  }, [dragHandler]);
}
