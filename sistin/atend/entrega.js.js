// Entrega
document.addEventListener('blur', function(e){
  if(e.target.id === "codigoCtr"){
    const ctr = e.target.value.trim();
    if(!ctr) return;
    const userStr = sessionStorage.getItem("usuario");
    if(!userStr) return;
    const user = JSON.parse(userStr);
    fetch(`${urlSistema}?action=buscarPorCodigoAppsScript&ctr=${ctr}&parceiro=${user.parceiro}`)
      .then(res => res.json())
      .then(aluno => {
        if(aluno && aluno.encontrado) {
          alunoEncontradoGlobal = aluno;
          document.getElementById("resNomeAluno").innerText = aluno.nome;
          document.getElementById("resCpfAluno").innerText = aluno.cpf; 
          document.getElementById("infoAlunoEntrega").style.display = "block";
          if(aluno.via) {
            const vLimpa = aluno.via.toString().replace(/\D/g, '');
            const radioVia = document.getElementById("via" + vLimpa);
            if(radioVia) radioVia.checked = true;
          }
        } else {
          document.getElementById("infoAlunoEntrega").style.display = "none";
          alunoEncontradoGlobal = null;
          alert("CTR não encontrado!");
        }
      })
      .catch(err => console.error("Erro na busca:", err));
  }
}, true);

function salvarEntrega() {
  const ctr = document.getElementById("codigoCtr").value;
  const isTerceiro = document.getElementById("checkTerceiro").checked;
  if(!alunoEncontradoGlobal) { 
    alert("Informe um CTR válido e aguarde a busca."); 
    return; 
  }
  const nomeRecebedor = isTerceiro ? document.getElementById("nomeTerceiro").value : alunoEncontradoGlobal.nome;
  const cpfRecebedor = isTerceiro ? document.getElementById("cpfTerceiro").value : alunoEncontradoGlobal.cpf;
  const vinculo = isTerceiro ? document.getElementById("parentesco").value : "Titular";
  const viaEl = document.querySelector('input[name="viaEntrega"]:checked');
  const via = viaEl ? viaEl.value : "1";
  if(isTerceiro && (!nomeRecebedor || !cpfRecebedor || !vinculo)) { 
    alert("Preencha todos os campos do recebedor!"); 
    return; 
  }
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  const btn = document.querySelector("button[onclick='salvarEntrega()']");
  if(btn) { btn.disabled = true; btn.innerText = "Gravando..."; }
  const urlFinal = `${urlSistema}?action=registrarEntregaAppsScript` +
    `&ctr=${encodeURIComponent(ctr)}` +
    `&cpfAluno=${encodeURIComponent(alunoEncontradoGlobal.cpf)}` +
    `&nomeAluno=${encodeURIComponent(alunoEncontradoGlobal.nome)}` +
    `&cpfRec=${encodeURIComponent(cpfRecebedor)}` +
    `&nomeRec=${encodeURIComponent(nomeRecebedor)}` +
    `&vinculo=${encodeURIComponent(vinculo)}` +
    `&atendente=${encodeURIComponent(user.nome)}` +
    `&parceiro=${encodeURIComponent(user.parceiro)}` +
    `&via=${encodeURIComponent(via)}`;
  fetch(urlFinal)
    .then(res => res.json())
    .then(res => {
      if(res.sucesso) {
        alert("✅ Entrega realizada com sucesso!");
        imprimirProtocoloEntrega(ctr, alunoEncontradoGlobal.nome, alunoEncontradoGlobal.cpf, nomeRecebedor, cpfRecebedor, vinculo, user.nome, via);
        document.getElementById("codigoCtr").value = "";
        document.getElementById("infoAlunoEntrega").style.display = "none";
        if(isTerceiro) {
          document.getElementById("nomeTerceiro").value = "";
          document.getElementById("cpfTerceiro").value = "";
          document.getElementById("parentesco").value = "";
          document.getElementById("checkTerceiro").checked = false;
          if(typeof toggleTerceiro === "function") toggleTerceiro();
        }
        const v1 = document.getElementById("via1");
        if(v1) v1.checked = true;
        alunoEncontradoGlobal = null;
      } else {
        alert("❌ Erro ao salvar: " + res.erro);
      }
    })
    .catch(err => {
      console.error("Erro na entrega:", err);
      alert("Erro de conexão com o servidor.");
    })
    .finally(() => {
      if(btn) { btn.disabled = false; btn.innerText = "CONFIRMAR ENTREGA"; }
    });
}

function toggleTerceiro() {
    const checkTerceiro = document.getElementById("checkTerceiro");
    const camposTerceiro = document.getElementById("camposTerceiro");
    const nomeTerceiro = document.getElementById("nomeTerceiro");
    const cpfTerceiro = document.getElementById("cpfTerceiro");
    const parentesco = document.getElementById("parentesco");
    if (checkTerceiro && camposTerceiro) {
        if (checkTerceiro.checked) {
            camposTerceiro.style.display = "block";
            if (nomeTerceiro) { nomeTerceiro.disabled = false; nomeTerceiro.readOnly = false; nomeTerceiro.required = true; nomeTerceiro.style.background = "#1e293b"; }
            if (cpfTerceiro) { cpfTerceiro.disabled = false; cpfTerceiro.readOnly = false; cpfTerceiro.required = true; cpfTerceiro.style.background = "#1e293b"; }
            if (parentesco) { parentesco.disabled = false; parentesco.required = true; parentesco.style.background = "#1e293b"; }
            if (nomeTerceiro) nomeTerceiro.value = "";
            if (cpfTerceiro) cpfTerceiro.value = "";
            if (parentesco) parentesco.value = "";
        } else {
            camposTerceiro.style.display = "none";
            if (nomeTerceiro) { nomeTerceiro.disabled = true; nomeTerceiro.readOnly = true; nomeTerceiro.value = ""; nomeTerceiro.style.background = "#0f172a"; }
            if (cpfTerceiro) { cpfTerceiro.disabled = true; cpfTerceiro.readOnly = true; cpfTerceiro.value = ""; cpfTerceiro.style.background = "#0f172a"; }
            if (parentesco) { parentesco.disabled = true; parentesco.value = ""; parentesco.style.background = "#0f172a"; }
            const msgCpf = document.getElementById("msgCPFTerceiro");
            if (msgCpf) msgCpf.innerText = "";
        }
    }
}

function imprimirProtocoloEntrega(ctr, aluno, cpfA, recebedor, cpfR, vinculo, atendente, via) {
  const telaPrint = window.open('', '_blank');
  const dataHora = new Date().toLocaleString('pt-BR');
  if (!telaPrint) {
    alert("Pop-up bloqueado! Por favor, permita pop-ups para imprimir o comprovante.");
    return;
  }
  telaPrint.document.write(`
    <html>
    <head>
      <title>Entrega CTR ${ctr}</title>
      <style>
        @page { size: A4 portrait; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 210mm; height: 297mm; font-family: Arial, sans-serif; background: white; display: flex; flex-direction: column; align-items: center; }
        .ticket { width: 190mm; margin-top: 5mm; border: 2px solid #000; padding: 5mm; background: white; font-size: 11px; height: 140mm; display: flex; flex-direction: column; }
        .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 4mm; padding-bottom: 2mm; }
        .header h2 { font-size: 18px; margin: 1mm 0; }
        .section-title { font-size: 12px; font-weight: bold; background: #f2f2f2; padding: 2mm; border: 1px solid #000; margin: 3mm 0 2mm 0; }
        .info-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 2mm; font-size: 12px; }
        .info-item { width: 48%; margin-bottom: 2mm; }
        .declaracao { font-size: 10px; line-height: 1.4; text-align: justify; border: 1px dashed #000; padding: 3mm; margin: 3mm 0; }
        .final-section { margin-top: auto; display: flex; flex-direction: column; }
        .assinatura-linha { border-top: 2px solid #000; width: 100%; margin: 5mm 0 1mm 0; }
        .assinatura-container { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold; margin-top: 1mm; }
        .data-atendente { text-align: right; font-size: 9px; margin-top: 1mm; color: #555; }
        b { text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header"><h2>COMPROVANTE DE ENTREGA</h2></div>
        <div class="section-title">DADOS DO ALUNO</div>
        <div class="info-grid">
          <div class="info-item"><b>CTR:</b> ${ctr}</div>
          <div class="info-item"><b>VIA:</b> ${via}ª VIA</div>
          <div class="info-item"><b>ALUNO:</b> ${aluno}</div>
          <div class="info-item"><b>CPF:</b> ${cpfA}</div>
        </div>
        <div class="declaracao">
          Declaro que recebi, nesta data, a Carteira de Estudante Macrorregião 2026, emitida conforme os dados informados e conferidos no ato da entrega. Estou ciente de que o documento é pessoal e intransferível, comprometendo-me a zelar por sua conservação, ciente de que, em caso de perda, extravio ou dano, será necessária nova solicitação conforme as normas vigentes.
        </div>
        <div class="section-title">DADOS DO RECEBEDOR</div>
        <div class="info-grid">
          <div class="info-item"><b>NOME:</b> ${recebedor}</div>
          <div class="info-item"><b>CPF:</b> ${cpfR}</div>
          <div class="info-item"><b>VÍNCULO:</b> ${vinculo}</div>
        </div>
        <div class="final-section">
          <div class="assinatura-linha"></div>
          <div class="assinatura-container">
            <span class="ctr-info">CTR: ${ctr} / ${via}ª VIA</span>
            <span class="assinatura-texto">Assinatura do Recebedor</span>
          </div>
          <div class="data-atendente">${atendente} - ${dataHora}</div>
        </div>
      </div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}