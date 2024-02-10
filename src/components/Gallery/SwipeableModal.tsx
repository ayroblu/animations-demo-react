import styles from "./SwipeableModal.module.css";
import { cn, isTouchDevice } from "../../lib/utils";
import { useDimensionsQuery, useJoinRefs } from "../../lib/utils/hooks";
import { getWrappedSetState } from "./animate";
import { useModalGalleryDragHandlers } from "./drag";
import { getCachedImage } from "../../lib/utils/image-cache";
import { useSelectedItem, useSetSelectedItem, useUnselectItem } from "./state";
import { useGalleryContext } from "./useGalleryContext";
import React from "react";
import { flushSync } from "react-dom";
import {
  getTransformsManager,
  transitionWrapper,
} from "../../lib/utils/animations";

export type Media = {
  width: number;
  height: number;
  url: string;
  kind: "video" | "image";
};
type Props = {
  allMedia: Media[];
};
export function SwipeableModal(props: Props) {
  const selectedItem = useSelectedItem();
  if (!selectedItem) {
    return null;
  }
  return <SwipeableModalInner {...props} />;
}
function SwipeableModalInner({ allMedia }: Props) {
  const selectedItem = useSelectedItem();
  const onDismiss = useUnselectItem();
  const index = allMedia.findIndex(({ url }) => url === selectedItem);
  const { url, width, height, kind } = allMedia[index];
  const isVertical = useDimensionsQuery(({ windowWidth, windowHeight }) => {
    const windowAspectRatio = windowWidth / windowHeight;
    const aspectRatio = width / height;
    return aspectRatio < windowAspectRatio;
  });
  const context = useGalleryContext();
  const wrappedDismiss = getWrappedSetState({
    getModalMedia: () => context.modalMediaEl ?? null,
    setState: onDismiss,
    getImageContainer: () =>
      selectedItem ? context.itemEls.get(selectedItem) ?? null : null,
    width,
    height,
    isDetail: false,
  });
  const { modalRef: dragModalRef, imageRef } = useModalGalleryDragHandlers({
    dismiss: wrappedDismiss,
  });
  const modalMediaRef = useJoinRefs([
    context
      ? (ref) => {
          context.modalMediaEl = ref;
        }
      : undefined,
    imageRef,
  ]);
  const modalRef = useJoinRefs([
    dragModalRef,
    context
      ? (ref) => {
          context.modalEl = ref;
        }
      : undefined,
  ]);
  useLeftRightArrows(allMedia);
  // Probably this should be a cross in the corner rather than on the whole modal
  const onClick = isTouchDevice() ? undefined : wrappedDismiss;
  const beforeIndex = index - 1;
  const afterIndex = index + 1;
  return (
    <div className={styles.modal} ref={modalRef} onClick={onClick}>
      {beforeIndex >= 0 && beforeIndex < allMedia.length && (
        <MediaImage index={beforeIndex} allMedia={allMedia} direction="left" />
      )}
      <div
        key={url}
        className={cn(
          styles.modalMedia,
          isVertical ? styles.horizontal : styles.vertical,
        )}
        ref={modalMediaRef}
      >
        {kind === "image" ? (
          <img
            className={cn(isVertical ? styles.horizontal : styles.vertical)}
            src={getCachedImage(url) ?? url}
            width={width}
            height={height}
            loading="lazy"
          />
        ) : (
          <video
            className={cn(isVertical ? styles.horizontal : styles.vertical)}
            src={url}
            width={width}
            height={height}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
      </div>
      {afterIndex >= 0 && afterIndex < allMedia.length && (
        <MediaImage index={afterIndex} allMedia={allMedia} direction="right" />
      )}
      <div className={styles.modalFooter}>Footer</div>
    </div>
  );
}

type MediaImageProps = {
  index: number;
  allMedia: Media[];
  direction: "left" | "right";
};
function MediaImage({ index, allMedia, direction }: MediaImageProps) {
  const { url, width, height, kind } = allMedia[index];
  const isVertical = useDimensionsQuery(({ windowWidth, windowHeight }) => {
    const windowAspectRatio = windowWidth / windowHeight;
    const aspectRatio = width / height;
    return aspectRatio < windowAspectRatio;
  });
  const context = useGalleryContext();
  return (
    <div
      className={cn(
        styles.modalMedia,
        styles.offscreen,
        direction === "left" ? styles.offscreenLeft : styles.offscreenRight,
        isVertical ? styles.horizontal : styles.vertical,
      )}
      ref={
        direction === "left"
          ? (ref) => (context.leftModalMediaEl = ref)
          : (ref) => (context.rightModalMediaEl = ref)
      }
    >
      {kind === "image" ? (
        <img
          className={cn(isVertical ? styles.horizontal : styles.vertical)}
          src={getCachedImage(url) ?? url}
          width={width}
          height={height}
          loading="lazy"
        />
      ) : (
        <video
          className={cn(isVertical ? styles.horizontal : styles.vertical)}
          src={url}
          width={width}
          height={height}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
    </div>
  );
}

function useLeftRightArrows(allMedia: Media[]) {
  const setSelected = useSetSelectedItem();
  const selectedItem = useSelectedItem();
  const index = allMedia.findIndex(({ url }) => url === selectedItem);
  const context = useGalleryContext();
  React.useEffect(() => {
    const { transformTo, transformReset } = getTransformsManager();
    function handleTransition(transform: string) {
      const leftEl = context.leftModalMediaEl;
      const middleEl = context.modalMediaEl;
      const rightEl = context.rightModalMediaEl;
      if (leftEl && middleEl && rightEl) {
        leftEl.style.transition = "";
        middleEl.style.transition = "";
        rightEl.style.transition = "";
        transformTo(leftEl, transform);
        transformTo(middleEl, transform);
        transformTo(rightEl, transform);
        leftEl.getBoundingClientRect();
        middleEl.getBoundingClientRect();
        rightEl.getBoundingClientRect();
        transitionWrapper(leftEl, () => {
          transformReset(leftEl);
        });
        transitionWrapper(middleEl, () => {
          transformReset(middleEl);
        });
        transitionWrapper(rightEl, () => {
          transformReset(rightEl);
        });
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        const url = allMedia[index - 1]?.url;
        if (url !== undefined) {
          flushSync(() => {
            setSelected(url);
          });
          handleTransition("translateX(-100vw)");
        }
      } else if (e.key === "ArrowRight") {
        const url = allMedia[index + 1]?.url;
        if (url !== undefined) {
          flushSync(() => {
            setSelected(url);
          });
          handleTransition("translateX(100vw)");
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [allMedia, context, index, setSelected]);
}
