import styles from "./ViewPagerWithDrawerImperative.module.css";
import {
  DrawerContent,
  LeftButton,
  Page,
} from "../components/ViewPagerWithDrawerShared";
import { DragDrawerImperative } from "../components/DragDrawerImperative";
import { DragViewPagerImperative } from "../components/DragViewPagerImperative";
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
    name: "Trams",
    component: <Page name="Trams" withoutLoremIpsum />,
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
