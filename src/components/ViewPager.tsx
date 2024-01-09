import React from "react";
import styles from "./ViewPager.module.css";
import { cn } from "../lib/utils";
import { globalResizeObserver } from "../lib/global-resize-observer";

type Props = {
  pages: {
    name: string;
    component: React.ReactNode;
  }[];
  contentClassName?: string;
  rightContentClassName?: string;
  wrapSetSelected?: (func: () => void) => void;
};
export function ViewPager({
  pages,
  contentClassName,
  rightContentClassName,
  wrapSetSelected,
}: Props) {
  const [selected, setSelected] = React.useState<string>(pages[0].name);
  const selectedPage = pages.find(({ name }) => name === selected) ?? pages[0];
  const selectedIndex = pages.findIndex(
    ({ name }) => name === selectedPage.name,
  );
  const [isRight, setIsRight] = React.useState(false);
  return (
    <div>
      <section className={styles.tabs}>
        {pages.map(({ name }, index) => (
          <Tab
            key={name}
            name={name}
            selected={selected}
            setIsRight={setIsRight}
            isRight={index < selectedIndex}
            setSelected={setSelected}
            wrapSetSelected={wrapSetSelected}
          />
        ))}
      </section>
      <div
        className={cn(
          contentClassName,
          isRight ? rightContentClassName : undefined,
          styles.content,
        )}
      >
        {selectedPage.component}
      </div>
    </div>
  );
}

function identity(func: () => void) {
  return func();
}
type TabProps = {
  name: string;
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  setIsRight: React.Dispatch<React.SetStateAction<boolean>>;
  isRight: boolean;
  wrapSetSelected?: (func: () => void) => void;
};
function Tab({
  name,
  selected,
  setSelected,
  setIsRight,
  isRight,
  wrapSetSelected = identity,
}: TabProps) {
  const nameRef = React.useRef(name);
  nameRef.current = name;
  const tabNameSpanRef = React.useRef<HTMLSpanElement | null>(null);
  const indicatorRef = React.useRef<HTMLDivElement | null>(null);
  useMatchWidth(tabNameSpanRef, indicatorRef, 16);
  const handleClick = React.useCallback(() => {
    const name = nameRef.current;
    setIsRight(isRight);
    wrapSetSelected(() => {
      setSelected(name);
    });
  }, [isRight, setIsRight, setSelected, wrapSetSelected]);
  return (
    <div className={styles.tab} onClick={handleClick}>
      <h3 className={styles.tabName}>
        <span ref={tabNameSpanRef}>{name}</span>
      </h3>
      <div
        className={cn(styles.indicator, selected === name && styles.selected)}
        ref={indicatorRef}
      />
    </div>
  );
}
function useMatchWidth<T extends React.MutableRefObject<HTMLElement | null>>(
  ref1: T,
  ref2: T,
  padding: number,
) {
  React.useEffect(() => {
    const element1 = ref1.current;
    const element2 = ref2.current;
    if (!element1 || !element2) return;
    element2.style.width =
      element1.getBoundingClientRect().width + padding + "px";
    return globalResizeObserver.observe(element1, () => {
      element2.style.width =
        element1.getBoundingClientRect().width + padding + "px";
    });
  }, [padding, ref1, ref2]);
}
