import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha incorretos.");
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#FAF6F2",
      fontFamily: "-apple-system, sans-serif",
    }}>
      <form onSubmit={entrar} style={{
        background: "#fff",
        border: "1px solid #E8DFD8",
        borderRadius: 12,
        padding: 32,
        width: "100%",
        maxWidth: 340,
      }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: "0 0 4px", color: "#2E2A2C" }}>Estúdio</h1>
        <p style={{ fontSize: 13, color: "#A89C97", margin: "0 0 20px" }}>Entre para gerenciar a escola</p>

        <label style={{ fontSize: 12.5, color: "#6B615D", fontWeight: 500 }}>E-mail</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", border: "1px solid #E8DFD8", borderRadius: 6, padding: "9px 11px", fontSize: 14, marginTop: 4, marginBottom: 14, boxSizing: "border-box" }}
        />

        <label style={{ fontSize: 12.5, color: "#6B615D", fontWeight: 500 }}>Senha</label>
        <input
          type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
          style={{ width: "100%", border: "1px solid #E8DFD8", borderRadius: 6, padding: "9px 11px", fontSize: 14, marginTop: 4, marginBottom: 18, boxSizing: "border-box" }}
        />

        {erro && <div style={{ color: "#A3403F", fontSize: 13, marginBottom: 14 }}>{erro}</div>}

        <button
          type="submit" disabled={loading}
          style={{ width: "100%", background: "#8B4A5C", color: "#fff", border: "none", borderRadius: 6, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
