// Autenticação
function entrar() {
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const msg = document.getElementById("msg");

  if (msg) msg.innerText = "Verificando...";

  fetch(`${urlSistema}?action=validarLogin&user=${login}&pass=${senha}`)
    .then(response => response.json())
    .then(res => {
      if (res.sucesso) {
        usuarioLogadoParaLog = res.nome;  
        parceiroLogadoParaLog = res.parceiro;
        sessionStorage.setItem("usuario", JSON.stringify(res));
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

// TROCAR SENHA
function salvarSenha() {
  const usuario = document.getElementById("usuarioTroca").value.trim();
  const senhaAtual = document.getElementById("senhaAtual").value.trim();
  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confSenha = document.getElementById("confSenha").value.trim();

  if (!usuario || !senhaAtual || !novaSenha || !confSenha) {
    alert("Preencha todos os campos!");
    return;
  }

  if (novaSenha !== confSenha) {
    alert("Nova senha e confirmação não conferem!");
    return;
  }

  if (novaSenha.length < 4) {
    alert("A nova senha deve ter no mínimo 4 caracteres!");
    return;
  }

  const btn = event?.target;
  if (btn) btn.disabled = true;

  fetch(`${urlSistema}?action=trocarSenha&user=${encodeURIComponent(usuario)}&passAtual=${encodeURIComponent(senhaAtual)}&passNova=${encodeURIComponent(novaSenha)}`)
    .then(res => res.json())
    .then(res => {
      if (res.sucesso) {
        alert("✅ Senha alterada com sucesso!");
        fecharSenha();
      } else {
        alert("❌ Erro ao alterar senha: " + (res.erro || "Verifique os dados"));
      }
    })
    .catch(err => {
      console.error("Erro:", err);
      alert("Erro de conexão com o servidor.");
    })
    .finally(() => {
      if (btn) btn.disabled = false;
    });
}

// Função mostrarMenu
function mostrarMenu() {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  if(!user) return;
  
  document.getElementById("infoUsuario").innerText = user.nome + " | " + user.parceiro;
  document.getElementById("hudUsuario").style.display = "flex";
  
  if(user.nome === 'admin' || user.parceiro.toString() === "97") {
    const cardLog = document.getElementById("cardLog");
    if(cardLog) cardLog.style.display = "block";
  }
  
  abrirTela('menuBox');
}

// ============================================
// FUNÇÃO ABRIR TELA
// ============================================

function abrirTela(id) {
  const telas = ["loginBox","menuBox","cadastrarBox","pesquisarBox","entregarBox","listasBox", "logBox", "recebimentoLoteBox"];
  
  telas.forEach(t => { 
    const el = document.getElementById(t);
    if(el) el.style.display = "none"; 
  });

  const telaDestino = document.getElementById(id);
  if(telaDestino) {
    telaDestino.style.display = "flex";
  }

  if(id === 'entregarBox') {
    const ctr = document.getElementById("codigoCtr");
    if(ctr) ctr.value = "";
    const infoAluno = document.getElementById("infoAlunoEntrega");
    if(infoAluno) infoAluno.style.display = "none";
    alunoEncontradoGlobal = null;
  }
  if(id === 'listasBox' && typeof carregarLista === 'function') carregarLista();
  if(id === 'logBox' && typeof carregarDadosLog === 'function') carregarDadosLog();
  
  if(id !== 'cadastrarBox') {
    modoEdicao = false;
    idSendoEditado = null;
    const btn = document.getElementById("btnSalvar");
    if(btn) btn.innerText = "Salvar e Gerar Protocolo";
  }
}
