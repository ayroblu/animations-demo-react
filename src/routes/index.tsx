import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { HalfSheetRoute } from "./HalfSheet";
import { SegmentedControlRoute } from "./SegmentedControl";
import { SegmentedControlImperativeRoute } from "./SegmentedControlImperative";
import { ViewPagerWithDrawerRoute } from "./ViewPagerWithDrawer";
import { ViewPagerWithDrawerImperativeRoute } from "./ViewPagerWithDrawerImperative";
import { ViewPagerImperativeRoute } from "./ViewPagerImperative";
import { LockScreenRoute } from "./LockScreen";

export const routes = {
  root: "/",
  halfSheet: "/half-sheet",
  segmentedControl: "/segmented-control",
  segmentedControlImperative: "/segmented-control-imperative",
  viewPagerImperative: "/view-pager-imperative",
  viewPagerWithDrawer: "/view-pager-drawer",
  viewPagerWithDrawerImperative: "/view-pager-drawer-imperative",
  lockScreen: "/lock-screen",
};
export const router = createBrowserRouter(
  [
    {
      path: routes.root,
      element: <App />,
    },
    {
      path: routes.halfSheet,
      element: <HalfSheetRoute />,
    },
    {
      path: routes.segmentedControl,
      element: <SegmentedControlRoute />,
    },
    {
      path: routes.segmentedControlImperative,
      element: <SegmentedControlImperativeRoute />,
    },
    {
      path: routes.viewPagerImperative,
      element: <ViewPagerImperativeRoute />,
    },
    {
      path: routes.viewPagerWithDrawer,
      element: <ViewPagerWithDrawerRoute />,
    },
    {
      path: routes.viewPagerWithDrawerImperative,
      element: <ViewPagerWithDrawerImperativeRoute />,
    },
    {
      path: routes.lockScreen,
      element: <LockScreenRoute />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
