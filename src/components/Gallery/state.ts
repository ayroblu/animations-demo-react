import { atom, useAtomValue, useSetAtom } from "jotai";
import React from "react";

const selectedItemAtom = atom<string | null>(null);

export function useSelectedItem(): string | null {
  return useAtomValue(selectedItemAtom);
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
