// Busca Geral
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
        // DATA SOLICITAÇÃO (coluna I)
        let dataSolicitacao = item.dataSolicitacao || item["DATA SOLICITAÇÃO"] || "-";
        
        // DATA STATUS (coluna N)
        let dStat = item.dataStatus || item["DATA STATUS"] || "";
        
        // SITUAÇÃO (coluna R)
        let situacao = item.situacao || item.pagamento || item["SITUACAO"] || "-";
        
        // PRAZO (coluna S)
        let prazo = item.prazoPendencia || item.prazo || item["PRAZO"] || "-";
        
        // Nº ARCE (coluna W)
        let numeroArce = item.numeroArce || item.processo || item["NUMERO_ARCE"] || "-";
        
        div.innerHTML += `
          <div class="res-card">
            <b>NOME:</b> ${item.nome}<br>
            <b>CPF:</b> ${item.cpf} | <b>VIA:</b> ${item.via} | <b>CADASTRADO:</b> ${dataSolicitacao}<br>
            <b>MUNICÍPIO:</b> ${item.municipio} | <b>COD. parc.:</b> ${item.parceiro}<br>
            <b>CARTEIRA:</b> ${item.numCarteira || item.carteira || 'N/A'}<br>
            <b>STATUS:</b> ${item.status || 'Pendente'}<br>
            <b>MOTIVO:</b> ${item.motivo || '-'}<br>
            <b>DATA STATUS:</b> ${dStat} | <b>SITUAÇÃO:</b> ${situacao} | <b>PRAZO:</b> ${prazo}<br>
            <b>Nº ARCE:</b> ${numeroArce} | <b>ATENDENTE:</b> ${item.atendente}<br>
          </div>
        `;
      });
    })
    .catch(err => alert("Erro ao pesquisar"));
}

function mascaraData(campo) {
  var v = campo.value.replace(/\D/g, "");
  if (v.length >= 2) v = v.substring(0, 2) + "/" + v.substring(2);
  if (v.length >= 5) v = v.substring(0, 5) + "/" + v.substring(5, 9);
  campo.value = v;
}

// Formatação de Boleto
function formatarBoleto(campo) {
  let valor = campo.value;
  let v = BOLETO.limpar(valor);
  
  if (v.length === 0) {
    campo.value = '';
    const msgDiv = document.getElementById("msgBoleto");
    if (msgDiv) msgDiv.innerHTML = '';
    return;
  }
  
  // Boleto de 10 dígitos (começa com 4)
  if (v[0] === '4') {
    v = v.slice(0, 10);
    if (v.length >= 5) v = v.substring(0, 4) + ' ' + v.substring(4);
    if (v.length >= 9) v = v.substring(0, 9) + ' ' + v.substring(9);
    campo.value = v;
  }
  // Boleto de 16 dígitos (começa com 8)
  else if (v[0] === '8') {
    v = v.slice(0, 16);
    if (v.length >= 5) v = v.substring(0, 4) + ' ' + v.substring(4);
    if (v.length >= 9) v = v.substring(0, 9) + ' ' + v.substring(9);
    if (v.length >= 13) v = v.substring(0, 13) + ' ' + v.substring(13);
    campo.value = v;
  }
  // Qualquer outro
  else {
    v = v.slice(0, 16);
    campo.value = v;
  }
  
  // Mostrar mensagem de validação
  const msgDiv = document.getElementById("msgBoleto");
  if (msgDiv) {
    if (BOLETO.validar(campo.value)) {
      msgDiv.innerHTML = "✅ Boleto válido!";
      msgDiv.style.color = "#22c55e";
    } else if (campo.value.length > 0) {
      msgDiv.innerHTML = "❌ Boleto inválido! (Deve ter 10 dígitos começando com 4 ou 16 dígitos começando com 8)";
      msgDiv.style.color = "#ef4444";
    } else {
      msgDiv.innerHTML = "";
    }
  }
}
