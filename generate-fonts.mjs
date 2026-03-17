import { readFileSync, writeFileSync } from "fs";

const regular = readFileSync("src/assets/fonts/ARIAL.TTF");
const bold    = readFileSync("src/assets/fonts/ARIALBD.TTF");

const content =
  `export const arialB64     = "data:font/truetype;base64,${regular.toString("base64")}";\n` +
  `export const arialBoldB64 = "data:font/truetype;base64,${bold.toString("base64")}";\n`;

writeFileSync("src/assets/fonts/arial-b64.ts", content);
console.log("Gerado: src/assets/fonts/arial-b64.ts");
