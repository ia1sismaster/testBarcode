import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button"; // Ajuste o caminho se necessário
import { Plus, TrendingUp, FileText, Clock, RotateCw } from "lucide-react"; // Adicionei RotateCw
import { ProjectsTable } from "../../components/ProjectsTable"; // Ajuste o caminho se necessário
import type { Project } from "../../components/ProjectsTable";
import { UploadModal } from "../../components/UploadModal"; // Ajuste o caminho se necessário
import { listarArquivos } from "../../service/arquivoService";

export function DashboardView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const data = await listarArquivos();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const handleUpload = (file: File, config: { productColumn: string; startRow: number }) => {
    // Sua lógica de upload mantida
    const newProject: Project = {
      id: Date.now().toString(),
      fileName: file.name,
      uploadDate: new Date().toLocaleString("pt-BR"),
      processed: 0,
      total: 100,
      status: "processing",
    };
    setProjects([newProject, ...projects]);
  };

  const handleDelete = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  const stats = [
    {
      label: "Lotes Ativos",
      value: projects.filter((p) => p.status === "processing").length,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "Aguardando Revisão",
      value: projects.filter((p) => p.status === "review").length,
      icon: FileText,
      color: "text-yellow-600",
    },
    {
      label: "Concluídos",
      value: projects.filter((p) => p.status === "completed").length,
      icon: TrendingUp,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Lotes (Planilha com Produtos Identificados)</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas tarefas de raspagem de preços
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Novo Lote
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card text-card-foreground rounded-xl border shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela com o Botão de Atualizar Integrado */}
      <div className="bg-card border rounded-xl shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">Todos os Lotes (Planilhas)</h3>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={carregar}
              disabled={loading}
              title="Atualizar lista"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          
          {/* Espaço para filtros futuros, se precisar */}
        </div>

        <div className="p-6 pt-0">
           <ProjectsTable projects={projects} onDelete={handleDelete} />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSubmit={handleUpload}
      />
    </div>
  );
}