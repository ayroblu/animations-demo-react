import React from "react";
import styles from "./LockScreen.module.css";
import { cn } from "../../lib/utils";
import { routes } from "../../routes";
import {
  DragHandler,
  getTransformsManager,
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
import { useScaleDragHandler } from "./useScaleDragHandler";
import { useWidthDragHandler } from "./useWidthDragHandler";
import { useSlideDragHandler } from "./useSlideDragHandler";
import { globalResizeObserver } from "../../lib/global-resize-observer";

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

const distanceFromBottom = 120;

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
  const notifOptionsWidth = useElementWidth(notifOptionsRef);
  const style = React.useMemo(() => {
    return {
      zIndex: revIndex,
      transform:
        (dragType === "scale" || dragType === "slide") &&
        isViewControls &&
        notifOptionsWidth
          ? `translateX(${-notifOptionsWidth - 8}px)`
          : undefined,
    };
  }, [isViewControls, notifOptionsWidth, revIndex]);

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
          dragType === "width"
            ? styles.dragWidth
            : dragType === "scale"
              ? styles.dragScale
              : styles.dragSlide,
        )}
        style={{
          zIndex: revIndex,
        }}
      >
        <div
          className={cn(styles.notifOptions, isViewControls && styles.visible)}
          ref={notifOptionsRef}
        >
          <div
            className={cn(
              styles.notifControl,
              dragType === "width" && styles.scaleWidth,
            )}
          >
            <span className={cn(dragType === "scale" && styles.scaleRev)}>
              options
            </span>
          </div>
          <div
            className={cn(
              styles.notifControl,
              dragType === "width" && styles.scaleWidth,
            )}
          >
            <span className={cn(dragType === "scale" && styles.scaleRev)}>
              clear
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function useElementWidth(
  ref: React.RefObject<HTMLElement | null>,
): number | null {
  const [width, setWidth] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const dispose = globalResizeObserver.observe(el, () => {
      setWidth(el.clientWidth);
    });
    return () => {
      dispose();
    };
  }, [ref]);
  return width;
}

const dragType: "width" | "scale" | "slide" = "scale";
function useNotificationDrag() {
  const placeholderRef = React.useRef<HTMLDivElement | null>(null);
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const cutBoxRef = React.useRef<HTMLDivElement | null>(null);
  const notifOptionsRef = React.useRef<HTMLDivElement | null>(null);
  const resetRef = React.useRef<(() => void)[]>([]);
  const [isViewControls, setIsViewControls] = React.useState(false);
  const onReset = React.useCallback(() => {
    const notif = notifRef.current;
    if (!notif) return;
    transitionWrapper(notif, () => {
      setIsViewControls(false);
      resetRef.current.forEach((reset) => {
        reset();
      });
    });
  }, []);
  const getElement = React.useCallback(() => {
    if (!isViewControls) return null;
    return placeholderRef.current?.parentElement ?? null;
  }, [isViewControls]);
  useResetOnScrollOrTouch({ getElement, onReset });

  const widthDragHandler: DragHandler = useWidthDragHandler({
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    isViewControls,
    setIsViewControls,
  });

  const scaleDragHandler: DragHandler = useScaleDragHandler({
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    isViewControls,
    setIsViewControls,
  });

  const slideDragHandler: DragHandler = useSlideDragHandler({
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    isViewControls,
    setIsViewControls,
  });

  const getDragElement = React.useCallback(
    () => placeholderRef.current?.parentElement ?? null,
    [],
  );
  useDragEvent({
    dragHandler:
      dragType === "width"
        ? widthDragHandler
        : dragType === "scale"
          ? scaleDragHandler
          : slideDragHandler,
    getElement: getDragElement,
  });
  return {
    isViewControls,
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    placeholderRef,
  };
}
