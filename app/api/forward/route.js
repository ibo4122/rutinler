// Forward-test (paper trading) verisini canlı sunar.
// Trading projesinin yazdığı dashboard JSON'unu okur (ayrı klasörden).
import { readFileSync, existsSync } from "node:fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DASH_PATH = "C:/Users/ibini/trading/reports/forward_dashboard.json";

export async function GET() {
  try {
    if (!existsSync(DASH_PATH)) {
      return Response.json(
        { ok: false, error: "Forward-test henüz veri üretmedi. 'npm run forward' çalıştır." },
        { status: 200 }
      );
    }
    const data = JSON.parse(readFileSync(DASH_PATH, "utf8"));
    return Response.json({ ok: true, ...data });
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 200 });
  }
}
