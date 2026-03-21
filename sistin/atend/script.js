// CONFIGURAÇÃO INICIAL - TOPO DO SCRIPT.JS
const urlSistema = "https://script.google.com/macros/s/AKfycbxeyoKG99zETrrx6BdF7--w_-1cVe-S0tctxKOAfgFFQ3_as64oRqONoditWtXWsrRF/exec";

let modoEdicao = false;
let idSendoEditado = null;
let alunoEncontradoGlobal = null;
let clicouNoBotaoSair = false; 

// --- AS DUAS VARIÁVEIS QUE O LOG PRECISA ---
let usuarioLogadoParaLog = ""; 
let parceiroLogadoParaLog = "";

// No topo do script, para garantir que ao deslogar a tela volte ao zero
window.onload = function() {
  if (clicouNoBotaoSair) {
    sessionStorage.clear();
    abrirTela('loginBox');
  }
  gerarChecksColunas(); // sua função que já existia no onload
};

//atribuições de abrir paginas//
function abrirTela(id){
  // Adicionado 'recebimentoLoteBox' na lista abaixo
  const telas = ["loginBox","menuBox","cadastrarBox","pesquisarBox","entregarBox","listasBox", "logBox", "recebimentoLoteBox"];   
  
  telas.forEach(t => { 
    const el = document.getElementById(t);
    if(el) el.style.display = "none"; 
  });

  const telaDestino = document.getElementById(id);
  if(telaDestino){
    // Mantém flex para telas de estrutura complexa
    if(['menuBox', 'listasBox', 'recebimentoLoteBox'].includes(id)){
      telaDestino.style.display = "flex";
    } else {
      telaDestino.style.display = "flex"; // Ou "block", mas seu CSS usa flex para centralizar
    }
  }

  // Reseta campos específicos ao navegar
  if(id === 'entregarBox') {
    document.getElementById("codigoCtr").value = "";
    document.getElementById("infoAlunoEntrega").style.display = "none";
    alunoEncontradoGlobal = null;
  }
  if(id === 'listasBox') carregarLista();
  if(id === 'logBox') carregarDadosLog();
  
  if(id !== 'cadastrarBox') {
    modoEdicao = false;
    idSendoEditado = null;
    document.getElementById("btnSalvar").innerText = "Salvar e Gerar Protocolo";
  }
}

function entrar() {
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const msg = document.getElementById("msg");

  if (msg) msg.innerText = "Verificando...";

  fetch(`${urlSistema}?action=validarLogin&user=${login}&pass=${senha}`)
    .then(response => response.json())
    .then(res => {
      if (res.sucesso) {
        // Alimenta as globais para o log de saída usar depois
        usuarioLogadoParaLog = res.nome;  
        parceiroLogadoParaLog = res.parceiro;

        sessionStorage.setItem("usuario", JSON.stringify(res));
        
        // COMENTEI ABAIXO PORQUE O .GS JÁ FAZ ESSE LOG. SE DEIXAR, FICA DUPLICADO.
        // const logEntrada = [res.nome, res.parceiro, "LOGIN REALIZADO", "Sistema MTECH"];
        // fetch(`${urlSistema}?action=registrarAcaoNoLog&args=${encodeURIComponent(JSON.stringify(logEntrada))}&token=MACRO@MACRO`, {mode:'no-cors'});

        mostrarMenu();
      } else {
        if (msg) msg.innerText = "Login inválido";
      }
    })
    .catch(err => {
      console.error("Erro ao conectar:", err);
      if (msg) msg.innerText = "Erro de conexão";
    });
}

/**
 * MAPEAMENTO RÍGIDO - MANTIDO INTEGRALMENTE
 */
const colunasDef = [
  { label: "ID", idx: 1 }, { label: "CPF", idx: 2 }, { label: "NOME", idx: 3 },
  { label: "NASC", idx: 4 }, { label: "MUNICIPIO", idx: 5 }, { label: "TEL", idx: 6 },
  { label: "VIA", idx: 7 }, { label: "PARCEIRO", idx: 8 }, 
  // DATA removida daqui para não gerar checkbox
  { label: "ATENDENTE", idx: 10 }, 
  { label: "Nº BOLETO", idx: 11 }, 
  { label: "STATUS", idx: 12 },    
  { label: "MOTIVO", idx: 13 },    
  { label: "DT ATU", idx: 14 },    
  { label: "CARTEIRA", idx: 15 },  
  { label: "LOTE", idx: 16 },      
  { label: "EDITAR", idx: 17 }     
];

// DATA removida da lista de marcação automática - MANTIDO
const colunasParaMarcar = ["ID", "CPF", "NOME", "NASC", "MUNICIPIO", "TEL", "ATENDENTE", "Nº BOLETO", "EDITAR"];

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

  // Captura dos filtros básicos - MANTIDO
  const fCpf = document.getElementById("fCpf") ? document.getElementById("fCpf").value.trim() : "";
  const fNome = document.getElementById("fNome").value.toUpperCase();
  const fStatus = document.getElementById("fStatus").value.trim();
  
  // Lógica do Lote: Se veio valor do botão (valorForcado), usa ele. Se não, pega do input.
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

    // Filtro CPF - MANTIDO
    if (fCpf && td[1]) {
      const cpfLimpoTabela = td[1].innerText.replace(/\D/g, "");
      if (cpfLimpoTabela.indexOf(fCpf) === -1) mostrar = false;
    }

    // Filtro Nome - MANTIDO
    if (fNome && td[2] && td[2].innerText.toUpperCase().indexOf(fNome) === -1) mostrar = false;

    // Filtro Status - MANTIDO
    if (fStatus && td[11] && td[11].innerText.trim() !== fStatus) mostrar = false;

    // --- FILTRO LOTE (Coluna Q -> td[16]) ---
    if (fLote !== "") {
        let txtLote = td[16] ? td[16].innerText.trim().toUpperCase() : "";
        let txtLoteSec = td[15] ? td[15].innerText.trim().toUpperCase() : "";

        // Se o valor na tabela não for igual ao lote buscado (ex: # ou 10)
        if (txtLote !== fLote && txtLoteSec !== fLote) {
            mostrar = false;
        }
    }
   
    // Filtros Admin - MANTIDO
    if (isAdmin) {
      if (fVia && td[6] && td[6].innerText.toUpperCase().indexOf(fVia) === -1) mostrar = false;
      if (fParc && td[7] && td[7].innerText.toUpperCase().indexOf(fParc) === -1) mostrar = false;
      if (fAtend && td[9] && td[9].innerText.toUpperCase().indexOf(fAtend) === -1) mostrar = false;
    }

    tr[i].style.display = mostrar ? "" : "none";
    if (mostrar) contadorVisiveis++;
  }

  // Contador - MANTIDO
  const elNumLinhas = document.getElementById("numLinhas");
  if (elNumLinhas) elNumLinhas.innerText = contadorVisiveis;

  // Checkboxes - MANTIDO com proteção
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

// --- FUNÇÕES DE INTERFACE (MANTIDAS) ---
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

window.onload = gerarChecksColunas;

function atualizarRelogio() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  const segundos = String(agora.getSeconds()).padStart(2, '0');
  
  const strDataHora = `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  const el = document.getElementById("dataHoraHud");
  if(el) el.innerText = strDataHora;
}
setInterval(atualizarRelogio, 1000);

const CPF = {
  limpar(valor){ return valor.replace(/\D/g,''); },
  formatar(valor){
    let v = this.limpar(valor);
    v = v.slice(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2');
    v = v.replace(/(\d{3})(\d)/,'$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/,'$1-$2');
    return v;
  },
  validar(valor){
    let cpf = this.limpar(valor);
    if(cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma=0, resto;
    for(let i=1;i<=9;i++) soma+=parseInt(cpf.substring(i-1,i))*(11-i);
    resto=(soma*10)%11; if(resto===10||resto===11) resto=0;
    if(resto!=parseInt(cpf.substring(9,10))) return false;
    soma=0;
    for(let i=1;i<=10;i++) soma+=parseInt(cpf.substring(i-1,i))*(12-i);
    resto=(soma*10)%11; if(resto===10||resto===11) resto=0;
    return resto==parseInt(cpf.substring(10,11));
  }
};

// --- BUSCA AUTOMÁTICA (ADAPTADA PARA GITHUB) ---
document.addEventListener('blur', function(e) {
  // Certifique-se que a variável 'modoEdicao' existe no seu script global
  if (e.target.id === 'cpf' && (typeof modoEdicao !== 'undefined' && !modoEdicao)) { 
    const valorCpf = e.target.value;
    if (!CPF.validar(valorCpf)) return;
    
    document.getElementById("msgCPF").innerText = "Consultando base de dados...";

    // Trocamos google.script.run pelo fetch
    fetch(`${urlSistema}?action=buscarDadosNoBD&cpf=${valorCpf}`)
      .then(res => res.json())
      .then(res => {
        if (res && res.encontrado) {
          document.getElementById("msgCPF").innerText = "Dados recuperados!";
          document.getElementById("nome").value = res.nome || "";
          document.getElementById("municipio").value = res.municipio || "";
          document.getElementById("telefone").value = res.telefone || "";
          
          if (res.nascimento) {
            try {
              let dataStr = res.nascimento.toString();
              console.log("Data recebida:", dataStr); // Para debug
              
              // Se vier no formato ISO (yyyy-mm-dd) - EX: 1979-10-17
              if (dataStr.includes('-')) {
                const partes = dataStr.split('-');
                // partes[0] = 1979, partes[1] = 10, partes[2] = 17
                // CONVERTE PARA dd/mm/aaaa
                const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                document.getElementById("nascimento").value = dataFormatada;
                console.log("Data convertida:", dataFormatada); // Para debug
              } 
              // Se já vier no formato brasileiro (dd/mm/aaaa)
              else if (dataStr.includes('/')) {
                document.getElementById("nascimento").value = dataStr;
              }
            } catch(err) { 
              console.error("Erro ao formatar data:", err); 
            }
          }
        } else {
          document.getElementById("msgCPF").innerText = "CPF não encontrado (Novo cadastro).";
        }
      })
      .catch(err => {
        console.error("Erro na busca:", err);
        document.getElementById("msgCPF").innerText = "Erro ao conectar com o servidor.";
      });
  }
}, true);

function mostrarMenu(){
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  if(!user) return;
  
  document.getElementById("infoUsuario").innerText = user.nome + " | " + user.parceiro;
  document.getElementById("hudUsuario").style.display="flex";

  // LOGICA DO LOG (SÓ PARA ADMIN) - MANTIDA
  if(user.nome === 'admin' || user.parceiro.toString() === "97") {
    const cardLog = document.getElementById("cardLog");
    if(cardLog) cardLog.style.display = "block";
  }

  abrirTela('menuBox');
}

// ADAPTADA PARA GITHUB (Usa Fetch para buscar as 600 linhas)
function carregarDadosLog() {
  const tbody = document.getElementById("corpoLogs");
  if(!tbody) return;
  tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>Carregando Logs da Planilha...</td></tr>";

  // Chamada via URL para a função buscarLogsDaAbaLog que está no seu .gs
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
            <td>${l.usuario}</td>
            <td style="color:#fbbf24;">${l.parceiro || '-'}</td>
            <td>${l.acao}</td>
            <td style="color:#22c55e;">${l.idRef}</td>
          </tr>`;
      });
    })
    .catch(err => {
      console.error("Erro ao carregar logs:", err);
      tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red;'>Erro ao conectar com o servidor.</td></tr>";
    });
}

// --- FUNÇÃO PARA ABRIR O BOX DE EDIÇÃO ---
function prepararEdicao(item) {
  idSendoEditado = item.id; 
  
  const popUp = document.getElementById('corrigirBox');
  if(popUp) popUp.style.display = 'flex'; 

  // Preenchimento seguro dos campos
  if(document.getElementById("edit_cpf")) document.getElementById("edit_cpf").value = item.cpf || "";
  if(document.getElementById("edit_nome")) document.getElementById("edit_nome").value = item.nome || "";
  if(document.getElementById("edit_municipio")) document.getElementById("edit_municipio").value = item.municipio || "";
  if(document.getElementById("edit_telefone")) document.getElementById("edit_telefone").value = item.tel || "";
  if(document.getElementById("edit_codigoBoleto")) document.getElementById("edit_codigoBoleto").value = item.boleto || "";

  // Via Imutável (Mostra no rótulo e guarda no campo oculto)
  const viaValor = item.via || "1ª VIA";
  const labelVia = document.getElementById("edit_label_via");
  if(labelVia) labelVia.innerText = viaValor.toUpperCase();
  
  const hiddenVia = document.getElementById("edit_via_hidden");
  if(hiddenVia) hiddenVia.value = viaValor;

  // Formata Data para o input date (yyyy-mm-dd)
  if(item.nasc && document.getElementById("edit_nascimento")) {
    const p = item.nasc.split('/');
    if(p.length === 3) {
      document.getElementById("edit_nascimento").value = `${p[2]}-${p[1]}-${p[0]}`;
    }
  }
}

// --- FUNÇÃO PARA SALVAR A EDIÇÃO ---
async function executarEdicao() {
  const userStr = sessionStorage.getItem("usuario");
  if(!userStr) return alert("Sessão expirada. Faça login novamente.");
  const user = JSON.parse(userStr);
  
  const id = idSendoEditado;
  const cpf = document.getElementById("edit_cpf").value;
  const nome = document.getElementById("edit_nome").value;
  const nasc = document.getElementById("edit_nascimento").value;
  const mun = document.getElementById("edit_municipio").value;
  const tel = document.getElementById("edit_telefone").value;
  const boleto = document.getElementById("edit_codigoBoleto").value;
  const via = document.getElementById("edit_via_hidden").value;

  if(!via) {
    alert("Erro: Via não detectada.");
    return;
  }

  // Converte data de AAAA-MM-DD para DD/MM/AAAA para a planilha
  let dataFormatada = nasc;
  if(nasc && nasc.includes("-")) {
    const p = nasc.split("-");
    dataFormatada = `${p[2]}/${p[1]}/${p[0]}`;
  }

  const btn = document.querySelector("#corrigirBox button[onclick='executarEdicao()']");
  if(btn) { btn.disabled = true; btn.innerText = "SALVANDO..."; }

  const urlFinal = `${urlSistema}?action=editarCadastroAppsScript` +
    `&id=${encodeURIComponent(id)}` +
    `&cpf=${encodeURIComponent(cpf)}` +
    `&nome=${encodeURIComponent(nome)}` +
    `&nasc=${encodeURIComponent(dataFormatada)}` +
    `&municipio=${encodeURIComponent(mun)}` +
    `&tel=${encodeURIComponent(tel)}` +
    `&via=${encodeURIComponent(via)}` + 
    `&atendente=${encodeURIComponent(user.nome)}` +
    `&parceiro=${encodeURIComponent(user.parceiro)}` +
    `&boleto=${encodeURIComponent(boleto)}`;

  try {
    const response = await fetch(urlFinal);
    const res = await response.json();
    if (res.sucesso) {
      alert("✅ Atualizado com sucesso!");
      document.getElementById('corrigirBox').style.display = 'none';
      if(typeof carregarLista === "function") carregarLista();
    } else {
      alert("Erro ao salvar: " + res.erro);
    }
  } catch (error) {
    alert("Erro de conexão com o servidor.");
  } finally {
    if(btn) { btn.disabled = false; btn.innerText = "SALVAR ALTERAÇÕES"; }
  }
}

// FUNÇÃO 2: Envia os dados corrigidos para o Apps Script
async function executarEdicao() {
  const userStr = sessionStorage.getItem("usuario");
  if(!userStr) return alert("Sessão expirada. Faça login novamente.");
  const user = JSON.parse(userStr);
  
  // Captura dos dados da tela de correção
  const id = idSendoEditado;
  const cpf = document.getElementById("edit_cpf").value;
  const nome = document.getElementById("edit_nome").value;
  const nasc = document.getElementById("edit_nascimento").value;
  const mun = document.getElementById("edit_municipio").value;
  const tel = document.getElementById("edit_telefone").value;
  const boleto = document.getElementById("edit_codigoBoleto").value;
  const via = document.getElementById("edit_via_hidden").value;

  if(!via) {
    alert("Erro crítico: A Via não foi detectada.");
    return;
  }

  // Formata data para o padrão da planilha (DD/MM/AAAA)
  let dataFormatada = nasc;
  if(nasc && nasc.includes("-")) {
    const p = nasc.split("-");
    dataFormatada = `${p[2]}/${p[1]}/${p[0]}`;
  }

  const btn = document.querySelector("button[onclick='executarEdicao()']");
  if(btn) { btn.disabled = true; btn.innerText = "SALVANDO..."; }

  const urlFinal = `${urlSistema}?action=editarCadastroAppsScript` +
    `&id=${encodeURIComponent(id)}` +
    `&cpf=${encodeURIComponent(cpf)}` +
    `&nome=${encodeURIComponent(nome)}` +
    `&nasc=${encodeURIComponent(dataFormatada)}` +
    `&municipio=${encodeURIComponent(mun)}` +
    `&tel=${encodeURIComponent(tel)}` +
    `&via=${encodeURIComponent(via)}` + 
    `&atendente=${encodeURIComponent(user.nome)}` +
    `&parceiro=${encodeURIComponent(user.parceiro)}` +
    `&boleto=${encodeURIComponent(boleto)}`;

  try {
    const response = await fetch(urlFinal);
    const res = await response.json();

    if (res.sucesso) {
      alert("✅ Registro atualizado com sucesso!");
      document.getElementById('corrigirBox').style.display = 'none';
      if(typeof carregarLista === "function") carregarLista();
    } else {
      alert("Erro ao salvar: " + res.erro);
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro de conexão com o servidor.");
  } finally {
    if(btn) { btn.disabled = false; btn.innerText = "SALVAR DADOS"; }
  }
} // <--- FECHAMENTO CORRETO DA executarEdicao

async function salvarCadastro() {
  const userStr = sessionStorage.getItem("usuario");
  if(!userStr) { alert("Sessão expirada. Faça login novamente."); return; }
  const user = JSON.parse(userStr);
  
  const cpf = document.getElementById("cpf").value;
  const nome = document.getElementById("nome").value;
  const nascRaw = document.getElementById("nascimento").value;
  const mun = document.getElementById("municipio").value;
  const tel = document.getElementById("telefone").value;
  
  // Aqui pegamos se é 1ª ou 2ª VIA - o critério que você mencionou
  const viaEl = document.querySelector('input[name="via"]:checked');
  const via = viaEl ? viaEl.value : "1ª VIA";
  const boleto = document.getElementById("codigoBoleto").value.trim();

  if(!cpf || !nome || !nascRaw || !boleto) { 
    alert("ERRO: CPF, Nome, Nascimento e Número do Boleto são obrigatórios!"); 
    return; 
  }

  // --- NOVA VERIFICAÇÃO DE BOLETO DUPLICADO (SÓ PARA CADASTRO NOVO) ---
  if (!idSendoEditado) { // Só verifica se NÃO é edição
    const btn = document.querySelector("button[onclick='salvarCadastro()']");
    if(btn) { btn.disabled = true; btn.innerText = "Verificando..."; }
    
    try {
      // Faz uma requisição para verificar se o boleto já existe
      const response = await fetch(`${urlSistema}?action=verificarBoleto&boleto=${encodeURIComponent(boleto)}`);
      const res = await response.json();
      
      if (res.existe) {
        alert("❌ Este número de boleto já foi cadastrado! Use outro número.");
        if(btn) { btn.disabled = false; btn.innerText = "CADASTRAR"; }
        return; // INTERROMPE O CADASTRO
      }
    } catch (error) {
      console.error("Erro ao verificar boleto:", error);
      // Se der erro na verificação, CONTINUA o cadastro mesmo assim
      // (não queremos travar o sistema se a verificação falhar)
    }
  }
  // --- FIM DA VERIFICAÇÃO ---

  // --- LÓGICA IGUAL À TROCA DE SENHA (MULTICRITÉRIO) ---
  // Se idSendoEditado existe, enviamos a ação de EDITAR.
  // O servidor vai usar o ID + CPF + VIA para garantir que está editando a VIA certa.
  const idFinal = (typeof idSendoEditado !== 'undefined' && idSendoEditado) ? idSendoEditado : "";
  const acao = idFinal ? "editarCadastroAppsScript" : "salvarCadastroAppsScript";

  const btn = document.querySelector("button[onclick='salvarCadastro()']");
  if(btn) { btn.disabled = true; btn.innerText = "Processando..."; }

  // Montamos a URL enviando o COMBO (ID, CPF e VIA)
  // Assim o Apps Script localiza a linha exata (ex: a 2ª via daquele CPF)
  const urlFinal = urlSistema + 
    "?action=" + acao +
    "&id=" + encodeURIComponent(idFinal) + 
    "&cpf=" + encodeURIComponent(cpf) +
    "&nome=" + encodeURIComponent(nome) +
    "&nasc=" + encodeURIComponent(nascRaw) +
    "&municipio=" + encodeURIComponent(mun) +
    "&tel=" + encodeURIComponent(tel) +
    "&via=" + encodeURIComponent(via) + // Crucial para diferenciar 1ª de 2ª via
    "&atendente=" + encodeURIComponent(user.nome) +
    "&parceiro=" + encodeURIComponent(user.parceiro) +
    "&boleto=" + encodeURIComponent(boleto);

  try {
    const response = await fetch(urlFinal);
    const res = await response.json();

    if (res.sucesso) {
      alert(idFinal ? `✅ ${via} ATUALIZADA com sucesso!` : "✅ Cadastro SALVO com sucesso!");

      // --- SEU PROTOCOLO (MANTIDO 100% INTEGRAL) ---
      try {
          if (typeof imprimirProtocolo === "function") {
            imprimirProtocolo(
              res.id || idFinal, 
              res.cpf || cpf, 
              res.nome || nome, 
              res.nasc || nascRaw, 
              mun, 
              via, 
              user.nome, 
              user.parceiro, 
              res.data, 
              res.boleto || boleto
            );
          }
      } catch (errPrint) {
        console.error("Erro na impressão:", errPrint);
      }

      // --- SUA LIMPEZA DE CAMPOS (MANTIDA 100% INTEGRAL) ---
      document.getElementById("cpf").value = "";
      document.getElementById("nome").value = "";
      document.getElementById("nascimento").value = "";
      document.getElementById("municipio").value = "";
      document.getElementById("telefone").value = "";
      document.getElementById("codigoBoleto").value = "";
      
      // Reseta para o próximo não ser edição
      if(typeof idSendoEditado !== 'undefined') idSendoEditado = null;

    } else {
      // Se der erro de CPF/VIA já existente, o aviso vem daqui
      alert("Aviso: " + res.erro);
    }
  } catch (error) {
    console.error("Erro fatal:", error);
    alert("Erro de conexão.");
  } finally {
    if(btn) { btn.disabled = false; btn.innerText = "CADASTRAR"; }
  }
}

// --- IMPRIMIR PROTOCOLO (CORRIGIDA PARA EVITAR ERRO DE POP-UP) ---
function imprimirProtocolo(id, cpf, nome, nascimento, municipio, via, atendente, parceiro, data, boleto) {
  const telaPrint = window.open('', '_blank');

  if (!telaPrint || telaPrint.closed || typeof telaPrint.document === 'undefined') {
    alert("⚠️ O cadastro foi salvo, mas o seu navegador BLOQUEOU a janela de impressão.\n\nVerifique a barra de endereços e clique em 'Sempre permitir pop-ups' para este site.");
    return; 
  }

  telaPrint.document.write(`
    <html>
    <head>
      <title>Protocolo CTR - ${id}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          width: 210mm;
          height: 297mm;
          font-family: Arial, sans-serif;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .ticket {
          width: 190mm;
          margin-top: 5mm;
          border: 2px solid #000;
          padding: 5mm;
          background: white;
          font-size: 11px;
          height: 140mm;
          display: flex;
          flex-direction: column;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          margin-bottom: 4mm;
          padding-bottom: 2mm;
        }
        
        .header h2 {
          font-size: 18px;
          margin: 1mm 0;
        }
        
        .id-destaque {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 3mm;
        }
        
        .info-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-bottom: 3mm;
          font-size: 12px;
        }
        
        .info-item {
          width: 48%;
          margin-bottom: 2mm;
        }
        
        .lgpd {
          font-size: 8px;
          font-style: italic;
          margin: 4mm 0;
          border-top: 1px solid #ccc;
          border-bottom: 1px solid #ccc;
          padding: 2mm 0;
          text-align: justify;
        }
        
        .rules {
          font-size: 10px;
          background: #f2f2f2;
          padding: 3mm;
          border: 1px solid #000;
          margin: 4mm 0;
          line-height: 1.4;
        }
        
        /* ÁREA FINAL - ASSINATURA E RODAPÉ */
        .final-section {
          margin-top: auto;
          display: flex;
          flex-direction: column;
        }
        
        /* LINHA DA ASSINATURA */
        .assinatura-linha {
          border-top: 2px solid #000;
          width: 100%;
          margin: 5mm 0 1mm 0;
        }
        
        /* CONTAINER DA ASSINATURA E VIA */
        .assinatura-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: bold;
          margin-top: 1mm;
        }
        
        .via-info {
          white-space: nowrap;
        }
        
        .assinatura-texto {
          white-space: nowrap;
        }
        
        b {
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h2>PROTOCOLO DE SOLICITAÇÃO</h2>
          <div class="id-destaque">Nº BOLETO: ${boleto}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item"><b>NOME:</b> ${nome ? nome.toUpperCase() : ''}</div>
          <div class="info-item"><b>DATA:</b> ${data ? data.split(' ')[0] : ''}</div>
          <div class="info-item"><b>CPF:</b> ${cpf}</div>
          <div class="info-item"><b>VIA:</b> ${via}</div>
          <div class="info-item"><b>MUNICÍPIO:</b> ${municipio ? municipio.toUpperCase() : ''}</div>
          <div class="info-item"><b>ATENDENTE:</b> ${atendente}</div>
        </div>
        
        <div class="lgpd">
          Não nos responsabilizamos por informações no formulário entregue que divergirem dos documentos anexos, conforme Art. 9º da Lei 13.709/2018 (LGPD). A veracidade é de responsabilidade do declarante.
        </div>

        <div class="rules">
          <strong>Procedimento para Entrega da Carteira Estudantil:</strong><br>
          • Aluno, mãe, pai, irmãos ou filhos: Apresentar o comprovante de solicitação original e um documento oficial com foto.<br>
          • (Em caso de perda ou extravio do comprovante, apresentar uma cópia do documento oficial com foto de quem for receber.)<br>
          • Tios, primos, demais parentes ou terceiros: Apresentar o comprovante de solicitação original e um documento oficial com foto de quem estiver recebendo, juntamente com uma cópia do documento oficial do aluno.<br><br>
          <strong>EM HIPÓTESE ALGUMA ENTREGAREMOS A TERCEIROS SEM O COMPROVANTE DE SOLICITAÇÃO ORIGINAL EM MÃOS.</strong>
        </div>

        <!-- SEÇÃO FINAL - EXATAMENTE COMO NA SUA IMAGEM -->
        <div class="final-section">
          <div class="assinatura-linha"></div>
          <div class="assinatura-container">
            <span class="via-info">Via do Aluno / ${parceiro} / ID: ${id}</span>
            <span class="assinatura-texto">Assinatura do Requerente</span>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { 
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      <\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}

// --- TROCAR SENHA (ADAPTADA) ---
function salvarSenha() {
  const login = document.getElementById("usuarioTroca").value.trim();
  const atual = document.getElementById("senhaAtual").value.trim();
  const nova = document.getElementById("novaSenha").value.trim();
  const conf = document.getElementById("confSenha").value.trim();
  if(nova !== conf) { alert("A nova senha não coincide!"); return; }

  fetch(`${urlSistema}?action=trocarSenha&user=${login}&passAtual=${atual}&passNova=${nova}`)
    .then(res => res.json())
    .then(res => {
      if(res.sucesso) { alert("Senha alterada!"); fecharSenha(); }
      else { alert("Erro ao alterar senha: " + (res.erro || "Verifique os dados")); }
    })
    .catch(err => alert("Erro de conexão"));
}

// --- BUSCA GERAL (ADAPTADA) ---
function executarBuscaGeral(tipo) {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  const valor = document.getElementById("valorPesquisa").value;
  if(!valor) return alert("Digite algo para pesquisar");
  
  document.getElementById("resultadoPesquisa").innerHTML = "Pesquisando...";
  
  fetch(`${urlSistema}?action=pesquisarNoCadastroGeral&valor=${valor}&tipo=${tipo}&parceiro=${user.parceiro}`)
    .then(res => res.json())
    .then(res => {
      const div = document.getElementById("resultadoPesquisa");
      div.innerHTML = "";
      
      if(!res || res.length === 0) {
        div.innerHTML = "Nenhum registro encontrado ou sem permissão.";
        return;
      }
      
      res.forEach(item => {
        let dStat = "";
        for(let key in item) {
          if(key.toUpperCase().replace(/\s/g,'') === "DATASTATUS") dStat = item[key];
        }
        if(!dStat) dStat = item.dataStatus || item.data_status || item["DATA STATUS"] || "";

        div.innerHTML += `
          <div class="res-card">
            <b>NOME:</b> ${item.nome}<br>
            <b>CPF:</b> ${item.cpf} | <b>VIA:</b> ${item.via}<br>
            <b>MUNICÍPIO:</b> ${item.municipio} | <b>PARCEIRO:</b> ${item.parceiro}<br>
            <b>CARTEIRA:</b> ${item.numCarteira || 'N/A'}<br>
            <b>STATUS:</b> ${item.status || 'Pendente'} | <b>MOTIVO:</b> ${item.motivo || '-'}<br>
            <b>DATA STATUS:</b> ${dStat}<br>
            <b>BOLETO:</b> ${item.situacao || item.r || '-'}<br>
            <b>PRAZO PENDÊNCIA:</b> ${item.prazoPendencia || item.s || '-'}<br>
            <b>ATENDENTE:</b> ${item.atendente}<br>
            <small>Última Atualização: ${item.dataAtu}</small>
          </div>
        `;
      });
    })
    .catch(err => alert("Erro ao pesquisar"));
}

// --- RESTANTE DAS FUNÇÕES (MANTIDAS E AJUSTADAS) ---
// --- VIGIA GLOBAL DE INPUTS ---
document.addEventListener('input', function (e) {
  if (e.target.tagName === 'INPUT') {
    // 1. LISTA DE EXCEÇÕES (Campos que PODEM ter letras minúsculas)
    const excecoes = ['login', 'senha', 'usuarioTroca', 'senhaAtual', 'novaSenha', 'confSenha'];

    // 2. APLICA MAIÚSCULO SE NÃO FOR EXCEÇÃO
    if (!excecoes.includes(e.target.id)) {
      e.target.value = e.target.value.toUpperCase();
    }
  }

  // --- LÓGICA DE MÁSCARA DE CPF ---
  const camposCpfObrigatorio = ['cpf', 'cpfTerceiro'];
  if (camposCpfObrigatorio.includes(e.target.id)) {
      e.target.value = CPF.formatar(e.target.value);
  }

  // --- VALIDAÇÃO CPF DO ALUNO (CADASTRO) ---
  if(e.target.id === 'cpf') {
    const v = CPF.validar(e.target.value);
    const msg = document.getElementById("msgCPF");
    if(msg) {
      msg.innerText = v ? "CPF VÁLIDO" : "CPF INVÁLIDO";
      msg.className = v ? "valid" : "invalid";
    }
    const btnSalvar = document.getElementById("btnSalvar");
    if(btnSalvar) btnSalvar.disabled = !v;
  }

  // --- VALIDAÇÃO CPF DO TERCEIRO (ENTREGA) ---
  if(e.target.id === 'cpfTerceiro') {
    const v = CPF.validar(e.target.value);
    
    // Adicionando a mensagem visual que faltava para o terceiro
    const msgT = document.getElementById("msgCPFTerceiro");
    if(msgT) {
       if (e.target.value.length > 0) {
         msgT.innerText = v ? "CPF VÁLIDO" : "CPF INVÁLIDO";
         msgT.style.color = v ? "#22c55e" : "#ef4444";
         msgT.style.fontSize = "11px";
         msgT.style.fontWeight = "bold";
       } else {
         msgT.innerText = "";
       }
    }

    if (e.target.value.length === 14) {
      e.target.style.border = v ? "2px solid #22c55e" : "2px solid #ef4444";
    } else {
      e.target.style.border = "";
    }
    
    const btnEntrega = document.getElementById("btnConfirmarEntrega");
    if(btnEntrega) btnEntrega.disabled = !v;
  }

  // --- LIMPEZA DE CÓDIGO CTR (SOMENTE NÚMEROS) ---
  if(e.target.id === 'codigoCtr') e.target.value = e.target.value.replace(/\D/g, "");
});

function abrirSenha(){ document.getElementById("modalSenha").style.display="flex"; }
function fecharSenha(){ document.getElementById("modalSenha").style.display="none"; }

function carregarLista() {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  const isAdmin = (user.parceiro.toString() === "97");
  
  const fAdmin = document.getElementById("filtrosAdmin");
  if(fAdmin) {
    fAdmin.style.display = "flex";
    fAdmin.style.flexDirection = "row";
    fAdmin.style.flexWrap = "wrap";
    fAdmin.style.gap = "5px";
    fAdmin.style.alignItems = "center";
    fAdmin.style.padding = "10px";
    fAdmin.style.background = "#0f172a";
    fAdmin.style.borderRadius = "8px";
    fAdmin.style.marginBottom = "10px";
    
    if(!document.getElementById("fLote")){
       const inputLote = document.createElement("input");
       inputLote.id = "fLote";
       inputLote.placeholder = "LOTE";
       inputLote.onkeyup = filtrarTabelaAvancado;
       inputLote.style.width = "70px";
       fAdmin.appendChild(inputLote);
    }

    const inputsFiltro = fAdmin.querySelectorAll("input, select");
    inputsFiltro.forEach(el => {
       el.style.width = el.id === "fNome" ? "200px" : el.id === "fLote" ? "70px" : "auto";
       el.style.padding = "5px";
       el.style.fontSize = "12px";
       el.style.border = "1px solid #334155";
       el.style.borderRadius = "4px";
       el.style.background = "#1e293b";
       el.style.color = "white";
    });
  }
  
  const cabecalho = document.getElementById("cabecalhoTabela");
  const colNames = ["ID", "CPF", "NOME", "NASC", "MUNICIPIO", "TEL", "VIA", "PARCEIRO", "DATA", "ATENDENTE", "BOLETO", "STATUS", "MOTIVO", "DATA STATUS", "NUM CARTEIRA", "LOTE", "AÇÕES"];
  
  cabecalho.innerHTML = colNames.map((name, idx) => `<th class="col-${idx}">${name}</th>`).join("");

  if(!document.getElementById("containerChecks")){
    const divChecks = document.createElement("div");
    divChecks.id = "containerChecks";
    divChecks.style = "display:flex; flex-wrap:wrap; gap:10px; padding:10px; background:#1e293b; border-radius:8px; margin-bottom:10px; font-size:11px; color:#22c55e; border:1px solid #334155;";
    divChecks.innerHTML = "<div style='width:100%; color:white; font-weight:bold; margin-bottom:5px;'>Exibir/Ocultar Colunas:</div>";
    colNames.forEach((name, idx) => {
      divChecks.innerHTML += `<label style="cursor:pointer;"><input type="checkbox" checked onclick="alternarColuna(${idx})"> ${name}</label>`;
    });
    
    
    
    document.getElementById("listasBox").prepend(divChecks);
  }

  document.getElementById("corpoTabelaListas").innerHTML = "<tr><td colspan='17'>Carregando dados...</td></tr>";
  
  // ADAPTAÇÃO FETCH PARA OBTENÇÃO DE LISTA
  fetch(`${urlSistema}?action=obterListaCadastros&parceiro=${user.parceiro}`)
    .then(res => res.json())
    .then(dados => {
      const tbody = document.getElementById("corpoTabelaListas");
      tbody.innerHTML = "";
      
      dados.forEach(item => {
        let valDataStatus = "";
        for (let key in item) {
          let normalizedKey = key.toUpperCase().replace(/\s|_/g, "");
          if (normalizedKey === "DATASTATUS") { valDataStatus = item[key]; break; }
        }
        
        let valTel = "";
        for (let key in item) {
          let normalizedKey = key.toUpperCase().replace(/\s|_/g, "");
          if (normalizedKey === "TEL" || normalizedKey === "TELEFONE") { valTel = item[key]; break; }
        }

        tbody.innerHTML += `<tr>
          <td class="col-0">${item.id || ''}</td>
          <td class="col-1">${item.cpf || ''}</td>
          <td class="col-2">${item.nome || ''}</td>
          <td class="col-3">${item.nasc || ''}</td>
          <td class="col-4">${item.municipio || ''}</td>
          <td class="col-5">${valTel}</td>
          <td class="col-6">${item.via || ''}</td>
          <td class="col-7">${item.parceiro || ''}</td>
          <td class="col-8">${item.data || ''}</td>
          <td class="col-9">${item.atendente || ''}</td>
          <td class="col-10">${item.boleto || ''}</td>
          <td class="col-11"><b>${item.status || ''}</b></td>
          <td class="col-12">${item.motivo || ''}</td>
          <td class="col-13">${valDataStatus}</td>
          <td class="col-14">${item.carteira || ''}</td>
          <td class="col-15">${item.lote || ''}</td>
          <td class="col-16">
            <button onclick='prepararEdicao(${JSON.stringify(item)})' style="background:#f59e0b; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Editar</button>
          </td>
        </tr>`;
      });
      
      const checks = document.getElementById("containerChecks").querySelectorAll("input");
      checks.forEach((chk, i) => { if(!chk.checked) aplicarOcultacao(i, false); });
    })
    .catch(err => {
      document.getElementById("corpoTabelaListas").innerHTML = "<tr><td colspan='17' style='color:red;'>Erro ao carregar lista do servidor.</td></tr>";
    });
}

function alternarColuna(idx) { aplicarOcultacao(idx, event.target.checked); }
function aplicarOcultacao(idx, exibir) {
  document.querySelectorAll(`.col-${idx}`).forEach(c => c.style.display = exibir ? "" : "none");
}

function fecharLotePorParceiro() {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  if(!confirm("Deseja fechar o lote atual para o parceiro " + user.parceiro + "?")) return;
  
  fetch(`${urlSistema}?action=fecharLoteAppsScript&parceiro=${user.parceiro}`)
    .then(res => res.json())
    .then(res => {
      if(res.sucesso) {
        alert("Lote fechado com sucesso! Lote: " + res.loteGerado);
        carregarLista();
      } else {
        alert("Erro ao fechar lote: " + res.erro);
      }
    })
    .catch(err => alert("Erro na conexão ao fechar lote."));
}

// --- BUSCA ÚNICA (Corrigida para GitHub) ---
document.addEventListener('blur', function(e){
  if(e.target.id === "codigoCtr"){
    const ctr = e.target.value.trim();
    if(!ctr) return;

    const userStr = sessionStorage.getItem("usuario");
    if(!userStr) return;
    const user = JSON.parse(userStr);

    // No GitHub, usamos FETCH em vez de google.script.run
    fetch(`${urlSistema}?action=buscarPorCodigoAppsScript&ctr=${ctr}&parceiro=${user.parceiro}`)
      .then(res => res.json())
      .then(aluno => {
        if(aluno && aluno.encontrado) {
          alunoEncontradoGlobal = aluno;
          document.getElementById("resNomeAluno").innerText = aluno.nome;
          document.getElementById("resCpfAluno").innerText = aluno.cpf; 
          document.getElementById("infoAlunoEntrega").style.display = "block";

          // Marca o rádio automaticamente conforme a via do cadastro
          if(aluno.via) {
            const vLimpa = aluno.via.toString().replace(/\D/g, '');
            const radioVia = document.getElementById("via" + vLimpa);
            if(radioVia) radioVia.checked = true;
          }
        } else {
          document.getElementById("infoAlunoEntrega").style.display = "none";
          alunoEncontradoGlobal = null;
          alert("CTR não encontrado!");
        }
      })
      .catch(err => console.error("Erro na busca:", err));
  }
}, true);

// --- SALVAR ENTREGA (Corrigida para GitHub) ---
function salvarEntrega() {
  const ctr = document.getElementById("codigoCtr").value;
  const isTerceiro = document.getElementById("checkTerceiro").checked;
  
  if(!alunoEncontradoGlobal) { 
    alert("Informe um CTR válido e aguarde a busca."); 
    return; 
  }
  
  const nomeRecebedor = isTerceiro ? document.getElementById("nomeTerceiro").value : alunoEncontradoGlobal.nome;
  const cpfRecebedor = isTerceiro ? document.getElementById("cpfTerceiro").value : alunoEncontradoGlobal.cpf;
  const vinculo = isTerceiro ? document.getElementById("parentesco").value : "Titular";
  
  const viaEl = document.querySelector('input[name="viaEntrega"]:checked');
  const via = viaEl ? viaEl.value : "1";

  if(isTerceiro && (!nomeRecebedor || !cpfRecebedor || !vinculo)) { 
    alert("Preencha todos os campos do recebedor!"); 
    return; 
  }

  const user = JSON.parse(sessionStorage.getItem("usuario"));

  const btn = document.querySelector("button[onclick='salvarEntrega()']");
  if(btn) { btn.disabled = true; btn.innerText = "Gravando..."; }

  const urlFinal = `${urlSistema}?action=registrarEntregaAppsScript` +
    `&ctr=${encodeURIComponent(ctr)}` +
    `&cpfAluno=${encodeURIComponent(alunoEncontradoGlobal.cpf)}` +
    `&nomeAluno=${encodeURIComponent(alunoEncontradoGlobal.nome)}` +
    `&cpfRec=${encodeURIComponent(cpfRecebedor)}` +
    `&nomeRec=${encodeURIComponent(nomeRecebedor)}` +
    `&vinculo=${encodeURIComponent(vinculo)}` +
    `&atendente=${encodeURIComponent(user.nome)}` +
    `&parceiro=${encodeURIComponent(user.parceiro)}` +
    `&via=${encodeURIComponent(via)}`;

  fetch(urlFinal)
    .then(res => res.json())
    .then(res => {
      if(res.sucesso) {
        // ORDEM CORRETA: PRIMEIRO O ALERTA
        alert("✅ Entrega realizada com sucesso!");

        // SEGUNDO: DISPARA A IMPRESSÃO
        imprimirProtocoloEntrega(ctr, alunoEncontradoGlobal.nome, alunoEncontradoGlobal.cpf, nomeRecebedor, cpfRecebedor, vinculo, user.nome, via);

        // TERCEIRO: LIMPEZA DOS CAMPOS
        document.getElementById("codigoCtr").value = "";
        document.getElementById("infoAlunoEntrega").style.display = "none";
        
        if(isTerceiro) {
          document.getElementById("nomeTerceiro").value = "";
          document.getElementById("cpfTerceiro").value = "";
          document.getElementById("parentesco").value = "";
          document.getElementById("checkTerceiro").checked = false;
          if(typeof toggleTerceiro === "function") toggleTerceiro();
        }
        
        const v1 = document.getElementById("via1");
        if(v1) v1.checked = true;
        
        alunoEncontradoGlobal = null;
      } else {
        alert("❌ Erro ao salvar: " + res.erro);
      }
    })
    .catch(err => {
      console.error("Erro na entrega:", err);
      alert("Erro de conexão com o servidor.");
    })
    .finally(() => {
      if(btn) { btn.disabled = false; btn.innerText = "CONFIRMAR ENTREGA"; }
    });
}

// FUNÇÃO PARA MOSTRAR/ESCONDER CAMPOS DE TERCEIRO
// FUNÇÃO PARA MOSTRAR/ESCONDER CAMPOS DE TERCEIRO
function toggleTerceiro() {
    const checkTerceiro = document.getElementById("checkTerceiro");
    const camposTerceiro = document.getElementById("camposTerceiro");
    const nomeTerceiro = document.getElementById("nomeTerceiro");
    const cpfTerceiro = document.getElementById("cpfTerceiro");
    const parentesco = document.getElementById("parentesco");
    
    if (checkTerceiro && camposTerceiro) {
        if (checkTerceiro.checked) {
            // Mostra os campos
            camposTerceiro.style.display = "block";
            
            // Remove disabled e readOnly se existirem
            if (nomeTerceiro) {
                nomeTerceiro.disabled = false;
                nomeTerceiro.readOnly = false;
                nomeTerceiro.required = true;
                nomeTerceiro.style.background = "#1e293b";
            }
            
            if (cpfTerceiro) {
                cpfTerceiro.disabled = false;
                cpfTerceiro.readOnly = false;
                cpfTerceiro.required = true;
                cpfTerceiro.style.background = "#1e293b";
            }
            
            if (parentesco) {
                parentesco.disabled = false;
                parentesco.required = true;
                parentesco.style.background = "#1e293b";
            }
            
            // Limpa os campos
            if (nomeTerceiro) nomeTerceiro.value = "";
            if (cpfTerceiro) cpfTerceiro.value = "";
            if (parentesco) parentesco.value = "";
            
        } else {
            // Esconde os campos
            camposTerceiro.style.display = "none";
            
            // Desabilita e limpa os campos
            if (nomeTerceiro) {
                nomeTerceiro.disabled = true;
                nomeTerceiro.readOnly = true;
                nomeTerceiro.value = "";
                nomeTerceiro.style.background = "#0f172a";
            }
            
            if (cpfTerceiro) {
                cpfTerceiro.disabled = true;
                cpfTerceiro.readOnly = true;
                cpfTerceiro.value = "";
                cpfTerceiro.style.background = "#0f172a";
            }
            
            if (parentesco) {
                parentesco.disabled = true;
                parentesco.value = "";
                parentesco.style.background = "#0f172a";
            }
            
            // Limpa mensagem de CPF
            const msgCpf = document.getElementById("msgCPFTerceiro");
            if (msgCpf) msgCpf.innerText = "";
        }
    }
}

// FUNÇÕES DE IMPRESSÃO, ADMIN E MASCARA (MANTIDAS 100% COMO VOCÊ ENVIOU)
function imprimirProtocoloEntrega(ctr, aluno, cpfA, recebedor, cpfR, vinculo, atendente, via) {
  const telaPrint = window.open('', '_blank');
  const dataHora = new Date().toLocaleString('pt-BR');
  
  if (!telaPrint) {
    alert("Pop-up bloqueado! Por favor, permita pop-ups para imprimir o comprovante.");
    return;
  }

  telaPrint.document.write(`
    <html>
    <head>
      <title>Entrega CTR ${ctr}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          width: 210mm;
          height: 297mm;
          font-family: Arial, sans-serif;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .ticket {
          width: 190mm;
          margin-top: 5mm;
          border: 2px solid #000;
          padding: 5mm;
          background: white;
          font-size: 11px;
          height: 140mm; /* Metade da folha A4 */
          display: flex;
          flex-direction: column;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          margin-bottom: 4mm;
          padding-bottom: 2mm;
        }
        
        .header h2 {
          font-size: 18px;
          margin: 1mm 0;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: bold;
          background: #f2f2f2;
          padding: 2mm;
          border: 1px solid #000;
          margin: 3mm 0 2mm 0;
        }
        
        .info-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-bottom: 2mm;
          font-size: 12px;
        }
        
        .info-item {
          width: 48%;
          margin-bottom: 2mm;
        }
        
        .declaracao {
          font-size: 10px;
          line-height: 1.4;
          text-align: justify;
          border: 1px dashed #000;
          padding: 3mm;
          margin: 3mm 0;
        }
        
        /* ÁREA FINAL - ASSINATURA E RODAPÉ */
        .final-section {
          margin-top: auto;
          display: flex;
          flex-direction: column;
        }
        
        /* LINHA DA ASSINATURA */
        .assinatura-linha {
          border-top: 2px solid #000;
          width: 100%;
          margin: 5mm 0 1mm 0;
        }
        
        /* CONTAINER DA ASSINATURA E CTR */
        .assinatura-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: bold;
          margin-top: 1mm;
        }
        
        .ctr-info {
          white-space: nowrap;
        }
        
        .assinatura-texto {
          white-space: nowrap;
        }
        
        .data-atendente {
          text-align: right;
          font-size: 9px;
          margin-top: 1mm;
          color: #555;
        }
        
        b {
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h2>COMPROVANTE DE ENTREGA</h2>
        </div>
        
        <div class="section-title">DADOS DO ALUNO</div>
        <div class="info-grid">
          <div class="info-item"><b>CTR:</b> ${ctr}</div>
          <div class="info-item"><b>VIA:</b> ${via}ª VIA</div>
          <div class="info-item"><b>ALUNO:</b> ${aluno}</div>
          <div class="info-item"><b>CPF:</b> ${cpfA}</div>
        </div>

        <div class="declaracao">
          Declaro que recebi, nesta data, a Carteira de Estudante Macrorregião 2026, emitida conforme os dados informados e conferidos no ato da entrega. Estou ciente de que o documento é pessoal e intransferível, comprometendo-me a zelar por sua conservação, ciente de que, em caso de perda, extravio ou dano, será necessária nova solicitação conforme as normas vigentes.
        </div>

        <div class="section-title">DADOS DO RECEBEDOR</div>
        <div class="info-grid">
          <div class="info-item"><b>NOME:</b> ${recebedor}</div>
          <div class="info-item"><b>CPF:</b> ${cpfR}</div>
          <div class="info-item"><b>VÍNCULO:</b> ${vinculo}</div>
        </div>

        <!-- SEÇÃO FINAL - IGUAL AO PROTOCOLO DE CADASTRO -->
        <div class="final-section">
          <div class="assinatura-linha"></div>
          <div class="assinatura-container">
            <span class="ctr-info">CTR: ${ctr} / ${via}ª VIA</span>
            <span class="assinatura-texto">Assinatura do Recebedor</span>
          </div>
          <div class="data-atendente">
            ${atendente} - ${dataHora}
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { 
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      <\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}

function mascaraData(campo) {
  var v = campo.value.replace(/\D/g, "");
  if (v.length >= 2) v = v.substring(0, 2) + "/" + v.substring(2);
  if (v.length >= 5) v = v.substring(0, 5) + "/" + v.substring(5, 9);
  campo.value = v;
}

async function executarConserto() {
  const userStr = sessionStorage.getItem("usuario");
  if(!userStr) { alert("Sessão expirada!"); return; }
  const user = JSON.parse(userStr);
  
  const id = idSendoEditado;
  const cpf = document.getElementById("cpf").value;
  const nome = document.getElementById("nome").value;
  const nascRaw = document.getElementById("nascimento").value;
  const mun = document.getElementById("municipio").value;
  const tel = document.getElementById("telefone").value;
  const boleto = document.getElementById("codigoBoleto").value.trim();
  
  const viaEl = document.querySelector('input[name="via"]:checked');
  const via = viaEl ? viaEl.value : "1ª VIA";

  if(!cpf || !nome || !nascRaw || !boleto) { 
    alert("ERRO: CPF, Nome, Nascimento e Número do Boleto são obrigatórios!"); 
    return; 
  }

  // Formata data para o padrão dd/mm/aaaa antes de enviar
  let nascParaEnvio = nascRaw;
  if(nascRaw.includes("-")) {
    const p = nascRaw.split("-");
    nascParaEnvio = `${p[2]}/${p[1]}/${p[0]}`;
  }

  // LÓGICA DA SENHA: Envia action de editar e o ID da linha
  const urlFinal = urlSistema + 
    "?action=editarCadastroAppsScript" +
    "&id=" + encodeURIComponent(id) + 
    "&cpf=" + encodeURIComponent(cpf) +
    "&nome=" + encodeURIComponent(nome) +
    "&nasc=" + encodeURIComponent(nascParaEnvio) +
    "&municipio=" + encodeURIComponent(mun) +
    "&tel=" + encodeURIComponent(tel) +
    "&via=" + encodeURIComponent(via) +
    "&atendente=" + encodeURIComponent(user.nome) +
    "&parceiro=" + encodeURIComponent(user.parceiro) +
    "&boleto=" + encodeURIComponent(boleto);

  const btn = document.querySelector("button[onclick='executarConserto()']");
  if(btn) { btn.disabled = true; btn.innerText = "ATUALIZANDO..."; }

  try {
    const response = await fetch(urlFinal);
    const res = await response.json();

    if (res.sucesso) {
      alert("✅ Registro consertado com sucesso!");

      // --- SEU PROTOCOLO MANTIDO INTEGRALMENTE ---
      if (typeof imprimirProtocolo === "function") {
          imprimirProtocolo(id, cpf, nome, nascParaEnvio, mun, via, user.nome, user.parceiro, res.data, boleto);
      }

      // --- SUA LIMPEZA DE CAMPOS MANTIDA INTEGRALMENTE ---
      document.getElementById("cpf").value = "";
      document.getElementById("nome").value = "";
      document.getElementById("nascimento").value = "";
      document.getElementById("municipio").value = "";
      document.getElementById("telefone").value = "";
      document.getElementById("codigoBoleto").value = "";
      
      // RESET DO BOTÃO: Volta ao estado original de Cadastro Novo
      if(btn) {
        btn.innerText = "CADASTRAR";
        btn.setAttribute("onclick", "salvarCadastro()");
        btn.style.backgroundColor = ""; 
      }
      idSendoEditado = null;
      modoEdicao = false;

    } else {
      alert("Aviso do Servidor: " + res.erro);
    }
  } catch (error) {
    console.error("Erro fatal:", error);
    alert("Erro de conexão ao consertar.");
  } finally {
    if(btn) btn.disabled = false;
  }
}

// --- VIGIA PARA FECHAMENTO DE ABA E F5 ---
window.addEventListener('pagehide', function() {
  // Se o usuário clicou no botão "Sair", a função deslogarMtech já cuidou do log.
  // Se não clicou, significa que ele deu F5 ou fechou a aba.
  if (clicouNoBotaoSair) return; 

  const sessao = sessionStorage.getItem("usuario");
  if (!sessao) return;

  const u = JSON.parse(sessao);
  
  // Detecta se é apenas um F5 ou se fechou a aba de vez
  let acaoAutomatica = (performance.navigation && performance.navigation.type === 1) 
                       ? "SAÍDA/ATUALIZOU" 
                       : "FECHOU ABA/NAVEGADOR";

  const urlLogAutomatico = urlSistema + "?action=registrarAcaoNoLog&args=" + 
                           encodeURIComponent(JSON.stringify([u.nome, u.parceiro, acaoAutomatica, "Sistema MTECH"]));

  // O sendBeacon é perfeito aqui porque ele envia o dado "na surdina" 
  // mesmo que a aba já esteja fechando.
  navigator.sendBeacon(urlLogAutomatico);
});

function deslogarMtech() {
  // ESSA LINHA É A CHAVE: Avisa o outro código para não registrar "FECHOU ABA"
  clicouNoBotaoSair = true; 

  const sessao = sessionStorage.getItem("usuario");
  if (!sessao) {
    window.location.reload();
    return;
  }

  const u = JSON.parse(sessao);
  const dadosLog = [u.nome, u.parceiro, "SAÍDA/LOGOUT", "Sistema MTECH"];
  
  const urlLog = urlSistema + "?action=registrarAcaoNoLog&args=" + encodeURIComponent(JSON.stringify(dadosLog));

  const img = new Image();
  img.onload = () => { sessionStorage.clear(); window.location.reload(); };
  img.onerror = () => { sessionStorage.clear(); window.location.reload(); };
  img.src = urlLog;

  setTimeout(() => { sessionStorage.clear(); window.location.reload(); }, 1000);
}
