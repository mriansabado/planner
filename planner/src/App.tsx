import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { StoreProvider } from "./store/useStore";
import { Layout } from "./components/Layout";
import { PlannerPage } from "./pages/PlannerPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientPage } from "./pages/ClientPage";

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PlannerPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:clientId" element={<ClientPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
