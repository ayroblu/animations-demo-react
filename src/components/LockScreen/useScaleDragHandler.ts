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
        for (const element of getTransformedElements()) {
          transitionWrapper(element, () => {
            transformReset(element);
          });
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
        // cutBox.style.transform = `scaleX(${scale})`;
        cutBox.style.setProperty("--scaleX", scale + "");
        // const revScale = scale === 0 ? 1 : 1 / scale;
        // notifOptions.style.transform = `scaleX(${revScale})`;
        notifOptions.style.setProperty("--scaleX", scale + "");
        // if (isViewControls) {
        //   // Technically is wrong, should actually grab the bounding client rect initial offset in case the user grabs the item while animating
        //   cutBox.style.opacity =
        //     clamp(0, (notifControlsWidth - moveX - 20) / 20, 1) + "";
        // } else {
        //   cutBox.style.opacity = clamp(0, (-moveX - 20) / 20, 1) + "";
        // }

        const scaleRevEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleRev),
        );
        for (const scaleRevEl of scaleRevEls) {
          if (scaleRevEl instanceof HTMLElement) {
            if (scale > 1) {
              // const revScale = scale === 0 ? 1 : 1 / scale;
              // scaleRevEl.style.transform = `scaleX(${revScale})`;
              scaleRevEl.style.setProperty("--scaleX", scale + "");
            } else {
              // scaleRevEl.style.transform = `scaleX(1)`;
              scaleRevEl.style.setProperty("--scaleX", "1");
            }
          }
        }
        // if (scale > 1) {
        //   cutBox.style.borderRadius = "0";
        // } else {
        //   cutBox.style.borderRadius = `${16 / scale}px / 16px`;
        // }
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
              notifControlEl.style.borderRadius = `${16 / itemScale}px / 16px`;
              // notifControlEl.style.transform = `translateX(-${cumulativeX}px) scaleX(${itemScale})`;
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
        // const initialWidth = cutBox.getBoundingClientRect().width;
        notifOptions.style.transform = "";
        cutBox.style.transform = "";
        // cutBox.style.setProperty("--scaleX", "1");
        // const startTime = Date.now();

        // perform setState here so that we have the before and after
        const notifOptionsWidth = notifOptions.clientWidth;
        const isVisible = isViewControls
          ? !(moveX > 0 && !isReturningX)
          : !isReturningX || -moveX > notifOptionsWidth;

        const animation = `0.3s ${
          isVisible ? styles.scaleNormal : styles.scaleHidden
        } forwards`;
        setAnimation(cutBox, animation);
        setAnimation(notifOptions, animation);
        const notifControlEls = Array.from(
          cutBox.getElementsByClassName(styles.notifControl),
        );
        for (const notifControlEl of notifControlEls) {
          if (notifControlEl instanceof HTMLElement) {
            // notifControlEl.animate(
            //   [{ "--scaleX": initialWidth / currentWidth }, { "--scaleX": 1 }],
            //   { duration: 300 },
            // );
            notifControlEl.style.borderRadius = "";
            notifControlEl.style.transform = "";
            setAnimation(notifControlEl, animation);
          }
        }
        // transitionWrapper(
        //   cutBox,
        //   () => {
        //     cutBox.style.opacity = "";
        //   },
        //   { transition: "opacity 0.3s" },
        // );

        const scaleRevEls = Array.from(
          cutBox.getElementsByClassName(styles.scaleRev),
        );
        for (const scaleRevEl of scaleRevEls) {
          if (scaleRevEl instanceof HTMLElement) {
            scaleRevEl.style.transform = "";
            setAnimation(scaleRevEl, animation);
          }
        }

        // const currentWidth = cutBox.getBoundingClientRect().width;
        // const originalWidth = cutBox.clientWidth;
        // const durationMs = 300;
        // manualTransitionTransform(
        //   () => {
        //     const y = ease(
        //       Math.min(durationMs, Date.now() - startTime) / durationMs,
        //     );
        //     const r = initialWidth / currentWidth;
        //     const scale = r + y * (1 - r);
        //     transformTo(cutBox, `scaleX(${scale})`);
        //     let revScale = scale === 0 ? 1 : 1 / scale;
        //     if (currentWidth > originalWidth) {
        //       revScale = Math.max(1, revScale);
        //     }
        //     transformTo(notifOptions, `scaleX(${revScale})`);
        //     cutBox.style.opacity =
        //       clamp(0, (currentWidth * scale - 20) / 20, 1) + "";

        //     const notifControlEls = Array.from(
        //       cutBox.getElementsByClassName(styles.notifControl),
        //     );
        //     for (const notifControlEl of notifControlEls) {
        //       if (notifControlEl instanceof HTMLElement) {
        //         notifControlEl.style.borderRadius = `${16 / scale}px / 16px`;
        //         notifControlEl.style.transform = "";
        //       }
        //     }

        //     const scaleRevEls = Array.from(
        //       cutBox.getElementsByClassName(styles.scaleRev),
        //     );
        //     for (const scaleRevEl of scaleRevEls) {
        //       if (scaleRevEl instanceof HTMLElement) {
        //         const revScale = scale === 0 ? 1 : 1 / scale;
        //         scaleRevEl.style.transform = `scaleX(${revScale})`;
        //       }
        //     }
        //   },
        //   durationMs,
        //   {
        //     onEnd: () => {
        //       transformReset(notifOptions);
        //       transformReset(cutBox);
        //       cutBox.style.opacity = "";
        //       cutBox.style.borderRadius = "";
        //     },
        //   },
        // );
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
