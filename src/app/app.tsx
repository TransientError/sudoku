"use-client";

import SudokuCell from "./sudoku-cell";
import { useRef } from "react";
import { Coordinate, default as GridUtils, MatchType } from "./grid";
import { GameState, useStateStore } from "./zustand";
import equal from "fast-deep-equal";

export default function App() {
  const gameState = useStateStore((s) => s.gameState);
  const invalid = useStateStore((s) => s.invalid, equal);
  const grid = useStateStore((s) => s.grid, equal);

  const moveToSolving = useStateStore(s => s.moveToSolving);
  const setTestBoard = useStateStore((s) => s.setTestBoard);
  const resetBoard = useStateStore((s) => s.resetBoard);
  const updateOptions = useStateStore((s) => s.updateOptions);
  const updateMatchHighlights = useStateStore((s) => s.updateMatchHighlights);
  const highlightPointers = useStateStore((s) => s.highlightPointers);

  const groupMembers = useRef(new Set<string>());

  function handleSubmit() {
    switch (gameState) {
      case GameState.Input: {
        moveToSolving();
        break;
      }
      case GameState.Solving: {
        alert(displayValidity(invalid == null));
      }
    }
  }

  function handleCalculateOptions() {
    updateOptions(GridUtils.calculateOptions(grid));
  }

  function handleFindHiddenSingles() {
    const matchResults = GridUtils.findHiddenSingles(grid);
    if (matchResults != null) {
      const [coords, match] = matchResults;
      updateMatchHighlights([coords], match);
    } else {
      alert("None found");
    }
  }

  function findHiddenGroups(
    groupSize: number,
  ): [Coordinate[], MatchType] | null {
    const mGroupRows = GridUtils.findHiddenGroupsInUnits(grid, groupSize);
    if (
      mGroupRows != null &&
      !groupMembers.current.has(GridUtils.transformCoords(mGroupRows[0]))
    ) {
      mGroupRows.forEach((c) =>
        groupMembers.current.add(GridUtils.transformCoords(c)),
      );
      return [mGroupRows, MatchType.Row];
    }

    const [cols, boxes] = GridUtils.generateColsAndBoxes(grid);

    const mGroupCols = GridUtils.findHiddenGroupsInUnits(cols, groupSize);
    if (
      mGroupCols != null &&
      !groupMembers.current.has(GridUtils.transformCoords(mGroupCols[0]))
    ) {
      mGroupCols.forEach((c) =>
        groupMembers.current.add(GridUtils.transformCoords(c)),
      );
      return [mGroupCols, MatchType.Col];
    }

    const mGroupBoxes = GridUtils.findHiddenGroupsInUnits(boxes, groupSize);
    if (
      mGroupBoxes != null &&
      !groupMembers.current.has(GridUtils.transformCoords(mGroupBoxes[0]))
    ) {
      mGroupBoxes.forEach((c) =>
        groupMembers.current.add(GridUtils.transformCoords(c)),
      );
      return [mGroupBoxes, MatchType.Box];
    }

    return null;
  }

  const handleFindHiddenGroups = (groupSize: number) => () => {
    const matchResults = findHiddenGroups(groupSize);
    if (matchResults != null) {
      const [coordsArr, match] = matchResults;
      updateMatchHighlights(coordsArr, match);
    } else {
      alert("None found");
    }
  };

  function findNakedGroup(groupSize: number): Coordinate[] | null {
    const mRowComb = GridUtils.findNakedGroupInUnits(grid, groupSize);
    if (
      mRowComb != null &&
      !groupMembers.current.has(GridUtils.transformCoords(mRowComb[0]))
    ) {
      mRowComb.forEach((c) =>
        groupMembers.current.add(GridUtils.transformCoords(c)),
      );
      return mRowComb;
    }

    const [cols, boxes] = GridUtils.generateColsAndBoxes(grid);

    const mColComb = GridUtils.findNakedGroupInUnits(cols, groupSize);
    if (
      mColComb != null &&
      !groupMembers.current.has(GridUtils.transformCoords(mColComb[0]))
    ) {
      mColComb.forEach((c) =>
        groupMembers.current.add(GridUtils.transformCoords(c)),
      );
      return mColComb;
    }

    const mBoxComb = GridUtils.findNakedGroupInUnits(boxes, groupSize);
    if (
      mBoxComb != null &&
      !groupMembers.current.has(GridUtils.transformCoords(mBoxComb[0]))
    ) {
      mBoxComb.forEach((c) =>
        groupMembers.current.add(GridUtils.transformCoords(c)),
      );
      return mBoxComb;
    }

    return null;
  }

  const handleFindNakedGroups = (groupSize: number) => () => {
    const matchResults = findNakedGroup(groupSize);
    if (matchResults != null) {
      updateMatchHighlights(matchResults);
    } else {
      alert("None found");
    }
  };

  const handleHighlightPointers = (i: number) => () => {
    highlightPointers(i);
  };

  return (
    <>
      <div className="table aspect-square border border-black h-3/4">
        <div className="relative table-caption -top-2">
          <div className=" flex gap-3 items-center justify-center text-xl">
            <button className="button" onClick={handleSubmit}>
              {gameState === GameState.Input ? "Start" : "Check"}
            </button>
            <button className="button" onClick={setTestBoard}>
              Insert test board
            </button>
            <button className="button" onClick={resetBoard}>
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
    </>
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

function displayValidity(b: boolean): string {
  return b ? "Valid" : "Invalid";
}
