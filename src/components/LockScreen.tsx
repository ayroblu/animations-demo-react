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

type Props = {
  notifications: string[];
};
export function LockScreen({ notifications }: Props) {
  const time = useTime();
  // usePreventDefaultTouch();
  // infoContent is sticky until notifications catch up
  return (
    <div className={styles.lockScreen}>
      <div className={styles.statusBar} />
      <div className={styles.scrollableContent}>
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
        {Array(20)
          .fill(null)
          .map((_, i) => (
            <div className={styles.notifItemPadding} key={i}>
              <Notification revIndex={20 - i} />
            </div>
          ))}
        {isVisible ? notifications.map((n) => <div key={n}>{n}</div>) : null}
      </div>
      <button className={cn(styles.leftControl, styles.control)}>T</button>
      <button className={cn(styles.rightControl, styles.control)}>C</button>
      <div className={styles.homeArea} />
    </div>
  );
}
const isVisible = false;

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
};
function Notification({ timeSensitive, revIndex }: NotificationProps) {
  const { notifRef } = useNotificationDrag();
  const notificationContent = [
    timeSensitive && <div className={styles.fadedText}>TIME SENSITIVE</div>,
    <div>Title</div>,
    <div>Message</div>,
  ].filter(Boolean);
  return (
    <div
      className={styles.notification}
      ref={notifRef}
      style={{ zIndex: revIndex }}
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
    </div>
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
