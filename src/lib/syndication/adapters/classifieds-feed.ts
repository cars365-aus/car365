import type { CanonicalVehicle } from "../types";
import type { ChannelAdapter, TransformResult } from "./types";
import { evaluateReadiness } from "../readiness";
import { mapEnum, type EnumMap } from "../enum-map";

/**
 * Standard Dealer Solutions / AutoGate CSV format for Australian classifieds.
 * Used by Gumtree and Carsales via pulling a CSV feed.
 */
export const CLASSIFIEDS_FEED_HEADERS = [
  "DealerId",
  "StockNo",
  "Vin",
  "Make",
  "Model",
  "Year",
  "Price",
  "Odometer",
  "Body",
  "Trans",
  "Color",
  "Description",
  "Images"
] as const;

export const ClassifiedsAdapter: ChannelAdapter = {
  code: "classifieds_feed", 
  name: "Generic Classifieds Feed",

  transform(v: CanonicalVehicle, opts: { vinDuplicates?: ReadonlySet<string>; storeCode?: string; enumMap: EnumMap }): TransformResult {
    // 1. Evaluate base channel-agnostic readiness
    const baseReadiness = evaluateReadiness(v, { vinDuplicates: opts.vinDuplicates });
    const rejections = [...baseReadiness.rejections];
    const warnings = [...baseReadiness.warnings];

    // Classifieds are generally more permissive, but we still need core fields
    if (!v.stockNumber) {
      rejections.push({
        code: "MISSING_STOCK_NUMBER",
        field: "stockNumber",
        message: "A stock number is strictly required for classifieds feeds.",
        fixHint: "Assign a stock number to this vehicle.",
      });
    }

    if (rejections.length > 0) {
      return { type: "rejected", rejections, warnings };
    }

    // 2. Construct Payload
    let description = v.descriptionRaw ?? "";
    if (v.descriptionGenerated && v.descriptionApprovedAt) {
      description = v.descriptionGenerated;
    }

    if (v.wovrFlag && !description.toLowerCase().includes("write-off") && !description.toLowerCase().includes("wovr")) {
      description = `Written-off vehicle. ${description}`;
    }

    // Pipe separated images for DS format
    const images = (v.images ?? []).slice(0, 40).map(i => i.url).join("|");

    // We fallback to google mapping if no specific mapping exists since they share standard conventions
    const mappedBodyVal = mapEnum(opts.enumMap, "body_type", v.bodyType, { channelName: "google", required: false });
    const mappedTransmission = mapEnum(opts.enumMap, "transmission", v.transmission, { channelName: "google", required: false });

    const bodyStr = mappedBodyVal.ok && "value" in mappedBodyVal ? mappedBodyVal.value : v.bodyType;
    const transStr = mappedTransmission.ok && "value" in mappedTransmission ? mappedTransmission.value : v.transmission;

    const payload: Record<string, string> = {
      DealerId: opts.storeCode || "",
      StockNo: v.stockNumber,
      Vin: v.vin || "",
      Make: v.make,
      Model: v.model,
      Year: String(v.year),
      Price: String(v.priceAmount),
      Odometer: String(v.odometerKm),
      Body: bodyStr,
      Trans: transStr,
      Color: v.colourExterior || "",
      Description: description.replace(/\r?\n|\r/g, " "), // strip newlines for CSV safety
      Images: images,
    };

    return { type: "success", payload, warnings };
  }
};
