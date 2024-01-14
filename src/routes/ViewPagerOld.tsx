import styles from "./ViewPagerOld.module.css";
import { LeftButton, Page } from "../components/ViewPagerWithDrawerShared";
import { DragViewPagerOld } from "../components/DragViewPagerOld";
import iosStyles from "../components/IosPadding.module.css";
import { cn } from "../lib/utils";

export function ViewPagerOldRoute() {
  return <DragViewPagerOld pages={pages} header={header} />;
}

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
    component: <Page name="Trams" withoutLoremIpsum withoutDrawer />,
  },
  {
    name: "Cycling",
    component: <Page name="Cycling" withoutDrawer />,
  },
  {
    name: "Buses",
    component: <Page name="Buses" withoutDrawer />,
  },
];
