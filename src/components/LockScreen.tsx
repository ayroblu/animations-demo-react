import React from "react";
import styles from "./LockScreen.module.css";
import { clamp, cn } from "../lib/utils";
import { routes } from "../routes";
import {
  DragHandler,
  GestureOnEndParams,
  GestureOnMoveParams,
  getLinearGestureManager,
  getTransformsManager,
  transitionWrapper,
  useDragEvent,
} from "../lib/utils/animations";
import { Link } from "react-router-dom";
import { useArrayRef, useJoinRefs } from "../lib/utils/hooks";
import { FixedWithPlaceholder } from "./FixedWithPlaceholder";

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
  const transformManagerRef = React.useRef(getTransformsManager());
  const scrollStateRef = React.useRef({
    lastScrollTop: 0,
    lastTime: Date.now(),
  });
  function scrollHandler() {
    const { transformTo, transformReset } = transformManagerRef.current;
    const scrollState = scrollStateRef.current;
    const scroll = scrollRef.current;
    const currentScrollTop = scroll?.scrollTop;
    const currentTime = Date.now();
    function getNextFrameDiff() {
      if (typeof currentScrollTop !== "number") return 0;
      const timeDiff = currentTime - scrollState.lastTime;
      if (timeDiff === 0) return 0;
      return ((currentScrollTop - scrollState.lastScrollTop) / timeDiff) * 20;
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
  useScrollListener(scrollRef, scrollHandler);
  React.useLayoutEffect(scrollHandler, [fixedNotifRefs, notifRefs]);
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
  // const notifControls = notifControlsRef.current;
  // const notifControlsWidth = notifControls?.clientWidth;
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
        className={styles.cutBox}
        style={{
          display: isFixed ? "none" : undefined,
          opacity: isViewControls ? 1 : 0,
          zIndex: revIndex,
          transform: isViewControls
            ? `translateX(calc(-100% - 8px))`
            : undefined,
        }}
      >
        <div
          className={styles.notifOptions}
          ref={notifControlsRef}
          style={{
            transform: isViewControls ? `translateX(0)` : undefined,
          }}
        >
          <div className={styles.notifControl}>
            <span>options</span>
          </div>
          <div className={styles.notifControl}>
            <span>clear</span>
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
  React.useEffect(() => {
    if (!isViewControls) return;
    const notifCur = notifRef.current;
    if (!notifCur) return;
    const notif = notifCur;
    const scrollElement = getScrollParent(notif);
    function reset() {
      transitionWrapper(notif, () => {
        setIsViewControls(false);
      });
      scrollElement.removeEventListener("touchmove", resetTouch, {
        capture: true,
      });
      scrollElement.removeEventListener("scroll", reset);
    }
    function resetTouch(e: Event) {
      if (e.target instanceof HTMLElement) {
        if (notif?.contains(e.target)) return;
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
  }, [isViewControls]);
  const dragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset } = getTransformsManager();
    function onReset() {
      const notif = notifRef.current;
      notif && transformReset(notif);
    }
    function onMove({ touchEvent, moveX }: GestureOnMoveParams) {
      const notif = notifRef.current;
      if (!notif) return;
      touchEvent.preventDefault();
      touchEvent.stopPropagation();
      transformTo(notif, `translateX(${moveX}px)`);
      const cutBox = cutBoxRef.current;
      if (!cutBox) return;
      if (isViewControls) {
        const notifControls = notifControlsRef.current;
        const notifControlsWidth = notifControls?.clientWidth;
        if (notifControlsWidth) {
          moveX = Math.max(0, moveX);
          transformTo(cutBox, `translateX(${moveX}px)`);
          transformTo(notifControls, `translateX(${-moveX}px)`);
          cutBox.style.opacity =
            clamp(0, (notifControlsWidth - moveX - 50) / 50, 1) + "";
        }
      } else {
        const notifControls = notifControlsRef.current;
        const notifControlsWidth = notifControls?.clientWidth;
        if (notifControlsWidth) {
          moveX = Math.max(-notifControlsWidth - 8, moveX);
        }
        transformTo(cutBox, `translateX(${moveX}px)`);
        notifControls && transformTo(notifControls, `translateX(${-moveX}px)`);
        cutBox.style.opacity = clamp(0, (-moveX - 50) / 50, 1) + "";
      }
    }
    function onEnd({ isReturningX, moveX }: GestureOnEndParams) {
      const cutBox = cutBoxRef.current;
      const notifControls = notifControlsRef.current;

      const notif = notifRef.current;
      notif &&
        transitionWrapper(notif, () => {
          transformReset(notif);
        });
      cutBox &&
        transitionWrapper(cutBox, () => {
          transformReset(cutBox);
        });
      notifControls &&
        transitionWrapper(notifControls, () => {
          transformReset(notifControls);
        });
      if (isViewControls) {
        setIsViewControls(!(moveX > 0 && !isReturningX));
      } else {
        setIsViewControls(!isReturningX);
      }
    }
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

function useScrollListener(
  scrollRef: React.MutableRefObject<HTMLElement | null>,
  callback: (element: HTMLElement) => void,
) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const element = el;
    let timeoutId = 0;
    let isScrolling = false;
    function onScroll() {
      isScrolling = true;
      cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(() => {
        const callback = callbackRef.current;
        callback(element);
        if (isScrolling) {
          onScroll();
        }
      });
    }
    function onScrollEnd() {
      isScrolling = false;
    }
    element.addEventListener("scrollend", onScrollEnd, { passive: true });
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("scrollend", onScrollEnd);
    };
  }, [scrollRef]);
}
// position fixed with placeholder component

function getScrollParent(element: HTMLElement, includeHidden?: boolean) {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === "absolute";
  const overflowRegex = includeHidden
    ? /(auto|scroll|hidden)/
    : /(auto|scroll)/;

  if (style.position === "fixed") return document.documentElement;
  let parent = element.parentElement;
  while (parent) {
    style = getComputedStyle(parent);
    if (!(excludeStaticParent && style.position === "static")) {
      if (
        overflowRegex.test(style.overflow + style.overflowY + style.overflowX)
      )
        return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
}
