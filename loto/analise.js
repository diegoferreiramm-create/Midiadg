/* ============================================================
   LOTOFÁCIL — ANÁLISE EM JAVASCRIPT PURO v2
   ============================================================ */

const ID_PLANILHA = "1BSH8N7qhWI_4GS5O5iIH81DCfIcdknhV0LTPDEeX3yQ";
const SHEET_NAME = "Sorteios";

const FIBONACCI_DEZENAS = [1, 2, 3, 5, 8, 13, 21];
const FIBONACCI_CICLO = [1, 2, 3, 5, 8, 13, 21];

function parseCSV(text) {
    const rows = [];
    let cur = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += c;
        } else {
            if (c === '"') inQuotes = true;
            else if (c === ",") { cur.push(field); field = ""; }
            else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
            else if (c === "\r") { }
            else field += c;
        }
    }
    if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
    return rows.filter(r => r.some(v => v && v.trim() !== ""));
}

async function carregarDados() {
    const url = `https://docs.google.com/spreadsheets/d/${ID_PLANILHA}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} — verifique se a planilha é pública`);
    const csvText = await response.text();
    return processarCSV(csvText);
}

function processarCSV(csv) {
    const linhas = parseCSV(csv);
    if (linhas.length < 2) throw new Error("CSV vazio ou inválido.");

    const cabecalho = linhas[0].map(c => String(c).trim());
    const dados = linhas.slice(1).map(r => {
        const linha = [];
        for (let i = 0; i < cabecalho.length; i++) linha.push(r[i] !== undefined ? r[i] : "");
        return linha;
    });

    const numCols = [];
    for (let i = 0; i < cabecalho.length; i++) {
        const nome = cabecalho[i].toLowerCase();
        if (nome.includes("concurso") || nome.includes("data")) continue;
        let validos = 0, total = 0;
        for (let r = 0; r < Math.min(dados.length, 30); r++) {
            const v = parseInt(dados[r][i]);
            if (!isNaN(v) && v >= 1 && v <= 25) validos++;
            total++;
        }
        if (total > 0 && validos / total > 0.8) numCols.push(i);
    }
    if (numCols.length < 15) throw new Error(`Apenas ${numCols.length} colunas de dezenas detectadas. Esperado 15.`);

    let idxConcurso = cabecalho.findIndex(c => c.toLowerCase() === "concurso");
    if (idxConcurso === -1) idxConcurso = 0;

    let idxData = cabecalho.findIndex(c =>
        ["data", "data sorteio", "data do sorteio", "dt", "date"].includes(c.toLowerCase())
    );

    const df = [];
    for (const row of dados) {
        const concurso = parseInt(row[idxConcurso]);
        if (isNaN(concurso)) continue;
        const dezenas = [];
        for (const idx of numCols.slice(0, 15)) {
            const v = parseInt(row[idx]);
            if (!isNaN(v) && v >= 1 && v <= 25) dezenas.push(v);
        }
        if (dezenas.length !== 15) continue;

        const item = { concurso, dezenas: dezenas.sort((a, b) => a - b) };
        if (idxData !== -1 && row[idxData] && String(row[idxData]).trim()) {
            item.data = String(row[idxData]).trim();
        }
        df.push(item);
    }

    df.sort((a, b) => b.concurso - a.concurso);
    return df;
}

function analisarAtrasosHistoricos(dfCompleto) {
    const resultado = [];

    for (let dez = 1; dez <= 25; dez++) {
        const atrasos = [];
        let atrasoAtual = 0;
        let emAtraso = true;

        for (let i = 0; i < dfCompleto.length; i++) {
            if (dfCompleto[i].dezenas.includes(dez)) {
                if (emAtraso && atrasoAtual > 0) atrasos.push(atrasoAtual);
                atrasoAtual = 0;
                emAtraso = false;
            } else if (emAtraso) {
                atrasoAtual++;
            }
        }

        const atrasoMax = atrasos.length > 0 ? Math.max(...atrasos) : 0;
        const atrasoMedio = atrasos.length > 0
            ? Math.round((atrasos.reduce((s, x) => s + x, 0) / atrasos.length) * 10) / 10
            : 0;

        let atrasoAtualReal = 0;
        for (const c of dfCompleto) {
            if (c.dezenas.includes(dez)) break;
            atrasoAtualReal++;
        }

        const pctMax = atrasoMax > 0 ? Math.round((atrasoAtualReal / atrasoMax) * 100) : 0;

        let status;
        if (pctMax >= 90) status = "🔴 No limite";
        else if (pctMax >= 70) status = "🟠 Bem atrasada";
        else if (pctMax >= 50) status = "🟡 Acima da média";
        else if (pctMax >= 25) status = "🟢 Normal";
        else status = "🟢 Recente";

        resultado.push({
            dezena: dez,
            atraso_atual: atrasoAtualReal,
            atraso_max: atrasoMax,
            atraso_medio: atrasoMedio,
            pct_max: pctMax,
            status
        });
    }

    return resultado;
}

function analisarPares(dfJanela) {
    const contagem = {};
    const ultimaVez = {};

    for (let i = 0; i < dfJanela.length; i++) {
        const c = dfJanela[i];
        const dezenas = c.dezenas;
        for (let a = 0; a < dezenas.length; a++) {
            for (let b = a + 1; b < dezenas.length; b++) {
                const chave = `${dezenas[a]}-${dezenas[b]}`;
                contagem[chave] = (contagem[chave] || 0) + 1;
                if (!(chave in ultimaVez)) ultimaVez[chave] = i;
            }
        }
    }

    const lista = Object.entries(contagem).map(([chave, qtd]) => {
        const [a, b] = chave.split("-").map(Number);
        return { a, b, qtd, ultimaVez: ultimaVez[chave] };
    });

    const frequentes = [...lista].sort((x, y) => y.qtd - x.qtd).slice(0, 10);

    const ultimas10 = dfJanela.slice(0, 10);
    const recentes = new Set();
    for (const c of ultimas10) {
        for (let a = 0; a < c.dezenas.length; a++) {
            for (let b = a + 1; b < c.dezenas.length; b++) {
                recentes.add(`${c.dezenas[a]}-${c.dezenas[b]}`);
            }
        }
    }

    const orfaos = lista
        .filter(p => p.qtd >= 4 && !recentes.has(`${p.a}-${p.b}`))
        .sort((x, y) => y.qtd - x.qtd)
        .slice(0, 10);

    return { frequentes, orfaos };
}

function analisarLinhasColunas(dfJanela) {
    const linhas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const colunas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const c of dfJanela) {
        for (const d of c.dezenas) {
            const linha = Math.ceil(d / 5);
            const coluna = ((d - 1) % 5) + 1;
            linhas[linha]++;
            colunas[coluna]++;
        }
    }
    return { linhas, colunas };
}

function analisarHeatmap(dfJanela) {
    const matriz = [];
    for (let linha = 1; linha <= 5; linha++) {
        const row = [];
        for (let col = 1; col <= 5; col++) {
            const dez = (linha - 1) * 5 + col;
            let freq = 0;
            for (const c of dfJanela) if (c.dezenas.includes(dez)) freq++;
            row.push({ dezena: dez, frequencia: freq });
        }
        matriz.push(row);
    }
    return matriz;
}

function analisarSoma(dfJanela) {
    const ultimos30 = dfJanela.slice(0, 30).reverse();
    return ultimos30.map(c => ({
        concurso: c.concurso,
        soma: c.dezenas.reduce((s, n) => s + n, 0)
    }));
}

function analisarJanela(dfJanela, rotulo, dfCompleto) {
    const n = dfJanela.length;

    const contagem = new Array(26).fill(0);
    for (const c of dfJanela) for (const d of c.dezenas) contagem[d]++;

    const freqLista = [];
    for (let i = 1; i <= 25; i++) {
        freqLista.push({
            dezena: i,
            frequencia: contagem[i],
            percentual: Math.round((contagem[i] / Math.max(n, 1)) * 100 * 100) / 100
        });
    }
    freqLista.sort((a, b) => b.frequencia - a.frequencia || a.dezena - b.dezena);

    const grupoA = freqLista.slice(0, 9).map(x => x.dezena);
    const grupoC = freqLista.slice(9, 18).map(x => x.dezena);
    const grupoB = freqLista.slice(18, 25).map(x => x.dezena);

    let paresTotal = 0;
    const faixas = { "01-05": 0, "06-10": 0, "11-15": 0, "16-20": 0, "21-25": 0 };
    const paresFaixas = { "01-05": 0, "06-10": 0, "11-15": 0, "16-20": 0, "21-25": 0 };
    let somaTotal = 0;
    for (const c of dfJanela) {
        for (const d of c.dezenas) {
            const isPar = d % 2 === 0;
            if (isPar) paresTotal++;
            let fx;
            if (d <= 5) fx = "01-05";
            else if (d <= 10) fx = "06-10";
            else if (d <= 15) fx = "11-15";
            else if (d <= 20) fx = "16-20";
            else fx = "21-25";
            faixas[fx]++;
            if (isPar) paresFaixas[fx]++;
            somaTotal += d;
        }
    }

    const mediaPares = Math.round((paresTotal / Math.max(n, 1)) * 100) / 100;
    const mediaImpares = Math.round((15 - mediaPares) * 100) / 100;
    const somaMedia = Math.round((somaTotal / Math.max(n, 1)) * 100) / 100;

    const reps = [];
    for (let i = 0; i < dfJanela.length - 1; i++) {
        const a = new Set(dfJanela[i].dezenas);
        const b = new Set(dfJanela[i + 1].dezenas);
        let inter = 0;
        for (const d of a) if (b.has(d)) inter++;
        reps.push(inter);
    }
    const mediaRepetidas = reps.length > 0
        ? Math.round((reps.reduce((s, x) => s + x, 0) / reps.length) * 100) / 100
        : 0;

    const sequencias = [];
    for (let dez = 1; dez <= 25; dez++) {
        let streak = 0;
        for (const c of dfJanela) {
            if (c.dezenas.includes(dez)) streak++;
            else break;
        }
        if (streak >= 2) sequencias.push({ dezena: dez, streak });
    }
    sequencias.sort((a, b) => b.streak - a.streak || a.dezena - b.dezena);
    const sequenciasMax = sequencias.length > 0 ? Math.max(...sequencias.map(s => s.streak)) : 0;

    const atrasos = [];
    for (let dez = 1; dez <= 25; dez++) {
        let atraso = 0;
        for (const c of dfJanela) {
            if (c.dezenas.includes(dez)) break;
            atraso++;
        }
        atrasos.push({ dezena: dez, atraso });
    }
    atrasos.sort((a, b) => b.atraso - a.atraso || a.dezena - b.dezena);

    const ultimos10 = dfJanela.slice(0, 10).map(c => ({
        concurso: c.concurso,
        dezenas: c.dezenas,
        data: c.data || null
    }));

    const fibonacci = analisarFibonacci(dfJanela);
    const heatmap = analisarHeatmap(dfJanela);
    const linhasColunas = analisarLinhasColunas(dfJanela);
    const somaSerie = analisarSoma(dfJanela);

    return {
        rotulo,
        n_concursos: n,
        frequencias: freqLista,
        grupo_a: grupoA,
        grupo_b: grupoB,
        grupo_c: grupoC,
        media_pares: mediaPares,
        media_impares: mediaImpares,
        media_repetidas: mediaRepetidas,
        faixas,
        pares_faixas: paresFaixas,
        dezena_mais_quente: freqLista[0].dezena,
        dezena_mais_fria: freqLista[freqLista.length - 1].dezena,
        sequencias,
        sequencias_max: sequenciasMax,
        atrasos,
        ultimos_10: ultimos10,
        soma_media: somaMedia,
        fibonacci,
        heatmap,
        linhas_colunas: linhasColunas,
        soma_serie: somaSerie
    };
}

function analisarFibonacci(dfJanela) {
    const resultados = [];
    for (const dez of FIBONACCI_DEZENAS) {
        let atraso = 0;
        let apareceu = false;
        for (const c of dfJanela) {
            if (c.dezenas.includes(dez)) { apareceu = true; break; }
            atraso++;
        }

        let status, cor, emoji;
        if (!apareceu) { status = "Ausente na janela"; cor = "cinza"; emoji = "⚫"; }
        else if (atraso <= 2) { status = "Ativo"; cor = "verde"; emoji = "🟢"; }
        else if ([3, 5, 8].includes(atraso)) { status = "No ciclo"; cor = "verde"; emoji = "🟢"; }
        else if (atraso < 13) { status = "Quase saindo"; cor = "amarelo"; emoji = "🟡"; }
        else if (atraso < 21) { status = "Atrasada"; cor = "laranja"; emoji = "🟠"; }
        else { status = "Muito atrasada"; cor = "vermelho"; emoji = "🔴"; }

        resultados.push({ dezena: dez, atraso, status, cor, emoji, apareceu });
    }
    resultados.sort((a, b) => b.atraso - a.atraso || a.dezena - b.dezena);

    const resumo = {
        ativas: resultados.filter(r => r.status === "Ativo").length,
        no_ciclo: resultados.filter(r => r.status === "No ciclo").length,
        quase_saindo: resultados.filter(r => r.status === "Quase saindo").length,
        atrasadas: resultados.filter(r => ["Atrasada", "Muito atrasada"].includes(r.status)).length
    };

    return {
        dezenas: resultados,
        resumo,
        lista_fibonacci: FIBONACCI_DEZENAS,
        ciclo: FIBONACCI_CICLO
    };
}

function analisarTudo(df, qtdUltimos) {
    const total = df.length;
    const ultimoConcurso = df[0].concurso;

    const janelas = {
        geral: df.slice(),
        ultimos_30: df.slice(0, 30),
        ultimos_20: df.slice(0, 20),
        ultimos_10: df.slice(0, 10)
    };

    const rotulos = {
        geral: `Geral (${total} concursos)`,
        ultimos_30: "Últimos 30",
        ultimos_20: "Últimos 20",
        ultimos_10: "Últimos 10"
    };

    const analises = {};
    for (const chave of Object.keys(janelas)) {
        analises[chave] = analisarJanela(janelas[chave], rotulos[chave], df);
    }

    analises.geral.pares = analisarPares(df.slice(0, 30));
    analises.ultimos_30.pares = analises.geral.pares;

    const atrasosHistoricos = analisarAtrasosHistoricos(df);

    const historico = df.map(c => {
        const item = { c: c.concurso, d: c.dezenas };
        if (c.data) item.dt = c.data;
        return item;
    });

    const qtd = Math.max(1, Math.min(qtdUltimos || 10, df.length));
    const ultimosConcursos = df.slice(0, qtd).map(c => ({
        concurso: c.concurso,
        dezenas: c.dezenas,
        data: c.data || null
    }));

    return {
        total_concursos: total,
        ultimo_concurso: ultimoConcurso,
        analises,
        atrasos_historicos: atrasosHistoricos,
        historico_conferencia: historico,
        ultimos_concursos: ultimosConcursos
    };
}

window.LotofacilAPI = {
    carregarDados,
    analisarTudo,
    FIBONACCI_DEZENAS,
    FIBONACCI_CICLO
};
