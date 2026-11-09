import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/seed";

export async function POST() {
  ensureSeeded();
  return NextResponse.json({ ok: true, seeded: "sentimentscan" });
}

export async function GET() {
  return POST();
}
