import React from "react";
import styles from "./LockScreen.module.css";
import { cn } from "../lib/utils";
import { routes } from "../routes";
import {
  DragHandler,
  GestureOnMoveParams,
  getLinearGestureManager,
  useDragEvent,
} from "../lib/utils/animations";

type Props = {
  notifications: string[];
};
export function LockScreen({ notifications }: Props) {
  const time = useTime();
  usePreventDefaultTouch();
  return (
    <div className={styles.lockScreen}>
      <div className={styles.statusBar} />
      <div className={styles.scrollableContent}>
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
                <a href={routes.root} className={styles.widgetPlaceholder}>
                  &lt; Home
                </a>
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
        <div className={styles.notifItemPadding}>
          <Notification />
        </div>
        <div className={styles.notifItemPadding}>
          <Notification />
        </div>
        {isVisible ? notifications.map((n) => <div key={n}>{n}</div>) : null}
      </div>
      <div className={styles.bottomControls}>
        <button className={styles.control}>T</button>
        <button className={styles.control}>C</button>
      </div>
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
function usePreventDefaultTouch() {
  const dragHandler: DragHandler = React.useCallback(() => {
    // const { transformTo, transformReset } = getTransformsManager();
    function onMove({ touchEvent }: GestureOnMoveParams) {
      touchEvent.preventDefault();
    }
    function onEnd() {}
    return getLinearGestureManager({
      getConstraints: () => {
        return { left: true, right: true, up: true, down: true };
      },
      handlers: { onMove, onEnd },
      withMargin: true,
    });
  }, []);
  useDragEvent({ dragHandler, getElement: () => document.body });
}

type NotificationProps = {
  timeSensitive?: boolean;
};
function Notification({ timeSensitive }: NotificationProps) {
  const notificationContent = [
    timeSensitive && <div className={styles.fadedText}>TIME SENSITIVE</div>,
    <div>Title</div>,
    <div>Message</div>,
  ].filter(Boolean);
  return (
    <div className={styles.notification}>
      <div className={styles.iconContainer}>
        <div className={styles.icon}>Icon</div>
      </div>
      <div className={styles.notifContent}>
        {notificationContent.map((content, i) =>
          i === 0 ? (
            <div className={styles.notifTop}>
              <div className={styles.flexGrow}>{content}</div>
              <div className={cn(styles.fadedText, styles.smallerFont)}>
                3m ago
              </div>
            </div>
          ) : (
            content
          ),
        )}
      </div>
    </div>
  );
}
