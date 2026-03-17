import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
// Importe o serviço que você criou
import { registrar } from "../../service/usuarioService";
import { PLANS, type Plan } from "../../service/planoService";
import { PlanCard } from "../../components/PlanCard";

// Dados dos planos (iguais aos do seu sistema)

export function Registro() {
  const navigate = useNavigate();

  // Estados de Controle Visual
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Fecha o modal e limpa o form
  const handleClose = () => {
    setSelectedPlan(null);
    setErrorMessage(null);
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmSenha("");
  };

  // Lógica de Cadastro Real
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (senha !== confirmSenha) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // 1. Chama o serviço de registro
      await registrar(nome, email, senha);

      // 2. Opcional: Você pode passar um estado para a tela de login 
      // para exibir uma mensagem de "Cadastro realizado com sucesso! Aguarde aprovação."
      navigate("/login", {
        state: { message: "Cadastro realizado! Sua conta será analisada por um administrador." }
      });

    } catch (error: any) {
      console.error(error);

      // O seu backend Java lança BAD_REQUEST (400) se o e-mail existir
      if (error.response?.status === 400) {
        setErrorMessage("Este email já está cadastrado ou os dados são inválidos.");
      } else {
        setErrorMessage("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navbar Simplificada */}
      <header className="bg-white border-b py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">S</div>
          <span className="font-bold text-lg">SaaS Scraper</span>
        </div>
        <div className="text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Escolha o plano ideal para seu negócio
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece hoje mesmo a monitorar preços. Você pode cancelar ou alterar seu plano a qualquer momento.
          </p>
        </div>

        {/* Grid de Planos */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} onSelect={setSelectedPlan} />
          ))}

        </div>
      </main>

      {/* --- MODAL DE CADASTRO --- */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Finalizar Cadastro</DialogTitle>
            <DialogDescription>
              Você selecionou o plano <strong className="text-foreground">{selectedPlan?.name}</strong>.
              Crie sua conta para liberar o acesso imediato.
            </DialogDescription>
          </DialogHeader>

          {/* Aviso de Erro */}
          {errorMessage && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Ex: João Silva"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pass">Senha</Label>
                <Input
                  id="pass"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPass">Confirmar Senha</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  required
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border text-sm mt-4">
              <div className="flex justify-between mb-1">
                <span>Plano selecionado:</span>
                <span className="font-medium">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{selectedPlan?.price}</span>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Criando conta..." : "Criar Conta e Acessar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}