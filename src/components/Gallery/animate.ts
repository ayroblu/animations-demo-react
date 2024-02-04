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
export function getWrappedSetIsDetail({
  setIsDetail,
  imageContainerRef,
  modalMediaRef,
  width,
  height,
}: {
  setIsDetail: React.Dispatch<React.SetStateAction<boolean>>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  modalMediaRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
}): React.Dispatch<boolean> {
  return (isDetail: boolean) => {
    const reactSetter = () => {
      setIsDetail(isDetail);
    };
    if (isDetail) {
      const imageContainer = imageContainerRef.current;
      if (!imageContainer) {
        reactSetter();
        return;
      }
      invertTransformAnimate({
        beforeEl: imageContainer,
        getAfterEl: () => modalMediaRef.current,
        reactSetter,
        reverse: {
          reverseScaleDir: width < height ? "y" : "x",
          getChildEls: (el) => [...el.children] as HTMLElement[],
        },
      });
    } else {
      const modalMedia = modalMediaRef.current;
      if (!modalMedia) {
        reactSetter();
        return;
      }
      invertTransformAnimate({
        beforeEl: modalMedia,
        getAfterEl: () => imageContainerRef.current,
        reactSetter,
        reverse: {
          reverseScaleDir: width < height ? "y" : "x",
          getChildEls: (el) => [...el.children] as HTMLElement[],
        },
        onTransitionEnd: (el) => {
          el.style.zIndex = "";
        },
      });
      const imageContainer = imageContainerRef.current;
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
