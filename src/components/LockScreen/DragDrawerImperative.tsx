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
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const dragHandler: DragHandler = React.useCallback(() => {
    const { transformTo, transformReset } = getTransformsManager();
    function onMove({ touchEvent, moveX }: GestureOnMoveParams) {
      const drawer = drawerRef.current;
      const content = contentRef.current;
      if (!drawer || !content) return;

      touchEvent.preventDefault();

      const drawerWidth = drawer.clientWidth;
      if (moveX > drawerWidth) {
        moveX = drawerWidth;
      }
      transformTo(drawer, `translateX(${moveX}px)`);
      const z = (moveX / drawerWidth) * 10;
      transformTo(content, `perspective(500px) translateZ(-${z}px)`);
      const blur = (moveX / drawerWidth) * 16;
      content.style.filter = `blur(${blur}px)`;
      const contentCover = contentCoverRef.current;
      if (contentCover) {
        const contentCoverWidth = contentCover.clientWidth;
        contentCover.style.opacity =
          moveX >= 0
            ? `${moveX / contentCoverWidth}`
            : `${(moveX + contentCoverWidth) / contentCoverWidth}`;
      }
    }
    function onEnd({ isReturningX }: GestureOnEndParams) {
      const drawer = drawerRef.current;
      const content = contentRef.current;
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
      content &&
        transitionWrapper(content, () => {
          content.style.filter = "";
          transformReset(content);
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
  return {
    drawerRef,
    isOpen,
    setIsOpen: setIsOpenWrapped,
    contentCoverRef,
    contentRef,
  };
}
