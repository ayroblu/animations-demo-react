import React from "react";
import styles from "./LockScreen.module.css";
import { cn } from "../../lib/utils";
import { routes } from "../../routes";
import {
  getTransformsManager,
  useAnimationScrollListener,
} from "../../lib/utils/animations";
import { Link } from "react-router-dom";
import { useArrayRef } from "../../lib/utils/hooks";
import { DragDrawerImperative } from "./DragDrawerImperative";
import { Notification } from "./Notification";
import { NotificationContext } from "./useNotification";

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
      .map((_, i) => ({
        id: `notificaiton-${i}`,
        isFixed: false,
      })),
  );
  useScrollRotation({
    scrollRef,
    notifRefs,
    fixedNotifRefs,
    notifications,
    setNotifications,
  });
  const notificationsRef = React.useRef(notifications);
  notificationsRef.current = notifications;
  const removeNotification = React.useCallback(
    (notifId: string) => {
      const notifications = notificationsRef.current;
      const index = notifications.findIndex(({ id }) => id === notifId);
      if (index !== -1) {
        notifRefs.splice(index, 1);
        fixedNotifRefs.splice(index, 1);
      }
      setNotifications((notifications) =>
        notifications.filter(({ id }) => id !== notifId),
      );
    },
    [fixedNotifRefs, notifRefs],
  );

  return (
    <DragDrawerImperative drawerContent={drawerContent}>
      <div className={styles.lockScreen}>
        <div className={styles.backgroundImage} />
        <div className={styles.statusBar} />
        <div
          className={styles.scrollableContent}
          ref={scrollRef}
          key="scrollable"
        >
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
          {notifications.map(({ id, isFixed }, i) => (
            <NotificationContext.Provider value={{ id, isFixed }} key={id}>
              <Notification
                key={id}
                isFixed={isFixed}
                revIndex={notifications.length - i}
                onNotifRef={onNotifRef(i)}
                onFixedNotifRef={onFixedNotifRef(i)}
                removeNotification={removeNotification}
              />
            </NotificationContext.Provider>
          ))}
        </div>
        <button className={cn(styles.leftControl, styles.control)}>T</button>
        <button className={cn(styles.rightControl, styles.control)}>C</button>
        <div className={styles.homeArea} />
      </div>
    </DragDrawerImperative>
  );
}

export type NotificationData = { id: string; isFixed: boolean };
type ScrollRotationParams = {
  scrollRef: React.RefObject<HTMLElement | null>;
  notifications: NotificationData[];
  notifRefs: (HTMLElement | null)[];
  fixedNotifRefs: (HTMLElement | null)[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationData[]>>;
};
function useScrollRotation({
  scrollRef,
  notifRefs,
  fixedNotifRefs,
  notifications,
  setNotifications,
}: ScrollRotationParams) {
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

      const notifications = notificationsRef.current;
      const result = notifRefs.map((placeholder, i) => {
        const fixed = fixedNotifRefs[i];
        if (!placeholder || !fixed) {
          console.log("failure", i);
          return {
            ...notifications[i],
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
          ...notifications[i],
          isFixed,
        };
      });
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
}

const safeAreaInsetBottom = getComputedStyle(
  document.documentElement,
).getPropertyValue("--safe-area-inset-bottom");
const distanceFromBottom = 120 + parseFloat(safeAreaInsetBottom);

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

const drawerContent = <WidgetDrawerContent />;
function WidgetDrawerContent() {
  return (
    <div className={styles.drawerContainer}>
      <div className={styles.drawerContent}>
        {Array(10)
          .fill(null)
          .map((_, i) => (
            <div key={i} className={styles.drawerWidget} />
          ))}
      </div>
    </div>
  );
}
