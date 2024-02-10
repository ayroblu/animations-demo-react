import { cn } from "../lib/utils";
import styles from "./Gallery.module.css";
import iosStyles from "../components/IosPadding.module.css";
import { Gallery, Media } from "../components/Gallery/Gallery";
import React from "react";
import { SwipeableModal } from "../components/Gallery/SwipeableModal";
import { GalleryContextProvider } from "../components/Gallery/GalleryContext";

export function GalleryRoute() {
  const pageRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    page.scrollTo(0, page.scrollHeight);
  }, []);

  return (
    <GalleryContextProvider>
      <div className={styles.page} ref={pageRef}>
        <div className={cn(styles.content, iosStyles.fullPadding)}>
          <div className={styles.description}>
            Photo Album, tap each image to make it full screen, swipe up to show
            a sheet, swipe down to dismiss. Note that for videos, we need to
            maintain a consistent reference for a video to continue playing
            exactly as it is I think?
          </div>
          <Gallery media={media} />
          <SwipeableModal allMedia={media} />
        </div>
      </div>
    </GalleryContextProvider>
  );
}
const media: Media[] = [
  ...Array(34)
    .fill(null)
    .map((_, i) => {
      const width = i % 2 === 0 ? 200 : 300;
      const height = i % 2 === 0 ? 300 : 200;
      return {
        // url: `https://fastly.picsum.photos/id/26/200/300.jpg?hmac=E9i_aIqa_ifLvxqI2b1QTLCnhGQYJ83IpvaDfFM54bU`,
        url: `https://picsum.photos/id/${i}/${width}/${height}`,
        width,
        height,
        kind: "image" as const,
      };
    }),
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    width: 1280,
    height: 720,
    kind: "video" as const,
  },
];
