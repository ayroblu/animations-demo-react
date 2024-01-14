import styles from "./ViewPagerOld.module.css";
import { LeftButton, Page } from "../components/ViewPagerWithDrawerShared";
import { DragViewPagerOld } from "../components/DragViewPagerOld";
import iosStyles from "../components/IosPadding.module.css";
import { cn } from "../lib/utils";

export function ViewPagerOldRoute() {
  return <DragViewPagerOld pages={pages} header={header} />;
}

const header = (
  <header
    className={cn(
      styles.header,
      iosStyles.topPadding,
      iosStyles.horizontalPadding,
    )}
  >
    <div>
      <LeftButton />
    </div>
    <h1 className={styles.heading}>Demo App</h1>
    <div />
  </header>
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
