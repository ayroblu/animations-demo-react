import styles from "./ViewPagerImperative.module.css";
import {
  LeftButton,
  Page,
} from "../components/ViewPager/ViewPagerWithDrawerShared";
import { DragViewPagerImperative } from "../components/ViewPager/DragViewPagerImperative";
import iosStyles from "../components/IosPadding.module.css";
import { cn } from "../lib/utils";

export function ViewPagerImperativeRoute() {
  return <DragViewPagerImperative pages={pages} header={header} />;
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
