import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { runScrape } from "@/lib/archive";

export async function POST() {
  const result = await runScrape();
  revalidatePath("/");
  return NextResponse.json({ ok: true, ...result });
}
