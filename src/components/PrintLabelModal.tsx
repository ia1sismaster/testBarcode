
// PrintLabelModal  —  versão react-pdf + bwip-js

import React, { useEffect, useState } from "react";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Printer, Loader2 } from "lucide-react";
import { usePrintConfig } from "./UsePrintConfig";
import { mudarProdutoImpresso } from "../service/impressora";
import { EtiquetaDocument, type EtiquetaData, T as LABEL_TOKENS } from "./EtiquetaPdf";
import { generateBarcodeDataUrl } from "./Usebarcodedataurl";
import printJS from "print-js";



interface ProductData {
  idProduto: number;
  nome: string;
  sku: string;
  precoVenda: number;
  precoMercado: number | null;
  logo?: string | null;
  qtd?: number;
  foiImpresso: boolean;
}

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductData | null;
}



export function PrintLabelModal({ isOpen, onClose, product }: PrintLabelModalProps) {
  const { impressoras, selectedId, config, loading, setSelectedId } = usePrintConfig();

  // Barcode PNG gerado via bwip-js
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // Gera o barcode sempre que o produto ou config mudar
  useEffect(() => {
    if (!product?.sku || !isOpen) return;

    setBarcodeLoading(true);
    generateBarcodeDataUrl(product.sku, LABEL_TOKENS.barcodeW, LABEL_TOKENS.barcodeH)
      .then((url) => {
        setBarcodeDataUrl(url);
        setBarcodeLoading(false);
      })
      .catch(() => setBarcodeLoading(false));
  }, [product?.sku, config, isOpen]);

  if (!product) return null;

  const quantidade = product.qtd && product.qtd > 0 ? product.qtd : 1;

  // Monta o array de etiquetas (já multiplicado pela quantidade)
  const etiquetas: EtiquetaData[] = Array(quantidade).fill(null).map(() => ({
    nome: product.nome,
    sku: product.sku,
    precoVenda: product.precoVenda,
    precoMercado: product.precoMercado,
    logo: product.logo,
    barcodeDataUrl,
  }));

 
  const handlePrint = async () => {

  const blob = await pdf(
    <EtiquetaDocument products={etiquetas} config={config} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  
  printJS({
    printable: url,
    type: "pdf",
    onPrintDialogClose: () => URL.revokeObjectURL(url),
  });
};

  const isReady = !loading && !barcodeLoading && barcodeDataUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Pré-visualização da Etiqueta</DialogTitle>
        </DialogHeader>

        {/* Seletor de impressora */}
        {!loading && impressoras.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              Impressora:
            </label>
            <select
              className="flex-1 text-sm border rounded-md px-2 py-1"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {impressoras.map((imp) => (
                <option key={imp.identificacao} value={imp.identificacao}>
                  {imp.identificacao} — {imp.largura}×{imp.altura}mm (
                  {imp.qtdPorLinha} por linha)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preview inline via PDFViewer */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {isReady ? (
            <PDFViewer
              width="100%"
              height={280}
              showToolbar={false}
              style={{ border: "none" }}
            >
              <EtiquetaDocument products={etiquetas} config={config} />
            </PDFViewer>
          ) : (
            <div className="flex items-center justify-center h-[280px] gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando prévia…
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Tamanho real: {config.labelW}mm × {config.labelH}mm
          {quantidade > 1 ? ` · ${quantidade} etiquetas` : ""}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={!isReady}>
            {!isReady ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}