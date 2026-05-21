// ======================================================
// ===============  CONFIGURAÇÕES DE PLANILHA  ==========
// ======================================================
const ss = SpreadsheetApp.getActive();
const abaLogin = ss.getSheetByName("LOGIN");
const abaContatos = ss.getSheetByName("CONTATOS");
const abaChat = ss.getSheetByName("CHAT");

// ======================================================
// ===============  TRATAMENTO CENTRAL ===================
// ======================================================
function doGet(e) {
  return tratarRequisicao(e);
}

function doPost(e) {
  return tratarRequisicao(e);
}

function tratarRequisicao(e) {
  let data = {};

  if (e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      data = {};
    }
  }

  // Permite ler parâmetros tanto do JSON enviado no corpo quanto da URL
  const params = e.parameter || {};
  const acao = data.acao || params.acao || "";

  let resultado = { erro: "Ação desconhecida" };

  switch (acao) {
    case "login":
      resultado = fazerLogin(
        data.usuario || params.usuario,
        data.senha   || params.senha
      );
      break;

    case "criarConta":
      resultado = criarConta(
        data.nome    || params.nome,
        data.usuario || params.usuario,
        data.senha   || params.senha
      );
      break;

    case "listarContatos":
      resultado = listarContatos();
      break;

    case "enviarMensagem":
      resultado = enviarMensagem(
        data.remetente    || params.remetente,
        data.destinatario || params.destinatario,
        data.mensagem     || params.mensagem
      );
      break;

    case "buscarMensagens":
      resultado = buscarMensagens(
        data.usuario      || params.usuario,
        data.destinatario || params.destinatario
      );
      break;

    default:
      resultado = { erro: "Ação não encontrada: " + acao };
      break;
  }

  return resposta(resultado);
}

// ======================================================
// ==================== CORS (OPTIONS) ===================
// ======================================================
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ======================================================
// ==================== FUNÇÃO LOGIN =====================
// ======================================================
function fazerLogin(usuario, senha) {
  if (!abaLogin) return { erro: "Aba LOGIN não encontrada." };
  
  const dados = abaLogin.getDataRange().getValues();

  // Tratamos o que foi digitado (remove espaços e passa para minúsculo)
  const usuarioDigitado = (usuario || "").toString().trim().toLowerCase();
  const senhaDigitada = (senha || "").toString().trim();

  for (let i = 1; i < dados.length; i++) {
    // CORREÇÃO DOS DOIS BUGS CRÍTICOS:
    // 1. Convertendo usuarioPlanilha e usuarioDigitado para minúsculas.
    // 2. Convertendo a senha da planilha e a digitada em STRING antes do comparador '==='.
    const usuarioPlanilha = (dados[i][0] || "").toString().trim().toLowerCase();
    const senhaPlanilha = (dados[i][1] || "").toString().trim();

    if (usuarioPlanilha === usuarioDigitado && senhaPlanilha === senhaDigitada) {

      // Verifica se o usuário não está bloqueado (Coluna D)
      const ativo = dados[i][3];
      if (ativo !== true && ativo !== "TRUE" && ativo !== "true" && ativo !== "") {
        return { erro: "Usuário bloqueado." };
      }

      return {
        sucesso: true,
        setor: dados[i][2] || "Geral"
      };
    }
  }

  return { erro: "Usuário ou senha inválidos." };
}

// ======================================================
// ================= FUNÇÃO CRIAR CONTA ==================
// ======================================================
function criarConta(nome, usuario, senha) {
  if (!abaLogin) return { erro: "Aba LOGIN não encontrada." };
  if (!abaContatos) return { erro: "Aba CONTATOS não encontrada." };

  const dadosLogin = abaLogin.getDataRange().getValues();
  const novoUsuario = (usuario || "").toString().trim().toLowerCase();

  // Verifica duplicidade de usuário de forma case-insensitive
  for (let i = 1; i < dadosLogin.length; i++) {
    const usuarioPlanilha = (dadosLogin[i][0] || "").toString().trim().toLowerCase();
    if (usuarioPlanilha === novoUsuario) {
      return { erro: "Este nome de usuário já está em uso." };
    }
  }

  abaLogin.appendRow([
    usuario.toString().trim(),
    senha.toString().trim(),
    "Geral",
    "TRUE"
  ]);

  abaContatos.appendRow([
    nome.toString().trim(),
    "Geral"
  ]);

  return { 
    sucesso: true, 
    msg: "Conta criada com sucesso! Você já pode entrar." 
  };
}

// ======================================================
// ================= LISTAR CONTATOS =====================
// ======================================================
function listarContatos() {
  if (!abaContatos) return { erro: "Aba CONTATOS não encontrada." };
  
  const dados = abaContatos.getDataRange().getValues();
  const lista = [];

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0]) {
      lista.push({
        nome: dados[i][0].toString().trim(),
        setor: (dados[i][1] || "Geral").toString().trim()
      });
    }
  }

  return { contatos: lista };
}

// ======================================================
// ================ ENVIAR MENSAGEM ======================
// ======================================================
function enviarMensagem(remetente, destinatario, mensagem) {
  if (!abaChat) return { erro: "Aba CHAT não encontrada." };

  abaChat.appendRow([
    new Date(),
    remetente.toString().trim(),
    destinatario.toString().trim(),
    mensagem.toString(),
    ""
  ]);

  return { sucesso: true };
}

// ======================================================
// =============== BUSCAR MENSAGENS ======================
// ======================================================
function buscarMensagens(user, contato) {
  if (!abaChat) return { erro: "Aba CHAT não encontrada." };
  
  const dados = abaChat.getDataRange().getValues();
  const msgs = [];

  const usuarioBuscado = (user || "").toString().trim();
  const contatoBuscado = (contato || "").toString().trim();

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];

    const remetente = (r[1] || "").toString().trim();
    const destinatario = (r[2] || "").toString().trim();

    const enviada = (remetente === usuarioBuscado && destinatario === contatoBuscado);
    const recebida = (remetente === contatoBuscado && destinatario === usuarioBuscado);

    if (enviada || recebida) {
      msgs.push({
        data: r[0],
        remetente: remetente,
        destinatario: destinatario,
        mensagem: (r[3] || "").toString()
      });
    }
  }

  return { mensagens: msgs };
}

// ======================================================
// =============== FUNÇÃO PADRÃO DE RESPOSTA =============
// ======================================================
function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
