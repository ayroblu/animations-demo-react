import React from "react";
import { GalleryContext } from "./GalleryContext";

export function useGalleryContext() {
  const context = React.useContext(GalleryContext);
  if (!context) throw new Error("expected non null GalleryContext");
  return context;
}
