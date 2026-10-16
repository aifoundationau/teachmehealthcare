import { json } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ message: "TeachMeHealth API is running" });
}
