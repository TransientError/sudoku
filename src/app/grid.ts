// @ts-ignore
import * as G from "generatorics";

export enum CellMode {
  Set,
  Input,
  Options,
}

export type Coordinate = [number, number];

export enum Highlight {
  None,
  Group,
  Critical,
}

export type CellState = {
  v: number;
  mode: CellMode;
  coords: Coordinate;
  options: number[];
  highlight: Highlight;
};

export type Grid = CellState[][];

export enum MatchType {
  Row,
  Box,
  Col,
}

export const SAMPLE_HARD_GRID = [
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

export default {
  checkGrid(g: Grid): [Coordinate, Coordinate] | null {
    const boxes = Array.from(
      { length: 9 },
      () => new Map<number, Coordinate>(),
    );
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
  },
  getBox(x: number, y: number): Coordinate[] {
    return INDEX_TO_BOX.get(mapToBox(x, y))!;
  },
  generateBoxes(grid: Grid): CellState[][] {
    const result: CellState[][] = Array.from({ length: 9 }, (_, _i) => []);

    for (let y = 0; y < 9; ++y) {
      for (let x = 0; x < 9; ++x) {
        const val = grid[y][x];
        result[mapToBox(x, y)].push(val);
      }
    }

    return result;
  },
  generateCols(grid: Grid): CellState[][] {
    const result: CellState[][] = Array.from({ length: 9 }, (_, _i) => []);

    for (let y = 0; y < 9; ++y) {
      for (let x = 0; x < 9; ++x) {
        const val = grid[y][x];
        result[x].push(val);
      }
    }

    return result;
  },
  generateColsAndBoxes(grid: Grid): [CellState[][], CellState[][]] {
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
  },
  calculateOptions(grid: Grid): number[][][] {
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
  },
  findNakedGroupInUnits(
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
  },
  findHiddenSingles(grid: Grid): [Coordinate, MatchType] | null {
    for (const row of grid) {
      const counts = accumulateOptions(row);
      for (const [_, coords] of counts) {
        if (coords.length === 1) {
          return [coords[0].coords, MatchType.Row];
        }
      }
    }

    const [cols, boxes] = this.generateColsAndBoxes(grid);

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
  },
  findHiddenGroupsInUnits(
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
      const mComb = this.findMatchingCombination(found, groupSize);
      if (mComb != null) {
        return mComb;
      }
    }
    return null;
  },
  transformCoords([x, y]: Coordinate): string {
    return x.toString() + y.toString();
  },
  coordsAreSame(arr: Coordinate[][]): boolean {
    const result = new Set<string>();
    for (const coords of arr) {
      for (const coordPair of coords) {
        result.add(this.transformCoords(coordPair));
      }
    }
    return result.size == arr[0].length;
  },
  findMatchingCombination(
    found: CellState[][],
    combSize: number,
  ): Coordinate[] | null {
    for (const comb of G.combination(found, combSize) as Generator<
      CellState[][]
    >) {
      if (this.coordsAreSame(comb.map((css) => css.map((cs) => cs.coords)))) {
        return comb[0].map((cs) => cs.coords);
      }
    }
    return null;
  },
};

function mapToBox(x: number, y: number): number {
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
const INDEX_TO_BOX = new Map<number, Coordinate[]>([
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
