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
