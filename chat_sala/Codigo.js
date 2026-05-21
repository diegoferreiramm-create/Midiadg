// ======================================================
// ===============  CHAT CORPORATIVO - BACKEND  ==========
// ======================================================

// ===============  CONFIGURAÇÕES DE PLANILHA  ==========
const ss = SpreadsheetApp.getActive();
const abaLogin = ss.getSheetByName("LOGIN");
const abaContatos = ss.getSheetByName("CONTATOS");
const abaChat = ss.getSheetByName("CHAT");

// ===============  TRATAMENTO CENTRAL ===================
function doGet(e) {
  return tratarRequisicao(e);
}

function doPost(e) {
  return tratarRequisicao(e);
}

function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
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

  const params = e.parameter || {};
  const acao = data.acao || params.acao || "";

  let resultado = { erro: "Ação desconhecida: " + acao };

  switch (acao) {

    case "login":
      resultado = fazerLogin(
        data.usuario || params.usuario,
        data.senha || params.senha
      );
      break;

    case "criarConta":
      resultado = criarConta(
        data.nome || params.nome,
        data.usuario || params.usuario,
        data.senha || params.senha
      );
      break;

    case "listarContatos":
      resultado = listarContatos();
      break;

    case "enviarMensagem":
      resultado = enviarMensagem(
        data.remetente || params.remetente,
        data.destinatario || params.destinatario,
        data.mensagem || params.mensagem,
        data.arquivos || []
      );
      break;

    case "buscarMensagens":
      resultado = buscarMensagens(
        data.usuario || params.usuario,
        data.destinatario || params.destinatario
      );
      break;

    default:
      resultado = { erro: "Ação não encontrada: " + acao };
      break;
  }

  return resposta(resultado);
}

// ==================== LOGIN ============================
function fazerLogin(usuario, senha) {

  if (!abaLogin) {
    return { erro: "Aba LOGIN não encontrada." };
  }

  const dados = abaLogin.getDataRange().getValues();

  const usuarioDigitado = (usuario || "")
    .toString()
    .trim()
    .toLowerCase();

  const senhaDigitada = (senha || "")
    .toString()
    .trim();

  for (let i = 1; i < dados.length; i++) {

    const usuarioPlanilha = (dados[i][0] || "")
      .toString()
      .trim()
      .toLowerCase();

    const senhaPlanilha = (dados[i][1] || "")
      .toString()
      .trim();

    if (
      usuarioPlanilha === usuarioDigitado &&
      senhaPlanilha === senhaDigitada
    ) {

      const ativo = dados[i][3];

      if (
        ativo !== true &&
        ativo !== "TRUE" &&
        ativo !== "true" &&
        ativo !== "1" &&
        ativo !== 1
      ) {
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

// ================= CRIAR CONTA =========================
function criarConta(nome, usuario, senha) {

  if (!abaLogin) {
    return { erro: "Aba LOGIN não encontrada." };
  }

  if (!abaContatos) {
    return { erro: "Aba CONTATOS não encontrada." };
  }

  const dadosLogin = abaLogin.getDataRange().getValues();

  const novoUsuario = (usuario || "")
    .toString()
    .trim()
    .toLowerCase();

  for (let i = 1; i < dadosLogin.length; i++) {

    const usuarioPlanilha = (dadosLogin[i][0] || "")
      .toString()
      .trim()
      .toLowerCase();

    if (usuarioPlanilha === novoUsuario) {
      return { erro: "Este usuário já existe." };
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
    "Geral",
    usuario.toString().trim()
  ]);

  return {
    sucesso: true,
    msg: "Conta criada com sucesso."
  };
}

// ================= LISTAR CONTATOS =====================
function listarContatos() {

  if (!abaContatos) {
    return { erro: "Aba CONTATOS não encontrada." };
  }

  const dados = abaContatos.getDataRange().getValues();

  const lista = [];

  for (let i = 1; i < dados.length; i++) {

    if (
      dados[i][0] &&
      dados[i][0].toString().trim() !== ""
    ) {

      const nome = dados[i][0]
        .toString()
        .trim();

      const setor = (dados[i][1] || "Geral")
        .toString()
        .trim();

      let usuario = (dados[i][2] || "")
        .toString()
        .trim();

      if (!usuario && abaLogin) {

        const dadosLogin = abaLogin
          .getDataRange()
          .getValues();

        if (dadosLogin[i]) {
          usuario = (dadosLogin[i][0] || "")
            .toString()
            .trim();
        }
      }

      if (!usuario) {
        usuario = nome
          .toLowerCase()
          .replace(/\s+/g, "");
      }

      lista.push({
        nome: nome,
        setor: setor,
        usuario: usuario
      });
    }
  }

  return {
    contatos: lista
  };
}

// ================ ENVIAR MENSAGEM (CORRIGIDO PARA RECEBER ARQUIVOS) ==================
function enviarMensagem(remetente, destinatario, mensagem, arquivos) {
  if (!abaChat) return { erro: "Aba CHAT não encontrada." };
  
  if (!remetente || !destinatario) {
    return { erro: "Dados incompletos: remetente e destinatario são obrigatórios." };
  }

  let mensagemFinal = (mensagem || "").toString();

  // Processa os arquivos enviados
  if (arquivos && Array.isArray(arquivos) && arquivos.length > 0) {
    for (let i = 0; i < arquivos.length; i++) {
      const arq = arquivos[i];
      if (arq.nome && arq.base64) {
        // O base64 já vem completo com "data:...;base64," então usa direto
        let base64Completo = arq.base64;
        
        if (mensagemFinal.trim()) {
          mensagemFinal += "\n\n";
        }
        // Salva o arquivo como BASE64 na mensagem
        mensagemFinal += `[ARQUIVO:${arq.nome}|${base64Completo}|${arq.tipo || 'application/octet-stream'}]`;
      }
    }
  }
  
  const dataHora = new Date();
  const linha = [
    dataHora,
    remetente.toString().trim(),
    destinatario.toString().trim(),
    mensagemFinal,
    ""
  ];
  
  abaChat.appendRow(linha);
  return { sucesso: true, timestamp: dataHora.toISOString() };
}

// ================= BUSCAR MENSAGENS ====================
function buscarMensagens(user, contato) {

  if (!abaChat) {
    return { erro: "Aba CHAT não encontrada." };
  }

  const dados = abaChat.getDataRange().getValues();

  const msgs = [];

  const usuarioBuscado = (user || "")
    .toString()
    .trim()
    .toLowerCase();

  const contatoBuscado = (contato || "")
    .toString()
    .trim()
    .toLowerCase();

  for (let i = 1; i < dados.length; i++) {

    const r = dados[i];

    if (!r[1] || !r[2]) continue;

    const remetente = (r[1] || "")
      .toString()
      .trim()
      .toLowerCase();

    const destinatario = (r[2] || "")
      .toString()
      .trim()
      .toLowerCase();

    const enviada =
      remetente === usuarioBuscado &&
      destinatario === contatoBuscado;

    const recebida =
      remetente === contatoBuscado &&
      destinatario === usuarioBuscado;

    if (enviada || recebida) {

      msgs.push({
        data: r[0],
        remetente: r[1],
        destinatario: r[2],
        mensagem: r[3]
      });
    }
  }

  return {
    mensagens: msgs
  };
}

// ================= RESPOSTA PADRÃO =====================
function resposta(obj) {

  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}
