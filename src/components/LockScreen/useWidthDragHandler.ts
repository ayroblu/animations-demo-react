import React from "react";
import styles from "./LockScreen.module.css";
import { clamp } from "../../lib/utils";
import { getResetable, transitionWrapper } from "../../lib/utils/animations";
import {
  DragHandler,
  GestureHandler,
  GestureOnEndParams,
  composeGestureHandlers,
  getGestureManager,
  noopDragHandler,
} from "../../lib/utils/touch";
import { getCachedValueManager } from "../../lib/utils/cache";

type Params = {
  notifRef: React.MutableRefObject<HTMLDivElement | null>;
  cutBoxRef: React.MutableRefObject<HTMLDivElement | null>;
  notifOptionsRef: React.MutableRefObject<HTMLDivElement | null>;
  isViewControls: boolean;
  setIsViewControls: React.Dispatch<React.SetStateAction<boolean>>;
};
export function useWidthDragHandler(params: Params) {
  const {
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    isViewControls,
    setIsViewControls,
  } = params;
  const widthDragHandler: DragHandler = React.useCallback(() => {
    const notif = notifRef.current;
    const cutBox = cutBoxRef.current;
    const notifOptionsCur = notifOptionsRef.current;
    if (!notif || !cutBox || !notifOptionsCur) return noopDragHandler;
    const notifOptions = notifOptionsCur;

    function getIsVisible({ moveX, isReturningX }: GestureOnEndParams) {
      const notifOptionsWidth = cachedValueManager.get(
        notifOptions,
        () => notifOptions.clientWidth,
      );
      return isViewControls
        ? !(moveX > 0 && !isReturningX)
        : !isReturningX || -moveX > notifOptionsWidth;
    }

    const preventDefaultHandler: GestureHandler = {
      onMove: ({ touchEvent }) => {
        touchEvent.preventDefault();
        touchEvent.stopPropagation();
      },
    };
    const notifHandler: GestureHandler = {
      onMove: ({ moveX }) => {
        const notifOptionsWidth = cachedValueManager.get(
          notifOptions,
          () => notifOptions.clientWidth,
        );
        if (isViewControls) {
          moveX -= notifOptionsWidth + 8;
        }
        notif.style.transform = `translateX(${moveX}px)`;
      },
      onEnd: (params) => {
        const notifOptionsWidth = cachedValueManager.get(
          notifOptions,
          () => notifOptions.clientWidth,
        );
        transitionWrapper(notif, () => {
          const isVisible = getIsVisible(params);
          if (isVisible) {
            notif.style.transform = `translateX(${-notifOptionsWidth - 8}px)`;
          } else {
            notif.style.transform = "";
          }
        });
      },
    };
    const cachedValueManager = getCachedValueManager<HTMLElement, number>();
    const notifOptionsResetable = getResetable<HTMLElement>();
    const notifOptionsHandler: GestureHandler = {
      onReset: () => {
        notifOptionsResetable.resetAll();
      },
      onMove: ({ moveX }) => {
        const notifOptionsWidth = cachedValueManager.get(
          notifOptions,
          () => notifOptions.clientWidth,
        );
        if (isViewControls) {
          moveX -= notifOptionsWidth;
        } else {
          moveX += 8;
        }
        cutBox.style.width = Math.max(0, -moveX) + "px";
        cutBox.style.opacity = clamp(0, (-moveX - 20) / 20, 1) + "";

        const controlEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleWidth),
        );
        for (const controlEl of controlEls) {
          if (controlEl instanceof HTMLElement) {
            if (-moveX > notifOptionsWidth) {
              const width = cachedValueManager.get(
                controlEl,
                () => controlEl.clientWidth,
              );
              const moveXPastFull = moveX + notifOptionsWidth;
              controlEl.style.width =
                width - moveXPastFull / controlEls.length + "px";
              notifOptionsResetable.set(controlEl, () => {
                transitionWrapper(
                  controlEl,
                  () => {
                    controlEl.style.width = `${width}px`;
                  },
                  {
                    transition: "width 0.3s",
                    onEnd: () => {
                      controlEl.style.width = "";
                    },
                  },
                );
              });
            } else {
              if (controlEl.style.width) {
                controlEl.style.width = "";
              }
            }
          }
        }
      },
      onEnd: (params) => {
        notifOptionsResetable.resetAll();

        const notifOptionsWidth = cachedValueManager.get(
          notifOptions,
          () => notifOptions.clientWidth,
        );
        const isVisible = getIsVisible(params);
        transitionWrapper(
          cutBox,
          () => {
            cutBox.style.opacity = "";
            if (isVisible) {
              cutBox.style.width = `${notifOptionsWidth}px`;
            } else {
              cutBox.style.width = "";
            }
          },
          { transition: "width 0.3s, opacity 0.3s" },
        );
      },
    };
    const stateHandler: GestureHandler = {
      onEnd: (params) => {
        const isVisible = getIsVisible(params);
        setIsViewControls(isVisible);
      },
    };
    const { onReset, onMove, onEnd } = composeGestureHandlers([
      preventDefaultHandler,
      notifOptionsHandler,
      notifHandler,
      stateHandler,
    ]);
    return getGestureManager({
      getConstraints: () => {
        return { left: true, right: isViewControls };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [cutBoxRef, isViewControls, notifOptionsRef, notifRef, setIsViewControls]);
  return widthDragHandler;
}
