import React from "react";
import styles from "./LockScreen.module.css";
import { cn } from "../lib/utils";

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
              <div className={styles.widget}>Widget</div>
              <div className={styles.widget}>Widget</div>
              <div className={styles.widget}>Widget</div>
              <div className={styles.widget}>Widget</div>
            </div>
          </div>
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
  React.useEffect(() => {
    function touchstart(e: TouchEvent) {
      e.preventDefault();
    }
    function touchmove(e: TouchEvent) {
      e.preventDefault();
    }
    document.body.addEventListener("touchstart", touchstart);
    document.body.addEventListener("touchmove", touchmove);
  }, []);
}
