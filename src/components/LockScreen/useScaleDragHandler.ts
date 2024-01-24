import React from "react";
import styles from "./LockScreen.module.css";
import { clamp } from "../../lib/utils";
import {
  DragHandler,
  GestureHandler,
  composeGestureHandlers,
  getLinearGestureManager,
  getTransformsManager,
  manualTransitionTransform,
  noopDragHandler,
  transitionWrapper,
} from "../../lib/utils/animations";
import { ease } from "../../lib/utils/cubicBezier";
import { flushSync } from "react-dom";

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
        transitionWrapper(
          notif,
          () => {
            transformReset(notif);
          },
          { transition: "0.3s transform linear" },
        );
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
        cutBox.style.transform = `scaleX(${scale})`;
        const revScale = Math.max(1, scale === 0 ? 1 : 1 / scale);
        notifOptions.style.transform = `scaleX(${revScale})`;
        if (isViewControls) {
          // Technically is wrong, should actually grab the bounding client rect initial offset in case the user grabs the item while animating
          cutBox.style.opacity =
            clamp(0, (notifControlsWidth - moveX - 20) / 20, 1) + "";
        } else {
          cutBox.style.opacity = clamp(0, (-moveX - 20) / 20, 1) + "";
        }
        if (scale > 1) {
          const scaleRevEls = Array.from(
            cutBox.getElementsByClassName(styles.scaleRev),
          );
          for (const scaleRevEl of scaleRevEls) {
            if (scaleRevEl instanceof HTMLElement) {
              const revScale = scale === 0 ? 1 : 1 / scale;
              scaleRevEl.style.transform = `scaleX(${revScale})`;
              // transformTo(scaleRevEl, `scaleX(${revScale})`, {
              //   transformOrigin: "center",
              // });
            }
          }
          cutBox.style.borderRadius = "0";
          const notifControlEls = Array.from(
            cutBox.getElementsByClassName(styles.notifControl),
          );
          for (const notifControlEl of notifControlEls) {
            if (notifControlEl instanceof HTMLElement) {
              notifControlEl.style.borderRadius = `${16 / scale}px / 16px`;
            }
          }
        } else {
          cutBox.style.borderRadius = `${16 / scale}px / 16px`;
        }
      },
      onEnd: ({ moveX, isReturningX }) => {
        for (const element of getTransformedElements()) {
          transitionWrapper(element, () => {
            transformReset(element);
          });
        }
        // y = 1/x - can't use normal transition
        const initialWidth = cutBox.getBoundingClientRect().width;
        notifOptions.style.transform = "";
        cutBox.style.transform = "";
        const startTime = Date.now();

        // perform setState here so that we have the before and after
        const notifOptionsWidth = notifOptions.clientWidth;
        const isVisible = isViewControls
          ? !(moveX > 0 && !isReturningX)
          : !isReturningX || -moveX > notifOptionsWidth;
        flushSync(() => {
          setIsViewControls(isVisible);
        });

        // transitionWrapper(
        //   cutBox,
        //   () => {
        //     cutBox.style.borderRadius = "16px / 16px";
        //   },
        //   { transition: "border-radius 3s" },
        // );

        const currentWidth = cutBox.getBoundingClientRect().width;
        const originalWidth = cutBox.clientWidth;
        const durationMs = 300;
        manualTransitionTransform(
          () => {
            const y = ease(
              Math.min(durationMs, Date.now() - startTime) / durationMs,
            );
            const r = initialWidth / currentWidth;
            const scale = r + y * (1 - r);
            transformTo(cutBox, `scaleX(${scale})`);
            let revScale = scale === 0 ? 1 : 1 / scale;
            if (currentWidth > originalWidth) {
              revScale = Math.max(1, revScale);
            }
            transformTo(notifOptions, `scaleX(${revScale})`);
            cutBox.style.opacity =
              clamp(0, (currentWidth * scale - 20) / 20, 1) + "";

            const notifControlEls = Array.from(
              cutBox.getElementsByClassName(styles.notifControl),
            );
            for (const notifControlEl of notifControlEls) {
              if (notifControlEl instanceof HTMLElement) {
                notifControlEl.style.borderRadius = `${16 / scale}px / 16px`;
              }
            }

            const scaleRevEls = Array.from(
              cutBox.getElementsByClassName(styles.scaleRev),
            );
            for (const scaleRevEl of scaleRevEls) {
              if (scaleRevEl instanceof HTMLElement) {
                const revScale = scale === 0 ? 1 : 1 / scale;
                scaleRevEl.style.transform = `scaleX(${revScale})`;
              }
            }
          },
          durationMs,
          {
            onEnd: () => {
              transformReset(notifOptions);
              transformReset(cutBox);
              cutBox.style.opacity = "";
              cutBox.style.borderRadius = "";
            },
          },
        );
      },
    };
    const { onReset, onMove, onEnd } = composeGestureHandlers([
      preventDefaultHandler,
      notifHandler,
      notifControlsHandler,
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
