import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Printer, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { usePrintConfig } from "./UsePrintConfig";
import { mudarProdutoImpresso } from "../service/impressora";
import { listarTodosProdutosEtiqueta } from "../service/ProdutoService";
import { EtiquetaDocument, type EtiquetaData, T as LABEL_TOKENS } from "./EtiquetaPdf";
import { generateBarcodeDataUrl } from "./Usebarcodedataurl";


interface ProdutoEtiqueta {
  idProduto: number;
  nome: string;
  codBarras: string;
  condicao: string;
  codPallet: string;
  custo: number;
  precoVenda: number;
  qtdProduto: number;
  precoMercadoLivre: string;
  status: string;
  foiImpresso: Boolean;
}

interface PrintAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  arquivoId: string;
  logo: string | null;
  filtros: {
    pallet?: string;
    condicao?: string;
  };
}

const parsePrice = (v: string | number | null): number => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  return parseFloat(v.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
};

export function PrintAllModal({
  isOpen,
  onClose,
  arquivoId,
  logo,
  filtros,
}: PrintAllModalProps) {
  const { impressoras, selectedId, config, loading: loadingConfig, setSelectedId } = usePrintConfig();

  const [produtos, setProdutos] = useState<ProdutoEtiqueta[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega produtos ao abrir
  useEffect(() => {
    if (!isOpen || !arquivoId) return;

    async function carregar() {
      setLoading(true);
      setError(null);
      setProdutos([]);
      try {
        const data = await listarTodosProdutosEtiqueta(Number(arquivoId), {
          pallet: filtros.pallet || undefined,
          condicao: filtros.condicao || undefined,
        });
        setProdutos(data.filter((p: ProdutoEtiqueta) => p.foiImpresso === false));
      } catch {
        setError("Erro ao carregar produtos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [isOpen, arquivoId]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      
      // Gera todos os barcodes em paralelo
      const barcodesMap = await Promise.all(
        produtos.map(async (p) => ({
          codBarras: p.codBarras,
          dataUrl: await generateBarcodeDataUrl(p.codBarras, LABEL_TOKENS.barcodeW, LABEL_TOKENS.barcodeH),
        }))
      ).then((arr) =>
        Object.fromEntries(arr.map((b) => [b.codBarras, b.dataUrl]))
      );

      // Expande por quantidade, já com barcode e logo resolvidos
      const etiquetas: EtiquetaData[] = produtos.flatMap((p) => {
        const quantidade = p.qtdProduto > 0 ? p.qtdProduto : 1;
        const precoML = p.status === "APROVADO" ? parsePrice(p.precoMercadoLivre) : null;

        return Array(quantidade).fill(null).map(
          (): EtiquetaData => ({
            nome: p.nome,
            sku: p.codBarras,
            precoVenda: Number(p.precoVenda),
            precoMercado: precoML,
            logo,
            barcodeDataUrl: barcodesMap[p.codBarras] ?? null,
          })
        );
      });

      const blob = await pdf(
        <EtiquetaDocument products={etiquetas} config={config} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => {
          win.print();
          win.addEventListener("afterprint", () => URL.revokeObjectURL(url));
        });
      }

      // Marca todos como impressos (IDs únicos, sem repetir por qtd)
      const ids = produtos.map((p) => p.idProduto);
      mudarProdutoImpresso(ids).catch(console.error);
    } catch {
      setError("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setPrinting(false);
    }
  };

  const filtrosAtivos = [filtros.pallet, filtros.condicao].filter(Boolean);
  const totalEtiquetas = produtos.reduce(
    (acc, p) => acc + (p.qtdProduto > 0 ? p.qtdProduto : 1),
    0
  );
  const isReady = !loading && !loadingConfig && !printing && produtos.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Todas as Etiquetas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seletor de impressora */}
          {!loadingConfig && impressoras.length > 0 && (
            <div className="flex items-center gap-2">
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

          {/* Filtros ativos */}
          {filtrosAtivos.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {filtros.pallet && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Pallet: {filtros.pallet}
                </span>
              )}
              {filtros.condicao && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Condição: {filtros.condicao}
                </span>
              )}
            </div>
          )}

          {/* Estados de carregamento / erro / resumo */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando produtos...</p>
            </div>
          )}

          {printing && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Gerando PDF ({totalEtiquetas} etiquetas)...
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!loading && !printing && !error && produtos.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4 border space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produtos encontrados:</span>
                <span className="font-semibold">{produtos.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de etiquetas:</span>
                <span className="font-semibold">{totalEtiquetas}</span>
              </div>
            </div>
          )}

          {!loading && !error && produtos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum produto encontrado com os filtros selecionados.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={!isReady}>
            {printing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            Imprimir {totalEtiquetas > 0 ? `(${totalEtiquetas})` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}