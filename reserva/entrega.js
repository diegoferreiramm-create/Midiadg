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
      <title>ENTREGA - Protocolo ${ctr}</title>
      <style>
        @page { size: 80mm 297mm; margin: 1mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          width: 74mm; 
          font-family: Arial, sans-serif; 
          font-size: 14px;
          margin: 0 auto; 
          padding: 1mm; 
        }
        .ticket { 
          width: 100%; 
          border: 1px solid #000; 
          padding: 2mm; 
        }
        .header { 
          text-align: center; 
          border-bottom: 1px solid #000; 
          margin-bottom: 2mm; 
          padding-bottom: 1mm; 
        }
        .header h2 { 
          font-size: 16px;
          margin: 0; 
        }
        .id-destaque { 
          font-size: 14px;
          font-weight: bold; 
          margin-bottom: 2mm; 
        }
        .info-grid { 
          margin-bottom: 2mm; 
        }
        .info-item { 
          width: 100%; 
          margin-bottom: 1.5mm; 
          font-size: 13px;
        }
        .lgpd { 
          font-size: 11px;
          font-style: italic; 
          margin: 1.5mm 0; 
          border-top: 1px solid #ccc; 
          border-bottom: 1px solid #ccc; 
          padding: 1mm 0; 
          text-align: justify; 
        }
        .rules { 
          font-size: 11px;
          background: #f2f2f2; 
          padding: 1.5mm; 
          border: 1px solid #000; 
          margin: 1.5mm 0; 
          line-height: 1.3; 
        }
        .declaracao { 
          font-size: 11px;
          background: #f2f2f2; 
          padding: 1.5mm; 
          border: 1px solid #000; 
          margin: 1.5mm 0; 
          line-height: 1.3; 
          text-align: justify; 
        }
        .final-section { 
          margin-top: 3mm; 
        }
        .assinatura-linha { 
          border-top: 1px solid #000; 
          width: 100%; 
          margin: 2mm 0 1mm 0; 
        }
        .assinatura-container { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          font-size: 12px;
          font-weight: bold; 
        }
        b { text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h2>COMPROVANTE DE ENTREGA</h2>
          <div class="id-destaque">
            <span>CTR: ${ctr}</span>
            <span style="background:#ffeb3b; padding:2px 6px; border-radius:4px;">✅ ENTREGUE - ${new Date().toLocaleString('pt-BR').split(' ')[0]}</span>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><b>ALUNO:</b> ${aluno ? aluno.toUpperCase() : ''}</div>
          <div class="info-item"><b>CPF:</b> ${cpfA}</div>
          <div class="info-item"><b>VIA:</b> ${via}ª VIA</div>
          <div class="info-item"><b>ATENDENTE:</b> ${atendente}</div>
        </div>
        <div class="info-grid" style="margin-top:2mm; border-top:1px solid #ccc; padding-top:2mm;">
          <div class="info-item"><b>RECEBEDOR:</b> ${recebedor ? recebedor.toUpperCase() : ''}</div>
          <div class="info-item"><b>CPF REC:</b> ${cpfR}</div>
          <div class="info-item"><b>VÍNCULO:</b> ${vinculo}</div>
        </div>
        <div class="lgpd">
          Não nos responsabilizamos por informações no formulário entregue que divergirem dos documentos anexos, conforme Art. 9º da Lei 13.709/2018 (LGPD). A veracidade é de responsabilidade do declarante.
          <strong>CONSULTAR O ANDAMENTO NO SITE WWW.ASESC.ORG.BR</strong>
        </div>
        <div class="rules">
          <strong>Procedimento para Entrega da Carteira Estudantil:</strong><br>
          • Aluno, mãe, pai, irmãos ou filhos: Apresentar o comprovante de solicitação original e um documento oficial com foto.<br>
          • (Em caso de perda ou extravio do comprovante, apresentar uma cópia do documento oficial com foto de quem for receber.)<br>
          • Tios, primos, demais parentes ou terceiros: Apresentar o comprovante de solicitação original e um documento oficial com foto de quem estiver recebendo, juntamente com uma cópia do documento oficial do aluno.<br><br>
          <strong>EM HIPÓTESE ALGUMA ENTREGAREMOS A TERCEIROS SEM O COMPROVANTE DE SOLICITAÇÃO ORIGINAL EM MÃOS.</strong>
        </div>
        <div class="declaracao">
          <strong>DECLARAÇÃO DO RECEBEDOR:</strong><br><br>
          Declaro que recebi, nesta data, a Carteira de Identidade Estudantil, para identificação como estudante, usufruto da meia cultural e conforme critérios da ARCE os benefício do transporte. Estou ciente de que a carteira é pessoal e intransferível, comprometendo-me a zelar por sua conservação, ciente de que, em caso de perda, extravio ou dano, será necessária nova solicitação conforme as normas vigentes.
        </div>
        <div class="final-section">
          <div class="assinatura-linha"></div>
          <div class="assinatura-container">
            <span class="assinatura-texto">Assinatura do Recebedor</span>
            <span class="via-info">CTR: ${ctr} / ${via}ª VIA</span>
          </div>
          <div class="data-atendente" style="text-align:right; font-size:9px; margin-top:1mm; color:#555;">
            ${atendente} - ${dataHora}
          </div>
        </div>
      </div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}
