import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { criarLote, editarLote } from "../service/lotesManualService";
import type { LoteRequest, ModoBusca } from "../types/lote";
import type { Lote } from "./LotesTable";

export interface NovoLoteForm {
    nome: string;
    observacao: string;
    acao: ModoBusca | "";
    minimoSimilar: number;
    porcDesc: number;
    porcCusto: number;
}

interface NovoLoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    lote?: Lote | null; // se vier, abre em modo edição
}

const FORM_VAZIO: NovoLoteForm = {
    nome: "", observacao: "", acao: "", minimoSimilar: 70, porcDesc: 0, porcCusto: 0,
};

export function NovoLoteModal({ open, onOpenChange, onSuccess, lote }: NovoLoteModalProps) {
    const isEdicao = !!lote;

    const [form, setForm] = useState<NovoLoteForm>(FORM_VAZIO);
    const [isLoading, setIsLoading] = useState(false);

    // Preenche o form quando abre em modo edição
    useEffect(() => {
        if (open && lote) {
            setForm({
                nome: lote.nomeLote ?? "",
                observacao: lote.observacao ?? "",
                acao: (lote.modo as ModoBusca) ?? "",
                minimoSimilar: lote.minimoSimilar ?? 70,
                porcDesc: lote.porcDesc ?? 0,
                porcCusto: lote.porcCusto ?? 0,
            });
        } else if (open && !lote) {
            setForm(FORM_VAZIO);
        }
    }, [open, lote]);

    const handleSubmit = async () => {
        if (!form.nome || !form.acao) return;
        setIsLoading(true);
        try {
            const payload: LoteRequest = {
                nomeLote: form.nome,
                observacao: form.observacao,
                modo: form.acao as ModoBusca,
                minimoSimilar: form.minimoSimilar,
                porcCusto: form.porcCusto,
                porcDesc: form.porcDesc,
            };

            if (isEdicao && lote) {
                await editarLote(lote.loteId, payload);
            } else {
                await criarLote(payload);
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Falha ao salvar lote:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdicao ? "Editar Lote" : "Novo Lote"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Nome do Lote</Label>
                        <Input placeholder="Ex: Lote Eletrônicos Maio" value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            disabled={isLoading} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Observação</Label>
                        <Textarea placeholder="Observações sobre o lote (opcional)"
                            className="resize-none h-20" value={form.observacao}
                            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                            disabled={isLoading} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Ação (Modo de Seleção)</Label>
                        <select value={form.acao}
                            onChange={(e) => setForm({ ...form, acao: e.target.value as ModoBusca })}
                            disabled={isLoading}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50">
                            <option value="" disabled>Selecione o modo</option>
                            <option value="MENOR">Menor Preço</option>
                            <option value="MAIOR">Maior Preço</option>
                            <option value="MEDIO">Preço Médio</option>
                            <option value="TODOS">Todos (até 3)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Similaridade Mínima:{" "}
                            <span className="font-bold text-primary">{form.minimoSimilar}%</span>
                        </Label>
                        <input type="range" min={50} max={100} step={1}
                            value={form.minimoSimilar}
                            onChange={(e) => setForm({ ...form, minimoSimilar: Number(e.target.value) })}
                            disabled={isLoading} className="w-full accent-primary disabled:opacity-50" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>50% (mais flexível)</span><span>100% (exato)</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Percentual de Custo (%)</Label>
                        <Input type="number" placeholder="Ex: 15" value={form.porcCusto}
                            onChange={(e) => setForm({ ...form, porcCusto: Number(e.target.value) })}
                            disabled={isLoading} min={0} max={100} step={1} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Percentual de Desconto (%)</Label>
                        <Input type="number" placeholder="Ex: 10" value={form.porcDesc}
                            onChange={(e) => setForm({ ...form, porcDesc: Number(e.target.value) })}
                            disabled={isLoading} min={0} max={100} step={1} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!form.nome || !form.acao || isLoading}>
                        {isLoading ? (isEdicao ? "Salvando..." : "Criando...") : (isEdicao ? "Salvar Alterações" : "Criar Lote")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}