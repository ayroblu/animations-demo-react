import React from "react";
import styles from "./Gallery.module.css";
import { cn, getTransform } from "../../lib/utils";
import { useForceUpdate } from "../../lib/utils/hooks";
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
      modalMedia.getBoundingClientRect();
      transitionWrapper(
        modalMedia,
        () => {
          transformReset(modalMedia);
        },
        { transition: "0.3s transform" },
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
      imageContainer.getBoundingClientRect();
      transitionWrapper(
        imageContainer,
        () => {
          transformReset(imageContainer);
        },
        { transition: "0.3s transform" },
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
                src={url}
                width={width}
                height={height}
                loading="lazy"
              />
            ) : (
              <video
                ref={videoRef}
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

function useDimensionsQuery<T>(
  callback: (params: { windowWidth: number; windowHeight: number }) => T,
): T {
  const forceUpdate = useForceUpdate();
  const valueRef = React.useRef<T>();
  valueRef.current = callback(getDimensions());
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  React.useEffect(() => {
    function resize() {
      const callback = callbackRef.current;
      const value = valueRef.current;
      const result = callback(getDimensions());
      if (value !== result) {
        forceUpdate();
      }
    }
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [forceUpdate]);

  return valueRef.current;
}

function getDimensions() {
  const windowHeight = document.documentElement.clientHeight;
  const windowWidth = document.documentElement.clientWidth;
  return {
    windowHeight,
    windowWidth,
  };
}
