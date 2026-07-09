import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
const skip = new Set(["STRIPE_WEBHOOK_SECRET"]);

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;

  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (!value || skip.has(key)) continue;

  console.log(`Adding ${key}...`);
  execSync(`npx vercel env add ${key} production`, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    encoding: "utf8",
  });
}

console.log("Done pushing env vars to Vercel production.");
