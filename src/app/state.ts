import assert from "assert";
import { MatchType, checkGrid } from "./app";

export enum GameState {
  Input,
  Solving,
}

export enum Highlight {
  None,
  Group,
  Critical,
}

export const createInitialState = (x: number, y: number): CellState => ({
  v: 0,
  mode: CellMode.Input,
  coords: [x, y],
  options: [],
  highlight: Highlight.None,
});

export function moveToSolving(s: State) {
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

export function setTestBoard(s: State) {
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

export function resetBoard() {
  return INITIAL_STATE;
}

const INITIAL_STATE = {
  gameState: GameState.Input,
  grid: Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x) => createInitialState(x, y)),
  ),
  invalid: null,
  highlightPointers: 0,
};

export function updateCoordinate(s: State, x: number, y: number, v: number) {
  s.grid[y][x].v = v;
  s.invalid = checkGrid(s.grid);
}

export function updateOptions(s: State, options: number[][][]) {
  for (let y = 0; y < 9; ++y) {
    for (let x = 0; x < 9; ++x) {
      const val = s.grid[y][x];
      if (val.mode !== CellMode.Set) {
        val.options = options[y][x];
        val.mode = CellMode.Options;
      }
    }
  }
}

export function removeOption(s: State, sx: number, sy: number, v: number) {
  const options = s.grid[sy][sx].options;
  options.splice(options.indexOf(v), 1);
}

export function addOption(s: State, sx: number, sy: number, v: number) {
  s.grid[sy][sx].options.push(v);
}

export function setCell(s: State, x: number, y: number, opt: number) {
  const cellState = s.grid[y][x];
  cellState.v = opt;
  cellState.mode = CellMode.Set;

  for (const rowCell of s.grid[y]) {
    rowCell.highlight = Highlight.None;
    if (rowCell.mode != CellMode.Set && rowCell.options.includes(cellState.v)) {
      remove(rowCell.options, cellState.v);
    }
  }

  for (let i = 0; i < 9; ++i) {
    const colCell = s.grid[i][x];
    colCell.highlight = Highlight.None;
    if (colCell.mode != CellMode.Set && colCell.options.includes(cellState.v)) {
      remove(colCell.options, cellState.v);
    }
  }

  for (const [bx, by] of INDEX_TO_BOX.get(mapToBox(x, y))!) {
    const boxCell = s.grid[by][bx];
    boxCell.highlight = Highlight.None;
    if (boxCell.mode != CellMode.Set && boxCell.options.includes(cellState.v)) {
      remove(boxCell.options, cellState.v);
    }
  }
}

function remove<T>(arr: T[], v: T): void {
  if (arr.includes(v)) {
    arr.splice(arr.indexOf(v), 1);
  }
}

export function mapToBox(x: number, y: number): number {
  if (x < 3 && y < 3) {
    return 0;
  }
  if (x < 6 && y < 3) {
    return 1;
  }
  if (y < 3) {
    return 2;
  }
  if (x < 3 && y < 6) {
    return 3;
  }
  if (x < 6 && y < 6) {
    return 4;
  }
  if (y < 6) {
    return 5;
  }
  if (x < 3) {
    return 6;
  }
  if (x < 6) {
    return 7;
  }
  return 8;
}

export const INDEX_TO_BOX = new Map<number, Coordinate[]>([
  [
    0,
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  ],
  [
    1,
    [
      [3, 0],
      [4, 0],
      [5, 0],
      [3, 1],
      [4, 1],
      [5, 1],
      [3, 2],
      [4, 2],
      [5, 2],
    ],
  ],
  [
    2,
    [
      [6, 0],
      [7, 0],
      [8, 0],
      [6, 1],
      [7, 1],
      [8, 1],
      [6, 2],
      [7, 2],
      [8, 2],
    ],
  ],
  [
    3,
    [
      [0, 3],
      [1, 3],
      [2, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [0, 5],
      [1, 5],
      [2, 5],
    ],
  ],
  [
    4,
    [
      [3, 3],
      [4, 3],
      [5, 3],
      [3, 4],
      [4, 4],
      [5, 4],
      [3, 5],
      [4, 5],
      [5, 5],
    ],
  ],
  [
    5,
    [
      [6, 3],
      [7, 3],
      [8, 3],
      [6, 4],
      [7, 4],
      [8, 4],
      [6, 5],
      [7, 5],
      [8, 5],
    ],
  ],
  [
    6,
    [
      [0, 6],
      [1, 6],
      [2, 6],
      [0, 7],
      [1, 7],
      [2, 7],
      [0, 8],
      [1, 8],
      [2, 8],
    ],
  ],
  [
    7,
    [
      [3, 6],
      [4, 6],
      [5, 6],
      [3, 7],
      [4, 7],
      [5, 7],
      [3, 8],
      [4, 8],
      [5, 8],
    ],
  ],
  [
    8,
    [
      [6, 6],
      [7, 6],
      [8, 6],
      [6, 7],
      [7, 7],
      [8, 7],
      [6, 8],
      [7, 8],
      [8, 8],
    ],
  ],
]);

export function updateMatchHighlights(s: State, coordss: Coordinate[], match: MatchType) {
  assert(coordss.length > 0);

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
      for (const [x1, y1] of INDEX_TO_BOX.get(mapToBox(x, y))!) {
        const val = s.grid[y1][x1];
        val.highlight = Highlight.Group;
      }
      break;
  }
  for (const coords of coordss) {
      const [x1, y1] = coords;
      s.grid[y1][x1].highlight = Highlight.Critical;
    }
}

export function highlightPointers(s: State, n: number) {
  if (s.highlightPointer !== n) {
    s.highlightPointer = n;
  } else {
    s.highlightPointer = 0;
  }
}

export type State = {
  gameState: GameState;
  grid: Grid;
  invalid: [Coordinate, Coordinate] | null;
  highlightPointer: number;
};

export type Grid = CellState[][];

export enum CellMode {
  Set,
  Input,
  Options,
}

export type CellState = {
  v: number;
  mode: CellMode;
  coords: Coordinate;
  options: number[];
  highlight: Highlight;
};

export type Coordinate = [number, number];

const SAMPLE_HARD_GRID = [
  [0, 0, 6, 8, 0, 2, 0, 0, 5],
  [0, 0, 0, 0, 3, 0, 7, 0, 0],
  [0, 0, 0, 0, 0, 0, 8, 2, 4],
  [1, 0, 0, 4, 8, 0, 0, 0, 0],
  [0, 9, 0, 0, 0, 0, 0, 0, 0],
  [0, 3, 0, 0, 1, 0, 2, 5, 0],
  [4, 5, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 6, 0],
  [0, 0, 0, 1, 7, 0, 0, 3, 0],
];
