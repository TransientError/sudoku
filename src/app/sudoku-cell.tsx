import { FormEvent, useContext } from "react";
import { StateContext } from "./app";
import {
  CellMode,
  CellState,
  Coordinate,
  Highlight,
  updateCoordinate,
} from "./state";
import OptionTable from "./option-table";

export default function SudokuCell({ x, y }: CellProps) {
  const { state, updateState } = useContext(StateContext)!;
  const value = state.grid[y][x];

  function handleOnChange(e: FormEvent<HTMLInputElement>) {
    const element = e.target as HTMLInputElement;

    const input = element.value;
    const [valid, parsedInput] = validateCellInput(input);
    if (!valid) {
      return;
    }

    updateState((s) => {
      updateCoordinate(s, x, y, parsedInput);
    });
  }

  function displayCell(mode: CellMode) {
    switch (mode) {
      case CellMode.Set: {
        return <p className="font-bold">{value.v === 0 ? "" : value.v}</p>;
      }
      case CellMode.Input: {
        return (
          <div
            className={
              displayInvalid(state.invalid, value)
                ? "border border-red-500"
                : ""
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

type CellProps = {
  x: number;
  y: number;
};
