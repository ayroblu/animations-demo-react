import React from "react";
import styles from "./LockScreen.module.css";
import { cn } from "../lib/utils";
import { routes } from "../routes";
import {
  DragHandler,
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
        isFixed: true,
      })),
  );
  const notificationsRef = React.useRef(notifications);
  notificationsRef.current = notifications;
  const transformManagerRef = React.useRef(getTransformsManager());
  function scrollHandler() {
    const { transformTo } = transformManagerRef.current;
    const result = notifRefs.map((placeholder, i) => {
      const fixed = fixedNotifRefs[i];
      if (!placeholder || !fixed) {
        return {
          isFixed: false,
        };
      }
      const pBox = placeholder.getBoundingClientRect();
      // const diff = document.documentElement.clientHeight - pBox.bottom;
      const diff = window.innerHeight - pBox.bottom;
      const normDiff = Math.min(1, Math.max(0, diff / distanceFromBottom));
      fixed.style.opacity = normDiff + "";
      const scale = normDiff * 0.2 + 0.8;
      const translateY = (1 - normDiff) * 0.2 * distanceFromBottom;
      transformTo(fixed, `scale(${scale}) translateY(${translateY}px)`);
      return {
        isFixed: diff < distanceFromBottom,
      };
    });
    const notifications = notificationsRef.current;
    const isDifferent = notifications.some(
      ({ isFixed }, i) => isFixed !== result[i].isFixed,
    );
    if (isDifferent) {
      setNotifications(result);
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
          <div className={cn(styles.notifItemPadding)} key={i}>
            <Notification
              isFixed={isFixed}
              revIndex={notifications.length - i}
              onNotifRef={onNotifRef(i)}
              onFixedNotifRef={onFixedNotifRef(i)}
            />
          </div>
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
  const { notifRef } = useNotificationDrag();
  const handleNotifRef = useJoinRefs([notifRef, onNotifRef]);
  const notificationContent = [
    timeSensitive && <div className={styles.fadedText}>TIME SENSITIVE</div>,
    <div>Title</div>,
    <div>Message</div>,
  ].filter(Boolean);
  const style = React.useMemo(() => {
    return {
      zIndex: revIndex,
      bottom: isFixed ? distanceFromBottom + "px" : undefined,
    };
  }, [isFixed, revIndex]);
  return (
    <FixedWithPlaceholder
      isFixed={isFixed}
      className={cn(styles.notification, isFixed && styles.noPointer)}
      placeholderRef={handleNotifRef}
      fixedRef={onFixedNotifRef}
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
  );
}
function useNotificationDrag() {
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const dragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset } = getTransformsManager();
    function onReset() {}
    function onMove({ touchEvent, moveX }: GestureOnMoveParams) {
      const notif = notifRef.current;
      if (!notif) return;
      touchEvent.preventDefault();
      touchEvent.stopPropagation();
      transformTo(notif, `translateX(${moveX}px)`);
    }
    function onEnd() {
      const notif = notifRef.current;
      if (!notif) return;
      transitionWrapper(notif, () => {
        transformReset(notif);
      });
    }
    return getLinearGestureManager({
      getConstraints: () => {
        return { left: true };
      },
      handlers: { onReset, onMove, onEnd },
    });
  }, []);
  useDragEvent({ dragHandler, getElement: () => notifRef.current });
  return { notifRef };
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
    function onScroll() {
      cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(() => {
        const callback = callbackRef.current;
        callback(element);
      });
    }
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
    };
  }, [scrollRef]);
}
// position fixed with placeholder component
