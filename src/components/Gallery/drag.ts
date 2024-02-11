import React from "react";
import {
  ensureNoTransition,
  getTransformsManager,
  transitionWrapper,
} from "../../lib/utils/animations";
import {
  DragHandler,
  GestureHandler,
  composeGestureHandlers,
  getGestureManager,
  noopDragHandler,
  useDragEvent,
} from "../../lib/utils/touch";
import { clamp, nonNullable } from "../../lib/utils";
import { getCanDec, getCanInc, useIncDecSelectedIndex } from "./state";
import { useGalleryContext } from "./useGalleryContext";
import { flushSync } from "react-dom";
import { GalleryContextType } from "./GalleryContext";

export function useModalGalleryDragHandlers({
  dismiss,
}: {
  dismiss: () => void;
}) {
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const dismissDragHandler: DragHandler = useDismissDragHandler({
    modalRef,
    imageRef,
    dismiss,
  });
  const swipeDragHandler: DragHandler = useSwipeDragHandler();

  const getDragElement = () => modalRef.current;
  useDragEvent({
    dragHandler: dismissDragHandler,
    getElement: getDragElement,
  });
  useDragEvent({
    dragHandler: swipeDragHandler,
    getElement: getDragElement,
  });
  return {
    modalRef,
    imageRef,
  };
}

function useDismissDragHandler({
  modalRef,
  imageRef,
  dismiss,
}: {
  modalRef: React.RefObject<HTMLElement | null>;
  imageRef: React.RefObject<HTMLElement | null>;
  dismiss: () => void;
}): DragHandler {
  const dragHandler: DragHandler = React.useCallback(() => {
    const image = imageRef.current;
    const modal = modalRef.current;
    if (!image || !modal) return noopDragHandler;
    const { transformTo, transformReset } = getTransformsManager();
    const preventDefaultHandler: GestureHandler = {
      onMove: ({ touchEvent }) => {
        touchEvent.preventDefault();
        touchEvent.stopPropagation();
      },
    };
    let transformOrigin: string | null = null;
    const dismissHandler: GestureHandler = {
      onReset: () => {
        transformOrigin = null;
      },
      onMove: ({ moveX, moveY, touch }) => {
        const scale = `scale(${Math.min(1, Math.pow(2.7, -moveY / 1000))})`;
        transformOrigin =
          transformOrigin ??
          (() => {
            const { clientX, clientY } = touch;
            const { left, top } = image.getBoundingClientRect();
            return `${clientX - left}px ${clientY - top}px`;
          })();
        transformTo(image, `translate(${moveX}px, ${moveY}px) ${scale}`, {
          transformOrigin,
        });
      },
      onEnd: ({ isReturningY }) => {
        transformOrigin = null;
        if (isReturningY) {
          transitionWrapper(image, () => {
            transformReset(image);
          });
        } else {
          dismiss();
        }
      },
    };
    const backgroundHandler: GestureHandler = {
      onMove: ({ moveY }) => {
        const alpha = clamp(0, 1 - moveY / 200, 1);
        if (matchMedia("prefers-color-scheme: dark")) {
          modal.style.backgroundColor = `rgba(0,0,0,${alpha})`;
        } else {
          modal.style.backgroundColor = `rgba(255,255,255,${alpha})`;
        }
      },
      onEnd: ({ isReturningY }) => {
        if (isReturningY) {
          transitionWrapper(
            modal,
            () => {
              modal.style.backgroundColor = "";
            },
            { transition: "background-color 0.3s" },
          );
        }
      },
    };
    let pinchTransformOrigin: string | null = null;
    const pinchHandler: GestureHandler = {
      onReset: () => {
        pinchTransformOrigin = null;
      },
      onPinchMove: ({ distApartRatio, translation, centroid }) => {
        console.log("centroid", centroid);
        pinchTransformOrigin =
          pinchTransformOrigin ??
          (() => {
            const { left, top } = image.getBoundingClientRect();
            return `${centroid.x - left}px ${centroid.y - top}px`;
          })();
        transformTo(
          image,
          `translate(${translation.x}px, ${translation.y}px) scale(${distApartRatio})`,
          { transformOrigin: pinchTransformOrigin },
        );
      },
      onPinchEnd: () => {
        pinchTransformOrigin = null;
        // dismiss if pinch very small
        transitionWrapper(image, () => {
          transformReset(image);
        });
      },
    };
    const handlers = composeGestureHandlers([
      preventDefaultHandler,
      dismissHandler,
      pinchHandler,
      backgroundHandler,
    ]);
    return getGestureManager({
      getConstraints: () => {
        return { down: true };
      },
      handlers,
    });
  }, [dismiss, imageRef, modalRef]);
  return dragHandler;
}

function useSwipeDragHandler(): DragHandler {
  const { dec, inc } = useIncDecSelectedIndex();
  const context = useGalleryContext();
  const dragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset } = getTransformsManager();
    const preventDefaultHandler: GestureHandler = {
      onMove: ({ touchEvent }) => {
        touchEvent.preventDefault();
        touchEvent.stopPropagation();
      },
    };
    const swipeHandler: GestureHandler = {
      onMove: ({ moveX }) => {
        const transform = `translateX(${moveX}px)`;
        getElements(context).forEach((el) => {
          transformTo(el, transform);
        });
      },
      onEnd: ({ moveX, isReturningX }) => {
        const width = document.documentElement.clientWidth;
        const middleEl = context.modalMediaEl;
        const centroidDiff = middleEl
          ? (() => {
              const rect = middleEl.getBoundingClientRect();
              return rect.left + rect.width / 2 - width / 2;
            })()
          : 0;
        if (!isReturningX && moveX > 0 !== centroidDiff > 0) {
          isReturningX = true;
        }
        moveX = centroidDiff;
        if (isReturningX) {
          getElements(context).forEach((el) => {
            transitionWrapper(el, () => {
              transformReset(el);
            });
          });
        } else {
          getElements(context).forEach((el) => {
            ensureNoTransition(el);
            el.getBoundingClientRect();
            transformReset(el);
          });
          flushSync(() => {
            if (moveX > 0) {
              dec();
            } else {
              inc();
            }
          });
          const movement = moveX > 0 ? moveX - width : width + moveX;
          const transform = `translateX(${movement}px)`;
          const elements = getElements(context);
          elements.forEach((el) => {
            transformTo(el, transform);
          });
          elements.forEach((el) => {
            el.getBoundingClientRect();
            // transformReset(el);
            transitionWrapper(
              el,
              () => {
                transformReset(el);
              },
              // { transition: "transform 3s" },
            );
          });
        }
      },
    };
    const pinchHandler: GestureHandler = {
      onPinchMove: () => {
        // just a stub
      },
    };
    const handlers = composeGestureHandlers([
      preventDefaultHandler,
      swipeHandler,
      pinchHandler,
    ]);
    return getGestureManager({
      getConstraints: () => {
        return { left: getCanInc(), right: getCanDec() };
      },
      handlers,
      withMargin: true,
    });
  }, [context, dec, inc]);
  return dragHandler;
}

function getElements(context: GalleryContextType): HTMLElement[] {
  const leftEl = context.leftModalMediaEl;
  const middleEl = context.modalMediaEl;
  const rightEl = context.rightModalMediaEl;
  return [leftEl, middleEl, rightEl].filter(nonNullable);
}
