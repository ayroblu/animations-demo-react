import React from "react";
import styles from "./ViewPager.module.css";
import { cn } from "../lib/utils";
import { globalResizeObserver } from "../lib/global-resize-observer";

type Props = {
  pages: {
    name: string;
    component: React.ReactNode;
  }[];
  header: React.ReactNode;
  contentClassName?: string;
  rightContentClassName?: string;
  wrapSetSelected?: (func: () => void) => void;
  pageIndex?: number;
  setPageIndex?: React.Dispatch<React.SetStateAction<number>>;
  contentWrapperRef?: React.MutableRefObject<HTMLDivElement | null>;
};
export function ViewPager({
  pages,
  contentClassName,
  rightContentClassName,
  wrapSetSelected,
  header,
  pageIndex,
  setPageIndex,
  contentWrapperRef,
}: Props) {
  const [selected, setSelected] = React.useState(0);
  const selectedIndex = pageIndex ?? selected;
  const [isRight, setIsRight] = React.useState(false);
  const { onRef, refs } = usePageRef();
  const pageEl = refs[selectedIndex];
  const height = pageEl ? getPageHeight(pageEl) : 60;
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }
    content.style.height = height + "px";
  }, [height]);

  return (
    <div className={styles.viewPager}>
      <div className={styles.header}>
        {header}
        <section className={styles.tabs}>
          {pages.map(({ name }, index) => (
            <Tab
              key={name}
              name={name}
              index={index}
              isSelected={selectedIndex === index}
              setIsRight={setIsRight}
              isRight={index < selectedIndex}
              setSelected={setPageIndex ?? setSelected}
              wrapSetSelected={wrapSetSelected}
            />
          ))}
        </section>
      </div>
      <div
        className={cn(
          contentClassName,
          isRight ? rightContentClassName : undefined,
          styles.content,
        )}
        ref={contentRef}
        style={{ minHeight: height + "px" }}
      >
        <div
          className={styles.contentWrapper}
          style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
          ref={contentWrapperRef}
        >
          {pages.map(({ component, name }, i) => (
            <div
              key={name}
              className={styles.page}
              style={{ "--i": i } as CSSVariables}
              ref={onRef(i)}
            >
              {component}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function getPageHeight(page: HTMLElement) {
  return page.getBoundingClientRect().height;
}
function usePageRef() {
  const refs = React.useRef<Record<number, HTMLElement | null>>({});

  function onRef(key: number) {
    return (ref: HTMLElement | null) => {
      refs.current[key] = ref;
    };
  }
  return {
    onRef,
    refs: refs.current,
  };
}
interface CSSVariables extends React.CSSProperties {
  "--i": number;
}

function identity(func: () => void) {
  return func();
}
type TabProps = {
  name: string;
  isSelected: boolean;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  setIsRight: React.Dispatch<React.SetStateAction<boolean>>;
  isRight: boolean;
  wrapSetSelected?: (func: () => void) => void;
  index: number;
};
function Tab({
  name,
  isSelected,
  setSelected,
  setIsRight,
  isRight,
  wrapSetSelected = identity,
  index,
}: TabProps) {
  const tabNameSpanRef = React.useRef<HTMLSpanElement | null>(null);
  const indicatorRef = React.useRef<HTMLDivElement | null>(null);
  useMatchWidth(tabNameSpanRef, indicatorRef, 16);
  const handleClick = React.useCallback(() => {
    setIsRight(isRight);
    wrapSetSelected(() => {
      setSelected(index);
    });
  }, [index, isRight, setIsRight, setSelected, wrapSetSelected]);
  return (
    <div className={styles.tab} onClick={handleClick}>
      <h3 className={styles.tabName}>
        <span ref={tabNameSpanRef}>{name}</span>
      </h3>
      <div
        className={cn(styles.indicator, isSelected && styles.selected)}
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
