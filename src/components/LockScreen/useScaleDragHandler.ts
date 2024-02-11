import React from "react";
import styles from "./Notification.module.css";
import {
  getTransformsManager,
  transitionWrapper,
} from "../../lib/utils/animations";
import {
  DragHandler,
  GestureHandler,
  composeGestureHandlers,
  getLinearGestureManager,
  noopDragHandler,
} from "../../lib/utils/touch";
import { useNotification } from "./useNotification";
import { flushSync } from "react-dom";
import { useLockScreenData } from "./useLockScreenData";
import { getTransform } from "../../lib/utils";

type Params = {
  notifRef: React.MutableRefObject<HTMLDivElement | null>;
  cutBoxRef: React.MutableRefObject<HTMLDivElement | null>;
  notifOptionsRef: React.MutableRefObject<HTMLDivElement | null>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  isViewControls: boolean;
  setIsViewControls: React.Dispatch<React.SetStateAction<boolean>>;
  removeNotification: (id: string) => void;
  setIsExiting: React.Dispatch<React.SetStateAction<boolean>>;
};
export function useScaleDragHandler(params: Params) {
  const {
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    containerRef,
    isViewControls,
    setIsViewControls,
    removeNotification,
    setIsExiting,
  } = params;
  const { id } = useNotification();
  const { notifRefs } = useLockScreenData();
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
    function removeThisNotification() {
      const container = containerRef.current;
      if (!container) return;
      const originalRect = container.getBoundingClientRect();
      const beforeNotifRects = notifRefs.map(
        (ref) => ref?.getBoundingClientRect(),
      );
      flushSync(() => {
        setIsExiting(true);
      });
      const afterNotifRects = notifRefs.map(
        (ref) => ref?.getBoundingClientRect(),
      );
      // const newRect = container.getBoundingClientRect();
      container.style.top = originalRect.top + "px";
      afterNotifRects.forEach((afterRect, i) => {
        const beforeRect = beforeNotifRects[i];
        const ref = notifRefs[i];
        if (!ref || !beforeRect || !afterRect) return;
        if (container.contains(ref)) return;
        if (getComputedStyle(ref.children[0]).position === "fixed") return;
        const transform = getTransform(afterRect, beforeRect);
        transformTo(ref, transform);
        ref.getBoundingClientRect();
        transitionWrapper(ref, () => {
          transformReset(ref);
        });
      });

      if (container) {
        container.addEventListener(
          "transitionend",
          () => {
            removeNotification(id);
          },
          { once: true },
        );
      }
    }
    const notifHandler: GestureHandler = {
      onReset: () => {
        transformReset(notif);
      },
      onMove: ({ moveX }) => {
        transformTo(notif, `translateX(${moveX}px)`);
      },
      onEnd: ({ moveX }) => {
        resetAllAnimations({ commitStyles: true });
        if (isClearing) {
          transformReset(notif);
          notif.style.transform = "";

          const notifControlsWidth = notifOptions.clientWidth;
          const isViewControls = isViewControlsRef.current;
          const leftMove = isViewControls
            ? -moveX + notifControlsWidth
            : -moveX;
          notif.style.setProperty("--translateX", -leftMove + "px");
          if (leftMove < notif.clientWidth) {
            animateElement(
              notif,
              {
                translateX: -notif.clientWidth - 8 + "px",
              },
              removeThisNotification,
            );
          } else {
            removeThisNotification();
          }
        } else {
          transitionWrapper(notif, () => {
            transformReset(notif);
          });
        }
      },
    };
    let isClearing = false;
    const { animateElement, resetAnimation, resetAllAnimations, isAnimating } =
      getAnimationManager();
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
        const notifControlEls = Array.from(
          cutBox.getElementsByClassName(styles.notifControl),
        );
        const leftMove = isViewControls ? -moveX : -moveX - notifControlsWidth;
        if (scale > 1.2) {
          const width = notifControlEls.at(-1)!.clientWidth;
          // why +4???
          const itemScale =
            1 + (notifControlsWidth + 4 - width + leftMove) / width;
          for (let i = 0; i < notifControlEls.length; ++i) {
            const notifControlEl = notifControlEls[i];
            if (notifControlEl instanceof HTMLElement) {
              if (isClearing === false) {
                resetAnimation(notifControlEl, { commitStyles: true });
              }
              forEachElementByClass(notifControlEl, styles.scaleRev, (el) => {
                if (isClearing === false) {
                  resetAnimation(el, { commitStyles: true });
                }
              });
              if (i === notifControlEls.length - 1) {
                animateElement(notifControlEl, { scaleX: itemScale + "" });

                forEachElementByClass(notifControlEl, styles.scaleRev, (el) => {
                  animateElement(el, { scaleX: itemScale + "" });
                });
              } else {
                const currentScaleX =
                  notifControlEl.style.getPropertyValue("--scaleX");
                animateElement(notifControlEl, {
                  scaleX: currentScaleX,
                  translateX:
                    -notifControlEl.clientWidth - 8 - 8 - leftMove + "px",
                });
                forEachElementByClass(notifControlEl, styles.scaleRev, (el) => {
                  animateElement(el, { scaleX: "1" });
                });
              }
            }
          }
          isClearing = true;
        } else if (scale > 1) {
          const totalWidth = notifControlEls.reduce(
            (sum, next) => sum + next.clientWidth,
            0,
          );
          const itemScale = 1 + leftMove / totalWidth;
          notifControlEls.reverse();
          let cumulativeX = 0;
          for (const notifControlEl of notifControlEls) {
            if (notifControlEl instanceof HTMLElement) {
              if (isClearing === true) {
                resetAnimation(notifControlEl, { commitStyles: true });
                forEachElementByClass(notifControlEl, styles.scaleRev, (el) => {
                  resetAnimation(el, { commitStyles: true });
                });
              }
              if (isClearing === true || isAnimating(notifControlEl)) {
                animateElement(notifControlEl, {
                  scaleX: itemScale + "",
                  translateX: -cumulativeX + "px",
                });
                forEachElementByClass(notifControlEl, styles.scaleRev, (el) => {
                  animateElement(el, { scaleX: itemScale + "" });
                });
              } else {
                notifControlEl.style.setProperty("--scaleX", itemScale + "");
                notifControlEl.style.setProperty(
                  "--translateX",
                  -cumulativeX + "px",
                );
                forEachElementByClass(notifControlEl, styles.scaleRev, (el) => {
                  el.style.setProperty("--scaleX", itemScale + "");
                });
              }
              cumulativeX = notifControlEl.clientWidth * (itemScale - 1);
            }
          }
          isClearing = false;
        } else {
          for (const notifControlEl of notifControlEls) {
            if (notifControlEl instanceof HTMLElement) {
              notifControlEl.style.removeProperty("--scaleX");
              notifControlEl.style.removeProperty("--translateX");
            }
          }
        }
      },
      onEnd: ({ moveX, isReturningX }) => {
        const notifOptionsWidth = notifOptions.clientWidth;
        const isViewControls = isViewControlsRef.current;
        if (isClearing) {
          const currentScaleX = parseFloat(
            cutBox.style.getPropertyValue("--scaleX"),
          );
          const cutBoxScale = notif.clientWidth / notifOptionsWidth;
          if (currentScaleX > cutBoxScale) {
            // go straight to removing and dismissing
          }
          // cutBox.style.setProperty("--scaleX", cutBoxScale + "");
          animateElement(cutBox, {
            scaleX: cutBoxScale + "",
          });
          // notifOptions.style.setProperty("--scaleX", cutBoxScale + "");
          animateElement(notifOptions, {
            scaleX: cutBoxScale + "",
          });

          forEachElementByClass(
            cutBox,
            styles.notifControl,
            (notifControlEl, i, els) => {
              if (i === els.length - 1) {
                const width = notifControlEl.clientWidth;
                // 8*2 for the two gaps
                const itemScale = 1 + notif.clientWidth / (width + 16);
                animateElement(notifControlEl, {
                  scaleX: itemScale + "",
                });
                forEachElementByClass(notifControlEl, styles.scaleRev, (el) => {
                  animateElement(el, {
                    scaleX: itemScale + "",
                  });
                });
              } else {
                const currentScaleX =
                  notifControlEl.style.getPropertyValue("--scaleX");
                const leftMove =
                  cutBoxScale * notifOptionsWidth - notifOptionsWidth;
                animateElement(notifControlEl, {
                  scaleX: currentScaleX,
                  translateX: -notifControlEl.clientWidth - 8 - leftMove + "px",
                });
              }
            },
          );
        } else {
          const isVisible = isViewControls
            ? !(moveX > 0 && !isReturningX)
            : !isReturningX || -moveX > notifOptionsWidth;

          const animation = `0.3s -0.05s ${
            isVisible ? styles.scaleNormal : styles.scaleHidden
          }`;
          setAnimation(cutBox, animation);
          setAnimation(notifOptions, animation);
          const animationInner = isVisible
            ? animation
            : `0.3s -0.05s ${styles.scaleNormal}`;

          forEachElementByClass(cutBox, styles.notifControl, (el) => {
            setAnimation(el, animationInner);
          });
          forEachElementByClass(cutBox, styles.scaleRev, (el) => {
            setAnimation(el, animationInner);
          });
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
        if (!isClearing) {
          setIsViewControls(isVisible);
        }
        isClearing = false;
      },
    };
    const { onReset, onMove, onEnd } = composeGestureHandlers([
      preventDefaultHandler,
      notifHandler,
      notifControlsHandler,
      setStateHandler,
    ]);
    return getLinearGestureManager({
      getConstraints: () => {
        const isViewControls = isViewControlsRef.current;
        return { left: true, right: isViewControls };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [
    containerRef,
    cutBoxRef,
    id,
    notifOptionsRef,
    notifRef,
    notifRefs,
    removeNotification,
    setIsExiting,
    setIsViewControls,
  ]);
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

function forEachElementByClass(
  parent: HTMLElement,
  className: string,
  func: (element: HTMLElement, i: number, list: Element[]) => void,
) {
  let i = 0;
  const elements = Array.from(parent.getElementsByClassName(className));
  for (const el of elements) {
    if (el instanceof HTMLElement) {
      func(el, i, elements);
    }
    ++i;
  }
}

function getAnimationManager() {
  const map = new Map<HTMLElement, Animation>();
  const eventListenerManager = getEventListenerManager();

  function animateOnce(
    element: HTMLElement,
    getAnimation: () => Animation,
    updateAnimation: (animation: Animation) => void,
    onEnd: () => void,
  ) {
    const animation = map.get(element);
    if (animation) {
      eventListenerManager.remove(animation);
      if (animation.playState === "running") {
        eventListenerManager.set(animation, () => {
          onEnd();
        });
        updateAnimation(animation);
      } else {
        onEnd();
      }
    } else {
      const animation = getAnimation();
      map.set(element, animation);
      eventListenerManager.set(animation, () => {
        onEnd();
      });
    }
  }
  function animateElement(
    element: HTMLElement,
    { scaleX, translateX }: { scaleX?: string; translateX?: string },
    onEnd?: () => void,
  ) {
    const currentScaleX =
      scaleX !== undefined ? element.style.getPropertyValue("--scaleX") : null;
    const currentTranslateX =
      translateX !== undefined
        ? element.style.getPropertyValue("--translateX")
        : null;
    animateOnce(
      element,
      () =>
        element.animate(
          [
            {
              ...(scaleX !== undefined ? { "--scaleX": currentScaleX } : {}),
              ...(translateX !== undefined
                ? { "--translateX": currentTranslateX }
                : {}),
            },
            {
              ...(scaleX !== undefined ? { "--scaleX": scaleX } : {}),
              ...(translateX !== undefined
                ? { "--translateX": translateX }
                : {}),
            },
          ],
          150,
        ),
      (animation) => {
        const effect = animation.effect;
        if (effect instanceof KeyframeEffect) {
          effect.setKeyframes([
            {
              ...(scaleX !== undefined ? { "--scaleX": currentScaleX } : {}),
              ...(translateX !== undefined
                ? { "--translateX": currentTranslateX }
                : {}),
            },
            {
              ...(scaleX !== undefined ? { "--scaleX": scaleX } : {}),
              ...(translateX !== undefined
                ? { "--translateX": translateX }
                : {}),
            },
          ]);
        }
      },
      () => {
        scaleX !== undefined && element.style.setProperty("--scaleX", scaleX);
        translateX !== undefined &&
          element.style.setProperty("--translateX", translateX);
        onEnd?.();
      },
    );
  }
  function resetAnimation(
    element: HTMLElement,
    { commitStyles }: { commitStyles?: boolean } = {},
  ) {
    const animation = map.get(element);
    if (animation) {
      if (commitStyles) {
        animation.commitStyles();
      }
      animation.cancel();
      map.delete(element);
      eventListenerManager.remove(animation);
    }
  }
  function resetAllAnimations({
    commitStyles,
  }: { commitStyles?: boolean } = {}) {
    for (const [, animation] of map) {
      if (commitStyles) {
        animation.commitStyles();
      }
      animation.cancel();
      eventListenerManager.remove(animation);
    }
    map.clear();
  }
  function isAnimating(key: HTMLElement): boolean {
    return !!map.get(key);
  }

  return {
    animateElement,
    animateOnce,
    resetAnimation,
    resetAllAnimations,
    isAnimating,
  };
}
function getEventListenerManager() {
  const eventListeners = new WeakMap<Animation, () => void>();
  function remove(animation: Animation) {
    const eventListener = eventListeners.get(animation);
    if (eventListener) {
      animation.removeEventListener("finish", eventListener);
    }
  }
  function set(animation: Animation, func: () => void) {
    eventListeners.set(animation, func);
    animation.addEventListener("finish", func, { once: true });
  }
  return {
    set,
    remove,
  };
}
