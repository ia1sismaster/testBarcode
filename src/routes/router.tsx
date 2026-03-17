import type { RouteObject } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { DashboardView } from "../pages/dashboard/DashboardView";
import { SubscriptionView } from "../pages/assinatura/SubscriptionView";
import { ResetLicenseView } from "../pages/reset/ResetLicenseView";
import { ProductsView } from "../pages/produto/ProdutoView";
import { BotControllerView } from "../pages/bot/BotControllerView";
import { ProfileView } from "../pages/Perfil/PerfilView";
import { LotesView } from "../pages/lote/LotesView";

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <DashboardView /> },
      { path: "/projetos", element: <DashboardView /> },
      { path: "/assinatura", element: <SubscriptionView /> },
      { path: "/reset", element: <ResetLicenseView /> },
      { path: "/produto", element: <ProductsView />},
      {path: "/lotes", element: <LotesView/>},
      {path: "/robo", element: <BotControllerView />},
      {path: "/perfil", element: <ProfileView />}
    ],
  },
];
