import { Drawer } from "../components/Drawer";
import { ViewPager } from "../components/ViewPager";
import styles from "./ViewPagerWithDrawerOld.module.css";
import {
  DrawerContent,
  LeftButton,
  Page,
} from "../components/ViewPagerWithDrawerShared";
import React from "react";

export function ViewPagerWithDrawerOldRoute() {
  const drawerProps = useDragDrawer();
  return (
    <Drawer
      drawerContent={drawerContent}
      contentCoverClassName={styles.contentCover}
      {...drawerProps}
    >
      <ViewPager pages={pages} header={header} />
    </Drawer>
  );
}

const drawerContent = <DrawerContent />;
const header = (
  <header className={styles.header}>
    <div>
      <LeftButton />
    </div>
    <h1 className={styles.heading}>Demo App</h1>
    <div />
  </header>
);

const pages = [
  {
    name: "Trams",
    component: <Page name="Trams" />,
  },
  {
    name: "Cycling",
    component: <Page name="Cycling" />,
  },
  {
    name: "Buses",
    component: <Page name="Buses" />,
  },
];

function useTransformsManager() {
  // it's typed as a string, but isn't actually
  type Transform = string;
  const wmapRef = React.useRef(new WeakMap<HTMLElement, Transform>());
  const drag = React.useCallback(
    (element: HTMLElement, transform: Transform) => {
      const wmap = wmapRef.current;
      let original = wmap.get(element);
      if (original === undefined) {
        original = getComputedStyle(element).transform;
        wmap.set(element, original);
      }
      if (original === "none") {
        element.style.transform = transform;
      } else {
        element.style.transform = original;
        element.style.transform += transform;
      }
    },
    [],
  );
  const dragReset = React.useCallback((element: HTMLElement) => {
    element.style.transform = "";
    const wmap = wmapRef.current;
    wmap.delete(element);
  }, []);
  return React.useMemo(
    () => ({
      drag,
      dragReset,
    }),
    [drag, dragReset],
  );
}
function useDragDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const isOpenRef = React.useRef(false);
  isOpenRef.current = isOpen;
  const { drag, dragReset } = useTransformsManager();
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const contentCoverRef = React.useRef<HTMLDivElement | null>(null);
  const setDrawerWrapper = React.useCallback((func: () => void) => {
    const drawer = drawerRef.current;
    if (!drawer) {
      return;
    }
    drawer.style.transition = "0.2s transform";
    const transitionend = () => {
      drawer.style.transition = "";
    };
    drawer.addEventListener("transitionend", transitionend, { once: true });
    requestAnimationFrame(() => {
      func();
    });
  }, []);
  const dragHandler: DragHandler = React.useCallback(() => {
    let startPoint: { x: number; y: number } | null = null;
    let lastPoint: { x: number; y: number } | null = null;
    let isOpening = false;
    let isScrolling = false;
    let isSwiping = false;
    function reset() {
      startPoint = null;
      isSwiping = false;
      isScrolling = false;
    }
    function start(_e: TouchEvent, touch: Touch) {
      startPoint = { x: touch.pageX, y: touch.pageY };
    }
    function move(e: TouchEvent, touch: Touch) {
      if (!startPoint) {
        return;
      }
      const x = touch.pageX;
      const isOpen = isOpenRef.current;
      const isWrongWay =
        (!isOpen && x < startPoint.x) ||
        (isOpen && x > startPoint.x) ||
        isScrolling;
      if (isWrongWay) {
        reset();
        return;
      }
      if (Math.abs(x - startPoint.x) > 10) {
        isSwiping = true;
      }
      if (!isSwiping && Math.abs(touch.pageY - startPoint.y) > 10) {
        isScrolling = true;
      }
      if (!isSwiping) {
        return;
      }
      const drawer = drawerRef.current;
      if (!drawer) {
        return;
      }

      e.preventDefault();
      if (lastPoint) {
        isOpening = x > lastPoint.x;
      }
      lastPoint = { x: touch.pageX, y: touch.pageY };
      const moveX = Math.max(
        -maxDragX,
        Math.min(touch.pageX - startPoint.x, maxDragX),
      );
      drag(drawer, `translateX(${moveX}px)`);
      const contentCover = contentCoverRef.current;
      if (contentCover) {
        contentCover.style.opacity = `${((moveX + 280) % 280) / 280}`;
      }
    }
    function end() {
      const drawer = drawerRef.current;
      const contentCover = contentCoverRef.current;
      setDrawerWrapper(() => {
        drawer && dragReset(drawer);
        if (contentCover) {
          contentCover.style.opacity = "";
        }
        setIsOpen(isOpening);
      });
    }

    return {
      reset,
      start,
      move,
      end,
    };
  }, [drag, dragReset, setDrawerWrapper]);
  useDragEvent({ dragHandler });
  return { drawerRef, isOpen, setIsOpen, setDrawerWrapper, contentCoverRef };
}
const maxDragX = 280;
type DragHandler = () => {
  reset: () => void;
  start: (e: TouchEvent, touch: Touch) => void;
  move: (e: TouchEvent, touch: Touch) => void;
  end: (e: TouchEvent) => void;
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
      handler.end(e);
      handler.reset();
    }
    window.addEventListener("touchstart", touchstart, { passive: false });
    window.addEventListener("touchmove", touchmove, { passive: false });
    window.addEventListener("touchend", touchend, { passive: false });
    return () => {
      window.removeEventListener("touchstart", touchstart);
      window.removeEventListener("touchmove", touchmove);
      window.removeEventListener("touchend", touchend);
    };
  }, [dragHandler]);
}
