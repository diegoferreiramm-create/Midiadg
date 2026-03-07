// --- CONFIGURAÇÃO DE COMUNICAÇÃO GITHUB -> GOOGLE ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby0Ls9ct32TDn6N1x7n3w5gMByQRUYRr7izo-0RtbKFqie3KYYAAtWuJLi2MRKbDc1F/exec";

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
      // MAPEAMENTO DE TODAS AS SUAS FUNÇÕES
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

      call: function(functionName, args) {
        const self = this;
        // AJUSTE NA MONTAGEM DA URL PARA GARANTIR A COMUNICAÇÃO
        const urlFinal = WEB_APP_URL + "?action=" + functionName + "&args=" + encodeURIComponent(JSON.stringify(args)) + "&token=MACRO@MACRO";

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

// --- MALOTE ---
var dadosMaloteLocalizados = [];

function abrirMalote() {
  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('maloteBox').style.display = 'flex';
}

function limparBuscaMalote() {
  dadosMaloteLocalizados = [];
  document.getElementById('corpoMalote').innerHTML = "";
  document.getElementById('contadorMalote').innerText = "Total: 0 registros";
  document.getElementById('btnSalvarMalote').style.display = "none";
}

function buscarParaMalote() {
  var cod = document.getElementById('maloteCod').value;
  var lote = document.getElementById('maloteLote').value;
  google.script.run.withSuccessHandler(function(data) {
    dadosMaloteLocalizados = data;
    renderizarTabelaMalote();
  }).buscarParaNovoMalote(cod, lote);
}

function renderizarTabelaMalote() {
  var html = "";
  if (dadosMaloteLocalizados.length === 0) {
    html = "<tr><td colspan='13' style='text-align:center;'>Nada encontrado.</td></tr>";
    document.getElementById('btnSalvarMalote').style.display = "none";
  } else {
    dadosMaloteLocalizados.forEach(function(r, index) {
      html += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td><td>${r[8]}</td><td>${r[9]}</td><td>${r[10]}</td><td>${r[11]}</td><td><button onclick="removerLinhaMalote(${index})">EXCLUIR</button></td></tr>`;
    });
    document.getElementById('btnSalvarMalote').style.display = "block";
  }
  document.getElementById('corpoMalote').innerHTML = html;
  document.getElementById('contadorMalote').innerText = "Total: " + dadosMaloteLocalizados.length;
}

function removerLinhaMalote(index) {
  dadosMaloteLocalizados.splice(index, 1);
  renderizarTabelaMalote();
}

function salvarMalote() {
  var destino = document.getElementById('maloteDestino').value;
  if (!destino) { alert("Destino?"); return; }
  google.script.run.withSuccessHandler(function(protocolo) {
    alert("Gerado: " + protocolo);
    voltarParaMenu();
  }).gravarMaloteFinal(dadosMaloteLocalizados, destino, nomeGlobal);
}

function abrirReimpressaoMalote() {
  document.getElementById('reimpressaoMaloteBox').style.display = 'block';
}

function consultarLote() {
  var cod = document.getElementById('reimpCodMalote').value;
  var lote = document.getElementById('reimpLoteMalote').value;
  google.script.run.withSuccessHandler(function(dados) {
    var corpo = document.getElementById('corpoConsultaReimp');
    corpo.innerHTML = "";
    dados.forEach(function(r) {
      var tr = document.createElement('tr');
      tr.onclick = function() { document.getElementById('reimpProtocoloMalote').value = r[15]; };
      tr.innerHTML = `<td>${r[1]}</td><td>${r[2]}</td><td>${r[13]}</td><td>${r[15]}</td>`;
      corpo.appendChild(tr);
    });
  }).buscarDadosMaloteGeral("", cod, lote);
}

function imprimirProtocolo() {
  var protocolo = document.getElementById('reimpProtocoloMalote').value;
  google.script.run.withSuccessHandler(function(dados) {
    if (!dados || dados.length === 0) return;
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + dados[0][15];
    document.getElementById('reimpressaoMaloteBox').style.display = 'none';
    setTimeout(function() { window.print(); }, 500);
  }).buscarDadosMaloteGeral(protocolo, "", "");
}

// --- ENTRADA ---
var cacheGrafica = []; 
var dadosEntradaLocalizados = [];

function entradaCarteiras() {
  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('entradaBox').style.display = 'flex';
  google.script.run.withSuccessHandler(function(dados) {
    cacheGrafica = dados || [];
  }).carregarDadosProducao();
}

window.autoBip = function(valor) {
  if (valor.length === 8) processarBipagemRapida(valor);
}

function processarBipagemRapida(ctr) {
  if (dadosEntradaLocalizados.some(r => r[0] == ctr)) return;
  var item = cacheGrafica.find(r => r[0].toString().trim() == ctr.toString().trim());
  if (!item) {
    dadosEntradaLocalizados.unshift([ctr, "---", "CTR NÃO LOCALIZADO", "---", "---", "---", "1"]);
  } else {
    dadosEntradaLocalizados.unshift([...item]);
  }
  renderizarTabelaEntrada();
  document.getElementById('inputBipagem').value = "";
}

function renderizarTabelaEntrada() {
  var html = "";
  dadosEntradaLocalizados.forEach(function(r, index) {
    html += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td><button onclick="removerLinhaEntrada(${index})">EXCLUIR</button></td></tr>`;
  });
  document.getElementById('corpoEntrada').innerHTML = html;
  document.getElementById('contadorGeralEntrada').innerText = "Total: " + dadosEntradaLocalizados.length;
}

function removerLinhaEntrada(index) {
  dadosEntradaLocalizados.splice(index, 1);
  renderizarTabelaEntrada();
}

function salvarEntradaCarteiras() {
  var remessa = document.getElementById('entRemessa').value || "S/N";
  google.script.run.withSuccessHandler(function(protocolo) {
    alert("Salvo: " + protocolo);
    voltarParaMenu();
  }).gravarEntradaNoServidor(dadosEntradaLocalizados, remessa, nomeGlobal);
}

window.addEventListener('unload', function() {
  if (typeof nomeGlobal !== 'undefined' && nomeGlobal && nomeGlobal !== "") {
    
    let mensagemAcao = "";
    let localAcao = "";

    if ((typeof clicouNoBotaoSair !== 'undefined' && clicouNoBotaoSair) || (window.performance && performance.navigation.type === 1)) {
      mensagemAcao = "SAÍDA/ATUALIZOU";
      localAcao = "Sistema Lotes";
    } else {
      mensagemAcao = "FECHOU ABA/NAVEGADOR";
      localAcao = "Navegador";
    }

    // Criamos o array de argumentos exatamente como o seu doGet espera receber para o registrarAcaoNoLog
    const argsLog = [nomeGlobal, parceiroGlobal, mensagemAcao, localAcao];
    
    const urlLog = WEB_APP_URL + 
                   "?action=registrarAcaoNoLog" + 
                   "&args=" + encodeURIComponent(JSON.stringify(argsLog)) + 
                   "&token=" + TOKEN_SECRETO; // Usando a constante que você já tem

    navigator.sendBeacon(urlLog); // sendBeacon é mais seguro que fetch no unload para não travar o navegador
  }
});
