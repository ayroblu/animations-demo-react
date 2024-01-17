import { ViewPager } from "../components/ViewPager";
import React from "react";
import { useArrayRef } from "../lib/utils/hooks";
import {
  DragHandler,
  GestureOnEndParams,
  GestureOnMoveParams,
  getLinearGestureManager,
  getTransformsManager,
  transitionWrapper,
  useDragEvent,
} from "../lib/utils/animations";
import { getTransform } from "../lib/utils";
// import styles from "./DragViewPagerImperative.module.css";

type Props = Pick<React.ComponentProps<typeof ViewPager>, "pages" | "header">;
export function DragViewPagerImperative(props: Props) {
  const viewPagerProps = useDragViewPager(props.pages.length);
  return <ViewPager {...props} {...viewPagerProps} />;
}

// TODO: pull down while scroll is at top should translate
// if scroll is at top, always preventDefault if causes overscroll
// CASE: scroll down a bit, then drag down so that you scroll to top then should continue to pull to refresh. Includes momentum from scrolling
// TODO: handle two finger reset / do nothing?
function useDragViewPager(pagesLength: number) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageIndexRef = React.useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const contentWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const { onRef: onPageRef, refs: pageRefs } = useArrayRef();
  const { onRef: onIndicatorRef, refs: indicatorRefs } = useArrayRef();

  const dragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset } = getTransformsManager();

    function onMove({ touchEvent, moveX }: GestureOnMoveParams) {
      const contentWrapper = contentWrapperRef.current;
      if (!contentWrapper) return;

      const pageIndex = pageIndexRef.current;
      touchEvent.preventDefault();
      touchEvent.stopPropagation();
      transformTo(contentWrapper, `translateX(${moveX}px)`);
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
        transformTo(fromEl, transform);
      }
    }
    function onEnd({ isReturningX, moveX }: GestureOnEndParams) {
      const contentWrapper = contentWrapperRef.current;
      const pageIndex = pageIndexRef.current;
      const nextIndex = isReturningX
        ? pageIndex
        : moveX > 0
          ? pageIndex - 1
          : pageIndex + 1;

      function transitionIndicator() {
        const fromEl = indicatorRefs[pageIndex];
        const toEl = indicatorRefs[nextIndex];
        if (fromEl && toEl) {
          if (pageIndex === nextIndex) {
            transitionWrapper(fromEl, () => {
              transformReset(fromEl);
            });
            return;
          }
          const fromBox = fromEl.getBoundingClientRect();
          const toBox = toEl.getBoundingClientRect();
          transformReset(fromEl);

          const transform = getTransform(toBox, fromBox);
          transformTo(toEl, transform);
          toEl.getBoundingClientRect();
          transitionWrapper(toEl, () => {
            transformReset(toEl);
          });
        }
      }

      contentWrapper &&
        transitionWrapper(contentWrapper, () => {
          transformReset(contentWrapper);
        });
      transitionIndicator();
      setPageIndex(nextIndex);
    }
    return getLinearGestureManager({
      getConstraints: () => {
        const pageIndex = pageIndexRef.current;
        return {
          left: pageIndex !== pagesLength - 1,
          right: pageIndex !== 0,
        };
      },
      handlers: { onMove, onEnd },
    });
  }, [indicatorRefs, pageRefs, pagesLength]);
  const getElement = () => contentWrapperRef.current ?? document.body;
  useDragEvent({ dragHandler, getElement });

  // const pullToRefreshDragHandler: DragHandler = React.useCallback(() => {
  //   const { transformTo, transformReset } = getTransformsManager();

  //   function onMove({ touchEvent, moveY }: GestureOnMoveParams) {
  //     const contentWrapper = contentWrapperRef.current;
  //     if (!contentWrapper) return;
  //     touchEvent.preventDefault();
  //     touchEvent.stopPropagation();
  //     moveY = Math.pow(moveY, 0.8);
  //     transformTo(contentWrapper, `translateY(${moveY}px)`);
  //   }
  //   function onEnd() {
  //     const contentWrapper = contentWrapperRef.current;
  //     contentWrapper &&
  //       transitionWrapper(contentWrapper, () => {
  //         transformReset(contentWrapper);
  //       });
  //   }
  //   return getLinearGestureManager({
  //     getConstraints: () => {
  //       console.log("scrollY", window.scrollY);
  //       return {
  //         down: window.scrollY < 10,
  //       };
  //     },
  //     handlers: { onMove, onEnd },
  //   });
  // }, []);
  // useDragEvent({ dragHandler: pullToRefreshDragHandler, getElement });

  // The on click effect of moving the indicator
  const setPageIndexWrapped = React.useCallback(
    (pageIndex: Parameters<typeof setPageIndex>[0]) => {
      const contentWrapper = contentWrapperRef.current;
      function transformIndicators() {
        const { transformTo, transformReset } = getTransformsManager();
        const originalPageIndex = pageIndexRef.current;
        const fromEl = indicatorRefs[originalPageIndex];
        const toEl =
          indicatorRefs[
            typeof pageIndex === "function"
              ? pageIndex(originalPageIndex)
              : pageIndex
          ];
        if (fromEl && toEl && fromEl !== toEl) {
          const fromBox = fromEl.getBoundingClientRect();
          const toBox = toEl.getBoundingClientRect();
          const transform = getTransform(toBox, fromBox);
          transformTo(toEl, transform);
          toEl.getBoundingClientRect();
          transitionWrapper(toEl, () => {
            transformReset(toEl);
          });
        }
      }
      contentWrapper &&
        transitionWrapper(contentWrapper, () => {
          setPageIndex(pageIndex);
          transformIndicators();
        });
    },
    [indicatorRefs],
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
