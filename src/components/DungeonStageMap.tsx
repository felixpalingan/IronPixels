"use client";

import React, { useState, useEffect } from "react";

interface DungeonStageMapProps {
  stage?: number;
  bossType?: "orc" | "blood" | "demon" | "dragon" | "mecha" | "lich";
  children?: React.ReactNode;
}

export function DungeonStageMap({
  stage = 1,
  bossType = "orc",
  children,
}: DungeonStageMapProps) {
  const [fountainFrame, setFountainFrame] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFountainFrame((prev) => (prev + 1) % 3);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const stageVariant = ((stage - 1) % 4) + 1;

  const getThemeProps = () => {
    switch (stageVariant) {
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
          hasSkull: true,
          floorTile: "/assets/dungeon/tiles/floor_3.png",
          altFloorTile: "/assets/dungeon/tiles/floor_4.png",
          wallMidTile: "/assets/dungeon/tiles/wall_goo.png",
        };
      case 3:
        return {
          banner: "/assets/dungeon/decor/wall_banner_blue.png",
          fountainColor: "blue",
          hasFountain: true,
          hasColumn: true,
          columnImg: "/assets/dungeon/decor/column.png",
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
          crateCount: 3,
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
    if (r === 0) {
      if (c === 0) return "/assets/dungeon/tiles/wall_top_left.png";
      if (c === COLS - 1) return "/assets/dungeon/tiles/wall_top_right.png";
      return "/assets/dungeon/tiles/wall_top_mid.png";
    }

    if (r === 1 || r === 2) {
      if (c === 0) return "/assets/dungeon/tiles/wall_left.png";
      if (c === COLS - 1) return "/assets/dungeon/tiles/wall_right.png";
      if (r === 1 && c === 7 && theme.hasFountain) {
        return "/assets/dungeon/tiles/wall_mid.png";
      }
      if (r === 1 && (c === 4 || c === 11)) {
        return theme.wallMidTile;
      }
      return "/assets/dungeon/tiles/wall_mid.png";
    }

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
              alt="Tile"
              className="w-8 h-8 block pixelated border-0 p-0 m-0"
              style={{
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                imageRendering: "pixelated",
              }}
            />
          ))
        )}
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <img
          src={theme.banner}
          alt="Banner Left"
          className="absolute pixelated"
          style={{
            left: `${3 * TILE_SIZE}px`,
            top: `${1 * TILE_SIZE}px`,
            width: `${TILE_SIZE}px`,
            height: `${TILE_SIZE}px`,
            imageRendering: "pixelated",
          }}
        />

        <img
          src={theme.banner}
          alt="Banner Right"
          className="absolute pixelated"
          style={{
            left: `${12 * TILE_SIZE}px`,
            top: `${1 * TILE_SIZE}px`,
            width: `${TILE_SIZE}px`,
            height: `${TILE_SIZE}px`,
            imageRendering: "pixelated",
          }}
        />

        {theme.hasFountain ? (
          <>
            <img
              src="/assets/dungeon/decor/wall_fountain_top_1.png"
              alt="Fountain Top"
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
              alt="Fountain Mid"
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
              alt="Fountain Basin"
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
            <img
              src={theme.columnImg}
              alt="Column Left"
              className="absolute pixelated"
              style={{
                left: `${2 * TILE_SIZE}px`,
                top: `${1 * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE * 2}px`,
                imageRendering: "pixelated",
              }}
            />
            <img
              src={theme.columnImg}
              alt="Column Right"
              className="absolute pixelated"
              style={{
                left: `${13 * TILE_SIZE}px`,
                top: `${1 * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE * 2}px`,
                imageRendering: "pixelated",
              }}
            />
          </>
        ) : null}

        {theme.crateCount > 0 && (
          <img
            src="/assets/dungeon/decor/crate.png"
            alt="Crate"
            className="absolute pixelated"
            style={{
              left: `${1 * TILE_SIZE}px`,
              top: `${5 * TILE_SIZE}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
              imageRendering: "pixelated",
            }}
          />
        )}

        {theme.hasSkull && (
          <img
            src="/assets/dungeon/decor/skull.png"
            alt="Skull"
            className="absolute pixelated"
            style={{
              left: `${14 * TILE_SIZE}px`,
              top: `${5 * TILE_SIZE}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
              imageRendering: "pixelated",
            }}
          />
        )}
      </div>

      <div className="absolute inset-0 z-20 flex items-end justify-between px-6 pb-2 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export default DungeonStageMap;
