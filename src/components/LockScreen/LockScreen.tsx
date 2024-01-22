import React from "react";
import styles from "./LockScreen.module.css";
import { clamp, cn } from "../../lib/utils";
import { routes } from "../../routes";
import {
  DragHandler,
  GestureHandler,
  GestureOnEndParams,
  composeGestureHandlers,
  getLinearGestureManager,
  getResetable,
  getTransformsManager,
  noopDragHandler,
  transitionWrapper,
  useAnimationScrollListener,
  useDragEvent,
} from "../../lib/utils/animations";
import { Link } from "react-router-dom";
import {
  useArrayRef,
  useJoinRefs,
  useResetOnScrollOrTouch,
} from "../../lib/utils/hooks";
import { FixedWithPlaceholder } from "../FixedWithPlaceholder";
import { getCachedValueManager } from "../../lib/utils/cache";

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
  const {
    isViewControls,
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    placeholderRef,
  } = useNotificationDrag();
  const handlePlaceholderRef = useJoinRefs([placeholderRef, onNotifRef]);
  const handleNotifRef = useJoinRefs([notifRef, onFixedNotifRef]);
  const notificationContent = [
    timeSensitive && <div className={styles.fadedText}>TIME SENSITIVE</div>,
    <div>Title</div>,
    <div className={styles.message}>Message</div>,
  ].filter(Boolean);
  const style = React.useMemo(() => {
    return {
      zIndex: revIndex,
    };
  }, [revIndex]);
  return (
    <div className={cn(styles.notifItemPadding)}>
      <FixedWithPlaceholder
        isFixed={isFixed}
        className={cn(styles.notification, isFixed && styles.fixed)}
        placeholderRef={handlePlaceholderRef}
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
          ref={notifOptionsRef}
        >
          <div className={cn(styles.notifControl, styles.scaleWidth)}>
            <span>options</span>
          </div>
          <div className={cn(styles.notifControl, styles.scaleWidth)}>
            <span>clear</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function useNotificationDrag() {
  const placeholderRef = React.useRef<HTMLDivElement | null>(null);
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const cutBoxRef = React.useRef<HTMLDivElement | null>(null);
  const notifOptionsRef = React.useRef<HTMLDivElement | null>(null);
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
    return placeholderRef.current;
  }, [isViewControls]);
  useResetOnScrollOrTouch({ getElement, onReset });
  const dragHandler: DragHandler = React.useCallback(() => {
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
        notifOptionsResetable.reset();
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
        notifOptionsResetable.reset();

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
    return getLinearGestureManager({
      getConstraints: () => {
        return { left: true, right: isViewControls };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, [isViewControls]);
  useDragEvent({ dragHandler, getElement: () => notifRef.current });
  return {
    isViewControls,
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    placeholderRef,
  };
}
