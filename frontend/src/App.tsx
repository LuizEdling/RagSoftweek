import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Laboratorio from './pages/Laboratorio';
import Pratica from './pages/Pratica';
import ComoFunciona from './pages/ComoFunciona';
import BaseConhecimento from './pages/BaseConhecimento';
import Sobre from './pages/Sobre';

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Laboratorio />} />
          <Route path="/pratica" element={<Pratica />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/base-de-conhecimento" element={<BaseConhecimento />} />
          <Route path="/sobre" element={<Sobre />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
