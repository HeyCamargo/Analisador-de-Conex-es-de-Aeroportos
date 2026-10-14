// ===== Interface =====
const $ = s => document.querySelector(s);
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const brl = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hm = m => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NS = "http://www.w3.org/2000/svg";
const W = 640, H = 700;
const pos = a => ({ x: ((a.lo + 69) / 36) * W, y: ((4 - a.la) / 35) * H });

let orig = null, dest = null, res = null, ativo = "barato", ctxAtual = null, animId = 0;

// ---------- Opções de busca (cidade, "todos os aeroportos", aeroporto) ----------
const OPC = [];
const porCidade = {};
AEROPORTOS.forEach(a => (porCidade[a.cidade] ??= []).push(a));
for (const [cid, l] of Object.entries(porCidade)) {
  if (l.length > 1) {
    OPC.push({ label: `${cid} (todos os aeroportos)`, sub: `${l.map(a => a.c).join(" · ")} · ${l[0].uf}`, codigos: l.map(a => a.c), cidade: cid, principal: true,
      busca: norm(`${cid} ${l[0].uf} ${l.map(a => a.c + " " + a.nome).join(" ")}`) });
    l.forEach(a => OPC.push({ label: `${a.nome} (${a.c})`, sub: `${cid}/${a.uf}`, codigos: [a.c], cidade: cid, busca: norm(`${cid} ${a.uf} ${a.c} ${a.nome}`) }));
  } else {
    const a = l[0];
    OPC.push({ label: `${cid} (${a.c})`, sub: `${a.nome} · ${a.uf}`, codigos: [a.c], cidade: cid, principal: true, busca: norm(`${cid} ${a.uf} ${a.c} ${a.nome}`) });
  }
}

function auto(inp, box, aoEscolher) {
  const mostrar = () => {
    const q = norm(inp.value.trim());
    const m = OPC.filter(o => !q || o.busca.includes(q)).slice(0, 7);
    box.innerHTML = m.map(o => `<li data-i="${OPC.indexOf(o)}"><b>${o.label}</b><small>${o.sub}</small></li>`).join("") || '<li class="vazio">Nenhum resultado</li>';
    box.hidden = false;
  };
  const escolher = o => { inp.value = o.label; box.hidden = true; aoEscolher(o); };
  inp.addEventListener("input", () => { aoEscolher(null); mostrar(); });
  inp.addEventListener("focus", mostrar);
  inp.addEventListener("blur", () => setTimeout(() => (box.hidden = true), 120));
  inp.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const q = norm(inp.value.trim()), o = OPC.find(x => x.busca.includes(q));
    if (o) escolher(o);
  });
  box.addEventListener("mousedown", e => {
    const li = e.target.closest("li[data-i]");
    if (li) escolher(OPC[li.dataset.i]);
  });
}
auto($("#orig"), $("#l-orig"), o => { orig = o; if (o) buscar(); });
auto($("#dest"), $("#l-dest"), o => { dest = o; if (o) buscar(); });

// ---------- Rotas prontas ----------
const PRESETS = [
  ["Ponte aérea Rio ⇄ SP", "Rio de Janeiro", "São Paulo"],
  ["São Paulo → Belém", "São Paulo", "Belém"],
  ["Porto Alegre → Rio Branco", "Porto Alegre", "Rio Branco"],
  ["João Pessoa → Manaus", "João Pessoa", "Manaus"],
  ["Florianópolis → Boa Vista", "Florianópolis", "Boa Vista"],
];
PRESETS.forEach(([t, o, d]) => {
  const b = document.createElement("button");
  b.className = "chip"; b.textContent = t;
  b.onclick = () => definir(OPC.find(x => x.cidade === o && x.principal), OPC.find(x => x.cidade === d && x.principal));
  $("#presets").appendChild(b);
});
function definir(o, d) {
  orig = o; dest = d;
  $("#orig").value = o ? o.label : ""; $("#dest").value = d ? d.label : "";
  buscar();
}
$("#troca").onclick = () => definir(dest, orig);
$("#buscar").onclick = buscar;
$("#escalas").onchange = () => orig && dest && buscar();
$("#cias").onchange = () => orig && dest && buscar();

// ---------- Busca ----------
function contexto() {
  const v = $("#escalas").value;
  const cias = new Set([...document.querySelectorAll("#cias input:checked")].map(i => i.value));
  return { lim: v === "" ? Infinity : +v + 1, cias };
}

function buscar() {
  const msg = t => ($("#msg").textContent = t);
  msg("");
  if (!orig || !dest) return msg("Escolha a origem e o destino na lista de sugestões.");
  if (orig.cidade === dest.cidade) return msg("Origem e destino estão na mesma cidade.");
  ctxAtual = contexto();
  if (!ctxAtual.cias.size) return msg("Selecione ao menos uma companhia aérea.");
  res = {};
  for (const k in CRITERIOS) res[k] = melhorRota(k, orig.codigos, dest.codigos, ctxAtual);
  if (!res[ativo]) ativo = Object.keys(res).find(k => res[k]) || "barato";
  renderResultados();
  mostrarRota();
}


function renderResultados() {
  const ids = Object.keys(CRITERIOS).map(k => res[k] && res[k].c.join());
  const html = Object.keys(CRITERIOS).map(k => {
    const r = res[k], nome = CRITERIOS[k].nome;
    if (!r) return `<article class="card" data-k="${k}"><header><span class="tag">${nome}</span></header><p class="vazio-card">Nenhuma rota encontrada com esses filtros.</p></article>`;
    const igual = ids.filter(x => x === r.c.join()).length > 1;
    return `<article class="card ${k === ativo ? "ativo" : ""}" data-k="${k}">
      <header><span class="tag">${nome}</span><span class="esc">${r.esc === 0 ? "Voo direto" : r.esc + (r.esc > 1 ? " escalas" : " escala")}</span></header>
      <div class="cidades">${r.c.map(x => `<b>${x}</b> ${A[x].cidade}`).join(" → ")}</div>
      <div class="nums"><div><small>Preço total</small><b>${brl(r.final)}</b></div><div><small>Duração em voo</small><b>${hm(r.min)}</b></div></div>
      <ul class="trechos">${r.trechos.map(v => `<li>${v.o} → ${v.d}<span>${hm(v.t)} · ${brl(v.p)} · ${v.c}</span></li>`).join("")}</ul>
      ${r.esc ? `<p class="nota">Desconto de conexão: <em>${Math.round(r.desc * 100)}% (−${brl(r.bruto - r.final)})</em></p>` : ""}
      ${igual ? `<p class="nota">Mesma rota de outro critério.</p>` : ""}
    </article>`;
  }).join("");
  const b = res.bfs, c = res.barato;
  let insight = "";
  if (b && c && b.c.join() !== c.c.join())
    insight = `<div class="insight"><b>BFS × Dijkstra:</b> a rota com menos escalas custa ${brl(b.final - c.final)} a mais que a mais barata, que usa ${c.esc} escala(s) — o BFS ignora o peso das arestas.</div>`;
  $("#resultados").innerHTML = `<h2>Comparação dos critérios</h2><div class="cards">${html}</div>${insight}`;
  document.querySelectorAll(".card").forEach(el => (el.onclick = () => {
    if (!res[el.dataset.k]) return;
    ativo = el.dataset.k; animId++;
    document.querySelectorAll(".card").forEach(x => x.classList.toggle("ativo", x === el));
    mostrarRota();
  }));
}

// ---------- Mapa ----------
function el(tag, attrs, pai) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  pai && pai.appendChild(e);
  return e;
}
const grau = {};
VOOS.forEach(v => (grau[v.o] = (grau[v.o] || 0) + 1));
(function desenharMapa() {
  const vistos = new Set();
  VOOS.forEach(v => {
    const k = [v.o, v.d].sort().join();
    if (vistos.has(k)) return;
    vistos.add(k);
    const a = pos(A[v.o]), b = pos(A[v.d]);
    el("line", { class: "aresta", x1: a.x, y1: a.y, x2: b.x, y2: b.y }, $("#gArestas"));
  });
  AEROPORTOS.forEach(a => {
    const p = pos(a), g = el("g", { class: "no", id: "no-" + a.c }, $("#gNos"));
    el("circle", { cx: p.x, cy: p.y, r: 6 + Math.min(grau[a.c] / 4, 6) }, g);
    const t = el("text", { x: p.x, y: p.y - 12, "text-anchor": "middle" }, g);
    t.textContent = a.c;
    g.onclick = () => infoAeroporto(a.c);
  });
})();

function limparMapa() {
  $("#gBusca").innerHTML = ""; $("#gRota").innerHTML = "";
  document.querySelectorAll(".no").forEach(n => n.setAttribute("class", "no"));
}

function mostrarRota() {
  limparMapa();
  const r = res && res[ativo];
  if (!r) return;
  const pts = r.c.map(x => pos(A[x]));
  el("polyline", { class: "rota-linha", points: pts.map(p => `${p.x},${p.y}`).join(" ") }, $("#gRota"));
  r.c.forEach((x, i) => $("#no-" + x).classList.add(i === 0 ? "origem" : i === r.c.length - 1 ? "destino" : "parada"));
  $("#status").textContent = `${CRITERIOS[ativo].nome}: ${r.c.join(" → ")}`;
}

function infoAeroporto(cod) {
  const a = A[cod], vs = [...grafo[cod]].sort((x, y) => x.p - y.p);
  const caixa = $("#info");
  caixa.hidden = false;
  caixa.innerHTML = `<button class="x" onclick="this.parentNode.hidden=true">✕</button>
    <h3>${a.cidade} (${cod})</h3><div class="sub">${a.nome} · ${a.uf} · ${vs.length} destinos diretos</div>
    <div class="acoes"><button id="ai-o">Usar como origem</button><button id="ai-d">Usar como destino</button></div>
    <ul>${vs.map(v => `<li>${v.d} ${A[v.d].cidade}<span>${hm(v.t)} · ${brl(v.p)}</span></li>`).join("")}</ul>`;
  const op = () => OPC.find(o => o.codigos.length === 1 && o.codigos[0] === cod);
  $("#ai-o").onclick = () => definir(op(), dest);
  $("#ai-d").onclick = () => definir(orig, op());
}

// ---------- Animação: ver o algoritmo pensando ----------
$("#anim").onclick = async () => {
  const r = res && res[ativo];
  if (!r) return ($("#status").textContent = "Faça uma busca primeiro.");
  const id = ++animId, log = [];
  CRITERIOS[ativo].run(r.par[0], r.par[1], ctxAtual, log);
  limparMapa();
  for (const s of log) {
    if (id !== animId) return;
    $("#no-" + s.no).classList.add("visit");
    if (s.de) {
      const a = pos(A[s.de]), b = pos(A[s.no]);
      el("line", { class: "trilha", x1: a.x, y1: a.y, x2: b.x, y2: b.y }, $("#gBusca"));
    }
    const custo = s.custo == null ? "" : ativo === "rapido" ? ` · tempo acumulado ${hm(s.custo)}` : ` · custo acumulado ${brl(s.custo)}`;
    $("#status").textContent = `${CRITERIOS[ativo].nome} — visitando ${A[s.no].cidade} (${s.no})${custo}`;
    await sleep(260);
  }
  if (id !== animId) return;
  await sleep(300);
  mostrarRota();
};

definir(OPC.find(o => o.cidade === "São Paulo" && o.principal), OPC.find(o => o.cidade === "Belém" && o.principal));
