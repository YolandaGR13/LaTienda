import React from "react";
import Catalogo from "./components/Catalogo";
import "./App.css";
import logo from "./components/img/logo.png";

function App() {
  return (
    <div className="App">
      <img src={logo} alt="logo esotérico" className="logo-principal" />
      <h1>🕯️ Catalogo Esotérico 🕯️</h1>
      <Catalogo />
    </div>
  );
}

export default App;
