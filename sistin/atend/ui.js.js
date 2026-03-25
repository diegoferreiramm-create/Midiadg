// Navegação e UI
window.onload = function() {
  if (clicouNoBotaoSair) {
    sessionStorage.clear();
    abrirTela('loginBox');
  }
  gerarChecksColunas();
};

function abrirTela(id){
  const telas = ["loginBox","menuBox","cadastrarBox","pesquisarBox","entregarBox","listasBox", "logBox", "recebimentoLoteBox"];   
  
  telas.forEach(t => { 
    const el = document.getElementById(t);
    if(el) el.style.display = "none"; 
  });

  const telaDestino = document.getElementById(id);
  if(telaDestino){
    if(['menuBox', 'listasBox', 'recebimentoLoteBox'].includes(id)){
      telaDestino.style.display = "flex";
    } else {
      telaDestino.style.display = "flex";
    }
  }

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

function mostrarMenu(){
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  if(!user) return;
  
  document.getElementById("infoUsuario").innerText = user.nome + " | " + user.parceiro;
  document.getElementById("hudUsuario").style.display="flex";

  if(user.nome === 'admin' || user.parceiro.toString() === "97") {
    const cardLog = document.getElementById("cardLog");
    if(cardLog) cardLog.style.display = "block";
  }

  abrirTela('menuBox');
}

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

function abrirSenha(){ document.getElementById("modalSenha").style.display="flex"; }
function fecharSenha(){ document.getElementById("modalSenha").style.display="none"; }

function deslogarMtech() {
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