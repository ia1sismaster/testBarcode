import { useEffect, useRef, useState, useCallback } from "react";
import { T as DEFAULT_T } from "../../components/EtiquetaPdf";

type Tokens = typeof DEFAULT_T;

const GROUPS = [
  { title: "Etiqueta",   keys: ["labelW","labelH"] },
  { title: "Nome",       keys: ["nomeX","nomeY","nomeW","nomeH","nomeFs"] },
  { title: "De:",        keys: ["deX","deY","deFs"] },
  { title: "% OFF",      keys: ["offX","offY","offFs"] },
  { title: "Preço",      keys: ["precoX","precoY","porLabelFs","porRsFs","porValorFs","porCentsFs"] },
  { title: "Logo",       keys: ["logoX","logoY","logoSize"] },
  { title: "SKU",        keys: ["skuX","skuY","skuW","skuH","skuFs"] },
  { title: "Barcode",    keys: ["barcodeX","barcodeY","barcodeW","barcodeH"] },
] as const;

type TokenKey = keyof Tokens;

const META: Partial<Record<TokenKey, { label: string; min: number; max: number; step: number }>> = {
  labelW:      { label: "Largura (mm)",      min: 20,  max: 80,  step: 1   },
  labelH:      { label: "Altura (mm)",       min: 15,  max: 60,  step: 1   },
  nomeX:       { label: "X",                min: 0,   max: 50,  step: 0.1 },
  nomeY:       { label: "Y",                min: 0,   max: 50,  step: 0.1 },
  nomeW:       { label: "Largura",          min: 5,   max: 60,  step: 0.5 },
  nomeH:       { label: "Altura",           min: 2,   max: 20,  step: 0.5 },
  nomeFs:      { label: "Fonte",            min: 1,   max: 8,   step: 0.1 },
  deX:         { label: "X",                min: 0,   max: 50,  step: 0.1 },
  deY:         { label: "Y",                min: 0,   max: 50,  step: 0.1 },
  deFs:        { label: "Fonte",            min: 1,   max: 6,   step: 0.1 },
  offX:        { label: "X",                min: 0,   max: 60,  step: 0.1 },
  offY:        { label: "Y",                min: 0,   max: 50,  step: 0.1 },
  offFs:       { label: "Fonte",            min: 1,   max: 6,   step: 0.1 },
  precoX:      { label: "X",                min: 0,   max: 50,  step: 0.1 },
  precoY:      { label: "Y",                min: 0,   max: 50,  step: 0.1 },
  porLabelFs:  { label: "Fonte Por:/Preço:", min: 1,   max: 6,   step: 0.1 },
  porRsFs:     { label: "Fonte R$",         min: 1,   max: 6,   step: 0.1 },
  porValorFs:  { label: "Fonte valor",      min: 3,   max: 20,  step: 0.2 },
  porCentsFs:  { label: "Fonte centavos",   min: 1,   max: 10,  step: 0.1 },
  logoX:       { label: "X",                min: 0,   max: 60,  step: 0.1 },
  logoY:       { label: "Y",                min: 0,   max: 50,  step: 0.1 },
  logoSize:    { label: "Tamanho",          min: 2,   max: 15,  step: 0.1 },
  skuX:        { label: "X",                min: 0,   max: 50,  step: 0.1 },
  skuY:        { label: "Y",                min: 0,   max: 50,  step: 0.1 },
  skuW:        { label: "Largura col",      min: 1,   max: 8,   step: 0.1 },
  skuH:        { label: "Altura col",       min: 2,   max: 20,  step: 0.5 },
  skuFs:       { label: "Fonte",            min: 0.5, max: 5,   step: 0.1 },
  barcodeX:    { label: "X",                min: 0,   max: 60,  step: 0.1 },
  barcodeY:    { label: "Y",                min: 0,   max: 50,  step: 0.1 },
  barcodeW:    { label: "Largura",          min: 5,   max: 60,  step: 0.5 },
  barcodeH:    { label: "Altura",           min: 2,   max: 15,  step: 0.2 },
};

const SAMPLE = {
  nome:    "Ventilador de Teto 132cm com Luz Led e Controle",
  sku:     "6440",
  venda:   259.90,
  mercado: 372.40,
};

const MM    = 3.7795;
const SCALE = 4;
const px    = (mm: number) => mm * MM * SCALE;

function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const bars  = [2,1,2,1,1,2,1,2,1,1,2,1,2,1,1,2,2,1,1,2,1,1,2,1,2];
  const total = bars.reduce((a, b) => a + b, 0);
  const unit  = w / total;
  let cx = x;
  bars.forEach((b, i) => {
    if (i % 2 === 0) { ctx.fillStyle = "#000"; ctx.fillRect(cx, y, unit * b, h); }
    cx += unit * b;
  });
}

function drawLabel(canvas: HTMLCanvasElement, t: Tokens) {
  const W = px(t.labelW);
  const H = px(t.labelH);
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // nome
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";
  const maxW  = px(t.nomeW);
  const words = SAMPLE.nome.split(" ");
  const lines: string[] = [];
  let cur = "";
  words.forEach(w => {
    const test = cur ? cur + " " + w : w;
    ctx.font = `bold ${px(t.nomeFs)}px Arial`;
    if (ctx.measureText(test.toUpperCase()).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  });
  if (cur) lines.push(cur);
  ctx.font = `bold ${px(t.nomeFs)}px Arial`;
  lines.slice(0, 2).forEach((l, i) => {
    ctx.fillText(l.toUpperCase(), px(t.nomeX), px(t.nomeY) + i * px(t.nomeFs) * 1.25);
  });

  // De: R$ X,XX — posição independente
  const desconto = Math.round(((SAMPLE.mercado - SAMPLE.venda) / SAMPLE.mercado) * 10000);
  const pct = (desconto / 100).toFixed(2).replace(".", ",");
  ctx.font = `${px(t.deFs)}px Arial`;
  ctx.fillStyle = "#555";
  ctx.textBaseline = "top";
  ctx.fillText(`De: R$ ${SAMPLE.mercado.toFixed(2).replace(".", ",")}`, px(t.deX), px(t.deY));

  // XX% OFF — posição independente
  ctx.font = `bold ${px(t.offFs)}px Arial`;
  ctx.fillStyle = "#000";
  ctx.fillText(`${pct}% OFF`, px(t.offX), px(t.offY));

  // preço
  const [reais, cts] = SAMPLE.venda.toFixed(2).replace(".", ",").split(",");
  ctx.textBaseline = "alphabetic";
  const baseline = px(t.precoY) + px(t.porValorFs);
  let rx = px(t.precoX);

  ctx.font = `${px(t.porLabelFs)}px Arial`;
  ctx.fillStyle = "#000";
  ctx.fillText("Por:", rx, baseline);
  rx += ctx.measureText("Por: ").width;

  ctx.font = `${px(t.porRsFs)}px Arial`;
  ctx.fillText("R$", rx, baseline - px(t.porValorFs * 0.08));
  rx += ctx.measureText("R$ ").width;

  ctx.font = `bold ${px(t.porValorFs)}px Arial`;
  ctx.fillText(reais + ",", rx, baseline);
  rx += ctx.measureText(reais + ",").width;

  ctx.font = `bold ${px(t.porCentsFs)}px Arial`;
  ctx.fillText(cts, rx, baseline - px(0.5));

  // logo placeholder
  ctx.strokeStyle = "#000";
  ctx.lineWidth = px(0.3);
  ctx.strokeRect(px(t.logoX), px(t.logoY), px(t.logoSize), px(t.logoSize));
  ctx.font = `bold ${px(t.nomeFs * 1.2)}px Arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";
  ctx.fillText("S", px(t.logoX) + px(t.logoSize) / 2, px(t.logoY) + px(t.logoSize) / 2);
  ctx.textAlign = "left";

  // sku
  ctx.save();
  ctx.translate(px(t.skuX) + px(t.skuW) / 2, px(t.skuY) + px(t.skuH) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `bold ${px(t.skuFs)}px Arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#555";
  ctx.fillText(SAMPLE.sku, 0, 0);
  ctx.restore();

  // barcode
  drawBarcode(ctx, px(t.barcodeX), px(t.barcodeY), px(t.barcodeW), px(t.barcodeH));

  // guias azuis por elemento
  ctx.strokeStyle = "rgba(0,120,255,0.25)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 3]);
  [
    [t.nomeX,    t.nomeY,    t.nomeW,          t.nomeH          ],
    [t.deX,      t.deY,      t.labelW * 0.55,  t.deFs  * 1.5   ],
    [t.offX,     t.offY,     t.labelW * 0.35,  t.offFs * 1.5   ],
    [t.precoX,   t.precoY,   t.labelW * 0.7,   t.porValorFs*1.5],
    [t.logoX,    t.logoY,    t.logoSize,        t.logoSize      ],
    [t.skuX,     t.skuY,     t.skuW,            t.skuH          ],
    [t.barcodeX, t.barcodeY, t.barcodeW,        t.barcodeH      ],
  ].forEach(([x, y, w, h]) => {
    ctx.strokeRect(px(x) + 0.5, px(y) + 0.5, px(w) - 1, px(h) - 1);
  });
  ctx.setLineDash([]);
}

export default function LabelEditorPage() {
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const [tokens, setTokens]     = useState<Tokens>({ ...DEFAULT_T });
  const [copied, setCopied]     = useState(false);
  const [activeGroup, setActive] = useState<string>(GROUPS[0].title);

  useEffect(() => {
    if (canvasRef.current) drawLabel(canvasRef.current, tokens);
  }, [tokens]);

  const set = useCallback((key: TokenKey, value: number) => {
    setTokens(prev => ({ ...prev, [key]: value }));
  }, []);

  const code =
    `export const T = {\n` +
    Object.entries(tokens)
      .filter(([k]) => k !== "ink" && k !== "inkLight")
      .map(([k, v]) => `  ${k.padEnd(14)}: ${v},`)
      .join("\n") +
    `\n  ink:           "${tokens.ink}",\n  inkLight:      "${tokens.inkLight}",\n};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const currentGroup = GROUPS.find(g => g.title === activeGroup)!;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 gap-6">
      <h1 className="text-lg font-semibold text-gray-800">Editor Visual de Etiqueta</h1>

      <div className="flex gap-6 items-start flex-wrap">

        {/* Preview */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="bg-gray-300 p-4 rounded-xl shadow-inner">
            <canvas ref={canvasRef} className="block rounded shadow" />
          </div>
          <p className="text-xs text-gray-400">Escala 4× — linhas azuis = bordas dos elementos</p>
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-100 font-medium w-full"
          >
            {copied ? "✓ Copiado!" : "Copiar const T → EtiquetaPDF.tsx"}
          </button>
          <pre className="w-full text-[10px] font-mono bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto">
            {code}
          </pre>
        </div>

        {/* Controles */}
        <div className="flex-1 min-w-[280px] max-w-sm">

          {/* Abas */}
          <div className="flex flex-wrap gap-1 mb-4">
            {GROUPS.map(g => (
              <button
                key={g.title}
                onClick={() => setActive(g.title)}
                className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                  activeGroup === g.title
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{activeGroup}</h3>
            {currentGroup.keys.map(k => {
              const key = k as TokenKey;
              const m   = META[key];
              if (!m) return null;
              const val = tokens[key] as number;
              return (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-32 flex-shrink-0">{m.label}</label>
                  <input
                    type="range"
                    min={m.min} max={m.max} step={m.step}
                    value={val}
                    onChange={e => set(key, parseFloat(e.target.value))}
                    className="flex-1 accent-gray-800"
                  />
                  <span className="text-xs font-semibold text-gray-800 w-9 text-right tabular-nums">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input direto */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Editar valor direto</h3>
            {currentGroup.keys.map(k => {
              const key = k as TokenKey;
              const m   = META[key];
              if (!m) return null;
              const val = tokens[key] as number;
              return (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-32 flex-shrink-0">{m.label}</label>
                  <input
                    type="number"
                    min={m.min} max={m.max} step={m.step}
                    value={val}
                    onChange={e => set(key, parseFloat(e.target.value) || 0)}
                    className="w-20 text-xs border border-gray-200 rounded px-2 py-1 text-right font-mono"
                  />
                  <span className="text-xs text-gray-400">mm</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}