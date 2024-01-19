import React from "react";
import styles from "./FixedWithPlaceholder.module.css";
import { cn } from "../lib/utils";
import { useJoinRefs, useSyncElements } from "../lib/utils/hooks";

type Props = {
  isFixed: boolean;
  children: React.ReactNode;
  placeholderRef: React.ForwardedRef<HTMLDivElement>;
  fixedRef?: React.ForwardedRef<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
};
export function FixedWithPlaceholder({
  isFixed,
  children,
  placeholderRef,
  fixedRef,
  className,
  style,
}: Props) {
  const localFixedRef = React.useRef<HTMLDivElement | null>(null);
  const joinedFixedRef = useJoinRefs([localFixedRef, fixedRef ?? null]);
  const localPlaceholderRef = React.useRef<HTMLDivElement | null>(null);
  const joinedPlaceholderRef = useJoinRefs([
    localPlaceholderRef,
    placeholderRef,
  ]);

  useSyncElements(localFixedRef, localPlaceholderRef, (source, target) => {
    target.style.height = source.clientHeight + "px";
    source.style.width = target.clientWidth + "px";
  });
  return (
    <div className={styles.placeholder} ref={joinedPlaceholderRef}>
      <div
        className={cn(isFixed && styles.fixed, className)}
        ref={joinedFixedRef}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}
