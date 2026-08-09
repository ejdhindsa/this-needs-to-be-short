import { describe, it, expect } from "vitest";
import randomCodeGenerator from "./randomCodeGenerator.js";

describe("Test randomCodeGenerator() function", () => {
  it("should always return short codes of length eight", () => {
    const randomCode = randomCodeGenerator();

    expect(randomCode.length).toEqual(8);
  });

  it("should have the regex of only numbers and characters", () => {
    const randomCode = randomCodeGenerator();

    expect(randomCode).toEqual(expect.stringMatching(/^[a-zA-Z0-9]+$/));
  });
});
