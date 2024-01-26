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
  const isViewControlsRef = React.useRef(isViewControls);
  isViewControlsRef.current = isViewControls;
  const scaleDragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset } = getTransformsManager();
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
        const resetProperties = (el: HTMLElement) => {
          el.style.removeProperty("--scaleX");
          el.style.removeProperty("--translateX");
        };
        resetProperties(cutBox);
        resetProperties(notifOptions);
        const notifControlEls = Array.from(
          cutBox.getElementsByClassName(styles.notifControl),
        );
        for (const notifControlEl of notifControlEls) {
          if (notifControlEl instanceof HTMLElement) {
            resetProperties(notifControlEl);
          }
        }

        const scaleRevEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleRev),
        );
        for (const scaleRevEl of scaleRevEls) {
          if (scaleRevEl instanceof HTMLElement) {
            resetProperties(scaleRevEl);
          }
        }
      },
      onMove: ({ moveX }) => {
        const notifControlsWidth = notifOptions.clientWidth;
        const isViewControls = isViewControlsRef.current;
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
            }
          }
        }
      },
      onEnd: ({ moveX, isReturningX }) => {
        const notifOptionsWidth = notifOptions.clientWidth;
        const isViewControls = isViewControlsRef.current;
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
            setAnimation(notifControlEl, animation);
          }
        }

        const scaleRevEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleRev),
        );
        for (const scaleRevEl of scaleRevEls) {
          if (scaleRevEl instanceof HTMLElement) {
            setAnimation(scaleRevEl, animation);
          }
        }
      },
    };
    const setStateHandler: GestureHandler = {
      onEnd: ({ moveX, isReturningX }) => {
        const notifOptionsWidth = notifOptions.clientWidth;
        const isViewControls = isViewControlsRef.current;
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
        const isViewControls = isViewControlsRef.current;
        return { left: true, right: isViewControls };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [cutBoxRef, notifOptionsRef, notifRef, setIsViewControls]);
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
        el.style.removeProperty("--scaleX");
      } else {
        el.style.removeProperty("--scaleX");
      }
      el.style.removeProperty("--translateX");
      el.style.animation = "";
    },
    { once: true },
  );
  el.style.animation = animation;
}
