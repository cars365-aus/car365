import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });
import { runBlogPreflight } from "../src/lib/blog/preflight";

runBlogPreflight().then((r) => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ready ? 0 : 1);
});
