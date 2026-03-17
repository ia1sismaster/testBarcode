import { useState, useEffect } from "react";
import { 
  Play, Square, Zap, Server, Layers, Bot, Info, Loader2 
} from "lucide-react";
// Importe seus serviços reais
import { pegarStatus, mudarStatus } from "../../service/roboService";

// --- COMPONENTE DO ROBÔ ANIMADO ---
const WalkingBot = ({ active }: { active: boolean }) => (
  <div className={`transition-all duration-700 flex flex-col items-center ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
    <div className="relative">
      {/* O Robô */}
      <Bot 
        className={`w-12 h-12 text-blue-600 ${active ? "animate-bounce" : ""}`} 
        style={{ animationDuration: '0.6s' }} 
      />
      {/* Olhos brilhando */}
      <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
      <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
    </div>
    {/* Sombra no chão */}
    <div className={`w-8 h-1.5 bg-black/10 rounded-[100%] mt-1 ${active ? "animate-pulse" : ""}`} />
  </div>
);

export function BotControllerView() {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Trava o botão durante a requisição
  
  // Simulação de Estatísticas (Futuramente virão do backend tbm)
  const [stats, setStats] = useState({ queue: 1250, processed: 45, speed: 0 });
  const [machineStatus, setMachineStatus] = useState("ONLINE");

  // 1. CARREGAR STATUS AO ABRIR A PÁGINA
  useEffect(() => {
    let mounted = true;

    async function fetchInitialStatus() {
      try {
        // O service já deve retornar o boolean direto (response.data.status)
        const statusReal = await pegarStatus();
        
        if (mounted) {
          setIsRunning(!!statusReal); // Garante que é booleano
        }
      } catch (error) {
        console.error("Erro ao buscar status inicial");
        if (mounted) setMachineStatus("OFFLINE");
      }
    }

    fetchInitialStatus();

    return () => { mounted = false; };
  }, []);

  // 2. FUNÇÃO DE CLICK (Mudar Status)
  const toggleBot = async () => {
    if (isLoading || machineStatus === "OFFLINE") return;

    setIsLoading(true);
    try {
      // 1. Manda o comando para o backend
      await mudarStatus();
      
      // 2. Busca o estado atualizado para confirmar a mudança
      const novoStatus = await pegarStatus();
      setIsRunning(!!novoStatus);

    } catch (error) {
      alert("Não foi possível alterar o status do robô. Verifique a conexão."+error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de simulação visual (Só roda se estiver ligado)
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      setStats(s => ({ ...s, speed: 12 })); 
      interval = setInterval(() => {
        setStats(prev => ({
          queue: prev.queue > 0 ? prev.queue - 1 : 0,
          processed: prev.processed + 1,
          speed: Math.floor(Math.random() * 5) + 10
        }));
      }, 1500);
    } else {
      setStats(s => ({ ...s, speed: 0 }));
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center animate-in fade-in duration-700 relative">
      
      {/* 1. STATUS DA MÁQUINA */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-center">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm transition-colors ${
            machineStatus === "ONLINE" 
                ? "bg-green-50/50 border-green-200 text-green-700" 
                : "bg-red-50/50 border-red-200 text-red-700"
        }`}>
            <div className={`p-1.5 rounded-full ${machineStatus === "ONLINE" ? "bg-green-200" : "bg-red-200"}`}>
                <Server className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-xs">
                <span className="font-bold tracking-wide">DESKTOP-PRINCIPAL</span>
                <span className="opacity-80 font-medium">
                    {machineStatus === "ONLINE" ? "Conectado via Socket" : "Agente Desconectado"}
                </span>
            </div>
        </div>
      </div>

      {/* 2. ÁREA CENTRAL (BOTÃO + ROBÔ) */}
      <div className="relative flex flex-col items-center gap-8">
        
        {/* Animação do Robô (Aparece quando liga) */}
        <div className="h-16 flex items-end">
            <WalkingBot active={isRunning} />
        </div>

        {/* O Botão "Nuclear" */}
        <div className="relative group">
            {/* Glow Effect */}
            <div className={`absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-0 transition-opacity duration-1000 ${isRunning ? "opacity-40" : ""}`} />
            
            <button
                onClick={toggleBot}
                disabled={machineStatus === "OFFLINE" || isLoading}
                className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl border-4
                ${isLoading 
                    ? "bg-gray-100 border-gray-300 cursor-wait" // Estado Carregando
                    : isRunning 
                        ? "bg-white border-red-500 shadow-red-500/20 hover:scale-105 active:scale-95" // Estado PARAR
                        : "bg-white border-green-500 hover:border-green-400 hover:scale-105 active:scale-95" // Estado INICIAR
                }
                ${machineStatus === "OFFLINE" ? "opacity-50 cursor-not-allowed grayscale border-gray-300" : ""}
                `}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-1" />
                        <span className="text-[10px] font-bold tracking-widest">AGUARDE</span>
                    </div>
                ) : (
                    <>
                        <div className={`transition-all duration-300 mb-2 ${isRunning ? "text-red-500" : "text-green-600"}`}>
                            {isRunning ? (
                                <Square className="w-10 h-10 fill-current" />
                            ) : (
                                <Play className="w-12 h-12 ml-1 fill-current" />
                            )}
                        </div>
                        <span className={`text-xs font-black tracking-widest ${isRunning ? "text-red-500" : "text-green-600"}`}>
                            {isRunning ? "PARAR" : "INICIAR"}
                        </span>
                    </>
                )}
            </button>
        </div>
      </div>

      {/* 3. DASHBOARD COM TOOLTIPS */}
      <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-3xl px-4">
          
          <StatCard 
            icon={Layers}
            label="Fila Pendente"
            value={stats.queue}
            color="text-slate-700"
            tooltip="Quantidade de produtos aguardando busca no banco de dados."
          />

          <StatCard 
            icon={Zap}
            label="Velocidade"
            value={stats.speed}
            suffix="/min"
            color={isRunning ? "text-blue-600" : "text-slate-400"}
            tooltip="Média de produtos processados por minuto neste momento."
            highlight={isRunning}
          />

          <StatCard 
            icon={CheckCircleIcon}
            label="Feito Hoje"
            value={stats.processed}
            color="text-green-600"
            tooltip="Total de buscas realizadas com sucesso desde as 00:00."
          />

      </div>
    </div>
  );
}

// --- COMPONENTE AUXILIAR PARA OS CARDS COM TOOLTIP ---
function StatCard({ icon: Icon, label, value, color, suffix = "", tooltip, highlight = false }: any) {
    return (
        <div className="group relative flex flex-col items-center p-4 rounded-xl hover:bg-muted/40 transition-colors cursor-help">
            
            {/* O Tooltip (Escondido por padrão, aparece no hover) */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-3 py-1.5 rounded shadow-lg w-48 text-center pointer-events-none z-20">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
            </div>

            <span className={`text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5 ${highlight ? "text-blue-600" : "text-muted-foreground"}`}>
                <Icon className={`w-3.5 h-3.5 ${highlight ? "fill-current" : ""}`} /> 
                {label}
                <Info className="w-3 h-3 opacity-20" /> {/* Ícone discreto de info */}
            </span>
            
            <span className={`text-3xl font-black ${color}`}>
                {value}
                {suffix && <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>}
            </span>
        </div>
    )
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    )
}