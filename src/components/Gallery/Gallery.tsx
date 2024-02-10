import React from "react";
import styles from "./Gallery.module.css";
import { cn } from "../../lib/utils";
import { cacheImg, getCachedImage } from "../../lib/utils/image-cache";
import { GalleryContext } from "./GalleryContext";
import { useSelectedItem, useSetSelectedItem } from "./state";
import { getWrappedSetState } from "./animate";

export type Media = {
  width: number;
  height: number;
  url: string;
  kind: "video" | "image";
};
type Props = {
  media: Media[];
};
export function Gallery({ media }: Props) {
  return (
    <div className={styles.gallery}>
      {media.map((media) => {
        return <GalleryItem key={media.url} media={media} />;
      })}
    </div>
  );
}

type GalleryItemProps = {
  media: Media;
};
function GalleryItem({ media }: GalleryItemProps): React.ReactNode {
  const { url, width, height, kind } = media;
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const isHidden = useSelectedItem() === media.url;

  React.useEffect(() => {
    const videoMaybe = videoRef.current;
    if (!videoMaybe) return;
    const video = videoMaybe;
    function onLoadedMetadata() {
      video.currentTime = video.duration / 2;
    }
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);
  const context = React.useContext(GalleryContext);
  const onMediaRef = context
    ? (ref: HTMLElement | null) => {
        context.itemEls.set(url, ref);
      }
    : undefined;

  React.useLayoutEffect(() => {
    cacheImg(url);
  }, [url]);
  const setSelected = useSetSelectedItem();
  const setSelectedUrl = React.useCallback(() => {
    setSelected(url);
  }, [setSelected, url]);
  const onClick = React.useMemo(
    () =>
      getWrappedSetState({
        getModalMedia: () => context?.modalMediaEl ?? null,
        setState: setSelectedUrl,
        getImageContainer: () =>
          context ? context.itemEls.get(url) ?? null : null,
        width,
        height,
        isDetail: true,
      }),
    [context, height, setSelectedUrl, url, width],
  );

  return (
    <div
      key={url}
      className={cn(styles.imageContainer, isHidden && styles.hide)}
      onClick={onClick}
      ref={onMediaRef}
    >
      {kind === "image" ? (
        <img
          className={width < height ? styles.vertical : styles.horizontal}
          src={getCachedImage(url) ?? url}
          width={width}
          height={height}
          loading="lazy"
          crossOrigin=""
        />
      ) : (
        <video
          ref={videoRef}
          className={width < height ? styles.vertical : styles.horizontal}
          src={url}
          width={width}
          height={height}
          muted
          loop
          playsInline
        />
      )}
    </div>
  );
}
