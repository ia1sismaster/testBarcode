import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, MoreVertical, Pencil, Trash2, CheckCircle, ShoppingCart, Clock, ToggleLeft, Upload } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { NovoLoteModal } from "./NovoLoteModal";
import { mudarStatusLote } from "../service/lotesManualService";
import { exportarAquivoManual } from "../service/arquivoService";
import { baixarArquivo } from "../utils/dowload";
// ===================== TIPOS =====================

export interface Lote {
  loteId: number;
  nomeLote: string;
  observacao?: string;
  modo?: string;
  minimoSimilar?: number;
  porcDesc?: number;
  porcCusto?: number;
  dataCriacao: string;
  qtdTotalItens: number;
  qtdVariedadeItens: number;
  qtdCategoria: number;
  qtdPallet: number;
  valorLote: number | null;
  status: string;
}

interface LotesTableProps {
  lotes: Lote[];
  onDelete?: (loteId: number) => void;
  onRefresh?: () => void;
}

// ===================== HELPERS =====================

const formatCurrency = (valor: number | null): string => {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatarData = (data: string): string => {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

// ===================== BADGE DE STATUS =====================

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PROCESSANDO: {
      label: "Em Criação",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <Clock className="w-3 h-3" />,
    },
    CONCLUIDO: {
      label: "Disponível",
      className: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    VENDIDO: {
      label: "Vendido",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      icon: <ShoppingCart className="w-3 h-3" />,
    },
  };

  const config = map[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: null,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ============== //

// ===================== COMPONENTE =====================

export function LotesTable({ lotes, onDelete, onRefresh }: LotesTableProps) {
  const navigate = useNavigate();
  const [editando, setEditando] = useState<Lote | null>(null);

  const handleMudarStatus = async (loteId: number, acao: number) => {
    try {
      await mudarStatusLote(loteId, acao);
      onRefresh?.();
    } catch (err) {
      console.error("Erro ao mudar status:", err);
    }
  };

  const handleExportar = async (e: React.MouseEvent, loteId: number) => {
    e.stopPropagation();
    try {
      const response = await exportarAquivoManual(loteId);
      baixarArquivo(response);
    } catch (err) {
      console.error("Erro ao exportar:", err);
    }
  };



  return (
    <>
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Nome do Lote</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-center">Total Itens</TableHead>
              <TableHead className="text-center">Variedade</TableHead>
              <TableHead className="text-center">Categorias</TableHead>
              <TableHead className="text-center">Pallets</TableHead>
              <TableHead className="text-center">Valor do Lote</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {lotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Boxes className="w-10 h-10 opacity-25" />
                    <p className="text-sm">Nenhum lote criado ainda.</p>
                    <p className="text-xs">Clique em "Novo Lote" para começar.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              lotes.map((lote) => (
                <TableRow key={lote.loteId}
                  className="hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/lote/${lote.loteId}`, { state: { lote } })}>

                  <TableCell className="font-medium">{lote.nomeLote}</TableCell>

                  <TableCell className="text-muted-foreground text-sm">
                    {formatarData(lote.dataCriacao)}
                  </TableCell>

                  <TableCell className="text-center font-medium">{lote.qtdTotalItens}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{lote.qtdVariedadeItens}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{lote.qtdCategoria}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{lote.qtdPallet}</TableCell>

                  <TableCell className="text-center font-mono font-semibold text-emerald-700">
                    {formatCurrency(lote.valorLote)}
                  </TableCell>

                  <TableCell className="text-right">
                    <StatusBadge status={lote.status} />
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">

                        {/* Abrir */}
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lote/${lote.loteId}`, { state: { lote } });
                        }}>
                          <Pencil className="w-4 h-4 mr-2" /> Abrir Lote
                        </DropdownMenuItem>

                        {/* Editar cadastro */}
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditando(lote);
                        }}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar Cadastro
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Mudar status — mostra opções conforme status atual */}
                        {lote.status !== "CONCLUIDO" && lote.status !== "VENDIDO" && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleMudarStatus(lote.loteId, 0); // status 0 = CONCLUIDO
                          }}>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                            Marcar como Disponível
                          </DropdownMenuItem>
                        )}

                        {lote.status !== "VENDIDO" && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleMudarStatus(lote.loteId, 1); // status 1 = VENDIDO
                          }}>
                            <ShoppingCart className="w-4 h-4 mr-2 text-slate-600" />
                            Marcar como Vendido
                          </DropdownMenuItem>
                        )}

                        {lote.status !== "PROCESSANDO" && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleMudarStatus(lote.loteId, 2); // status 2 = PROCESSANDO                            
                          }}>
                            <ToggleLeft className="w-4 h-4 mr-2 text-blue-600" />
                            Reabrir Lote
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={(e) => handleExportar(e, lote.loteId)}>
                          <Upload className="w-4 h-4 mr-2" /> Baixar/Exportar
                        </DropdownMenuItem>

                        {/* Excluir */}
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onDelete?.(lote.loteId); }}
                          className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>




                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edição */}
      <NovoLoteModal
        open={!!editando}
        onOpenChange={(open) => { if (!open) setEditando(null); }}
        lote={editando}
        onSuccess={() => { setEditando(null); onRefresh?.(); }}
      />
    </>
  );
}