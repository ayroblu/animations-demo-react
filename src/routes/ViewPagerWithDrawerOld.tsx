import styles from "./ViewPagerWithDrawerOld.module.css";
import {
  DrawerContent,
  LeftButton,
  Page,
} from "../components/ViewPagerWithDrawerShared";
import { DragDrawerOld } from "../components/DragDrawerOld";
import { DragViewPagerOld } from "../components/DragViewPagerOld";
import iosStyles from "../components/IosPadding.module.css";
import { cn } from "../lib/utils";

export function ViewPagerWithDrawerOldRoute() {
  return (
    <DragDrawerOld drawerContent={drawerContent}>
      <DragViewPagerOld pages={pages} header={header} />
    </DragDrawerOld>
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
