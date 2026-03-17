import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Monitor, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

export function ResetLicenseView() {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentMachines = [
    {
      id: "HWID-ABC-123-XYZ",
      name: "Desktop - Escritório",
      lastAccess: "Hoje às 14:30",
      active: true,
    },
    {
      id: "HWID-DEF-456-UVW",
      name: "Notebook - Casa",
      lastAccess: "Ontem às 09:15",
      active: false,
    },
  ];

  const handleReset = () => {
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
    }, 2000);
  };

  const handleCopy = (hwid: string) => {
    navigator.clipboard.writeText(hwid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Resetar Licença de PC</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os computadores autorizados a usar o software desktop
        </p>
      </div>

      {/* Alert Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Você pode resetar a licença de PC caso tenha formatado ou trocado de computador.
          Isso permitirá que você ative o software em uma nova máquina.
        </AlertDescription>
      </Alert>

      {resetSuccess && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Licença Resetada com Sucesso!</AlertTitle>
          <AlertDescription className="text-green-700">
            Agora você pode ativar o software em um novo computador.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Machines */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="mb-4">Computadores Autorizados</h3>
        <div className="space-y-4">
          {currentMachines.map((machine) => (
            <div
              key={machine.id}
              className="flex items-start justify-between p-4 bg-muted/30 rounded-lg"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  machine.active ? "bg-primary/10" : "bg-muted"
                }`}>
                  <Monitor className={`w-6 h-6 ${
                    machine.active ? "text-primary" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{machine.name}</p>
                    {machine.active && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {machine.lastAccess}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border border-border">
                      {machine.id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(machine.id)}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Section */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="mb-4">Resetar Licença</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Ao resetar a licença, todas as máquinas autorizadas serão desvinculadas da sua conta.
          Você precisará fazer login novamente no software desktop em cada computador que deseja usar.
        </p>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive mb-1">
                Atenção: Esta ação não pode ser desfeita
              </p>
              <p className="text-sm text-destructive/80">
                Certifique-se de que realmente precisa resetar a licença antes de continuar.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={handleReset}
          disabled={resetting}
          size="lg"
        >
          {resetting ? "Resetando..." : "Resetar Todas as Licenças"}
        </Button>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="mb-4">Perguntas Frequentes</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm mb-1">Quando devo resetar a licença?</h4>
            <p className="text-sm text-muted-foreground">
              Quando você formatar o computador, trocar de máquina ou receber erro de ativação.
            </p>
          </div>
          <div>
            <h4 className="text-sm mb-1">Quantas vezes posso resetar?</h4>
            <p className="text-sm text-muted-foreground">
              Não há limite de resets, mas recomendamos fazer apenas quando necessário.
            </p>
          </div>
          <div>
            <h4 className="text-sm mb-1">O que acontece com meus projetos?</h4>
            <p className="text-sm text-muted-foreground">
              Seus projetos e dados permanecem salvos na nuvem. Apenas a vinculação da máquina é removida.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
