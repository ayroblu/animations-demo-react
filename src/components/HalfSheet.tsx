import { cn } from "../lib/utils";
import style from "./HalfSheet.module.css";

type Props = {
  onDismiss: () => void;
  dialogClassName?: string;
};
export function HalfSheet(props: Props) {
  const { dialogClassName, onDismiss } = props;
  return (
    <div
      className={style.cover}
      onClick={(e) => {
        if (e.target == e.currentTarget) {
          onDismiss();
        }
      }}
    >
      <div className={cn(style.halfSheet, dialogClassName)}>
        <div className={style.halfSheetHeader}>
          <div></div>
          <div>
            <h3>Title</h3>
          </div>
          <div>
            <button onClick={onDismiss}>Close</button>
          </div>
        </div>
        <div className={style.content}>
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
        </div>
      </div>
    </div>
  );
}
