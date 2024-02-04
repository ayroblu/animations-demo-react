import React from "react";
import styles from "./Gallery.module.css";
import { cn, getTransform } from "../../lib/utils";
import { useDimensionsQuery } from "../../lib/utils/hooks";
import {
  getTransformsManager,
  transitionWrapper,
} from "../../lib/utils/animations";
import { flushSync } from "react-dom";

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

  const modalMediaRef = React.useRef<HTMLDivElement>(null);
  const wrappedSetIsDetail = (isDetail: boolean) => {
    const imageContainer = imageContainerRef.current;
    if (!imageContainer) {
      setIsDetail(isDetail);
      return;
    }
    if (isDetail) {
      flushSync(() => {
        setIsDetail(isDetail);
      });
      const modalMedia = modalMediaRef.current;
      if (!modalMedia) return;
      const before = imageContainer.getBoundingClientRect();
      const after = modalMedia.getBoundingClientRect();
      const transform = getTransform(after, before);
      const { transformTo, transformReset } = getTransformsManager();
      transformTo(modalMedia, transform);
      const child = modalMedia.children[0] as HTMLElement;
      const revTransform = getReverseScaleTransform(
        after,
        before,
        width < height ? "y" : "x",
      );
      transformTo(child, revTransform);
      modalMedia.getBoundingClientRect();
      child.getBoundingClientRect();
      transitionWrapper(
        modalMedia,
        () => {
          transformReset(modalMedia);
          modalMedia.getBoundingClientRect();
        },
        { transition: "0.25s transform" },
      );
      transitionWrapper(
        child,
        () => {
          transformReset(child);
          child.getBoundingClientRect();
        },
        { transition: "0.25s transform" },
      );
    } else {
      const modalMedia = modalMediaRef.current;
      if (!modalMedia) {
        setIsDetail(isDetail);
        return;
      }
      const imageRect = imageContainer.getBoundingClientRect();
      const modalRect = modalMedia.getBoundingClientRect();
      flushSync(() => {
        setIsDetail(isDetail);
      });
      const transform = getTransform(imageRect, modalRect);
      const { transformTo, transformReset } = getTransformsManager();
      transformTo(imageContainer, transform);
      const revTransform = getReverseScaleTransform(
        imageRect,
        modalRect,
        width < height ? "y" : "x",
      );
      const child = imageContainer.children[0] as HTMLElement;
      transformTo(child, revTransform);
      imageContainer.getBoundingClientRect();
      child.getBoundingClientRect();
      imageContainer.style.zIndex = "1";
      transitionWrapper(
        imageContainer,
        () => {
          transformReset(imageContainer);
          imageContainer.getBoundingClientRect();
        },
        {
          transition: "0.25s transform",
          onEnd: () => {
            imageContainer.style.zIndex = "";
          },
        },
      );
      transitionWrapper(
        child,
        () => {
          transformReset(child);
          child.getBoundingClientRect();
        },
        {
          transition: "0.25s transform",
        },
      );
    }
  };
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
            src={url}
            width={width}
            height={height}
            loading="lazy"
            crossOrigin=""
            onLoad={(e) => cacheImg(e.currentTarget)}
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
        <div className={styles.modal} onClick={() => wrappedSetIsDetail(false)}>
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

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};
function getReverseScaleTransform(
  from: Box,
  to: Box,
  direction: "x" | "y",
): string {
  const fromAspectRatio = from.width / from.height;
  const toAspectRatio = to.width / to.height;
  if (direction === "y") {
    return `scaleY(${toAspectRatio / fromAspectRatio})`;
  } else {
    return `scaleX(${fromAspectRatio / toAspectRatio})`;
  }
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
  async function cacheImg(img: HTMLImageElement): Promise<void> {
    const blob = await imgToBlob(img);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      imageMap.set(img.src, url);
    }
  }
  function getCachedImage(src: string): string | void {
    return imageMap.get(src);
  }
  return { cacheImg, getCachedImage };
}
const { cacheImg, getCachedImage } = getImageCache();
