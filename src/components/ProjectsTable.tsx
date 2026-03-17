import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { MoreVertical, Download, Trash2, FileText, FileSpreadsheet, Check, ClipboardList, Package } from "lucide-react";
import { Button } from "./ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

import {
  downloadResultado,
  deletarArquivo,
  downloadResultadoPallet,
  listarPallets,
  downloadResultadoPadraoSismaster
} from "../service/arquivoService";
import { baixarArquivo } from "../utils/dowload";

export interface Project {
  id: string;
  fileName: string;
  uploadDate: string;
  processed: number;
  total: number;
  status: "processing" | "review" | "completed" | "error";
}

interface ProjectsTableProps {
  projects: Project[];
  onDelete: (id: string) => void;
}

const statusConfig = {
  processing: { label: "Processando", color: "bg-blue-500" },
  review: { label: "Aguardando Revisão", color: "bg-accent" },
  completed: { label: "Concluído", color: "bg-green-500" },
  error: { label: "Erro", color: "bg-destructive" },
};

export function ProjectsTable({ projects, onDelete }: ProjectsTableProps) {
  const navigate = useNavigate();

  // Estados do Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [projectSelecionado, setProjectSelecionado] = useState<Project | null>(null);

  // Estados de Dados
  const [pallets, setPallets] = useState<string[]>([]);
  const [palletsSelecionados, setPalletsSelecionados] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"PADRAO" | "SISMASTER">("PADRAO");

  // Estados de Loading
  const [carregandoPallets, setCarregandoPallets] = useState(false);
  const [baixando, setBaixando] = useState(false);

  //formatação data
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(data);
    } catch (e) {
      return dataString; // Caso falhe, retorna o que veio
    }
  };

  // --- LÓGICA DE ORDENAÇÃO ---
  const projetosOrdenados = [...projects].sort((a, b) => {
    // Transforma em timestamp para comparar. O maior (mais recente) vem primeiro.
    return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
  });


  // -- Modal (tarefa ou produto) -- 
  const [destinoModal, setDestinoModal] = useState<{ open: boolean; projectId?: number, fileName?: string}>({ open: false });

  const handleRowClick = (projectId: number, fileName:string) => {
    setDestinoModal({ open: true, projectId, fileName });
  };

  const navegarPara = (destino: "tarefas" | "produto", id?: number, fileName?: string) => {
    const projetoId = id ?? destinoModal.projectId;
    const nomeArquivo = fileName ?? destinoModal.fileName;
    setDestinoModal({ open: false });
    if (destino === "tarefas") navigate(`/projeto/${projetoId}`, {state: {fileName: nomeArquivo}});
    else navigate(`/produto`, { state: { selectedFileId: projetoId } });
  };

  // --- AÇÕES GERAIS ---

  async function handleDelete(projectId: string) {
    if (!window.confirm("Tem certeza?")) return;
    try {
      await deletarArquivo(projectId);
      onDelete(projectId);
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }

  // --- LÓGICA DO MODAL UNIFICADO ---

  async function abrirModalExportacao(e: React.MouseEvent, project: Project) {
    e.stopPropagation();
    setProjectSelecionado(project);
    setModalOpen(true);
    setExportMode("PADRAO"); // Reset para padrão
    setPalletsSelecionados([]);
    setPallets([]);

    try {
      setCarregandoPallets(true);
      const lista = await listarPallets(project.id);
      setPallets(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregandoPallets(false);
    }
  }

  function togglePallet(p: string) {
    setPalletsSelecionados((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  // --- FUNÇÃO MESTRA DE EXPORTAÇÃO ---
  async function handleExportar() {
    if (!projectSelecionado) return;
    setBaixando(true);

    try {
      // 1. MODO PADRÃO (Excel Normal)
      if (exportMode === "PADRAO") {
        if (palletsSelecionados.length === 0) {
          // Se não selecionou nada -> Baixa TUDO (Função original handleDownload)
          const resp = await downloadResultado(projectSelecionado.id);
          baixarArquivo(resp);
        } else {
          // Se selecionou -> Baixa Filtrado
          const resp = await downloadResultadoPallet(projectSelecionado.id, palletsSelecionados);
          baixarArquivo(resp);
        }
      }

      // 2. MODO SISMASTER
      else {
        // A função Sismaster já entende lista vazia como "Todos"
        const resp = await downloadResultadoPadraoSismaster(projectSelecionado.id, palletsSelecionados);
        baixarArquivo(resp);
      }

      setModalOpen(false);
    } catch (error) {
      console.error("Erro no download", error);
      alert("Erro ao gerar o arquivo de exportação.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Nome do Arquivo</TableHead>
              <TableHead>Data de Envio</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              projetosOrdenados.map((project) => (
                <TableRow
                  key={project.id}
                  className="hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(Number(project.id), project.fileName)}
                >
                  <TableCell className="font-medium">{project.fileName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatarData(project.uploadDate)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{project.processed}/{project.total}</span>
                        <span className="font-medium">{Math.round((project.processed / project.total) * 100)}%</span>
                      </div>
                      <Progress value={(project.processed / project.total) * 100} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${statusConfig[project.status].color} text-white border-0`}>
                      {statusConfig[project.status].label}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Button variant="ghost" size="icon" title="Abrir Tarefas"
                      onClick={(e) => { e.stopPropagation(); navegarPara("tarefas", Number(project.id), project.fileName); }}>
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <Button variant="ghost" size="icon" title="Abrir Produto"
                      onClick={(e) => { e.stopPropagation(); navegarPara("produto", Number(project.id), project.fileName) }}>
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* BOTÃO UNIFICADO NO MENU */}
                        <DropdownMenuItem onClick={(e) => abrirModalExportacao(e, project)}>
                          <Download className="w-4 h-4 mr-2" />
                          Exportar / Baixar
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Modal Tarefa ou Produto */}
      <Dialog open={destinoModal.open} onOpenChange={(open) => setDestinoModal({ open })}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Onde deseja ir?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navegarPara("tarefas")}>
              <ClipboardList className="w-4 h-4 mr-2" /> Tarefas
            </Button>
            <Button variant="outline" onClick={() => navegarPara("produto")}>
              <Package className="w-4 h-4 mr-2" /> Produto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL UNIFICADO DE EXPORTAÇÃO ===== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[550px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Exportar Dados</DialogTitle>
            <DialogDescription>
              Escolha o formato e os filtros para o download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">

            {/* 1. SELEÇÃO DE FORMATO (CARDS) */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setExportMode("PADRAO")}
                className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-slate-50
                        ${exportMode === "PADRAO" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className={`p-2 rounded-full ${exportMode === "PADRAO" ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Planilha Original</span>
                {exportMode === "PADRAO" && <div className="absolute top-2 right-2 text-primary"><Check className="w-4 h-4" /></div>}
              </div>

              <div
                onClick={() => setExportMode("SISMASTER")}
                className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-slate-50
                        ${exportMode === "SISMASTER" ? "border-blue-600 bg-blue-50" : "border-border"}`}
              >
                <div className={`p-2 rounded-full ${exportMode === "SISMASTER" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Padrão Sismaster</span>
              </div>
            </div>

            {/* 2. SELEÇÃO DE PALLETS */}
            <div className="space-y-3">
              {carregandoPallets ? (
                <div className="h-24 flex items-center justify-center border rounded-md bg-slate-50 text-xs text-muted-foreground">
                  Carregando pallets...
                </div>
              ) : pallets.length > 0 ? (
                <div className="max-h-[180px] overflow-y-auto rounded-md border p-1 grid grid-cols-2 gap-1 bg-slate-50">
                  {pallets.map((p) => (
                    <label key={p} className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-colors ${palletsSelecionados.includes(p) ? "bg-white border-primary/30 shadow-sm" : "border-transparent hover:bg-slate-100"}`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-primary accent-primary"
                        checked={palletsSelecionados.includes(p)}
                        onChange={() => togglePallet(p)}
                      />
                      <span className="text-sm text-slate-700">{p}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center border rounded-md bg-slate-50 text-xs text-muted-foreground">
                  Nenhum pallet encontrado neste arquivo.
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-right">
                {palletsSelecionados.length === 0
                  ? "Nenhum selecionado = Baixar TUDO."
                  : `${palletsSelecionados.length} pallets selecionados.`}
              </p>
            </div>

            {/* 3. RODAPÉ UNIFICADO */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleExportar} disabled={baixando} className={exportMode === "SISMASTER" ? "bg-blue-600 hover:bg-blue-700" : ""}>
                {baixando ? "Gerando..." : "Exportar Arquivo"}
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}