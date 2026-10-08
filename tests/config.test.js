import { describe, it, expect } from "vitest";
import { INDEXAR, SITE } from "../src/config.js";

describe("config", () => {
  it("não indexa até a aprovação", () => expect(INDEXAR).toBe(false));
  it("aponta para o GitHub Pages do ls-campo", () => expect(SITE).toBe("https://italoleandrojs.github.io/ls-campo/"));
});
