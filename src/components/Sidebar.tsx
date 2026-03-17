import {
  FolderKanban, 
  MonitorDown, Download, Settings,
  CreditCard, Monitor, LogOut, Bot, Boxes, X
} from "lucide-react";
import { Button } from "./ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../service/usuarioService";
import { baixarExe } from "../service/roboService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const userName = localStorage.getItem("user_nome") || "Usuário";
  const userEmail = localStorage.getItem("user_email") || "sem@email.com";

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = () => logout();

  const handleDownloadExe = async () => {
    try {
      await baixarExe();
    } catch {
      alert("Erro ao iniciar o download.");
    }
  };

  const menuItems = [
    { path: "/projetos", label: "Meus Lotes(com Planilha)", icon: FolderKanban },
    { path: "/lotes", label: "Meus Lotes(Sem Planilha)", icon: Boxes },
    { path: "/robo", label: "Robô", icon: Bot },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">

      {/* Header */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">PrecificaLote</h1>
          <p className="text-xs text-muted-foreground mt-1">Inteligência de Preficação para Lotes de Logistas Reversa</p>
        </div>
        {/* Botão fechar — só no mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors w-full
                ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Download card */}
      <div className="p-4 mt-auto">
        <div className="bg-muted/50 border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-background rounded-lg border shadow-sm">
              <MonitorDown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Instalar Agente</p>
              <p className="text-[10px] text-muted-foreground">Windows v1.0</p>
            </div>
          </div>
          <Button className="w-full text-xs h-8" size="sm" onClick={handleDownloadExe}>
            <Download className="w-3 h-3 mr-2" />
            Baixar .EXE
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-white">{getInitials(userName)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[100px]" title={userName}>{userName}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[100px]" title={userEmail}>{userEmail}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar-accent">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { navigate("/assinatura"); onClose?.(); }}>
                <CreditCard className="w-4 h-4 mr-2" /> Assinatura
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigate("/reset"); onClose?.(); }}>
                <Monitor className="w-4 h-4 mr-2" /> Licença do PC
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigate("/perfil"); onClose?.(); }}>
                <CreditCard className="w-4 h-4 mr-2" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}