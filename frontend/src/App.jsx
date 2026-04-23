import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Revenue from './pages/Revenue';
import Funnel from './pages/Funnel';
import Courses from './pages/Courses';
import Marketing from './pages/Marketing';
import Actions from './pages/Actions';
import DataEntry from './pages/DataEntry';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/funnel" element={<Funnel />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/actions" element={<Actions />} />
          <Route path="/data-entry" element={<DataEntry />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
