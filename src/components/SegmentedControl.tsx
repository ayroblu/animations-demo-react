import React from "react";
import { cn } from "../lib/utils";
import style from "./SegmentedControl.module.css";

type Props = {
  items: { label: string; value: string }[];
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
};
export function SegmentedControl({
  items,
  value,
  initialValue,
  onChange,
}: Props) {
  const [internalValue, setInternalValue] = React.useState(() => initialValue);
  const handleChange = React.useCallback(
    (newValue: string) => {
      setInternalValue?.(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );
  const selectedIndex = items.findIndex(
    (item) => (value ?? internalValue) === item.value,
  );
  return (
    <section className={style.segmentedControlOuter}>
      <section className={style.segmentedControl}>
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
};
function SegmentedControlItem({
  isSelected,
  item,
  onChange,
  isAdjacentSelected,
}: SegmentedControlItemProps) {
  const handleClick = React.useCallback(() => {
    onChange(item.value);
  }, [item.value, onChange]);
  return (
    <button
      onClick={handleClick}
      className={cn(
        style.segmentedControlItem,
        isSelected && style.selected,
        isAdjacentSelected && style.isAdjacentSelected,
      )}
    >
      {item.label}
    </button>
  );
}
