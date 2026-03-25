// Eventos Globais
document.addEventListener('input', function (e) {
  if (e.target.tagName === 'INPUT') {
    const excecoes = ['login', 'senha', 'usuarioTroca', 'senhaAtual', 'novaSenha', 'confSenha'];
    if (!excecoes.includes(e.target.id)) {
      e.target.value = e.target.value.toUpperCase();
    }
  }
  const camposCpfObrigatorio = ['cpf', 'cpfTerceiro'];
  if (camposCpfObrigatorio.includes(e.target.id)) {
      e.target.value = CPF.formatar(e.target.value);
  }
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
  if(e.target.id === 'cpfTerceiro') {
    const v = CPF.validar(e.target.value);
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
  if(e.target.id === 'codigoCtr') e.target.value = e.target.value.replace(/\D/g, "");
});

window.addEventListener('pagehide', function() {
  if (clicouNoBotaoSair) return; 
  const sessao = sessionStorage.getItem("usuario");
  if (!sessao) return;
  const u = JSON.parse(sessao);
  let acaoAutomatica = (performance.navigation && performance.navigation.type === 1) 
                       ? "SAÍDA/ATUALIZOU" 
                       : "FECHOU ABA/NAVEGADOR";
  const urlLogAutomatico = urlSistema + "?action=registrarAcaoNoLog&args=" + 
                           encodeURIComponent(JSON.stringify([u.nome, u.parceiro, acaoAutomatica, "Sistema MTECH"]));
  navigator.sendBeacon(urlLogAutomatico);
});