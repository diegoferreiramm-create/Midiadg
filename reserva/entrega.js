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
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR');
  
  if (!telaPrint) {
    alert("Pop-up bloqueado! Por favor, permita pop-ups para imprimir o comprovante.");
    return;
  }
  
  telaPrint.document.write(`
    <html>
    <head>
      <title>ENTREGA - CTR ${ctr}</title>
      <style>
        @page { 
          size: 80mm auto; 
          margin: 1mm; 
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          width: 74mm; 
          font-family: 'Courier New', Courier, monospace; 
          font-size: 12px;
          margin: 0 auto; 
          padding: 2mm 1mm; 
        }
        .ticket { 
          width: 100%; 
          border: 1.5px solid #000; 
          padding: 3mm 2mm; 
          background: white;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #000; 
          margin-bottom: 3mm; 
          padding-bottom: 2mm; 
        }
        .header h2 { 
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 1mm 0; 
          text-transform: uppercase;
        }
        .header p {
          font-size: 10px;
          margin: 0;
        }
        .ctr-destaque { 
          text-align: center;
          font-size: 18px;
          font-weight: bold; 
          background: #000;
          color: white;
          padding: 2mm;
          margin: 2mm 0;
          letter-spacing: 2px;
        }
        .info-grid { 
          margin-bottom: 3mm; 
          border: 1px solid #000;
          padding: 2mm;
        }
        .info-item { 
          width: 100%; 
          margin-bottom: 1.5mm; 
          font-size: 11px;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 1mm;
        }
        .info-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .info-item b {
          display: inline-block;
          min-width: 35px;
          text-transform: uppercase;
        }
        .declaracao { 
          font-size: 10px;
          line-height: 1.3;
          text-align: justify; 
          border: 1px dashed #000; 
          padding: 2mm; 
          margin: 3mm 0; 
          background: #f9f9f9;
        }
        .recebedor-box {
          border: 1px solid #000;
          padding: 2mm;
          margin: 3mm 0;
          background: #f0f0f0;
        }
        .recebedor-box h4 {
          font-size: 11px;
          text-align: center;
          margin-bottom: 2mm;
          text-transform: uppercase;
        }
        .final-section { 
          margin-top: 3mm; 
        }
        .assinatura-linha { 
          border-top: 1px solid #000; 
          width: 100%; 
          margin: 4mm 0 1mm 0; 
        }
        .assinatura-container { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          font-size: 10px;
          font-weight: bold; 
        }
        .data-atendente {
          text-align: center;
          font-size: 9px;
          margin-top: 2mm;
          padding-top: 1mm;
          border-top: 1px dotted #ccc;
        }
        .status {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          color: green;
          margin: 2mm 0;
          text-transform: uppercase;
        }
        b { 
          text-transform: uppercase; 
        }
        .footer {
          text-align: center;
          font-size: 8px;
          margin-top: 3mm;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h2>COMPROVANTE DE ENTREGA</h2>
          <p>CARTEIRA DE ESTUDANTE 2026</p>
        </div>
        
        <div class="ctr-destaque">
          CTR: ${ctr}
        </div>
        
        <div class="status">
          ✅ ENTREGUE EM ${dataAtual}
        </div>
        
        <div class="info-grid">
          <div class="info-item"><b>ALUNO:</b> ${aluno ? aluno.toUpperCase() : ''}</div>
          <div class="info-item"><b>CPF:</b> ${cpfA}</div>
          <div class="info-item"><b>VIA:</b> ${via}ª VIA</div>
          <div class="info-item"><b>DATA ENTREGA:</b> ${dataAtual}</div>
          <div class="info-item"><b>HORÁRIO:</b> ${horaAtual}</div>
        </div>
        
        <div class="recebedor-box">
          <h4>📋 DADOS DO RECEBEDOR</h4>
          <div class="info-item"><b>NOME:</b> ${recebedor ? recebedor.toUpperCase() : ''}</div>
          <div class="info-item"><b>CPF:</b> ${cpfR}</div>
          <div class="info-item"><b>VÍNCULO:</b> ${vinculo}</div>
        </div>
        
        <div class="declaracao">
          <b>📌 DECLARAÇÃO DE RECEBIMENTO</b><br><br>
          Declaro que recebi, nesta data, a Carteira de Estudante Macrorregião 2026, 
          emitida conforme os dados informados e conferidos no ato da entrega. 
          Estou ciente de que o documento é pessoal e intransferível, comprometendo-me 
          a zelar por sua conservação, ciente de que, em caso de perda, extravio ou dano, 
          será necessária nova solicitação conforme as normas vigentes da ARCE.
        </div>
        
        <div class="final-section">
          <div class="assinatura-linha"></div>
          <div class="assinatura-container">
            <span>Assinatura do Recebedor</span>
            <span>CTR: ${ctr}</span>
          </div>
          <div class="data-atendente">
            <b>Atendente:</b> ${atendente} | ${dataHora}
          </div>
        </div>
        
        <div class="footer">
          _________________________________<br>
          ASSOCIAÇÃO REGIONAL DE CULTURA E EDUCAÇÃO - ARCE<br>
          WWW.ASESC.ORG.BR
        </div>
      </div>
      <script>
        window.onload = function() { 
          window.print(); 
          window.onafterprint = function() { 
            window.close(); 
          }; 
        };
      <\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}
