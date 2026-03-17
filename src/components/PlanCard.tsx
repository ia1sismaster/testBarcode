import { Check, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Plan } from "../service/planoService";

interface PlanCardProps {
  plan: Plan;
  isCurrent?: boolean;
  onSelect?: (plan: Plan) => void;
}

export function PlanCard({ plan, isCurrent = false, onSelect }: PlanCardProps) {
  return (
    <div className={`bg-white rounded-lg border-2 p-6 relative flex flex-col transition-all hover:shadow-lg
      ${plan.popular ? "border-primary shadow-md" : "border-border"}
      ${isCurrent ? "border-primary shadow-md" : ""}
    `}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 shadow-sm">
            <Crown className="w-3 h-3 mr-1" /> Mais Popular
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-xl font-bold">{plan.name}</h4>
          {isCurrent && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              Atual
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground text-sm">/{plan.period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-6 flex-1 min-h-[180px]">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground leading-tight">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="w-full"
        variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
        disabled={isCurrent}
        size="lg"
        onClick={() => onSelect?.(plan)}
      >
        {isCurrent ? "Plano Atual" : "Selecionar Plano"}
      </Button>
    </div>
  );
}