import { Link } from "react-router-dom";
import { routes } from "./routes";
import iosStyles from "./components/IosPadding.module.css";

function App() {
  return (
    <div className={iosStyles.fullPadding}>
      <h1>Animations Demo</h1>
      <p>
        This is a collections of UI animations coming from common UI patterns.
      </p>

      <ul>
        <li>
          <Link to={routes.halfSheet}>Half Sheet</Link>
        </li>
        <li>
          <Link to={routes.segmentedControl}>Segmented Control</Link>
        </li>
        <li>
          <Link to={routes.segmentedControlImperative}>
            Segmented Control Imperative
          </Link>
        </li>
        <li>
          <Link to={routes.viewPagerWithDrawer}>ViewPager with Drawer</Link>
        </li>
        <li>
          <Link to={routes.viewPagerWithDrawerImperative}>
            ViewPager with Drawer Imperative
          </Link>
        </li>
        <li>
          <Link to={routes.viewPagerImperative}>ViewPager Imperative</Link>
        </li>
        <li>
          <Link to={routes.lockScreen}>iOS Lock Screen</Link>
        </li>
      </ul>

      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}

export default App;
