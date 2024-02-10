import { atom, getDefaultStore, useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { Media } from "./Gallery";

const selectedItemAtom = atom<string | null>(null);
export function useSelectedItem(): string | null {
  return useAtomValue(selectedItemAtom);
}
export function useKnownSelectedItem(): string {
  return useAtomValue(selectedItemAtom)!;
}
export function useUnselectItem(): () => void {
  const setItem = useSetAtom(selectedItemAtom);
  return React.useCallback(() => {
    setItem(null);
  }, [setItem]);
}
export function useSetSelectedItem() {
  return useSetAtom(selectedItemAtom);
}

const allMediaAtom = atom<Media[]>([]);
export function useAllMedia() {
  return useAtomValue(allMediaAtom);
}
export function useInitMedia(getMedia: () => Media[]) {
  const setter = useSetAtom(allMediaAtom);
  const getMediaRef = React.useRef(getMedia);
  React.useLayoutEffect(() => {
    setter(getMediaRef.current());
  }, [setter]);
}

const selectedItemIndexAtom = atom<number | null>((get) => {
  const selectedItem = get(selectedItemAtom);
  if (selectedItem === null) {
    return null;
  }
  const allMedia = get(allMediaAtom);
  return allMedia.findIndex(({ url }) => url === selectedItem);
});
export function useKnownSelectedIndex(): number {
  return useAtomValue(selectedItemIndexAtom)!;
}
export function useKnownSelectedMedia(): Media {
  const index = useKnownSelectedIndex();
  const allMedia = useAtomValue(allMediaAtom);
  return allMedia[index];
}

const canIncAtom = atom((get) => {
  const selectedIndex = get(selectedItemIndexAtom);
  if (selectedIndex === null) {
    return false;
  }
  const allMedia = get(allMediaAtom);
  if (selectedIndex >= allMedia.length - 1) {
    return false;
  }
  return true;
});
const canDecAtom = atom((get) => {
  const selectedIndex = get(selectedItemIndexAtom);
  if (selectedIndex === null) {
    return false;
  }
  if (selectedIndex <= 0) {
    return false;
  }
  return true;
});
export function getCanInc(store = getDefaultStore()) {
  return store.get(canIncAtom);
}
export function getCanDec(store = getDefaultStore()) {
  return store.get(canDecAtom);
}
export function useCanInc() {
  return useAtomValue(canIncAtom);
}
export function useCanDec() {
  return useAtomValue(canDecAtom);
}
const incrementIndexAtom = atom(null, (get, set) => {
  const selectedIndex = get(selectedItemIndexAtom);
  if (selectedIndex === null) {
    return;
  }
  const allMedia = get(allMediaAtom);
  if (selectedIndex < allMedia.length - 1) {
    set(selectedItemAtom, allMedia[selectedIndex + 1].url);
  }
});
const decrementIndexAtom = atom(null, (get, set) => {
  const selectedIndex = get(selectedItemIndexAtom);
  if (selectedIndex === null) {
    return;
  }
  const allMedia = get(allMediaAtom);
  if (selectedIndex > 0) {
    set(selectedItemAtom, allMedia[selectedIndex - 1].url);
  }
});
export function useIncDecSelectedIndex() {
  const inc = useSetAtom(incrementIndexAtom);
  const dec = useSetAtom(decrementIndexAtom);
  return {
    inc,
    dec,
  };
}
