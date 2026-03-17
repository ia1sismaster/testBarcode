import { Search, Printer, Save, Package, Loader2, CheckCircle2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import { Button } from "./ui/button";

export interface ProdutoManual {
  idProduto: number;
  nome: string;
  condicao: string | null;
  codPallet: string | null;
  codBarras: string;
  custo: number;
  precoVenda: number;
  qtdProduto: number;
  precoMercadoLivre: string | null;
  status: string;
  categoria: string | null;
  link: string | null;
  foiImpresso: boolean;
}

interface TaskManualTableProps {
  produtos: ProdutoManual[];
  changes: Record<number, number>;
  isSaving: boolean;
  searchTerm: string;
  palletFilter: string;
  condicaoFilter: string;
  categoriaFilter: string;
  availablePallets: { nome: string; qtd: number }[];
  availableCondicoes: { nome: string; qtd: number }[];
  availableCategorias: { nome: string; qtd: number }[];
  onSearchChange: (val: string) => void;
  onPalletChange: (val: string) => void;
  onCondicaoChange: (val: string) => void;
  onCategoriaChange: (val: string) => void;
  onPrecoChange: (id: number, val: string) => void;
  onSalvar: () => void;
  onPrintAll: () => void;
  onPrint: (produto: ProdutoManual) => void;
  onEdit: (produto: ProdutoManual) => void;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const parsePrice = (val: string | number | null): number => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return parseFloat(val.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
};

function PrecoMLBadge({ produto }: { produto: ProdutoManual }) {
  const status = produto.status || "NA";
  if (status === "APROVADO") {
    const precoML = parsePrice(produto.precoMercadoLivre);
    const ganho = (produto.precoVenda || 0) < precoML;
    return (
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${ganho ? "text-green-600" : "text-foreground"}`}>
          {produto.precoMercadoLivre ? `R$ ${produto.precoMercadoLivre}` : "—"}
        </span>
        {ganho && <span className="text-[10px] text-green-600">Você ganha</span>}
      </div>
    );
  }
  const badgeMap: Record<string, string> = {
    REPROVADO: "bg-purple-100 text-purple-700",
    NA: "bg-orange-100 text-orange-700",
  };
  const labelMap: Record<string, string> = {
    REPROVADO: "Revisar",
    NA: "N/A",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeMap[status] || "bg-yellow-100 text-yellow-700"}`}>
      {labelMap[status] || "Processando"}
    </span>
  );
}

export function TaskManualTable({
  produtos, changes, isSaving, searchTerm, palletFilter, condicaoFilter, categoriaFilter,
  availablePallets, availableCondicoes, availableCategorias,
  onSearchChange, onPalletChange, onCondicaoChange, onCategoriaChange,
  onPrecoChange, onSalvar, onPrintAll, onPrint, onEdit,
}: TaskManualTableProps) {
  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">

      {/* CABEÇALHO */}
      <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produto, código..."
              className="pl-9 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <select className="h-9 w-32 rounded-md border border-input bg-background px-2 text-sm focus:ring-1 focus:ring-primary" value={palletFilter} onChange={(e) => onPalletChange(e.target.value)}>
            <option value="">Pallet</option>
            {availablePallets.map(p => <option key={p.nome} value={p.nome}>{p.nome} ({p.qtd})</option>)}
          </select>
          <select className="h-9 w-32 rounded-md border border-input bg-background px-2 text-sm focus:ring-1 focus:ring-primary" value={condicaoFilter} onChange={(e) => onCondicaoChange(e.target.value)}>
            <option value="">Condição</option>
            {availableCondicoes.map(c => <option key={c.nome} value={c.nome}>{c.nome} ({c.qtd})</option>)}
          </select>
          <select className="h-9 w-36 rounded-md border border-input bg-background px-2 text-sm focus:ring-1 focus:ring-primary" value={categoriaFilter} onChange={(e) => onCategoriaChange(e.target.value)}>
            <option value="">Categoria</option>
            {availableCategorias.map(c => <option key={c.nome} value={c.nome}>{c.nome} ({c.qtd})</option>)}
          </select>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onPrintAll}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Todos
          </Button>
          <Button size="sm" onClick={onSalvar} disabled={Object.keys(changes).length === 0 || isSaving} className={Object.keys(changes).length > 0 ? "animate-pulse" : ""}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {Object.keys(changes).length > 0 ? `Salvar (${Object.keys(changes).length})` : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* TABELA */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Produto</TableHead>
            <TableHead className="text-center w-16">Qtd.</TableHead>
            <TableHead>Pallet / Cond.</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Venda Unit.</TableHead>
            <TableHead>Ref. ML</TableHead>
            <TableHead className="text-right w-[110px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Package className="w-10 h-10 opacity-25" />
                  <p className="text-sm">Nenhum produto encontrado.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            produtos.map((produto) => {
              const isModified = changes[produto.idProduto] !== undefined;
              return (
                <TableRow key={produto.idProduto} className={`hover:bg-muted/20 transition-colors ${isModified ? "bg-blue-50/30" : ""}`}>

                  {/* Produto + badge impresso */}
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[220px]">{produto.nome}</p>
                        {produto.codBarras && (
                          <p className="text-xs text-muted-foreground">{produto.codBarras}</p>
                        )}
                      </div>
                      {produto.foiImpresso && (
                        <span title="Já impresso">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Qtd */}
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {produto.qtdProduto}
                    </span>
                  </TableCell>

                  {/* Pallet / Condição */}
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {produto.codPallet && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{produto.codPallet}</span>
                      )}
                      {produto.condicao && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{produto.condicao}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Categoria */}
                  <TableCell className="text-xs text-muted-foreground">{produto.categoria || "—"}</TableCell>

                  {/* Venda Unit. */}
                  <TableCell>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <input
                        type="number"
                        className={`pl-6 h-8 w-24 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-primary ${isModified ? "border-blue-400 ring-1 ring-blue-400" : "bg-background border-input"}`}
                        value={produto.precoVenda || ""}
                        onChange={(e) => onPrecoChange(produto.idProduto, e.target.value)}
                      />
                    </div>
                  </TableCell>

                  {/* Ref. ML */}
                  <TableCell><PrecoMLBadge produto={produto} /></TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        title="Imprimir etiqueta"
                        className={`h-8 w-8 ${produto.foiImpresso ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => onPrint(produto)}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      {produto.link && (
                        <a href={produto.link} target="_blank" rel="noreferrer" title="Ver no Mercado Livre"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-blue-600 hover:bg-accent transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" title="Editar produto"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                        onClick={() => onEdit(produto)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 2.828L11.828 13.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}