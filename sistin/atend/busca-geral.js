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
        // Capturar DATA STATUS (coluna N)
        let dStat = "";
        for(let key in item) {
          if(key.toUpperCase().replace(/\s/g,'') === "DATASTATUS") dStat = item[key];
        }
        if(!dStat) dStat = item.dataStatus || item.data_status || item["DATA STATUS"] || "";
        
        // Capturar SITUAÇÃO (coluna R)
        let situacao = item.situacao || item.pagamento || item["SITUACAO"] || item["PAGAMENTO"] || "-";
        
        // Capturar PRAZO (coluna S)
        let prazo = item.prazoPendencia || item.prazo || item["PRAZO"] || "-";
        
        // Capturar Nº ARCE (coluna W)
        let numeroArce = item.numeroArce || item.processo || item["NUMERO_ARCE"] || item["PROCESSO"] || "-";
        
        div.innerHTML += `
          <div class="res-card">
            <b>NOME:</b> ${item.nome}<br>
            <b>CPF:</b> ${item.cpf} | <b>VIA:</b> ${item.via}<br>
            <b>MUNICÍPIO:</b> ${item.municipio} | <b>PARCEIRO:</b> ${item.parceiro}<br>
            <b>CARTEIRA:</b> ${item.numCarteira || item.carteira || 'N/A'}<br>
            <b>STATUS:</b> ${item.status || 'Pendente'} | <b>MOTIVO:</b> ${item.motivo || '-'}<br>
            <b>DATA STATUS:</b> ${dStat}<br>
            <b>SITUAÇÃO:</b> ${situacao}<br>
            <b>PRAZO:</b> ${prazo}<br>
            <b>Nº ARCE:</b> ${numeroArce}<br>
            <b>ATENDENTE:</b> ${item.atendente}<br>
            <small>Última Atualização: ${item.dataAtu || item.dt_atu || '-'}</small>
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
