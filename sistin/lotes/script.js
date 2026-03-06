// --- CONFIGURAÇÃO DE COMUNICAÇÃO GITHUB -> GOOGLE ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby0Ls9ct32TDn6N1x7n3w5gMByQRUYRr7izo-0RtbKFqie3KYYAAtWuJLi2MRKbDc1F/exec";

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
      // Funções mapeadas para o seu .gs
      validarLogin: function(user, pass) { this.call("validarLogin", [user, pass]); },
      cadastrarNoServidor: function(u, p, n, pc) { this.call("cadastrarNoServidor", [u, p, n, pc]); },
      filtrarHistorico: function(cod, lote) { this.call("filtrarHistorico", [cod, lote]); },
      processarRecebimento: function(a, b, c) { this.call("processarRecebimento", [a, b, c]); },
      gravarMaloteFinal: function(a, b, c) { this.call("gravarMaloteFinal", [a, b, c]); },
      buscarParaNovoMalote: function(a, b) { this.call("buscarParaNovoMalote", [a, b]); },
      carregarDadosProducao: function() { this.call("carregarDadosProducao", []); },
      gravarEntradaNoServidor: function(a, b, c) { this.call("gravarEntradaNoServidor", [a, b, c]); },
      
      call: function(functionName, args) {
        const self = this;
        // Simplificamos para usar apenas o GET com redirecionamento, que é o que funciona com CORS
        const urlFinal = `${WEB_APP_URL}?token=MACRO@MACRO&action=${functionName}&args=${encodeURIComponent(JSON.stringify(args))}`;
        
        fetch(urlFinal, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow'
        })
        .then(res => {
          if (!res.ok) throw new Error('Erro na rede');
          return res.json();
        })
        .then(data => { 
          if(self.callback) self.callback(data); 
        })
        .catch(err => { 
          console.error("Erro na comunicação:", err);
          if(self.failCallback) self.failCallback(err); 
        });
      }
    }
  }
};

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
      
      intervaloRelogio = setInterval(atualizarRelogio, 1000);
    } else {
      msg.className = "erro";
      msg.innerText = res.erro || "Usuário ou senha incorretos!";
    }
  }).validarLogin(user, pass);
}

// --- FUNÇÃO DE SAÍDA ---
function resetarParaLogin() {
  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('recebimentoBox').style.display = 'none';
  document.getElementById('hudUsuario').style.display = 'none';
  
  document.getElementById('userLogin').value = "";
  document.getElementById('passLogin').value = "";
  document.getElementById('msg').innerText = "";
  
  clearInterval(intervaloRelogio);
  document.getElementById('loginBox').style.display = 'flex';
}

// --- RELÓGIO ---
function atualizarRelogio() {
  var agora = new Date();
  document.getElementById('dataHoraHud').innerText = agora.toLocaleString('pt-BR');
}

// --- NAVEGAÇÃO ---
function recebimentoLotes() {
  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('recebimentoBox').style.display = 'flex';
}

function voltarParaMenu() {
  var telas = ['recebimentoBox', 'maloteBox', 'entregaBox', 'entradaBox', 'reimpressaoBox'];
  telas.forEach(function(id) {
    var elemento = document.getElementById(id);
    if (elemento) elemento.style.display = 'none';
  });
  document.getElementById('menuBox').style.display = 'flex';
  try {
    if (typeof limparBusca === "function") limparBusca();
    if (typeof limparBuscaMalote === "function") limparBuscaMalote();
  } catch (e) {
    console.log("Erro ao limpar dados, mas voltando ao menu...");
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

// --- BUSCA DE DADOS (COLUNAS H E L) ---
function buscarLotes() {
  var cod = document.getElementById('filtroCodParceiro').value;
  var lote = document.getElementById('filtroLote').value;

  if (!cod || !lote) {
    alert("Preencha o Código do Parceiro e o Lote!");
    return;
  }

  document.getElementById('corpoTabela').innerHTML = "<tr><td colspan='6' style='padding:20px; text-align:center;'>Buscando informações no histórico...</td></tr>";

  google.script.run.withSuccessHandler(function(data) {
    dadosLocalizados = data;
    var html = "";
    if (data.length === 0) {
      html = "<tr><td colspan='6' style='padding:20px; text-align:center; color:#f87171;'>Nenhum registro encontrado para este filtro literal.</td></tr>";
      document.getElementById('btnSalvarLote').style.display = "none";
    } else {
      data.forEach(function(r) {
        html += `<tr style="border-bottom: 1px solid #1e293b;">
          <td style="padding: 10px;">${r[0]}</td>
          <td>${r[1]}</td>
          <td>${r[2]}</td>
          <td>${r[4]}</td>
          <td>${r[11]}</td>
          <td>${r[7]}</td>
        </tr>`;
      });
      document.getElementById('btnSalvarLote').style.display = "block";
    }
    document.getElementById('corpoTabela').innerHTML = html;
    document.getElementById('contadorLinhas').innerText = "Total: " + data.length + " registros";
  }).filtrarHistorico(cod, lote);
}

// --- SALVAMENTO EM "RECEBIDOS" ---
function salvarRecebimento() {
  var nomeParceiro = document.getElementById('filtroNomeParceiro').value;
  var codParceiro = document.getElementById('filtroCodParceiro').value;
  var loteNum = document.getElementById('filtroLote').value;

  if (!nomeParceiro) {
    alert("Informe o NOME DO PARCEIRO antes de salvar!");
    return;
  }

  if (!confirm("Confirmar o recebimento de " + dadosLocalizados.length + " itens?")) return;

  var btn = document.getElementById('btnSalvarLote');
  btn.disabled = true;
  btn.innerText = "SALVANDO...";

  google.script.run.withSuccessHandler(function(protocolo) {
    document.getElementById('impParceiroLote').innerText = "PARCEIRO: " + codParceiro + " | LOTE: " + loteNum;
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + protocolo;
    document.getElementById('impDataHora').innerText = "DATA: " + new Date().toLocaleString('pt-BR');
    document.getElementById('impNomeParceiro').innerText = "NOME DO PARCEIRO: " + nomeParceiro;
    document.getElementById('impNomeAtendente').innerText = nomeGlobal;

    var htmlImp = "";
    dadosLocalizados.forEach(function(r) {
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

    setTimeout(function() {
      window.print();
      alert("Sucesso! Protocolo Gerado: " + protocolo);
      voltarParaMenu();
      btn.disabled = false;
      btn.innerText = "SALVAR RECEBIMENTO";
    }, 500);
  }).processarRecebimento(dadosLocalizados, nomeParceiro, nomeGlobal);
}

function entregaParceiros() { console.log("Em desenvolvimento..."); }

function abrirReimpressao() {
  document.getElementById('reimpressaoBox').style.display = 'block';
}

function buscarReimpressao() {
  var prot = document.getElementById('reimpProtocolo').value;
  var cod = document.getElementById('reimpCod').value;
  var lote = document.getElementById('reimpLote').value;
  if (!prot && (!cod || !lote)) {
    alert("Preencha o Protocolo OU o Parceiro e Lote!");
    return;
  }
  google.script.run.withSuccessHandler(function(dados) {
    if (dados.length === 0) {
      alert("Nenhum registro encontrado na aba RECEBIDOS.");
      return;
    }
    document.getElementById('impParceiroLote').innerText = "PARCEIRO: " + dados[0][7] + " | LOTE: " + dados[0][11];
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + dados[0][15];
    document.getElementById('impDataHora').innerText = "REIMPRESSÃO: " + new Date().toLocaleString('pt-BR');
    document.getElementById('impNomeParceiro').innerText = "NOME DO PARCEIRO: " + dados[0][13];
    document.getElementById('impNomeAtendente').innerText = dados[0][14];

    var htmlImp = "";
    dados.forEach(function(r) {
      htmlImp += `<tr>
        <td style="border:1px solid black; padding:2px; width:20px; text-align:center;">${r[0]}</td>
        <td style="border:1px solid black; padding:2px; width:80px;">${r[1]}</td>
        <td style="border:1px solid black; padding:2px;">${r[2]}</td>
        <td style="border:1px solid black; padding:2px; width:60px; text-align:center;">${r[3]}</td>
        <td style="border:1px solid black; padding:2px;">${r[4]}</td>
        <td style="border:1px solid black; padding:2px;">${r[5]}</td>
        <td style="border:1px solid black; padding:2px; width:20px; text-align:center;">${r[6]}</td>
        <td style="border:1px solid black; padding:2px;">${r[8]}</td>
        <td style="border:1px solid black; padding:2px;">${r[9]}</td>
        <td style="border:1px solid black; padding:2px;">${r[10]}</td>
      </tr>`;
    });
    document.getElementById('corpoImpressao').innerHTML = htmlImp;
    document.getElementById('reimpressaoBox').style.display = 'none';
    setTimeout(function() { window.print(); }, 500);
  }).buscarDadosRecebidos(prot, cod, lote);
}

function abrirCadastroUsuarios() {
  document.getElementById('new_user').value = "";
  document.getElementById('new_pass').value = "";
  document.getElementById('new_nome').value = "";
  document.getElementById('new_parceiro').value = "";
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
  const google = {
  script: {
    run: {
      withSuccessHandler: function(callback) {
        this.callback = callback;
        return this;
      },
      // ADICIONE ESTA LINHA ABAIXO PARA MAPEAMENTO:
      cadastrarNoServidor: function(u, p, n, pc) { this.call("cadastrarNoServidor", [u, p, n, pc]); },
      
      // Mantenha as outras que você já usa, como:
      validarLogin: function(u, p) { this.call("validarLogin", [u, p]); },
      // filtrarHistorico, etc...

      call: function(functionName, args) {
        const self = this;
        const urlFinal = `${WEB_APP_URL}?token=MACRO@MACRO&action=${functionName}&args=${encodeURIComponent(JSON.stringify(args))}`;

        fetch(urlFinal, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => { if (self.callback) self.callback(data); })
        .catch(err => console.error("Erro na ponte:", err));
      }
    }
  }
};

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
  document.getElementById('maloteCod').value = "";
  document.getElementById('maloteLote').value = "";
  document.getElementById('maloteDestino').value = "";
}

function buscarParaMalote() {
  var cod = document.getElementById('maloteCod').value;
  var lote = document.getElementById('maloteLote').value;
  if (!cod || !lote) {
    alert("Preencha o Código do Parceiro e o Lote!");
    return;
  }
  document.getElementById('corpoMalote').innerHTML = "<tr><td colspan='5' style='padding:20px; text-align:center;'>Buscando...</td></tr>";
  google.script.run.withSuccessHandler(function(data) {
    dadosMaloteLocalizados = data;
    renderizarTabelaMalote();
  }).buscarParaNovoMalote(cod, lote);
}

function renderizarTabelaMalote() {
  var html = "";
  if (dadosMaloteLocalizados.length === 0) {
    html = "<tr><td colspan='13' style='padding:20px; text-align:center; color:#f87171;'>Nenhum registro encontrado em RECEBIDOS.</td></tr>";
    document.getElementById('btnSalvarMalote').style.display = "none";
  } else {
    dadosMaloteLocalizados.forEach(function(r, index) {
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
  var loteNum = document.getElementById('maloteLote').value;
  if (!destino) {
    alert("Por favor, informe o DESTINO do malote!");
    return;
  }
  if (dadosMaloteLocalizados.length === 0) {
    alert("Não há dados na tabela para salvar.");
    return;
  }
  if (!confirm("Confirmar o envio de " + dadosMaloteLocalizados.length + " itens para o malote?")) return;
  var btn = document.getElementById('btnSalvarMalote');
  btn.disabled = true;
  btn.innerText = "SALVANDO...";
  google.script.run.withSuccessHandler(function(protocolo) {
    document.getElementById('impParceiroLote').innerText = "DESTINO: " + destino.toUpperCase() + " | LOTE: " + loteNum;
    document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + protocolo;
    document.getElementById('impDataHora').innerText = "DATA ENVIO: " + new Date().toLocaleString('pt-BR');
    if(document.getElementById('impNomeParceiro')) {
       document.getElementById('impNomeParceiro').innerText = "DESTINO: " + destino.toUpperCase();
    }
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
    setTimeout(function() {
      window.print();
      alert("Sucesso! Malote Gerado: " + protocolo);
      limparBuscaMalote();
      voltarParaMenu();
      btn.disabled = false;
      btn.innerText = "GERAR PROTOCOLO DE MALOTE";
    }, 500);
  }).gravarMaloteFinal(dadosMaloteLocalizados, destino, nomeGlobal);
}

function abrirReimpressaoMalote() {
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

// --- ENTRADA (BIPAGEM) ---
var cacheGrafica = []; 
var dadosEntradaLocalizados = [];

function entradaCarteiras() {
  document.getElementById('menuBox').style.display = 'none';
  document.getElementById('entradaBox').style.display = 'flex';
  var campo = document.getElementById('inputBipagem');
  campo.value = "";
  campo.disabled = true;
  campo.placeholder = "⚡ CARREGANDO BASE...";
  google.script.run.withSuccessHandler(function(dados) {
    cacheGrafica = dados || [];
    campo.disabled = false;
    campo.placeholder = "PODE BIPAR AGORA";
    campo.focus();
  }).carregarDadosProducao();
}

window.autoBip = function(valor) {
  if (valor.length === 8) processarBipagemRapida(valor);
}

function processarBipagemRapida(ctr) {
  var campo = document.getElementById('inputBipagem');
  var ctrBipado = ctr.toString().trim();
  campo.value = ""; 
  if (dadosEntradaLocalizados.some(r => r[0] == ctrBipado)) return;
  var itemEncontrado = cacheGrafica.find(function(r) {
    var cPlan = r[0].toString().trim();
    return (cPlan === ctrBipado) || 
           (Number(cPlan) === Number(ctrBipado)) ||
           (cPlan.includes(ctrBipado) || ctrBipado.includes(cPlan));
  });
  if (!itemEncontrado) {
    var erroItem = [ctrBipado, "---", "CTR NÃO LOCALIZADO", "---", "---", "---", "1"];
    dadosEntradaLocalizados.unshift(erroItem);
  } else {
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
  var parceiroDefinido = document.getElementById('entParceiroConf').value.trim();
  var municipioDefinido = document.getElementById('entMunicipioConf').value.trim().toUpperCase();
  var html = "";
  dadosEntradaLocalizados.forEach(function(r, index) {
    var erroCtr = (r[2] === "CTR NÃO LOCALIZADO" || r[2] === "---");
    var erroParceiro = (parceiroDefinido !== "" && r[5].toString().trim() !== parceiroDefinido);
    var erroMunicipio = (municipioDefinido !== "" && r[4].toString().toUpperCase().trim() !== municipioDefinido);
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
