import { useState, useEffect } from "react";
import {
    Search, Printer, Save, Package, DollarSign,
    TrendingUp, Barcode, FileSpreadsheet, ChevronDown, Wallet, AlertCircle, Clock, CheckCircle, Ban, SearchX, Loader2,
    Box, Tag, ChevronLeft, ChevronRight,
    ArrowLeft
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { PrintLabelModal } from "../../components/PrintLabelModal";
import { listarArquivos, listarPallets } from "../../service/arquivoService"; // Importei listarPallets
import { listarProdutos, atualizarPreco } from "../../service/ProdutoService";
import type { AtualizarPrecoRequest } from "../../types/produto";
import ReactBarcode from "react-barcode";
import { obterPerfil } from "../../service/usuarioService";
import { PrintAllModal } from "../../components/PrintAllModal";
import type { ProdutoManual } from "../../components/TaskManualTable";
import { useLocation, useNavigate } from "react-router-dom";



interface FileOption {
    id: string;
    fileName: string;
}


interface ProdutoResumo {
    totalItensUnicos: number;
    totalItensFisicos: number;
    valorCustoTotal: number;
    valorVendaTotal: number;
    lucroEstimado: number;
}

interface DashboardResponse {
    resumo: ProdutoResumo;
    pagina: {
        content: ProdutoManual[];
        totalPages: number;
        totalElements: number;
        size: number;
        number: number;
    };
}

export function ProductsView() {
    const navigate = useNavigate();

    const [files, setFiles] = useState<FileOption[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string>("");

    const [products, setProducts] = useState<ProdutoManual[]>([]);
    const [summary, setSummary] = useState<ProdutoResumo>({
        totalItensUnicos: 0, totalItensFisicos: 0, valorCustoTotal: 0, valorVendaTotal: 0, lucroEstimado: 0
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [loadingProducts, setLoadingProducts] = useState(false);
    const [changes, setChanges] = useState<Record<number, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    // --- FILTROS ---
    const [searchTerm, setSearchTerm] = useState("");
    const [palletFilter, setPalletFilter] = useState<string>("");
    const [condicaoFilter, setCondicaoFilter] = useState<string>("");

    // Dados para os Selects
    const [availablePallets, setAvailablePallets] = useState<string[]>([]);

    const [availableConditions, setAvailableConditions] = useState<string[]>([]);

    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [productToPrint, setProductToPrint] = useState<ProdutoManual | null>(null);
    const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);

    const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);

    const location = useLocation();

    // 1. Carrega Arquivos
    useEffect(() => {
        async function loadFiles() {
            try {
                const data = await listarArquivos();
                setFiles(data);
            } catch (error) {
                console.error("Erro ao carregar arquivos", error);
            }
        }
        loadFiles();
    }, []);


    // Preenchendo Lote Selecionado
    useEffect(() => {
        const id = location.state?.selectedFileId;
        if (id) setSelectedFileId(String(id));
    }, []);

    // --------------//

    // 2. Carrega Produtos e Pallets
    useEffect(() => {
        if (!selectedFileId) return;

        // Timer para Debounce da busca
        const delayDebounceFn = setTimeout(() => {
            async function fetchData() {
                setLoadingProducts(true);
                setChanges({});
                try {
                    const idArquivo = Number(selectedFileId);

                    // A. Carrega os Produtos (Filtrados)
                    const data: any = await listarProdutos(idArquivo, currentPage, {
                        search: searchTerm,
                        pallet: palletFilter,
                        condicao: condicaoFilter
                    });

                    const response = data as DashboardResponse;

                    if (response) {
                        if (response.pagina) {
                            const lista = response.pagina.content || [];
                            setProducts(lista);
                            setTotalPages(response.pagina.totalPages);
                            setTotalElements(response.pagina.totalElements);

                        }
                        if (response.resumo) {
                            setSummary(response.resumo);
                        }
                    }

                    // B. Carrega a lista de TODOS os Pallets desse arquivo (para o filtro)
                    // Fazemos isso separadamente para o filtro ter todos os pallets, não só os da busca atual
                    if (currentPage === 0) {
                        listarPallets(selectedFileId).then(data => {
                            if (data.pallets) setAvailablePallets(data.pallets);
                            if (data.condicoes) setAvailableConditions(data.condicoes);
                        }).catch(err => console.error("Erro pallets", err));
                    }

                } catch (error) {
                    console.error(error);
                    setProducts([]);
                } finally {
                    setLoadingProducts(false);
                }
            }
            fetchData();
        }, 500);

        return () => clearTimeout(delayDebounceFn);

    }, [selectedFileId, currentPage, searchTerm, palletFilter, condicaoFilter]);


    useEffect(() => {
        obterPerfil()
            .then(data => { if (data?.logo) setLogoEmpresa(data.logo); })
            .catch(console.error);
    }, []);


    const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFileId(e.target.value);
        setCurrentPage(0);
        setSearchTerm("");
        setPalletFilter("");
        setCondicaoFilter("");
    };

    const nextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(c => c + 1); };
    const prevPage = () => { if (currentPage > 0) setCurrentPage(c => c - 1); };

    const parsePrice = (priceString: string | number | null): number => {
        if (!priceString) return 0;
        if (typeof priceString === 'number') return priceString;
        const cleanString = priceString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(cleanString) || 0;
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handlePriceChange = (id: number, newPrice: string) => {
        const value = parseFloat(newPrice.replace(',', '.'));
        setProducts(products.map(p => p.idProduto === id ? { ...p, precoVenda: isNaN(value) ? 0 : value } : p));
        if (!isNaN(value)) setChanges(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveAll = async () => {
        const listaParaEnviar: AtualizarPrecoRequest[] = Object.entries(changes).map(([id, preco]) => ({
            produtoId: Number(id),
            novoValor: preco
        }));
        if (listaParaEnviar.length === 0) return;
        setIsSaving(true);
        try {
            await atualizarPreco(listaParaEnviar);
            setChanges({});
            alert("Preços atualizados com sucesso!");
        } catch (error) {
            alert("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenPrint = (product: ProdutoManual) => {
        setProductToPrint(product);
        setIsPrintModalOpen(true);
    };

    const margemMediaGlobal = summary.valorVendaTotal > 0
        ? (summary.lucroEstimado / summary.valorVendaTotal) * 100
        : 0;

    const renderMarketPrice = (product: ProdutoManual) => {
        const status = product.status || "PENDENTE";
        switch (status) {
            case "APROVADO":
                const priceVal = parsePrice(product.precoMercadoLivre);
                const myPrice = product.precoVenda || 0;
                const isCheaper = myPrice < priceVal;
                return (
                    <div className="flex flex-col">
                        <span className={isCheaper ? "text-green-600 font-bold" : "text-foreground font-medium"}>
                            {product.precoMercadoLivre ? `R$ ${product.precoMercadoLivre}` : "-"}
                        </span>
                        {isCheaper && <span className="text-[10px] text-green-600">Você ganha</span>}
                    </div>
                );
            case "REPROVADO": return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700"><AlertCircle className="w-3 h-3" /> Revisar</span>;
            case "NA": return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700"><Ban className="w-3 h-3" /> Revisar</span>;
            default: return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> Processando...</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 print:hidden">

            {/* HEADER + SELETOR */}

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Catálogo de Produtos</h1>
                        <p className="text-muted-foreground mt-1">Gerencie precificação e etiquetas por Lote.</p>
                    </div>
                </div>

                <div className="w-full md:w-72">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Lote Selecionado</label>
                    <div className="relative">
                        <select
                            className="w-full h-10 pl-3 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none cursor-pointer"
                            value={selectedFileId}
                            onChange={handleFileChange}
                        >
                            <option value="" disabled>Selecione um Lote...</option>
                            {files.map(file => <option key={file.id} value={file.id}>{file.fileName}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                    </div>
                </div>
            </div>

            {!selectedFileId && (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl bg-muted/10">
                    <div className="p-4 bg-muted rounded-full mb-3"><FileSpreadsheet className="w-8 h-8 text-muted-foreground" /></div>
                    <h3 className="font-semibold text-lg">Nenhum Lote selecionado</h3>
                    <p className="text-muted-foreground text-sm max-w-sm text-center mt-1">Selecione uma planilha na lista acima.</p>
                </div>
            )}

            {selectedFileId && loadingProducts && (
                <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            )}

            {selectedFileId && !loadingProducts && (
                <>
                    {/* CARDS DE RESUMO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2">
                        {/* ... Cards mantidos iguais ... */}
                        <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-muted-foreground">Itens no Lote</p>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package className="w-5 h-5" /></div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{summary.totalItensFisicos}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{summary.totalItensUnicos} produtos únicos</p>
                            </div>
                        </div>

                        <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-muted-foreground">Valor Custo Total</p>
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                            </div>
                            <h3 className="text-2xl font-bold text-muted-foreground">{formatCurrency(summary.valorCustoTotal)}</h3>
                        </div>

                        <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-muted-foreground">Potencial Venda Total</p>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{formatCurrency(summary.valorVendaTotal)}</h3>
                        </div>

                        <div className="bg-card border border-green-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                            <div className="flex justify-between items-start z-10">
                                <p className="text-sm font-medium text-muted-foreground">Lucro Estimado</p>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Wallet className="w-5 h-5" /></div>
                            </div>
                            <div className="z-10">
                                <h3 className="text-2xl font-bold text-green-600">{formatCurrency(summary.lucroEstimado)}</h3>
                                <div className="inline-flex items-center gap-1 mt-1">
                                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                        {Math.round(margemMediaGlobal)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABELA */}
                    <div className="bg-card border rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20">
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto items-center">
                                <div className="relative w-48 min-w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text" placeholder="Buscar nome, SKU..."
                                        className="pl-9 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* SELETOR DE PALLET */}
                                <div className="relative w-32">
                                    <select
                                        className="w-full h-9 pl-2 pr-4 rounded-md border border-input bg-background text-sm cursor-pointer focus:ring-1 focus:ring-primary"
                                        value={palletFilter}
                                        onChange={(e) => setPalletFilter(e.target.value)}
                                    >
                                        <option value="">Pallet</option>
                                        {availablePallets.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                {/* SELETOR DE CONDIÇÃO */}
                                <div className="relative w-32">
                                    <select
                                        className="w-full h-9 pl-2 pr-4 rounded-md border border-input bg-background text-sm cursor-pointer focus:ring-1 focus:ring-primary"
                                        value={condicaoFilter}
                                        onChange={(e) => setCondicaoFilter(e.target.value)}
                                    >
                                        <option value="">Condição</option>
                                        {availableConditions.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {/* <Button variant="outline" size="sm" onClick={handlePrintAll}>
                             <Printer className="w-4 h-4 mr-2" /> Imprimir Lista
                        </Button> */}
                                <Button
                                    size="sm"
                                    onClick={handleSaveAll}
                                    disabled={Object.keys(changes).length === 0 || isSaving}
                                    className={Object.keys(changes).length > 0 ? "animate-pulse" : ""}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    {Object.keys(changes).length > 0 ? `Salvar (${Object.keys(changes).length})` : "Salvar Alterações"}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsPrintAllOpen(true)}>
                                    <Printer className="w-4 h-4 mr-2" /> Imprimir Todos
                                </Button>
                            </div>

                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Produto</th>
                                        <th className="px-6 py-3 font-medium">Info. Lote</th>
                                        <th className="px-6 py-3 font-medium text-center w-20">Qtd.</th>
                                        <th className="px-6 py-3 font-medium">Custo Unit.</th>

                                        <th className="px-6 py-3 font-medium">Venda Unit.</th>
                                        <th className="px-6 py-3 font-medium">Margem (%)</th>
                                        <th className="px-6 py-3 font-medium">Ref. Mercado</th>
                                        <th className="px-6 py-3 font-medium text-right">Etiqueta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {products.map((product) => {
                                        const margin = (product.precoVenda || 0) - (product.custo || 0);
                                        const marginPct = product.precoVenda > 0 ? (margin / product.precoVenda) * 100 : 0;
                                        const isModified = changes[product.idProduto] !== undefined;
                                        const qtd = product.qtdProduto || 0;

                                        return (
                                            <tr key={product.idProduto} className={`hover:bg-muted/50 transition-colors ${isModified ? "bg-blue-50/30" : ""}`}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{product.nome}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {product.codBarras && <><Barcode className="w-3 h-3" /> {product.codBarras}</>}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {product.codPallet && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"><Box className="w-3 h-3" /> {product.codPallet}</span>}
                                                        {product.condicao && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"><Tag className="w-3 h-3" /> {product.condicao}</span>}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200">
                                                        {qtd}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-muted-foreground">{formatCurrency(product.custo || 0)}</td>

                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                                                        <input
                                                            type="number"
                                                            className={`pl-6 h-8 w-24 rounded border text-sm focus-visible:ring-1 focus-visible:ring-primary ${isModified ? "border-blue-400 ring-1 ring-blue-400" : "bg-background border-input"}`}
                                                            value={product.precoVenda || ""}
                                                            onChange={(e) => handlePriceChange(product.idProduto, e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                                {/* //a */}
                                                <td className="px-6 py-4">
                                                    <div className={`text-xs font-bold ${margin > 0 ? "text-green-600" : "text-red-600"}`}>
                                                        {Math.round(marginPct)}%
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">{formatCurrency(margin)} un.</div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    {renderMarketPrice(product)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenPrint(product)}>
                                                        <Printer className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* --- RODAPÉ DE PAGINAÇÃO --- */}
                        {totalElements > 0 && (
                            <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/10">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {products.length} de {totalElements} registros
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 0 || loadingProducts}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                                    </Button>
                                    <span className="text-sm font-medium mx-2 min-w-[3rem] text-center">
                                        Pág. {currentPage + 1} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline" size="sm" onClick={nextPage} disabled={currentPage >= totalPages - 1 || loadingProducts}
                                    >
                                        Próxima <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal e Impressão (Mantidos) */}
            <PrintLabelModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} product={productToPrint ? {
                idProduto: productToPrint.idProduto,
                nome: productToPrint.nome,
                sku: productToPrint.codBarras,
                precoVenda: productToPrint.precoVenda,
                precoMercado: productToPrint.status === 'APROVADO'
                    ? parsePrice(productToPrint.precoMercadoLivre)
                    : null,
                logo: logoEmpresa,
                qtd: productToPrint.qtdProduto,
                foiImpresso: productToPrint.foiImpresso
            } : null}
            />

            <PrintAllModal
                isOpen={isPrintAllOpen}
                onClose={() => setIsPrintAllOpen(false)}
                arquivoId={selectedFileId}
                logo={logoEmpresa}
                filtros={{
                    pallet: palletFilter,
                    condicao: condicaoFilter,
                }}
            />

            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 m-0">
                <div className="grid grid-cols-2 gap-4 p-4 content-start">
                    {products.map((p) => (
                        <div key={p.idProduto} className="border border-black p-4 h-[200px] flex gap-4 break-inside-avoid">
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="text-xs font-bold uppercase leading-tight line-clamp-2 h-8">{p.nome}</div>
                                <div>
                                    <div className="flex items-start">
                                        <span className="text-xs font-medium mt-1 mr-1">R$</span>
                                        <span className="text-4xl font-black">{formatCurrency(p.precoVenda || 0).replace('R$', '').trim()}</span>
                                    </div>
                                </div>
                                <div className="overflow-hidden w-full">
                                    <ReactBarcode value={p.codBarras || "000000"} width={1.5} height={30} fontSize={10} displayValue={true} />
                                </div>
                            </div>
                            <div className="w-12 flex flex-col items-end">
                                <div className="h-8 w-8 bg-black text-white rounded flex items-center justify-center font-bold text-xs">S</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hidden">
                {products.map(p => (
                    <div key={p.idProduto} className="barcode-svg">
                        <ReactBarcode value={p.codBarras || "000000000000"} width={1.3} height={28} fontSize={8} margin={0} displayValue={true} />
                    </div>
                ))}
            </div>

        </div>


    );
}