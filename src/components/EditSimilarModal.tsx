import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Percent } from "lucide-react";

interface TaskData {
  id: number;
  titulo_encontrado: string;
  termo_busca: string;
  valorUnitario: string;
  preco: string;
  preco_desc: string;
  link: string;
  custo: number;
  preco_sugerido: number;
}

interface EditSimilarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  onSave: (data: any) => Promise<void>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toFloat(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  let clean = val.replace(/[R$\s]/g, "").trim();
  if (clean === "") return null;
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    const afterDot = clean.split(".").pop() ?? "";
    if (afterDot.length === 3) clean = clean.replace(/\./g, "");
  }
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

function calcMargem(custo: number | null, pv: number | null): number | null {
  if (!custo || !pv || pv === 0) return null;
  return Math.round(((pv - custo) / pv) * 1000) / 10;
}

// ─── preview badge ────────────────────────────────────────────────────────────

function PreviewBadge({ value, isGood }: { value: string; isGood: boolean }) {
  const color = isGood
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <Percent className="w-3 h-3" />
      {value}
    </span>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function EditSimilarModal({ open, onOpenChange, task, onSave }: EditSimilarModalProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    preco: "",
    precoDesc: "",
    link: "",
    precoSugerido: "",
    descontoSugerido: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      const pe = toFloat(task.preco_desc || task.preco);
      const pv = toFloat(task.preco_sugerido);
      const descInicial = (pe && pv && pe !== 0)
        ? String(Math.round(((pe - pv) / pe) * 1000) / 10)
        : "";

      setFormData({
        titulo: task.titulo_encontrado || "",
        preco: task.preco || "",
        precoDesc: task.preco_desc || "",
        link: task.link || "",
        precoSugerido: task.preco_sugerido ? String(task.preco_sugerido) : "",
        descontoSugerido: descInicial,
      });
    }
  }, [task]);

  // Preço ativo para base dos cálculos (preco_desc tem prioridade)
  const precoAtivo = toFloat(formData.precoDesc || formData.preco);
  const precoSugerido = toFloat(formData.precoSugerido);
  const custo = toFloat(task?.custo);
  const margem = calcMargem(custo, precoSugerido);

  // Mexeu no preço sugerido → recalcula desconto
  function handlePrecoSugeridoChange(val: string) {
    const pv = toFloat(val);
    const desc = (precoAtivo && pv !== null && precoAtivo !== 0)
      ? String(Math.round(((precoAtivo - pv) / precoAtivo) * 1000) / 10)
      : "";
    setFormData(f => ({ ...f, precoSugerido: val, descontoSugerido: desc }));
  }

  // Mexeu no desconto → recalcula preço sugerido: PV = PE * (1 - desc / 100)
  function handleDescontoChange(val: string) {
    const desc = toFloat(val);
    const pv = (precoAtivo !== null && desc !== null)
      ? String(Math.round(precoAtivo * (1 - desc / 100) * 100) / 100)
      : "";
    setFormData(f => ({ ...f, descontoSugerido: val, precoSugerido: pv }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        tarefaId: task?.id,
        titulo: formData.titulo,
        preco: formData.preco,
        precoDesc: formData.precoDesc,
        link: formData.link,
        precoSugerido: toFloat(formData.precoSugerido)
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Corrigir</DialogTitle>
          <DialogDescription>
            Ajuste os dados se o robô pegou algo errado. Ao salvar, o item será aprovado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">

          {/* Título */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="titulo">Título do Produto</Label>
              <Button
                type="button" variant="ghost" size="sm"
                className="h-6 text-xs text-blue-600 hover:text-blue-700"
                onClick={() => setFormData({
                  ...formData,
                  titulo: task?.termo_busca || "",
                  preco: task?.valorUnitario || "",
                  precoDesc: task?.valorUnitario || "",
                })}
              >
                Usar dados da planilha
              </Button>
            </div>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>

          {/* Preços encontrados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="precoDesc">Preço em Promoção</Label>
              <Input
                id="precoDesc"
                value={formData.precoDesc}
                onChange={(e) => setFormData({ ...formData, precoDesc: e.target.value })}
              />
            </div>
          </div>

          {/* Link */}
          <div className="grid gap-2">
            <Label htmlFor="link">Link do Produto</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          {/* Precificação */}
          <div className="border-t pt-3 grid gap-3">
            <div className="grid grid-cols-2 gap-4">

              {/* COLUNA DA ESQUERDA: Preço e Custo */}
              <div className="flex flex-col gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="precoSugerido">Preço de Venda (R$)</Label>
                  <Input
                    id="precoSugerido"
                    placeholder="Ex: 1500"
                    value={formData.precoSugerido}
                    onChange={(e) => handlePrecoSugeridoChange(e.target.value)}
                  />
                </div>

                {/* Custo alinhado logo abaixo do input de preço */}
                {custo !== null && (
                  <div className="px-1">
                    <span className="text-[11px] text-muted-foreground">
                      Custo: <strong className="text-foreground">R$ {custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* COLUNA DA DIREITA: Desconto e Margem */}
              <div className="flex flex-col gap-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="descontoSugerido"
                    className={`transition-colors ${Number(formData.descontoSugerido) < 0 ? "text-red-600 font-bold" : 
                      Number(formData.descontoSugerido) == 0 ? "text-gray-600 font-bold": "text-green-800 font-bold"}`}
                  >
                    Desconto Sugerido (%)
                  </Label>
                  <Input
                    id="descontoSugerido"
                    placeholder="Ex: 50"
                    value={formData.descontoSugerido}
                    onChange={(e) => handleDescontoChange(e.target.value)}
                    className={`transition-all ${Number(formData.descontoSugerido) < 0
                        ? "border-red-500 bg-red-50 text-red-700 focus-visible:ring-red-500 ring-offset-1 ring-1 ring-red-200"
                        : Number(formData.descontoSugerido) == 0 ? "border-gray-500 bg-gray-50 text-gray-700 focus-visible:ring-gray-500 ring-offset-1 ring-1 ring-gray-200":
                        "border-green-800 bg-green-50 text-green-800 focus-visible:ring-green-250 ring-offset-1 ring-1 ring-green-200"
                      }`}
                  />
                </div>

                {/* Margem alinhada logo abaixo do input de desconto */}
                {precoSugerido !== null && margem !== null && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] text-muted-foreground text-nowrap">Margem resultante:</span>
                    <PreviewBadge
                      value={`${margem > 0 ? "+" : ""}${margem.toFixed(1)}%`}
                      isGood={margem >= 15}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}