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
