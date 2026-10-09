// Loads ./.env for CLI scripts (Next.js loads it on its own), then an optional local Gemini key file.
// Keys stay in the process env. Nothing is printed or written.
import { existsSync, readFileSync } from "node:fs";
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const p = process.env.GEMINI_KEY_FILE ?? "/workspace/.secrets/gemini_key";
if (!process.env.GEMINI_API_KEY && existsSync(p)) process.env.GEMINI_API_KEY = readFileSync(p, "utf8").trim();
