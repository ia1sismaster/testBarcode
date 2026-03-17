import { useEffect, useState } from "react";
import { Plus, RotateCw, Clock, FileText, TrendingUp, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { NovoLoteModal } from "../../components/NovoLoteModal";
import { LotesTable, type Lote } from "../../components/LotesTable";
import { listarLotes, buscarResumoLote } from "../../service/lotesManualService";
import { deletarArquivo } from "../../service/arquivoService";
import type { ResumoLoteManualDto } from "../../types/lote";

export function LotesView() {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [mostrarValores, setMostrarValores] = useState(true);
    const [resumo, setResumo] = useState<ResumoLoteManualDto | null>(null);

    async function carregar() {
        setLoading(true);
        try {
            const [data, resumoData] = await Promise.all([listarLotes(), buscarResumoLote()]);
            setLotes(data);
            setResumo(resumoData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { carregar(); }, []);

    const stats = [
        {
            label: "Disponíveis",
            value: String(resumo?.qtdDisponivel ?? 0),
            subValue: resumo?.valorDisponivel
                ? resumo.valorDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "R$ —",
            TopIcon: Clock,
            topColor: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            label: "Em Criação",
            value: String(resumo?.qtdEmCriacao ?? 0),
            subValue: resumo?.valorEmCriacao
                ? resumo.valorEmCriacao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "R$ —",
            TopIcon: FileText,
            topColor: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            label: "Vendidos",
            value: String(resumo?.qtdVendido ?? 0),
            subValue: resumo?.valorVendido
                ? resumo.valorVendido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "R$ —",
            TopIcon: TrendingUp,
            topColor: "text-green-600",
            bgColor: "bg-green-50",
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">Meus Lotes</h1>
                    <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Gerencie seus lotes de bipagem manual</p>
                </div>
                <Button onClick={() => setModalOpen(true)} size="sm" className="md:size-lg shrink-0">
                    <Plus className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Novo Lote</span>
                    <span className="sm:hidden">Novo</span>
                </Button>
            </div>

            {/* Cards — 3 colunas em md, scroll horizontal em mobile */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                {stats.map((stat) => {
                    const TopIcon = stat.TopIcon;
                    return (
                        <div key={stat.label} className="bg-white rounded-xl border shadow-sm p-3 md:p-4 flex flex-col justify-between min-h-[90px] md:min-h-[110px]">
                            <div className="flex justify-between items-start">
                                <span className="text-xs md:text-sm font-semibold text-muted-foreground leading-tight">{stat.label}</span>
                                <div className={`p-1 md:p-1.5 rounded-lg ${stat.bgColor}`}>
                                    <TopIcon className={`w-3.5 h-3.5 md:w-5 md:h-5 ${stat.topColor}`} />
                                </div>
                            </div>
                            <div className="mt-1">
                                <span className="text-xl md:text-3xl font-bold text-foreground">
                                    {mostrarValores ? stat.value : "••"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                                <span className="text-xs font-medium text-foreground truncate">
                                    {mostrarValores ? stat.subValue : "R$ ••••"}
                                </span>
                                <button
                                    onClick={() => setMostrarValores(!mostrarValores)}
                                    className="text-muted-foreground hover:text-foreground transition-colors outline-none shrink-0 ml-1"
                                >
                                    {mostrarValores ? <Eye className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <EyeOff className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabela */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b flex items-center gap-3">
                    <h3 className="font-semibold text-base md:text-lg">Todos os Lotes</h3>
                    <Button
                        variant="ghost" size="icon"
                        onClick={carregar} disabled={loading}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                        <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
                <div className="p-3 md:p-6 md:pt-0 overflow-x-auto">
                    <LotesTable
                        lotes={lotes}
                        onRefresh={carregar}
                        onDelete={async (loteId) => {
                            const anterior = lotes;
                            setLotes((prev) => prev.filter((l) => l.loteId !== loteId));
                            try {
                                await deletarArquivo(String(loteId));
                            } catch (e) {
                                console.error(e);
                                setLotes(anterior);
                            }
                        }}
                    />
                </div>
            </div>

            <NovoLoteModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={carregar} />
        </div>
    );
}