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
export const { cacheImg, getCachedImage } = getImageCache();
