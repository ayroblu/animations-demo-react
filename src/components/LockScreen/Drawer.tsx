import React from "react";
import styles from "./Drawer.module.css";
import { useDimensions } from "../../lib/utils/hooks";
import { cn } from "../../lib/utils";
import iosStyles from "../IosPadding.module.css";

type Props = {
  children: React.ReactNode;
  drawerContent: React.ReactNode;
  setDrawerWrapper?: (func: () => void) => void;
  contentClassName?: string;
  drawerContentClassName?: string;
  contentRef?: React.MutableRefObject<HTMLDivElement | null>;
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
        <div
          className={cn(
            iosStyles.topPadding,
            iosStyles.leftPadding,
            styles.drawerContent,
            styles.sidenav,
          )}
        >
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
  contentRef,
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
  const drawerContextValue = useDrawerValue(
    setIsOpen ?? setIsVisible,
    setDrawerWrapper,
  );
  return (
    <DrawerContext.Provider value={drawerContextValue}>
      <div className={styles.groupContainer}>
        <div
          className={cn(
            styles.drawer,
            isVisible && styles.visible,
            iosStyles.topPadding,
            iosStyles.leftPadding,
            styles.drawerContent,
            styles.mobileDrawer,
            drawerContentClassName,
          )}
          ref={drawerRef}
        >
          {drawerContent}
        </div>
        <div
          className={cn(
            styles.content,
            isVisible && styles.visible,
            contentClassName,
          )}
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
