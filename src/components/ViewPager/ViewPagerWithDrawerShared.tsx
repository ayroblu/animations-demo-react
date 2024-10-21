import React from "react";
import { Link } from "react-router-dom";
import { DrawerContext } from "./Drawer";
import styles from "./ViewPagerWithDrawerShared.module.css";

export function LeftButton() {
  const drawerContext = React.useContext(DrawerContext);
  if (!drawerContext) {
    return <div />;
  }
  const { openDrawer } = drawerContext;
  return <button className={styles.startControl} onClick={openDrawer}></button>;
}

export function DrawerContent() {
  return (
    <>
      <div className={styles.drawerHeading}>Demo App Nav</div>
      <ul className={styles.drawerLinks}>
        <li>
          <Link to="/" className={styles.drawerLink}>&lt; Home</Link>
        </li>
        <li>
          <button className={styles.drawerLink}>Nav item 2</button>
        </li>
        <li>
          <button className={styles.drawerLink}>Nav item 3</button>
        </li>
      </ul>
    </>
  );
}

export function Page({
  name,
  withoutLoremIpsum,
  withoutDrawer,
}: {
  name: string;
  withoutLoremIpsum?: boolean;
  withoutDrawer?: boolean;
}) {
  return (
    <div className={styles.page}>
      {withoutDrawer ? (
        <>
          <h1>ViewPager ({name})</h1>

          <Link to="/">&lt; Home</Link>

          <p>
            Fairly standard ViewPager, note the tabs indicator moves as you
            swipe, and the contents of the page also moves. Same goes for
            tapping the tabs
          </p>
        </>
      ) : (
        <>
          <h1>ViewPager with Drawer ({name})</h1>

          <p>
            Fairly standard ViewPager, note the tabs indicator moves as you
            swipe, and the contents of the page also moves. Same goes for
            tapping the tabs.
          </p>

          <p>
            There's not much to see on desktop, this is more for mobile phones with touch screens.
          </p>

          <p>
            There is a drawer on the left that you can bring up by swiping to the right when you're on the first page, or by swiping from the left edge when you're on a later tab.
          </p>
        </>
      )}

      {!withoutLoremIpsum && (
        <>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Odio
            facilisis mauris sit amet massa vitae tortor. Ipsum faucibus vitae
            aliquet nec ullamcorper sit amet. At tempor commodo ullamcorper a
            lacus vestibulum. Tempor id eu nisl nunc mi ipsum faucibus vitae
            aliquet. Netus et malesuada fames ac turpis. Nullam vehicula ipsum a
            arcu cursus. Justo donec enim diam vulputate ut. Molestie at
            elementum eu facilisis sed odio. Ac orci phasellus egestas tellus
            rutrum tellus pellentesque. Dignissim suspendisse in est ante. Et
            odio pellentesque diam volutpat commodo sed. Feugiat nisl pretium
            fusce id velit ut. Duis tristique sollicitudin nibh sit amet.
          </p>

          <p>
            Sit ipsum ut minim in irure minim cillum enim ut consequat nulla non
            cillum. Deserunt magna sit fugiat qui quis ex fugiat tempor
            consectetur occaecat deserunt id nisi. Sunt esse cillum nostrud
            mollit pariatur exercitation eu anim consectetur ex incididunt
            dolore aute. Ullamco laborum excepteur dolor irure ut in labore
            dolore ipsum in occaecat.
          </p>
          <p>
            Eiusmod ullamco do nulla Lorem non laborum consectetur deserunt
            cillum. Fugiat voluptate qui deserunt sit anim non ex ipsum ad aute
            magna. Elit exercitation consectetur duis. Amet fugiat ipsum tempor
            duis adipisicing enim culpa ipsum culpa culpa fugiat elit.
          </p>
          <p>
            Ullamco nulla proident fugiat laborum Lorem cillum officia ullamco
            nisi ea nulla irure adipisicing. Dolor non esse eiusmod dolor
            exercitation et dolore tempor fugiat aute minim culpa ea nulla.
            Commodo ut sit amet dolor proident reprehenderit laborum magna
            tempor. In ea ea officia commodo nulla irure cupidatat. Commodo amet
            deserunt veniam esse anim ad laboris nulla et id fugiat amet. Velit
            voluptate consequat tempor aliqua officia cupidatat pariatur est
            deserunt sit reprehenderit amet Lorem.
          </p>
          <p>
            Commodo occaecat nisi ut sit ut eu ut ex. Enim tempor laborum
            pariatur. Aliqua amet occaecat dolore reprehenderit excepteur elit
            velit sit incididunt cillum consequat et nulla. Nisi veniam laborum
            dolor qui aliqua voluptate.
          </p>
          <p>
            Occaecat consequat nulla cillum qui ut anim aliquip. Nulla cillum
            dolore est consequat nostrud dolor ullamco quis velit id officia
            eiusmod elit excepteur. Elit velit nostrud commodo sit minim labore
            est veniam et ipsum in ad tempor. Anim do laboris dolore aliquip. Id
            occaecat elit sint ullamco sit ullamco sunt anim commodo tempor
            exercitation. Nulla ut et ea sint magna aute eiusmod id sit. Sunt
            dolor Lorem consectetur dolor voluptate excepteur aute enim
            adipisicing incididunt velit enim amet et ex. Cupidatat ullamco
            occaecat pariatur proident nostrud in veniam.
          </p>
          <p>
            Nulla ut velit id cupidatat dolore nulla duis voluptate
            reprehenderit dolore. Officia nisi pariatur ullamco reprehenderit.
            Non Lorem non elit qui aliquip aute adipisicing officia ut ut. Nisi
            qui culpa reprehenderit labore esse est sint pariatur nostrud
            labore. Aute id tempor labore reprehenderit. Duis ut velit fugiat
            esse velit tempor culpa. Ex in aliqua nisi mollit fugiat nulla
            nostrud eu. Aute elit ea sit mollit laboris elit consequat anim
            commodo irure reprehenderit consequat.
          </p>
          <p>
            Occaecat nulla officia cillum enim. Sint aliquip qui aliqua laborum
            tempor. Velit cupidatat ut do aliquip. Officia consectetur
            incididunt eu quis. Eu in magna occaecat elit ipsum occaecat culpa
            culpa. Qui occaecat duis occaecat. Culpa quis duis do dolore
            reprehenderit anim est amet esse non ut. Esse ea aliquip ullamco
            exercitation aliqua.
          </p>
        </>
      )}
    </div>
  );
}
