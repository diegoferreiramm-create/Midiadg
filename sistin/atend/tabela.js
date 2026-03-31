// Tabela e Filtros
function gerarChecksColunas() {
  const container = document.getElementById("containerChecks");
  if (!container) return;
  container.innerHTML = ""; 

  colunasDef.forEach((col) => {
    const label = document.createElement("label");
    label.style.cssText = "margin-right:10px; display:inline-flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; white-space:nowrap;";
    const marcado = colunasParaMarcar.includes(col.label) ? "checked" : "";
    label.innerHTML = `<input type="checkbox" ${marcado} onchange="filtrarTabelaAvancado()" data-idx="${col.idx}"> ${col.label}`;
    container.appendChild(label);
  });
  setTimeout(filtrarTabelaAvancado, 200);
}

function filtrarTabelaAvancado(valorForcado) {
  const sessao = sessionStorage.getItem("usuario");
  if (!sessao) return;
  const user = JSON.parse(sessao);
  const isAdmin = (user.parceiro.toString() === "97");

  const fCpf = document.getElementById("fCpf") ? document.getElementById("fCpf").value.trim() : "";
  const fNome = document.getElementById("fNome").value.toUpperCase();
  const fStatus = document.getElementById("fStatus").value.trim();
  
  const fSituacao = document.getElementById("fSituacao") ? document.getElementById("fSituacao").value.trim().toUpperCase() : "";
  const fPrazo = document.getElementById("fPrazo") ? document.getElementById("fPrazo").value.trim().toUpperCase() : "";
  const fProcessoArce = document.getElementById("fProcessoArce") ? document.getElementById("fProcessoArce").value.trim().toUpperCase() : "";
  
  let fLote = "";
  if (valorForcado) {
    fLote = valorForcado;
  } else {
    fLote = document.getElementById("fLote") ? document.getElementById("fLote").value.trim().toUpperCase() : "";
  }
 
  const fParc = isAdmin ? document.getElementById("fParceiro").value.toUpperCase() : "";
  const fAtend = isAdmin ? document.getElementById("fAtend").value.toUpperCase() : "";
  const fVia = (isAdmin && document.getElementById("fVia")) ? document.getElementById("fVia").value.toUpperCase() : "";

  const tabela = document.getElementById("tabelaListas");
  const tr = tabela.getElementsByTagName("tr");
  let contadorVisiveis = 0;

  for (let i = 1; i < tr.length; i++) {
    const td = tr[i].getElementsByTagName("td");
    if (!td[0]) continue;
    let mostrar = true;

    // CPF
    if (fCpf !== "" && td[1]) {
      const cpfLimpoTabela = td[1].innerText.replace(/\D/g, "");
      if (cpfLimpoTabela.indexOf(fCpf) === -1) mostrar = false;
    }
    // NOME
    if (fNome !== "" && td[2] && td[2].innerText.toUpperCase().indexOf(fNome) === -1) mostrar = false;
    // STATUS
    if (fStatus !== "" && td[11] && td[11].innerText.trim() !== fStatus) mostrar = false;
    // SITUAÇÃO
    if (fSituacao !== "" && td[16]) {
      const valorTabela = td[16].innerText.trim().toUpperCase();
      if (valorTabela.indexOf(fSituacao) === -1) mostrar = false;
    }
    // PRAZO
    if (fPrazo !== "" && td[17]) {
      const valorTabela = td[17].innerText.trim().toUpperCase();
      if (valorTabela.indexOf(fPrazo) === -1) mostrar = false;
    }
    // Nº ARCE
    if (fProcessoArce !== "" && td[18]) {
      const valorTabela = td[18].innerText.trim().toUpperCase();
      if (valorTabela.indexOf(fProcessoArce) === -1) mostrar = false;
    }
    // LOTE
    if (fLote !== "") {
        let txtLote = td[15] ? td[15].innerText.trim().toUpperCase() : "";
        if (txtLote !== fLote) mostrar = false;
    }
    // ADMIN
    if (isAdmin) {
      if (fVia !== "" && td[6] && td[6].innerText.toUpperCase().indexOf(fVia) === -1) mostrar = false;
      if (fParc !== "" && td[7] && td[7].innerText.toUpperCase().indexOf(fParc) === -1) mostrar = false;
      if (fAtend !== "" && td[9] && td[9].innerText.toUpperCase().indexOf(fAtend) === -1) mostrar = false;
    }
    tr[i].style.display = mostrar ? "" : "none";
    if (mostrar) contadorVisiveis++;
  }

  const elNumLinhas = document.getElementById("numLinhas");
  if (elNumLinhas) elNumLinhas.innerText = contadorVisiveis;

  const checks = document.querySelectorAll('#containerChecks input[type="checkbox"]');
  checks.forEach((input) => {
    const idx = input.getAttribute('data-idx');
    if (idx && idx !== "null") {
        try {
            const visivel = input.checked;
            const colunas = tabela.querySelectorAll(`tr > *:nth-child(${idx})`);
            colunas.forEach(cel => { cel.style.display = visivel ? "" : "none"; });
        } catch(e) {}
    }
  });
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
      // 3,   // NASC - descomente para desmarcar
      // 4,   // MUNICIPIO - descomente para desmarcar
      // 5,   // TEL - descomente para desmarcar
      // 6,   // VIA - descomente para desmarcar
      // 7,   // PARCEIRO - descomente para desmarcar
      // 8,   // DATA - descomente para desmarcar
      // 9,   // ATENDENTE - descomente para desmarcar
      // 10,  // BOLETO - descomente para desmarcar
      // 15,  // LOTE - descomente para desmarcar
      // 16,  // SITUAÇÃO - descomente para desmarcar
      // 17   // PRAZO - descomente para desmarcar
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
      const tbody = document.getElementById("corpoTabelaListas");
      tbody.innerHTML = "";
      
      dados.forEach(item => {
        console.log('=== ITEM COMPLETO ===');
        console.log(item);
        console.log('dataStatus:', item.dataStatus);
        console.log('carteira:', item.carteira);
        console.log('lote:', item.lote);
        console.log('situacao:', item.situacao);
        console.log('prazoPendencia:', item.prazoPendencia);
        console.log('numeroArce:', item.numeroArce);
        
        const telefone = item.tel || '';
        
        tbody.innerHTML += `<tr>
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
            <button onclick='prepararEdicao(${JSON.stringify(item).replace(/'/g, "\\'")})' style="background:#f59e0b; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Editar</button>
          </td>
        </tr>`;
      });
      
      const checks = document.getElementById("containerChecks").querySelectorAll("input");
      checks.forEach((chk, i) => { if(!chk.checked) aplicarOcultacao(i, false); });
      
      if(typeof filtrarTabelaAvancado === 'function') {
        filtrarTabelaAvancado();
      }
    })
    .catch(err => {
      console.error("Erro:", err);
      document.getElementById("corpoTabelaListas").innerHTML = "<tr><td colspan='20' style='color:red;'>Erro ao carregar lista do servidor.</td></tr>";
    });
}

function alternarColuna(idx) { 
  aplicarOcultacao(idx, event.target.checked); 
}

function aplicarOcultacao(idx, exibir) {
  document.querySelectorAll(`.col-${idx}`).forEach(c => c.style.display = exibir ? "" : "none");
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
