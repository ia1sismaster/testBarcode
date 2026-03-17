export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  features: string[];
  limits: {
    products: number;
    files: number;    // -1 = ilimitado
    machines: number;
  };
}

export const PLANS: Plan[] = [
  {
    id: "iniciante",
    name: "Iniciante",
    price: "R$ 149",
    period: "mês",
    description: "Ideal para pequenos vendedores",
    features: [
      "1.000 produtos por mês",
      "1 máquina autorizada",
      "Até 5 arquivos/mês",
      "Exportação em Excel",
      "Suporte por email (48h)",
    ],
    limits: { products: 500, files: 5, machines: 1 },
  },
  {
    id: "profissional",
    name: "Profissional",
    price: "R$ 399",
    period: "mês",
    description: "Para vendedores estabelecidos",
    popular: true,
    features: [
      "15.000 produtos por mês",
      "3 máquinas autorizadas",
      "Arquivos ilimitados",
      "Suporte por email (12h)",
      "Reset de licença sem limite",
    ],
    limits: { products: 3000, files: -1, machines: 3 },
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: "R$ 899",
    period: "mês",
    description: "Para grandes operações",
    features: [
      "Ilimitado",
      "10 máquinas autorizadas",
      "Arquivos ilimitados",
      "Suporte prioritário (4h)",
      "Reset de licença sem limite",
    ],
    limits: { products: 10000, files: -1, machines: 10 },
  },
];