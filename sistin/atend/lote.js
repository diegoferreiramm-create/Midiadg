// Lote
function fecharLotePorParceiro() {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  if(!confirm("Deseja fechar o lote atual para o parceiro " + user.parceiro + "?")) return;
  const btn = event?.target;
  if(btn) { btn.disabled = true; btn.innerText = "FECHANDO LOTE..."; }
  fetch(`${urlSistema}?action=fecharLoteAppsScript&parceiro=${user.parceiro}&nomeUsuario=${encodeURIComponent(user.nome)}`)
    .then(res => res.json())
    .then(res => {
      if(res.sucesso) {
        alert(`Lote ${res.loteGerado} fechado com sucesso!`);
        fetch(`${urlSistema}?action=buscarRegistrosDoLote&parceiro=${user.parceiro}&lote=${res.loteGerado}`)
          .then(res2 => res2.json())
          .then(res2 => {
            if(res2.sucesso && res2.registros) {
              imprimirRelatorioLote(res.loteGerado, user.parceiro, user.nome, res2.total, res.dataFechamento, res2.registros);
            } else {
              imprimirRelatorioLote(res.loteGerado, user.parceiro, user.nome, 0, res.dataFechamento, []);
            }
          })
          .catch(err => {
            console.error("Erro ao buscar registros:", err);
            imprimirRelatorioLote(res.loteGerado, user.parceiro, user.nome, 0, res.dataFechamento, []);
          });
        carregarLista();
      } else {
        alert("Erro ao fechar lote: " + res.erro);
      }
    })
    .catch(err => {
      console.error("Erro ao fechar lote:", err);
      alert("Erro na conexão ao fechar lote.");
    })
    .finally(() => {
      if(btn) { btn.disabled = false; btn.innerText = "FECHAR LOTE"; }
    });
}

function imprimirRelatorioLote(lote, parceiro, atendente, totalRegistros, dataFechamento, registros) {
  const telaPrint = window.open('', '_blank');
  if (!telaPrint) {
    alert("Pop-up bloqueado! Permita pop-ups para imprimir.");
    return;
  }
  const dataAtual = new Date();
  const dia = String(dataAtual.getDate()).padStart(2, '0');
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
  const ano = dataAtual.getFullYear();
  const horas = String(dataAtual.getHours()).padStart(2, '0');
  const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
  const segundos = String(dataAtual.getSeconds()).padStart(2, '0');
  const dataFormatada = `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  
  if (registros && registros.length > 0) {
    registros.sort((a, b) => {
      const nomeA = a.nome ? a.nome.toUpperCase() : "";
      const nomeB = b.nome ? b.nome.toUpperCase() : "";
      if (nomeA < nomeB) return -1;
      if (nomeA > nomeB) return 1;
      return 0;
    });
  }
  
  let tabelaHtml = '';
  if (registros && registros.length > 0) {
    registros.forEach((reg, index) => {
      tabelaHtml += `
        <tr style="border-bottom: 1px solid #ccc;">
          <td style="padding: 4px 2px; text-align:center; font-size:12px;">${index + 1}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.id || ''}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.cpf || ''}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.nome || ''}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.nasc || ''}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.municipio || ''}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.tel || ''}</td>
          <td style="padding: 4px 2px; text-align:center; font-size:12px;">${reg.via || ''}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.boleto || ''}</td>
          <td style="padding: 4px 2px; font-size:12px;">${reg.atendente || ''}</td>
         </tr>
      `;
    });
  } else {
    tabelaHtml = '<tr><td colspan="10" style="text-align:center; padding:20px; font-size:12px;">Nenhum registro encontrado neste lote</td></tr>';
  }
  
  telaPrint.document.write(`
    <html>
    <head>
      <title>Relatório Lote ${lote}</title>
      <style>
        @page { size: A4 landscape; margin: 0.5cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; }
        .container { width: 100%; }
        .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 5px; padding-bottom: 3px; }
        .header h1 { font-size: 16px; margin: 2px 0; }
        .header h2 { font-size: 14px; margin: 1px 0; }
        .info { background: #f2f2f2; padding: 6px; margin: 5px 0; display: flex; justify-content: space-between; flex-wrap: wrap; border: 1px solid #ccc; }
        .info-item { margin: 2px 0; font-size: 11px; }
        .info-item b { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 4px 3px; text-align: left; vertical-align: top; }
        th { background: #e5e7eb; font-weight: bold; text-align: center; font-size: 12px; }
        .total { text-align: right; margin: 5px 0; font-weight: bold; padding: 4px; background: #f2f2f2; border: 1px solid #ccc; font-size: 12px; }
        .assinatura { margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; display: flex; justify-content: space-between; font-size: 11px; }
        .footer { margin-top: 5px; text-align: center; font-size: 9px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>RELATÓRIO DE FECHAMENTO DE LOTE</h1>
          <h2>LOTE Nº ${lote}</h2>
        </div>
        <div class="info">
          <div class="info-item"><b>PARCEIRO:</b> ${parceiro}</div>
          <div class="info-item"><b>ATENDENTE:</b> ${atendente}</div>
          <div class="info-item"><b>DATA FECHAMENTO:</b> ${dataFechamento || dataFormatada}</div>
          <div class="info-item"><b>EMISSÃO:</b> ${dataFormatada}</div>
          <div class="info-item"><b>TOTAL:</b> ${totalRegistros}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:5%">#</th>
              <th style="width:6%">ID</th>
              <th style="width:12%">CPF</th>
              <th style="width:20%">NOME</th>
              <th style="width:8%">NASC</th>
              <th style="width:12%">MUNICÍPIO</th>
              <th style="width:10%">TEL</th>
              <th style="width:5%">VIA</th>
              <th style="width:12%">Nº BOLETO</th>
              <th style="width:10%">ATENDENTE</th>
            </tr>
          </thead>
          <tbody>${tabelaHtml}</tbody>
        </table>
        <div class="total">TOTAL DE REGISTROS NO LOTE ${lote}: ${totalRegistros}</div>
        <div class="assinatura">
          <span>_________________________________<br>Assinatura do Responsável</span>
          <span>_________________________________<br>Carimbo/Validação</span>
        </div>
        <div class="footer">Sistema MTECH - Relatório de Fechamento de Lote</div>
      </div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}

function reimprimirLote() {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  const isAdmin = (user.parceiro.toString() === "97");
  const modal = document.getElementById("modalReimprimirLote");
  const selectParceiro = document.getElementById("modalParceiro");
  if (isAdmin) {
    fetch(`${urlSistema}?action=obterListaParceiros`)
      .then(res => res.json())
      .then(parceiros => {
        selectParceiro.innerHTML = '<option value="">SELECIONE O PARCEIRO</option>';
        parceiros.forEach(p => {
          selectParceiro.innerHTML += `<option value="${p}">${p}</option>`;
        });
        selectParceiro.disabled = false;
      })
      .catch(err => {
        console.error("Erro ao carregar parceiros:", err);
        selectParceiro.innerHTML = '<option value="">ERRO AO CARREGAR</option>';
      });
  } else {
    selectParceiro.innerHTML = `<option value="${user.parceiro}">${user.parceiro}</option>`;
    selectParceiro.disabled = true;
  }
  modal.style.display = "flex";
}

function fecharModalReimprimir() {
  document.getElementById("modalReimprimirLote").style.display = "none";
  document.getElementById("modalLote").value = "";
}

function confirmarReimprimirLote() {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  const selectParceiro = document.getElementById("modalParceiro");
  const lote = document.getElementById("modalLote").value.trim();
  let parceiroBusca = "";
  if (user.parceiro.toString() === "97") {
    parceiroBusca = selectParceiro.value;
    if (!parceiroBusca) { alert("Selecione um parceiro!"); return; }
  } else {
    parceiroBusca = user.parceiro;
  }
  if (!lote) { alert("Digite o número do lote!"); return; }
  const btn = event?.target;
  if(btn) btn.disabled = true;
  fetch(`${urlSistema}?action=reimprimirLoteFechado&parceiro=${parceiroBusca}&lote=${lote}`)
    .then(res => res.json())
    .then(res => {
      if(res.sucesso && res.registros && res.registros.length > 0) {
        fecharModalReimprimir();
        const atendenteImpressao = res.usuarioFechamento || user.nome;
        imprimirRelatorioLote(lote, parceiroBusca, atendenteImpressao, res.total, res.dataFechamento, res.registros);
      } else {
        alert("Lote não encontrado ou sem registros para este parceiro.");
      }
    })
    .catch(err => {
      console.error("Erro:", err);
      alert("Erro ao buscar lote.");
    })
    .finally(() => {
      if(btn) btn.disabled = false;
    });
}
