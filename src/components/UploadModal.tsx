import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { uploadFile, getMargemErro } from "../service/arquivoService";
import { useEffect } from "react";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File, config: any) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [colunaProduto, setColunaProduto] = useState("D");
  const [colunaPreco, setColunaPreco] = useState("E");
  const [colunaFim, setColunaFim] = useState("G");
  const [colunaQtd, setColunaQtd] = useState("B");
  const [colunaCondicao, setColunaCondicao] = useState("C");
  const [colunaCodPallet, setColunaCodPallet] = useState("A");
  const [colunaCategoria, setColunaCategoria] = useState("G");
  const [linhaInicio, setLinhaInicio] = useState(8);
  const [percentualCusto, setPercentualCusto] = useState(0);
  const [percentualLucro, setPercentualLucro] = useState(0);
  const [percentualEscape, setPercentualEscape] = useState(0);
  const [minimoSimilar, setMinimoSimilar] = useState(95);

  useEffect(() => {
    if (open) {
      buscarPercentualPadrao();
    }
  }, [open]);

  async function buscarPercentualPadrao() {
    try {
      const percentual = await getMargemErro(); // Sua função do service
      console.log("PERCENTUAL: ", percentual)
      setPercentualEscape(percentual);
    } catch (error) {
      console.error("Erro ao buscar percentual padrão:", error);
      setPercentualEscape(10); // Fallback caso dê erro
    }
  }


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        setArquivo(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) setArquivo(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (!arquivo) return;

    const configData = {
      colunaProduto,
      colunaPreco,
      colunaFim,
      colunaQtd,
      colunaCondicao,
      colunaCodPallet,
      colunaCategoria,
      linhaInicio,
      percentualCusto,
      percentualLucro,
      percentualEscape,
      minimoSimilar
    };

    // Fecha o modal imediatamente para não travar a tela (UX)
    onOpenChange(false);

    // Processa o upload em background
    uploadFile(arquivo, configData)
      .then(() => {
        alert(`Arquivo "${arquivo.name}" enviado com sucesso!`);
        setArquivo(null);
      })
      .catch((error) => {
        console.error(error);
        alert("Erro ao enviar arquivo.");
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-h-[90vh] e flex-col garantem que o modal caiba na tela e tenha scroll interno */}
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-0 gap-0">

        {/* HEADER FIXO NO TOPO */}
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Novo Upload</DialogTitle>
          <DialogDescription>
            Envie sua planilha Excel com os produtos para raspagem
          </DialogDescription>
        </DialogHeader>

        {/* ÁREA DE SCROLL (CONTEÚDO) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Drag & Drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30"
              }`}
          >
            <input type="file" id="file-upload" accept=".xlsx,.xls" onChange={handleChange} className="hidden" />

            {!arquivo ? (
              <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm mb-2 text-center">
                  <span className="text-primary hover:underline">Clique para selecionar</span> ou arraste o arquivo aqui
                </p>
                <p className="text-xs text-muted-foreground">Apenas arquivos .xlsx ou .xls</p>
              </label>
            ) : (
              <div className="flex items-center justify-between bg-white rounded-lg p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{arquivo.name}</p>
                    <p className="text-xs text-muted-foreground">{(arquivo.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setArquivo(null) }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Configurações com Textos Explicativos */}
          <div className="bg-muted/30 rounded-lg p-6 border">
            <h4 className="text-sm font-medium mb-4">Configurações da Planilha</h4>

            <div className="grid grid-cols-2 gap-6">

              <div className="space-y-2">
                <Label htmlFor="colunaProduto">Coluna do Produto</Label>
                <Input
                  id="colunaProduto"
                  value={colunaProduto}
                  onChange={(e) => setColunaProduto(e.target.value.toUpperCase())}
                  placeholder="Ex: A"
                  className="bg-white"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Em qual coluna está o nome do produto?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colunaPreco">Coluna Preço Custo</Label>
                <Input
                  id="colunaPreco"
                  value={colunaPreco}
                  onChange={(e) => setColunaPreco(e.target.value.toUpperCase())}
                  placeholder="Ex: B"
                  className="bg-white"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Qual é a coluna do preço pago/custo?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colunaFim">Coluna Final</Label>
                <Input
                  id="colunaFim"
                  value={colunaFim}
                  onChange={(e) => setColunaFim(e.target.value.toUpperCase())}
                  placeholder="Ex: C"
                  className="bg-white"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Qual é a ultima coluna preenchida?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colunaQtd">Coluna Quantidade (Opcional)</Label>
                <Input
                  id="colunaQtd"
                  value={colunaQtd}
                  onChange={(e) => setColunaQtd(e.target.value.toUpperCase())}
                  placeholder="Ex: D"
                  className="bg-white"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Coluna com a quantidade de itens (se houver).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colunaCondicao">Coluna Condicao (Grade)</Label>
                <Input
                  id="colunaCondicao"
                  value={colunaCondicao}
                  onChange={(e) => setColunaCondicao(e.target.value.toUpperCase())}
                  placeholder="Ex: D"
                  className="bg-white"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Coluna com a condição dos itens.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colunaCodPallet">Código do Pallet</Label>
                <Input
                  id="colunaCodPallet"
                  value={colunaCodPallet}
                  onChange={(e) => setColunaCodPallet(e.target.value.toUpperCase())}
                  placeholder="Ex: G"
                  className="bg-white"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Coluna do codigo do pallet, ex (RZ-xxxxxx).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colunaCategoria">Coluna Categoria</Label>
                <Input
                  id="colunaCategoria"
                  value={colunaCategoria}
                  onChange={(e) => setColunaCategoria(e.target.value.toUpperCase())}
                  placeholder="Ex: E"
                  className="bg-white"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Caso não houver, deixar o campo vazio.
                </p>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="linhaInicio">Linha Inicial</Label>
                <Input
                  id="linhaInicio"
                  type="number"
                  value={linhaInicio}
                  onChange={(e) => setLinhaInicio(parseInt(e.target.value) || 2)}
                  className="bg-white w-full"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Em qual linha começam os dados reais (ignorando cabeçalho)?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentualCusto">Margem Custo (%)</Label>
                <div className="relative">
                  <Input
                    id="percentualCusto"
                    type="number"
                    min={0}
                    value={percentualCusto}
                    onChange={(e) => setPercentualCusto(Number(e.target.value))}
                    className="pr-10 bg-white"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Porcentagem que pagará dos itens sobre o valor da Planilha
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentualLucro">Margem Lucro (%)</Label>
                <div className="relative">
                  <Input
                    id="percentualLucro"
                    type="number"
                    min={0}
                    value={percentualLucro}
                    onChange={(e) => setPercentualLucro(Number(e.target.value))}
                    className="pr-10 bg-white"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>

                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Porcentagem de Lucro sobre o Custo Calculado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentualEscape">Margem de erro (%)</Label>
                <div className="relative">
                  <Input
                    id="percentualEscape"
                    type="number"
                    min={0}
                    value={percentualEscape}
                    onChange={(e) => setPercentualEscape(Number(e.target.value))}
                    className="pr-10 bg-white"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Parâmetro para definição de Sucesso ao comparar os Itens da Planilha (Nome do Produto e Preço)
                  Obs.: O primeiro parâmetro a ser utilizado é a similaridade da descrição dos Itens, depois é o preço de venda
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimoSimilar">Score minimo (%)</Label>
                <div className="relative">
                  <Input
                    id="minimoSimilar"
                    type="number"
                    min={0}
                    value={minimoSimilar}
                    onChange={(e) => setMinimoSimilar(Number(e.target.value))}
                    className="pr-10 bg-white"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Define o rigor na comparação do <strong>título do anúncio</strong>:
                  nomes abaixo desta porcentagem serão listados como similares,
                  enquanto valores superiores permitem a aprovação automática (Sucesso).
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* FOOTER FIXO NO FUNDO */}
        <DialogFooter className="p-6 pt-4 border-t bg-white rounded-b-lg mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!arquivo}>
            Enviar para o Robô
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}