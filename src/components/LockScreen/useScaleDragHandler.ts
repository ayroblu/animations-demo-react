import React from "react";
import styles from "./LockScreen.module.css";
import {
  DragHandler,
  GestureHandler,
  composeGestureHandlers,
  getLinearGestureManager,
  getTransformsManager,
  noopDragHandler,
  transitionWrapper,
} from "../../lib/utils/animations";

type Params = {
  notifRef: React.MutableRefObject<HTMLDivElement | null>;
  cutBoxRef: React.MutableRefObject<HTMLDivElement | null>;
  notifOptionsRef: React.MutableRefObject<HTMLDivElement | null>;
  isViewControls: boolean;
  setIsViewControls: React.Dispatch<React.SetStateAction<boolean>>;
};
export function useScaleDragHandler(params: Params) {
  const {
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    isViewControls,
    setIsViewControls,
  } = params;
  const scaleDragHandler: DragHandler = React.useCallback(() => {
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
        notifOptions.style.transform = "";
        cutBox.style.transform = "";

        const resetProperties = (el: HTMLElement) => {
          el.style.setProperty("--scaleX", "0.05");
          el.style.setProperty("--translateX", "0");
        };
        resetProperties(cutBox);
        resetProperties(notifOptions);
        const notifControlEls = Array.from(
          cutBox.getElementsByClassName(styles.notifControl),
        );
        for (const notifControlEl of notifControlEls) {
          if (notifControlEl instanceof HTMLElement) {
            notifControlEl.style.borderRadius = "";
            notifControlEl.style.transform = "";
            resetProperties(notifControlEl);
          }
        }

        const scaleRevEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleRev),
        );
        for (const scaleRevEl of scaleRevEls) {
          if (scaleRevEl instanceof HTMLElement) {
            scaleRevEl.style.transform = "";
            resetProperties(scaleRevEl);
          }
        }
      },
      onMove: ({ moveX }) => {
        const notifControlsWidth = notifOptions.clientWidth;
        if (!isViewControls) {
          moveX += 8;
        }
        const scale = isViewControls
          ? 1 - moveX / notifControlsWidth
          : -moveX / notifControlsWidth;
        cutBox.style.setProperty("--scaleX", scale + "");
        notifOptions.style.setProperty("--scaleX", scale + "");

        const scaleRevEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleRev),
        );
        for (const scaleRevEl of scaleRevEls) {
          if (scaleRevEl instanceof HTMLElement) {
            if (scale > 1) {
              scaleRevEl.style.setProperty("--scaleX", scale + "");
            } else {
              scaleRevEl.style.setProperty("--scaleX", "1");
            }
          }
        }
        const notifControlEls = Array.from(
          cutBox.getElementsByClassName(styles.notifControl),
        );
        const totalWidth = notifControlEls.reduce(
          (sum, next) => sum + next.clientWidth,
          0,
        );
        const leftMove = isViewControls ? -moveX : -moveX - notifControlsWidth;
        const itemScale = 1 + leftMove / totalWidth;
        notifControlEls.reverse();
        let cumulativeX = 0;
        for (const notifControlEl of notifControlEls) {
          if (notifControlEl instanceof HTMLElement) {
            if (scale > 1) {
              notifControlEl.style.setProperty("--scaleX", itemScale + "");
              notifControlEl.style.setProperty(
                "--translateX",
                -cumulativeX + "px",
              );
              cumulativeX = notifControlEl.clientWidth * (itemScale - 1);
            } else {
              notifControlEl.style.borderRadius = "";
              notifControlEl.style.transform = "";
            }
          }
        }
      },
      onEnd: ({ moveX, isReturningX }) => {
        for (const element of getTransformedElements()) {
          transitionWrapper(element, () => {
            transformReset(element);
          });
        }
        // y = 1/x - can't use normal transition
        notifOptions.style.transform = "";
        cutBox.style.transform = "";

        const notifOptionsWidth = notifOptions.clientWidth;
        const isVisible = isViewControls
          ? !(moveX > 0 && !isReturningX)
          : !isReturningX || -moveX > notifOptionsWidth;

        const animation = `0.3s -0.05s ${
          isVisible ? styles.scaleNormal : styles.scaleHidden
        } forwards`;
        setAnimation(cutBox, animation);
        setAnimation(notifOptions, animation);
        const notifControlEls = Array.from(
          cutBox.getElementsByClassName(styles.notifControl),
        );
        for (const notifControlEl of notifControlEls) {
          if (notifControlEl instanceof HTMLElement) {
            notifControlEl.style.borderRadius = "";
            notifControlEl.style.transform = "";
            setAnimation(notifControlEl, animation);
          }
        }

        const scaleRevEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleRev),
        );
        for (const scaleRevEl of scaleRevEls) {
          if (scaleRevEl instanceof HTMLElement) {
            scaleRevEl.style.transform = "";
            setAnimation(scaleRevEl, animation);
          }
        }
      },
    };
    const setStateHandler: GestureHandler = {
      onEnd: ({ moveX, isReturningX }) => {
        const notifOptionsWidth = notifOptions.clientWidth;
        const isVisible = isViewControls
          ? !(moveX > 0 && !isReturningX)
          : !isReturningX || -moveX > notifOptionsWidth;
        setIsViewControls(isVisible);
      },
    };
    const { onReset, onMove, onEnd } = composeGestureHandlers([
      preventDefaultHandler,
      notifControlsHandler,
      notifHandler,
      setStateHandler,
    ]);
    return getLinearGestureManager({
      getConstraints: () => {
        return { left: true, right: isViewControls };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [cutBoxRef, isViewControls, notifOptionsRef, notifRef, setIsViewControls]);
  return scaleDragHandler;
}
function setAnimation(el: HTMLElement, animation: string) {
  if (el.style.animation) {
    el.style.animation = "";
    el.getBoundingClientRect();
  }
  el.addEventListener(
    "animationend",
    () => {
      if (animation.includes(styles.scaleHidden)) {
        el.style.setProperty("--scaleX", "0.05");
      } else {
        el.style.setProperty("--scaleX", "1");
      }
      el.style.setProperty("--translateX", "0");
      el.style.animation = "";
    },
    { once: true },
  );
  el.style.animation = animation;
}
