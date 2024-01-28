import { cn } from "../lib/utils";
import styles from "./Gallery.module.css";

export function GalleryRoute() {
  return (
    <div className={styles.gallery}>
      {images.map(({ url, width, height }) => (
        <div key={url} className={styles.imageContainer}>
          <img
            className={cn(
              styles.image,
              width < height ? styles.vertical : styles.horizontal,
            )}
            src={url}
            width={width}
            height={height}
          />
        </div>
      ))}
    </div>
  );
}
const images = Array(33)
  .fill(null)
  .map((_, i) => {
    const width = i % 2 === 0 ? 200 : 300;
    const height = i % 2 === 0 ? 300 : 200;
    return {
      url: `https://picsum.photos/id/${i}/${width}/${height}`,
      width,
      height,
    };
  });
