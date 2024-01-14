import { Drawer } from "../components/Drawer";
import { ViewPager } from "../components/ViewPager";
import styles from "./ViewPagerWithDrawer.module.css";
import { useNestedViewTransitions } from "../lib/view-transitions";
import {
  DrawerContent,
  LeftButton,
  Page,
} from "../components/ViewPagerWithDrawerShared";
import iosStyles from "../components/IosPadding.module.css";
import { cn } from "../lib/utils";

export function ViewPagerWithDrawerRoute() {
  const { wrapInViewTransition } = useNestedViewTransitions();
  return (
    <Drawer
      drawerContent={drawerContent}
      drawerContentClassName={styles.drawerContent}
      contentClassName={styles.content}
      setDrawerWrapper={wrapInViewTransition}
    >
      <ViewPager
        pages={pages}
        header={header}
        rightContentClassName={styles.tabRight}
        contentClassName={styles.viewPagerContent}
        wrapSetSelected={wrapInViewTransition}
      />
    </Drawer>
  );
}
const drawerContent = <DrawerContent />;
const header = (
  <div className={cn(iosStyles.topPadding, iosStyles.horizontalPadding)}>
    <header className={styles.header}>
      <div>
        <LeftButton />
      </div>
      <h1 className={styles.heading}>Demo App</h1>
      <div />
    </header>
  </div>
);

const pages = [
  {
    name: "Trams",
    component: <Page name="Trams" />,
  },
  {
    name: "Cycling",
    component: <Page name="Cycling" />,
  },
  {
    name: "Buses",
    component: <Page name="Buses" />,
  },
];
