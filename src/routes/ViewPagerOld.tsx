import styles from "./ViewPagerOld.module.css";
import { LeftButton, Page } from "../components/ViewPagerWithDrawerShared";
import { DragViewPagerOld } from "../components/DragViewPagerOld";

export function ViewPagerOldRoute() {
  return <DragViewPagerOld pages={pages} header={header} />;
}

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
