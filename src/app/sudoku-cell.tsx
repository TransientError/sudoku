import { FormEvent } from "react";
import OptionTable from "./option-table";
import { useStateStore } from "./zustand";
import { CellMode, CellState, Coordinate, default as GridUtils, Highlight } from "./grid";
import equal from "fast-deep-equal/react";

export default function SudokuCell({ x, y }: { x: number; y: number }) {
  const grid = useStateStore((s) => s.grid, equal);
  const invalid = useStateStore((s) => s.invalid, equal);
  const value = grid[y][x];

  const updateCoordinate = useStateStore(s => s.updateCoordinate);
  const setMode = useStateStore(s => s.setMode);

  function handleOnChange(e: FormEvent<HTMLInputElement>) {
    const element = e.target as HTMLInputElement;

    const input = element.value;
    const [valid, parsedInput] = validateCellInput(input);
    if (!valid) {
      return;
    }

    const invalid = GridUtils.checkGrid(grid);

    updateCoordinate(x, y, parsedInput, invalid);
  }

  function handleUnset() {
    if (value.options.length > 0) {
      setMode(x, y, CellMode.Options);
    }
  }

  function displayCell(mode: CellMode) {
    switch (mode) {
      case CellMode.Set: {
        return (
          <p className="font-bold" onContextMenu={handleUnset}>
            {value.v === 0 ? "" : value.v}
          </p>
        );
      }
      case CellMode.Input: {
        return (
          <div
            className={
              displayInvalid(invalid, value) ? "border border-red-500" : ""
            }
          >
            <input
              className="w-full aspect-square text-center invalid:border invalid:border-red-500"
              pattern="[1-9]|^$"
              value={displayNumber(value.v)}
              onChange={handleOnChange}
            />
          </div>
        );
      }
      case CellMode.Options: {
        return <OptionTable sx={x} sy={y} />;
      }
    }
  }

  return (
    <div
      key={x}
      className={calculateClassSet(value.highlight)}
      style={(y + 1) % 3 === 0 ? { borderBottom: "1px solid black" } : {}}
    >
      {displayCell(value.mode)}
    </div>
  );
}

function displayInvalid(
  invalid: [Coordinate, Coordinate] | null,
  cell: CellState,
): boolean {
  if (invalid == null) {
    return false;
  }

  const [cx, cy] = cell.coords;
  return invalid.some(([mx, my]) => mx === cx && my === cy);
}

function calculateClassSet(highlight: Highlight) {
  let common =
    "sudoku--cell table-cell border text-center align-middle text-xl";
  if (highlight === Highlight.Group) {
    common += " border-emerald-400";
  } else if (highlight === Highlight.Critical) {
    common += " border-indigo-400";
  }

  return common;
}

function displayNumber(n: number): string {
  if (n === 0) {
    return "";
  }
  if (n > 0 && n < 10) {
    return n.toString();
  }
  throw Error(`Invalid sudoku number ${n}`);
}

function validateCellInput(s: string): [boolean, number] {
  if (s === "") {
    return [true, 0];
  }
  const parsed = parseInt(s);
  return [parsed != null && parsed > 0 && parsed < 10, parsed];
}

