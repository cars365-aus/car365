/**
 * One-time: recompress heavy static homepage images to WebP.
 * These are served as plain <img> on the landing page; shrinking the source
 * files is an immediate, zero-markup win. Run: node scripts/optimize-static-images.mjs
 */
import sharp from "sharp";
import { readFile, writeFile, stat } from "node:fs/promises";

const jobs = [
  { in: "public/images/finance.jpg", out: "public/images/finance.webp", width: 1280 },
  { in: "public/images/team.jpg", out: "public/images/team.webp", width: 1280 },
  // Body-type icons render at ~85px tall but ship as ~1MB PNGs — resize hard.
  ...["sedan", "suv", "hatch", "ute", "van", "coupe"].map((b) => ({
    in: `public/images/body-types/${b}.png`,
    out: `public/images/body-types/${b}.webp`,
    width: 256,
  })),
];

for (const job of jobs) {
  try {
    const before = (await stat(job.in)).size;
    const buf = await readFile(job.in);
    const out = await sharp(buf)
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();
    await writeFile(job.out, out);
    console.log(
      `${job.out}  ${(before / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB WebP`,
    );
  } catch (e) {
    console.error(`FAIL ${job.in}: ${e.message}`);
  }
}
console.log("Done.");
