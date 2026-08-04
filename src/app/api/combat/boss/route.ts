import { NextResponse } from "next/server";
import { getBossState, getFloorState } from "@/lib/bossState";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") as "solo" | "party") || "solo";

  const state = getBossState(mode);

  return NextResponse.json({
    ...state,
    mode,
  });
}
