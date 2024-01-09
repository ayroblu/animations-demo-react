import React from "react";
import styles from "./Drawer.module.css";
import { useDimensions } from "../lib/utils/hooks";
import { cn } from "../lib/utils";

type Props = {
  children: React.ReactNode;
  drawerContent: React.ReactNode;
  setDrawerWrapper?: (func: () => void) => void;
  contentClassName?: string;
  drawerContentClassName?: string;
  drawerRef?: React.MutableRefObject<HTMLDivElement | null>;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  contentCoverClassName?: string;
};
export function Drawer({ children, drawerContent, ...rest }: Props) {
  const { width } = useDimensions();
  if (width > 700) {
    return (
      <div className={styles.sidenavDrawer}>
        <div className={cn(styles.drawerContent, styles.sidenav)}>
          <div className={styles.drawerContentWrapper}>{drawerContent}</div>
        </div>
        <div className={cn(styles.sidenavContent, styles.content)}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <SideDrawer children={children} drawerContent={drawerContent} {...rest} />
  );
}
type DrawerContext = { openDrawer: () => void; closeDrawer: () => void };
export const DrawerContext = React.createContext<DrawerContext | null>(null);

function SideDrawer({
  children,
  drawerContent,
  setDrawerWrapper,
  contentClassName,
  drawerContentClassName,
  drawerRef,
  isOpen,
  setIsOpen,
  contentCoverClassName,
}: Props) {
  const isVisibleState = React.useState(false);
  const [isVisible2, setIsVisible] = isVisibleState;
  const isVisible = isOpen ?? isVisible2;
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const drawerContextValue = useDrawerValue(
    setIsOpen ?? setIsVisible,
    setDrawerWrapper,
  );
  return (
    <DrawerContext.Provider value={drawerContextValue}>
      <div className={styles.groupContainer}>
        <div
          className={cn(styles.drawer, isVisible && styles.visible)}
          ref={drawerRef}
        >
          <div
            className={cn(
              styles.drawerContent,
              styles.mobileDrawer,
              drawerContentClassName,
            )}
          >
            <div className={styles.sticky}>{drawerContent}</div>
            <div className={styles.fill} />
          </div>
          <div
            className={cn(styles.content, contentClassName)}
            ref={contentRef}
          >
            {children}
            <div
              className={cn(
                styles.contentCover,
                contentCoverClassName,
                isVisible && styles.visible,
              )}
              onClick={drawerContextValue.closeDrawer}
            />
          </div>
        </div>
      </div>
    </DrawerContext.Provider>
  );
}
function identity(fn: () => void) {
  return fn();
}
function useDrawerValue(
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setDrawerWrapper: (func: () => void) => void = identity,
): DrawerContext {
  const openDrawer = React.useCallback(() => {
    setDrawerWrapper(() => {
      setIsVisible(true);
    });
  }, [setDrawerWrapper, setIsVisible]);
  const closeDrawer = React.useCallback(() => {
    setDrawerWrapper(() => {
      setIsVisible(false);
    });
  }, [setDrawerWrapper, setIsVisible]);
  return { openDrawer, closeDrawer };
}

// const uiDragHandlerFn = useUiDragHandler({
//   isVisibleState,
//   contentRef,
//   drawerRef,
// });
// useDragDrawer(uiDragHandlerFn);

// function useAnimatedDrawer({ isVisibleState, contentRef, drawerRef }) {
//   const uiDragHandlerFn = useUiDragHandler({
//     isVisibleState,
//     contentRef,
//     drawerRef,
//   });
//   useDragDrawer(uiDragHandlerFn);
//   const drawerContextValue = useAnimatedDrawerValue(uiDragHandlerFn);
//   return {
//     drawerContextValue,
//     uiDragHandlerFn,
//   };
// }
//
// function useAnimatedDrawerValue(uiDragHandlerFn: UiDragHandler): DrawerContext {
//   const uiDragHandler = uiDragHandlerFn();
//   const openDrawer = React.useCallback(() => {
//     uiDragHandler.release(true);
//   }, [uiDragHandler]);
//   const closeDrawer = React.useCallback(() => {
//     uiDragHandler.release(false);
//   }, [uiDragHandler]);
//   return { openDrawer, closeDrawer };
// }
//
// type UiDragHandlerParams = {
//   isVisibleState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
//   contentRef: React.MutableRefObject<HTMLDivElement | null>;
//   drawerRef: React.MutableRefObject<HTMLDivElement | null>;
// };
// function useUiDragHandler({
//   isVisibleState,
//   contentRef,
//   drawerRef,
// }: UiDragHandlerParams): UiDragHandler {
//   const [isVisible, setIsVisible] = isVisibleState;
//   const isVisibleRef = React.useRef(isVisible);
//   isVisibleRef.current = isVisible;
//   const transformsManagerRef = React.useRef(createTransformsManager());
//   return React.useCallback(() => {
//     const transformsManager = transformsManagerRef.current;
//     function move({ x }: { x: number; y: number }) {
//       const isVisible = isVisibleRef.current;
//       if (!isVisible) {
//         setIsVisible(true);
//       }
//       const el = contentRef.current;
//       if (!el) return;
//       const element = el;
//       transformsManager.drag(element, `translateX(${x}px)`);
//     }
//     function release(isOpen: boolean) {
//       const drawerEl = drawerRef.current;
//       if (!drawerEl) return;
//       const isVisible = isVisibleRef.current;
//       if (!isVisible && isOpen) {
//         setIsVisible(true);
//       }
//
//       const width = drawerEl.getBoundingClientRect().width;
//       const transform = isOpen ? `translateX(${width}px)` : "";
//       const el = contentRef.current;
//       if (!el) return;
//       const element = el;
//       transformsManager.animate(element, transform);
//       const callback = isOpen
//         ? undefined
//         : () => {
//             setIsVisible(false);
//           };
//       transformsManager.animate(drawerEl, transform, callback);
//     }
//     return {
//       move,
//       release,
//     };
//   }, [contentRef, drawerRef, setIsVisible]);
// }
// function createTransformsManager() {
//   // it's typed as a string, but isn't actually
//   type Transform = string;
//   const wmap = new WeakMap<HTMLElement, Transform>();
//   function drag(element: HTMLElement, transform: Transform) {
//     let original = wmap.get(element);
//     if (original === undefined) {
//       original = getComputedStyle(element).transform;
//       wmap.set(element, original);
//     }
//     if (original === "none") {
//       element.style.transform = transform;
//     } else {
//       element.style.transform = original;
//       element.style.transform += transform;
//     }
//   }
//   function animate(
//     element: HTMLElement,
//     transform: Transform,
//     callback?: () => void,
//   ) {
//     let original = wmap.get(element);
//     if (original === undefined) {
//       original = getComputedStyle(element).transform;
//       wmap.set(element, original);
//     }
//     if (original === "none") {
//       element.style.transform = transform;
//     } else {
//       element.style.transform = original;
//       element.style.transform += transform;
//     }
//     element.style.transition = "0.2s transform";
//     const transitionend = () => {
//       element.style.transition = "";
//       callback?.();
//     };
//     element.addEventListener("transitionend", transitionend, { once: true });
//   }
//   return {
//     drag,
//     animate,
//   };
// }
// function useDragDrawer(uiDragHandlerFn: UiDragHandler) {
//   const dragHandler: DragHandler = React.useCallback(() => {
//     const uiDragHandler = uiDragHandlerFn();
//     let startPoint: { x: number; y: number } | null = null;
//     let lastPoint: { x: number; y: number } | null = null;
//     let isOpen = false;
//     let isOpening = false;
//     let isScrolling = false;
//     let isSwiping = false;
//     function reset() {
//       startPoint = null;
//       isSwiping = false;
//       isScrolling = false;
//     }
//     function start(_e: TouchEvent, touch: Touch) {
//       startPoint = { x: touch.pageX, y: touch.pageY };
//     }
//     function move(e: TouchEvent, touch: Touch) {
//       if (!startPoint) {
//         return;
//       }
//       const x = touch.pageX;
//       const isWrongWay =
//         (!isOpen && x < startPoint.x) ||
//         (isOpen && x > startPoint.x) ||
//         isScrolling;
//       if (isWrongWay) {
//         reset();
//         return;
//       }
//       if (Math.abs(x - startPoint.x) > 10) {
//         isSwiping = true;
//       }
//       if (!isSwiping && Math.abs(touch.pageY - startPoint.y) > 10) {
//         isScrolling = true;
//       }
//       if (!isSwiping) {
//         return;
//       }
//
//       e.preventDefault();
//       if (lastPoint) {
//         isOpening = x > lastPoint.x;
//       }
//       lastPoint = { x: touch.pageX, y: touch.pageY };
//       uiDragHandler.move({
//         x: touch.pageX - startPoint.x,
//         y: touch.pageY - startPoint.y,
//       });
//     }
//     function end() {
//       isOpen = isOpening;
//       uiDragHandler.release(isOpen);
//     }
//
//     return {
//       reset,
//       start,
//       move,
//       end,
//     };
//   }, [uiDragHandlerFn]);
//   useDragEvent({ dragHandler });
// }
// type DragHandler = () => {
//   reset: () => void;
//   start: (e: TouchEvent, touch: Touch) => void;
//   move: (e: TouchEvent, touch: Touch) => void;
//   end: (e: TouchEvent) => void;
// };
// type UiDragHandler = () => {
//   move: (pos: { x: number; y: number }) => void;
//   release: (isOpen: boolean) => void;
// };
// function useDragEvent({ dragHandler }: { dragHandler: DragHandler }) {
//   React.useEffect(() => {
//     const handler = dragHandler();
//     function touchstart(e: TouchEvent) {
//       if (e.touches.length !== 1) {
//         handler.reset();
//         return;
//       }
//       const [touch] = e.touches;
//       handler.start(e, touch);
//     }
//     function touchmove(e: TouchEvent) {
//       if (e.touches.length !== 1) {
//         handler.reset();
//         return;
//       }
//       const [touch] = e.touches;
//       handler.move(e, touch);
//     }
//     function touchend(e: TouchEvent) {
//       handler.end(e);
//       handler.reset();
//     }
//     window.addEventListener("touchstart", touchstart, { passive: false });
//     window.addEventListener("touchmove", touchmove, { passive: false });
//     window.addEventListener("touchend", touchend, { passive: false });
//     return () => {
//       window.removeEventListener("touchstart", touchstart);
//       window.removeEventListener("touchmove", touchmove);
//       window.removeEventListener("touchend", touchend);
//     };
//   }, [dragHandler]);
// }
