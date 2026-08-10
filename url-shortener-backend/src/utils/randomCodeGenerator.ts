import { randomInt } from "node:crypto";

const DataSet = {
  length: 8,
  alphabet: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
} as const;

export default function randomCodeGenerator() {
  let result = "";

  for (let i = 0; i < DataSet.length; i++) {
    const randomIndex = randomInt(DataSet.alphabet.length);
    result += DataSet.alphabet.charAt(randomIndex);
  }

  return result;
}
