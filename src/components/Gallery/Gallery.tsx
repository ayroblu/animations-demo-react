import React from "react";
import styles from "./Gallery.module.css";
import { cn } from "../../lib/utils";
import { useDimensionsQuery, useJoinRefs } from "../../lib/utils/hooks";
import { getWrappedSetIsDetail } from "./animate";
import { useGalleryDragHandlers } from "./drag";

export type Media = {
  width: number;
  height: number;
  url: string;
  kind: "video" | "image";
};
type Props = {
  media: Media[];
  onClick: (media: Media & { videoTime?: number }) => void;
  modal: HTMLElement;
};
export function Gallery({ media, onClick }: Props) {
  return (
    <div className={styles.gallery}>
      {media.map((media) => {
        return <GalleryItem key={media.url} media={media} onClick={onClick} />;
      })}
    </div>
  );
}

type GalleryItemProps = {
  media: Media;
  onClick: (media: Media & { videoTime?: number }) => void;
};
function GalleryItem({ media }: GalleryItemProps): React.ReactNode {
  const { url, width, height, kind } = media;
  const [isDetail, setIsDetail] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
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
  const isVertical = useDimensionsQuery(({ windowWidth, windowHeight }) => {
    const windowAspectRatio = windowWidth / windowHeight;
    const aspectRatio = width / height;
    return aspectRatio < windowAspectRatio;
  });
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const localModalMediaRef = React.useRef<HTMLDivElement>(null);
  const wrappedSetIsDetail = getWrappedSetIsDetail({
    modalMediaRef: localModalMediaRef,
    setIsDetail,
    imageContainerRef,
    width,
    height,
  });
  const { modalRef, imageRef } = useGalleryDragHandlers({
    isDetailState: [isDetail, wrappedSetIsDetail],
  });
  const modalMediaRef = useJoinRefs([localModalMediaRef, imageRef]);

  React.useLayoutEffect(() => {
    cacheImg(url);
  }, [url]);

  return (
    <>
      <div
        key={url}
        className={cn(styles.imageContainer, isDetail && styles.hide)}
        onClick={() => wrappedSetIsDetail(true)}
        ref={imageContainerRef}
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
      {isDetail && (
        <div className={styles.modal} ref={modalRef}>
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
      )}
    </>
  );
}

// https://gist.github.com/Jonarod/77d8e3a15c5c1bb55fa9d057d12f95bd
function imgToBlob(img: HTMLImageElement): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(resolve);
  });
}

function getImageCache() {
  const imageMap = new Map<string, string>();
  async function cacheImg(url: string): Promise<void> {
    if (imageMap.has(url)) {
      return;
    }
    const img = new Image();
    img.crossOrigin = "";
    img.onload = async () => {
      const blob = await imgToBlob(img);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        imageMap.set(img.src, url);
      }
    };
    img.src = url;
  }
  function getCachedImage(src: string): string | void {
    return imageMap.get(src);
  }
  return { cacheImg, getCachedImage };
}
const { cacheImg, getCachedImage } = getImageCache();
