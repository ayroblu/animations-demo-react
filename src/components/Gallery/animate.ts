import { flushSync } from "react-dom";
import { getTransform } from "../../lib/utils";
import {
  getTransformsManager,
  transitionWrapper,
} from "../../lib/utils/animations";

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
export function getWrappedSetState({
  setState,
  getImageContainer,
  getModalMedia,
  width,
  height,
  isDetail,
}: {
  setState: () => void;
  getImageContainer: () => HTMLElement | null;
  getModalMedia: () => HTMLElement | null;
  width: number;
  height: number;
  isDetail: boolean;
}): () => void {
  const reactSetter = setState;
  return () => {
    if (isDetail) {
      const imageContainer = getImageContainer();
      if (!imageContainer) {
        reactSetter();
        return;
      }
      invertTransformAnimate({
        beforeEl: imageContainer,
        getAfterEl: getModalMedia,
        reactSetter,
        reverse: {
          reverseScaleDir: width < height ? "y" : "x",
          getChildEls: (el) => [...el.children] as HTMLElement[],
        },
      });
    } else {
      const modalMedia = getModalMedia();
      if (!modalMedia) {
        reactSetter();
        return;
      }
      invertTransformAnimate({
        beforeEl: modalMedia,
        getAfterEl: getImageContainer,
        reactSetter,
        reverse: {
          reverseScaleDir: width < height ? "y" : "x",
          getChildEls: (el) => [...el.children] as HTMLElement[],
        },
        onTransitionEnd: (el) => {
          el.style.zIndex = "";
        },
      });
      const imageContainer = getImageContainer();
      if (imageContainer) {
        imageContainer.style.zIndex = "1";
      }
    }
  };
}
function invertTransformAnimate({
  beforeEl,
  getAfterEl,
  reactSetter,
  reverse,
  onTransitionEnd,
}: {
  beforeEl: HTMLElement;
  getAfterEl: () => HTMLElement | null;
  reactSetter: () => void;
  reverse?: {
    getChildEls: (element: HTMLElement) => HTMLElement[];
    reverseScaleDir: "x" | "y";
  };
  onTransitionEnd?: (element: HTMLElement) => void;
}) {
  const beforeRect = beforeEl.getBoundingClientRect();
  flushSync(() => {
    reactSetter();
  });
  const afterEl = getAfterEl();
  if (!afterEl) return;
  const afterRect = afterEl.getBoundingClientRect();
  const { transformTo, transformReset } = getTransformsManager();

  const transform = getTransform(afterRect, beforeRect);
  transformTo(afterEl, transform);
  afterEl.getBoundingClientRect();
  transitionWrapper(
    afterEl,
    () => {
      transformReset(afterEl);
      afterEl.getBoundingClientRect();
    },
    { onEnd: () => onTransitionEnd?.(afterEl) },
  );
  if (reverse) {
    const { getChildEls, reverseScaleDir } = reverse;
    const childrenEls = getChildEls(afterEl);
    const revTransform = getReverseScaleTransform(
      afterRect,
      beforeRect,
      reverseScaleDir,
    );
    for (const childEl of childrenEls) {
      transformTo(childEl, revTransform);
      childEl.getBoundingClientRect();
      transitionWrapper(childEl, () => {
        transformReset(childEl);
        childEl.getBoundingClientRect();
      });
    }
  }
}
