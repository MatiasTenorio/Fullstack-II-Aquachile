import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FormularioSolicitud from './components/FormularioSolicitud';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormularioSolicitud/>} /> {/*Ruta por defecto*/}
      </Routes>
    </BrowserRouter>
  );
}

export default App; 