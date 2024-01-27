"use-client";

import { Updater, useImmer } from "use-immer";
import SudokuCell from "./sudoku-cell";
import { createContext, useRef } from "react";
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
// @ts-ignore
import * as G from "generatorics";

export default function App() {
  const [state, updateState] = useImmer<State>({
    gameState: GameState.Input,
    grid: Array.from({ length: 9 }, (_, y) =>
      Array.from({ length: 9 }, (_, x) => createInitialState(x, y)),
    ),
    invalid: null,
    highlightPointer: 0,
  });

  const groupMembers = useRef(new Set<string>());

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
    updateState((d: State) => void updateOptions(d, calculateOptions(d.grid)));
  }

  function handleFindHiddenSingles() {
    const matchResults = findHiddenSingles(state.grid);
    if (matchResults != null) {
      const [coords, match] = matchResults;
      updateState((d) => void updateMatchHighlights(d, [coords], match));
    } else {
      alert("None found");
    }
  }

  function findHiddenGroups(
    grid: Grid,
    groupSize: number,
  ): [Coordinate[], MatchType] | null {
    const mGroupRows = findHiddenGroupsInUnits(grid, groupSize);
    if (
      mGroupRows != null &&
      !groupMembers.current.has(transformCoords(mGroupRows[0]))
    ) {
      mGroupRows.forEach((c) => groupMembers.current.add(transformCoords(c)));
      return [mGroupRows, MatchType.Row];
    }

    const [cols, boxes] = generateColsAndBoxes(grid);

    const mGroupCols = findHiddenGroupsInUnits(cols, groupSize);
    if (
      mGroupCols != null &&
      !groupMembers.current.has(transformCoords(mGroupCols[0]))
    ) {
      mGroupCols.forEach((c) => groupMembers.current.add(transformCoords(c)));
      return [mGroupCols, MatchType.Col];
    }

    const mGroupBoxes = findHiddenGroupsInUnits(boxes, groupSize);
    if (
      mGroupBoxes != null &&
      !groupMembers.current.has(transformCoords(mGroupBoxes[0]))
    ) {
      mGroupBoxes.forEach((c) => groupMembers.current.add(transformCoords(c)));
      return [mGroupBoxes, MatchType.Box];
    }

    return null;
  }

  const handleFindHiddenGroups = (groupSize: number) => () => {
    const matchResults = findHiddenGroups(state.grid, groupSize);
    if (matchResults != null) {
      const [coordsArr, match] = matchResults;
      updateState((d) => void updateMatchHighlights(d, coordsArr, match));
    } else {
      alert("None found");
    }
  };

  function findNakedGroup(grid: Grid, groupSize: number): Coordinate[] | null {
    const mRowComb = findNakedGroupInUnits(grid, groupSize);
    if (
      mRowComb != null &&
      !groupMembers.current.has(transformCoords(mRowComb[0]))
    ) {
      mRowComb.forEach((c) => groupMembers.current.add(transformCoords(c)));
      return mRowComb;
    }

    const [cols, boxes] = generateColsAndBoxes(grid);

    const mColComb = findNakedGroupInUnits(cols, groupSize);
    if (
      mColComb != null &&
      !groupMembers.current.has(transformCoords(mColComb[0]))
    ) {
      mColComb.forEach((c) => groupMembers.current.add(transformCoords(c)));
      return mColComb;
    }

    const mBoxComb = findNakedGroupInUnits(boxes, groupSize);
    if (
      mBoxComb != null &&
      !groupMembers.current.has(transformCoords(mBoxComb[0]))
    ) {
      mBoxComb.forEach((c) => groupMembers.current.add(transformCoords(c)));
      return mBoxComb;
    }

    return null;
  }

  const handleFindNakedGroups = (groupSize: number) => () => {
    const matchResults = findNakedGroup(state.grid, groupSize);
    if (matchResults != null) {
      updateState((d) => updateMatchHighlights(d, matchResults));
    } else {
      alert("None found");
    }
  };

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
              <SudokuCell x={x} y={y} />
            ))}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-y-2 w-auto">
        <button className="button col-span-3" onClick={handleCalculateOptions}>
          Calculate options
        </button>
        {Array.from({ length: 9 }, (_, i) => (
          <button
            className="button col-span-1"
            onClick={handleHighlightPointers(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <button
            className="button col-span-3"
            onClick={
              i + 1 === 1
                ? handleFindHiddenSingles
                : handleFindHiddenGroups(i + 1)
            }
          >
            <p className="mx-1">Hidden {displayHiddenGroups(i + 1)}</p>
          </button>
        ))}
        {Array.from({ length: 3 }, (_, i) => (
          <button
            className="button col-span-3"
            onClick={handleFindNakedGroups(i + 2)}
          >
            Naked {displayHiddenGroups(i + 2)}
          </button>
        ))}
      </div>
    </StateContext.Provider>
  );
}

function displayHiddenGroups(n: number) {
  switch (n) {
    case 1:
      return "singles";
    case 2:
      return "pairs";
    case 3:
      return "triplets";
    case 4:
      return "quadruplets";
  }
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

const transformCoords = ([x, y]: Coordinate): string =>
  x.toString() + y.toString();

function coordsAreSame(arr: Coordinate[][]): boolean {
  const result = new Set<string>();
  for (const coords of arr) {
    for (const coordPair of coords) {
      result.add(transformCoords(coordPair));
    }
  }

  return result.size == arr[0].length;
}

function findCandidates(
  counts: Map<number, CellState[]>,
  groupSize: number,
): CellState[][] {
  const result = [];
  for (const cs of counts.values()) {
    if (cs.length === groupSize) {
      result.push(cs);
    }
  }
  return result;
}

function findMatchingCombination(
  found: CellState[][],
  combSize: number,
): Coordinate[] | null {
  for (const comb of G.combination(found, combSize) as Generator<
    CellState[][]
  >) {
    if (coordsAreSame(comb.map((css) => css.map((cs) => cs.coords)))) {
      return comb[0].map((cs) => cs.coords);
    }
  }
  return null;
}

function findHiddenGroupsInUnits(
  units: CellState[][],
  groupSize: number,
): Coordinate[] | null {
  for (const unit of units) {
    const unsetCells = unit.filter((c) => c.mode !== CellMode.Set);
    if (unsetCells.length <= groupSize) {
      continue;
    }
    const counts = accumulateOptions(unsetCells);
    const found = findCandidates(counts, groupSize);
    const mComb = findMatchingCombination(found, groupSize);
    if (mComb != null) {
      return mComb;
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

function findNakedGroupInUnits(
  units: CellState[][],
  groupSize: number,
): Coordinate[] | null {
  for (const unit of units) {
    const unsetCells = unit.filter((c) => c.mode !== CellMode.Set);
    if (unsetCells.length <= groupSize) {
      continue;
    }

    for (const comb of G.combination(unsetCells, groupSize) as Generator<
      CellState[]
    >) {
      const optionUnion = new Set<number>();
      for (const candidate of comb) {
        for (const opt of candidate.options) {
          optionUnion.add(opt);
        }
      }
      if (optionUnion.size === groupSize) {
        return comb.map((cs) => cs.coords);
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
