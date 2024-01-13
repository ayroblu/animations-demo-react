import { ViewPager } from "../components/ViewPager";
import styles from "./ViewPagerOld.module.css";
import { LeftButton, Page } from "../components/ViewPagerWithDrawerShared";
import React from "react";
import {
  DragHandler,
  useDragEvent,
  useTransformsManager,
} from "../lib/utils/hooks";

export function ViewPagerOldRoute() {
  const viewPagerProps = useDragViewPager();
  return <ViewPager pages={pages} header={header} {...viewPagerProps} />;
}

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
    component: <Page name="Trams" withoutLoremIpsum />,
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

function useDragViewPager() {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageIndexRef = React.useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const { drag, dragReset } = useTransformsManager();
  const contentWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const transitionWrapper = React.useCallback(
    (element: HTMLElement, func: () => void) => {
      element.style.transition = "0.2s transform";
      const transitionend = () => {
        element.style.transition = "";
      };
      element.addEventListener("transitionend", transitionend, { once: true });
      requestAnimationFrame(() => {
        func();
      });
    },
    [],
  );
  const dragHandler: DragHandler = React.useCallback(() => {
    let startPoint: { x: number; y: number } | null = null;
    let lastPoint: { x: number; y: number } | null = null;
    let isRight = false;
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
      const pageIndex = pageIndexRef.current;
      const isWrongWay =
        (pageIndex === pages.length - 1 && x < startPoint.x) ||
        (pageIndex === 0 && x > startPoint.x) ||
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
      const contentWrapper = contentWrapperRef.current;
      if (!contentWrapper) {
        return;
      }

      e.preventDefault();
      if (lastPoint) {
        isRight = x > lastPoint.x;
      }
      lastPoint = { x: touch.pageX, y: touch.pageY };
      const moveX = Math.max(
        -maxDragX,
        Math.min(touch.pageX - startPoint.x, maxDragX),
      );
      drag(contentWrapper, `translateX(${moveX}px)`);
    }
    function end() {
      const contentWrapper = contentWrapperRef.current;
      contentWrapper &&
        startPoint &&
        transitionWrapper(contentWrapper, () => {
          contentWrapper && dragReset(contentWrapper);
          setPageIndex((pageIndex) =>
            isRight ? pageIndex - 1 : pageIndex + 1,
          );
        });
    }

    return {
      reset,
      start,
      move,
      end,
    };
  }, [drag, dragReset, transitionWrapper]);
  useDragEvent({ dragHandler });
  const setPageIndexWrapped = React.useCallback(
    (pageIndex: Parameters<typeof setPageIndex>[0]) => {
      const contentWrapper = contentWrapperRef.current;
      contentWrapper &&
        transitionWrapper(contentWrapper, () => {
          setPageIndex(pageIndex);
        });
    },
    [transitionWrapper],
  );
  return { pageIndex, setPageIndex: setPageIndexWrapped, contentWrapperRef };
}
const maxDragX = 280;
