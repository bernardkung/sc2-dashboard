// app/api/blizzard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBlizzardToken } from "@/lib/blizzard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;  // ← fix
  const token = await getBlizzardToken();

  const search = req.nextUrl.search;
  const blizzardUrl = `https://us.api.blizzard.com/${path.join("/")}${search}`;

  const res = await fetch(blizzardUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Blizzard API error" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}