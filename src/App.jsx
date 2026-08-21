import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { storage } from "./storage";
import Login from "./Login";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function calcIdade(dataNasc) {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc + "T00:00:00");
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#A89C97", fontFamily: "sans-serif" }}>Carregando...</div>;
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  return <EstudioApp onSair={() => supabase.auth.signOut()} />;
}

function EstudioApp({ onSair }) {
  const [tab, setTab] = useState("turmas");
  const [turmas, setTurmas] = useState([]);
  const [alunas, setAlunas] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [pagamentos, setPagamentosState] = useState([]);
  const [contratos, setContratosState] = useState([]);
  const [despesas, setDespesasState] = useState([]);
  const [despesasFixas, setDespesasFixasState] = useState([]);
  const [config, setConfigState] = useState({ diaVencimento: 10, valoresPorDias: {} });
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const t = await storage.get("turmas");
        setTurmas(t ? JSON.parse(t.value) : []);
      } catch {
        setTurmas([]);
      }
      try {
        const a = await storage.get("alunas");
        setAlunas(a ? JSON.parse(a.value) : []);
      } catch {
        setAlunas([]);
      }
      try {
        const p = await storage.get("presencas");
        setPresencas(p ? JSON.parse(p.value) : []);
      } catch {
        setPresencas([]);
      }
      try {
        const pg = await storage.get("pagamentos");
        setPagamentosState(pg ? JSON.parse(pg.value) : []);
      } catch {
        setPagamentosState([]);
      }
      try {
        const c = await storage.get("contratos");
        setContratosState(c ? JSON.parse(c.value) : []);
      } catch {
        setContratosState([]);
      }
      try {
        const d = await storage.get("despesas");
        setDespesasState(d ? JSON.parse(d.value) : []);
      } catch {
        setDespesasState([]);
      }
      try {
        const df = await storage.get("despesasFixas");
        setDespesasFixasState(df ? JSON.parse(df.value) : []);
      } catch {
        setDespesasFixasState([]);
      }
      try {
        const cfg = await storage.get("config");
        setConfigState(cfg ? JSON.parse(cfg.value) : { diaVencimento: 10, valoresPorDias: {} });
      } catch {
        setConfigState({ diaVencimento: 10, valoresPorDias: {} });
      }
      setLoading(false);
    })();
  }, []);

  async function persist(key, value, setter) {
    setter(value);
    try {
      const res = await storage.set(key, JSON.stringify(value));
      if (!res) setSaveError("Não foi possível salvar. Tente novamente.");
      else setSaveError("");
    } catch {
      setSaveError("Não foi possível salvar. Tente novamente.");
    }
  }

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#FAF6F2",
      minHeight: "100vh",
      color: "#2E2A2C",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
        .display { font-family: 'Playfair Display', Georgia, serif; }
        input, select {
          font-family: 'Inter', sans-serif;
          border: 1px solid #E8DFD8;
          border-radius: 6px;
          padding: 9px 11px;
          font-size: 14px;
          background: #fff;
          color: #2E2A2C;
          width: 100%;
        }
        input:focus, select:focus {
          outline: 2px solid #8B4A5C;
          outline-offset: 1px;
          border-color: #8B4A5C;
        }
        label { font-size: 12.5px; color: #6B615D; font-weight: 500; display: block; margin-bottom: 4px; }
        button { cursor: pointer; font-family: 'Inter', sans-serif; }
        .btn-primary {
          background: #8B4A5C; color: #fff; border: none; border-radius: 6px;
          padding: 10px 18px; font-size: 14px; font-weight: 600;
        }
        .btn-primary:hover { background: #723B4A; }
        .btn-ghost {
          background: transparent; border: 1px solid #E8DFD8; border-radius: 6px;
          padding: 8px 14px; font-size: 13px; color: #6B615D; font-weight: 500;
        }
        .btn-ghost:hover { border-color: #8B4A5C; color: #8B4A5C; }
        .btn-text {
          background: none; border: none; font-size: 13px; font-weight: 500; padding: 4px 8px;
        }
        .card {
          background: #fff; border: 1px solid #E8DFD8; border-radius: 10px; padding: 18px;
        }
        @media (max-width: 640px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <header style={{
        padding: "28px 24px 20px",
        maxWidth: 960, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 className="display" style={{ fontSize: 26, fontWeight: 700, margin: 0, color: "#2E2A2C" }}>
              Estúdio
            </h1>
            <span style={{ fontSize: 13, color: "#A89C97" }}>gestão da escola de ballet</span>
          </div>
          <button className="btn-text" style={{ color: "#A89C97" }} onClick={onSair}>Sair</button>
        </div>

        {/* signature barre divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 20px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C9A15A" }} />
          <div style={{ flex: 1, height: 1, background: "#E8DFD8" }} />
        </div>

        <nav style={{ display: "flex", gap: 6 }}>
          {[
            { id: "turmas", label: `Turmas (${turmas.length})` },
            { id: "alunas", label: `Alunas (${alunas.length})` },
            { id: "presencas", label: "Presenças" },
            { id: "pagamentos", label: "Pagamentos" },
            { id: "contratos", label: "Contratos" },
            { id: "financeiro", label: "Financeiro" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                border: "none",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 13.5,
                fontWeight: 600,
                background: tab === t.id ? "#2E2A2C" : "transparent",
                color: tab === t.id ? "#fff" : "#6B615D",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 60px" }}>
        {saveError && (
          <div style={{ background: "#FBEAEA", color: "#A3403F", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {saveError}
          </div>
        )}
        {loading ? (
          <p style={{ color: "#A89C97", fontSize: 14 }}>Carregando dados...</p>
        ) : tab === "turmas" ? (
          <TurmasView turmas={turmas} setTurmas={(v) => persist("turmas", v, setTurmas)} alunas={alunas} />
        ) : tab === "alunas" ? (
          <AlunasView alunas={alunas} setAlunas={(v) => persist("alunas", v, setAlunas)} turmas={turmas} />
        ) : tab === "presencas" ? (
          <PresencasView
            turmas={turmas}
            alunas={alunas}
            presencas={presencas}
            setPresencas={(v) => persist("presencas", v, setPresencas)}
          />
        ) : tab === "pagamentos" ? (
          <PagamentosView
            alunas={alunas}
            pagamentos={pagamentos}
            setPagamentos={(v) => persist("pagamentos", v, setPagamentosState)}
            config={config}
            setConfig={(v) => persist("config", v, setConfigState)}
          />
        ) : tab === "contratos" ? (
          <ContratosView
            alunas={alunas}
            contratos={contratos}
            setContratos={(v) => persist("contratos", v, setContratosState)}
          />
        ) : (
          <FinanceiroView
            alunas={alunas}
            pagamentos={pagamentos}
            despesas={despesas}
            setDespesas={(v) => persist("despesas", v, setDespesasState)}
            despesasFixas={despesasFixas}
            setDespesasFixas={(v) => persist("despesasFixas", v, setDespesasFixasState)}
          />
        )}
      </main>
    </div>
  );
}

function TurmasView({ turmas, setTurmas, alunas }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyTurma());

  function emptyTurma() {
    return { nome: "", faixaEtaria: "", horarios: [{ dia: DIAS[0], horario: "" }], professora: "", capacidade: "" };
  }

  function openNew() {
    setForm(emptyTurma());
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(t) {
    setForm({
      nome: t.nome,
      faixaEtaria: t.faixaEtaria,
      horarios: t.horarios && t.horarios.length ? t.horarios : [{ dia: DIAS[0], horario: "" }],
      professora: t.professora,
      capacidade: t.capacidade,
    });
    setEditId(t.id);
    setShowForm(true);
  }

  function addHorario() {
    setForm({ ...form, horarios: [...form.horarios, { dia: DIAS[0], horario: "" }] });
  }

  function removeHorario(idx) {
    if (form.horarios.length <= 1) return;
    setForm({ ...form, horarios: form.horarios.filter((_, i) => i !== idx) });
  }

  function updateHorario(idx, field, value) {
    const novos = form.horarios.map((h, i) => (i === idx ? { ...h, [field]: value } : h));
    setForm({ ...form, horarios: novos });
  }

  function save() {
    if (!form.nome.trim()) return;
    if (editId) {
      setTurmas(turmas.map((t) => (t.id === editId ? { ...t, ...form } : t)));
      // remove dias regulares de alunas que não existem mais nesta turma
      const diasValidos = form.horarios.map((h) => h.dia);
      // (ajuste de alunas fica a cargo da tela de Alunas ao reabrir o cadastro)
    } else {
      setTurmas([...turmas, { id: uid(), ...form }]);
    }
    setShowForm(false);
  }

  function remove(id) {
    const vinculadas = alunas.filter((a) => a.turmaId === id).length;
    if (vinculadas > 0) {
      if (!window.confirm(`${vinculadas} aluna(s) estão nessa turma. Remover mesmo assim?`)) return;
    }
    setTurmas(turmas.filter((t) => t.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 18, margin: 0 }}>Turmas</h2>
        {!showForm && <button className="btn-primary" onClick={openNew}>+ Nova turma</button>}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Nome da turma</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Baby Class A" />
            </div>
            <div>
              <label>Faixa etária</label>
              <input value={form.faixaEtaria} onChange={(e) => setForm({ ...form, faixaEtaria: e.target.value })} placeholder="Ex.: 4 a 6 anos" />
            </div>
            <div>
              <label>Professora</label>
              <input value={form.professora} onChange={(e) => setForm({ ...form, professora: e.target.value })} placeholder="Nome da professora" />
            </div>
            <div>
              <label>Capacidade máxima (por sessão)</label>
              <input type="number" min="1" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} placeholder="Ex.: 12" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>Dias e horários desta turma</label>
            <div style={{ display: "grid", gap: 8 }}>
              {form.horarios.map((h, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select style={{ maxWidth: 140 }} value={h.dia} onChange={(e) => updateHorario(idx, "dia", e.target.value)}>
                    {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input value={h.horario} onChange={(e) => updateHorario(idx, "horario", e.target.value)} placeholder="Ex.: 15h às 16h" />
                  {form.horarios.length > 1 && (
                    <button className="btn-text" style={{ color: "#A3403F", flexShrink: 0 }} onClick={() => removeHorario(idx)}>Remover</button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn-ghost" style={{ marginTop: 8 }} onClick={addHorario}>+ Adicionar outro dia</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn-primary" onClick={save}>{editId ? "Salvar alterações" : "Adicionar turma"}</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {turmas.length === 0 && !showForm ? (
        <EmptyState text="Nenhuma turma cadastrada ainda. Comece adicionando a primeira." />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {turmas.map((t) => {
            const horarios = t.horarios || [];
            return (
              <div key={t.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t.nome}</div>
                  <div style={{ fontSize: 13, color: "#6B615D", marginTop: 3 }}>
                    {t.faixaEtaria && `${t.faixaEtaria} · `}
                    {horarios.map((h) => `${h.dia}${h.horario ? ` ${h.horario}` : ""}`).join(" · ")}
                    {t.professora && ` · Prof. ${t.professora}`}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                    {horarios.map((h) => {
                      const count = alunas.filter((a) => a.turmaId === t.id && (a.diasFrequenta || []).includes(h.dia)).length;
                      const lotado = t.capacidade && count >= Number(t.capacidade);
                      return (
                        <span key={h.dia} style={{ fontSize: 12.5, color: lotado ? "#A3403F" : "#A89C97" }}>
                          {h.dia}: {count}{t.capacidade ? `/${t.capacidade}` : ""}{lotado ? " · cheia" : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-text" style={{ color: "#6B615D" }} onClick={() => openEdit(t)}>Editar</button>
                  <button className="btn-text" style={{ color: "#A3403F" }} onClick={() => remove(t.id)}>Remover</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function turmaSelecionadaHorarios(turmas, turmaId) {
  const t = turmas.find((t) => t.id === turmaId);
  return t ? (t.horarios || []) : [];
}

function AlunasView({ alunas, setAlunas, turmas }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroTurma, setFiltroTurma] = useState("");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(emptyAluna());

  function emptyAluna() {
    return { nome: "", responsavel: "", contato: "", dataNascimento: "", turmaId: "", diasFrequenta: [], desconto: "", descontoMotivo: "" };
  }

  function openNew() {
    setForm(emptyAluna());
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(a) {
    setForm({
      nome: a.nome,
      responsavel: a.responsavel,
      contato: a.contato,
      dataNascimento: a.dataNascimento,
      turmaId: a.turmaId,
      diasFrequenta: a.diasFrequenta || [],
      desconto: a.desconto || "",
      descontoMotivo: a.descontoMotivo || "",
    });
    setEditId(a.id);
    setShowForm(true);
  }

  function toggleDia(dia) {
    const atual = form.diasFrequenta || [];
    if (!atual.includes(dia) && atual.length >= 4) return;
    const novo = atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia];
    setForm({ ...form, diasFrequenta: novo });
  }

  function selecionarTurma(turmaId) {
    const turma = turmas.find((t) => t.id === turmaId);
    const diasDaTurma = turma ? (turma.horarios || []).map((h) => h.dia) : [];
    // ao trocar de turma, mantém só os dias que existem na nova turma; se só tem 1 dia, marca automaticamente
    setForm({
      ...form,
      turmaId,
      diasFrequenta: diasDaTurma.length === 1 ? diasDaTurma : (form.diasFrequenta || []).filter((d) => diasDaTurma.includes(d)),
    });
  }

  function save() {
    if (!form.nome.trim()) return;
    if (editId) {
      setAlunas(alunas.map((a) => (a.id === editId ? { ...a, ...form } : a)));
    } else {
      setAlunas([...alunas, { id: uid(), ...form }]);
    }
    setShowForm(false);
  }

  function remove(id) {
    if (!window.confirm("Remover esta aluna do cadastro?")) return;
    setAlunas(alunas.filter((a) => a.id !== id));
  }

  const visiveis = alunas.filter((a) => {
    if (filtroTurma && a.turmaId !== filtroTurma) return false;
    if (busca && !a.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 className="display" style={{ fontSize: 18, margin: 0 }}>Alunas</h2>
        {!showForm && <button className="btn-primary" onClick={openNew}>+ Nova aluna</button>}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Nome da aluna</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <label>Nome do responsável</label>
              <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" />
            </div>
            <div>
              <label>Contato</label>
              <input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} placeholder="Telefone / WhatsApp" />
            </div>
            <div>
              <label>Data de nascimento</label>
              <input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Turma</label>
              <select value={form.turmaId} onChange={(e) => selecionarTurma(e.target.value)}>
                <option value="">Sem turma definida</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} · {(t.horarios || []).map((h) => h.dia).join(" e ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.turmaId && turmaSelecionadaHorarios(turmas, form.turmaId).length > 1 && (
            <div style={{ marginTop: 14 }}>
              <label>Dias que ela frequenta regularmente</label>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {turmaSelecionadaHorarios(turmas, form.turmaId).map((h) => (
                  <label key={h.dia} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#2E2A2C", fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      style={{ width: "auto" }}
                      checked={(form.diasFrequenta || []).includes(h.dia)}
                      onChange={() => toggleDia(h.dia)}
                    />
                    {h.dia}{h.horario ? ` (${h.horario})` : ""}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
            <div>
              <label>Desconto na mensalidade (%)</label>
              <input
                type="number" min="0" max="100"
                value={form.desconto}
                onChange={(e) => setForm({ ...form, desconto: e.target.value })}
                placeholder="Ex.: 10"
              />
            </div>
            <div>
              <label>Motivo do desconto</label>
              <input
                value={form.descontoMotivo}
                onChange={(e) => setForm({ ...form, descontoMotivo: e.target.value })}
                placeholder="Ex.: indicação da Maria"
                disabled={!form.desconto}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn-primary" onClick={save}>{editId ? "Salvar alterações" : "Adicionar aluna"}</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {alunas.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <input style={{ maxWidth: 220 }} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." />
          <select style={{ maxWidth: 240 }} value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
            <option value="">Todas as turmas</option>
            {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
      )}

      {alunas.length === 0 && !showForm ? (
        <EmptyState text="Nenhuma aluna cadastrada ainda. Comece adicionando a primeira." />
      ) : visiveis.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#A89C97" }}>Nenhuma aluna encontrada com esse filtro.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visiveis.map((a) => {
            const turma = turmas.find((t) => t.id === a.turmaId);
            const idade = calcIdade(a.dataNascimento);
            return (
              <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {a.nome}{idade !== null && <span style={{ fontWeight: 400, color: "#A89C97" }}> · {idade} anos</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B615D", marginTop: 3 }}>
                    {a.responsavel && `Resp.: ${a.responsavel}`}{a.contato && ` · ${a.contato}`}
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 4, color: turma ? "#8B4A5C" : "#A89C97" }}>
                    {turma
                      ? `${turma.nome}${a.diasFrequenta && a.diasFrequenta.length ? ` · ${a.diasFrequenta.join(" e ")}` : ""}`
                      : "Sem turma definida"}
                    {a.desconto ? ` · ${a.desconto}% de desconto${a.descontoMotivo ? ` (${a.descontoMotivo})` : ""}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-text" style={{ color: "#6B615D" }} onClick={() => openEdit(a)}>Editar</button>
                  <button className="btn-text" style={{ color: "#A3403F" }} onClick={() => remove(a.id)}>Remover</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function PresencasView({ turmas, alunas, presencas, setPresencas }) {
  const [modo, setModo] = useState("chamada"); // "chamada" | "historico"
  const [turmaId, setTurmaId] = useState("");
  const [dia, setDia] = useState("");
  const [data, setData] = useState(hojeISO());
  const [registros, setRegistros] = useState(null); // null = nada carregado ainda
  const [showAddReposicao, setShowAddReposicao] = useState(false);
  const [repAlunaId, setRepAlunaId] = useState("");
  const [repObs, setRepObs] = useState("");
  const [showAddExperimental, setShowAddExperimental] = useState(false);
  const [expNome, setExpNome] = useState("");
  const [expContato, setExpContato] = useState("");

  const turma = turmas.find((t) => t.id === turmaId);
  const horariosDaTurma = turma ? (turma.horarios || []) : [];
  const sessionId = turmaId && dia && data ? `${turmaId}_${dia}_${data}` : null;

  function carregarSessao() {
    if (!turmaId || !dia || !data) return;
    const existente = presencas.find((p) => p.id === sessionId);
    if (existente) {
      setRegistros(existente.registros);
    } else {
      const regulares = alunas
        .filter((a) => a.turmaId === turmaId && (a.diasFrequenta || []).includes(dia))
        .map((a) => ({ alunaId: a.id, tipo: "regular", status: "presente", obs: "" }));
      setRegistros(regulares);
    }
  }

  function toggleStatus(alunaId, nomeExperimental) {
    setRegistros(registros.map((r) => {
      const mesmo = nomeExperimental ? (r.tipo === "experimental" && r.nomeExperimental === nomeExperimental) : r.alunaId === alunaId;
      return mesmo ? { ...r, status: r.status === "presente" ? "falta" : "presente" } : r;
    }));
  }

  function removerRegistro(alunaId, nomeExperimental) {
    setRegistros(registros.filter((r) => {
      const mesmo = nomeExperimental ? (r.tipo === "experimental" && r.nomeExperimental === nomeExperimental) : r.alunaId === alunaId;
      return !mesmo;
    }));
  }

  function confirmarReposicao() {
    if (!repAlunaId) return;
    setRegistros([...registros, { alunaId: repAlunaId, tipo: "reposicao", status: "presente", obs: repObs }]);
    setRepAlunaId("");
    setRepObs("");
    setShowAddReposicao(false);
  }

  function confirmarExperimental() {
    if (!expNome.trim()) return;
    setRegistros([...registros, {
      alunaId: null,
      tipo: "experimental",
      status: "presente",
      obs: expContato ? `Contato: ${expContato}` : "",
      nomeExperimental: expNome,
    }]);
    setExpNome("");
    setExpContato("");
    setShowAddExperimental(false);
  }

  function salvarChamada() {
    const sessao = { id: sessionId, turmaId, dia, data, registros };
    const outras = presencas.filter((p) => p.id !== sessionId);
    setPresencas([...outras, sessao]);
  }

  const jaCarregado = registros !== null;
  const alunasDisponveisReposicao = alunas.filter((a) => !(registros || []).some((r) => r.alunaId === a.id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 className="display" style={{ fontSize: 18, margin: 0 }}>Presenças</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn-ghost"
            style={modo === "chamada" ? { borderColor: "#8B4A5C", color: "#8B4A5C" } : {}}
            onClick={() => setModo("chamada")}
          >
            Fazer chamada
          </button>
          <button
            className="btn-ghost"
            style={modo === "historico" ? { borderColor: "#8B4A5C", color: "#8B4A5C" } : {}}
            onClick={() => setModo("historico")}
          >
            Histórico
          </button>
        </div>
      </div>

      {modo === "historico" ? (
        <Historico turmas={turmas} alunas={alunas} presencas={presencas} onAbrir={(p) => {
          setTurmaId(p.turmaId);
          setDia(p.dia);
          setData(p.data);
          setRegistros(p.registros);
          setModo("chamada");
        }} />
      ) : turmas.length === 0 ? (
        <EmptyState text="Cadastre pelo menos uma turma antes de fazer a chamada." />
      ) : (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 12 }}>
              <div>
                <label>Turma</label>
                <select value={turmaId} onChange={(e) => { setTurmaId(e.target.value); setDia(""); setRegistros(null); }}>
                  <option value="">Selecione a turma</option>
                  {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label>Dia</label>
                <select value={dia} onChange={(e) => { setDia(e.target.value); setRegistros(null); }} disabled={!turmaId}>
                  <option value="">Selecione</option>
                  {horariosDaTurma.map((h) => <option key={h.dia} value={h.dia}>{h.dia}{h.horario ? ` · ${h.horario}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label>Data</label>
                <input type="date" value={data} onChange={(e) => { setData(e.target.value); setRegistros(null); }} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn-primary" disabled={!turmaId || !dia || !data} onClick={carregarSessao}>
                Abrir chamada
              </button>
            </div>
          </div>

          {jaCarregado && (
            <div>
              <div style={{ fontSize: 13, color: "#A89C97", marginBottom: 10 }}>
                {turma?.nome} · {dia} · {formatarData(data)}
              </div>

              {registros.length === 0 ? (
                <EmptyState text="Nenhuma aluna regular nesse dia. Adicione uma reposição se necessário." />
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {registros.map((r) => {
                    const a = r.tipo === "experimental" ? null : alunas.find((al) => al.id === r.alunaId);
                    const nomeExibido = r.tipo === "experimental" ? r.nomeExperimental : a?.nome;
                    if (!nomeExibido) return null;
                    const presente = r.status === "presente";
                    return (
                      <div key={r.alunaId || `exp-${r.nomeExperimental}-${registros.indexOf(r)}`} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                            {nomeExibido}
                            {r.tipo === "reposicao" && (
                              <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 600, color: "#C9A15A", border: "1px solid #C9A15A", borderRadius: 10, padding: "1px 8px" }}>
                                REPOSIÇÃO
                              </span>
                            )}
                            {r.tipo === "experimental" && (
                              <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 600, color: "#8B4A5C", border: "1px solid #8B4A5C", borderRadius: 10, padding: "1px 8px" }}>
                                EXPERIMENTAL
                              </span>
                            )}
                          </div>
                          {r.obs && <div style={{ fontSize: 12.5, color: "#A89C97", marginTop: 2 }}>{r.obs}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            onClick={() => toggleStatus(r.alunaId, r.tipo === "experimental" ? r.nomeExperimental : null)}
                            style={{
                              border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600,
                              background: presente ? "#E8F0E5" : "#FBEAEA",
                              color: presente ? "#4C7A44" : "#A3403F",
                            }}
                          >
                            {presente ? "Presente" : "Faltou"}
                          </button>
                          {(r.tipo === "reposicao" || r.tipo === "experimental") && (
                            <button className="btn-text" style={{ color: "#A89C97" }} onClick={() => removerRegistro(r.alunaId, r.tipo === "experimental" ? r.nomeExperimental : null)}>Remover</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showAddReposicao ? (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label>Aluna (reposição)</label>
                      <select value={repAlunaId} onChange={(e) => setRepAlunaId(e.target.value)}>
                        <option value="">Selecione a aluna</option>
                        {alunasDisponveisReposicao.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Observação (opcional)</label>
                      <input value={repObs} onChange={(e) => setRepObs(e.target.value)} placeholder="Ex.: repondo falta de 12/08" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="btn-primary" onClick={confirmarReposicao}>Adicionar à chamada</button>
                    <button className="btn-ghost" onClick={() => setShowAddReposicao(false)}>Cancelar</button>
                  </div>
                </div>
              ) : showAddExperimental ? (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label>Nome da aluna (experimental)</label>
                      <input value={expNome} onChange={(e) => setExpNome(e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div>
                      <label>Contato do responsável (opcional)</label>
                      <input value={expContato} onChange={(e) => setExpContato(e.target.value)} placeholder="Telefone / WhatsApp" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="btn-primary" onClick={confirmarExperimental}>Adicionar à chamada</button>
                    <button className="btn-ghost" onClick={() => setShowAddExperimental(false)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button className="btn-ghost" onClick={() => setShowAddReposicao(true)}>
                    + Adicionar aluna em reposição
                  </button>
                  <button className="btn-ghost" onClick={() => setShowAddExperimental(true)}>
                    + Adicionar aula experimental
                  </button>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <button className="btn-primary" onClick={salvarChamada}>Salvar chamada</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Historico({ turmas, alunas, presencas, onAbrir }) {
  const ordenadas = [...presencas].sort((a, b) => (a.data < b.data ? 1 : -1));

  if (ordenadas.length === 0) {
    return <EmptyState text="Nenhuma chamada registrada ainda." />;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {ordenadas.map((p) => {
        const turma = turmas.find((t) => t.id === p.turmaId);
        const presentes = p.registros.filter((r) => r.status === "presente").length;
        const faltas = p.registros.filter((r) => r.status === "falta").length;
        const reposicoes = p.registros.filter((r) => r.tipo === "reposicao").length;
        const experimentais = p.registros.filter((r) => r.tipo === "experimental").length;
        return (
          <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                {turma ? turma.nome : "Turma removida"} · {p.dia} · {formatarData(p.data)}
              </div>
              <div style={{ fontSize: 12.5, color: "#A89C97", marginTop: 3 }}>
                {presentes} presente{presentes !== 1 ? "s" : ""} · {faltas} falta{faltas !== 1 ? "s" : ""}
                {reposicoes > 0 && ` · ${reposicoes} reposição${reposicoes !== 1 ? "ões" : ""}`}
                {experimentais > 0 && ` · ${experimentais} experimental${experimentais !== 1 ? "is" : ""}`}
              </div>
            </div>
            <button className="btn-text" style={{ color: "#8B4A5C" }} onClick={() => onAbrir(p)}>Abrir</button>
          </div>
        );
      })}
    </div>
  );
}

const NOMES_MES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function mesAtualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function diasNoMes(ano, mesIndex) {
  return new Date(ano, mesIndex + 1, 0).getDate();
}

function PagamentosView({ alunas, pagamentos, setPagamentos, config, setConfig }) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualISO());
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState(config);

  useEffect(() => {
    setConfigForm(config);
  }, [config]);

  const [ano, mesStr] = mesSelecionado.split("-");
  const anoNum = Number(ano);
  const mesIndex = Number(mesStr) - 1;

  // quantidades de dias distintas em uso, pra saber quais valores configurar
  const qtdsEmUso = Array.from(new Set(
    alunas.filter((a) => a.turmaId && (a.diasFrequenta || []).length > 0).map((a) => a.diasFrequenta.length)
  )).sort();

  const doMes = pagamentos.filter((p) => p.mes === mesSelecionado);

  function salvarConfig() {
    setConfig(configForm);
    setShowConfig(false);
  }

  function gerarMensalidades() {
    const diaVenc = Math.min(config.diaVencimento || 10, diasNoMes(anoNum, mesIndex));
    const vencimento = `${ano}-${mesStr}-${String(diaVenc).padStart(2, "0")}`;
    const jaGeradas = new Set(doMes.map((p) => p.alunaId));
    const novas = [];
    alunas.forEach((a) => {
      if (!a.turmaId || !(a.diasFrequenta || []).length) return;
      if (jaGeradas.has(a.id)) return;
      const qtd = a.diasFrequenta.length;
      const valorBase = config.valoresPorDias?.[qtd];
      const desconto = Number(a.desconto) || 0;
      const valor = valorBase ? Math.round(valorBase * (1 - desconto / 100) * 100) / 100 : valorBase;
      novas.push({
        id: uid(),
        alunaId: a.id,
        mes: mesSelecionado,
        valor: valor || 0,
        valorBase: valorBase || 0,
        desconto,
        vencimento,
        status: "pendente",
      });
    });
    if (novas.length > 0) setPagamentos([...pagamentos, ...novas]);
  }

  function alternarStatus(id) {
    setPagamentos(pagamentos.map((p) => (p.id === id ? { ...p, status: p.status === "pago" ? "pendente" : "pago" } : p)));
  }

  const alunasSemValorConfigurado = qtdsEmUso.filter((q) => !config.valoresPorDias?.[q]);
  const hoje = hojeISO();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 className="display" style={{ fontSize: 18, margin: 0 }}>Pagamentos</h2>
        <button className="btn-ghost" onClick={() => setShowConfig(!showConfig)}>
          {showConfig ? "Fechar configurações" : "Configurar valores"}
        </button>
      </div>

      {showConfig && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <label>Dia de vencimento (todo mês)</label>
            <input
              type="number" min="1" max="28" style={{ maxWidth: 100 }}
              value={configForm.diaVencimento}
              onChange={(e) => setConfigForm({ ...configForm, diaVencimento: Number(e.target.value) })}
            />
          </div>
          <div>
            <label>Valor mensal por quantidade de dias frequentados</label>
            <div style={{ display: "grid", gap: 8 }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13.5, width: 90 }}>{n} dia{n > 1 ? "s" : ""}/semana</span>
                  <input
                    type="number" min="0" step="0.01" style={{ maxWidth: 140 }}
                    value={configForm.valoresPorDias?.[n] ?? ""}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      valoresPorDias: { ...configForm.valoresPorDias, [n]: Number(e.target.value) },
                    })}
                    placeholder="R$"
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn-primary" onClick={salvarConfig}>Salvar configurações</button>
            <button className="btn-ghost" onClick={() => { setConfigForm(config); setShowConfig(false); }}>Cancelar</button>
          </div>
        </div>
      )}

      {!showConfig && alunasSemValorConfigurado.length > 0 && (
        <div style={{ background: "#FFF6E5", color: "#8A6416", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          Falta configurar o valor de {alunasSemValorConfigurado.join(", ")} dia(s)/semana — clique em "Configurar valores".
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input type="month" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} style={{ maxWidth: 170 }} />
        <button className="btn-primary" onClick={gerarMensalidades}>Gerar mensalidades do mês</button>
      </div>

      {doMes.length === 0 ? (
        <EmptyState text={`Nenhuma mensalidade gerada para ${NOMES_MES[mesIndex]}/${ano} ainda.`} />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {doMes.map((p) => {
            const a = alunas.find((al) => al.id === p.alunaId);
            const atrasado = p.status !== "pago" && p.vencimento < hoje;
            return (
              <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{a ? a.nome : "Aluna removida"}</div>
                  <div style={{ fontSize: 12.5, color: "#A89C97", marginTop: 2 }}>
                    Vencimento {formatarData(p.vencimento)} · R$ {Number(p.valor).toFixed(2)}
                    {p.desconto > 0 && ` (${p.desconto}% de desconto sobre R$ ${Number(p.valorBase).toFixed(2)})`}
                    {!p.valor && " · valor não configurado"}
                  </div>
                </div>
                <button
                  onClick={() => alternarStatus(p.id)}
                  style={{
                    border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600,
                    background: p.status === "pago" ? "#E8F0E5" : atrasado ? "#FBEAEA" : "#F1EDE8",
                    color: p.status === "pago" ? "#4C7A44" : atrasado ? "#A3403F" : "#6B615D",
                  }}
                >
                  {p.status === "pago" ? "Pago" : atrasado ? "Atrasado" : "Pendente"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STATUS_CONTRATO = [
  { id: "pendente", label: "Pendente de assinatura", bg: "#FFF6E5", fg: "#8A6416" },
  { id: "ativo", label: "Ativo", bg: "#E8F0E5", fg: "#4C7A44" },
  { id: "encerrado", label: "Encerrado", bg: "#F1EDE8", fg: "#6B615D" },
];

function statusInfo(id) {
  return STATUS_CONTRATO.find((s) => s.id === id) || STATUS_CONTRATO[0];
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

function ContratosView({ alunas, contratos, setContratos }) {
  const [editId, setEditId] = useState(null); // alunaId sendo editado
  const [busca, setBusca] = useState("");
  const [statusForm, setStatusForm] = useState("pendente");
  const [dataForm, setDataForm] = useState("");
  const [arquivoInfo, setArquivoInfo] = useState(null); // {nome, tipo}
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");

  function contratoDe(alunaId) {
    return contratos.find((c) => c.alunaId === alunaId);
  }

  function abrirEdicao(aluna) {
    const c = contratoDe(aluna.id);
    setStatusForm(c?.status || "pendente");
    setDataForm(c?.dataAssinatura || "");
    setArquivoInfo(c?.arquivoNome ? { nome: c.arquivoNome, tipo: c.arquivoTipo } : null);
    setFileError("");
    setEditId(aluna.id);
  }

  async function selecionarArquivo(e, alunaId) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFileError("Arquivo muito grande (máximo ~4MB). Tente uma foto/scan mais leve.");
      return;
    }
    setUploading(true);
    setFileError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await storage.set(`contrato_arquivo_${alunaId}`, dataUrl);
      if (!res) throw new Error("falha");
      setArquivoInfo({ nome: file.name, tipo: file.type });
    } catch {
      setFileError("Não foi possível salvar o arquivo. Tente novamente.");
    }
    setUploading(false);
  }

  async function removerArquivo(alunaId) {
    try {
      await storage.delete(`contrato_arquivo_${alunaId}`);
    } catch {
      // segue mesmo se não existir
    }
    setArquivoInfo(null);
  }

  async function verArquivo(alunaId) {
    try {
      const res = await storage.get(`contrato_arquivo_${alunaId}`);
      if (res?.value) {
        const w = window.open();
        if (w) w.document.write(`<iframe src="${res.value}" style="border:none;width:100%;height:100vh;"></iframe>`);
      }
    } catch {
      setFileError("Não foi possível abrir o arquivo.");
    }
  }

  function salvar(alunaId) {
    const existente = contratoDe(alunaId);
    const registro = {
      id: existente?.id || uid(),
      alunaId,
      status: statusForm,
      dataAssinatura: dataForm,
      arquivoNome: arquivoInfo?.nome || "",
      arquivoTipo: arquivoInfo?.tipo || "",
    };
    const outros = contratos.filter((c) => c.alunaId !== alunaId);
    setContratos([...outros, registro]);
    setEditId(null);
  }

  const visiveis = alunas.filter((a) => !busca || a.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <h2 className="display" style={{ fontSize: 18, margin: "0 0 16px" }}>Contratos</h2>

      {alunas.length === 0 ? (
        <EmptyState text="Cadastre alunas primeiro para gerenciar os contratos delas." />
      ) : (
        <>
          <input style={{ maxWidth: 260, marginBottom: 14 }} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." />

          <div style={{ display: "grid", gap: 10 }}>
            {visiveis.map((a) => {
              const c = contratoDe(a.id);
              const info = statusInfo(c?.status);
              const editando = editId === a.id;
              return (
                <div key={a.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{a.nome}</div>
                      <div style={{ fontSize: 12.5, color: "#A89C97", marginTop: 2 }}>
                        {c?.dataAssinatura ? `Assinado em ${formatarData(c.dataAssinatura)}` : "Sem data registrada"}
                        {c?.arquivoNome ? " · arquivo anexado" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, background: info.bg, color: info.fg, borderRadius: 20, padding: "5px 12px" }}>
                        {info.label}
                      </span>
                      {!editando && (
                        <button className="btn-text" style={{ color: "#6B615D" }} onClick={() => abrirEdicao(a)}>Editar</button>
                      )}
                    </div>
                  </div>

                  {editando && (
                    <div style={{ marginTop: 14, borderTop: "1px solid #E8DFD8", paddingTop: 14 }}>
                      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label>Status</label>
                          <select value={statusForm} onChange={(e) => setStatusForm(e.target.value)}>
                            {STATUS_CONTRATO.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label>Data de assinatura</label>
                          <input type="date" value={dataForm} onChange={(e) => setDataForm(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <label>Contrato assinado (PDF ou foto)</label>
                        {arquivoInfo ? (
                          <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                            <span>{arquivoInfo.nome}</span>
                            <button className="btn-text" style={{ color: "#8B4A5C" }} onClick={() => verArquivo(a.id)}>Ver</button>
                            <button className="btn-text" style={{ color: "#A3403F" }} onClick={() => removerArquivo(a.id)}>Remover</button>
                          </div>
                        ) : (
                          <input type="file" accept=".pdf,image/*" onChange={(e) => selecionarArquivo(e, a.id)} disabled={uploading} />
                        )}
                        {uploading && <div style={{ fontSize: 12.5, color: "#A89C97", marginTop: 4 }}>Enviando arquivo...</div>}
                        {fileError && <div style={{ fontSize: 12.5, color: "#A3403F", marginTop: 4 }}>{fileError}</div>}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <button className="btn-primary" onClick={() => salvar(a.id)}>Salvar</button>
                        <button className="btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FinanceiroView({ alunas, pagamentos, despesas, setDespesas, despesasFixas, setDespesasFixas }) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualISO());
  const [showFixas, setShowFixas] = useState(false);
  const [novaFixa, setNovaFixa] = useState({ descricao: "", valor: "", diaDoMes: 5 });
  const [novaDespesa, setNovaDespesa] = useState({ descricao: "", valor: "", data: hojeISO() });
  const [showAddDespesa, setShowAddDespesa] = useState(false);

  const [ano, mesStr] = mesSelecionado.split("-");
  const anoNum = Number(ano);
  const mesIndex = Number(mesStr) - 1;

  const receitasDoMes = pagamentos.filter((p) => p.mes === mesSelecionado && p.status === "pago");
  const totalReceitas = receitasDoMes.reduce((s, p) => s + Number(p.valor || 0), 0);

  const despesasDoMes = despesas.filter((d) => d.data.slice(0, 7) === mesSelecionado);
  const totalDespesas = despesasDoMes.reduce((s, d) => s + Number(d.valor || 0), 0);

  const saldo = totalReceitas - totalDespesas;

  function addFixa() {
    if (!novaFixa.descricao.trim() || !novaFixa.valor) return;
    setDespesasFixas([...despesasFixas, { id: uid(), descricao: novaFixa.descricao, valor: Number(novaFixa.valor), diaDoMes: Number(novaFixa.diaDoMes) }]);
    setNovaFixa({ descricao: "", valor: "", diaDoMes: 5 });
  }

  function removerFixa(id) {
    setDespesasFixas(despesasFixas.filter((f) => f.id !== id));
  }

  function gerarDespesasFixas() {
    const jaGeradas = new Set(despesasDoMes.filter((d) => d.origemFixaId).map((d) => d.origemFixaId));
    const novas = [];
    despesasFixas.forEach((f) => {
      if (jaGeradas.has(f.id)) return;
      const dia = Math.min(f.diaDoMes || 5, diasNoMes(anoNum, mesIndex));
      novas.push({
        id: uid(),
        descricao: f.descricao,
        valor: f.valor,
        data: `${ano}-${mesStr}-${String(dia).padStart(2, "0")}`,
        origemFixaId: f.id,
      });
    });
    if (novas.length > 0) setDespesas([...despesas, ...novas]);
  }

  function addDespesaManual() {
    if (!novaDespesa.descricao.trim() || !novaDespesa.valor || !novaDespesa.data) return;
    setDespesas([...despesas, { id: uid(), descricao: novaDespesa.descricao, valor: Number(novaDespesa.valor), data: novaDespesa.data }]);
    setNovaDespesa({ descricao: "", valor: "", data: hojeISO() });
    setShowAddDespesa(false);
  }

  function removerDespesa(id) {
    setDespesas(despesas.filter((d) => d.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 className="display" style={{ fontSize: 18, margin: 0 }}>Financeiro</h2>
        <input type="month" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} style={{ maxWidth: 170 }} />
      </div>

      {/* Resumo / saldo */}
      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "#A89C97" }}>Receitas ({NOMES_MES[mesIndex]})</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#4C7A44" }}>R$ {totalReceitas.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#A89C97" }}>Despesas ({NOMES_MES[mesIndex]})</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#A3403F" }}>R$ {totalDespesas.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#A89C97" }}>Saldo</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700, color: saldo >= 0 ? "#4C7A44" : "#A3403F" }}>
            R$ {saldo.toFixed(2)} {saldo >= 0 ? "· lucro" : "· prejuízo"}
          </div>
        </div>
      </div>

      {/* Receitas */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 8 }}>Receitas (mensalidades pagas)</div>
        {receitasDoMes.length === 0 ? (
          <p style={{ fontSize: 13, color: "#A89C97" }}>Nenhuma mensalidade paga em {NOMES_MES[mesIndex]}/{ano} ainda.</p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {receitasDoMes.map((p) => {
              const a = alunas.find((al) => al.id === p.alunaId);
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "6px 2px", borderBottom: "1px solid #F1EDE8" }}>
                  <span>{a ? a.nome : "Aluna removida"}</span>
                  <span style={{ color: "#4C7A44", fontWeight: 600 }}>R$ {Number(p.valor).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Despesas fixas config */}
      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" onClick={() => setShowFixas(!showFixas)}>
          {showFixas ? "Fechar despesas fixas" : "Gerenciar despesas fixas"}
        </button>
      </div>

      {showFixas && (
        <div className="card" style={{ marginBottom: 20 }}>
          {despesasFixas.length > 0 && (
            <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
              {despesasFixas.map((f) => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
                  <span>{f.descricao} · R$ {Number(f.valor).toFixed(2)} · todo dia {f.diaDoMes}</span>
                  <button className="btn-text" style={{ color: "#A3403F" }} onClick={() => removerFixa(f.id)}>Remover</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.6fr", gap: 8 }}>
            <input placeholder="Descrição (ex.: Aluguel)" value={novaFixa.descricao} onChange={(e) => setNovaFixa({ ...novaFixa, descricao: e.target.value })} />
            <input type="number" step="0.01" placeholder="Valor" value={novaFixa.valor} onChange={(e) => setNovaFixa({ ...novaFixa, valor: e.target.value })} />
            <input type="number" min="1" max="28" placeholder="Dia" value={novaFixa.diaDoMes} onChange={(e) => setNovaFixa({ ...novaFixa, diaDoMes: e.target.value })} />
          </div>
          <button className="btn-primary" style={{ marginTop: 10 }} onClick={addFixa}>+ Adicionar despesa fixa</button>
        </div>
      )}

      {/* Despesas do mês */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>Despesas de {NOMES_MES[mesIndex]}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {despesasFixas.length > 0 && (
            <button className="btn-ghost" onClick={gerarDespesasFixas}>Gerar despesas fixas do mês</button>
          )}
          <button className="btn-primary" onClick={() => setShowAddDespesa(!showAddDespesa)}>+ Nova despesa</button>
        </div>
      </div>

      {showAddDespesa && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr", gap: 8 }}>
            <input placeholder="Descrição" value={novaDespesa.descricao} onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })} />
            <input type="number" step="0.01" placeholder="Valor" value={novaDespesa.valor} onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: e.target.value })} />
            <input type="date" value={novaDespesa.data} onChange={(e) => setNovaDespesa({ ...novaDespesa, data: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-primary" onClick={addDespesaManual}>Adicionar</button>
            <button className="btn-ghost" onClick={() => setShowAddDespesa(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {despesasDoMes.length === 0 ? (
        <EmptyState text={`Nenhuma despesa lançada em ${NOMES_MES[mesIndex]}/${ano} ainda.`} />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {despesasDoMes.sort((a, b) => (a.data < b.data ? 1 : -1)).map((d) => (
            <div key={d.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{d.descricao}</div>
                <div style={{ fontSize: 12, color: "#A89C97" }}>{formatarData(d.data)}{d.origemFixaId ? " · fixa" : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontWeight: 600, color: "#A3403F" }}>R$ {Number(d.valor).toFixed(2)}</span>
                <button className="btn-text" style={{ color: "#A89C97" }} onClick={() => removerDespesa(d.id)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ border: "1px dashed #E8DFD8", borderRadius: 10, padding: "40px 20px", textAlign: "center" }}>
      <p style={{ color: "#A89C97", fontSize: 14, margin: 0 }}>{text}</p>
    </div>
  );
}
