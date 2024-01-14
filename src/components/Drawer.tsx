import React from "react";
import styles from "./Drawer.module.css";
import { useDimensions } from "../lib/utils/hooks";
import { cn } from "../lib/utils";

type Props = {
  children: React.ReactNode;
  drawerContent: React.ReactNode;
  setDrawerWrapper?: (func: () => void) => void;
  contentClassName?: string;
  drawerContentClassName?: string;
  drawerRef?: React.MutableRefObject<HTMLDivElement | null>;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  contentCoverClassName?: string;
  contentCoverRef?: React.MutableRefObject<HTMLDivElement | null>;
};
export function Drawer({ children, drawerContent, ...rest }: Props) {
  const { width } = useDimensions();
  if (width > 700) {
    return (
      <div className={styles.sidenavDrawer}>
        <div className={cn(styles.drawerContent, styles.sidenav)}>
          <div className={styles.drawerContentWrapper}>{drawerContent}</div>
        </div>
        <div className={cn(styles.sidenavContent, styles.content)}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <SideDrawer children={children} drawerContent={drawerContent} {...rest} />
  );
}
type DrawerContext = { openDrawer: () => void; closeDrawer: () => void };
export const DrawerContext = React.createContext<DrawerContext | null>(null);

function SideDrawer({
  children,
  drawerContent,
  setDrawerWrapper,
  contentClassName,
  drawerContentClassName,
  drawerRef,
  isOpen,
  setIsOpen,
  contentCoverClassName,
  contentCoverRef,
}: Props) {
  const isVisibleState = React.useState(false);
  const [isVisible2, setIsVisible] = isVisibleState;
  const isVisible = isOpen ?? isVisible2;
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const drawerContextValue = useDrawerValue(
    setIsOpen ?? setIsVisible,
    setDrawerWrapper,
  );
  return (
    <DrawerContext.Provider value={drawerContextValue}>
      <div className={styles.groupContainer}>
        <div
          className={cn(styles.drawer, isVisible && styles.visible)}
          ref={drawerRef}
        >
          <div
            className={cn(
              styles.drawerContent,
              styles.mobileDrawer,
              drawerContentClassName,
            )}
          >
            <div className={styles.sticky}>{drawerContent}</div>
            <div className={styles.fill} />
          </div>
          <div
            className={cn(styles.content, contentClassName)}
            ref={contentRef}
          >
            {children}
            <div
              className={cn(
                styles.contentCover,
                contentCoverClassName,
                isVisible && styles.visible,
              )}
              ref={contentCoverRef}
              onClick={drawerContextValue.closeDrawer}
            />
          </div>
        </div>
      </div>
    </DrawerContext.Provider>
  );
}
function identity(fn: () => void) {
  return fn();
}
function useDrawerValue(
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setDrawerWrapper: (func: () => void) => void = identity,
): DrawerContext {
  const openDrawer = React.useCallback(() => {
    setDrawerWrapper(() => {
      setIsVisible(true);
    });
  }, [setDrawerWrapper, setIsVisible]);
  const closeDrawer = React.useCallback(() => {
    setDrawerWrapper(() => {
      setIsVisible(false);
    });
  }, [setDrawerWrapper, setIsVisible]);
  return { openDrawer, closeDrawer };
}
