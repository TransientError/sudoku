import { immer } from "zustand/middleware/immer";
import {
  CellMode,
  CellState,
  Coordinate,
  Grid,
  Highlight,
  SAMPLE_HARD_GRID,
  default as GridUtils,
  MatchType,
} from "./grid";
import assert from "assert";
import { createWithEqualityFn } from "zustand/traditional";

export enum GameState {
  Input,
  Solving,
}

export type State = {
  gameState: GameState;
  grid: Grid;
  invalid: [Coordinate, Coordinate] | null;
  highlightPointer: number;
};

const INITIAL_STATE = {
  gameState: GameState.Input,
  grid: Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x) => createInitialState(x, y)),
  ),
  invalid: null,
  highlightPointer: 0,
};

export type Actions = {
  moveToSolving: () => void;
  setTestBoard: () => void;
  resetBoard: () => void;
  updateCoordinate: (
    x: number,
    y: number,
    v: number,
    invalid: [Coordinate, Coordinate] | null,
  ) => void;
  updateOptions: (options: number[][][]) => void;
  removeOptions: (sx: number, sy: number, v: number) => void;
  addOption: (sx: number, sy: number, v: number) => void;
  setCell: (x: number, y: number, opt: number) => void;
  setMode: (x: number, y: number, mode: CellMode) => void;
  updateMatchHighlights: (cordss: Coordinate[], match?: MatchType) => void;
  highlightPointers: (n: number) => void;
};

export const useStateStore = createWithEqualityFn<State & Actions>()(
  immer((set) => ({
    ...INITIAL_STATE,

    moveToSolving: () => set(moveToSolving),
    setTestBoard: () => set(setTestBoard),
    resetBoard: () => void set(INITIAL_STATE),
    updateCoordinate: (x, y, v, invalid) =>
      set(updateCoordinate(x, y, v, invalid)),
    updateOptions: (options) => set(updateOptions(options)),
    removeOptions: (sx, sy, v) => set(removeOption(sx, sy, v)),
    addOption: (sx, sy, v) => set(addOption(sx, sy, v)),
    setCell: (x, y, opt) => set(setCell(x, y, opt)),
    setMode: (x, y, mode) => set(setMode(x, y, mode)),
    updateMatchHighlights: (cordss, match) =>
      set(updateMatchHighlights(cordss, match)),
    highlightPointers: (n) => set(highlightPointers(n)),
  })),
);

function createInitialState(x: number, y: number): CellState {
  return {
    v: 0,
    mode: CellMode.Input,
    coords: [x, y],
    options: [],
    highlight: Highlight.None,
  };
}

function moveToSolving(s: State) {
  for (const row of s.grid) {
    for (const cell of row) {
      if (cell.v !== 0) {
        true;
        cell.mode = CellMode.Set;
      }
    }
  }
  s.gameState = GameState.Solving;
}

function setTestBoard(s: State) {
  let grid: Grid = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x) => createInitialState(x, y)),
  );
  for (let y = 0; y < 9; ++y) {
    for (let x = 0; x < 9; ++x) {
      const cell = grid[y][x];
      cell.v = SAMPLE_HARD_GRID[y][x];
      cell.mode = cell.v === 0 ? CellMode.Input : CellMode.Set;
    }
  }
  s.grid = grid;
  s.gameState = GameState.Solving;
}

const updateCoordinate = (
  x: number,
  y: number,
  v: number,
  invalid: [Coordinate, Coordinate] | null,
) =>
  function (s: State) {
    s.grid[y][x].v = v;
    s.invalid = invalid;
  };

const updateOptions = (options: number[][][]) =>
  function (s: State) {
    for (let y = 0; y < 9; ++y) {
      for (let x = 0; x < 9; ++x) {
        const val = s.grid[y][x];
        if (val.mode !== CellMode.Set) {
          val.options = options[y][x];
          val.mode = CellMode.Options;
        }
      }
    }
  };

const removeOption = (sx: number, sy: number, v: number) =>
  function (s: State) {
    const options = s.grid[sy][sx].options;
    remove(options, v);

    for (const row of s.grid) {
      for (const cs of row) {
        cs.highlight = Highlight.None;
      }
    }
  };

const addOption = (sx: number, sy: number, v: number) =>
  function (s: State) {
    s.grid[sy][sx].options.push(v);
  };

const setCell = (x: number, y: number, opt: number) =>
  function (s: State) {
    const cellState = s.grid[y][x];
    cellState.v = opt;
    cellState.mode = CellMode.Set;

    for (const rowCell of s.grid[y]) {
      rowCell.highlight = Highlight.None;
      if (
        rowCell.mode != CellMode.Set &&
        rowCell.options.includes(cellState.v)
      ) {
        remove(rowCell.options, cellState.v);
      }
    }

    for (let i = 0; i < 9; ++i) {
      const colCell = s.grid[i][x];
      colCell.highlight = Highlight.None;
      if (
        colCell.mode != CellMode.Set &&
        colCell.options.includes(cellState.v)
      ) {
        remove(colCell.options, cellState.v);
      }
    }

    for (const [bx, by] of GridUtils.getBox(x, y)) {
      const boxCell = s.grid[by][bx];
      boxCell.highlight = Highlight.None;
      if (
        boxCell.mode != CellMode.Set &&
        boxCell.options.includes(cellState.v)
      ) {
        remove(boxCell.options, cellState.v);
      }
    }
  };

function remove<T>(arr: T[], v: T): void {
  if (arr.includes(v)) {
    arr.splice(arr.indexOf(v), 1);
  }
}

const setMode = (x: number, y: number, mode: CellMode) =>
  function (s: State) {
    s.grid[y][x].mode = mode;
  };

const updateMatchHighlights = (coordss: Coordinate[], match?: MatchType) =>
  function (s: State) {
    assert(coordss.length > 0);

    for (const row of s.grid) {
      for (const cell of row) {
        cell.highlight = Highlight.None;
      }
    }

    const [x, y] = coordss[0];
    switch (match) {
      case MatchType.Row:
        for (const cs of s.grid[y]) {
          cs.highlight = Highlight.Group;
        }
        break;
      case MatchType.Col:
        for (let i = 0; i < 9; ++i) {
          const val = s.grid[i][x];
          val.highlight = Highlight.Group;
        }
        break;
      case MatchType.Box:
        for (const [x1, y1] of GridUtils.getBox(x, y)) {
          const val = s.grid[y1][x1];
          val.highlight = Highlight.Group;
        }
        break;
    }
    for (const coords of coordss) {
      const [x1, y1] = coords;
      s.grid[y1][x1].highlight = Highlight.Critical;
    }
  };

const highlightPointers = (n: number) =>
  function (s: State) {
    if (s.highlightPointer !== n) {
      s.highlightPointer = n;
    } else {
      s.highlightPointer = 0;
    }
  };
