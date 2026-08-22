import { describe, expect, it } from "vitest";
import { extractMyanmarPhones, hasPhoneChanged, normalizeMyanmarDigits, normalizeMyanmarPhone } from "./phone.js";

describe("Myanmar phone helpers", () => {
  it("converts Myanmar digits before parsing", () => {
    expect(normalizeMyanmarDigits("၀၉၇၅၈၁၅၅၃၇၂")).toBe("09758155372");
    expect(normalizeMyanmarPhone("+959758155372")).toBe("09758155372");
  });

  it("extracts unique normalized mobile numbers", () => {
    expect(extractMyanmarPhones("Pay ၀၉၇၅၈၁၅၅၃၇၂ or 09758155372")).toEqual(["09758155372"]);
  });

  it("only treats a different non-empty number as a change", () => {
    expect(hasPhoneChanged("09758155372", "09758155372")).toBe(false);
    expect(hasPhoneChanged("09758155372", "09876543210")).toBe(true);
    expect(hasPhoneChanged(null, "09876543210")).toBe(false);
  });
});
