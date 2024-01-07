import { SegmentedControl } from "../components/SegmentedControl";

export function SegmentedControlRoute() {
  return (
    <>
      <h1>Segmented Control demo</h1>

      <SegmentedControl items={items} />
    </>
  );
}
const items = [
  {
    label: "Car",
    value: "car",
  },
  {
    label: "Public Transport",
    value: "public_transport",
  },
  {
    label: "Cycle",
    value: "cycle",
  },
];
