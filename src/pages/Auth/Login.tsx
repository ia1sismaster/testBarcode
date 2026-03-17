import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react"; // Adicionei AlertCircle e Loader2
import { login } from "../../service/usuarioService"; // Ajuste o caminho se necessário

export function Login() {
  const navigate = useNavigate();
  
  // 1. Estados para capturar os dados
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(""); // Usei 'senha' para bater com seu backend
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. Função de Login Real
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null); // Limpa erros anteriores
    
    try {
      // Chama o serviço que conecta no Java
      await login(email, senha);
      
      // Se passou daqui, o token já está salvo no localStorage
      navigate("/projetos");
      
    } catch (error) {
      console.error(error);
      // Mostra mensagem de erro na tela
      setErrorMessage("Email ou senha incorretos. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              {/* Logo */}
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-sm">
            Insira suas credenciais para acessar a plataforma
          </p>
        </div>

        {/* 3. Área de Aviso de Erro (Só aparece se der erro) */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                className="pl-9" 
                required 
                // Vinculando o estado
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link 
                to="/forgot-password" 
                className="text-xs text-primary hover:underline font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                className="pl-9" 
                required 
                // Vinculando o estado
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                </>
            ) : (
                "Entrar na Plataforma"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Ou
            </span>
          </div>
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Ainda não tem uma conta? </span>
          <Link 
            to="/register" 
            className="font-medium text-primary hover:underline inline-flex items-center"
          >
            Escolher um plano <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}