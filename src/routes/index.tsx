import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { HalfSheetRoute } from "./HalfSheet";

export const routes = {
  root: "/",
  halfSheet: "/half-sheet",
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
  ],
  { basename: import.meta.env.BASE_URL },
);
