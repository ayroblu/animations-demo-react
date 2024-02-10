import React from "react";

type GalleryContextType = {
  modalEl: HTMLElement | null;
  modalMediaEl: HTMLElement | null;
  itemEls: Map<string, HTMLElement | null>;
};
export const GalleryContext = React.createContext<GalleryContextType | null>(
  null,
);
export function GalleryContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [value] = React.useState<GalleryContextType>(() => ({
    modalEl: null,
    modalMediaEl: null,
    itemEls: new Map(),
  }));
  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
}
