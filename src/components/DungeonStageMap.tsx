"use client";

import React, { useState, useEffect } from "react";

interface DungeonStageMapProps {
  floor?: number;
  children?: React.ReactNode;
}

export function DungeonStageMap({
  floor = 1,
  children,
}: DungeonStageMapProps) {
  const [fountainFrame, setFountainFrame] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFountainFrame((prev) => (prev + 1) % 3);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Cycle through 4 visual themes based on floor
  const themeVariant = ((floor - 1) % 4) + 1;

  const getThemeProps = () => {
    switch (themeVariant) {
      case 1:
        return {
          banner: "/assets/dungeon/decor/wall_banner_green.png",
          fountainColor: "green",
          hasFountain: false,
          hasColumn: true,
          columnImg: "/assets/dungeon/decor/column_wall.png",
          crateCount: 2,
          hasSkull: true,
          floorTile: "/assets/dungeon/tiles/floor_1.png",
          altFloorTile: "/assets/dungeon/tiles/floor_2.png",
          wallMidTile: "/assets/dungeon/tiles/wall_mid.png",
        };
      case 2:
        return {
          banner: "/assets/dungeon/decor/wall_banner_red.png",
          fountainColor: "red",
          hasFountain: true,
          hasColumn: false,
          crateCount: 1,
          hasSkull: false,
          floorTile: "/assets/dungeon/tiles/floor_3.png",
          altFloorTile: "/assets/dungeon/tiles/floor_4.png",
          wallMidTile: "/assets/dungeon/tiles/wall_goo.png",
        };
      case 3:
        return {
          banner: "/assets/dungeon/decor/wall_banner_blue.png",
          fountainColor: "blue",
          hasFountain: true,
          hasColumn: false,
          crateCount: 0,
          hasSkull: false,
          floorTile: "/assets/dungeon/tiles/floor_5.png",
          altFloorTile: "/assets/dungeon/tiles/floor_6.png",
          wallMidTile: "/assets/dungeon/tiles/wall_mid.png",
        };
      case 4:
      default:
        return {
          banner: "/assets/dungeon/decor/wall_banner_yellow.png",
          fountainColor: "yellow",
          hasFountain: false,
          hasColumn: true,
          columnImg: "/assets/dungeon/decor/column.png",
          crateCount: 1,
          hasSkull: true,
          floorTile: "/assets/dungeon/tiles/floor_7.png",
          altFloorTile: "/assets/dungeon/tiles/floor_8.png",
          wallMidTile: "/assets/dungeon/tiles/wall_hole_1.png",
        };
    }
  };

  const theme = getThemeProps();

  const COLS = 16;
  const ROWS = 6;
  const TILE_SIZE = 32;

  const getTileForCell = (r: number, c: number) => {
    // Row 0: wall top
    if (r === 0) {
      if (c === 0) return "/assets/dungeon/tiles/wall_top_left.png";
      if (c === COLS - 1) return "/assets/dungeon/tiles/wall_top_right.png";
      return "/assets/dungeon/tiles/wall_top_mid.png";
    }
    // Row 1-2: wall mid
    if (r === 1 || r === 2) {
      if (c === 0) return "/assets/dungeon/tiles/wall_left.png";
      if (c === COLS - 1) return "/assets/dungeon/tiles/wall_right.png";
      if (r === 1 && (c === 4 || c === 11)) return theme.wallMidTile;
      return "/assets/dungeon/tiles/wall_mid.png";
    }
    // Row 3-5: floor
    const isAlt = (r + c) % 3 === 0;
    return isAlt ? theme.altFloorTile : theme.floorTile;
  };

  return (
    <div
      className="relative mx-auto border-2 border-pixel-border overflow-hidden select-none bg-black"
      style={{
        width: `${COLS * TILE_SIZE}px`,
        height: `${ROWS * TILE_SIZE}px`,
        imageRendering: "pixelated",
      }}
    >
      {/* Base tile grid */}
      <div
        className="grid relative z-0"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${TILE_SIZE}px)`,
          width: `${COLS * TILE_SIZE}px`,
          height: `${ROWS * TILE_SIZE}px`,
        }}
      >
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => (
            <img
              key={`tile-${r}-${c}`}
              src={getTileForCell(r, c)}
              alt=""
              className="block pixelated border-0 p-0 m-0"
              style={{
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                imageRendering: "pixelated",
              }}
            />
          ))
        )}
      </div>

      {/* Decorations layer - placed on walls, NOT on floor where characters stand */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Left banner - on the left wall area */}
        <img
          src={theme.banner}
          alt=""
          className="absolute pixelated"
          style={{
            left: `${1 * TILE_SIZE}px`,
            top: `${1 * TILE_SIZE}px`,
            width: `${TILE_SIZE}px`,
            height: `${TILE_SIZE}px`,
            imageRendering: "pixelated",
          }}
        />

        {/* Right banner - on the right wall area */}
        <img
          src={theme.banner}
          alt=""
          className="absolute pixelated"
          style={{
            left: `${14 * TILE_SIZE}px`,
            top: `${1 * TILE_SIZE}px`,
            width: `${TILE_SIZE}px`,
            height: `${TILE_SIZE}px`,
            imageRendering: "pixelated",
          }}
        />

        {/* Center decoration: fountain or columns on the WALL rows only */}
        {theme.hasFountain ? (
          <>
            <img
              src="/assets/dungeon/decor/wall_fountain_top_1.png"
              alt=""
              className="absolute pixelated"
              style={{
                left: `${7 * TILE_SIZE}px`,
                top: `${0 * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                imageRendering: "pixelated",
              }}
            />
            <img
              src={`/assets/dungeon/decor/wall_fountain_mid_${
                theme.fountainColor === "red" ? "red" : "blue"
              }_anim_f${fountainFrame}.png`}
              alt=""
              className="absolute pixelated"
              style={{
                left: `${7 * TILE_SIZE}px`,
                top: `${1 * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                imageRendering: "pixelated",
              }}
            />
            <img
              src={`/assets/dungeon/decor/wall_fountain_basin_${
                theme.fountainColor === "red" ? "red" : "blue"
              }_anim_f${fountainFrame}.png`}
              alt=""
              className="absolute pixelated"
              style={{
                left: `${7 * TILE_SIZE}px`,
                top: `${2 * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                imageRendering: "pixelated",
              }}
            />
          </>
        ) : theme.hasColumn ? (
          <>
            {/* Columns on wall rows only (row 1-2), NOT on the floor */}
            <img
              src={theme.columnImg}
              alt=""
              className="absolute pixelated"
              style={{
                left: `${0 * TILE_SIZE}px`,
                top: `${1 * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE * 2}px`,
                imageRendering: "pixelated",
              }}
            />
            <img
              src={theme.columnImg}
              alt=""
              className="absolute pixelated"
              style={{
                left: `${15 * TILE_SIZE}px`,
                top: `${1 * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE * 2}px`,
                imageRendering: "pixelated",
              }}
            />
          </>
        ) : null}

        {/* Floor decor: crates & skulls only at the far edges, NOT where characters stand */}
        {theme.crateCount > 0 && (
          <img
            src="/assets/dungeon/decor/crate.png"
            alt=""
            className="absolute pixelated"
            style={{
              left: `${0 * TILE_SIZE}px`,
              top: `${3 * TILE_SIZE}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
              imageRendering: "pixelated",
            }}
          />
        )}

        {theme.hasSkull && (
          <img
            src="/assets/dungeon/decor/skull.png"
            alt=""
            className="absolute pixelated"
            style={{
              left: `${15 * TILE_SIZE}px`,
              top: `${5 * TILE_SIZE}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
              imageRendering: "pixelated",
            }}
          />
        )}
      </div>

      {/* Characters layer - pushed to corners for max center space */}
      <div
        className="absolute z-20 flex items-end justify-between pointer-events-none"
        style={{
          left: `${1 * TILE_SIZE}px`,
          right: `${1 * TILE_SIZE}px`,
          bottom: `${0.4 * TILE_SIZE}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default DungeonStageMap;
