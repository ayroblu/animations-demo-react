import { ViewPager } from "../components/ViewPager";
import styles from "./ViewPagerOld.module.css";
import { LeftButton, Page } from "../components/ViewPagerWithDrawerShared";
import React from "react";
import {
  DragHandler,
  transitionWrapper,
  useArrayRef,
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

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};
function getTransform(from: Box, to: Box, partial?: number): string {
  const portion = partial ?? 1;
  const translate = `translate(${(to.left - from.left) * portion}px, ${
    (to.top - from.top) * portion
  })`;
  const scale = `scale(${
    1 + ((to.width - from.width) / from.width) * portion
  }, ${1 + ((to.height - from.height) / from.height) * portion})`;
  return `${translate} ${scale}`;
}
function useDragViewPager() {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageIndexRef = React.useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const { drag, dragReset } = useTransformsManager();
  const contentWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const { onRef: onPageRef, refs: pageRefs } = useArrayRef();
  const { onRef: onIndicatorRef, refs: indicatorRefs } = useArrayRef();

  const dragHandler: DragHandler = React.useCallback(() => {
    let startPoint: { x: number; y: number } | null = null;
    let lastPoint: { x: number; y: number } | null = null;
    let isRight = false;
    let isScrolling = false;
    let isSwiping = false;
    let moveX = 0;
    function reset() {
      startPoint = null;
      isSwiping = false;
      isScrolling = false;
      moveX = 0;
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
      moveX = touch.pageX - startPoint.x;
      drag(contentWrapper, `translateX(${moveX}px)`);
      const fromEl = indicatorRefs[pageIndex];
      const toEl = indicatorRefs[moveX > 0 ? pageIndex - 1 : pageIndex + 1];
      const pageEl = pageRefs[pageIndex];
      if (fromEl && toEl && pageEl) {
        const fromBox = fromEl.getBoundingClientRect();
        const toBox = toEl.getBoundingClientRect();
        const pageBox = pageEl.getBoundingClientRect();
        const transform = getTransform(
          fromBox,
          toBox,
          Math.abs(moveX) / pageBox.width,
        );
        drag(fromEl, transform);
      }
    }
    function end() {
      if (!isSwiping) {
        return;
      }
      const contentWrapper = contentWrapperRef.current;
      const pageIndex = pageIndexRef.current;
      const nextIndex =
        moveX > 0 && isRight
          ? pageIndex - 1
          : moveX < 0 && !isRight
            ? pageIndex + 1
            : pageIndex;
      reset();
      const fromEl = indicatorRefs[pageIndex];
      const toEl = indicatorRefs[nextIndex];
      if (fromEl && toEl) {
        const fromBox = fromEl.getBoundingClientRect();
        const toBox = toEl.getBoundingClientRect();
        const transform = getTransform(toBox, fromBox);
        drag(toEl, transform);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            transitionWrapper(toEl, () => {
              dragReset(toEl);
            });
          });
        });
      }

      contentWrapper &&
        transitionWrapper(contentWrapper, () => {
          contentWrapper && dragReset(contentWrapper);
          requestAnimationFrame(() => {
            // wait a frame after pageIndex has been set to avoid jitter
            fromEl && dragReset(fromEl);
          });
          setPageIndex(nextIndex);
        });
    }

    return {
      reset,
      start,
      move,
      end,
    };
  }, [drag, dragReset, indicatorRefs, pageRefs]);
  const getElement = () => contentWrapperRef.current ?? document.body;
  useDragEvent({ dragHandler, getElement });
  const setPageIndexWrapped = React.useCallback(
    (pageIndex: Parameters<typeof setPageIndex>[0]) => {
      const contentWrapper = contentWrapperRef.current;
      contentWrapper &&
        transitionWrapper(contentWrapper, () => {
          setPageIndex(pageIndex);
        });
    },
    [],
  );
  return {
    pageIndex,
    setPageIndex: setPageIndexWrapped,
    contentWrapperRef,
    onIndicatorRef,
    pageRefs,
    onPageRef,
  };
}
