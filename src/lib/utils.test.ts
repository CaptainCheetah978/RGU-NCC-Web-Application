import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names with spacing", () => {
    expect(cn("text-sm", "font-medium")).toBe("text-sm font-medium");
  });

  it("resolves conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
