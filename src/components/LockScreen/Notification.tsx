import React from "react";
import styles from "./Notification.module.css";
import { cn } from "../../lib/utils";
import {
  DragHandler,
  transitionWrapper,
  useDragEvent,
} from "../../lib/utils/animations";
import { useJoinRefs, useResetOnScrollOrTouch } from "../../lib/utils/hooks";
import { FixedWithPlaceholder } from "../FixedWithPlaceholder";
import { useScaleDragHandler } from "./useScaleDragHandler";
import { useWidthDragHandler } from "./useWidthDragHandler";
import { useSlideDragHandler } from "./useSlideDragHandler";
import { globalResizeObserver } from "../../lib/global-resize-observer";

type NotificationProps = {
  timeSensitive?: boolean;
  revIndex: number;
  onNotifRef: (element: HTMLElement | null) => void;
  onFixedNotifRef: (element: HTMLElement | null) => void;
  isFixed: boolean;
  removeNotification: (id: string) => void;
};
export function Notification({
  timeSensitive,
  revIndex,
  onNotifRef,
  onFixedNotifRef,
  isFixed,
  removeNotification,
}: NotificationProps) {
  const {
    isViewControls,
    notifRef,
    cutBoxRef,
    notifOptionsRef,
    placeholderRef,
    isExiting,
    containerRef,
  } = useNotificationDrag(removeNotification);
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
    <div
      className={cn(
        styles.notifItemPadding,
        isFixed && styles.fixed,
        isExiting && styles.exiting,
      )}
      ref={containerRef}
    >
      <FixedWithPlaceholder
        isFixed={isFixed}
        className={cn(
          styles.notification,
          isFixed && styles.fixed,
          dragType === "scale" && styles.dragScale,
        )}
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
function useNotificationDrag(removeNotification: (id: string) => void) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const placeholderRef = React.useRef<HTMLDivElement | null>(null);
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const cutBoxRef = React.useRef<HTMLDivElement | null>(null);
  const notifOptionsRef = React.useRef<HTMLDivElement | null>(null);
  const resetRef = React.useRef<(() => void)[]>([]);
  const [isViewControls, setIsViewControls] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
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
    removeNotification,
    setIsExiting,
    containerRef,
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
    isExiting,
    containerRef,
  };
}
