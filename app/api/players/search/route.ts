import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://api.deadlock-api.com/v1/players/steam-search?search_query=${encodeURIComponent(query)}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Search error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data.slice(0, 8)); // limit to 8 results
  } catch (err) {
    console.error("Search failed:", err);
    return NextResponse.json([], { status: 502 });
  }
}