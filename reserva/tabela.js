let dadosOriginais = [];
let dadosFiltrados = [];
let paginaAtual = 1;
let itensPorPagina = 50;

// Tabela e Filtros
function filtrarTabelaAvancado(valorForcado) {
  const sessao = sessionStorage.getItem("usuario");
  if (!sessao) return;

  const user = JSON.parse(sessao);
  const isAdmin = (user.parceiro.toString() === "97");

  const fCpf = document.getElementById("fCpf")?.value.trim() || "";
  const fNome = document.getElementById("fNome")?.value.toUpperCase() || "";
  const fStatus = document.getElementById("fStatus")?.value.trim() || "";
  const fSituacao = document.getElementById("fSituacao")?.value.toUpperCase() || "";
  const fPrazo = document.getElementById("fPrazo")?.value.toUpperCase() || "";
  const fProcessoArce = document.getElementById("fProcessoArce")?.value.toUpperCase() || "";

  let fLote = valorForcado || document.getElementById("fLote")?.value.toUpperCase() || "";

  const fParc = isAdmin ? (document.getElementById("fParceiro")?.value.toUpperCase() || "") : "";
  const fAtend = isAdmin ? (document.getElementById("fAtend")?.value.toUpperCase() || "") : "";
  const fVia = isAdmin ? (document.getElementById("fVia")?.value.toUpperCase() || "") : "";

  // 🔥 FILTRO GLOBAL (não mais no HTML)
  dadosFiltrados = dadosOriginais.filter(item => {

    // CPF
    if (fCpf && !(item.cpf || "").replace(/\D/g, "").includes(fCpf)) return false;

    // NOME
    if (fNome && !(item.nome || "").toUpperCase().includes(fNome)) return false;

    // STATUS
    if (fStatus && (item.status || "") !== fStatus) return false;

    // SITUAÇÃO
    if (fSituacao && !(item.situacao || "").toUpperCase().includes(fSituacao)) return false;

    // PRAZO
    if (fPrazo && !(item.prazoPendencia || "").toUpperCase().includes(fPrazo)) return false;

    // ARCE
    if (fProcessoArce && !(item.numeroArce || "").toUpperCase().includes(fProcessoArce)) return false;

    // LOTE
    if (fLote && (item.lote || "").toUpperCase() !== fLote) return false;

    // 🔥 REGRA ADMIN (97)
    if (isAdmin) {
      if (fVia && !(item.via || "").toUpperCase().includes(fVia)) return false;
      if (fParc && !(item.parceiro || "").toUpperCase().includes(fParc)) return false;
      if (fAtend && !(item.atendente || "").toUpperCase().includes(fAtend)) return false;
    }

    return true;
  });

  // 🔥 reset pagina
  paginaAtual = 1;

  // 🔥 renderiza
  renderizarTabela();
}

function carregarLista() {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  const isAdmin = (user.parceiro.toString() === "97");
  
  const fAdmin = document.getElementById("filtrosAdmin");
  if(fAdmin) {
    fAdmin.style.display = "flex";
    fAdmin.style.flexDirection = "row";
    fAdmin.style.flexWrap = "wrap";
    fAdmin.style.gap = "8px";
    fAdmin.style.alignItems = "center";
    fAdmin.style.justifyContent = "flex-start";
    fAdmin.style.padding = "12px";
    fAdmin.style.background = "#0f172a";
    fAdmin.style.borderRadius = "8px";
    fAdmin.style.marginBottom = "10px";

    const inputsFiltro = fAdmin.querySelectorAll("input, select, button");
    inputsFiltro.forEach(el => {
       if(el.id === "fCpf") {
         el.style.width = "120px";
       } else if(el.id === "fNome") {
         el.style.width = "200px";
       } else if(el.id === "fStatus") {
         el.style.width = "250px";
       } else if(el.id === "fLote") {
         el.style.width = "70px";
       } else if(el.id === "fPrazo") {
         el.style.width = "70px";
       } else if(el.id === "fSituacao") {
         el.style.width = "100px";
       } else if(el.id === "fProcessoArce") {
         el.style.width = "100px";
       } else if(el.id === "fParceiro") {
         el.style.width = "120px";
       } else if(el.id === "fAtend") {
         el.style.width = "130px";
       } else if(el.id === "fVia") {
         el.style.width = "80px";
       } else if(el.id === "btnVerAbertos") {
         el.style.width = "auto";
       } else {
         el.style.width = "auto";
       }
       
       el.style.padding = "6px 10px";
       el.style.fontSize = "12px";
       el.style.border = "1px solid #334155";
       el.style.borderRadius = "4px";
       el.style.background = "#1e293b";
       el.style.color = "white";
       el.style.height = "36px";
       el.style.boxSizing = "border-box";
    });
    
    const btnVerAbertos = document.getElementById("btnVerAbertos");
    if(btnVerAbertos) {
      btnVerAbertos.style.background = "#3b82f6";
      btnVerAbertos.style.border = "none";
      btnVerAbertos.style.cursor = "pointer";
    }
  }
  
  const cabecalho = document.getElementById("cabecalhoTabela");
  const colNames = ["ID", "CPF", "NOME", "NASC", "MUNICIPIO", "TEL", "VIA", "PARCEIRO", "DATA", "ATENDENTE", "BOLETO", "STATUS", "MOTIVO", "DATA STATUS", "NUM CARTEIRA", "LOTE", "SITUAÇÃO", "PRAZO", "Nº ARCE", "AÇÕES"];
  
  cabecalho.innerHTML = colNames.map((name, idx) => `<th class="col-${idx}">${name}</th>`).join("");

  if(!document.getElementById("containerChecks")){
    // DEFINA AQUI AS COLUNAS QUE DEVEM COMEÇAR DESMARCADAS
    // Coloque o índice das colunas que você NÃO quer que apareçam inicialmente
    const colunasDesmarcadas = [
      // 3,   // NASC
      // 4,   // MUNICIPIO
      // 5,   // TEL
      // 6,   // VIA
      // 7,   // PARCEIRO
      // 8,   // DATA
      // 9,   // ATENDENTE
      // 10,  // BOLETO
      // 15,  // LOTE
      // 17,  // PRAZO
      11,   // STATUS - desmarcado
      12,   // MOTIVO - desmarcado
      13,   // DATA STATUS - desmarcado
      14,   // NUM CARTEIRA - desmarcado
      16,  // SITUAÇÃO - desmarcado
      18,   // Nº ARCE - desmarcado
      19    // AÇÕES - desmarcado
    ];
    
    const divChecks = document.createElement("div");
    divChecks.id = "containerChecks";
    divChecks.style = "display:flex; flex-wrap:wrap; gap:10px; padding:10px; background:#1e293b; border-radius:8px; margin-bottom:10px; font-size:11px; color:#22c55e; border:1px solid #334155;";
    divChecks.innerHTML = "<div style='width:100%; color:white; font-weight:bold; margin-bottom:5px;'>Exibir/Ocultar Colunas:</div>";
    
    colNames.forEach((name, idx) => {
      // Se o índice estiver na lista de desmarcadas, NÃO coloca "checked"
      const isChecked = !colunasDesmarcadas.includes(idx) ? "checked" : "";
      divChecks.innerHTML += `<label style="cursor:pointer;"><input type="checkbox" ${isChecked} onclick="alternarColuna(${idx})"> ${name}</label>`;
    });
    
    document.getElementById("listasBox").prepend(divChecks);
  }

  document.getElementById("corpoTabelaListas").innerHTML = "<tr><td colspan='20'>Carregando dados...</td></tr>";

  fetch(`${urlSistema}?action=obterListaCadastros&parceiro=${user.parceiro}`)
    .then(res => res.json())
    .then(dados => {
      dadosOriginais = dados;
      
      // 🔥 PREENCHE O CAMPO ATENDENTE COM O NOME DO USUÁRIO (mas não filtra)
      const campoAtendente = document.getElementById("fAtend");
      if (campoAtendente) {
        campoAtendente.value = user.nome;
      }
      
      // Mostra todos os dados inicialmente (sem filtro)
      dadosFiltrados = dados;
      
      paginaAtual = 1;
      renderizarTabela();
    })
  .catch(err => {
    console.error("Erro:", err);
    document.getElementById("corpoTabelaListas").innerHTML =
      "<tr><td colspan='20' style='color:red;'>Erro ao carregar lista do servidor.</td></tr>";
  });

  // Configurar seletor de itens por página
  const selectItens = document.getElementById("selectItensPorPagina");
  if (selectItens) {
    selectItens.value = itensPorPagina.toString();
    selectItens.onchange = function() {
      itensPorPagina = parseInt(this.value);
      paginaAtual = 1;
      renderizarTabela();
    };
  }
}

function renderizarTabela() {
  const tbody = document.getElementById("corpoTabelaListas");
  
  let pagina = [];
  
  if (itensPorPagina === -1) {
    // Mostra todos os registros
    pagina = dadosFiltrados;
  } else {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    pagina = dadosFiltrados.slice(inicio, fim);
  }
  
  let html = "";
  
  pagina.forEach(item => {
    const telefone = item.tel || '';
    
    html += `<tr>
      <td class="col-0">${item.id || ''}</td>
      <td class="col-1">${item.cpf || ''}</td>
      <td class="col-2">${item.nome || ''}</td>
      <td class="col-3">${item.nasc || ''}</td>
      <td class="col-4">${item.municipio || ''}</td>
      <td class="col-5">${telefone}</td>
      <td class="col-6">${item.via || ''}</td>
      <td class="col-7">${item.parceiro || ''}</td>
      <td class="col-8">${item.data || ''}</td>
      <td class="col-9">${item.atendente || ''}</td>
      <td class="col-10">${item.boleto || ''}</td>
      <td class="col-11"><b>${item.status || ''}</b></td>
      <td class="col-12">${item.motivo || ''}</td>
      <td class="col-13">${item.dataStatus || ''}</td>
      <td class="col-14">${item.carteira || ''}</td>
      <td class="col-15">${item.lote || ''}</td>
      <td class="col-16">${item.situacao || ''}</td>
      <td class="col-17">${item.prazoPendencia || ''}</td>
      <td class="col-18">${item.numeroArce || ''}</td>
      <td class="col-19">
        <button onclick='prepararEdicao(${JSON.stringify(item).replace(/'/g, "\\'")})'
          style="background:#f59e0b; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">
          Editar
        </button>
      </td>
    </tr>`;
  });
  
  tbody.innerHTML = html;
  
  // Aplica colunas ocultas
  const checks = document.getElementById("containerChecks").querySelectorAll("input");
  checks.forEach((chk, i) => { 
    if(!chk.checked) aplicarOcultacao(i, false); 
  });
  
  // Atualiza contadores
  const elNumLinhas = document.getElementById("numLinhas");
  if (elNumLinhas) elNumLinhas.innerText = dadosFiltrados.length;
  
  atualizarInfoPagina();
  
  // Atualiza o texto da opção "TODOS" com o total
  const select = document.getElementById("selectItensPorPagina");
  if (select) {
    const optionTodos = select.querySelector('option[value="-1"]');
    if (optionTodos) {
      optionTodos.text = `TODOS (${dadosFiltrados.length})`;
    }
  }
}

function proximaPagina() {
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    renderizarTabela();
    atualizarInfoPagina();
  }

}

function paginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    renderizarTabela();
    atualizarInfoPagina();
  }
}

function atualizarInfoPagina() {
  if (itensPorPagina === -1) {
    const el = document.getElementById("infoPagina");
    if (el) el.innerText = `Mostrando todos os ${dadosFiltrados.length} registros`;
    return;
  }
  
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const el = document.getElementById("infoPagina");
  if (el) {
    el.innerText = `Página ${paginaAtual} de ${totalPaginas || 1}`;
  }
}

function imprimirLista() {
  const conteudo = document.getElementById('areaImpressao').innerHTML;
  const telaPrint = window.open('', '_blank');
  telaPrint.document.write(`
    <html>
    <head>
      <title>Relatório</title>
      <style>
        @page { size: landscape; margin: 0.5cm; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 2px; font-size: 8px; }
        [style*="display: none"] { display: none !important; }
        th:last-child, td:last-child { display: none !important; }
      </style>
    </head>
    <body>
      ${conteudo}
      <script>window.onload = function() { window.print(); window.close(); };<\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}

function carregarDadosLog() {
  const tbody = document.getElementById("corpoLogs");
  if(!tbody) return;
  tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>Carregando Logs da Planilha...</td></tr>";
  fetch(`${urlSistema}?action=buscarLogsDaAbaLog`)
    .then(res => res.json())
    .then(dados => {
      tbody.innerHTML = "";
      if (!dados || dados.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>Aba LOG está vazia.</td></tr>";
        return;
      }
      dados.forEach(l => {
        tbody.innerHTML += `
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding:10px;">${l.data}</td>
            <td style="padding:10px;">${l.usuario}</td>
            <td style="padding:10px; color:#fbbf24;">${l.parceiro || '-'}</td>
            <td style="padding:10px;">${l.acao}</td>
            <td style="padding:10px; color:#22c55e;">${l.idRef}</td>
          </tr>`;
      });
    })
    .catch(err => {
      console.error("Erro ao carregar logs:", err);
      tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red;'>Erro ao conectar com o servidor.</td></tr>";
    });
}


function gerarChecksColunas() {
  // evita duplicar
  if (document.getElementById("containerChecks")) return;

  const colNames = ["ID", "CPF", "NOME", "NASC", "MUNICIPIO", "TEL", "VIA", "PARCEIRO", "DATA", "ATENDENTE", "BOLETO", "STATUS", "MOTIVO", "DATA STATUS", "NUM CARTEIRA", "LOTE", "SITUAÇÃO", "PRAZO", "Nº ARCE", "AÇÕES"];

  const colunasDesmarcadas = [11,12,13,14,16,18,19];

  const divChecks = document.createElement("div");
  divChecks.id = "containerChecks";
  divChecks.style = "display:flex; flex-wrap:wrap; gap:10px; padding:10px; background:#1e293b; border-radius:8px; margin-bottom:10px; font-size:11px; color:#22c55e; border:1px solid #334155;";

  divChecks.innerHTML = "<div style='width:100%; color:white; font-weight:bold;'>Exibir/Ocultar Colunas:</div>";

  colNames.forEach((name, idx) => {
    const checked = !colunasDesmarcadas.includes(idx) ? "checked" : "";
    divChecks.innerHTML += `
      <label>
        <input type="checkbox" ${checked} onclick="alternarColuna(${idx})">
        ${name}
      </label>
    `;
  });

  document.getElementById("listasBox").prepend(divChecks);
}

function alternarColuna(idx) { 
  aplicarOcultacao(idx, event.target.checked); 
}

function aplicarOcultacao(idx, exibir) {
  document.querySelectorAll(`.col-${idx}`).forEach(c => {
    c.style.display = exibir ? "" : "none";
  });
}

function mudarItensPorPagina() {
  const select = document.getElementById("selectItensPorPagina");
  itensPorPagina = parseInt(select.value);
  paginaAtual = 1;
  renderizarTabela();
}
