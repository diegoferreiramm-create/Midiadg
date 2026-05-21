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
        data.mensagem     || params.mensagem,
        data.arquivos
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

// ==================== FUNÇÃO LOGIN =====================
function fazerLogin(usuario, senha) {
  if (!abaLogin) return { erro: "Aba LOGIN não encontrada." };
  
  const dados = abaLogin.getDataRange().getValues();

  const usuarioDigitado = (usuario || "").toString().trim().toLowerCase();
  const senhaDigitada = (senha || "").toString().trim();

  for (let i = 1; i < dados.length; i++) {
    const usuarioPlanilha = (dados[i][0] || "").toString().trim().toLowerCase();
    const senhaPlanilha = (dados[i][1] || "").toString().trim();

    if (usuarioPlanilha === usuarioDigitado && senhaPlanilha === senhaDigitada) {
      const ativo = dados[i][3];
      if (ativo !== true && ativo !== "TRUE" && ativo !== "true" && ativo !== "1" && ativo !== 1) {
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

// ================= FUNÇÃO CRIAR CONTA ==================
function criarConta(nome, usuario, senha) {
  if (!abaLogin) return { erro: "Aba LOGIN não encontrada." };
  if (!abaContatos) return { erro: "Aba CONTATOS não encontrada." };

  const dadosLogin = abaLogin.getDataRange().getValues();
  const novoUsuario = (usuario || "").toString().trim().toLowerCase();

  for (let i = 1; i < dadosLogin.length; i++) {
    const usuarioPlanilha = (dadosLogin[i][0] || "").toString().trim().toLowerCase();
    if (usuarioPlanilha === novoUsuario) {
      return { erro: "Este nome de usuário já está em uso." };
    }
  }

  // Adiciona na aba LOGIN (usuario, senha, setor, ativo)
  abaLogin.appendRow([
    usuario.toString().trim(),
    senha.toString().trim(),
    "Geral",
    "TRUE"
  ]);

  // Adiciona na aba CONTATOS (nome, setor, usuario)
  abaContatos.appendRow([
    nome.toString().trim(),
    "Geral",
    usuario.toString().trim()
  ]);

  return { 
    sucesso: true, 
    msg: "Conta criada com sucesso! Você já pode entrar." 
  };
}

// ================= LISTAR CONTATOS =====================
function listarContatos() {
  if (!abaContatos) return { erro: "Aba CONTATOS não encontrada." };
  
  const dados = abaContatos.getDataRange().getValues();
  const lista = [];

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0] && dados[i][0].toString().trim() !== "") {
      const nome = dados[i][0].toString().trim();
      const setor = (dados[i][1] || "Geral").toString().trim();
      let usuario = (dados[i][2] || "").toString().trim();

      // Fallback para contas antigas que não têm a coluna usuario
      if (!usuario && abaLogin) {
        const dadosLogin = abaLogin.getDataRange().getValues();
        if (dadosLogin[i]) {
          usuario = (dadosLogin[i][0] || "").toString().trim();
        }
      }

      if (!usuario) {
        usuario = nome.toLowerCase().replace(/\s+/g, "");
      }

      lista.push({
        nome: nome,
        setor: setor,
        usuario: usuario
      });
    }
  }

  return { contatos: lista };
}

// ================ ENVIAR MENSAGEM ======================
function enviarMensagem(remetente, destinatario, mensagem, arquivos) {
  if (!abaChat) return { erro: "Aba CHAT não encontrada." };
  
  if (!remetente || !destinatario) {
    return { erro: "Dados incompletos: remetente e destinatario são obrigatórios." };
  }

  let mensagemFinal = (mensagem || "").toString();

  // Se houver arquivos enviados em base64, salva no Drive e anexa o link formatado
  if (arquivos && Array.isArray(arquivos) && arquivos.length > 0) {
    try {
      const pasta = obterPastaAnexos();
      const linksArquivos = [];
      
      for (let i = 0; i < arquivos.length; i++) {
        const arq = arquivos[i];
        if (arq.nome && arq.base64 && arq.tipo) {
          const url = salvarArquivoNoDrive(pasta, arq.nome, arq.tipo, arq.base64);
          if (url) {
            linksArquivos.push("[ARQUIVO:" + arq.nome + "|" + url + "]");
          }
        }
      }
      
      if (linksArquivos.length > 0) {
        if (mensagemFinal.trim()) {
          mensagemFinal += "\n";
        }
        mensagemFinal += linksArquivos.join("\n");
      }
    } catch (err) {
      console.log("Erro ao salvar anexos: " + err.toString());
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

// =============== BUSCAR MENSAGENS ======================
function buscarMensagens(user, contato) {
  if (!abaChat) return { erro: "Aba CHAT não encontrada." };
  
  const dados = abaChat.getDataRange().getValues();
  const msgs = [];

  const usuarioBuscado = (user || "").toString().trim().toLowerCase();
  const contatoBuscado = (contato || "").toString().trim().toLowerCase();

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];
    
    if (!r[1] || !r[2]) continue;

    const remetente = (r[1] || "").toString().trim().toLowerCase();
    const destinatario = (r[2] || "").toString().trim().toLowerCase();

    const enviada = (remetente === usuarioBuscado && destinatario === contatoBuscado);
    const recebida = (remetente === contatoBuscado && destinatario === usuarioBuscado);

    if (enviada || recebida) {
      msgs.push({
        data: r[0],
        remetente: (r[1] || "").toString(),
        destinatario: (r[2] || "").toString(),
        mensagem: (r[3] || "").toString()
      });
    }
  }

  return { mensagens: msgs };
}

// =============== FUNÇÃO PADRÃO DE RESPOSTA =============
function resposta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============== FUNÇÕES AUXILIARES GOOGLE DRIVE =======
function obterPastaAnexos() {
  const nomePasta = "Chat_Corporativo_Anexos";
  const pastas = DriveApp.getFoldersByName(nomePasta);
  if (pastas.hasNext()) {
    return pastas.next();
  } else {
    const novaPasta = DriveApp.createFolder(nomePasta);
    novaPasta.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return novaPasta;
  }
}

function salvarArquivoNoDrive(pasta, nome, tipo, base64Data) {
  try {
    let partes = base64Data.split(",");
    let pureBase64 = partes.length > 1 ? partes[1] : partes[0];
    let decoded = Utilities.base64Decode(pureBase64);
    let blob = Utilities.newBlob(decoded, tipo, nome);
    let arquivoDrive = pasta.createFile(blob);
    arquivoDrive.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?export=download&id=" + arquivoDrive.getId();
  } catch (err) {
    console.log("Erro ao salvar arquivo no Drive: " + err.toString());
    return null;
  }
}
