import { useState, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  User, Lock, Image, Percent, Save, Loader2,
  CheckCircle, AlertCircle, Upload, X, Eye, EyeOff, Printer
} from "lucide-react";
import {
  obterPerfil,
  atualizarPerfil,
  atualizarSenha,
  uploadLogo
} from "../../service/usuarioService";
import { getImpressora } from "../../service/impressora";
import type { Impressora } from "../../types/Impressora";
import { definirImpressora } from "../../service/usuarioService";

interface PerfilData {
  nome: string;
  email: string;
  percentualEscape: number;
  logo: string | null;
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

function SectionCard({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>
        <h2 className="font-semibold text-base">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Feedback({ state }: { state: FeedbackState }) {
  if (!state) return null;
  return (
    <div className={`flex items-center gap-2 text-sm p-3 rounded-lg mt-4
      ${state.type === "success"
        ? "bg-green-50 text-green-700 border border-green-200"
        : "bg-red-50 text-red-700 border border-red-200"
      }`}>
      {state.type === "success"
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />
      }
      {state.message}
    </div>
  );
}

export function ProfileView() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<PerfilData | null>(null);

  // Dados pessoais
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [feedbackPerfil, setFeedbackPerfil] = useState<FeedbackState>(null);

  // Senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);
  const [feedbackSenha, setFeedbackSenha] = useState<FeedbackState>(null);

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [feedbackLogo, setFeedbackLogo] = useState<FeedbackState>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Margem de erro
  const [percentualEscape, setPercentualEscape] = useState(10);
  const [savingMargem, setSavingMargem] = useState(false);
  const [feedbackMargem, setFeedbackMargem] = useState<FeedbackState>(null);

  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [impressoraSelecionada, setImpressoraSelecionada] = useState<number | null>(null);
  const [savingImpressora, setSavingImpressora] = useState(false);
  const [feedbackImpressora, setFeedbackImpressora] = useState<FeedbackState>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await obterPerfil();
        setPerfil(data);
        setNome(data.nome || "");
        setEmail(data.email || "");
        setPercentualEscape(data.percentualEscape ?? 10);

        const impressorasData = await getImpressora();
        setImpressoras(impressorasData.impressoras ?? []);
        if (impressorasData.impressoraAtualId) setImpressoraSelecionada(impressorasData.impressoraAtualId);


        if (data.logo) setLogoPreview(data.logo);
      } catch (error) {
        console.error("Erro ao carregar perfil", error);
      } finally {
        setLoading(false);
      }

    }
    load();
  }, []);

  async function handleSalvarPerfil() {
    setSavingPerfil(true);
    setFeedbackPerfil(null);
    try {
      await atualizarPerfil({ nome, email, percentualEscape });
      setFeedbackPerfil({ type: "success", message: "Dados atualizados com sucesso!" });
    } catch (error) {
      setFeedbackPerfil({ type: "error", message: "Erro ao atualizar dados." });
    } finally {
      setSavingPerfil(false);
    }
  }

  async function handleSalvarSenha() {
    if (novaSenha !== confirmarSenha) {
      setFeedbackSenha({ type: "error", message: "As senhas não coincidem." });
      return;
    }
    if (novaSenha.length < 6) {
      setFeedbackSenha({ type: "error", message: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }
    setSavingSenha(true);
    setFeedbackSenha(null);
    try {
      await atualizarSenha({ senhaAtual, novaSenha });
      setFeedbackSenha({ type: "success", message: "Senha alterada com sucesso!" });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error: any) {
      const msg = error.response?.status === 400
        ? "Senha atual incorreta."
        : "Erro ao alterar senha.";
      setFeedbackSenha({ type: "error", message: msg });
    } finally {
      setSavingSenha(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSalvarLogo() {
    if (!logoFile) return;
    setSavingLogo(true);
    setFeedbackLogo(null);
    try {
      await uploadLogo(logoFile);
      setFeedbackLogo({ type: "success", message: "Logo atualizada com sucesso!" });
      setLogoFile(null);
    } catch (error) {
      setFeedbackLogo({ type: "error", message: "Erro ao enviar logo." });
    } finally {
      setSavingLogo(false);
    }
  }

  async function handleSalvarMargem() {
    setSavingMargem(true);
    setFeedbackMargem(null);
    try {
      await atualizarPerfil({ nome, email, percentualEscape });
      setFeedbackMargem({ type: "success", message: "Margem de erro atualizada!" });
    } catch (error) {
      setFeedbackMargem({ type: "error", message: "Erro ao atualizar margem." });
    } finally {
      setSavingMargem(false);
    }
  }

  async function handleSalvarImpressora() {
    if (!impressoraSelecionada) return;
    setSavingImpressora(true);
    setFeedbackImpressora(null);
    try {
      await definirImpressora(impressoraSelecionada);
      setFeedbackImpressora({ type: "success", message: "Impressora definida com sucesso!" });
    } catch {
      setFeedbackImpressora({ type: "error", message: "Erro ao definir impressora." });
    } finally {
      setSavingImpressora(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações e preferências.</p>
      </div>

      {/* DADOS PESSOAIS */}
      <SectionCard icon={<User className="w-4 h-4" />} title="Dados Pessoais">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <Feedback state={feedbackPerfil} />
          <Button onClick={handleSalvarPerfil} disabled={savingPerfil} className="w-full sm:w-auto">
            {savingPerfil ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {savingPerfil ? "Salvando..." : "Salvar Dados"}
          </Button>
        </div>
      </SectionCard>

      {/* SENHA */}
      <SectionCard icon={<Lock className="w-4 h-4" />} title="Segurança">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha Atual</Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                type={showSenhaAtual ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowSenhaAtual(p => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowNovaSenha(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <Feedback state={feedbackSenha} />
          <Button onClick={handleSalvarSenha} disabled={savingSenha || !senhaAtual || !novaSenha || !confirmarSenha} className="w-full sm:w-auto">
            {savingSenha ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            {savingSenha ? "Alterando..." : "Alterar Senha"}
          </Button>
        </div>
      </SectionCard>

      {/* LOGO */}
      <SectionCard icon={<Image className="w-4 h-4" />} title="Logo da Empresa">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Usada nas etiquetas de impressão.</p>

          <div className="flex items-center gap-6">
            {/* Preview */}
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20 overflow-hidden flex-shrink-0">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                : <Image className="w-8 h-8 text-muted-foreground/40" />
              }
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleLogoChange}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Escolher Imagem
              </Button>
              {logoPreview && (
                <Button variant="ghost" size="sm" className="text-muted-foreground"
                  onClick={() => { setLogoPreview(null); setLogoFile(null); }}>
                  <X className="w-4 h-4 mr-2" /> Remover
                </Button>
              )}
              {logoFile && (
                <p className="text-xs text-muted-foreground truncate max-w-[160px]">{logoFile.name}</p>
              )}
            </div>
          </div>

          <Feedback state={feedbackLogo} />
          <Button onClick={handleSalvarLogo} disabled={savingLogo || !logoFile} className="w-full sm:w-auto">
            {savingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {savingLogo ? "Enviando..." : "Salvar Logo"}
          </Button>
        </div>
      </SectionCard>

      {/* MARGEM DE ERRO */}
      <SectionCard icon={<Percent className="w-4 h-4" />} title="Margem de Erro">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define o percentual máximo de diferença aceito entre o termo buscado e o produto encontrado
            para ser considerado <strong>Sucesso</strong>. Acima disso cai em <strong>Similar</strong>.
          </p>
          <div className="flex items-center gap-4">
            <div className="space-y-2 w-40">
              <Label htmlFor="percentual">Percentual (%)</Label>
              <div className="relative">
                <Input
                  id="percentual"
                  type="number"
                  min={0}
                  max={100}
                  value={percentualEscape}
                  onChange={(e) => setPercentualEscape(Number(e.target.value))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            {/* Barra visual */}
            <div className="flex-1 space-y-1 pt-5">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${percentualEscape > 50 ? "bg-red-500" : percentualEscape > 25 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(percentualEscape, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {percentualEscape <= 10 ? "Rigoroso" : percentualEscape <= 30 ? "Moderado" : "Permissivo"}
              </p>
            </div>
          </div>
          <Feedback state={feedbackMargem} />
          <Button onClick={handleSalvarMargem} disabled={savingMargem} className="w-full sm:w-auto">
            {savingMargem ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {savingMargem ? "Salvando..." : "Salvar Margem"}
          </Button>
        </div>
      </SectionCard>


      <SectionCard icon={<Printer className="w-4 h-4" />} title="Impressora Padrão">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione a impressora padrão usada para etiquetas.
          </p>

          {impressoras.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma impressora cadastrada.</p>
          ) : (
            <div className="grid gap-2">
              {impressoras.map((imp) => (
                <label key={imp.impressoraId}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${impressoraSelecionada === imp.impressoraId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"}`}>
                  <input
                    type="radio"
                    name="impressora"
                    className="accent-primary"
                    checked={impressoraSelecionada === imp.impressoraId}
                    onChange={() => setImpressoraSelecionada(imp.impressoraId)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{imp.identificacao}</p>
                    <p className="text-xs text-muted-foreground">
                      {imp.largura}×{imp.altura}mm · {imp.qtdPorLinha} por linha · espaç. {imp.espacamento}mm
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <Feedback state={feedbackImpressora} />
          <Button onClick={handleSalvarImpressora}
            disabled={savingImpressora || !impressoraSelecionada}>
            {savingImpressora ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {savingImpressora ? "Salvando..." : "Definir Impressora"}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}