import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid authentication token" });
  }

  const key = getNangoKey();
  return res.status(200).json({ configured: Boolean(key), hasKey: Boolean(key) });
}

