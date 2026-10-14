// ===== Lógica do grafo (mesmos algoritmos do código Python) =====
const A = {};
AEROPORTOS.forEach(a => (A[a.c] = a));
const grafo = {}; // lista de adjacência: grafo[origem] = [voos]
AEROPORTOS.forEach(a => (grafo[a.c] = []));
VOOS.forEach(v => grafo[v.o].push(v));

function reconstruir(pred, o, d) {
  const c = [d];
  while (c[0] !== o) c.unshift(pred[c[0]]);
  return c;
}

// BFS: menor número de arestas (escalas). "lim" = máximo de voos permitidos.
function bfs(o, d, lim, cias, log) {
  const fila = [[o, 0]], vis = new Set([o]), pred = {};
  while (fila.length) {
    const [u, k] = fila.shift();
    log && log.push({ no: u, de: pred[u] });
    if (k >= lim) continue;
    for (const v of grafo[u]) {
      if (!cias.has(v.c) || vis.has(v.d)) continue;
      vis.add(v.d);
      pred[v.d] = u;
      if (v.d === d) { log && log.push({ no: d, de: u }); return reconstruir(pred, o, d); }
      fila.push([v.d, k + 1]);
    }
  }
  return null;
}

// Dijkstra: menor custo acumulado (peso = função do voo). Estado = (aeroporto, voos usados)
// para respeitar o limite de escalas. Usamos sort() no lugar do heap, por simplicidade.
function dijkstra(o, d, peso, lim, cias, log) {
  const L = isFinite(lim) ? lim : 0;
  const key = (n, k) => n + "|" + k;
  const dist = { [key(o, 0)]: 0 }, pred = {}, feito = new Set();
  const fila = [[0, o, 0]];
  while (fila.length) {
    fila.sort((a, b) => a[0] - b[0]);
    const [dc, u, k] = fila.shift(), ku = key(u, k);
    if (feito.has(ku)) continue;
    feito.add(ku);
    log && log.push({ no: u, de: pred[ku] ? pred[ku].split("|")[0] : undefined, custo: dc });
    if (u === d) {
      const c = [];
      for (let s = ku; s; s = pred[s]) c.unshift(s.split("|")[0]);
      return c;
    }
    if (L && k >= L) continue;
    for (const v of grafo[u]) {
      if (!cias.has(v.c)) continue;
      const nk = L ? k + 1 : 0, kv = key(v.d, nk), nd = dc + peso(v);
      if (nd < (dist[kv] ?? Infinity)) { dist[kv] = nd; pred[kv] = ku; fila.push([nd, v.d, nk]); }
    }
  }
  return null;
}

// Soma duração/preço do caminho e aplica a regra de desconto por escala (5% cada, teto 15%)
function detalhar(c) {
  const trechos = [];
  let min = 0, bruto = 0;
  for (let i = 0; i < c.length - 1; i++) {
    const v = grafo[c[i]].find(x => x.d === c[i + 1]);
    trechos.push(v); min += v.t; bruto += v.p;
  }
  const esc = c.length - 2, desc = Math.min(esc * 0.05, 0.15);
  return { c, trechos, esc, min, bruto, desc, final: bruto * (1 - desc) };
}

const CRITERIOS = {
  bfs:    { nome: "Menos escalas", run: (o, d, x, log) => bfs(o, d, x.lim, x.cias, log),                    score: r => r.esc * 1e6 + r.min },
  rapido: { nome: "Mais rápido",   run: (o, d, x, log) => dijkstra(o, d, v => v.t, x.lim, x.cias, log),     score: r => r.min },
  barato: { nome: "Mais barato",   run: (o, d, x, log) => dijkstra(o, d, v => v.p, x.lim, x.cias, log),     score: r => r.final },
};

// Testa todas as combinações origem x destino (cidade com vários aeroportos) e devolve a melhor
function melhorRota(chave, origens, destinos, ctx) {
  const cr = CRITERIOS[chave];
  let melhor = null;
  for (const o of origens) for (const d of destinos) {
    if (o === d) continue;
    const c = cr.run(o, d, ctx);
    if (!c) continue;
    const r = detalhar(c);
    if (!melhor || cr.score(r) < cr.score(melhor)) melhor = { ...r, par: [o, d] };
  }
  return melhor;
}
