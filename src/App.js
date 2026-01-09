import React from "react";
import Catalogo from "./components/Catalogo";
import "./App.css";
import logo from "./components/img/logo.png";

function App() {
  return (
    <div className="App">
      {/* 1. Nombre arriba */}
      <h1 className="app-title">Mapache Shop</h1>

      {/* 2. Logo (favicon) debajo */}
      <img src={logo} alt="logo esotérico" className="logo-principal" />

      {/* 3. Subtítulo */}
      <h2 className="app-subtitle">🕯️ Catálogo Esotérico 🕯️</h2>

    
      {/* 5. Catálogo */}
      <Catalogo />
    </div>
  );
}

export default App;
