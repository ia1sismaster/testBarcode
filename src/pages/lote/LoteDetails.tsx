import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Package, DollarSign, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { TaskManualTable, type ProdutoManual } from "../../components/TaskManualTable";
import { InserirProdutoModal } from "../../components/InserirProdutoModal";
import { listarProdutosManuais, getFiltrosComQuantidade } from "../../service/lotesManualService";
import { PrintAllModal } from "../../components/PrintAllModal";
import { PrintLabelModal } from "../../components/PrintLabelModal";
import { obterPerfil } from "../../service/usuarioService";
import type { FiltrosComQuantidadeDto } from "../../types/lote";
import { EditarProdutoModal } from "../../components/Editarprodutomodal";
import { atualizarPreco } from "../../service/ProdutoService";
import type { AtualizarPrecoRequest } from "../../types/produto";

interface LoteResumo {
    nomeLote: string;
    qtdTotalItens: number;
    qtdVariedadeItens: number;
    valorLote: number | null;
}

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export function LoteDetails() {
    const { arquivoId } = useParams<{ arquivoId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [produtos, setProdutos] = useState<ProdutoManual[]>([]);
    const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0 });
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const loteState = (location.state as any)?.lote as LoteResumo | undefined;
    const resumo: LoteResumo = loteState ?? { nomeLote: "Lote", qtdTotalItens: 0, qtdVariedadeItens: 0, valorLote: null };

    const [searchTerm, setSearchTerm] = useState("");
    const [palletFilter, setPalletFilter] = useState("");
    const [condicaoFilter, setCondicaoFilter] = useState("");
    const [categoriaFilter, setCategoriaFilter] = useState("");
    const [changes, setChanges] = useState<Record<number, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [inserirModalOpen, setInserirModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [productToPrint, setProductToPrint] = useState<ProdutoManual | null>(null);
    const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
    const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<FiltrosComQuantidadeDto | null>(null);
    const [editandoProduto, setEditandoProduto] = useState<ProdutoManual | null>(null);

    const carregarProdutos = useCallback(async (page = 0) => {
        if (!arquivoId) return;
        setLoading(true);
        try {
            const data = await listarProdutosManuais(
                Number(arquivoId), page, 50,
                searchTerm || undefined, palletFilter || undefined,
                condicaoFilter || undefined, categoriaFilter || undefined
            );
            setProdutos(data.content);
            setPageInfo({ totalPages: data.totalPages, totalElements: data.totalElements });
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [arquivoId, searchTerm, palletFilter, condicaoFilter, categoriaFilter]);

    useEffect(() => {
        const t = setTimeout(() => carregarProdutos(0), 400);
        return () => clearTimeout(t);
    }, [searchTerm, palletFilter, condicaoFilter, categoriaFilter, carregarProdutos]);

    const handlePrecoChange = (id: number, val: string) => {
        const n = parseFloat(val.replace(",", "."));
        setProdutos(prev => prev.map(p => p.idProduto === id ? { ...p, precoVenda: isNaN(n) ? 0 : n } : p));
        if (!isNaN(n)) setChanges(prev => ({ ...prev, [id]: n }));
    };

    const handleSalvar = async () => {
        const listaParaEnviar: AtualizarPrecoRequest[] = Object.entries(changes).map(([id, preco]) => ({
            produtoId: Number(id), novoValor: preco
        }));
        if (listaParaEnviar.length === 0) return;
        setIsSaving(true);
        try {
            await atualizarPreco(listaParaEnviar);
            setChanges({});
            await carregarProdutos(currentPage);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const parsePrice = (priceString: string | number | null): number => {
        if (!priceString) return 0;
        if (typeof priceString === "number") return priceString;
        return parseFloat(priceString.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
    };

    useEffect(() => {
        obterPerfil().then(data => { if (data?.logo) setLogoEmpresa(data.logo); }).catch(console.error);
    }, []);

    useEffect(() => {
        getFiltrosComQuantidade(Number(arquivoId)).then(setFiltros).catch(console.error);
    }, [arquivoId]);

    const handlePrint = (produto: ProdutoManual) => { setProductToPrint(produto); setIsPrintModalOpen(true); };
    const handlePrintAll = () => setIsPrintAllOpen(true);
    const handleEdit = (produto: ProdutoManual) => setEditandoProduto(produto);

    const handleInserirSuccess = (produtoParaImprimir?: {
        idProduto: number; nome: string; codBarras: string; precoVenda: number;
        precoMercadoLivre: string | null; status: string; qtdProduto: number;
    }) => {
        carregarProdutos(0);
        if (produtoParaImprimir) {
            setProductToPrint({
                idProduto: produtoParaImprimir.idProduto,
                nome: produtoParaImprimir.nome,
                codBarras: produtoParaImprimir.codBarras,
                precoVenda: produtoParaImprimir.precoVenda,
                precoMercadoLivre: produtoParaImprimir.precoMercadoLivre,
                status: produtoParaImprimir.status,
                qtdProduto: produtoParaImprimir.qtdProduto,
                condicao: null, codPallet: null, custo: 0, categoria: null, link: null, foiImpresso: false,
            });
            setIsPrintModalOpen(true);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 md:h-10 md:w-10" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate">{resumo.nomeLote}</h1>
                        <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">Produtos do lote manual</p>
                    </div>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => setInserirModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Inserir Produto</span>
                    <span className="sm:hidden">Inserir</span>
                </Button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-card border rounded-xl p-3 md:p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">Itens no Lote</p>
                        <div className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Package className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <h3 className="text-xl md:text-2xl font-bold">{resumo.qtdTotalItens}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{resumo.qtdVariedadeItens} únicos</p>
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-3 md:p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">Valor do Lote</p>
                        <div className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold text-emerald-700 mt-2">{formatCurrency(resumo.valorLote)}</h3>
                </div>
            </div>

            {/* Tabela — scroll horizontal no mobile */}
            <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="min-w-[640px] md:min-w-0 px-4 md:px-0">
                    <TaskManualTable
                        produtos={produtos}
                        changes={changes}
                        isSaving={isSaving}
                        searchTerm={searchTerm}
                        palletFilter={palletFilter}
                        condicaoFilter={condicaoFilter}
                        categoriaFilter={categoriaFilter}
                        availablePallets={filtros?.pallets ?? []}
                        availableCondicoes={filtros?.condicoes ?? []}
                        availableCategorias={filtros?.categorias ?? []}
                        onSearchChange={setSearchTerm}
                        onPalletChange={setPalletFilter}
                        onCondicaoChange={setCondicaoFilter}
                        onCategoriaChange={setCategoriaFilter}
                        onPrecoChange={handlePrecoChange}
                        onSalvar={handleSalvar}
                        onPrintAll={handlePrintAll}
                        onPrint={handlePrint}
                        onEdit={handleEdit}
                    />
                </div>
            </div>

            <EditarProdutoModal
                open={!!editandoProduto}
                onOpenChange={(open) => { if (!open) setEditandoProduto(null); }}
                produto={editandoProduto}
                arquivoId={Number(arquivoId)}
                onSuccess={() => { setEditandoProduto(null); carregarProdutos(0); }}
            />

            {/* Paginação */}
            {pageInfo.totalElements > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1">
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {produtos.length} de {pageInfo.totalElements} registros
                    </p>
                    <div className="flex items-center gap-1 md:gap-2">
                        <Button variant="outline" size="sm"
                            onClick={() => carregarProdutos(currentPage - 1)}
                            disabled={currentPage === 0 || loading}>
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">Anterior</span>
                        </Button>
                        <span className="text-xs md:text-sm font-medium mx-1 md:mx-2 min-w-[4rem] text-center">
                            {currentPage + 1} / {pageInfo.totalPages}
                        </span>
                        <Button variant="outline" size="sm"
                            onClick={() => carregarProdutos(currentPage + 1)}
                            disabled={currentPage >= pageInfo.totalPages - 1 || loading}>
                            <span className="hidden sm:inline mr-1">Próxima</span>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            <InserirProdutoModal
                open={inserirModalOpen}
                onOpenChange={setInserirModalOpen}
                arquivoId={Number(arquivoId)}
                categorias={(filtros?.categorias ?? []).map((item) => item.nome)}
                pallets={(filtros?.pallets ?? []).map((item) => item.nome)}
                minimoSimilarPadrao={70}
                onSuccess={handleInserirSuccess}
            />

            <PrintLabelModal
                isOpen={isPrintModalOpen}
                onClose={() =>{ 
                    setIsPrintModalOpen(false);
                    carregarProdutos(currentPage);
                }}
                product={productToPrint ? {
                    idProduto: productToPrint.idProduto,
                    nome: productToPrint.nome,
                    sku: productToPrint.codBarras,
                    precoVenda: productToPrint.precoVenda,
                    precoMercado: productToPrint.status === "APROVADO" ? parsePrice(productToPrint.precoMercadoLivre) : null,
                    logo: logoEmpresa,
                    qtd: productToPrint.qtdProduto,
                    foiImpresso: productToPrint.foiImpresso
                } : null}
            />

            <PrintAllModal
                isOpen={isPrintAllOpen}
                onClose={() => {
                    setIsPrintAllOpen(false)
                    carregarProdutos(currentPage);
                }}
                arquivoId={String(arquivoId)}
                logo={logoEmpresa}
                filtros={{ pallet: palletFilter, condicao: condicaoFilter }}
            />
        </div>
    );
}