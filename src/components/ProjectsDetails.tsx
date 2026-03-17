import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  ArrowLeft, CheckCircle, Clock, ExternalLink, Search, AlertCircle, RefreshCcw,
  Check, Pencil, Box, Tag, FileCheck, FileX, ShieldAlert, SearchX, Ban,
  ChevronLeft, ChevronRight, Percent
} from "lucide-react";
import {
  listarTarefasPorId,
  reprocessarBloqueados,
  aprovarSimilar,
  corrigirSimilar,
  obterResumo,
  escolherCandidato,
  type CorrecaoSimilarDto,
  type FiltrosTarefa,
  type PageResponse
} from "../service/TarefaService";
import { EditSimilarModal } from "../components/EditSimilarModal";
import { listarPallets } from "../service/arquivoService";
import React from "react";

interface TarefaCandidato {
  id: number;
  titulo: string;
  preco: string;
  precoDesconto: string;
  link: string;
  matchScore: number;
  escolhido: boolean;
}

interface TarefaBackend {
  id: number;
  termo_busca: string;
  titulo_encontrado: string;
  valorUnitario: string;
  condicao: string;
  codPallet: string;
  preco: string;
  preco_desc: string;
  link: string;
  score: number;
  status: "NAO_ENCONTRADO" | "SUCESSO" | "BLOQUEADO" | "SIMILAR";
  statusRevisao: "APROVADO" | "NA" | "REPROVADO";
  custo: number;
  preco_sugerido: number;
  candidatos?: TarefaCandidato[];
}

interface TarefasResumo {
  total: number;
  sucesso: number;
  similar: number;
  bloqueado: number;
  naoEncontrado: number;
  similarAprovados: number;
  similarReprovados: number;
  bloqueadoAprovados: number;
  bloqueadoPendentes: number;
  naoEncontradoAprovados: number;
  naoEncontradoPendentes: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toFloat(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  let clean = val.replace(/[R$\s]/g, "").trim();
  if (clean === "") return null;

  const hasComma = clean.includes(",");
  const hasDot   = clean.includes(".");

  if (hasComma) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    const afterDot = clean.split(".").pop() ?? "";
    if (afterDot.length === 3) clean = clean.replace(/\./g, "");
  }

  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

/**
 * Desconto sugerido = (PE - PV) / PE * 100
 * PE > PV → positivo → produto encontrado ACIMA do PV → há margem de desconto (bom)
 * PE < PV → negativo → produto encontrado ABAIXO do PV → sem margem (ruim)
 */
function calcDesconto(
  precoEncontrado: string | number | null | undefined,
  precoVenda: number | null | undefined
): number | null {
  const pe = toFloat(precoEncontrado);
  const pv = toFloat(precoVenda);
  if (pe === null || pv === null || pe === 0) return null;
  return Math.round(((pe - pv) / pe) * 1000) / 10;
}

/**
 * Margem bruta = (PV - custo) / PV * 100
 */
function calcMargem(
  custo: number | null | undefined,
  precoVenda: number | null | undefined
): number | null {
  const c = toFloat(custo);
  const pv = toFloat(precoVenda);
  if (c === null || pv === null || pv === 0) return null;
  return Math.round(((pv - c) / pv) * 1000) / 10;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function DescontoBadge({ desconto }: { desconto: number | null }) {
  if (desconto === null) return <span className="text-xs text-muted-foreground">—</span>;
  // positivo = PE > PV = bom (verde); negativo = PE < PV = ruim (vermelho)
  const color = desconto >= 0
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
      <Percent className="w-2.5 h-2.5" />
      {desconto > 0 ? "+" : ""}{desconto.toFixed(1)}%
    </span>
  );
}

function MargemBadge({ margem }: { margem: number | null }) {
  if (margem === null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = margem >= 30
    ? "bg-green-100 text-green-700 border-green-200"
    : margem >= 15
    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
      <Percent className="w-2.5 h-2.5" />
      {margem > 0 ? "+" : ""}{margem.toFixed(1)}%
    </span>
  );
}

// ====
function removerExtensao(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index !== -1 ? fileName.substring(0, index) : fileName;
}

// ─── main component ───────────────────────────────────────────────────────────

export function ProjectsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pageData, setPageData] = useState<PageResponse<TarefaBackend>>({
    content: [], totalPages: 0, totalElements: 0, size: 50, number: 0
  });
  const [resumo, setResumo] = useState<TarefasResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [palletFilter, setPalletFilter] = useState<string>("");
  const [condicaoFilter, setCondicaoFilter] = useState<string>("");
  const [revisaoFilter, setRevisaoFilter] = useState<string>("TODOS");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TarefaBackend | null>(null);

  const [availablePallets, setAvailablePallets] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);

  const location = useLocation();
  const fileName = location.state?.fileName;
  const nomeLote = removerExtensao(fileName);

  const carregarResumo = useCallback(async () => {
    if (!id) return;
    try { setResumo(await obterResumo(id)); }
    catch (e) { console.error(e); }
  }, [id]);

  const carregarTarefas = useCallback(async (page = 0, isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    try {
      const filtros: FiltrosTarefa = {
        search: searchTerm || undefined,
        pallet: palletFilter || undefined,
        condicao: condicaoFilter || undefined,
        status: statusFilter || undefined,
        statusRevisao: revisaoFilter !== "TODOS" ? revisaoFilter : undefined
      };
      setPageData(await listarTarefasPorId(id, page, filtros));
      setCurrentPage(page);
    } catch (e) { console.error(e); }
    finally { if (!isSilent) setLoading(false); }
  }, [id, searchTerm, statusFilter, palletFilter, condicaoFilter, revisaoFilter]);

  useEffect(() => {
    if (!id) return;
    listarPallets(id).then(data => {
      if (Array.isArray(data.pallets)) setAvailablePallets(data.pallets);
      if (Array.isArray(data.condicoes)) setAvailableConditions(data.condicoes);
    }).catch(console.error);
  }, [id]);

  useEffect(() => { carregarResumo(); }, [carregarResumo]);
  useEffect(() => { carregarTarefas(currentPage); }, [carregarTarefas, currentPage]);
  useEffect(() => { if (currentPage !== 0) setCurrentPage(0); },
    [searchTerm, statusFilter, palletFilter, condicaoFilter, revisaoFilter]);

  async function handleReprocessar() {
    if (!id) return;
    setIsReprocessing(true);
    try {
      await reprocessarBloqueados(id);
      await carregarResumo();
      await carregarTarefas(currentPage, true);
      if (statusFilter === "BLOQUEADO") setStatusFilter(null);
    } catch { alert("Não foi possível iniciar o reprocessamento."); }
    finally { setIsReprocessing(false); }
  }

  async function handleAprovar(task: TarefaBackend) {
    const prev = [...pageData.content];
    setPageData(p => ({
      ...p,
      content: p.content.map(t =>
        t.id === task.id ? { ...t, statusRevisao: "APROVADO" as const, candidatos: undefined } : t
      )
    }));
    try { await aprovarSimilar(task.id); await carregarResumo(); }
    catch { alert("Erro ao aprovar item."); setPageData(p => ({ ...p, content: prev })); }
  }

  async function handleEscolherCandidato(tarefaId: number, candidatoId: number) {
    setPageData(prev => ({
      ...prev,
      content: prev.content.map(tarefa => {
        if (tarefa.id !== tarefaId || !tarefa.candidatos) return tarefa;
        const escolhido = tarefa.candidatos.find(c => c.id === candidatoId);
        if (!escolhido) return tarefa;
        return {
          ...tarefa,
          titulo_encontrado: escolhido.titulo,
          preco: escolhido.preco,
          preco_desc: escolhido.precoDesconto,
          link: escolhido.link,
          score: escolhido.matchScore,
          candidatos: tarefa.candidatos.map(c => ({ ...c, escolhido: c.id === candidatoId }))
        };
      })
    }));
    try { await escolherCandidato(tarefaId, candidatoId); }
    catch { alert("Erro ao escolher candidato."); await carregarTarefas(currentPage, true); }
  }

  async function handleSalvarCorrecao(dto: CorrecaoSimilarDto) {
    await corrigirSimilar(dto);
    setPageData(prev => ({
      ...prev,
      content: prev.content.map(t => {
        if (t.id !== dto.tarefaId) return t;
        return {
          ...t,
          titulo_encontrado: dto.titulo,
          preco: dto.preco,
          preco_desc: dto.precoDesc,
          link: dto.link,
          preco_sugerido: dto.precoSugerido
          

          
        };
      })
    }));
    await carregarResumo();
  }

  function toggleStatusFilter(status: string) {
    setRevisaoFilter("TODOS");
    setStatusFilter(prev => (prev === status ? null : status));
  }

  const formatCurrency = (val: string | number | null | undefined) => {
    const n = toFloat(val);
    if (n === null) return "—";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCESSO":        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"><CheckCircle className="w-3.5 h-3.5" /> Sucesso</span>;
      case "SIMILAR":        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"><ShieldAlert className="w-3.5 h-3.5" /> Similar</span>;
      case "NAO_ENCONTRADO": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><SearchX className="w-3.5 h-3.5" /> Não Achou</span>;
      case "BLOQUEADO":      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200"><Ban className="w-3.5 h-3.5" /> Bloqueado</span>;
      default:               return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"><Clock className="w-3.5 h-3.5" /> Pendente</span>;
    }
  };

  const getRevisaoBadge = (revisao: string) => {
    switch (revisao) {
      case "APROVADO":  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200"><FileCheck className="w-3 h-3" /> Verificado</span>;
      case "REPROVADO": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200"><FileX className="w-3 h-3" /> Reprovado</span>;
      default:          return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">Pendente</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Detalhes do Lote</h1>
              <p className="text-muted-foreground text-sm">Visualizando tarefas do Lote: {nomeLote}</p>
            </div>
          </div>
          {resumo && resumo.bloqueado > 0 && (
            <Button onClick={handleReprocessar} disabled={isReprocessing} variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
              <RefreshCcw className={`w-4 h-4 mr-2 ${isReprocessing ? "animate-spin" : ""}`} />
              {isReprocessing ? "Reprocessando..." : `Reprocessar ${resumo.bloqueado} Bloqueados`}
            </Button>
          )}
        </div>

        {/* CARDS */}
        {resumo && (
          <div className="flex gap-4 text-sm flex-wrap">
            {[
              { label: "Total",     value: resumo.total,         filter: null,            color: "" },
              { label: "Sucesso",   value: resumo.sucesso,       filter: "SUCESSO",       color: "text-green-600" },
              { label: "Similares", value: resumo.similar,       filter: "SIMILAR",       color: "text-blue-600" },
              { label: "Bloqueado", value: resumo.bloqueado,     filter: "BLOQUEADO",     color: "text-yellow-600" },
              { label: "Não Enc.",  value: resumo.naoEncontrado, filter: "NAO_ENCONTRADO", color: "text-red-600" },
            ].map(card => (
              <div
                key={card.label}
                onClick={() => card.filter ? toggleStatusFilter(card.filter) : setStatusFilter(null)}
                className={`px-4 py-2 border rounded-lg shadow-sm cursor-pointer transition select-none ${
                  statusFilter === card.filter
                    ? card.filter === "SUCESSO"        ? "bg-green-100 border-green-400"
                    : card.filter === "SIMILAR"        ? "bg-blue-100 border-blue-400"
                    : card.filter === "BLOQUEADO"      ? "bg-yellow-100 border-yellow-400"
                    : card.filter === "NAO_ENCONTRADO" ? "bg-red-100 border-red-400"
                    : "bg-primary/10 border-primary"
                    : "bg-card hover:bg-muted"
                }`}
              >
                <span className={card.color || "text-muted-foreground"}>{card.label}:</span>{" "}
                <strong>{card.value}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABELA */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">

        {/* FILTROS */}
        <div className="p-4 border-b flex flex-col lg:flex-row gap-4 bg-muted/20 items-end lg:items-center">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar termo..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {statusFilter === "SIMILAR" && resumo && (
            <div className="flex bg-white p-1 rounded-md border border-blue-200 shadow-sm animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground self-center px-2 mr-1 border-r">Revisão</span>
              {[
                { key: "TODOS",    label: "Todos" },
                { key: "APROVADO", label: "Aprovados",  count: resumo.similarAprovados,  color: "green" },
                { key: "REPROVADO",label: "Reprovados", count: resumo.similarReprovados, color: "red" },
              ].map(btn => (
                <button key={btn.key} onClick={() => setRevisaoFilter(btn.key)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    revisaoFilter === btn.key
                      ? btn.color === "green" ? "bg-green-50 text-green-700 font-bold border border-green-200"
                      : btn.color === "red"   ? "bg-red-50 text-red-700 font-bold border border-red-200"
                      : "bg-slate-100 text-foreground font-bold"
                      : "text-muted-foreground hover:bg-slate-50"
                  }`}>
                  {btn.label}
                  {btn.count !== undefined && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${btn.color === "green" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{btn.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {(statusFilter === "BLOQUEADO" || statusFilter === "NAO_ENCONTRADO") && resumo && (
            <div className="flex bg-white p-1 rounded-md border border-blue-200 shadow-sm animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground self-center px-2 mr-1 border-r">Revisão</span>
              <button onClick={() => setRevisaoFilter("TODOS")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${revisaoFilter === "TODOS" ? "bg-slate-100 text-foreground font-bold" : "text-muted-foreground hover:bg-slate-50"}`}>Todos</button>
              <button onClick={() => setRevisaoFilter("APROVADO")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${revisaoFilter === "APROVADO" ? "bg-green-50 text-green-700 font-bold border border-green-200" : "text-muted-foreground hover:bg-slate-50"}`}>
                Aprovados <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{statusFilter === "BLOQUEADO" ? resumo.bloqueadoAprovados : resumo.naoEncontradoAprovados}</span>
              </button>
              <button onClick={() => setRevisaoFilter("NA")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${revisaoFilter === "NA" ? "bg-yellow-50 text-yellow-700 font-bold border border-yellow-200" : "text-muted-foreground hover:bg-slate-50"}`}>
                Pendentes <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">{statusFilter === "BLOQUEADO" ? resumo.bloqueadoPendentes : resumo.naoEncontradoPendentes}</span>
              </button>
            </div>
          )}

          {availablePallets.length > 0 && (
            <select className="w-32 h-9 rounded-md border text-sm" value={palletFilter} onChange={(e) => setPalletFilter(e.target.value)}>
              <option value="">Pallet</option>
              {availablePallets.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          {availableConditions.length > 0 && (
            <select className="w-32 h-9 rounded-md border text-sm" value={condicaoFilter} onChange={(e) => setCondicaoFilter(e.target.value)}>
              <option value="">Condição</option>
              {availableConditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {(searchTerm || palletFilter || condicaoFilter) && (
            <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground"
              onClick={() => { setSearchTerm(""); setPalletFilter(""); setCondicaoFilter(""); }}>
              Limpar
            </Button>
          )}
        </div>

        {loading && !isReprocessing ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : pageData.content.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Nada encontrado.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Termo / Produto</th>
                    <th className="px-4 py-3 font-medium">Info. Lote</th>
                    <th className="px-4 py-3 font-medium bg-blue-50/40 border-l border-blue-100">Valores</th>
                    <th className="px-4 py-3 font-medium border-r border-blue-100">Preços</th>
                    <th className="px-4 py-3 font-medium">Análise</th>
                    <th className="px-4 py-3 font-medium">Status Robô</th>
                    <th className="px-4 py-3 font-medium">Revisão</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageData.content.map((task) => {
                    const precoAtivo = task.preco_desc || task.preco;
                    const margem   = calcMargem(task.custo, task.preco_sugerido);
                    const desconto = calcDesconto(precoAtivo, task.preco_sugerido);

                    return (
                      <React.Fragment key={task.id}>
                        <tr className="hover:bg-muted/50 transition-colors">

                          {/* Termo / Produto */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground truncate max-w-[280px]" title={task.termo_busca}>
                              {task.termo_busca}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[260px]" title={task.titulo_encontrado}>
                              {task.titulo_encontrado || "—"}
                            </div>
                          </td>

                          {/* Info. Lote */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 items-start">
                              {task.codPallet && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"><Box className="w-3 h-3" />{task.codPallet}</span>}
                              {task.condicao  && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"><Tag className="w-3 h-3" />{task.condicao}</span>}
                            </div>
                          </td>

                          {/* Valores: Planilha + Custo */}
                          <td className="px-4 py-3 bg-blue-50/20 border-l border-blue-100">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[9px] text-slate-400 uppercase font-semibold w-11 shrink-0">Planilha</span>
                                <span className="font-mono text-xs font-semibold text-blue-700">{formatCurrency(task.valorUnitario)}</span>
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[9px] text-slate-400 uppercase font-semibold w-11 shrink-0">Custo</span>
                                <span className="font-mono text-xs text-slate-600">{formatCurrency(task.custo)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Preços: Encontrado + Sugerido */}
                          <td className="px-4 py-3 border-r border-blue-100">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[9px] text-slate-400 uppercase font-semibold w-14 shrink-0">Encontrado</span>
                                <div className="flex flex-col">
                                  <span className="font-mono text-xs font-medium text-foreground">{task.preco ? formatCurrency(task.preco) : "—"}</span>
                                  {task.preco_desc && task.preco_desc !== task.preco && (
                                    <span className="font-mono text-[10px] text-green-600 font-semibold">{formatCurrency(task.preco_desc)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[9px] text-slate-400 uppercase font-semibold w-14 shrink-0">Sugerido</span>
                                <span className="font-mono text-xs font-semibold text-emerald-700">{formatCurrency(task.preco_sugerido)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Análise: Margem + Desconto Sugerido */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-400 uppercase font-semibold w-14 shrink-0">Margem</span>
                                <MargemBadge margem={margem} />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-400 uppercase font-semibold w-14 shrink-0">Desc. sug.</span>
                                <DescontoBadge desconto={desconto} />
                              </div>
                            </div>
                          </td>

                          {/* Status Robô */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1.5">
                              {getStatusBadge(task.status)}
                              {task.status === "SIMILAR" && task.score > 0 && (
                                <div className="flex items-center gap-2 pl-1" title={`Similaridade: ${task.score}%`}>
                                  <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div className={`h-full ${task.score > 85 ? "bg-green-500" : task.score > 60 ? "bg-yellow-500" : "bg-orange-500"}`} style={{ width: `${Math.min(task.score, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-500">{task.score}%</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Revisão */}
                          <td className="px-4 py-3">{getRevisaoBadge(task.statusRevisao)}</td>

                          {/* Ações */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {task.link && (
                                <a href={task.link} target="_blank" rel="noreferrer" title="Ver Link"
                                  className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-accent hover:text-blue-600">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              {task.status === "SIMILAR" && task.statusRevisao === "REPROVADO" && (
                                <Button size="icon" variant="ghost" title="Aprovar"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleAprovar(task)}>
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" title="Editar"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => { setEditingTask(task); setIsModalOpen(true); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* LINHA DE CANDIDATOS */}
                        {task.status === "SIMILAR" && task.candidatos && task.candidatos.length > 0 && (
                          <tr className="bg-blue-50/20">
                            <td colSpan={8} className="px-8 py-3 max-w-0 w-full">
                              <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                                  Selecione o produto correto:
                                </span>
                                <div className="flex flex-col gap-1.5">
                                  {task.candidatos.map((candidato) => {
                                    const precoCandidate = candidato.precoDesconto || candidato.preco;
                                    const descontoCandidato = calcDesconto(precoCandidate, task.preco_sugerido);

                                    return (
                                      <div
                                        key={candidato.id}
                                        onClick={() => handleEscolherCandidato(task.id, candidato.id)}
                                        className={`flex items-center gap-4 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all min-w-0 overflow-hidden ${
                                          candidato.escolhido
                                            ? "bg-blue-100 border-blue-400 shadow-sm"
                                            : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                        }`}
                                      >
                                        {/* Radio + título */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                          <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${candidato.escolhido ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                                            {candidato.escolhido && <Check className="w-3 h-3 text-white" />}
                                          </div>
                                          <span className={`text-sm truncate min-w-0 ${candidato.escolhido ? "font-semibold text-blue-900" : "text-gray-700"}`}>
                                            {candidato.titulo}
                                          </span>
                                        </div>

                                        {/* Score + Preço + Desc. sug. + link */}
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                          {/* Similaridade */}
                                          <div className="flex items-center gap-1.5" title={`Similaridade: ${candidato.matchScore}%`}>
                                            <div className="h-1.5 w-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                              <div className={`h-full ${candidato.matchScore > 85 ? "bg-green-500" : candidato.matchScore > 60 ? "bg-yellow-500" : "bg-orange-500"}`}
                                                style={{ width: `${Math.min(candidato.matchScore, 100)}%` }} />
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-medium w-7">{candidato.matchScore}%</span>
                                          </div>

                                          {/* Desc. sug. */}
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Desc. sug.</span>
                                            <DescontoBadge desconto={descontoCandidato} />
                                          </div>

                                           {/* Preço */}
                                          <div className="text-right flex-shrink-0 w-24">
                                            <div className="text-xs font-mono font-semibold text-gray-800 truncate">
                                              {formatCurrency(candidato.preco)}
                                            </div>
                                            {candidato.precoDesconto && candidato.precoDesconto !== candidato.preco && (
                                              <div className="text-[10px] font-mono text-green-600 truncate">
                                                {formatCurrency(candidato.precoDesconto)}
                                              </div>
                                            )}
                                          </div>

                                          {candidato.link && (
                                            <a href={candidato.link} target="_blank" rel="noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="p-1.5 rounded hover:bg-blue-200 transition text-blue-500 hover:text-blue-700">
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {pageData.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Mostrando <strong>{pageData.number * pageData.size + 1}</strong> até{" "}
                  <strong>{Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)}</strong> de{" "}
                  <strong>{pageData.totalElements}</strong> resultados
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pageData.totalPages) }, (_, i) => {
                      const pageNum =
                        pageData.totalPages <= 5          ? i :
                        currentPage < 3                   ? i :
                        currentPage > pageData.totalPages - 4 ? pageData.totalPages - 5 + i :
                        currentPage - 2 + i;
                      return (
                        <Button key={pageNum} size="sm" className="h-8 w-8 p-0"
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}>
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(p => Math.min(pageData.totalPages - 1, p + 1))}
                    disabled={currentPage === pageData.totalPages - 1}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EditSimilarModal open={isModalOpen} onOpenChange={setIsModalOpen} task={editingTask} onSave={handleSalvarCorrecao} />
    </div>
  );
}