import { MouseEvent, useContext } from "react";
import { StateContext } from "./app";
import { State, addOption, removeOption, setCell } from "./state";

export default function OptionCell({
  sx,
  sy,
  ox,
  oy,
}: OptionCellProps) {
  const { state, updateState } = useContext(StateContext)!;
  const options = state.grid[sy][sx].options;

  function handleOnClick() {
    const toChange = calculateDisplayNumber(ox, oy);
    if (options.includes(toChange)) {
      updateState((d: State) => {
        removeOption(d, sx, sy, toChange);
      });
    } else {
      updateState((d: State) => {
        addOption(d, sx, sy, toChange);
      });
    }
  }

  function handleSetCell(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    updateState((d) => {
      setCell(d, sx, sy, calculateDisplayNumber(ox, oy));
    });
  }

  const display = displayOption(ox, oy, options);

  return (
    <div
      className={
        "table-cell text-xs text-center align-middle w-1/3" +
        (calculateDisplayNumber(ox, oy) == state.highlightPointer &&
        display !== ""
          ? " bg-purple-500 rounded-full"
          : "")
      }
      key={ox}
      onClick={handleOnClick}
      onContextMenu={handleSetCell}
      onDoubleClick={handleSetCell}
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
const displayNumberToCoords = (n: number) => [(n - 1) % 3, (n - 1) / 3];

type OptionCellProps = {
  sx: number;
  sy: number;
  ox: number;
  oy: number;
};
