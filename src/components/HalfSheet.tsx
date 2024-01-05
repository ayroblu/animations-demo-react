import React from "react";
import { cn } from "../lib/utils";
import style from "./HalfSheet.module.css";
import { globalResizeObserver } from "../lib/global-resize-observer";

type Props = {
  onDismiss: () => void;
  dialogClassName?: string;
};
export function HalfSheet(props: Props) {
  const { dialogClassName, onDismiss } = props;
  const { onTopRef, spaceStyle } = useMatchingSpace<HTMLDivElement>();
  const { touchRef, offsetStyle } = useTouch<HTMLDivElement>(onDismiss);
  return (
    <div
      className={style.cover}
      onClick={(e) => {
        if (e.target == e.currentTarget) {
          onDismiss();
        }
      }}
    >
      <div
        className={cn(style.halfSheet, dialogClassName)}
        style={offsetStyle}
        ref={touchRef}
      >
        <div className={style.halfSheetHeader} ref={onTopRef}>
          <div></div>
          <div>
            <h3>Title</h3>
          </div>
          <div>
            <button onClick={onDismiss}>Close</button>
          </div>
        </div>
        <div className={style.content}>
          <div style={spaceStyle} />
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Odio
            facilisis mauris sit amet massa vitae tortor. Ipsum faucibus vitae
            aliquet nec ullamcorper sit amet. At tempor commodo ullamcorper a
            lacus vestibulum. Tempor id eu nisl nunc mi ipsum faucibus vitae
            aliquet. Netus et malesuada fames ac turpis. Nullam vehicula ipsum a
            arcu cursus. Justo donec enim diam vulputate ut. Molestie at
            elementum eu facilisis sed odio. Ac orci phasellus egestas tellus
            rutrum tellus pellentesque. Dignissim suspendisse in est ante. Et
            odio pellentesque diam volutpat commodo sed. Feugiat nisl pretium
            fusce id velit ut. Duis tristique sollicitudin nibh sit amet.
          </p>
          <p>
            Sit ipsum ut minim in irure minim cillum enim ut consequat nulla non
            cillum. Deserunt magna sit fugiat qui quis ex fugiat tempor
            consectetur occaecat deserunt id nisi. Sunt esse cillum nostrud
            mollit pariatur exercitation eu anim consectetur ex incididunt
            dolore aute. Ullamco laborum excepteur dolor irure ut in labore
            dolore ipsum in occaecat.
          </p>
          <p>
            Eiusmod ullamco do nulla Lorem non laborum consectetur deserunt
            cillum. Fugiat voluptate qui deserunt sit anim non ex ipsum ad aute
            magna. Elit exercitation consectetur duis. Amet fugiat ipsum tempor
            duis adipisicing enim culpa ipsum culpa culpa fugiat elit.
          </p>
          <p>
            Ullamco nulla proident fugiat laborum Lorem cillum officia ullamco
            nisi ea nulla irure adipisicing. Dolor non esse eiusmod dolor
            exercitation et dolore tempor fugiat aute minim culpa ea nulla.
            Commodo ut sit amet dolor proident reprehenderit laborum magna
            tempor. In ea ea officia commodo nulla irure cupidatat. Commodo amet
            deserunt veniam esse anim ad laboris nulla et id fugiat amet. Velit
            voluptate consequat tempor aliqua officia cupidatat pariatur est
            deserunt sit reprehenderit amet Lorem.
          </p>
          <p>
            Commodo occaecat nisi ut sit ut eu ut ex. Enim tempor laborum
            pariatur. Aliqua amet occaecat dolore reprehenderit excepteur elit
            velit sit incididunt cillum consequat et nulla. Nisi veniam laborum
            dolor qui aliqua voluptate.
          </p>
          <p>
            Occaecat consequat nulla cillum qui ut anim aliquip. Nulla cillum
            dolore est consequat nostrud dolor ullamco quis velit id officia
            eiusmod elit excepteur. Elit velit nostrud commodo sit minim labore
            est veniam et ipsum in ad tempor. Anim do laboris dolore aliquip. Id
            occaecat elit sint ullamco sit ullamco sunt anim commodo tempor
            exercitation. Nulla ut et ea sint magna aute eiusmod id sit. Sunt
            dolor Lorem consectetur dolor voluptate excepteur aute enim
            adipisicing incididunt velit enim amet et ex. Cupidatat ullamco
            occaecat pariatur proident nostrud in veniam.
          </p>
          <p>
            Nulla ut velit id cupidatat dolore nulla duis voluptate
            reprehenderit dolore. Officia nisi pariatur ullamco reprehenderit.
            Non Lorem non elit qui aliquip aute adipisicing officia ut ut. Nisi
            qui culpa reprehenderit labore esse est sint pariatur nostrud
            labore. Aute id tempor labore reprehenderit. Duis ut velit fugiat
            esse velit tempor culpa. Ex in aliqua nisi mollit fugiat nulla
            nostrud eu. Aute elit ea sit mollit laboris elit consequat anim
            commodo irure reprehenderit consequat.
          </p>
        </div>
      </div>
    </div>
  );
}

// "ontouchstart" in document.documentElement
function useTouch<T extends HTMLElement>(handleDismiss: () => void) {
  const touchRef = React.useRef<T | null>(null);
  const [offset, setOffset] = React.useState<number>(0);
  const offsetRef = React.useRef(offset);
  offsetRef.current = offset;
  React.useEffect(() => {
    const el = touchRef.current;
    if (!el) return;
    const element = el;
    const elementHeight = element.getBoundingClientRect().height;
    const transition = createTransition();
    let startTouchY: null | number = null;
    function startTracking(e: TouchEvent) {
      transition.cancel();
      const { touches } = e;
      if (touches.length !== 1) {
        return;
      }
      if (!(e.target instanceof HTMLElement)) {
        return;
      }
      const isScrolled = getIsScrolledElements(e.target, element);
      if (isScrolled) {
        return;
      }
      const [touch] = touches;
      startTouchY = touch.pageY;
    }
    const pointTracker = createAxisPointsTracker();
    function callback(e: TouchEvent) {
      const { touches } = e;
      if (touches.length !== 1) {
        element?.removeEventListener("touchmove", callback);
        return;
      }
      const [touch] = touches;
      if (startTouchY === null) {
        return;
      }
      if (!(e.target instanceof HTMLElement)) {
        return;
      }
      const isScrolled = getIsScrolledElements(e.target, element);
      if (isScrolled) {
        startTouchY = null;
        return;
      }
      const diff = touch.pageY - startTouchY;
      if (diff > 0) {
        e.preventDefault();
        setOffset(diff);
        pointTracker.addPoint(diff);
      }
    }
    function stopTracking(e: TouchEvent) {
      const { touches } = e;
      if (touches.length === 1 && startTouchY !== null) {
        const [touch] = touches;
        const diff = touch.pageY - startTouchY;
        pointTracker.addPoint(diff);
      }
      const velocity = pointTracker.getVelocity();

      startTouchY = null;
      const offset = offsetRef.current + velocity * 0.2;
      if (offset > elementHeight / 2) {
        handleDismiss();
      } else {
        setOffset(0);
        if (offset !== 0) {
          transition.transition(element);
        }
      }
    }
    element.addEventListener("touchstart", startTracking);
    element.addEventListener("touchmove", callback);
    element.addEventListener("touchend", stopTracking);
    return () => {
      element.removeEventListener("touchstart", startTracking);
      element.removeEventListener("touchmove", callback);
      element.removeEventListener("touchend", stopTracking);
      transition.getCallback()?.();
    };
  }, [handleDismiss]);
  const offsetStyle = React.useMemo(() => {
    return { transform: `translateY(${offset}px)` };
  }, [offset]);
  return { touchRef, offsetStyle };
}

function getIsScrolledElements(
  childElement: HTMLElement,
  parentElement: HTMLElement,
): boolean {
  let currentElement: HTMLElement | null = childElement;
  if (currentElement.scrollTop !== 0 || parentElement.scrollTop !== 0) {
    return true;
  }
  while (currentElement !== parentElement && currentElement !== null) {
    if (currentElement.scrollTop !== 0) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }
  return false;
}

function useMatchingSpace<T extends HTMLElement>() {
  const [space, setSpace] = React.useState(0);
  const onTopRef = React.useRef<T | null>(null);
  React.useLayoutEffect(() => {
    const element = onTopRef.current;
    if (!element) return;
    const { height } = element.getBoundingClientRect();
    setSpace(height);
    const dispose = globalResizeObserver.observe(element, () => {
      const { height } = element.getBoundingClientRect();
      setSpace(height);
    });
    return () => {
      dispose();
    };
  }, []);
  const spaceStyle = React.useMemo(
    () => ({
      height: space,
    }),
    [space],
  );
  return {
    onTopRef,
    space,
    spaceStyle,
  };
}

const trackTime = 500;
function createAxisPointsTracker() {
  let points: [number, number][] = [];
  function addPoint(point: number) {
    const now = Date.now();
    points.push([point, now]);
    points = points.filter(([, time]) => time > now - trackTime);
  }
  function getVelocity(): number {
    const now = Date.now();
    points = points.filter(([, time]) => time > now - trackTime);
    let avg = null;
    for (let i = 1; i < points.length; ++i) {
      const [point, time] = points[i - 1];
      const [point2, time2] = points[i];
      const velocity = ((point2 - point) / (time2 - time)) * 1000;
      if (avg === null) {
        avg = velocity;
      } else {
        avg += (velocity - avg) / i;
      }
    }
    return avg ?? 0;
  }
  return {
    addPoint,
    getVelocity,
  };
}

function createTransition() {
  let callback: (() => void) | null = null;
  function transition(element: HTMLElement) {
    element.style.transition = "0.2s transform";
    function transitionEndCallback() {
      element.style.transition = "";
      element.removeEventListener("transitionend", transitionEndCallback);
      callback = null;
    }
    callback = transitionEndCallback;
    element.addEventListener("transitionend", transitionEndCallback);
  }
  function cancel() {
    callback?.();
  }
  function getCallback() {
    return callback;
  }
  return { transition, cancel, getCallback };
}
