import React from "react";
import styles from "./Gallery.module.css";

export type Media = {
  width: number;
  height: number;
  url: string;
  kind: "video" | "image";
};
type Props = {
  media: Media[];
  onClick: (media: Media & { videoTime?: number }) => void;
};
export function Gallery({ media, onClick }: Props) {
  const [firstTime, setFirstTime] = React.useState(true);
  return (
    <div className={styles.gallery}>
      {media.map((media) => {
        const { url, width, height, kind } = media;
        return (
          <div
            key={url}
            className={styles.imageContainer}
            onClick={(e) => {
              if (firstTime) {
                setFirstTime(false);
                return;
              }
              if (e.target instanceof HTMLVideoElement) {
                e.target.pause();
                onClick({ ...media, videoTime: e.target.currentTime });
              } else {
                onClick(media);
              }
            }}
          >
            {kind === "image" ? (
              <img
                className={width < height ? styles.vertical : styles.horizontal}
                src={url}
                width={width}
                height={height}
              />
            ) : (
              <video
                className={width < height ? styles.vertical : styles.horizontal}
                src={url}
                width={width}
                height={height}
                autoPlay
                muted={firstTime}
                loop
                playsInline
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
