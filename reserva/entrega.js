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
      <title>ENTREGA - CTR ${ctr}</title>
      <style>
        @page { 
          size: 80mm auto; 
          margin: 2mm; 
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          width: 76mm; 
          font-family: 'Courier New', Courier, monospace;
          font-size: 16px;
          margin: 0 auto; 
          padding: 0; 
        }
        .ticket { 
          width: 100%; 
          padding: 0;
        }
        .titulo {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 3mm 0;
        }
        .linha {
          margin: 2mm 0;
        }
        .destaque {
          font-weight: bold;
        }
        .divider {
          margin: 3mm 0;
          border-top: 1px solid #000;
        }
        .assinatura {
          margin-top: 6mm;
        }
        .assinatura-linha {
          border-top: 1px solid #000;
          width: 100%;
          margin: 3mm 0 1mm 0;
        }
        .footer {
          font-size: 12px;
          margin-top: 3mm;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="titulo">COMPROVANTE DE ENTREGA</div>
        
        <div class="linha"><span class="destaque">DADOS DO ALUNO</span></div>
        <div class="linha"><span class="destaque">CTR:</span> ${ctr}</div>
        <div class="linha"><span class="destaque">ALUNO:</span> ${aluno ? aluno.toUpperCase() : ''}</div>
        <div class="linha"><span class="destaque">VIA:</span> ${via}ª VIA</div>
        <div class="linha"><span class="destaque">CPF:</span> ${cpfA}</div>
        
        <div class="divider"></div>
        
        <div class="linha">
          Declaro que recebi, nesta data, a Carteira de Estudante Macrorregião 2026, emitida conforme os dados informados e conferidos no ato da entrega. Estou ciente de que o documento é pessoal e intransferível, comprometendo-me a zelar por sua conservação, ciente de que, em caso de perda, extravio ou dano, será necessária nova solicitação conforme as normas vigentes.
        </div>
        
        <div class="divider"></div>
        
        <div class="linha"><span class="destaque">DADOS DO RECEBEDOR</span></div>
        <div class="linha"><span class="destaque">NOME:</span> ${recebedor ? recebedor.toUpperCase() : ''}</div>
        <div class="linha"><span class="destaque">VÍNCULO:</span> ${vinculo}</div>
        <div class="linha"><span class="destaque">CPF:</span> ${cpfR}</div>
        
        <div class="divider"></div>
        
        <div class="linha"><span class="destaque">CTR:</span> ${ctr} / ${via}ª VIA</div>
        
        <div class="assinatura">
          <div class="assinatura-linha"></div>
          <div class="linha">Assinatura do Recebedor</div>
          <div class="footer">${atendente} - ${dataHora}</div>
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
