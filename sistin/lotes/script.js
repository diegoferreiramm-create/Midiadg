// --- CONFIGURAÇÃO DE COMUNICAÇÃO GITHUB -> GOOGLE ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby0Ls9ct32TDn6N1x7n3w5gMByQRUYRr7izo-0RtbKFqie3KYYAAtWuJLi2MRKbDc1F/exec";
const TOKEN_SECRETO = "MACRO@MACRO"; // Faltava esta linha para a URL funcionar

// Esta "ponte" permite que seu código continue usando google.script.run
const google = {
  script: {
    run: {
      withSuccessHandler: function(callback) {
        this.callback = callback;
        return this;
      },
      withFailureHandler: function(failCallback) {
        this.failCallback = failCallback;
        return this;
      },
      // MAPEAMENTO DE TODAS AS SUAS FUNÇÕES (Adicionada a linha de log aqui)
      validarLogin: function(user, pass) { this.call("validarLogin", [user, pass]); },
      cadastrarNoServidor: function(u, p, n, pc) { this.call("cadastrarNoServidor", [u, p, n, pc]); },
      filtrarHistorico: function(cod, lote) { this.call("filtrarHistorico", [cod, lote]); },
      processarRecebimento: function(a, b, c) { this.call("processarRecebimento", [a, b, c]); },
      gravarMaloteFinal: function(a, b, c) { this.call("gravarMaloteFinal", [a, b, c]); },
      buscarParaNovoMalote: function(a, b) { this.call("buscarParaNovoMalote", [a, b]); },
      carregarDadosProducao: function() { this.call("carregarDadosProducao", []); },
      gravarEntradaNoServidor: function(a, b, c) { this.call("gravarEntradaNoServidor", [a, b, c]); },
      buscarDadosRecebidos: function(p, c, l) { this.call("buscarDadosRecebidos", [p, c, l]); },
      buscarDadosMaloteGeral: function(p, c, l) { this.call("buscarDadosMaloteGeral", [p, c, l]); },
      registrarAcaoNoLog: function(u, p, a, i) { this.call("registrarAcaoNoLog", [u, p, a, i]); }, // <--- NOVO
      buscarResumoBipagem: function(a) { this.call("buscarResumoBipagem", [a]); },
      buscarItensBipagemPorProtocolo: function(a) { this.call("buscarItensBipagemPorProtocolo", [a]); },

      call: function(functionName, args) {
        const self = this;
        // Agora o TOKEN_SECRETO está definido e não vai dar erro na linha 1
        const urlFinal = WEB_APP_URL + "?action=" + functionName + "&args=" + encodeURIComponent(JSON.stringify(args)) + "&token=" + TOKEN_SECRETO;

        fetch(urlFinal, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
          if (self.callback) self.callback(data);
        })
        .catch(err => {
          console.error("Erro na comunicação:", err);
          if (self.failCallback) self.failCallback(err);
        });
      }
    }
  }
};

// --- VARIÁVEIS GLOBAIS ---
var clicouNoBotaoSair = false;
var nomeGlobal = "";
var parceiroGlobal = "";
var intervaloRelogio;
var dadosLocalizados = [];

// --- FUNÇÃO DE LOGIN ---
function entrar() {
  var user = document.getElementById('userLogin').value;
  var pass = document.getElementById('passLogin').value;
  var msg = document.getElementById('msg');

  if (!user || !pass) {
    msg.className = "erro";
    msg.innerText = "Preencha todos os campos!";
    return;
  }

  msg.className = "";
  msg.innerText = "Validando acesso...";

  google.script.run.withSuccessHandler(function(res) {
    if (res.sucesso) {
      nomeGlobal = res.nome;
      parceiroGlobal = res.parceiro;

      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('menuBox').style.display = 'flex';
      
      document.getElementById('infoUsuario').innerText = "USUÁRIO: " + nomeGlobal + " | PARCEIRO: " + parceiroGlobal;
      document.getElementById('hudUsuario').style.display = 'block';
      
      if (typeof atualizarRelogio === "function") {
          intervaloRelogio = setInterval(atualizarRelogio, 1000);
      }
    } else {
      msg.className = "erro";
      msg.innerText = res.erro || "Usuário ou senha incorretos!";
    }
  }).validarLogin(user, pass);
}


// Função que realmente limpa a tela e volta para o login
function finalizarSessaoVisual() {
  // Se já limpou, não faz nada (evita repetir pelo setTimeout)
  if (nomeGlobal === "") return;

  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('recebimentoBox').style.display = 'none';
  document.getElementById('hudUsuario').style.display = 'none';
  
  document.getElementById('userLogin').value = "";
  document.getElementById('passLogin').value = "";
  document.getElementById('msg').innerText = "";
  document.getElementById('msg').className = "";
  
  // Limpa os dados de sessão
  nomeGlobal = "";
  parceiroGlobal = "";
  
  if (typeof intervaloRelogio !== 'undefined') clearInterval(intervaloRelogio);
  
  document.getElementById('loginBox').style.display = 'flex';
  console.log("Sistema resetado para login.");
}

// --- RELÓGIO ---
function atualizarRelogio() {
  var agora = new Date();
  var el = document.getElementById('dataHoraHud');
  if(el) el.innerText = agora.toLocaleString('pt-BR');
}

// --- NAVEGAÇÃO ---
function recebimentoLotes() {
  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('recebimentoBox').style.display = 'flex';
}

function voltarParaMenu() {
  var telas = ['recebimentoBox', 'maloteBox', 'entregaBox', 'entradaBox', 'reimpressaoBox', 'reimpressaoMaloteBox'];
  telas.forEach(function(id) {
    var elemento = document.getElementById(id);
    if (elemento) elemento.style.display = 'none';
  });
  document.getElementById('menuBox').style.display = 'flex';
  try {
    limparBusca();
    limparBuscaMalote();
  } catch (e) {
    console.log("Saindo...");
  }
}

function limparBusca() {
  dadosLocalizados = [];
  document.getElementById('corpoTabela').innerHTML = "";
  document.getElementById('contadorLinhas').innerText = "Total: 0 registros";
  document.getElementById('btnSalvarLote').style.display = "none";
  document.getElementById('filtroCodParceiro').value = "";
  document.getElementById('filtroLote').value = "";
  document.getElementById('filtroNomeParceiro').value = "";
}

// --- BUSCA DE DADOS (VERSÃO COMPLETA E SEGURA) ---
function buscarLotes() {
  var cod = document.getElementById('filtroCodParceiro').value;
  var loteBusca = document.getElementById('filtroLote').value;

  if (!cod || !loteBusca) {
    alert("Preencha o Código do Parceiro e o Lote!");
    return;
  }

  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = "<tr><td colspan='6' style='padding:20px; text-align:center;'>Buscando...</td></tr>";

  google.script.run.withSuccessHandler(function(data) {
    dadosLocalizados = data; 
    var html = "";

    if (!data || data.length === 0) {
      html = "<tr><td colspan='6' style='padding:20px; text-align:center; color:#f87171;'>Nenhum registro encontrado.</td></tr>";
      document.getElementById('btnSalvarLote').style.display = "none";
    } else {
      data.forEach(function(r) {
        
        // --- FUNÇÃO DE BUSCA INTELIGENTE (Mantida para evitar Undefined) ---
        function getVal(obj, nomes) {
          if (!obj || Array.isArray(obj)) return null; 
          for (let key in obj) {
            let k = key.toUpperCase().trim();
            if (nomes.includes(k)) return obj[key];
          }
          return null;
        }

        // --- MAPEAMENTO SEGURO RESPEITANDO SUA ORDEM (A, B, C, E, L, H) ---
        let id    = getVal(r, ["ID"]) || r[0] || "";  // Coluna A
        let cpf   = getVal(r, ["CPF"]) || r[1] || ""; // Coluna B
        let nome  = getVal(r, ["NOME"]) || r[2] || ""; // Coluna C
        let mun   = getVal(r, ["MUNICIPIO", "MUN"]) || r[4] || ""; // Coluna E
        
        // Aqui usamos a Coluna L (11) para o Lote e Coluna H (7) para o Parceiro
        let loteReal = getVal(r, ["LOTE", "NUMLOTE"]) || r[11] || ""; // Coluna L
        let parcReal = getVal(r, ["PARCEIRO", "PARC"]) || r[7] || "";  // Coluna H

        html += `<tr style="border-bottom: 1px solid #1e293b;">
          <td style="padding: 10px;">${id}</td>
          <td>${cpf}</td>
          <td>${nome}</td>
          <td>${mun}</td>
          <td style="font-weight: bold; color: #fbbf24;">${loteReal}</td> 
          <td>${parcReal}</td>
        </tr>`;
      });
      document.getElementById('btnSalvarLote').style.display = "block";
    }
    corpo.innerHTML = html;
    document.getElementById('contadorLinhas').innerText = "Total: " + data.length + " registros";
  }).filtrarHistorico(cod, loteBusca);
}

// --- SALVAMENTO EM "RECEBIDOS" (CORRIGIDO PARA IGUALAR REIMPRESSÃO) ---
function salvarRecebimento() {
  var nomeParceiro = document.getElementById('filtroNomeParceiro').value;
  var codParceiro = document.getElementById('filtroCodParceiro').value;
  var loteNum = document.getElementById('filtroLote').value;

  if (!nomeParceiro) {
    alert("Informe o NOME DO PARCEIRO antes de salvar!");
    return;
  }

  if (!confirm("Confirmar o recebimento?")) return;

  var btn = document.getElementById('btnSalvarLote');
  btn.disabled = true;
  btn.innerText = "SALVANDO...";

  google.script.run.withSuccessHandler(function(res) {
    // VERIFICAÇÃO SE DEU ERRO NO SERVIDOR
    if (res.sucesso === false) {
       alert("Erro ao salvar: " + res.erro);
       btn.disabled = false;
       btn.innerText = "SALVAR RECEBIMENTO";
       return;
    }

    // Se chegou aqui, 'res' é o protocolo (string)
    var protocolo = res; 

    document.getElementById('impParceiroLote').innerText = "PARCEIRO: " + codParceiro + " | LOTE: " + loteNum;
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + protocolo;
    document.getElementById('impDataHora').innerText = "DATA: " + new Date().toLocaleString('pt-BR');
    document.getElementById('impNomeParceiro').innerText = "NOME DO PARCEIRO: " + nomeParceiro;
    document.getElementById('impNomeAtendente').innerText = nomeGlobal;

    var htmlImp = "";
    dadosLocalizados.forEach(function(r) {
      let d_id    = r.id || r[0] || "---";
      let d_cpf   = r.cpf || r[1] || "---";
      let d_nome  = r.nome || r[2] || "---";
      let d_nasc  = r.nasc || r[3] || "---";
      let d_mun   = r.municipio || r[4] || "---";
      let d_via   = r.via || r[6] || "---";
      let d_parc  = r.parceiro || r[7] || "---";
      let d_data  = r.data || r[8] || "---";
      let d_atend = r.atendente || r[9] || "---";
      let d_bol   = r.boleto || r[10] || "---";

      htmlImp += `<tr>
        <td style="border:1px solid black; padding:2px;">${d_id}</td>
        <td style="border:1px solid black; padding:2px;">${d_cpf}</td>
        <td style="border:1px solid black; padding:2px;">${d_nome}</td>
        <td style="border:1px solid black; padding:2px;">${d_nasc}</td>
        <td style="border:1px solid black; padding:2px;">${d_mun}</td>
        <td style="border:1px solid black; padding:2px;">${d_via}</td>
        <td style="border:1px solid black; padding:2px;">${d_parc}</td>
        <td style="border:1px solid black; padding:2px;">${d_data}</td>
        <td style="border:1px solid black; padding:2px;">${d_atend}</td>
        <td style="border:1px solid black; padding:2px;">${d_bol}</td>
      </tr>`;
    });
    document.getElementById('corpoImpressao').innerHTML = htmlImp;

    setTimeout(function() {
      window.print();
      alert("Sucesso! Protocolo: " + protocolo);
      voltarParaMenu();
      btn.disabled = false;
      btn.innerText = "SALVAR RECEBIMENTO";
    }, 500);
  }).processarRecebimento(dadosLocalizados, nomeParceiro, nomeGlobal);
}

function abrirReimpressao() {
  document.getElementById('reimpressaoBox').style.display = 'block';
}

function buscarReimpressao() {
  var prot = document.getElementById('reimpProtocolo').value;
  var cod = document.getElementById('reimpCod').value;
  var lote = document.getElementById('reimpLote').value;
  google.script.run.withSuccessHandler(function(dados) {
    if (dados.length === 0) { alert("Nada encontrado."); return; }
    document.getElementById('impParceiroLote').innerText = "PARCEIRO: " + dados[0][7] + " | LOTE: " + dados[0][11];
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + dados[0][15];
    document.getElementById('impNomeParceiro').innerText = "NOME DO PARCEIRO: " + dados[0][13];
    document.getElementById('impNomeAtendente').innerText = dados[0][14];
    var htmlImp = "";
    dados.forEach(function(r) {
      htmlImp += `<tr><td style="border:1px solid black;">${r[0]}</td><td style="border:1px solid black;">${r[1]}</td><td style="border:1px solid black;">${r[2]}</td><td style="border:1px solid black;">${r[3]}</td><td style="border:1px solid black;">${r[4]}</td><td style="border:1px solid black;">${r[5]}</td><td style="border:1px solid black;">${r[6]}</td><td style="border:1px solid black;">${r[8]}</td><td style="border:1px solid black;">${r[9]}</td><td style="border:1px solid black;">${r[10]}</td></tr>`;
    });
    document.getElementById('corpoImpressao').innerHTML = htmlImp;
    document.getElementById('reimpressaoBox').style.display = 'none';
    setTimeout(function() { window.print(); }, 500);
  }).buscarDadosRecebidos(prot, cod, lote);
}

function abrirCadastroUsuarios() {
  document.getElementById('cadastroUsuarioBox').style.display = 'block';
}

function salvarNovoUsuario() {
  var user = document.getElementById('new_user').value;
  var pass = document.getElementById('new_pass').value;
  var nome = document.getElementById('new_nome').value;
  var parc = document.getElementById('new_parceiro').value;
  if (!user || !pass || !nome || !parc) {
    alert("Preencha todos os campos!");
    return;
  }
  google.script.run.withSuccessHandler(function(res) {
    alert(res);
    document.getElementById('cadastroUsuarioBox').style.display = 'none';
  }).cadastrarNoServidor(user, pass, nome, parc);
}

// --- VARIÁVEL GLOBAL DO MALOTE ---
    var dadosMaloteLocalizados = [];

    // --- ABRIR TELA ---
    function abrirMalote() {
      document.getElementById('menuBox').style.display = 'none';
      document.getElementById('maloteBox').style.display = 'flex';
    }

    // --- LIMPAR BUSCA MALOTE (Cópia da sua limparBusca) ---
    function limparBuscaMalote() {
      dadosMaloteLocalizados = [];
      document.getElementById('corpoMalote').innerHTML = "";
      document.getElementById('contadorMalote').innerText = "Total: 0 registros";
      document.getElementById('btnSalvarMalote').style.display = "none";
      document.getElementById('maloteCod').value = "";
      document.getElementById('maloteLote').value = "";
      document.getElementById('maloteDestino').value = "";
    }

    // --- BUSCA (Chama a mesma buscarDadosRecebidos que você já tem no GS) ---
    function buscarParaMalote() {
  var cod = document.getElementById('maloteCod').value;
  var lote = document.getElementById('maloteLote').value;

  if (!cod || !lote) {
    alert("Preencha o Código do Parceiro e o Lote!");
    return;
  }

  document.getElementById('corpoMalote').innerHTML = "<tr><td colspan='5' style='padding:20px; text-align:center;'>Buscando...</td></tr>";

  // MUDANÇA AQUI: Chamamos buscarParaNovoMalote em vez de buscarDadosRecebidos
  google.script.run.withSuccessHandler(function(data) {
    dadosMaloteLocalizados = data;
    renderizarTabelaMalote();
  }).buscarParaNovoMalote(cod, lote); 
}

    // --- RENDERIZAR TABELA DO MALOTE (AMPLIADA A AO L) ---
    function renderizarTabelaMalote() {
      var html = "";
      if (dadosMaloteLocalizados.length === 0) {
        html = "<tr><td colspan='13' style='padding:20px; text-align:center; color:#f87171;'>Nenhum registro encontrado em RECEBIDOS.</td></tr>";
        document.getElementById('btnSalvarMalote').style.display = "none";
      } else {
        dadosMaloteLocalizados.forEach(function(r, index) {
          // r[0]=ID, r[1]=CPF, r[2]=NOME, r[3]=NASC, r[4]=MUNICIPIO, r[5]=TEL, r[6]=VIA, 
          // r[7]=PARCEIRO, r[8]=DATA, r[9]=ATENDENTE, r[10]=BOLETO, r[11]=LOTE
          html += `<tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 10px;">${r[0]}</td>
            <td>${r[1]}</td>
            <td>${r[2]}</td>
            <td>${r[3]}</td>
            <td>${r[4]}</td>
            <td>${r[5]}</td>
            <td>${r[6]}</td>
            <td>${r[7]}</td>
            <td>${r[8]}</td>
            <td>${r[9]}</td>
            <td>${r[10]}</td>
            <td>${r[11]}</td>
            <td style="text-align:center;">
               <button onclick="removerLinhaMalote(${index})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">EXCLUIR</button>
            </td>
          </tr>`;
        });
        document.getElementById('btnSalvarMalote').style.display = "block";
      }
      document.getElementById('corpoMalote').innerHTML = html;
      document.getElementById('contadorMalote').innerText = "Total: " + dadosMaloteLocalizados.length + " registros";
    }
    function removerLinhaMalote(index) {
      dadosMaloteLocalizados.splice(index, 1);
      renderizarTabelaMalote();
    }

    function salvarMalote() {
  var destino = document.getElementById('maloteDestino').value;
  var codParceiro = document.getElementById('maloteCod').value; // Pegando o código para o cabeçalho
  var loteNum = document.getElementById('maloteLote').value;   // Pegando o lote para o cabeçalho

  if (!destino) {
    alert("Por favor, informe o DESTINO do malote!");
    return;
  }

  if (dadosMaloteLocalizados.length === 0) {
    alert("Não há dados na tabela para salvar.");
    return;
  }

  // Usamos o confirm igual ao recebimento para ficar padronizado
  if (!confirm("Confirmar o envio de " + dadosMaloteLocalizados.length + " itens para o malote?")) return;

  var btn = document.getElementById('btnSalvarMalote');
  btn.disabled = true;
  btn.innerText = "SALVANDO...";

  // Note que aqui passamos 'nomeGlobal', exatamente como no seu Recebimento
  google.script.run.withSuccessHandler(function(protocolo) {
    
    // --- PREPARAÇÃO DA IMPRESSÃO (IGUAL AO RECEBIMENTO) ---
    document.getElementById('impParceiroLote').innerText = "DESTINO: " + destino.toUpperCase() + " | LOTE: " + loteNum;
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + protocolo;
    document.getElementById('impDataHora').innerText = "DATA ENVIO: " + new Date().toLocaleString('pt-BR');
    
    if(document.getElementById('impNomeParceiro')) {
       document.getElementById('impNomeParceiro').innerText = "DESTINO: " + destino.toUpperCase();
    }

    // AQUI ESTÁ A CORREÇÃO: Usando a mesma variável nomeGlobal que funciona no recebimento
    document.getElementById('impNomeAtendente').innerText = nomeGlobal;

    var htmlImp = "";
    dadosMaloteLocalizados.forEach(function(r) {
      htmlImp += `<tr>
        <td style="border:1px solid black; padding:2px; width:15px; text-align:center;">${r[0]}</td>
        <td style="border:1px solid black; padding:2px; width:85px;">${r[1]}</td>
        <td style="border:1px solid black; padding:2px;">${r[2]}</td>
        <td style="border:1px solid black; padding:2px; width:50px; text-align:center;">${r[3]}</td>
        <td style="border:1px solid black; padding:2px;">${r[4]}</td>
        <td style="border:1px solid black; padding:2px; width:65px;">${r[5]}</td>
        <td style="border:1px solid black; padding:2px; width:15px; text-align:center;">${r[6]}</td>
        <td style="border:1px solid black; padding:2px; width:40px;">${r[8]}</td>
        <td style="border:1px solid black; padding:2px; width:30px;">${r[9]}</td> 
        <td style="border:1px solid black; padding:2px;">${r[10]}</td>
      </tr>`;
    });
    document.getElementById('corpoImpressao').innerHTML = htmlImp;

    // Aguarda o carregamento e dispara a impressão
    setTimeout(function() {
      window.print();
      alert("Sucesso! Malote Gerado: " + protocolo);
      
      limparBuscaMalote(); // Limpa os campos da busca
      voltarParaMenu();    // Volta para o menu igual ao recebimento
      
      btn.disabled = false;
      btn.innerText = "GERAR PROTOCOLO DE MALOTE";
    }, 500);

  }).gravarMaloteFinal(dadosMaloteLocalizados, destino, nomeGlobal); 
  // Envia nomeGlobal para o servidor também!
}

    

function abrirReimpressaoMalote() {
  // Limpa os campos antes de abrir
  document.getElementById('reimpProtocoloMalote').value = "";
  document.getElementById('reimpCodMalote').value = "";
  document.getElementById('reimpLoteMalote').value = "";
  
  document.getElementById('reimpressaoMaloteBox').style.display = 'block';
}

function consultarLote() {
  var cod = document.getElementById('reimpCodMalote').value.trim();
  var lote = document.getElementById('reimpLoteMalote').value.trim();
  
  google.script.run.withSuccessHandler(function(dados) {
    if (!dados || dados.length === 0) { alert("Nada encontrado!"); return; }
    
    document.getElementById('areaConsultaReimp').style.display = 'block';
    var corpo = document.getElementById('corpoConsultaReimp');
    corpo.innerHTML = "";

    dados.forEach(function(r) {
      var tr = document.createElement('tr');
      tr.style.borderBottom = "1px solid #1e293b";
      tr.style.cursor = "pointer";
      tr.onclick = function() { document.getElementById('reimpProtocoloMalote').value = r[15]; };
      tr.innerHTML = `<td style="padding:5px">${r[1]}</td><td style="padding:5px">${r[2]}</td><td style="padding:5px;color:#f59e0b">${r[13]}</td><td style="padding:5px">${r[15]}</td>`;
      corpo.appendChild(tr);
    });
  }).buscarDadosMaloteGeral("", cod, lote);
}

function imprimirProtocolo() {
  var protocolo = document.getElementById('reimpProtocoloMalote').value.trim().toUpperCase();
  if (!protocolo) { alert("Selecione um protocolo!"); return; }

  google.script.run.withSuccessHandler(function(dados) {
    if (!dados || dados.length === 0) return;
    var r = dados[0];
    document.getElementById('impParceiroLote').innerText = "DESTINO: " + r[13].toUpperCase() + " | LOTE: " + r[11];
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + r[15];
    document.getElementById('impDataHora').innerText = "DATA ENVIO: " + r[12];
    document.getElementById('impNomeAtendente').innerText = r[14].toUpperCase();

    var html = "";
    dados.forEach(function(item) {
      html += `<tr>
        <td style="border:1px solid black; padding:2px; text-align:center;">${item[0]}</td>
        <td style="border:1px solid black; padding:2px;">${item[1]}</td>
        <td style="border:1px solid black; padding:2px;">${item[2]}</td>
        <td style="border:1px solid black; padding:2px; text-align:center;">${item[3]}</td>
        <td style="border:1px solid black; padding:2px;">${item[4]}</td>
        <td style="border:1px solid black; padding:2px;">${item[5]}</td>
        <td style="border:1px solid black; padding:2px; text-align:center;">${item[6]}</td>
        <td style="border:1px solid black; padding:2px;">${item[8]}</td>
        <td style="border:1px solid black; padding:2px;">${item[9]}</td>
        <td style="border:1px solid black; padding:2px;">${item[10]}</td>
      </tr>`;
    });
    document.getElementById('corpoImpressao').innerHTML = html;
    document.getElementById('reimpressaoMaloteBox').style.display = 'none';
    setTimeout(function() { window.print(); }, 500);
  }).buscarDadosMaloteGeral(protocolo, "", "");
}


function buscarParaNovoMalote(cod, lote) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetHist = ss.getSheetByName("HISTORICO");
  var sheetMal = ss.getSheetByName("MALOTE");
  
  var dadosHist = sheetHist.getDataRange().getDisplayValues();
  var IDsNoMalote = [];
  
  // Pega os IDs que já estão no Malote para excluir da busca
  if (sheetMal) {
    var dadosMal = sheetMal.getDataRange().getValues();
    IDsNoMalote = dadosMal.map(function(r) { return r[0].toString(); });
  }

  var resultados = [];
  for (var i = 1; i < dadosHist.length; i++) {
    var r = dadosHist[i];
    // r[7] é Parceiro, r[11] é Lote, r[0] é ID
    if (r[7] == cod && r[11] == lote && IDsNoMalote.indexOf(r[0].toString()) === -1) {
      resultados.push(r);
    }
  }
  return resultados;
}


// --- ENTRADA BIPAGEM ---
var cacheGrafica = []; 
var dadosEntradaLocalizados = [];

// FUNÇÃO QUE ABRE A TELA
function entradaCarteiras() {
  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('entradaBox').style.display = 'flex';
  
  var campo = document.getElementById('inputBipagem');
  campo.value = "";
  campo.disabled = true;
  campo.placeholder = "⚡ CARREGANDO BASE...";

  google.script.run
    .withSuccessHandler(function(dados) {
      cacheGrafica = dados || [];
      campo.disabled = false;
      campo.placeholder = "PODE BIPAR AGORA";
      campo.focus();
    })
    .carregarDadosProducao();
}

// GATILHO DE 9 DÍGITOS - ESSA É A FUNÇÃO QUE SEU INPUT CHAMA
window.autoBip = function(valor) {
  // AJUSTADO PARA 8 NÚMEROS
  if (valor.length === 8) {
    processarBipagemRapida(valor);
  }
}

function processarBipagemRapida(ctr) {
  var campo = document.getElementById('inputBipagem');
  var ctrBipado = ctr.toString().trim();
  campo.value = ""; 

  if (dadosEntradaLocalizados.some(r => r[0] == ctrBipado)) return;

  // BUSCA "CAÇADORA": 
  // Ela limpa zeros, limpa espaços e tenta achar o número de qualquer jeito
  var itemEncontrado = cacheGrafica.find(function(r) {
    var cPlan = r[0].toString().trim();
    
    // Testa 3 formas: 
    // 1. Igualdade exata ("00171114" === "00171114")
    // 2. Valor numérico (171114 === 171114)
    // 3. Se um está contido no outro
    return (cPlan === ctrBipado) || 
           (Number(cPlan) === Number(ctrBipado)) ||
           (cPlan.includes(ctrBipado) || ctrBipado.includes(cPlan));
  });

  if (!itemEncontrado) {
    // Se não achar mesmo assim, entra o erro para não travar
    var erroItem = [ctrBipado, "---", "CTR NÃO LOCALIZADO", "---", "---", "---", "1"];
    dadosEntradaLocalizados.unshift(erroItem);
  } else {
    // SE ACHOU, vamos garantir que o CTR exibido seja o que você bipou
    var itemCopia = [...itemEncontrado];
    itemCopia[0] = ctrBipado; 
    dadosEntradaLocalizados.unshift(itemCopia);
  }

  renderizarTabelaEntrada();
  campo.focus();
}

function renderizarTabelaEntrada() {
  var elCorpo = document.getElementById('corpoEntrada');
  if (!elCorpo) return;

  // Filtros de conferência (Regra do Lote)
  var parceiroDefinido = document.getElementById('entParceiroConf').value.trim();
  var municipioDefinido = document.getElementById('entMunicipioConf').value.trim().toUpperCase();
  
  var html = "";

  dadosEntradaLocalizados.forEach(function(r, index) {
    // r[5] agora é o Parceiro que vem da Coluna P
    
    // Condições de ERRO para ativar o Alerta Vermelho
    var erroCtr = (r[2] === "CTR NÃO LOCALIZADO" || r[2] === "---");
    var erroParceiro = (parceiroDefinido !== "" && r[5].toString().trim() !== parceiroDefinido);
    var erroMunicipio = (municipioDefinido !== "" && r[4].toString().toUpperCase().trim() !== municipioDefinido);

    // Se houver erro, a linha "sangra" vermelho
    var corFundo = (erroCtr || erroParceiro || erroMunicipio) ? '#7f1d1d' : 'transparent';
    var corTexto = (erroCtr || erroParceiro || erroMunicipio) ? '#ffffff' : '#e2e8f0';

    html += `<tr style="background-color: ${corFundo}; color: ${corTexto}; border-bottom: 1px solid #334155;">
      <td style="padding: 10px; font-weight: bold;">${r[0]}</td>
      <td>${r[1]}</td>
      <td>${r[2]}</td>
      <td style="white-space: nowrap;">${r[3]}</td> <td>${r[4]}</td>
      <td style="text-align:center; font-weight: bold; font-size: 1.1em;">${r[5]}</td> <td>
        <button onclick="removerLinhaEntrada(${index})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">EXCLUIR</button>
      </td>
    </tr>`;
  });

  elCorpo.innerHTML = html;
  
  var total = dadosEntradaLocalizados.length;
  document.getElementById('contadorGeralEntrada').innerText = "Total Geral: " + total;
  document.getElementById('contadorLoteEntrada').innerText = "Lote (30): " + (total % 30) + "/30";
}

function removerLinhaEntrada(index) {
  dadosEntradaLocalizados.splice(index, 1);
  renderizarTabelaEntrada();
}

function salvarEntradaCarteiras() {
  if (dadosEntradaLocalizados.length === 0) return;
  var btn = document.getElementById('btnSalvarEntrada');
  var remessa = document.getElementById('entRemessa').value || "S/N";
  btn.disabled = true;

  google.script.run.withSuccessHandler(function(protocolo) {
    alert("Salvo! Protocolo: " + protocolo);
    dadosEntradaLocalizados = [];
    renderizarTabelaEntrada();
    voltarParaMenu();
    btn.disabled = false;
  }).gravarEntradaNoServidor(dadosEntradaLocalizados, remessa, nomeGlobal);
}

// --- LOG DE FECHAMENTO E ATUALIZAÇÃO ---
window.addEventListener('beforeunload', function () {
  if (typeof nomeGlobal !== 'undefined' && nomeGlobal && nomeGlobal !== "") {
    let mensagemAcao = "";
    
    // Diferencia se foi botão Sair, F5 ou fechar aba
    if (typeof clicouNoBotaoSair !== 'undefined' && clicouNoBotaoSair) {
      mensagemAcao = "SAIU PELO BOTAO (LOGOUT)";
    } else if (window.performance && performance.navigation.type === 1) {
      mensagemAcao = "PAGINA ATUALIZADA (F5)";
    } else {
      mensagemAcao = "ABA OU NAVEGADOR FECHADO";
    }

    const argsLog = [nomeGlobal, parceiroGlobal, mensagemAcao, "Sistema Lotes"];
    
    // Montagem da URL exata para o seu doGet reconhecer
    const urlFinal = WEB_APP_URL + 
                     "?action=registrarAcaoNoLog" + 
                     "&args=" + encodeURIComponent(JSON.stringify(argsLog)) + 
                     "&token=" + TOKEN_SECRETO;

    // Envia o log de forma "invisível" para o navegador não travar
    navigator.sendBeacon(urlFinal);
  }
});


// --- SISTEMA DE CONSULTA E REIMPRESSÃO (CAMADAS SOBREPOSTAS) ---

var dadosParaImpressaoBip = []; // Cache para a camada 2

// 1. Abre a primeira camada (Resumo)
function abrirReimpressaoBipagem() {
  // Exibe a camada
  document.getElementById('camadaResumoBipagem').style.display = 'flex';
  
  const tbody = document.getElementById("corpoResumoBipagem");
  tbody.innerHTML = "<tr><td colspan='4'>Carregando histórico agrupado...</td></tr>";

  // Chamada idêntica à lógica do seu fetch/Google Script
  google.script.run
    .withSuccessHandler(function(dados) {
      tbody.innerHTML = "";
      
      if (dados.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Nenhum dado encontrado na aba BIPAGEM.</td></tr>";
        return;
      }

      // Lógica de construção de linha que você mandou no exemplo
      dados.forEach(item => {
        tbody.innerHTML += `
          <tr onclick="verDetalhesBipagem('${item.protocolo}', ${item.quantidade})" 
              style="cursor:pointer; border-bottom:1px solid #334155;" 
              onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background=''">
            <td style="padding:12px; font-weight:bold; color:#38bdf8;">${item.remessa}</td>
            <td>${item.data}</td>
            <td style="text-align:center; font-weight:bold; color:#fbbf24;">📦 ${item.quantidade} ITENS</td>
            <td style="font-family:monospace; font-size:12px; color:#94a3b8;">${item.protocolo}</td>
          </tr>`;
      });
    })
    .withFailureHandler(err => {
      tbody.innerHTML = "<tr><td colspan='4' style='color:red;'>Erro ao conectar com o servidor.</td></tr>";
    })
    .buscarResumoBipagem();
}

// Atualizei a função de detalhes para exibir a quantidade no título também
function verDetalhesBipagem(protocolo, qtd) {
  document.getElementById('camadaDetalheBipagem').style.display = 'flex';
  document.getElementById('tituloDetalhe').innerText = "PROTOCOLO: " + protocolo;
  document.getElementById('subtituloQuantidade').innerText = "Total de itens neste lote: " + qtd;
  
  const corpo = document.getElementById('corpoDetalheBipagem');
  corpo.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Abrindo lista detalhada...</td></tr>";

  google.script.run.withSuccessHandler(function(dados) {
    dadosParaImpressaoBip = dados;
    let html = "";
    dados.forEach(item => {
      html += `<tr style="border-bottom: 1px solid #0f172a;">
        <td style="padding:8px;">${item[0]}</td>
        <td>${item[1]}</td>
        <td>${item[2]}</td>
        <td>${item[4]}</td>
        <td>${item[5]}</td>
      </tr>`;
    });
    corpo.innerHTML = html;
  }).buscarItensBipagemPorProtocolo(protocolo);
}

// 3. Dispara a impressão (dentro da Camada 2)
function dispararImpressaoBipagem() {
  if (dadosParaImpressaoBip.length === 0) {
    alert("Nenhum dado carregado para impressão.");
    return;
  }
  
  var r = dadosParaImpressaoBip[0];
  // Preenche o cabeçalho do seu template de impressão
  document.getElementById('impParceiroLote').innerText = "REMESSA: " + (r[11] || "S/N");
  document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + (r[12] || "S/P");
  document.getElementById('impDataHora').innerText = "DATA BIPAGEM: " + (r[10] || "");
  document.getElementById('impNomeAtendente').innerText = (r[13] || "").toUpperCase();

  var html = "";
  dadosParaImpressaoBip.forEach(function(item) {
    html += `<tr>
      <td style="border:1px solid black; padding:2px;">${item[0]}</td>
      <td style="border:1px solid black; padding:2px;">${item[1]}</td>
      <td style="border:1px solid black; padding:2px;">${item[2]}</td>
      <td style="border:1px solid black; padding:2px;">${item[3]}</td>
      <td style="border:1px solid black; padding:2px;">${item[4]}</td>
      <td style="border:1px solid black; padding:2px; text-align:center;">${item[5]}</td>
      <td colspan="4" style="border:1px solid black; padding:2px; text-align:center;">ENTRADA CONFIRMADA</td>
    </tr>`;
  });
  
  document.getElementById('corpoImpressao').innerHTML = html;
  
  // Pequeno delay para garantir que o HTML da impressão renderizou antes de abrir o PDF
  setTimeout(function() { 
    window.print(); 
  }, 300);
}
