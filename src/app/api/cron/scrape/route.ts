import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { runScrape } from "@/lib/archive";

// Triggered by Vercel Cron (see vercel.json). Vercel signs cron requests
// with this header automatically when CRON_SECRET is set as an env var.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runScrape();
  revalidatePath("/");
  return NextResponse.json({ ok: true, ...result });
}
