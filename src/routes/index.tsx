import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { HalfSheetRoute } from "./HalfSheet";
import { SegmentedControlRoute } from "./SegmentedControl";
import { SegmentedControlOldRoute } from "./SegmentedControlOld";
import { ViewPagerWithDrawerRoute } from "./ViewPagerWithDrawer";

export const routes = {
  root: "/",
  halfSheet: "/half-sheet",
  segmentedControl: "/segmented-control",
  segmentedControlOld: "/segmented-control-old",
  viewPagerWithDrawer: "/view-pager-drawer",
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
      path: routes.viewPagerWithDrawer,
      element: <ViewPagerWithDrawerRoute />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
