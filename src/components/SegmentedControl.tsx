import React from "react";
import { cn } from "../lib/utils";
import styles from "./SegmentedControl.module.css";

type Props = {
  items: { label: string; value: string }[];
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  selectedBackgroundClassName?: string;
  selectedRef?: (element: HTMLElement | null) => void;
};
export function SegmentedControl({
  items,
  value,
  initialValue,
  onChange,
  selectedBackgroundClassName,
  selectedRef,
}: Props) {
  const [internalValue, setInternalValue] = React.useState(() => initialValue);
  const handleChange = React.useCallback(
    (newValue: string) => {
      onChange?.(newValue);
      setInternalValue?.(newValue);
    },
    [onChange],
  );
  const selectedIndex = items.findIndex(
    (item) => (value ?? internalValue) === item.value,
  );
  return (
    <section className={styles.segmentedControlOuter}>
      <section className={cn(styles.segmentedControl)}>
        {items.map((item, i) => (
          <SegmentedControlItem
            key={item.value}
            onChange={handleChange}
            item={item}
            isAdjacentSelected={
              selectedIndex !== -1 &&
              (selectedIndex === i || selectedIndex === i + 1)
            }
            isSelected={selectedIndex === i}
            selectedBackgroundClassName={selectedBackgroundClassName}
            selectedRef={selectedRef}
          />
        ))}
      </section>
    </section>
  );
}

type SegmentedControlItemProps = {
  isSelected: boolean;
  item: { label: string; value: string };
  onChange: (value: string) => void;
  isAdjacentSelected: boolean;
  selectedBackgroundClassName?: string;
  selectedRef?: (element: HTMLElement | null) => void;
};
function SegmentedControlItem({
  isSelected,
  item,
  onChange,
  isAdjacentSelected,
  selectedBackgroundClassName,
  selectedRef,
}: SegmentedControlItemProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const handleClick = React.useCallback(() => {
    onChange(item.value);
    selectedRef?.(ref.current);
  }, [item.value, onChange, selectedRef]);
  return (
    <button
      onClick={handleClick}
      className={cn(
        styles.segmentedControlItem,
        isSelected && styles.selected,
        isAdjacentSelected && styles.isAdjacentSelected,
      )}
    >
      <div
        ref={ref}
        className={cn(
          styles.background,
          isSelected && selectedBackgroundClassName,
        )}
      />
      <span className={styles.text}>{item.label}</span>
    </button>
  );
}
