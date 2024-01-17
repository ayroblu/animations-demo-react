import React from "react";
import styles from "./ViewPager.module.css";
import { cn } from "../lib/utils";
import { useArrayRef, useSyncElements } from "../lib/utils/hooks";
import iosStyles from "./IosPadding.module.css";

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
  onIndicatorRef?: (index: number) => (ref: HTMLElement | null) => void;
  onPageRef?: (index: number) => (ref: HTMLElement | null) => void;
  pageRefs?: (HTMLElement | null)[];
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
  onIndicatorRef,
  onPageRef: onPageRefProp,
  pageRefs,
}: Props) {
  const [selected, setSelected] = React.useState(0);
  const selectedIndex = pageIndex ?? selected;
  const [isRight, setIsRight] = React.useState(false);

  const { onRef: onLocalPageRef, refs: localPageRefs } = useArrayRef();
  pageRefs = pageRefs ?? localPageRefs;
  const onPageRef = onPageRefProp ?? onLocalPageRef;
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content || !pageRefs) {
      return;
    }
    const pageEl = pageRefs[selectedIndex];
    const height = pageEl ? getPageHeight(pageEl) : 60;
    content.style.height = height + "px";
  }, [pageRefs, selectedIndex]);
  const spacerRefs = React.useRef<(HTMLElement | null)[]>([]);
  const onSpacerRef = (index: number) => (ref: HTMLElement | null) => {
    spacerRefs.current[index] = ref;
  };
  useSyncElements(headerRef, spacerRefs, (source, targets) => {
    for (const target of targets) {
      if (target) {
        target.style.height = source.clientHeight + "px";
      }
    }
  });

  return (
    <div className={styles.viewPager}>
      <div className={styles.header} ref={headerRef}>
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
              onIndicatorRef={onIndicatorRef}
            />
          ))}
        </section>
      </div>
      <div className={styles.contentContainer}>
        <div
          className={cn(
            contentClassName,
            isRight ? rightContentClassName : undefined,
            styles.content,
          )}
          ref={contentRef}
        >
          <div
            className={styles.contentWrapper}
            style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
            ref={contentWrapperRef}
          >
            {pages.map(({ component, name }, i) => (
              <div
                key={name}
                className={cn(styles.page, iosStyles.bottomPadding)}
                style={{ "--i": i } as React.CSSProperties}
                ref={onPageRef(i)}
              >
                <div ref={onSpacerRef(i)} />
                {component}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function getPageHeight(page: HTMLElement) {
  return page.getBoundingClientRect().height;
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
  onIndicatorRef?: (i: number) => (ref: HTMLElement | null) => void;
};
function Tab({
  name,
  isSelected,
  setSelected,
  setIsRight,
  isRight,
  wrapSetSelected = identity,
  index,
  onIndicatorRef,
}: TabProps) {
  const handleClick = React.useCallback(() => {
    setIsRight(isRight);
    wrapSetSelected(() => {
      setSelected(index);
    });
  }, [index, isRight, setIsRight, setSelected, wrapSetSelected]);
  return (
    <div className={styles.tab} onClick={handleClick}>
      <div className={styles.tabNameContainer}>
        <h3 className={styles.tabName}>{name}</h3>
        <div
          ref={onIndicatorRef?.(index)}
          className={cn(styles.indicator, isSelected && styles.selected)}
        />
      </div>
    </div>
  );
}
