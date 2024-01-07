import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { HalfSheetRoute } from "./HalfSheet";
import { SegmentedControlRoute } from "./SegmentedControl";
import { SegmentedControlOldRoute } from "./SegmentedControlOld";

export const routes = {
  root: "/",
  halfSheet: "/half-sheet",
  segmentedControl: "/segmented-control",
  segmentedControlOld: "/segmented-control-old",
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
  ],
  { basename: import.meta.env.BASE_URL },
);
