import styles from "./ViewPagerWithDrawerImperative.module.css";
import {
  DrawerContent,
  LeftButton,
  Page,
} from "../components/ViewPager/ViewPagerWithDrawerShared";
import { DragDrawerImperative } from "../components/ViewPager/DragDrawerImperative";
import { DragViewPagerImperative } from "../components/ViewPager/DragViewPagerImperative";
import iosStyles from "../components/IosPadding.module.css";
import { cn } from "../lib/utils";

export function ViewPagerWithDrawerImperativeRoute() {
  return (
    <DragDrawerImperative drawerContent={drawerContent}>
      <DragViewPagerImperative pages={pages} header={header} />
    </DragDrawerImperative>
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
    name: "Main",
    component: <Page name="Main" withoutLoremIpsum />,
  },
  {
    name: "Tab 2",
    component: <Page name="Tab 2" />,
  },
  {
    name: "Tab 3",
    component: <Page name="Tab 3" />,
  },
];
