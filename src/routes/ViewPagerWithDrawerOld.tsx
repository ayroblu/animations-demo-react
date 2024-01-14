import styles from "./ViewPagerWithDrawerOld.module.css";
import {
  DrawerContent,
  LeftButton,
  Page,
} from "../components/ViewPagerWithDrawerShared";
import { DragDrawerOld } from "../components/DragDrawerOld";
import { DragViewPagerOld } from "../components/DragViewPagerOld";

export function ViewPagerWithDrawerOldRoute() {
  return (
    <DragDrawerOld drawerContent={drawerContent}>
      <DragViewPagerOld pages={pages} header={header} />
    </DragDrawerOld>
  );
}

const drawerContent = <DrawerContent />;
const header = (
  <header className={styles.header}>
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
