import { Button } from "../../components/ui/button";
import { Check, Crown, AlertCircle, TrendingUp, CreditCard } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useNavigate } from "react-router-dom";
import { PLANS, type Plan } from "../../service/planoService";
import { PlanCard } from "../../components/PlanCard";

export function SubscriptionView() {
  const navigate = useNavigate();

  const currentPlan = {
    name: "Profissional",
    price: "R$ 399",
    period: "mês",
    renewDate: "15/02/2025",
    productsUsed: 1847,
    productsTotal: 3000,
    filesUsed: 12,
    filesTotal: -1, // ilimitado
    machinesUsed: 2,
    machinesTotal: 3,
  };



  const usagePercentage = (currentPlan.productsUsed / currentPlan.productsTotal) * 100;
  const filesPercentage = currentPlan.filesTotal === -1 ? 0 : (currentPlan.filesUsed / currentPlan.filesTotal) * 100;
  const machinesPercentage = (currentPlan.machinesUsed / currentPlan.machinesTotal) * 100;
  const isNearLimit = usagePercentage >= 80;

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano e acompanhe o uso mensal
        </p>
      </div>

      {/* Alert se próximo do limite */}
      {isNearLimit && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Atenção:</strong> Você já usou {Math.round(usagePercentage)}% do seu limite mensal.
            Considere fazer upgrade para evitar interrupções.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Usage */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold">Plano {currentPlan.name}</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Ativo
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Renovação automática em {currentPlan.renewDate}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{currentPlan.price}</div>
            <div className="text-xs text-muted-foreground">por mês</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Produtos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Produtos Consultados</span>
              <span className="font-semibold">
                {currentPlan.productsUsed.toLocaleString()} / {currentPlan.productsTotal.toLocaleString()}
              </span>
            </div>
            <Progress
              value={usagePercentage}
              className={`h-2.5 ${isNearLimit ? '[&>div]:bg-orange-500' : '[&>div]:bg-primary'}`}
            />
            <p className="text-xs text-muted-foreground">
              {Math.round(usagePercentage)}% utilizado este mês
            </p>
          </div>

          {/* Arquivos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Arquivos Enviados</span>
              <span className="font-semibold">
                {currentPlan.filesUsed} / {currentPlan.filesTotal === -1 ? "∞" : currentPlan.filesTotal}
              </span>
            </div>
            <Progress
              value={filesPercentage}
              className="h-2.5 [&>div]:bg-blue-500"
            />
            <p className="text-xs text-muted-foreground">
              {currentPlan.filesTotal === -1 ? "Uploads ilimitados" : `${currentPlan.filesUsed} de ${currentPlan.filesTotal}`}
            </p>
          </div>

          {/* Máquinas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Máquinas Ativas</span>
              <span className="font-semibold">
                {currentPlan.machinesUsed} / {currentPlan.machinesTotal}
              </span>
            </div>
            <Progress
              value={machinesPercentage}
              className="h-2.5 [&>div]:bg-purple-500"
            />
            <Button
              variant="link"
              className="h-auto p-0 text-xs hover:text-primary"
              onClick={() => navigate('/reset')}
            >
              Gerenciar máquinas →
            </Button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.name === currentPlan.name}
            />
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Uso nos Últimos 30 Dias</h3>
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ver Relatório Completo
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-700 mb-1">1.847</div>
            <div className="text-xs text-blue-600 font-medium">Produtos consultados</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-700 mb-1">12</div>
            <div className="text-xs text-purple-600 font-medium">Arquivos processados</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-700 mb-1">87%</div>
            <div className="text-xs text-green-600 font-medium">Taxa de sucesso</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="text-3xl font-bold text-orange-700 mb-1">2/3</div>
            <div className="text-xs text-orange-600 font-medium">Máquinas ativas</div>
          </div>
        </div>
      </div>

      {/* Método de Pagamento */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Método de Pagamento</h3>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center shadow-sm">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Cartão de Crédito</p>
              <p className="text-xs text-muted-foreground">•••• •••• •••• 4532 - Vence 12/2026</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Alterar Cartão
          </Button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Próxima Cobrança
              </p>
              <p className="text-xs text-blue-700">
                Seu cartão será cobrado automaticamente em {currentPlan.renewDate} no valor de {currentPlan.price}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Gerenciar Assinatura</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1">
            Alterar Plano
          </Button>
          <Button variant="outline" className="flex-1">
            Histórico de Pagamentos
          </Button>
          <Button variant="outline" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10">
            Cancelar Assinatura
          </Button>
        </div>
      </div>
    </div>
  );
}