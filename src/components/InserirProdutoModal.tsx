import { useState, useEffect, useRef, useCallback } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Barcode, Search, Loader2, ExternalLink,
    Plus, Check, X, Tag, Box, RefreshCw, PenLine, Type,
    ChevronDown, ChevronUp, Star, PackagePlus
} from "lucide-react";
import type { ReturnTarefaDto, SaveTarefaManualDto, CandidatoDto } from "../types/lote";
import type { ResponseProduto } from "../types/produto";
import {
    criarTarefa,
    consultarStatusTarefa,
    gerarProduto,
    cancelarTarefa,
    verificarBarcodeExistente,
    adicionarQuantidade,
} from "../service/lotesManualService";
import { gerarNovoPallet } from "../service/PalletService";
import { infoSelecao } from "../service/ProdutoService";

type RefBusca = "BARCODE" | "NOME";

interface InserirProdutoForm {
    barcode: string;
    nomeBusca: string;
    refBusca: RefBusca;
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
    minimoSimilar: number;
}

interface InserirProdutoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    arquivoId: number;
    categorias: string[];
    pallets: string[];
    minimoSimilarPadrao: number;
    onSuccess: (produtoParaImprimir?: { idProduto: number; nome: string; codBarras: string; precoVenda: number; precoMercadoLivre: string | null; status: string; qtdProduto: number }) => void;
    onNovaPalavra?: (tipo: "categoria" | "pallet", valor: string) => Promise<void>;
}

type BuscaStatus =
    | "idle" | "buscando" | "aguardando" | "sucesso"
    | "nao_encontrado" | "bloqueado" | "manual" | "erro" | "existente";

const GRADE_OPTIONS = ["A", "B", "C", "D"];
const POLLING_INTERVAL = 3000;
const POLLING_MAX = 13;

function InlineAddPopover({ onAdd, onClose }: {
    tipo: "categoria";
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

function CandidatosPanel({ candidatos, candidatoSelecionadoId, onSelecionar, porcDesc }: {
    candidatos: CandidatoDto[];
    candidatoSelecionadoId: number | null;
    onSelecionar: (c: CandidatoDto) => void;
    porcDesc: number;
}) {
    const [aberto, setAberto] = useState(false);
    return (
        <div className="rounded-md border border-blue-200 bg-blue-50/40 overflow-hidden">
            <button type="button" onClick={() => setAberto((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition">
                <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    {candidatos.length} candidato{candidatos.length > 1 ? "s" : ""} encontrado{candidatos.length > 1 ? "s" : ""} — clique para ver opções
                </span>
                {aberto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {aberto && (
                <div className="divide-y divide-blue-100">
                    {candidatos.map((c) => {
                        const selecionado = c.id === candidatoSelecionadoId;
                        const base = parsePrecoML(c.precoDesconto || c.preco || "0");
                        const precoVenda = base > 0 ? (base * (1 - porcDesc / 100)).toFixed(2) : "—";
                        return (
                            <button key={c.id} type="button" onClick={() => onSelecionar(c)}
                                className={`w-full text-left px-3 py-2.5 transition flex items-start gap-3 ${selecionado ? "bg-blue-100 border-l-2 border-blue-500" : "hover:bg-blue-50/80"}`}>
                                <span className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selecionado ? "border-blue-500 bg-blue-500" : "border-muted-foreground"}`}>
                                    {selecionado && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{c.titulo}</p>
                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                        <span className="text-[10px] text-muted-foreground">ML: <span className="font-medium text-foreground">R$ {c.precoDesconto || c.preco || "—"}</span></span>
                                        <span className="text-[10px] text-muted-foreground">Venda: <span className="font-medium text-emerald-700">R$ {precoVenda}</span></span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.matchScore >= 90 ? "bg-green-100 text-green-700" : c.matchScore >= 75 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                            {c.matchScore}% match
                                        </span>
                                        {c.link && (
                                            <a href={c.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                                                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                                                <ExternalLink className="w-2.5 h-2.5" /> Ver
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Parseia preço do ML: pode vir como "7.525,00" ou "7525.00" ou "7525" ou 7525
const parsePrecoML = (val: string | number | null | undefined): number => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    const s = val.trim();
    // formato pt-BR: "7.525,00" — tem vírgula como decimal
    if (s.includes(",")) {
        return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
    }
    // formato com ponto como milhar e sem vírgula: "7.525"
    // heurística: se tem ponto e a parte após o ponto tem 3 dígitos → milhar
    const dotIdx = s.lastIndexOf(".");
    if (dotIdx !== -1 && s.length - dotIdx - 1 === 3) {
        return parseFloat(s.replace(/\./g, "")) || 0;
    }
    return parseFloat(s) || 0;
};

const makeEmptyForm = (minimoSimilar: number): InserirProdutoForm => ({
    barcode: "", nomeBusca: "", refBusca: "BARCODE",
    titulo: "", precoML: "", precoMLDesc: "", link: "",
    custo: "", quantidade: "", precoEditado: "", descontoPct: "", porcCusto: "",
    categoria: "", grade: "A", pallet: "", minimoSimilar,
});

export function InserirProdutoModal({
    open, onOpenChange, arquivoId,
    categorias: categoriasProp, pallets: palletsProp,
    minimoSimilarPadrao, onSuccess, onNovaPalavra,
}: InserirProdutoModalProps) {

    const [form, setForm] = useState<InserirProdutoForm>(makeEmptyForm(minimoSimilarPadrao));
    const [buscaStatus, setBuscaStatus] = useState<BuscaStatus>("idle");
    const [buscaMsg, setBuscaMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingPallet, setIsGeneratingPallet] = useState(false);
    const [tarefaId, setTarefaId] = useState<number | null>(null);
    const [candidatos, setCandidatos] = useState<CandidatoDto[]>([]);
    const [candidatoSelecionadoId, setCandidatoSelecionadoId] = useState<number | null>(null);
    const [porcDescRetorno, setPorcDescRetorno] = useState(0);
    const [categorias, setCategorias] = useState<string[]>(categoriasProp);
    const [pallets, setPallets] = useState<string[]>(palletsProp);
    const [showAddCategoria, setShowAddCategoria] = useState(false);
    const [produtoExistente, setProdutoExistente] = useState<ResponseProduto | null>(null);
    const [imprimirAoSalvar, setImprimirAoSalvar] = useState(false);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollingAttempts = useRef(0);
    const tarefaIdRef = useRef<number | null>(null);

    useEffect(() => { setCategorias(categoriasProp); }, [categoriasProp]);
    useEffect(() => { setPallets(palletsProp); }, [palletsProp]);
    useEffect(() => { tarefaIdRef.current = tarefaId; }, [tarefaId]);

    useEffect(() => {
        if (open && arquivoId) {
            infoSelecao(arquivoId).then(res => {
                setPallets(res.pallets ?? []);
                setCategorias(res.categorias ?? []);
                if (res.pallets && res.pallets.length > 0)
                    setForm(prev => ({ ...prev, pallet: res.pallets[0] }));
            }).catch(console.error);
        }
    }, [open, arquivoId]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        pollingAttempts.current = 0;
    }, []);

    useEffect(() => {
        if (!open) {
            stopPolling();
            if (tarefaIdRef.current) cancelarTarefa(tarefaIdRef.current).catch(console.error);
            setForm(makeEmptyForm(minimoSimilarPadrao));
            setBuscaStatus("idle");
            setBuscaMsg("");
            setTarefaId(null);
            setCandidatos([]);
            setCandidatoSelecionadoId(null);
            setProdutoExistente(null);
            tarefaIdRef.current = null;
        }
    }, [open, minimoSimilarPadrao, stopPolling]);

    const calcularCustoAutomatico = (precoBase: string, pctCusto: number | "") => {
        const valorBase = parsePrecoML(precoBase || "0");
        if (valorBase > 0 && typeof pctCusto === "number")
            return parseFloat((valorBase * (pctCusto / 100)).toFixed(2));
        return "" as const;
    };

    const handlePrecoEditadoChange = (val: string) => {
        const precoEditado = parseFloat(val.replace(",", "."));
        setForm((prev) => {
            const base = parsePrecoML(prev.precoMLDesc || prev.precoML);
            return {
                ...prev,
                precoEditado: isNaN(precoEditado) ? "" : precoEditado,
                descontoPct: !isNaN(precoEditado) && base > 0 ? parseFloat(((1 - precoEditado / base) * 100).toFixed(1)) : "",
            };
        });
    };

    const handleDescontoChange = (val: string) => {
        const pct = parseFloat(val.replace(",", "."));
        setForm((prev) => {
            const base = parsePrecoML(prev.precoMLDesc || prev.precoML);
            return {
                ...prev,
                descontoPct: isNaN(pct) ? "" : pct,
                precoEditado: !isNaN(pct) && base > 0 ? parseFloat((base * (1 - pct / 100)).toFixed(2)) : "",
            };
        });
    };

    const preencherComCandidato = (c: CandidatoDto, porcDesc: number) => {
        const base = parsePrecoML(c.precoDesconto || c.preco);
        setForm((prev) => ({
            ...prev,
            titulo: c.titulo, precoML: c.preco, precoMLDesc: c.precoDesconto, link: c.link,
            descontoPct: porcDesc,
            precoEditado: base > 0 ? parseFloat((base * (1 - porcDesc / 100)).toFixed(2)) : "",
            custo: calcularCustoAutomatico(c.precoDesconto || c.preco || "0", prev.porcCusto),
        }));
    };

    const preencherComRetorno = (res: ReturnTarefaDto) => {
        const base = parsePrecoML(res.precoMlDesc || res.precoMl);
        const pct = res.porcDesc ?? 0;
        const pctCusto = res.porcCusto ?? 0;
        setPorcDescRetorno(pct);
        if (res.categoria)
            setCategorias(prev => prev.includes(res.categoria) ? prev : [...prev, res.categoria]);
        setForm((prev) => ({
            ...prev,
            titulo: res.nomeProduto, precoML: res.precoMl, precoMLDesc: res.precoMlDesc,
            link: res.url, descontoPct: pct, porcCusto: pctCusto, categoria: res.categoria,
            precoEditado: base > 0 ? parseFloat((base * (1 - pct / 100)).toFixed(2)) : "",
            custo: calcularCustoAutomatico(res.precoMlDesc || res.precoMl || "0", pctCusto),
        }));
        if (res.candidatos && res.candidatos.length > 0) {
            setCandidatos(res.candidatos);
            const escolhido = res.candidatos.find((c) => c.escolhido);
            if (escolhido) setCandidatoSelecionadoId(escolhido.id);
        }
    };

    const handleSelecionarCandidato = (c: CandidatoDto) => {
        setCandidatoSelecionadoId(c.id);
        preencherComCandidato(c, porcDescRetorno);
    };

    const handleGerarPalletAutomatico = async () => {
        try {
            setIsGeneratingPallet(true);
            const novoCodigo = await gerarNovoPallet(arquivoId);
            setPallets((prev) => [...prev, novoCodigo]);
            setForm((prev) => ({ ...prev, pallet: novoCodigo }));
            await onNovaPalavra?.("pallet", novoCodigo);
        } catch (err) {
            console.error("Erro ao gerar pallet:", err);
        } finally {
            setIsGeneratingPallet(false);
        }
    };

    const iniciarPolling = (idTarefa: number) => {
        stopPolling();
        pollingAttempts.current = 0;
        setTimeout(() => {
            pollingRef.current = setInterval(async () => {
                pollingAttempts.current += 1;
                if (pollingAttempts.current > POLLING_MAX) {
                    stopPolling(); setBuscaStatus("erro"); setBuscaMsg("Tempo esgotado. Tente novamente."); return;
                }
                try {
                    const res: ReturnTarefaDto = await consultarStatusTarefa(idTarefa);
                    if (res.status === "PENDENTE" || res.status === "EM_PROCESSAMENTO") return;
                    stopPolling();
                    if (res.status === "SUCESSO" || res.status === "SIMILAR") {
                        preencherComRetorno(res);
                        setBuscaStatus("sucesso");
                        setBuscaMsg(res.status === "SIMILAR" ? "Produto encontrado com similaridade — confira os candidatos abaixo" : "Produto encontrado!");
                    } else if (res.status === "NAO_ENCONTRADO") {
                        setBuscaStatus("nao_encontrado");
                        setBuscaMsg("Produto não encontrado. Ajuste a similaridade e busque novamente, ou preencha manualmente.");
                    } else if (res.status === "BLOQUEADO") {
                        setBuscaStatus("bloqueado");
                        setBuscaMsg("Agente bloqueado. Preencha os campos manualmente.");
                    }
                } catch {
                    stopPolling(); setBuscaStatus("erro"); setBuscaMsg("Erro ao consultar status.");
                }
            }, POLLING_INTERVAL);
        }, 2000);
    };

    const handleBuscar = async () => {
        // termo depende do modo
        const termo = form.refBusca === "NOME" ? form.nomeBusca : form.barcode;
        if (!termo.trim()) return;

        setBuscaStatus("buscando");
        setBuscaMsg("Verificando no lote...");
        setCandidatos([]);
        setCandidatoSelecionadoId(null);
        setProdutoExistente(null);

        // Verifica existente (barcode ou nome)
        try {
            const existente = await verificarBarcodeExistente(arquivoId, termo, form.refBusca);
            if (existente) {
                setProdutoExistente(existente);
                setForm((prev) => ({
                    ...prev,
                    titulo: existente.nome,
                    precoML: existente.precoMercadoLivre ?? "",
                    link: existente.link ?? "",
                    categoria: existente.categoria ?? "",
                    pallet: existente.codPallet ?? "",
                    grade: existente.condicao ?? "A",
                    quantidade: "",
                    precoEditado: existente.precoVenda ?? "",
                    custo: existente.custo ?? "",
                }));
                setBuscaStatus("existente");
                setBuscaMsg(`Produto já cadastrado neste lote (${existente.qtdProduto} un.) — informe quantas unidades adicionar`);
                return;
            }
        } catch {
            setBuscaStatus("erro");
            setBuscaMsg("Erro ao verificar.");
            return;
        }

        // Dispara agente
        setBuscaMsg("Enviando para o agente...");
        try {
            if (tarefaIdRef.current) {
                await cancelarTarefa(tarefaIdRef.current).catch(console.error);
                setTarefaId(null); tarefaIdRef.current = null;
            }
            const idTarefa = await criarTarefa(
                { termo_busca: termo, minimoSimilar: form.minimoSimilar, codMercadoLivre: form.barcode, refBusca: form.refBusca },
                arquivoId
            );
            setTarefaId(idTarefa);
            tarefaIdRef.current = idTarefa;
            setBuscaStatus("aguardando");
            setBuscaMsg(form.refBusca === "NOME" ? `Buscando pelo nome: "${termo}"...` : "Aguardando o agente processar...");
            iniciarPolling(idTarefa);
        } catch {
            setBuscaStatus("erro"); setBuscaMsg("Erro ao enviar para o agente.");
        }
    };

    // Ativa modo manual imediatamente, sem depender de status
    const handlePreencher = () => {
        setBuscaStatus("manual");
        setBuscaMsg("Preencha os campos manualmente e confirme.");
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (produtoExistente) {
                await adicionarQuantidade(produtoExistente.idProduto, Number(form.quantidade));
                if (imprimirAoSalvar) {
                    onSuccess({
                        idProduto: produtoExistente.idProduto,
                        nome: produtoExistente.nome,
                        codBarras: produtoExistente.codBarras,
                        precoVenda: Number(form.precoEditado) || produtoExistente.precoVenda,
                        precoMercadoLivre: produtoExistente.precoMercadoLivre,
                        status: produtoExistente.status,
                        qtdProduto: Number(form.quantidade),
                    });
                } else {
                    onSuccess();
                }
            } else {
                if (!tarefaId) return;
                const dto: SaveTarefaManualDto = {
                    tarefaId, nomeProduto: form.titulo, preco: form.precoML, preco_desc: form.precoMLDesc,
                    qtdProduto: Number(form.quantidade), custo_digitado: Number(form.custo),
                    preco_venda: Number(form.precoEditado), condicao: form.grade,
                    codPallet: form.pallet, categoria: form.categoria, link: form.link,
                };
                const produtoCriado = await gerarProduto(dto);
                tarefaIdRef.current = null;
                setTarefaId(null);
                if (imprimirAoSalvar && produtoCriado) {
                    onSuccess({
                        idProduto: produtoCriado.idProduto,
                        nome: produtoCriado.nome,
                        codBarras: produtoCriado.codBarras,
                        precoVenda: produtoCriado.precoVenda,
                        precoMercadoLivre: produtoCriado.precoMercadoLivre,
                        status: produtoCriado.status,
                        qtdProduto: Number(form.quantidade),
                    });
                } else {
                    onSuccess();
                }
            }
            onOpenChange(false);
        } catch (err) {
            console.error("Erro ao salvar:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCategoria = async (valor: string) => {
        setCategorias((prev) => [...prev, valor]);
        setForm((prev) => ({ ...prev, categoria: valor }));
        setShowAddCategoria(false);
        await onNovaPalavra?.("categoria", valor);
    };

    const isExistente = buscaStatus === "existente";
    const camposEditaveis = ["sucesso", "nao_encontrado", "bloqueado", "manual"].includes(buscaStatus);

    // Pode buscar: não está em progresso e não finalizou com sucesso/existente
    const podeBuscar = !["buscando", "aguardando", "sucesso", "existente"].includes(buscaStatus);
    const termoBuscaVazio = form.refBusca === "NOME" ? !form.nomeBusca.trim() : !form.barcode.trim();

    const canSubmit = !isSubmitting && (
        (isExistente && form.quantidade !== "") ||
        (!!tarefaId && ["sucesso", "nao_encontrado", "bloqueado", "manual"].includes(buscaStatus) &&
            !!form.titulo && form.quantidade !== "" && form.precoEditado !== "")
    );

    const bannerClass =
        buscaStatus === "sucesso" ? "bg-green-50 text-green-700 border-green-200" :
            buscaStatus === "existente" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                buscaStatus === "nao_encontrado" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    buscaStatus === "bloqueado" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        buscaStatus === "manual" ? "bg-purple-50 text-purple-700 border-purple-200" :
                            buscaStatus === "erro" ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-blue-50 text-blue-700 border-blue-200";

    const labelBotaoBuscar =
        buscaStatus === "aguardando" ? "Processando..." :
            buscaStatus === "nao_encontrado" ? "Buscar Novamente" :
                form.refBusca === "NOME" ? "Buscar pelo Nome" : "Buscar no ML";

    const iconeBotaoBuscar = (buscaStatus === "buscando" || buscaStatus === "aguardando")
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : buscaStatus === "nao_encontrado" ? <RefreshCw className="w-4 h-4" />
            : form.refBusca === "NOME" ? <Type className="w-4 h-4" />
                : <Search className="w-4 h-4" />;

    const inputCls = (extra = "") =>
        `h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${extra}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Barcode className="w-5 h-5 text-primary shrink-0" />
                        {isExistente ? "Adicionar Quantidade" : "Buscar Novo Produto"}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        {isExistente
                            ? "Produto já existente neste lote. Informe a quantidade a adicionar ao estoque."
                            : "Serão localizadas opções de anúncios e a escolha vai obedecer o parâmetro definido na criação do lote."}
                    </p>
                </DialogHeader>

                <div className="w-full overflow-hidden space-y-4 pt-2">

                    {/* MODO DE BUSCA — sempre visível */}
                    <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg w-fit">
                        <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, refBusca: "BARCODE", nomeBusca: "" }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${form.refBusca === "BARCODE" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Barcode className="w-3.5 h-3.5" /> Código de Barras
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, refBusca: "NOME", barcode: "" }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${form.refBusca === "NOME" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Type className="w-3.5 h-3.5" /> Nome do Produto
                        </button>
                    </div>

                    {/* INPUT DE BUSCA — muda conforme modo */}
                    <div className="space-y-1.5">
                        <Label>{form.refBusca === "NOME" ? "Nome do Produto" : "Código de Barras"}</Label>
                        <div className="flex gap-2 w-full min-w-0">
                            <div className="flex-1 min-w-0">
                                {form.refBusca === "BARCODE" ? (
                                    <Input
                                        placeholder="Digite ou escaneie o código..."
                                        value={form.barcode}
                                        onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                                        onKeyDown={(e) => e.key === "Enter" && podeBuscar && handleBuscar()}
                                        disabled={!podeBuscar || isExistente}
                                        className="font-mono w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <Input
                                        placeholder="Digite o nome do produto..."
                                        value={form.nomeBusca}
                                        onChange={(e) => setForm({ ...form, nomeBusca: e.target.value })}
                                        onKeyDown={(e) => e.key === "Enter" && podeBuscar && handleBuscar()}
                                        disabled={!podeBuscar || isExistente}
                                         className="font-mono w-full"
                                        autoFocus={form.refBusca === "NOME"}
                                    />
                                )}
                            </div>

                            {!isExistente ? (
                                <Button
                                    onClick={handleBuscar}
                                    disabled={termoBuscaVazio || !podeBuscar}
                                    variant={buscaStatus === "nao_encontrado" ? "outline" : "default"}
                                    className="shrink-0 whitespace-nowrap"
                                >
                                    {iconeBotaoBuscar}
                                    <span className="ml-2">{labelBotaoBuscar}</span>
                                </Button>
                            ) : (
                                <Button variant="outline" className="shrink-0 whitespace-nowrap text-xs"
                                    onClick={() => { setProdutoExistente(null); setForm(makeEmptyForm(minimoSimilarPadrao)); setBuscaStatus("idle"); setBuscaMsg(""); }}>
                                    <X className="w-3.5 h-3.5 mr-1" /> Trocar produto
                                </Button>
                            )}
                        </div>

                        {/* Botão preencher manual — só em bloqueado/nao_encontrado */}
                        {["nao_encontrado", "bloqueado"].includes(buscaStatus) && (
                            <button
                                type="button"
                                onClick={handlePreencher}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mt-1"
                            >
                                <PenLine className="w-3 h-3" /> Preencher manualmente
                            </button>
                        )}

                        {/* Banner de status */}
                        {buscaStatus !== "idle" && (
                            <div className={`flex items-start gap-2 text-xs px-3 py-2 rounded-md border w-full ${bannerClass}`}>
                                <span className="shrink-0 mt-0.5">
                                    {(buscaStatus === "buscando" || buscaStatus === "aguardando") && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {buscaStatus === "sucesso" && <Check className="w-3 h-3" />}
                                    {buscaStatus === "existente" && <PackagePlus className="w-3 h-3" />}
                                    {buscaStatus === "nao_encontrado" && <X className="w-3 h-3" />}
                                    {buscaStatus === "bloqueado" && <X className="w-3 h-3" />}
                                    {buscaStatus === "manual" && <PenLine className="w-3 h-3" />}
                                    {buscaStatus === "erro" && <X className="w-3 h-3" />}
                                </span>
                                <p className="break-words flex-1 min-w-0">{buscaMsg}</p>
                            </div>
                        )}
                    </div>

                    {/* SIMILARIDADE */}
                    {!isExistente && (
                        <div className="space-y-1.5">
                            <Label>
                                Similaridade Mínima:{" "}
                                <span className="font-bold text-primary">{form.minimoSimilar}%</span>
                                {buscaStatus === "nao_encontrado" && (
                                    <span className="ml-2 text-xs text-yellow-600 font-normal">← ajuste e busque novamente</span>
                                )}
                            </Label>
                            <input type="range" min={50} max={100} step={1}
                                value={form.minimoSimilar}
                                onChange={(e) => setForm({ ...form, minimoSimilar: Number(e.target.value) })}
                                className="w-full accent-primary" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>50% (flexível)</span><span>100% (exato)</span>
                            </div>
                        </div>
                    )}

                    {/* CANDIDATOS */}
                    {candidatos.length > 0 && (
                        <CandidatosPanel candidatos={candidatos} candidatoSelecionadoId={candidatoSelecionadoId}
                            onSelecionar={handleSelecionarCandidato} porcDesc={porcDescRetorno} />
                    )}

                    {/* TÍTULO */}
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
                        <Input
                            placeholder={camposEditaveis ? "Preencha o título..." : "Aguardando busca..."}
                            value={form.titulo}
                            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                            readOnly={!camposEditaveis}
                            className={
                                buscaStatus === "sucesso" ? "border-green-300 bg-green-50/30 w-full" :
                                    isExistente ? "bg-indigo-50/40 cursor-default w-full border-indigo-200" :
                                        !camposEditaveis ? "bg-muted/40 text-muted-foreground cursor-default w-full" : "w-full"
                            }
                        />
                    </div>

                    {/* PREÇOS ML */}
                    {!isExistente && (
                        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                            <div className="space-y-1.5 min-w-0">
                                <Label className="text-muted-foreground text-xs">Preço ML (R$)</Label>
                                <Input placeholder="—" value={form.precoML} readOnly={buscaStatus === "sucesso"}
                                    onChange={(e) => setForm({ ...form, precoML: e.target.value })}
                                    className={`w-full ${!camposEditaveis || buscaStatus === "sucesso" ? "bg-muted/40 text-muted-foreground cursor-default" : ""}`} />
                            </div>
                            <div className="space-y-1.5 min-w-0">
                                <Label className="text-muted-foreground text-xs">Preço em Promoção (R$)</Label>
                                <Input placeholder="—" value={form.precoMLDesc} readOnly={buscaStatus === "sucesso"}
                                    onChange={(e) => setForm({ ...form, precoMLDesc: e.target.value })}
                                    className={`w-full ${!camposEditaveis || buscaStatus === "sucesso" ? "bg-muted/40 text-muted-foreground cursor-default" : ""}`} />
                            </div>
                        </div>
                    )}

                    {/* PREÇO EDITADO ↔ DESCONTO */}
                    {!isExistente && (
                        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                            <div className="space-y-1.5 min-w-0">
                                <Label>Preço Editado (R$)</Label>
                                <div className="relative w-full">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">R$</span>
                                    <input type="number" placeholder="0,00" disabled={!camposEditaveis}
                                        className={inputCls("pl-8")} value={form.precoEditado}
                                        onChange={(e) => handlePrecoEditadoChange(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1.5 min-w-0">
                                <Label>Desconto (%)</Label>
                                <div className="relative w-full">
                                    <input type="number" placeholder="0" disabled={!camposEditaveis}
                                        className={inputCls("pr-8")} value={form.descontoPct}
                                        onChange={(e) => handleDescontoChange(e.target.value)} />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QUANTIDADE */}
                    {isExistente ? (
                        <div className="space-y-1.5">
                            <Label>Quantidade a Adicionar</Label>
                            <input type="number" min={1} autoFocus className={inputCls()} placeholder="Ex: 10"
                                value={form.quantidade}
                                onChange={(e) => setForm({ ...form, quantidade: e.target.value === "" ? "" : parseInt(e.target.value) })} />
                            <p className="text-xs text-muted-foreground">
                                Estoque atual: <span className="font-medium text-indigo-700">{produtoExistente?.qtdProduto ?? 0} un.</span>
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" }}>
                            <div className="space-y-1.5 min-w-0">
                                <Label className="text-[11px]">Porc. Custo (%)</Label>
                                <div className="relative w-full">
                                    <input type="number" disabled={!camposEditaveis} className={inputCls("pr-7 bg-muted/20")}
                                        value={form.porcCusto}
                                        onChange={(e) => {
                                            const novaPct = e.target.value === "" ? "" : parseFloat(e.target.value);
                                            setForm(prev => ({ ...prev, porcCusto: novaPct, custo: calcularCustoAutomatico(prev.precoMLDesc || prev.precoML, novaPct) }));
                                        }} />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">%</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 min-w-0">
                                <Label className="text-[11px]">Custo Unit. (R$)</Label>
                                <div className="relative w-full">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">R$</span>
                                    <input type="number" disabled={!camposEditaveis} className={inputCls("pl-7")}
                                        value={form.custo}
                                        onChange={(e) => setForm({ ...form, custo: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1.5 min-w-0">
                                <Label className="text-[11px]">Quantidade</Label>
                                <input type="number" min={1} disabled={!camposEditaveis} className={inputCls()}
                                    value={form.quantidade}
                                    onChange={(e) => setForm({ ...form, quantidade: e.target.value === "" ? "" : parseInt(e.target.value) })} />
                            </div>
                        </div>
                    )}

                    {/* CATEGORIA + GRADE + PALLET */}
                    {!isExistente && (
                        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) minmax(0,2fr)" }}>
                            <div className="space-y-1.5 relative min-w-0">
                                <Label className="flex items-center gap-1 text-xs"><Tag className="w-3 h-3 shrink-0" /> Categoria</Label>
                                <div className="flex gap-1 w-full min-w-0">
                                    <select disabled={!camposEditaveis} className={inputCls("flex-1 min-w-0 px-2")}
                                        value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                                        <option value="">Selecione</option>
                                        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {camposEditaveis && (
                                        <button type="button" onClick={() => setShowAddCategoria(true)}
                                            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition text-muted-foreground hover:text-primary">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {showAddCategoria && <InlineAddPopover tipo="categoria" onAdd={handleAddCategoria} onClose={() => setShowAddCategoria(false)} />}
                            </div>
                            <div className="space-y-1.5 min-w-0">
                                <Label className="text-xs">Grade</Label>
                                <select disabled={!camposEditaveis} className={inputCls("px-2")}
                                    value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5 relative min-w-0">
                                <Label className="flex items-center gap-1 text-xs"><Box className="w-3 h-3 shrink-0" /> Pallet</Label>
                                <div className="flex gap-1 w-full min-w-0">
                                    <select disabled={!camposEditaveis} className={inputCls("flex-1 min-w-0 px-2")}
                                        value={form.pallet} onChange={(e) => setForm({ ...form, pallet: e.target.value })}>
                                        <option value="">Selecione</option>
                                        {pallets.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    {camposEditaveis && (
                                        <button type="button" onClick={handleGerarPalletAutomatico} disabled={isGeneratingPallet}
                                            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition text-muted-foreground hover:text-primary disabled:opacity-50">
                                            {isGeneratingPallet ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* IMPRIMIR AO SALVAR */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="imprimirAoSalvar"
                            checked={imprimirAoSalvar}
                            onChange={(e) => setImprimirAoSalvar(e.target.checked)}
                            className="w-4 h-4 rounded border-input accent-primary cursor-pointer"
                        />
                        <label htmlFor="imprimirAoSalvar" className="text-sm text-muted-foreground cursor-pointer select-none">
                            Imprimir etiqueta ao salvar
                        </label>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={!canSubmit}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isExistente ? "Adicionar Quantidade" : "Inserir Produto"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}