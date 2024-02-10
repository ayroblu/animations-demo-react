import React from "react";
import {
  DragHandler,
  GestureHandler,
  composeGestureHandlers,
  getLinearGestureManager,
  getTransformsManager,
  noopDragHandler,
  transitionWrapper,
  useDragEvent,
} from "../../lib/utils/animations";
import { clamp } from "../../lib/utils";
import { getCanDec, getCanInc, useIncDecSelectedIndex } from "./state";
import { useGalleryContext } from "./useGalleryContext";
import { flushSync } from "react-dom";

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
    const dragDefaultHandler: GestureHandler = {
      onMove: ({ moveX, moveY }) => {
        const scale = `scale(${Math.min(1, Math.pow(2.7, -moveY / 1000))})`;
        transformTo(image, `translate(${moveX}px, ${moveY}px) ${scale}`);
      },
      onEnd: ({ isReturningY }) => {
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
    const { onReset, onMove, onEnd } = composeGestureHandlers([
      preventDefaultHandler,
      dragDefaultHandler,
      backgroundHandler,
    ]);
    return getLinearGestureManager({
      getConstraints: () => {
        return { down: true };
      },
      handlers: { onReset, onMove, onEnd },
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
    const dragDefaultHandler: GestureHandler = {
      onMove: ({ moveX }) => {
        const leftEl = context.leftModalMediaEl;
        const middleEl = context.modalMediaEl;
        const rightEl = context.rightModalMediaEl;
        if (leftEl && middleEl && rightEl) {
          const transform = `translateX(${moveX}px)`;
          [leftEl, middleEl, rightEl].forEach((el) => {
            el.style.transition = "";
            transformTo(el, transform);
          });
        }
      },
      onEnd: ({ moveX, isReturningX }) => {
        const leftEl = context.leftModalMediaEl;
        const middleEl = context.modalMediaEl;
        const rightEl = context.rightModalMediaEl;
        if (!leftEl || !middleEl || !rightEl) {
          return;
        }
        if (isReturningX) {
          [leftEl, middleEl, rightEl].forEach((el) => {
            transitionWrapper(el, () => {
              transformReset(el);
            });
          });
        } else {
          const width = document.documentElement.clientWidth;
          [leftEl, middleEl, rightEl].forEach((el) => {
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
          [leftEl, middleEl, rightEl].forEach((el) => {
            transformTo(el, transform);
          });
          [leftEl, middleEl, rightEl].forEach((el) => {
            el.getBoundingClientRect();
            transitionWrapper(el, () => {
              transformReset(el);
            });
          });
        }
      },
    };
    const { onReset, onMove, onEnd } = composeGestureHandlers([
      preventDefaultHandler,
      dragDefaultHandler,
    ]);
    return getLinearGestureManager({
      getConstraints: () => {
        return { left: getCanDec(), right: getCanInc() };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [context, dec, inc]);
  return dragHandler;
}
