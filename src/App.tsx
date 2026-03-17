import { DashboardView } from "./pages/dashboard/DashboardView";
import { ProjectsDetails } from "./components/ProjectsDetails";
import { SubscriptionView } from "./pages/assinatura/SubscriptionView";
import { ResetLicenseView } from "./pages/reset/ResetLicenseView";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Login } from "./pages/Auth/Login";
import { Registro } from "./pages/Auth/Registro";
import { ProductsView } from "./pages/produto/ProdutoView";
import { BotControllerView } from "./pages/bot/BotControllerView";
import { ProfileView } from "./pages/Perfil/PerfilView";
import { LotesView } from "./pages/lote/LotesView";
import { LoteDetails } from "./pages/lote/LoteDetails";
import LabelEditorPage from "./pages/editor/BarcodeEdit";


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registro/>} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardView />} />
          <Route path="/projetos" element={<DashboardView />} />
          <Route path="/assinatura" element={<SubscriptionView />} />
          <Route path="/reset" element={<ResetLicenseView />} />
          <Route path="/projeto/:id" element={<ProjectsDetails />} />
          <Route path="/produto" element={<ProductsView />} />
          <Route path="/lotes" element={<LotesView />} />
          <Route path= "/perfil" element ={ <ProfileView />}/>
          <Route path="/robo" element={<BotControllerView />} />
          <Route path="/lote/:arquivoId" element={<LoteDetails />} />
          <Route path="/editor/barcode" element={<LabelEditorPage />} />
        </Route>
      </Routes>

    </BrowserRouter>
  );
}
export default App;