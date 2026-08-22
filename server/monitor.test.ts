import { describe, expect, it } from "vitest";
import { extractMyanmarPhones, hasPhoneChanged, normalizeMyanmarDigits, normalizeMyanmarPhone } from "../shared/phone.js";

describe("payment-number monitoring helpers", () => {
  it("normalizes Myanmar digits and international Myanmar mobile numbers", () => {
    expect(normalizeMyanmarDigits("၀၉၇၅၈၁၅၅၃၇၂")).toBe("09758155372");
    expect(normalizeMyanmarPhone("+959758155372")).toBe("09758155372");
  });

  it("de-duplicates a number written with Myanmar and ASCII digits", () => {
    expect(extractMyanmarPhones("၀၉၇၅၈၁၅၅၃၇၂ / 09758155372")).toEqual(["09758155372"]);
  });

  it("notifies only after an actual change", () => {
    expect(hasPhoneChanged("09758155372", "09758155372")).toBe(false);
    expect(hasPhoneChanged("09758155372", "09876543210")).toBe(true);
    expect(hasPhoneChanged(null, "09876543210")).toBe(false);
  });
});
