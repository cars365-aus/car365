/**
 * iOS PWA launch (splash) images for `metadata.appleWebApp.startupImage`.
 *
 * iOS Safari shows a blank screen when a home-screen web app launches unless a
 * matching `apple-touch-startup-image` link exists for the device's exact
 * dimensions + pixel ratio. Images live in public/splash/ (generated from the
 * brand glyph). Keep this list in sync with the generator.
 */
const DEVICES: Array<{ w: number; h: number; r: number; f: string }> = [
  { w: 320, h: 568, r: 2, f: "iphone-se" },
  { w: 375, h: 667, r: 2, f: "iphone-8" },
  { w: 414, h: 736, r: 3, f: "iphone-8-plus" },
  { w: 375, h: 812, r: 3, f: "iphone-x" },
  { w: 390, h: 844, r: 3, f: "iphone-13" },
  { w: 393, h: 852, r: 3, f: "iphone-15" },
  { w: 414, h: 896, r: 2, f: "iphone-11" },
  { w: 414, h: 896, r: 3, f: "iphone-11-pro-max" },
  { w: 428, h: 926, r: 3, f: "iphone-13-pro-max" },
  { w: 430, h: 932, r: 3, f: "iphone-15-pro-max" },
  { w: 768, h: 1024, r: 2, f: "ipad" },
  { w: 810, h: 1080, r: 2, f: "ipad-10th" },
  { w: 820, h: 1180, r: 2, f: "ipad-air" },
  { w: 834, h: 1194, r: 2, f: "ipad-pro-11" },
  { w: 1024, h: 1366, r: 2, f: "ipad-pro-12" },
];

export const appleStartupImages = DEVICES.map(({ w, h, r, f }) => ({
  url: `/splash/splash-${f}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
}));
