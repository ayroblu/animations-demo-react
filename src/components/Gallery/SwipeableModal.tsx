import React from "react";
import styles from "./SwipeableModal.module.css";
import { cn, isTouchDevice } from "../../lib/utils";
import { useDimensionsQuery, useJoinRefs } from "../../lib/utils/hooks";
import { getWrappedSetState } from "./animate";
import { useModalGalleryDragHandlers } from "./drag";
import { getCachedImage } from "../../lib/utils/image-cache";
import { GalleryContext } from "./GalleryContext";
import { useSelectedItem, useUnselectItem } from "./state";

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
  const context = React.useContext(GalleryContext);
  const wrappedDismiss = getWrappedSetState({
    getModalMedia: () => context?.modalMediaEl ?? null,
    setState: onDismiss,
    getImageContainer: () =>
      selectedItem && context
        ? context.itemEls.get(selectedItem) ?? null
        : null,
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
  // Probably this should be a cross in the corner rather than on the whole modal
  const onClick = isTouchDevice() ? undefined : wrappedDismiss;
  return (
    <div className={styles.modal} ref={modalRef} onClick={onClick}>
      <div
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
      <div className={styles.modalFooter}>Footer</div>
    </div>
  );
}
