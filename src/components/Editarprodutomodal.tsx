import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, ExternalLink, Tag, Box, Plus, Check, X } from "lucide-react";
import { useRef } from "react";
import type { ProdutoManual } from "./TaskManualTable";
import { editarProduto } from "../service/ProdutoService";
import { gerarNovoPallet } from "../service/PalletService";
import { infoSelecao } from "../service/ProdutoService";

const GRADE_OPTIONS = ["A", "B", "C", "D"];

interface EditarProdutoForm {
    titulo: string;
    precoML: string;
    precoMLDesc: string;
    link: string;
    custo: number | "";
    quantidade: number | "";
    precoEditado: number | "";
    descontoPct: number | "";
    porcCusto: number | "";
    categoria: string;
    grade: string;
    pallet: string;
}

interface EditarProdutoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    produto: ProdutoManual | null;
    arquivoId: number;
    onSuccess: () => void;
}

function InlineAddPopover({ onAdd, onClose }: {
    onAdd: (valor: string) => void;
    onClose: () => void;
}) {
    const [valor, setValor] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);
    const handleConfirm = () => {
        if (valor.trim()) { onAdd(valor.trim().toUpperCase()); setValor(""); }
    };
    return (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-border rounded-lg shadow-lg p-2 flex gap-1 min-w-[160px]">
            <input ref={inputRef} type="text" placeholder="Ex: Celulares"
                className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                value={valor} onChange={(e) => setValor(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); if (e.key === "Escape") onClose(); }} />
            <button onClick={handleConfirm} className="h-7 w-7 flex items-center justify-center rounded bg-primary text-white hover:bg-primary/90 transition">
                <Check className="w-3 h-3" />
            </button>
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded border border-input text-muted-foreground hover:bg-muted transition">
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

export function EditarProdutoModal({ open, onOpenChange, produto, arquivoId, onSuccess }: EditarProdutoModalProps) {
    const [form, setForm] = useState<EditarProdutoForm>({
        titulo: "", precoML: "", precoMLDesc: "", link: "",
        custo: "", quantidade: "", precoEditado: "", descontoPct: "", porcCusto: "",
        categoria: "", grade: "A", pallet: "",
    });
    const [categorias, setCategorias] = useState<string[]>([]);
    const [pallets, setPallets] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingPallet, setIsGeneratingPallet] = useState(false);
    const [showAddCategoria, setShowAddCategoria] = useState(false);

    // Carrega listas e preenche form quando abre
    useEffect(() => {
        if (open && produto && arquivoId) {
            infoSelecao(arquivoId).then(res => {
                setPallets(res.pallets ?? []);
                setCategorias(res.categorias ?? []);
            }).catch(console.error);

            setForm({
                titulo: produto.nome ?? "",
                precoML: produto.precoMercadoLivre ?? "",
                precoMLDesc: "",
                link: produto.link ?? "",
                custo: produto.custo ?? "",
                quantidade: produto.qtdProduto ?? "",
                precoEditado: produto.precoVenda ?? "",
                descontoPct: "",
                porcCusto: "",
                categoria: produto.categoria ?? "",
                grade: produto.condicao ?? "A",
                pallet: produto.codPallet ?? "",
            });
        }
    }, [open, produto, arquivoId]);

    const calcularCustoAutomatico = (precoBase: string, pctCusto: number | "") => {
        const valorBase = parseFloat(precoBase || "0");
        if (valorBase > 0 && typeof pctCusto === "number")
            return parseFloat((valorBase * (pctCusto / 100)).toFixed(2));
        return "" as const;
    };

    const handlePrecoEditadoChange = (val: string) => {
        const precoEditado = parseFloat(val.replace(",", "."));
        setForm((prev) => {
            const base = parseFloat(prev.precoMLDesc || prev.precoML || "0");
            return {
                ...prev,
                precoEditado: isNaN(precoEditado) ? "" : precoEditado,
                descontoPct: !isNaN(precoEditado) && base > 0
                    ? parseFloat(((1 - precoEditado / base) * 100).toFixed(1)) : "",
            };
        });
    };

    const handleDescontoChange = (val: string) => {
        const pct = parseFloat(val.replace(",", "."));
        setForm((prev) => {
            const base = parseFloat(prev.precoMLDesc || prev.precoML || "0");
            return {
                ...prev,
                descontoPct: isNaN(pct) ? "" : pct,
                precoEditado: !isNaN(pct) && base > 0
                    ? parseFloat((base * (1 - pct / 100)).toFixed(2)) : "",
            };
        });
    };

    const handleGerarPallet = async () => {
        try {
            setIsGeneratingPallet(true);
            const novoCodigo = await gerarNovoPallet(arquivoId);
            setPallets((prev) => [...prev, novoCodigo]);
            setForm((prev) => ({ ...prev, pallet: novoCodigo }));
        } catch (err) {
            console.error("Erro ao gerar pallet:", err);
        } finally {
            setIsGeneratingPallet(false);
        }
    };

    const handleAddCategoria = (valor: string) => {
        setCategorias((prev) => [...prev, valor]);
        setForm((prev) => ({ ...prev, categoria: valor }));
        setShowAddCategoria(false);
    };

    const handleSubmit = async () => {
        if (!produto) return;
        setIsSubmitting(true);
        try {
            await editarProduto(produto.idProduto, {
                nomeProduto: form.titulo,
                precoMl: form.precoML,
                precoMlDesc: form.precoMLDesc,
                link: form.link,
                custo: Number(form.custo),
                qtdProduto: Number(form.quantidade),
                precoVenda: Number(form.precoEditado),
                condicao: form.grade,
                codPallet: form.pallet,
                categoria: form.categoria,
            });
            onSuccess();
            onOpenChange(false);
        } catch (err) {
            console.error("Erro ao editar produto:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = (extra = "") =>
        `h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${extra}`;

    const canSubmit = !!form.titulo && form.quantidade !== "" && form.precoEditado !== "" && !isSubmitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        Editar Produto
                    </DialogTitle>
                    {produto && (
                        <p className="text-xs text-muted-foreground font-mono">{produto.codBarras}</p>
                    )}
                </DialogHeader>

                <div className="w-full overflow-hidden space-y-4 pt-2">

                    {/* TÍTULO + VER NO ML */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <Label>Título do Produto</Label>
                            {form.link && (
                                <a href={form.link} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0">
                                    <ExternalLink className="w-3 h-3" /> Ver no ML
                                </a>
                            )}
                        </div>
                        <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full" />
                    </div>

                    {/* PREÇOS ML */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                        <div className="space-y-1.5 min-w-0">
                            <Label className="text-muted-foreground text-xs">Preço ML (R$)</Label>
                            <Input placeholder="—" value={form.precoML}
                                onChange={(e) => setForm({ ...form, precoML: e.target.value })} className="w-full" />
                        </div>
                    </div>

                    {/* PREÇO EDITADO ↔ DESCONTO */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                        <div className="space-y-1.5 min-w-0">
                            <Label>Preço de Venda (R$)</Label>
                            <div className="relative w-full">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">R$</span>
                                <input type="number" className={inputCls("pl-8")} value={form.precoEditado}
                                    onChange={(e) => handlePrecoEditadoChange(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                            <Label>Desconto (%)</Label>
                            <div className="relative w-full">
                                <input type="number" className={inputCls("pr-8")} value={form.descontoPct}
                                    onChange={(e) => handleDescontoChange(e.target.value)} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                            </div>
                        </div>
                    </div>

                    {/* CUSTO + PORCENTAGEM + QUANTIDADE */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" }}>
                        <div className="space-y-1.5 min-w-0">
                            <Label className="text-[11px]">Porc. Custo (%)</Label>
                            <div className="relative w-full">
                                <input type="number" className={inputCls("pr-7 bg-muted/20")} value={form.porcCusto}
                                    onChange={(e) => {
                                        const novaPct = e.target.value === "" ? "" : parseFloat(e.target.value);
                                        setForm(prev => ({
                                            ...prev,
                                            porcCusto: novaPct,
                                            custo: calcularCustoAutomatico(prev.precoMLDesc || prev.precoML, novaPct)
                                        }));
                                    }} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                            <Label className="text-[11px]">Custo Unit. (R$)</Label>
                            <div className="relative w-full">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">R$</span>
                                <input type="number" className={inputCls("pl-7")} value={form.custo}
                                    onChange={(e) => setForm({ ...form, custo: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                            <Label className="text-[11px]">Quantidade</Label>
                            <input type="number" min={1} className={inputCls()} value={form.quantidade}
                                onChange={(e) => setForm({ ...form, quantidade: e.target.value === "" ? "" : parseInt(e.target.value) })} />
                        </div>
                    </div>

                    {/* CATEGORIA + GRADE + PALLET */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) minmax(0,2fr)" }}>

                        {/* Categoria */}
                        <div className="space-y-1.5 relative min-w-0">
                            <Label className="flex items-center gap-1 text-xs"><Tag className="w-3 h-3 shrink-0" /> Categoria</Label>
                            <div className="flex gap-1 w-full min-w-0">
                                <select className={inputCls("flex-1 min-w-0 px-2")}
                                    value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                                    <option value="">Selecione</option>
                                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button type="button" onClick={() => setShowAddCategoria(true)}
                                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition text-muted-foreground hover:text-primary">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {showAddCategoria && <InlineAddPopover onAdd={handleAddCategoria} onClose={() => setShowAddCategoria(false)} />}
                        </div>

                        {/* Grade */}
                        <div className="space-y-1.5 min-w-0">
                            <Label className="text-xs">Grade</Label>
                            <select className={inputCls("px-2")} value={form.grade}
                                onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        {/* Pallet */}
                        <div className="space-y-1.5 relative min-w-0">
                            <Label className="flex items-center gap-1 text-xs"><Box className="w-3 h-3 shrink-0" /> Pallet</Label>
                            <div className="flex gap-1 w-full min-w-0">
                                <select className={inputCls("flex-1 min-w-0 px-2")} value={form.pallet}
                                    onChange={(e) => setForm({ ...form, pallet: e.target.value })}>
                                    <option value="">Selecione</option>
                                    {pallets.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <button type="button" onClick={handleGerarPallet} disabled={isGeneratingPallet}
                                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition text-muted-foreground hover:text-primary disabled:opacity-50">
                                    {isGeneratingPallet ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={!canSubmit}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}