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

export function useGalleryDragHandlers({
  isDetailState,
}: {
  isDetailState: [boolean, (isDetail: boolean) => void];
}) {
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const dismissDragHandler: DragHandler = useDismissDragHandler({
    modalRef,
    imageRef,
    isDetailState,
  });

  const getDragElement = () => modalRef.current;
  useDragEvent({
    dragHandler: dismissDragHandler,
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
  isDetailState,
}: {
  modalRef: React.RefObject<HTMLElement | null>;
  imageRef: React.RefObject<HTMLElement | null>;
  isDetailState: [boolean, (isDetail: boolean) => void];
}): DragHandler {
  const [isDetail, setIsDetail] = isDetailState;
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
          setIsDetail(false);
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
        return { down: isDetail };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [imageRef, isDetail, modalRef, setIsDetail]);
  return dragHandler;
}
