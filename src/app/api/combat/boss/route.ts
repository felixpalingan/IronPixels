import { NextResponse } from "next/server";
import { getBossState } from "@/lib/bossState";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") as "solo" | "party") || "solo";
  const floorParam = searchParams.get("floor");
  const floorNumber = floorParam ? parseInt(floorParam, 10) : undefined;

  const state = getBossState(mode, floorNumber);

  return NextResponse.json({
    ...state,
    mode,
  });
}
