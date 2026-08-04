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
          wallTile: "/assets/dungeon/tiles/wall_mid.png",
          accentColor: "rgba(0, 255, 65, 0.15)",
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
          wallTile: "/assets/dungeon/tiles/wall_goo.png",
          accentColor: "rgba(255, 0, 85, 0.2)",
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
          wallTile: "/assets/dungeon/tiles/wall_mid.png",
          accentColor: "rgba(56, 189, 248, 0.2)",
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
          wallTile: "/assets/dungeon/tiles/wall_hole_1.png",
          accentColor: "rgba(251, 191, 36, 0.2)",
        };
    }
  };

  const theme = getThemeProps();

  return (
    <div className="relative w-full border border-pixel-border overflow-hidden select-none bg-[#0a0a0e] flex flex-col justify-between min-h-[240px]">
      <div className="absolute inset-0 z-0 opacity-40 bg-radial from-transparent to-black pointer-events-none" />

      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.accentColor }}
      />

      <div className="relative z-10 w-full h-28 flex flex-col justify-end bg-[#121218] border-b-2 border-[#2a2a36] shadow-inner overflow-hidden">
        <div className="w-full h-full flex items-end justify-between px-2">
          {Array.from({ length: 16 }).map((_, idx) => (
            <img
              key={`wall-tile-${idx}`}
              src={idx % 4 === 2 ? theme.wallTile : "/assets/dungeon/tiles/wall_mid.png"}
              alt="Wall Tile"
              className="w-8 h-16 object-cover pixelated opacity-90"
            />
          ))}
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-around px-6 pointer-events-none">
          <img
            src={theme.banner}
            alt="Dungeon Banner Left"
            className="w-6 h-12 object-contain pixelated drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
          />

          {theme.hasFountain ? (
            <div className="flex flex-col items-center">
              <img
                src={`/assets/dungeon/decor/wall_fountain_mid_${
                  theme.fountainColor === "red" ? "red" : "blue"
                }_anim_f${fountainFrame}.png`}
                alt="Fountain"
                className="w-8 h-12 object-contain pixelated drop-shadow-[0_0_12px_rgba(255,0,0,0.6)]"
              />
            </div>
          ) : theme.hasColumn ? (
            <img
              src={theme.columnImg}
              alt="Column"
              className="w-6 h-14 object-contain pixelated drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
            />
          ) : null}

          <img
            src={theme.banner}
            alt="Dungeon Banner Right"
            className="w-6 h-12 object-contain pixelated drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
          />
        </div>
      </div>

      <div className="relative z-10 w-full h-32 bg-[#181822] border-t border-[#333342] shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] flex flex-col justify-end">
        <div className="w-full h-full grid grid-cols-16 grid-rows-2">
          {Array.from({ length: 32 }).map((_, idx) => (
            <img
              key={`floor-tile-${idx}`}
              src={idx % 3 === 0 ? theme.altFloorTile : theme.floorTile}
              alt="Floor Tile"
              className="w-full h-full object-cover pixelated border-[0.5px] border-black/30"
            />
          ))}
        </div>

        <div className="absolute inset-0 z-10 flex items-end justify-between px-6 pb-2 pointer-events-none">
          <div className="flex items-center gap-1">
            {theme.crateCount > 0 && (
              <img
                src="/assets/dungeon/decor/crate.png"
                alt="Crate"
                className="w-5 h-5 object-contain pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              />
            )}
            {theme.hasSkull && (
              <img
                src="/assets/dungeon/decor/skull.png"
                alt="Skull"
                className="w-4 h-4 object-contain pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            <img
              src="/assets/dungeon/decor/lever_right.png"
              alt="Lever"
              className="w-4 h-5 object-contain pixelated opacity-80"
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-20 flex items-end justify-between px-10 pb-4 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export default DungeonStageMap;
