// ============================================================
// ARQUIVO PRINCIPAL - APENAS doGet e roteador
// ============================================================

function doGet(e) {
  // 🔥 CRIA SAÍDA COM CORS
  var saida = ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.JSON);
  
  // ADICIONA CABEÇALHOS CORS
  saida.setHeader('Access-Control-Allow-Origin', '*');
  saida.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  saida.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Se tiver 'acao' ou 'action', é chamada da API
  if (e && e.parameter && (e.parameter.action || e.parameter.acao)) {
    var resultado = roteador(e);
    saida.setContent(JSON.stringify(resultado));
    return saida;
  }

  // Se tiver 'page', abre a página solicitada
  if (e && e.parameter && e.parameter.page) {
    var page = e.parameter.page;
    try {
      return HtmlService.createHtmlOutputFromFile(page)
        .setTitle("PV43 - " + page)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) {
      return HtmlService.createHtmlOutput("Página não encontrada: " + page);
    }
  }

  // Página padrão: login
  try {
    var template = HtmlService.createTemplateFromFile("pv43");
    return template.evaluate()
      .setTitle("PV43 - Sistema")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput("Erro ao carregar: " + error.message);
  }
}

// ============================================================
// doPost - COM CORS - CORRIGIDO
// ============================================================
function doPost(e) {
  // 🔥 CRIA SAÍDA COM CORS
  var saida = ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.JSON);
  
  // ADICIONA CABEÇALHOS CORS
  saida.setHeader('Access-Control-Allow-Origin', '*');
  saida.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  saida.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    var dadosPost = {};
    var acao = '';
    
    // 🔥 EXTRAI DADOS DO URLSearchParams (que vem de e.parameter)
    if (e && e.parameter) {
      Logger.log("📥 PARÂMETROS RECEBIDOS: " + JSON.stringify(e.parameter));
      for (var chave in e.parameter) {
        dadosPost[chave] = e.parameter[chave];
        if (chave === 'acao' || chave === 'action') {
          acao = e.parameter[chave];
        }
      }
    }
    
    // Se veio JSON
    if (e && e.postData && e.postData.contents) {
      try {
        var json = JSON.parse(e.postData.contents);
        for (var chave in json) {
          dadosPost[chave] = json[chave];
          if (chave === 'acao' || chave === 'action') {
            acao = json[chave];
          }
        }
      } catch (err) {}
    }

    Logger.log("📥 doPost - Ação: " + acao);
    Logger.log("📥 doPost - Dados: " + JSON.stringify(dadosPost));

    var resultado;

    // ==========================================
    // AÇÕES EXISTENTES
    // ==========================================
    if (acao === "login") {
      resultado = fazerLogin(dadosPost.usuario, dadosPost.senha);
    } else if (acao === "trocarSenha") {
      resultado = alterarSenha(dadosPost.usuario, dadosPost.senhaAtual, dadosPost.novaSenha);
    } else if (acao === "buscarZona") {
      resultado = buscarLocalVotacao(dadosPost.zona, dadosPost.secao);
    } else if (acao === "salvarCadastro") {
      resultado = processarCadastramento(dadosPost);
    } else if (acao === "listarCadastros") {
      resultado = listarCadastros();
    } else if (acao === "excluirCadastro") {
      resultado = excluirCadastroPorId(dadosPost.id);
    
    // ==========================================
    // CONFIGURAÇÕES - PASSA PARÂMETROS INDIVIDUAIS
    // ==========================================
    } else if (acao === "listarUsuarios") {
      resultado = listarUsuarios();
    } else if (acao === "cadastrarUsuario") {
      // 🔥 PASSA CADA PARÂMETRO INDIVIDUALMENTE
      resultado = cadastrarUsuario(
        dadosPost.usuario,
        dadosPost.senha,
        dadosPost.nome,
        dadosPost.tipo,
        dadosPost.cadastrado_por
      );
    } else if (acao === "excluirUsuario") {
      resultado = excluirUsuario(dadosPost.usuario);
    } else if (acao === "verificarAdmin") {
      resultado = verificarAdmin(dadosPost.usuario);
    } else if (acao === "buscarUsuario") {
      resultado = buscarUsuario(dadosPost.login);
    } else if (acao === "atualizarUsuario") {
      resultado = atualizarUsuario(dadosPost);
    
    // ==========================================
    // AÇÃO DESCONHECIDA
    // ==========================================
    } else {
      resultado = { sucesso: false, mensagem: "Ação '" + acao + "' não reconhecida." };
    }

    saida.setContent(JSON.stringify(resultado));
    return saida;

  } catch (erro) {
    Logger.log("❌ ERRO NO doPost: " + erro.message);
    saida.setContent(JSON.stringify({
      sucesso: false,
      mensagem: "Erro no servidor: " + erro.message
    }));
    return saida;
  }
}

// ============================================================
// ROTEADOR - PARA REQUISIÇÕES GET
// ============================================================
function roteador(e) {
  console.log("roteador recebeu:", JSON.stringify(e));
  
  var action;
  var parametros = {};

  if (e.postData && e.postData.contents) {
    try {
      parametros = JSON.parse(e.postData.contents);
      action = parametros.acao || parametros.action;
    } catch (err) {
      parametros = e.parameter;
      action = parametros.acao || parametros.action;
    }
  } else {
    parametros = e.parameter;
    action = parametros.acao || parametros.action;
  }

  console.log("🎯 Ação:", action);
  console.log("📦 Parâmetros:", JSON.stringify(parametros));

  var retorno;

  try {
    // ==========================================
    // LISTA (lista.gs)
    // ==========================================
    if (action === "listarCadastros") {
      retorno = listarCadastros();
    } else if (action === "buscarCadastro") {
      retorno = buscarCadastroPorId(parametros.id);
    } else if (action === "filtrarCadastros") {
      retorno = filtrarCadastros(parametros);
    } else if (action === "exportarCSV") {
      retorno = exportarListaCSV(parametros);
    } else if (action === "estatisticas") {
      retorno = obterEstatisticas();
    } else if (action === "excluirCadastro") {
      retorno = excluirCadastroPorId(parametros.id);
    
    // ==========================================
    // CADASTRAMENTO (cadastramento.gs)
    // ==========================================
    } else if (action === "buscarZona") {
      retorno = buscarLocalVotacao(parametros.zona, parametros.secao);
    } else if (action === "salvarCadastro") {
      retorno = processarCadastramento(parametros);
    
    // ==========================================
    // LOGIN (login.gs)
    // ==========================================
    } else if (action === "login") {
      retorno = fazerLogin(parametros.usuario, parametros.senha);
    } else if (action === "trocarSenha") {
      retorno = alterarSenha(parametros.usuario, parametros.senhaAtual, parametros.novaSenha);
    
    // ==========================================
    // CONFIGURAÇÕES (configuracoes.gs)
    // ==========================================
    } else if (action === "listarUsuarios") {
      retorno = listarUsuarios();
    } else if (action === "cadastrarUsuario") {
      retorno = cadastrarUsuario(
        parametros.usuario,
        parametros.senha,
        parametros.nome,
        parametros.tipo,
        parametros.cadastrado_por
      );
    } else if (action === "excluirUsuario") {
      retorno = excluirUsuario(parametros.usuario);
    } else if (action === "verificarAdmin") {
      retorno = verificarAdmin(parametros.usuario);
    } else if (action === "buscarUsuario") {
      retorno = buscarUsuario(parametros.login);
    } else if (action === "atualizarUsuario") {
      retorno = atualizarUsuario(parametros);
    
    // ==========================================
    // AÇÃO DESCONHECIDA
    // ==========================================
    } else {
      retorno = { 
        sucesso: false, 
        mensagem: "Ação '" + action + "' não reconhecida." 
      };
    }
    
    return retorno;

  } catch (err) {
    Logger.log("❌ ERRO NO ROTEADOR: " + err.toString());
    return { 
      sucesso: false, 
      mensagem: "Erro: " + err.toString() 
    };
  }
}
