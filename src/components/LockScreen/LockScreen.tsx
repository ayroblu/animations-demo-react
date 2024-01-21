import React from "react";
import styles from "./LockScreen.module.css";
import { clamp, cn, getScrollParent } from "../../lib/utils";
import { routes } from "../../routes";
import {
  DragHandler,
  GestureHandler,
  composeGestureHandlers,
  getLinearGestureManager,
  getTransformsManager,
  manualTransitionTransform,
  noopDragHandler,
  transitionWrapper,
  useAnimationScrollListener,
  useDragEvent,
} from "../../lib/utils/animations";
import { Link } from "react-router-dom";
import { useArrayRef, useJoinRefs } from "../../lib/utils/hooks";
import { FixedWithPlaceholder } from "../FixedWithPlaceholder";
import { flushSync } from "react-dom";

type Props = {
  notifications: string[];
};
export function LockScreen(_props: Props) {
  const time = useTime();
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const { refs: notifRefs, onRef: onNotifRef } = useArrayRef();
  const { refs: fixedNotifRefs, onRef: onFixedNotifRef } = useArrayRef();
  const [notifications, setNotifications] = React.useState(() =>
    Array(20)
      .fill(null)
      .map(() => ({
        isFixed: false,
      })),
  );
  const notificationsRef = React.useRef(notifications);
  notificationsRef.current = notifications;
  const scrollStateRef = React.useRef({
    lastScrollTop: 0,
    lastTime: Date.now(),
  });
  const transformsManagerRef = React.useRef(getTransformsManager());
  function scrollHandler() {
    const { transformTo, transformReset } = transformsManagerRef.current;
    const scroll = scrollRef.current;

    function onScroll() {
      const scrollState = scrollStateRef.current;
      const currentScrollTop = scroll?.scrollTop;
      const currentTime = Date.now();
      function getNextFrameDiff() {
        if (typeof currentScrollTop !== "number") return 0;
        const timeDiff = currentTime - scrollState.lastTime;
        if (timeDiff === 0) return 0;
        return ((currentScrollTop - scrollState.lastScrollTop) / timeDiff) * 15;
      }
      // scroll is out of sync with render, so try offset by a frame
      const nextFrameDiff = getNextFrameDiff();

      const result = notifRefs.map((placeholder, i) => {
        const fixed = fixedNotifRefs[i];
        if (!placeholder || !fixed) {
          return {
            isFixed: false,
          };
        }
        const pBox = placeholder.getBoundingClientRect();
        // const diff = document.documentElement.clientHeight - pBox.bottom;
        const diff = window.innerHeight - pBox.bottom + nextFrameDiff;
        const normDiff = Math.min(1, Math.max(0, diff / distanceFromBottom));
        const scale = normDiff * 0.3 + 0.7;
        const translateY = (1 - normDiff) * 0.3 * distanceFromBottom;
        const isFixed = diff < distanceFromBottom;
        if (isFixed) {
          fixed.style.opacity = normDiff + "";
          transformTo(fixed, `scale(${scale}) translateY(${translateY}px)`);
        } else {
          fixed.style.opacity = "1";
          transformReset(fixed);
        }
        return {
          isFixed,
        };
      });
      const notifications = notificationsRef.current;
      const isDifferent = notifications.some(
        ({ isFixed }, i) => isFixed !== result[i].isFixed,
      );
      if (isDifferent) {
        setNotifications(result);
      }
      if (currentScrollTop) {
        scrollState.lastTime = currentTime;
        scrollState.lastScrollTop = currentScrollTop;
      }
    }
    return { onScroll, element: scroll };
  }
  useAnimationScrollListener(scrollHandler);
  const scrollHandlerRef = React.useRef(scrollHandler);
  React.useLayoutEffect(() => {
    const scrollHandler = scrollHandlerRef.current;
    const { onScroll } = scrollHandler();
    onScroll();
  }, [fixedNotifRefs, notifRefs]);

  return (
    <div className={styles.lockScreen}>
      <div className={styles.statusBar} />
      <div className={styles.scrollableContent} ref={scrollRef}>
        <div>
          <div className={styles.infoContent}>
            <div className={styles.itemPadding}>
              <div className={styles.lock} />
            </div>
            <div className={styles.itemPadding}>
              <div className={styles.widgetTop}>widget</div>
            </div>
            <div className={styles.itemPadding}>
              <div className={styles.time}>{time}</div>
            </div>
            <div className={cn(styles.itemPadding, styles.widgetsContainer)}>
              <div className={styles.widgets}>
                <div className={styles.widgetSpan2}>
                  <Link to={routes.root} className={styles.widgetPlaceholder}>
                    &lt; Home
                  </Link>
                </div>
                <div className={styles.widget}>
                  <div className={styles.widgetPlaceholder}>Widget</div>
                </div>
                <div className={styles.widget}>
                  <div className={styles.widgetPlaceholder}>Widget</div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.infoSpacer} />
        </div>
        {notifications.map(({ isFixed }, i) => (
          <Notification
            key={i}
            isFixed={isFixed}
            revIndex={notifications.length - i}
            onNotifRef={onNotifRef(i)}
            onFixedNotifRef={onFixedNotifRef(i)}
          />
        ))}
      </div>
      <button className={cn(styles.leftControl, styles.control)}>T</button>
      <button className={cn(styles.rightControl, styles.control)}>C</button>
      <div className={styles.homeArea} />
    </div>
  );
}

const distanceFromBottom = 150;

function useTime() {
  const [time, setTime] = React.useState(() =>
    new Date().toLocaleTimeString(undefined, { timeStyle: "short" }),
  );
  React.useEffect(() => {
    let timeoutId: number;
    function setNextMinute() {
      const date = new Date();
      setTime(date.toLocaleTimeString(undefined, { timeStyle: "short" }));

      const nextMinute =
        60_000 - date.getSeconds() * 1000 - date.getMilliseconds();
      timeoutId = window.setTimeout(setNextMinute, nextMinute);
    }
    setNextMinute();
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  return time;
}

type NotificationProps = {
  timeSensitive?: boolean;
  revIndex: number;
  onNotifRef: (element: HTMLElement | null) => void;
  onFixedNotifRef: (element: HTMLElement | null) => void;
  isFixed: boolean;
};
function Notification({
  timeSensitive,
  revIndex,
  onNotifRef,
  onFixedNotifRef,
  isFixed,
}: NotificationProps) {
  const { isViewControls, notifRef, cutBoxRef, notifControlsRef } =
    useNotificationDrag();
  const handleNotifRef = useJoinRefs([notifRef, onFixedNotifRef]);
  const notificationContent = [
    timeSensitive && <div className={styles.fadedText}>TIME SENSITIVE</div>,
    <div>Title</div>,
    <div>Message</div>,
  ].filter(Boolean);
  const style = React.useMemo(() => {
    const notifControls = notifControlsRef.current;
    const notifControlsWidth = notifControls?.clientWidth;
    return {
      zIndex: revIndex,
      bottom: isFixed ? distanceFromBottom + "px" : undefined,
      transform:
        isViewControls && notifControlsWidth
          ? `translateX(${-notifControlsWidth - 8}px)`
          : undefined,
    };
  }, [isFixed, isViewControls, notifControlsRef, revIndex]);
  return (
    <div className={cn(styles.notifItemPadding)}>
      <FixedWithPlaceholder
        isFixed={isFixed}
        className={cn(styles.notification, isFixed && styles.noPointer)}
        placeholderRef={onNotifRef}
        fixedRef={handleNotifRef}
        style={style}
      >
        <div className={styles.iconContainer}>
          <div className={styles.icon}>Icon</div>
        </div>
        <div className={styles.notifContent}>
          {notificationContent.map((content, i) =>
            i === 0 ? (
              <div className={styles.notifTop} key="top">
                <div className={styles.flexGrow}>{content}</div>
                <div className={cn(styles.fadedText, styles.smallerFont)}>
                  3m ago
                </div>
              </div>
            ) : (
              <React.Fragment key={i}>{content}</React.Fragment>
            ),
          )}
        </div>
      </FixedWithPlaceholder>
      <div
        ref={cutBoxRef}
        className={cn(
          styles.cutBox,
          isViewControls && styles.viewControls,
          isFixed && styles.fixed,
        )}
        style={{
          zIndex: revIndex,
        }}
      >
        <div
          className={cn(styles.notifOptions, isViewControls && styles.visible)}
          ref={notifControlsRef}
        >
          <div className={cn(styles.notifControl)}>
            <span className={styles.scaleRev}>options</span>
          </div>
          <div className={cn(styles.notifControl)}>
            <span className={styles.scaleRev}>clear</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function useNotificationDrag() {
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const cutBoxRef = React.useRef<HTMLDivElement | null>(null);
  const notifControlsRef = React.useRef<HTMLDivElement | null>(null);
  const [isViewControls, setIsViewControls] = React.useState(false);
  const onReset = React.useCallback(() => {
    const notif = notifRef.current;
    if (!notif) return;
    transitionWrapper(notif, () => {
      setIsViewControls(false);
    });
  }, []);
  const getElement = React.useCallback(() => {
    if (!isViewControls) return null;
    return notifRef.current;
  }, [isViewControls]);
  useResetOnScrollOrTouch({ getElement, onReset });
  const dragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset, getTransformedElements } =
      getTransformsManager("top right");
    const notif = notifRef.current;
    const cutBox = cutBoxRef.current;
    const notifControls = notifControlsRef.current;
    if (!notif || !cutBox || !notifControls) return noopDragHandler;
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
        cutBox.style.transform = "";
        notifControls.style.transform = "";
      },
      onMove: ({ moveX }) => {
        const notifControlsWidth = notifControls.clientWidth;
        if (!isViewControls) {
          moveX += 8;
        }
        const scale = isViewControls
          ? 1 - moveX / notifControlsWidth
          : -moveX / notifControlsWidth;
        cutBox.style.transform = `scaleX(${scale})`;
        cutBox.style.transformOrigin = "top right";
        const revScale = Math.max(1, scale === 0 ? 1 : 1 / scale);
        notifControls.style.transform = `scaleX(${revScale})`;
        notifControls.style.transformOrigin = "top right";
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
              transformTo(scaleRevEl, `scaleX(${revScale})`, {
                transformOrigin: "center",
              });
            }
          }
          // const scaleEls = Array.from(
          //   cutBox.getElementsByClassName(styles.scale),
          // );
          // for (const scaleEl of scaleEls) {
          //   if (scaleEl instanceof HTMLElement) {
          //     transformTo(scaleEl, `scaleX(${scale})`);
          //   }
          // }
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
        notifControls.style.transform = "";
        cutBox.style.transform = "";
        const startTime = Date.now();

        // perform setState here so that we have the before and after
        const isVisible = isViewControls
          ? !(moveX > 0 && !isReturningX)
          : !isReturningX;
        flushSync(() => {
          setIsViewControls(isVisible);
        });

        const currentWidth = cutBox.getBoundingClientRect().width;
        const originalWidth = cutBox.clientWidth;
        console.log("boxes", initialWidth, currentWidth);
        const durationMs = 300;
        manualTransitionTransform(
          () => {
            const y = easeIn(
              Math.min(300, Date.now() - startTime) / durationMs,
            );
            const r = initialWidth / currentWidth;
            const scale = r + y * (1 - r);
            transformTo(cutBox, `scaleX(${scale})`);
            let revScale = scale === 0 ? 1 : 1 / scale;
            if (currentWidth > originalWidth) {
              revScale = Math.max(1, revScale);
            }
            transformTo(notifControls, `scaleX(${revScale})`);
            cutBox.style.opacity =
              clamp(0, (currentWidth * scale - 20) / 20, 1) + "";
          },
          durationMs,
          {
            onEnd: () => {
              transformReset(notifControls);
              transformReset(cutBox);
              cutBox.style.opacity = "";
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
  }, [isViewControls]);
  useDragEvent({ dragHandler, getElement: () => notifRef.current });
  return { isViewControls, notifRef, cutBoxRef, notifControlsRef };
}

type ResetParams = {
  getElement: () => HTMLElement | null;
  onReset: () => void;
};
function useResetOnScrollOrTouch({ getElement, onReset }: ResetParams) {
  React.useEffect(() => {
    const el = getElement();
    if (!el) return;
    const element = el;
    const scrollElement = getScrollParent(element);
    function reset() {
      onReset();
      scrollElement.removeEventListener("touchmove", resetTouch, {
        capture: true,
      });
      scrollElement.removeEventListener("scroll", reset);
    }
    function resetTouch(e: Event) {
      if (e.target instanceof HTMLElement) {
        if (element?.contains(e.target)) return;
        reset();
      }
    }
    scrollElement.addEventListener("scroll", reset, { once: true });
    scrollElement.addEventListener("touchmove", resetTouch, { capture: true });
    return () => {
      scrollElement.removeEventListener("scroll", reset);
      scrollElement.removeEventListener("touchmove", resetTouch, {
        capture: true,
      });
    };
  }, [getElement, onReset]);
}

function cubicBezier(
  p1x: number,
  _p1y: number,
  p2x: number,
  _p2y: number,
  t: number,
) {
  // ease-in
  // cubic-bezier(0.42, 0, 1, 1)
  // https://morethandev.hashnode.dev/demystifying-the-cubic-bezier-function-ft-javascript
  return (
    3 * Math.pow(1 - t, 2) * t * p1x +
    3 * (1 - t) * Math.pow(t, 2) * p2x +
    Math.pow(t, 3)
  );
}
function easeIn(t: number) {
  return cubicBezier(0.42, 0, 1, 1, t);
}
