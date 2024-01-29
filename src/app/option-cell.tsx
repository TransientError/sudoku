import { MouseEvent } from "react";
import { useStateStore } from "./zustand";
import { shallow } from "zustand/shallow";

export default function OptionCell({
  sx,
  sy,
  ox,
  oy,
}: {
  sx: number;
  sy: number;
  ox: number;
  oy: number;
}) {
  const options = useStateStore((s) => s.grid[sy][sx].options, shallow);
  const highlightPointer = useStateStore((s) => s.highlightPointer);

  const removeOptions = useStateStore(s => s.removeOptions);
  const addOption = useStateStore(s => s.addOption);
  const setCell = useStateStore(s => s.setCell);

  function handleOnClick() {
    const toChange = calculateDisplayNumber(ox, oy);
    if (options.includes(toChange)) {
      removeOptions(sx, sy, toChange);
    } else {
      addOption(sx, sy, toChange);
    }
  }

  function handleSetCell(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setCell(sx, sy, calculateDisplayNumber(ox, oy));
  }

  const display = displayOption(ox, oy, options);

  return (
    <div
      className={
        "table-cell text-xs text-center align-middle w-1/3" +
        (calculateDisplayNumber(ox, oy) == highlightPointer && display !== ""
          ? " bg-purple-500 rounded-full"
          : "")
      }
      key={ox}
      onClick={handleOnClick}
      onContextMenu={handleSetCell}
    >
      {display}
    </div>
  );
}

function displayOption(x: number, y: number, options: number[]): string {
  const toDisplay = calculateDisplayNumber(x, y);
  if (options.includes(toDisplay)) {
    return toDisplay.toString();
  } else {
    return "";
  }
}

const calculateDisplayNumber = (x: number, y: number): number => x + 3 * y + 1;
export const displayNumberToCoords = (n: number) => [(n - 1) % 3, (n - 1) / 3];

