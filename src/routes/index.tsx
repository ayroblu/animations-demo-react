import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { HalfSheetRoute } from "./HalfSheet";
import { SegmentedControlRoute } from "./SegmentedControl";
import { SegmentedControlOldRoute } from "./SegmentedControlOld";
import { ViewPagerWithDrawerRoute } from "./ViewPagerWithDrawer";
import { ViewPagerWithDrawerOldRoute } from "./ViewPagerWithDrawerOld";
import { ViewPagerOldRoute } from "./ViewPagerOld";

export const routes = {
  root: "/",
  halfSheet: "/half-sheet",
  segmentedControl: "/segmented-control",
  segmentedControlOld: "/segmented-control-old",
  viewPagerOld: "/view-pager-old",
  viewPagerWithDrawer: "/view-pager-drawer",
  viewPagerWithDrawerOld: "/view-pager-drawer-old",
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
      path: routes.segmentedControlOld,
      element: <SegmentedControlOldRoute />,
    },
    {
      path: routes.viewPagerOld,
      element: <ViewPagerOldRoute />,
    },
    {
      path: routes.viewPagerWithDrawer,
      element: <ViewPagerWithDrawerRoute />,
    },
    {
      path: routes.viewPagerWithDrawerOld,
      element: <ViewPagerWithDrawerOldRoute />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
