import { Drawer } from "./Drawer";
import styles from "./DragDrawerImperative.module.css";
import React from "react";
import {
  DragHandler,
  GestureOnEndParams,
  GestureOnMoveParams,
  getLinearGestureManager,
  getTransformsManager,
  transitionWrapper,
  useDragEvent,
} from "../../lib/utils/animations";

type Props = { drawerContent: React.ReactNode; children: React.ReactNode };
export function DragDrawerImperative(props: Props) {
  const drawerProps = useDragDrawer();
  return (
    <Drawer
      {...props}
      contentCoverClassName={styles.contentCover}
      {...drawerProps}
    />
  );
}

function useDragDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const isOpenRef = React.useRef(false);
  isOpenRef.current = isOpen;
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const contentCoverRef = React.useRef<HTMLDivElement | null>(null);
  const dragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset } = getTransformsManager();
    function onMove({ touchEvent, moveX }: GestureOnMoveParams) {
      const drawer = drawerRef.current;
      if (!drawer) return;

      touchEvent.preventDefault();
      moveX = Math.max(-maxDragX, Math.min(moveX, maxDragX));
      transformTo(drawer, `translateX(${moveX}px)`);
      const contentCover = contentCoverRef.current;
      if (contentCover) {
        contentCover.style.opacity =
          moveX >= 0 ? `${moveX / 280}` : `${(moveX + 280) / 280}`;
      }
    }
    function onEnd({ isReturningX }: GestureOnEndParams) {
      const drawer = drawerRef.current;
      const contentCover = contentCoverRef.current;
      drawer &&
        transitionWrapper(drawer, () => {
          drawer && transformReset(drawer);
          if (contentCover) {
            contentCover.style.opacity = "";
          }
          if (!isReturningX) {
            setIsOpen((isOpen) => !isOpen);
          }
        });
    }
    function onReset() {
      const drawer = drawerRef.current;
      drawer && transformReset(drawer);
      const contentCover = contentCoverRef.current;
      if (contentCover) {
        contentCover.style.opacity = "";
      }
    }
    return getLinearGestureManager({
      getConstraints: () => {
        const isOpen = isOpenRef.current;
        return { left: isOpen, right: !isOpen };
      },
      handlers: { onReset, onMove, onEnd },
      withMargin: true,
    });
  }, []);
  useDragEvent({ dragHandler, getElement: () => document.body });

  const setIsOpenWrapped = React.useCallback(
    (isOpen: Parameters<typeof setIsOpen>[0]) => {
      const drawer = drawerRef.current;
      drawer &&
        transitionWrapper(drawer, () => {
          setIsOpen(isOpen);
        });
    },
    [],
  );
  return { drawerRef, isOpen, setIsOpen: setIsOpenWrapped, contentCoverRef };
}
const maxDragX = 280;
