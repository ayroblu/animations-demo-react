import React from "react";
import {
  DragHandler,
  GestureHandler,
  composeGestureHandlers,
  getLinearGestureManager,
  getTransformsManager,
  noopDragHandler,
  transitionWrapper,
} from "../../lib/utils/animations";
import { clamp } from "../../lib/utils";

type Params = {
  notifRef: React.MutableRefObject<HTMLDivElement | null>;
  cutBoxRef: React.MutableRefObject<HTMLDivElement | null>;
  notifOptionsRef: React.MutableRefObject<HTMLDivElement | null>;
  isViewControls: boolean;
  setIsViewControls: React.Dispatch<React.SetStateAction<boolean>>;
};
export function useSlideDragHandler(params: Params) {
  const {
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    isViewControls,
    setIsViewControls,
  } = params;
  const slideDragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset, getTransformedElements } =
      getTransformsManager();
    const notif = notifRef.current;
    const cutBox = cutBoxRef.current;
    const notifOptions = notifOptionsRef.current;
    if (!notif || !cutBox || !notifOptions) return noopDragHandler;
    const preventDefaultHandler: GestureHandler = {
      onMove: ({ touchEvent }) => {
        touchEvent.preventDefault();
        touchEvent.stopPropagation();
      },
    };
    const notifHandler: GestureHandler = {
      onReset: () => {
        transformReset(notif);
      },
      onMove: ({ moveX }) => {
        transformTo(notif, `translateX(${moveX}px)`);
      },
      onEnd: () => {
        transitionWrapper(notif, () => {
          transformReset(notif);
        });
      },
    };
    const notifControlsHandler: GestureHandler = {
      onReset: () => {
        for (const element of getTransformedElements()) {
          transformReset(element);
        }
      },
      onMove: ({ moveX }) => {
        const notifControlsWidth = notifOptions.clientWidth;
        if (isViewControls) {
          moveX = Math.max(0, moveX);
        } else {
          moveX += 8;
          moveX = Math.max(-notifControlsWidth, moveX);
        }
        transformTo(cutBox, `translateX(${moveX}px)`);
        transformTo(notifOptions, `translateX(${-moveX}px)`);
        if (isViewControls) {
          cutBox.style.opacity =
            clamp(0, (notifControlsWidth - moveX - 20) / 20, 1) + "";
        } else {
          cutBox.style.opacity = clamp(0, (-moveX - 20) / 20, 1) + "";
        }
      },
      onEnd: () => {
        for (const element of getTransformedElements()) {
          if (element === cutBox) continue;
          transitionWrapper(element, () => {
            transformReset(element);
          });
        }
        transitionWrapper(
          cutBox,
          () => {
            transformReset(cutBox);
            cutBox.style.opacity = "";
          },
          { transition: "opacity 0.3s, transform 0.3s" },
        );
      },
    };
    const stateHandler: GestureHandler = {
      onEnd: ({ isReturningX, moveX }) => {
        const notifOptionsWidth = notifOptions.clientWidth;
        const isVisible = isViewControls
          ? !(moveX > 0 && !isReturningX)
          : !isReturningX || -moveX > notifOptionsWidth;
        setIsViewControls(isVisible);
      },
    };
    const { onReset, onMove, onEnd } = composeGestureHandlers([
      preventDefaultHandler,
      notifHandler,
      notifControlsHandler,
      stateHandler,
    ]);
    return getLinearGestureManager({
      getConstraints: () => {
        return { left: true, right: isViewControls };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [cutBoxRef, isViewControls, notifOptionsRef, notifRef, setIsViewControls]);
  return slideDragHandler;
}
