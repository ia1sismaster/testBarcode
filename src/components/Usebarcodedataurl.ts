// ─────────────────────────────────────────────────────────────────────────────
// 🔲  useBarcodeDataUrl  —  bwip-js em alta resolução
//
//  A escala alta (scale: 8) gera um canvas grande que o react-pdf
//  comprime para o tamanho real da etiqueta — resultado nítido na impressão.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import bwipjs from "bwip-js";

interface BarcodeOptions {
  value: string;
  widthMm: number;
  heightMm: number;
}

export function useBarcodeDataUrl({ value, widthMm, heightMm }: BarcodeOptions): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    generateBarcodeDataUrl(value, widthMm, heightMm).then(setDataUrl);
  }, [value, widthMm, heightMm]);

  return dataUrl;
}

export async function generateBarcodeDataUrl(
  value: string,
  widthMm: number,
  heightMm: number
): Promise<string | null> {
  if (!value) return null;
  const canvas = document.createElement("canvas");
  try {
     bwipjs.toCanvas(canvas, {
      bcid:        "code128",
      text:        value, 
      parsefnc:    true,           
      scale:       8,
      height:      Math.max(6, Math.round(heightMm * 2.5)),
      includetext: false,
      guardwhitespace: false,
      backgroundcolor: "ffffff",
    });
 
    return canvas.toDataURL("image/png");
  } catch (err) {
    // fallback sem forçar subset — ainda gera um barcode válido
    console.warn("[generateBarcodeDataUrl] subset B falhou, usando auto:", err);
    try {
      bwipjs.toCanvas(canvas, {
        bcid:        "code128",
        text:        value,
        scale:       8,
        height:      Math.max(6, Math.round(heightMm * 2.5)),
        width: Math.round(widthMm * 2.5),
        includetext: false,
        guardwhitespace: false,
        backgroundcolor: "ffffff",
      });
      return canvas.toDataURL("image/png");
    } catch (err2) {
      console.error("[generateBarcodeDataUrl] erro:", err2);
      return null;
    }
  }
}