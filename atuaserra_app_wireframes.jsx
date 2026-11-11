import { useState } from "react";

const WINE_RED = "#6B1A2A";
const WINE_LIGHT = "#8B2A3A";
const CREAM = "#FAF7F2";
const GOLD = "#C9A84C";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";
const WHITE = "#FFFFFF";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#4B4B4B";

const tags = {
  wifi: "Wi-Fi",
  pet: "Pet Friendly",
  estacionamento: "Estacionamento",
  acessivel: "Acessível",
  termais: "Águas Termais",
  kids: "Espaço Kids",
};

const cidades = [
  { nome: "Bento Gonçalves", estabelecimentos: 87, emoji: "🍇" },
  { nome: "Garibaldi", estabelecimentos: 54, emoji: "🥂" },
  { nome: "Carlos Barbosa", estabelecimentos: 41, emoji: "🌿" },
  { nome: "Cotiporã", estabelecimentos: 28, emoji: "🌄" },
  { nome: "Nova Prata", estabelecimentos: 33, emoji: "🏔️" },
  { nome: "Antônio Prado", estabelecimentos: 22, emoji: "⛪" },
];

const destaques = [
  { nome: "Vinícola Bebber", categoria: "Vinícola", cidade: "Garibaldi", tags: ["wifi", "estacionamento"], cor: "#7B3F00" },
  { nome: "Cascata dos Calza", categoria: "Turismo", cidade: "Bento Gonçalves", tags: ["pet", "acessivel"], cor: "#1A4A3A" },
  { nome: "Casa Bianchi", categoria: "Gastronomia", cidade: "Carlos Barbosa", tags: ["wifi", "kids"], cor: "#2A3A6A" },
  { nome: "Termas Caldas Novas", categoria: "Hospedagem", cidade: "Nova Prata", tags: ["termais", "estacionamento"], cor: "#4A2A6A" },
];

const estabelecimentos = [
  { nome: "Vinícola Bebber", categoria: "Vinícola", cidade: "Garibaldi", avaliacao: 4.8, cor: "#7B3F00" },
  { nome: "Restaurante Farina", categoria: "Gastronomia", cidade: "Bento Gonçalves", avaliacao: 4.6, cor: "#1A3A4A" },
  { nome: "Pousada Vale Verde", categoria: "Hospedagem", cidade: "Cotiporã", avaliacao: 4.9, cor: "#1A4A2A" },
  { nome: "Cascata dos Calza", categoria: "Turismo", cidade: "Bento Gonçalves", avaliacao: 4.7, cor: "#2A3A6A" },
  { nome: "Cantina Gelain", categoria: "Gastronomia", cidade: "Carlos Barbosa", avaliacao: 4.5, cor: "#4A2A1A" },
];

function Phone({ children, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 320,
        height: 620,
        background: WHITE,
        borderRadius: 36,
        border: "8px solid #1A1A1A",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* notch */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 90, height: 22, background: "#1A1A1A", borderRadius: "0 0 14px 14px", zIndex: 10
        }} />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: WINE_RED, letterSpacing: 1,
        textTransform: "uppercase", background: CREAM, padding: "4px 14px", borderRadius: 20,
        border: `1px solid ${WINE_RED}22`
      }}>
        {label}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{
      height: 40, background: WINE_RED, display: "flex", alignItems: "flex-end",
      justifyContent: "space-between", padding: "0 16px 6px", flexShrink: 0
    }}>
      <span style={{ color: WHITE, fontSize: 10, fontWeight: 700 }}>9:41</span>
      <span style={{ color: WHITE, fontSize: 10 }}>●●●</span>
    </div>
  );
}

function Tag({ label }) {
  return (
    <span style={{
      fontSize: 9, background: `${WINE_RED}15`, color: WINE_RED,
      padding: "2px 7px", borderRadius: 10, fontWeight: 600, whiteSpace: "nowrap"
    }}>
      {label}
    </span>
  );
}

function Stars({ n }) {
  return (
    <span style={{ color: GOLD, fontSize: 10 }}>
      {"★".repeat(Math.floor(n))}{"☆".repeat(5 - Math.floor(n))}
      <span style={{ color: GRAY, fontSize: 9, marginLeft: 3 }}>{n}</span>
    </span>
  );
}

// TELA 1 - HOME
function TelaHome() {
  return (
    <Phone label="Home">
      <StatusBar />
      {/* Header */}
      <div style={{ background: WINE_RED, padding: "8px 16px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ color: `${WHITE}99`, fontSize: 9 }}>Destino</div>
            <div style={{ color: WHITE, fontSize: 14, fontWeight: 800, letterSpacing: 0.5 }}>
              Uva e Vinho Serra Gaúcha
            </div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 16, background: `${WHITE}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: WHITE, fontSize: 16
          }}>👤</div>
        </div>
        {/* Search */}
        <div style={{
          background: WHITE, borderRadius: 12, padding: "8px 12px",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <span style={{ fontSize: 14, color: GRAY }}>🔍</span>
          <span style={{ fontSize: 12, color: GRAY }}>Buscar cidade ou estabelecimento...</span>
        </div>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: "auto", background: CREAM }}>
        {/* Cidades */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: TEXT_DARK }}>Explorar por Cidade</span>
            <span style={{ fontSize: 10, color: WINE_RED, fontWeight: 700 }}>Ver todas →</span>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {cidades.slice(0, 4).map((c, i) => (
              <div key={i} style={{
                minWidth: 80, background: WHITE, borderRadius: 12, padding: "10px 8px",
                textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: i === 0 ? `2px solid ${WINE_RED}` : "2px solid transparent",
                flexShrink: 0
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{c.emoji}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: TEXT_DARK, lineHeight: 1.2 }}>{c.nome}</div>
                <div style={{ fontSize: 8, color: GRAY, marginTop: 2 }}>{c.estabelecimentos} locais</div>
              </div>
            ))}
          </div>
        </div>

        {/* Destaques */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: TEXT_DARK }}>Em Destaque</span>
            <span style={{ fontSize: 10, color: WINE_RED, fontWeight: 700 }}>Ver todos →</span>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {destaques.slice(0, 3).map((d, i) => (
              <div key={i} style={{
                minWidth: 150, borderRadius: 14, overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", flexShrink: 0
              }}>
                <div style={{
                  height: 90, background: `linear-gradient(135deg, ${d.cor}, ${d.cor}99)`,
                  display: "flex", alignItems: "flex-end", padding: 8
                }}>
                  <span style={{ fontSize: 8, background: `${WHITE}33`, color: WHITE, padding: "2px 6px", borderRadius: 8, fontWeight: 700 }}>
                    {d.categoria}
                  </span>
                </div>
                <div style={{ background: WHITE, padding: "8px 10px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DARK }}>{d.nome}</div>
                  <div style={{ fontSize: 9, color: GRAY, marginTop: 2 }}>📍 {d.cidade}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {d.tags.slice(0, 2).map((t, j) => <Tag key={j} label={tags[t]} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorias */}
        <div style={{ padding: "14px 16px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_DARK, marginBottom: 10 }}>Categorias</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { icon: "🍷", label: "Vinícolas" },
              { icon: "🍽️", label: "Gastronomia" },
              { icon: "🏨", label: "Hospedagem" },
              { icon: "🌿", label: "Turismo" },
              { icon: "🎪", label: "Eventos" },
              { icon: "🛍️", label: "Artesanato" },
            ].map((cat, i) => (
              <div key={i} style={{
                background: WHITE, borderRadius: 12, padding: "10px 6px",
                textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
              }}>
                <div style={{ fontSize: 18 }}>{cat.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: TEXT_DARK, marginTop: 4 }}>{cat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        height: 56, background: WHITE, borderTop: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-around", flexShrink: 0
      }}>
        {[
          { icon: "🏠", label: "Início", active: true },
          { icon: "🔍", label: "Buscar" },
          { icon: "📍", label: "Cidades" },
          { icon: "❤️", label: "Salvos" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 8, color: item.active ? WINE_RED : GRAY, fontWeight: item.active ? 700 : 400 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Phone>
  );
}

// TELA 2 - LISTA
function TelaLista() {
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const filtros = ["Todos", "Vinícolas", "Gastronomia", "Hospedagem", "Turismo"];
  return (
    <Phone label="Lista de Estabelecimentos">
      <StatusBar />
      {/* Header */}
      <div style={{ background: WINE_RED, padding: "8px 16px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            flex: 1, background: `${WHITE}22`, borderRadius: 10, padding: "7px 12px",
            display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ color: `${WHITE}99`, fontSize: 12 }}>🔍</span>
            <span style={{ color: `${WHITE}66`, fontSize: 11 }}>Buscar estabelecimento...</span>
          </div>
          <div style={{
            width: 34, height: 34, background: `${WHITE}22`, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ fontSize: 14 }}>⚙️</span>
          </div>
        </div>
        {/* Filtros */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {filtros.map((f, i) => (
            <div key={i} onClick={() => setFiltroAtivo(f)} style={{
              padding: "4px 12px", borderRadius: 20, flexShrink: 0, cursor: "pointer",
              background: filtroAtivo === f ? WHITE : `${WHITE}22`,
              color: filtroAtivo === f ? WINE_RED : WHITE,
              fontSize: 10, fontWeight: 700
            }}>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div style={{ flex: 1, overflowY: "auto", background: CREAM, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, color: GRAY, marginBottom: 8 }}>
          {estabelecimentos.length} estabelecimentos encontrados
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {estabelecimentos.map((e, i) => (
            <div key={i} style={{
              background: WHITE, borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex"
            }}>
              <div style={{
                width: 80, background: `linear-gradient(135deg, ${e.cor}, ${e.cor}88)`,
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: 24 }}>🏛️</span>
              </div>
              <div style={{ padding: "10px 12px", flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_DARK }}>{e.nome}</div>
                <div style={{ fontSize: 9, color: WINE_RED, fontWeight: 700, marginTop: 2 }}>{e.categoria}</div>
                <div style={{ fontSize: 9, color: GRAY, marginTop: 2 }}>📍 {e.cidade}</div>
                <div style={{ marginTop: 6 }}>
                  <Stars n={e.avaliacao} />
                </div>
              </div>
              <div style={{
                width: 32, display: "flex", alignItems: "center", justifyContent: "center",
                color: GRAY, fontSize: 16, paddingRight: 8
              }}>›</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        height: 56, background: WHITE, borderTop: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-around", flexShrink: 0
      }}>
        {[
          { icon: "🏠", label: "Início" },
          { icon: "🔍", label: "Buscar", active: true },
          { icon: "📍", label: "Cidades" },
          { icon: "❤️", label: "Salvos" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 8, color: item.active ? WINE_RED : GRAY, fontWeight: item.active ? 700 : 400 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Phone>
  );
}

// TELA 3 - DETALHE
function TelaDetalhe() {
  return (
    <Phone label="Detalhe do Estabelecimento">
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Foto hero */}
        <div style={{
          height: 180, background: "linear-gradient(135deg, #7B3F00, #4A2A00)",
          position: "relative", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontSize: 48, opacity: 0.4 }}>🍷</span>
          {/* Back button */}
          <div style={{
            position: "absolute", top: 36, left: 14,
            width: 32, height: 32, background: `${WHITE}CC`, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: TEXT_DARK
          }}>‹</div>
          {/* Favorito */}
          <div style={{
            position: "absolute", top: 36, right: 14,
            width: 32, height: 32, background: `${WHITE}CC`, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14
          }}>♡</div>
          {/* Badge categoria */}
          <div style={{
            position: "absolute", bottom: 12, left: 14,
            background: WINE_RED, color: WHITE, fontSize: 9,
            padding: "3px 10px", borderRadius: 10, fontWeight: 700
          }}>Vinícola</div>
        </div>

        {/* Conteudo */}
        <div style={{ background: WHITE, flex: 1, padding: "14px 16px" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: TEXT_DARK, lineHeight: 1.2 }}>
            Vinícola Bebber
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Stars n={4.8} />
            <span style={{ fontSize: 9, color: GRAY }}>(127 avaliações)</span>
          </div>
          <div style={{ fontSize: 10, color: GRAY, marginTop: 4 }}>📍 Garibaldi, RS</div>

          {/* Amenidades */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_DARK, marginBottom: 8 }}>O que oferece</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.values(tags).map((t, i) => (
                <Tag key={i} label={t} />
              ))}
            </div>
          </div>

          {/* Descricao */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_DARK, marginBottom: 6 }}>Sobre</div>
            <div style={{ fontSize: 10, color: TEXT_MID, lineHeight: 1.6 }}>
              Vinícola familiar com mais de 80 anos de tradição na produção de vinhos finos da Serra Gaúcha. 
              Oferece degustações guiadas, tours pelos parreirais e gastronomia típica italiana.
            </div>
          </div>

          {/* Horarios */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_DARK, marginBottom: 6 }}>Horários</div>
            {[
              { dia: "Seg - Sex", hora: "09h às 18h" },
              { dia: "Sábados", hora: "09h às 17h" },
              { dia: "Domingos", hora: "10h às 15h" },
            ].map((h, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: i < 2 ? "1px solid #F3F4F6" : "none"
              }}>
                <span style={{ fontSize: 10, color: GRAY }}>{h.dia}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_DARK }}>{h.hora}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botoes de acao */}
      <div style={{
        background: WHITE, padding: "10px 16px 14px",
        borderTop: "1px solid #E5E7EB", display: "flex", gap: 8, flexShrink: 0
      }}>
        <div style={{
          flex: 1, background: "#25D366", borderRadius: 12, padding: "10px",
          textAlign: "center", color: WHITE, fontSize: 11, fontWeight: 700
        }}>
          📱 WhatsApp
        </div>
        <div style={{
          flex: 1, background: WINE_RED, borderRadius: 12, padding: "10px",
          textAlign: "center", color: WHITE, fontSize: 11, fontWeight: 700
        }}>
          🌐 Ver Site
        </div>
        <div style={{
          width: 42, background: LIGHT_GRAY, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16
        }}>
          📤
        </div>
      </div>
    </Phone>
  );
}

// TELA 4 - CIDADES
function TelaCidades() {
  return (
    <Phone label="Cidades">
      <StatusBar />
      <div style={{ background: WINE_RED, padding: "8px 16px 14px", flexShrink: 0 }}>
        <div style={{ color: `${WHITE}99`, fontSize: 9, marginBottom: 2 }}>Região</div>
        <div style={{ color: WHITE, fontSize: 15, fontWeight: 800 }}>Serra Gaúcha</div>
        <div style={{ color: `${WHITE}88`, fontSize: 10, marginTop: 2 }}>
          {cidades.reduce((a, c) => a + c.estabelecimentos, 0)} estabelecimentos em {cidades.length} cidades
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: CREAM, padding: "12px" }}>
        {/* Busca */}
        <div style={{
          background: WHITE, borderRadius: 12, padding: "8px 12px",
          display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
        }}>
          <span style={{ fontSize: 14, color: GRAY }}>🔍</span>
          <span style={{ fontSize: 11, color: GRAY }}>Buscar cidade...</span>
        </div>

        {/* Grid de cidades */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {cidades.map((c, i) => (
            <div key={i} style={{
              background: WHITE, borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)"
            }}>
              <div style={{
                height: 70,
                background: `linear-gradient(135deg, ${WINE_RED}, ${WINE_LIGHT})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28
              }}>
                {c.emoji}
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_DARK, lineHeight: 1.2 }}>{c.nome}</div>
                <div style={{ fontSize: 9, color: GRAY, marginTop: 2 }}>{c.estabelecimentos} locais</div>
                <div style={{
                  marginTop: 6, fontSize: 9, color: WINE_RED, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 2
                }}>
                  Explorar →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        height: 56, background: WHITE, borderTop: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-around", flexShrink: 0
      }}>
        {[
          { icon: "🏠", label: "Início" },
          { icon: "🔍", label: "Buscar" },
          { icon: "📍", label: "Cidades", active: true },
          { icon: "❤️", label: "Salvos" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 8, color: item.active ? WINE_RED : GRAY, fontWeight: item.active ? 700 : 400 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Phone>
  );
}

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, #1A0A0E 0%, #2D1015 50%, #1A0A0E 100%)`,
      padding: "32px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Titulo */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{
          display: "inline-block", background: `${GOLD}22`, border: `1px solid ${GOLD}44`,
          color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2,
          padding: "4px 14px", borderRadius: 20, marginBottom: 12, textTransform: "uppercase"
        }}>
          Wireframes — App Mobile
        </div>
        <div style={{ color: WHITE, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>
          AtuaSerra
        </div>
        <div style={{ color: `${WHITE}66`, fontSize: 12, marginTop: 4 }}>
          Referência visual para desenvolvimento em React Native / Expo
        </div>
      </div>

      {/* Telas */}
      <div style={{
        display: "flex", gap: 28, justifyContent: "center",
        flexWrap: "wrap", alignItems: "flex-start"
      }}>
        <TelaHome />
        <TelaLista />
        <TelaDetalhe />
        <TelaCidades />
      </div>

      {/* Legenda */}
      <div style={{
        marginTop: 40, maxWidth: 900, margin: "40px auto 0",
        background: `${WHITE}08`, borderRadius: 16, padding: "20px 24px",
        border: `1px solid ${WHITE}12`
      }}>
        <div style={{ color: GOLD, fontSize: 12, fontWeight: 800, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>
          Notas de Design
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { tela: "Home", desc: "Busca no topo, carrossel de cidades, destaques em cards horizontais e grid de categorias. Navegação bottom tab." },
            { tela: "Lista", desc: "Filtros por categoria no header, cards verticais com foto, nome, categoria, cidade e avaliação em estrelas." },
            { tela: "Detalhe", desc: "Hero foto grande, avaliação, amenidades em tags, descrição, horários e botões de ação (WhatsApp, Site, Compartilhar)." },
            { tela: "Cidades", desc: "Grid 2 colunas com foto representativa, nome, contagem de estabelecimentos e link para explorar." },
          ].map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <div style={{
                width: 6, borderRadius: 3, background: WINE_RED, flexShrink: 0, alignSelf: "stretch"
              }} />
              <div>
                <div style={{ color: WHITE, fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{n.tela}</div>
                <div style={{ color: `${WHITE}77`, fontSize: 10, lineHeight: 1.5 }}>{n.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: `1px solid ${WHITE}12`,
          color: `${WHITE}55`, fontSize: 9, lineHeight: 1.6
        }}>
          Paleta principal: Vinho (#6B1A2A) · Dourado (#C9A84C) · Creme (#FAF7F2) — consistente com a identidade visual do site serragaucha.com
        </div>
      </div>
    </div>
  );
}
