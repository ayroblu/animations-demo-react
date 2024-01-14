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

type Props = Pick<React.ComponentProps<typeof ViewPager>, "pages" | "header">;
export function DragViewPagerImperative(props: Props) {
  const viewPagerProps = useDragViewPager(props.pages.length);
  return <ViewPager {...props} {...viewPagerProps} />;
}

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
      const fromEl = indicatorRefs[pageIndex];
      const toEl = indicatorRefs[nextIndex];
      if (fromEl && toEl) {
        const fromBox = fromEl.getBoundingClientRect();
        const toBox = toEl.getBoundingClientRect();
        const transform = getTransform(toBox, fromBox);
        transformTo(toEl, transform);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            transitionWrapper(toEl, () => {
              transformReset(toEl);
            });
          });
        });
      }

      contentWrapper &&
        transitionWrapper(contentWrapper, () => {
          contentWrapper && transformReset(contentWrapper);
          requestAnimationFrame(() => {
            // wait a frame after pageIndex has been set to avoid jitter
            fromEl && transformReset(fromEl);
          });
          setPageIndex(nextIndex);
        });
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
