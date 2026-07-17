import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processImages() {
  const dir = 'public/images/body-types';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') && !f.startsWith('transparent_'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const { data, info } = await sharp(filePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // If the pixel is very light (near white/light gray), make it transparent
      // The background in the screenshot looks like a light gray studio background.
      if (r > 220 && g > 220 && b > 220) {
        data[i + 3] = 0; // set alpha to 0
      }
    }

    const outPath = path.join(dir, 'transparent_' + file);
    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
    .png()
    .toFile(outPath);
    
    fs.renameSync(outPath, filePath);
    console.log('Processed', file);
  }
}

processImages().catch(console.error);
