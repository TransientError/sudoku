"use-client";

import { Updater, useImmer } from "use-immer";
import SudokuCell from "./sudoku-cell";
import { createContext } from "react";
import {
  CellMode,
  CellState,
  Coordinate,
  GameState,
  Grid,
  State,
  createInitialState,
  moveToSolving,
  resetBoard,
  setTestBoard,
  updateOptions,
  mapToBox,
  updateMatchHighlights,
  highlightPointers,
} from "./state";

export default function App() {
  const [state, updateState] = useImmer<State>({
    gameState: GameState.Input,
    grid: Array.from({ length: 9 }, (_, y) =>
      Array.from({ length: 9 }, (_, x) => createInitialState(x, y)),
    ),
    invalid: null,
    highlightPointer: 0,
  });

  function handleSubmit() {
    switch (state.gameState) {
      case GameState.Input: {
        updateState(moveToSolving);
        break;
      }
      case GameState.Solving: {
        alert(displayValidity(state.invalid == null));
      }
    }
  }

  function handleTestBoard() {
    updateState(setTestBoard);
  }

  function handleResetBoard() {
    updateState(resetBoard);
  }

  function handleCalculateOptions() {
    updateState((d: State) => {
      updateOptions(d, calculateOptions(d.grid));
    });
  }

  function handleFindHiddenSingles() {
    updateState((d: State) => {
      const matchResults = findHiddenSingles(d.grid);
      if (matchResults != null) {
        const [coords, match] = matchResults;
        updateMatchHighlights(d, [coords], match);
      } else {
        alert("None found");
      }
    });
  }

  const handleHighlightPointers = (i: number) => () => {
    updateState((d: State) => {
      highlightPointers(d, i);
    });
  };

  return (
    <StateContext.Provider value={{ state, updateState }}>
      <div className="table aspect-square border border-black h-3/4">
        <div className="relative table-caption -top-2">
          <div className=" flex gap-3 items-center justify-center text-xl">
            <button className="button" onClick={handleSubmit}>
              {state.gameState === GameState.Input ? "Start" : "Check"}
            </button>
            <button className="button" onClick={handleTestBoard}>
              Insert test board
            </button>
            <button className="button" onClick={handleResetBoard}>
              Reset
            </button>
          </div>
        </div>
        {Array.from({ length: 9 }, (_, y) => (
          <div key={y} className="sudoku--row">
            {Array.from({ length: 9 }, (_, x) => (
              <SudokuCell
                x={x}
                y={y}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-y-2 w-20 xl:w-auto">
        <button className="button col-span-3" onClick={handleCalculateOptions}>
          Calculate options
        </button>
        <button className="button col-span-3" onClick={handleFindHiddenSingles}>
          Hidden singles
        </button>
        {Array.from({ length: 9 }, (_, i) => (
          <button
            className="button col-span-1"
            onClick={handleHighlightPointers(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </StateContext.Provider>
  );
}

function accumulateOptions(arr: CellState[]): Map<number, CellState[]> {
  const result = new Map<number, CellState[]>(
    Array.from({ length: 9 }, (_, i) => [i + 1, []]),
  );
  for (const cs of arr) {
    if (cs.mode !== CellMode.Set) {
      for (const opt of cs.options) {
        result.get(opt)!.push(cs);
      }
    }
  }
  return result;
}

export function findNakedPairs(
  grid: Grid,
): [Coordinate, Coordinate, MatchType] | null {
  for (const row of grid) {
    const counts = accumulateOptions(row);
    for (const cs of counts.values()) {
      let found: CellState[][] = [];
      if (cs.length === 2) {
        found.push(cs);
      }
    }
  }

  const [cols, boxes] = generateColsAndBoxes(grid);

  for (const col of cols) {
    const counts = accumulateOptions(col);
    for (const cs of counts.values()) {
      if (cs.length === 2) {
        return [cs[0].coords, cs[1].coords, MatchType.Col];
      }
    }
  }

  for (const box of boxes) {
    const counts = accumulateOptions(box);
    for (const cs of counts.values()) {
      if (cs.length === 2) {
        return [cs[0].coords, cs[1].coords, MatchType.Box];
      }
    }
  }

  return null;
}

export function findHiddenSingles(grid: Grid): [Coordinate, MatchType] | null {
  for (const row of grid) {
    const counts = accumulateOptions(row);
    for (const [_, coords] of counts) {
      if (coords.length === 1) {
        return [coords[0].coords, MatchType.Row];
      }
    }
  }

  const [cols, boxes] = generateColsAndBoxes(grid);

  for (const col of cols) {
    const counts = accumulateOptions(col);
    for (const [_, coords] of counts) {
      if (coords.length === 1) {
        return [coords[0].coords, MatchType.Col];
      }
    }
  }

  for (const box of boxes) {
    const counts = accumulateOptions(box);
    for (const [_, coords] of counts) {
      if (coords.length === 1) {
        return [coords[0].coords, MatchType.Box];
      }
    }
  }

  return null;
}

function generateCols(grid: Grid): CellState[][] {
  const result: CellState[][] = Array.from({ length: 9 }, (_, _i) => []);

  for (let y = 0; y < 9; ++y) {
    for (let x = 0; x < 9; ++x) {
      const val = grid[y][x];
      result[x].push(val);
    }
  }

  return result;
}

function generateBoxes(grid: Grid): CellState[][] {
  const result: CellState[][] = Array.from({ length: 9 }, (_, _i) => []);

  for (let y = 0; y < 9; ++y) {
    for (let x = 0; x < 9; ++x) {
      const val = grid[y][x];
      result[mapToBox(x, y)].push(val);
    }
  }

  return result;
}

function generateColsAndBoxes(grid: Grid): [CellState[][], CellState[][]] {
  const cols: CellState[][] = Array.from({ length: 9 }, (_, _i) => []);
  const boxes: CellState[][] = Array.from({ length: 9 }, (_, _i) => []);

  for (let y = 0; y < 9; ++y) {
    for (let x = 0; x < 9; ++x) {
      const val = grid[y][x];
      cols[x].push(val);
      boxes[mapToBox(x, y)].push(val);
    }
  }

  return [cols, boxes];
}

export enum MatchType {
  Row,
  Box,
  Col,
}

export const StateContext = createContext<AppContext | null>(null);
type AppContext = {
  state: State;
  updateState: Updater<State>;
};

export function checkGrid(g: Grid): [Coordinate, Coordinate] | null {
  const boxes = Array.from({ length: 9 }, () => new Map<number, Coordinate>());
  const cols = Array.from({ length: 9 }, () => new Map<number, Coordinate>());
  for (let y = 0; y < 9; ++y) {
    const row = new Map<number, Coordinate>();
    for (let x = 0; x < 9; ++x) {
      const val = g[y][x];
      if (val.v !== 0) {
        if (!row.has(val.v)) {
          row.set(val.v, val.coords);
        } else {
          return [val.coords, row.get(val.v)!];
        }
        const col = cols[x];
        if (!col.has(val.v)) {
          col.set(val.v, val.coords);
        } else {
          return [val.coords, col.get(val.v)!];
        }
        const box = boxes[mapToBox(x, y)];
        if (!box.has(val.v)) {
          box.set(val.v, val.coords);
        } else {
          return [val.coords, box.get(val.v)!];
        }
      }
    }
  }
  return null;
}

function displayValidity(b: boolean): string {
  return b ? "Valid" : "Invalid";
}

export function calculateOptions(grid: Grid): number[][][] {
  const rows: Set<number>[] = Array.from(
    { length: 9 },
    () => new Set<number>(),
  );
  const boxes: Set<number>[] = Array.from(
    { length: 9 },
    () => new Set<number>(),
  );
  const cols: Set<number>[] = Array.from(
    { length: 9 },
    () => new Set<number>(),
  );

  for (let y = 0; y < 9; ++y) {
    for (let x = 0; x < 9; ++x) {
      const val = grid[y][x];
      if (val.v !== 0) {
        rows[y].add(val.v);
        boxes[mapToBox(x, y)].add(val.v);
        cols[x].add(val.v);
      }
    }
  }

  const result: number[][][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => []),
  );

  for (let y = 0; y < 9; ++y) {
    for (let x = 0; x < 9; ++x) {
      const val = grid[y][x];
      if (val.options.length == 0 && val.mode != CellMode.Set) {
        const options = result[y][x];
        for (let o = 1; o < 10; ++o) {
          if (
            !rows[y].has(o) &&
            !cols[x].has(o) &&
            !boxes[mapToBox(x, y)].has(o)
          ) {
            options.push(o);
          }
        }
      }
    }
  }

  return result;
}
