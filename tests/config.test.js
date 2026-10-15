import { describe, it, expect } from "vitest";
import { INDEXAR, SITE } from "../src/config.js";

describe("config", () => {
  it("indexa: divulgação aprovada em 15/10/2026", () => expect(INDEXAR).toBe(true));
  it("aponta para o GitHub Pages do ls-campo", () => expect(SITE).toBe("https://italoleandrojs.github.io/ls-campo/"));
});
