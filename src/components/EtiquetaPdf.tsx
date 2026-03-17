import { Document, Page, View, Text, Image, Font } from "@react-pdf/renderer";
import { type LabelConfig, LABEL_CONFIG } from "./LabelConfig";

import { arialB64, arialBoldB64 } from "../assets/fonts/arial-b64";

Font.register({
    family: "Arial",
    fonts: [
        { src: arialB64, fontWeight: "normal" },
        { src: arialBoldB64, fontWeight: "bold" },
    ],
});
Font.registerHyphenationCallback((word) => [word]);
const FONT = "Arial";

// ─────────────────────────────────────────────────────────────────────────────
// Todas as posições (x, y) e tamanhos em mm
// ─────────────────────────────────────────────────────────────────────────────
export const T = {
    labelW: 33,
    labelH: 22,
    nomeX: 1.2,
    nomeY: 1,
    nomeW: 30,
    nomeH: 6,
    nomeFs: 2.7,
    deX: 4,
    deY: 7,
    deFs: 2.2,
    offX: 20.5,
    offY: 8.7,
    offFs: 1.9,
    precoX: 4,
    precoY: 10,
    porLabelFs: 2.2,
    porRsFs: 2.2,
    porValorFs: 3.8,
    porCentsFs: 2.5,
    logoX: 27.5,
    logoY: 10.7,
    logoSize: 4.5,
    skuX: 1,
    skuY: 17.5,
    skuW: 2.5,
    skuH: 4,
    skuFs: 2,
    barcodeX: 3.7,
    barcodeY: 15.1,
    barcodeW: 23,
    barcodeH: 6.2,
    ink: "#000000",
    inkLight: "#000000",
};
// ─────────────────────────────────────────────────────────────────────────────
const mmToPt = (mm: number) => mm * 2.8346;

export interface EtiquetaData {
    nome: string;
    sku: string;
    precoVenda: number;
    precoMercado: number | null;
    logo?: string | null;
    barcodeDataUrl?: string | null;
}

interface EtiquetaPDFProps { product: EtiquetaData; config?: LabelConfig; tokens?: typeof T; }
interface EtiquetaDocumentProps { products: EtiquetaData[]; config?: LabelConfig; tokens?: typeof T; }

const fmtBR = (v: number) =>
    new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(v);

function calcDesconto(venda: number, mercado: number | null) {
    if (!mercado || mercado <= venda) return null;
    return Math.round(((mercado - venda) / mercado) * 100);
}

export function EtiquetaPDF({ product, config = LABEL_CONFIG, tokens = T }: EtiquetaPDFProps) {
     console.log("config.labelW:", config.labelW, "T.labelW:", tokens.labelW);
    console.log("config.labelH:", config.labelH, "T.labelH:", tokens.labelH);
    const t = tokens;
    const wPt = mmToPt(config.labelW);
    const hPt = mmToPt(config.labelH);

    const desconto = calcDesconto(product.precoVenda, product.precoMercado);
    const [reais, centavos] = fmtBR(product.precoVenda).split(",");

    const pctDecimal = product.precoMercado && desconto
        ? String(Math.round(((product.precoMercado - product.precoVenda) / product.precoMercado) * 10000) % 100).padStart(2, "0")
        : "00";

    const abs = (x: number, y: number, w?: number, h?: number) => ({
        position: "absolute" as const,
        left: mmToPt(x),
        top: mmToPt(y),
        ...(w !== undefined ? { width: mmToPt(w) } : {}),
        ...(h !== undefined ? { height: mmToPt(h) } : {}),
    });

    return (
        <View style={{ width: wPt, height: hPt, backgroundColor: "#ffffff", overflow: "hidden", position: "relative" }}>

            {/* Nome — palavras separadas para forçar quebra de linha */}
            <View style={{ ...abs(t.nomeX, t.nomeY, t.nomeW, t.nomeH), flexDirection: "row", flexWrap: "wrap", overflow: "hidden" }}>
                {product.nome.split(" ").map((word, i) => (
                    <Text key={i} style={{ fontFamily: FONT, fontSize: mmToPt(t.nomeFs), color: t.ink, lineHeight: 1.25, marginRight: mmToPt(0.2) }}>
                        {word}
                    </Text>
                ))}
            </View>

            {/* De: R$ X,XX — posição própria */}
            {product.precoMercado && desconto ? (
                <Text style={{ ...abs(t.deX, t.deY), fontFamily: FONT, fontSize: mmToPt(t.deFs), color: t.inkLight }}>
                    De: R$ {fmtBR(product.precoMercado)}
                </Text>
            ) : null}

            {/* XX% OFF — posição própria, independente do De: */}
            {product.precoMercado && desconto ? (
                <Text style={{ ...abs(t.offX, t.offY), fontFamily: FONT, fontSize: mmToPt(t.offFs), fontWeight: "bold", color: t.ink }}>
                    {desconto},{pctDecimal}% OFF
                </Text>
            ) : null}

            {/* Preço */}
            <View style={{ ...abs(t.precoX, t.precoY), flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={{ fontFamily: FONT, fontSize: mmToPt(t.porLabelFs), color: t.ink, paddingBottom: mmToPt(0.5), marginRight: mmToPt(0.4) }}>
                    {product.precoMercado && desconto ? "Por:" : "Preço:"}
                </Text>
                <Text style={{ fontFamily: FONT, fontSize: mmToPt(t.porRsFs), color: t.ink, paddingBottom: mmToPt(0.5), marginRight: mmToPt(0.2) }}>
                    R$
                </Text>
                <Text style={{ fontFamily: FONT, fontSize: mmToPt(t.porValorFs), fontWeight: "bold", color: t.ink, lineHeight: 1 }}>
                    {reais}
                </Text>
                <Text style={{ fontFamily: FONT, fontSize: mmToPt(t.porCentsFs), fontWeight: "bold", color: t.ink, paddingBottom: mmToPt(0.5) }}>
                    ,{centavos}
                </Text>
            </View>

            {/* Logo */}
            <View style={{ ...abs(t.logoX, t.logoY, t.logoSize, t.logoSize) }}>
                {product.logo
                    ? <Image src={product.logo} style={{ width: mmToPt(t.logoSize), height: mmToPt(t.logoSize), objectFit: "contain" }} />
                    : (
                        <View style={{ width: mmToPt(t.logoSize), height: mmToPt(t.logoSize), borderWidth: 0.8, borderColor: t.ink, borderStyle: "solid", borderRadius: 1, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontFamily: FONT, fontSize: mmToPt(t.nomeFs * 1.2), color: t.ink }}>S</Text>
                        </View>
                    )
                }
            </View>

            {/* SKU vertical */}
            <View style={{ ...abs(t.skuX, t.skuY, t.skuW, t.skuH), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: FONT, fontSize: mmToPt(t.skuFs), color: t.inkLight, transform: "rotate(-90deg)" as any }}>
                    {product.sku}
                </Text>
            </View>

            {/* Barcode */}
            {product.barcodeDataUrl ? (
                <Image src={product.barcodeDataUrl} style={{ ...abs(t.barcodeX, t.barcodeY, t.barcodeW, t.barcodeH), objectFit: "fill" }} />
            ) : null}

        </View>
    );
}

export function EtiquetaDocument({ products, config = LABEL_CONFIG, tokens = T }: EtiquetaDocumentProps) {
    const { labelW, labelH, labelsPerPage, colGap } = config;

    const wPt = mmToPt(labelW);
    const hPt = mmToPt(labelH);
    const gapPt = mmToPt(colGap);
    const pageWPt = wPt * labelsPerPage + gapPt * (labelsPerPage - 1);
    const pages: EtiquetaData[][] = [];
    console.log("pageWPt:", pageWPt);
    console.log("pageWPt em mm:", pageWPt / 2.8346);
    console.log("pageWPt em px (Chrome):", pageWPt / 2.8346 * 3.7795);
    for (let i = 0; i < products.length; i += labelsPerPage) {
        pages.push(products.slice(i, i + labelsPerPage));
    }

    return (
        <Document pdfVersion="1.4" title="Etiqueta">
            {pages.map((page, pi) => (
                <Page
                    key={pi}
                    size={{ width: pageWPt, height: hPt }} 
                    style={{
                        flexDirection: "row",
                        flexWrap: "nowrap",
                        backgroundColor: "#ffffff",
                        padding: 0,
                        margin: 0,
                        
                    }}
                    
                >
                    {page.map((product, li) => (
                        <View
                            key={li}
                            style={{
                                width: wPt,
                                height: hPt,
                                marginRight: li < page.length - 1 ? gapPt : 0,
                               
                                // Removemos o rotate daqui e colocamos no nível interno se precisar,
                                // mas primeiro vamos focar no alinhamento.
                            }}
                        >
                            <EtiquetaPDF product={product} config={config} tokens={tokens} />
                        </View>
                    ))}
                </Page>
            ))}
        </Document>
    );
}