// ============================================
// PARTE 1: CADASTRO E EDIÇÃO (COM EMAIL)
// ============================================

document.addEventListener('blur', function(e) {
  if (e.target.id === 'cpf' && (typeof modoEdicao !== 'undefined' && !modoEdicao)) { 
    const valorCpf = e.target.value;
    if (!CPF.validar(valorCpf)) return;
    document.getElementById("msgCPF").innerText = "Consultando base de dados...";
    fetch(`${urlSistema}?action=buscarDadosNoBD&cpf=${valorCpf}`)
      .then(res => res.json())
      .then(res => {
        if (res && res.encontrado) {
          document.getElementById("msgCPF").innerText = "Dados recuperados!";
          document.getElementById("nome").value = res.nome || "";
          document.getElementById("municipio").value = res.municipio || "";
          document.getElementById("telefone").value = res.telefone || "";
          document.getElementById("email").value = res.email || ""; // NOVO CAMPO
          if (res.nascimento) {
            try {
              let dataStr = res.nascimento.toString();
              if (dataStr.includes('-')) {
                const partes = dataStr.split('-');
                const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                document.getElementById("nascimento").value = dataFormatada;
              } else if (dataStr.includes('/')) {
                document.getElementById("nascimento").value = dataStr;
              }
            } catch(err) { console.error("Erro ao formatar data:", err); }
          }
        } else {
          document.getElementById("msgCPF").innerText = "CPF não encontrado (Novo cadastro).";
        }
      })
      .catch(err => {
        console.error("Erro na busca:", err);
        document.getElementById("msgCPF").innerText = "Erro ao conectar com o servidor.";
      });
  }
}, true);

async function salvarCadastro() {
  const userStr = sessionStorage.getItem("usuario");
  if(!userStr) { alert("Sessão expirada. Faça login novamente."); return; }
  const user = JSON.parse(userStr);
  
  const cpf = document.getElementById("cpf").value;
  const nome = document.getElementById("nome").value;
  const nascRaw = document.getElementById("nascimento").value;
  const mun = document.getElementById("municipio").value;
  const tel = document.getElementById("telefone").value;
  const email = document.getElementById("email").value; // NOVO CAMPO
  const viaEl = document.querySelector('input[name="via"]:checked');
  const via = viaEl ? viaEl.value : "1ª VIA";
  const boleto = document.getElementById("codigoBoleto").value.trim();
    // ✅ ADICIONE ESTA LINHA - Força o boleto como texto puro
  const boletoTexto = boleto.replace(/^0+/, ''); // Remove zeros à esquerda? NÃO!
  // Na verdade, preserve os zeros:
  const boletoPreservado = "'" + boleto; // Adiciona apóstrofo
  
  // VALIDAÇÃO COM EMAIL OBRIGATÓRIO
  if(!cpf || !nome || !nascRaw || !boleto || !email) { 
    alert("ERRO: CPF, Nome, Nascimento, E-mail e Número do Boleto são obrigatórios!"); 
    return; 
  }
  
  // Validação básica de email
  if(email && !validarEmail(email)) {
    alert("ERRO: Por favor, digite um e-mail válido (exemplo@dominio.com)");
    return;
  }

  if (!idSendoEditado) {
    const btn = document.querySelector("button[onclick='salvarCadastro()']");
    if(btn) { btn.disabled = true; btn.innerText = "Verificando..."; }
    try {
      const response = await fetch(`${urlSistema}?action=verificarBoleto&boleto=${encodeURIComponent(boleto)}`);
      const res = await response.json();
      if (res.existe) {
        alert("❌ Este número de boleto já foi cadastrado! Use outro número.");
        if(btn) { btn.disabled = false; btn.innerText = "CADASTRAR"; }
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar boleto:", error);
    }
  }

  const idFinal = (typeof idSendoEditado !== 'undefined' && idSendoEditado) ? idSendoEditado : "";
  const acao = idFinal ? "editarCadastroAppsScript" : "salvarCadastroAppsScript";
  const btn = document.querySelector("button[onclick='salvarCadastro()']");
  if(btn) { btn.disabled = true; btn.innerText = "Processando..."; }

  const urlFinal = urlSistema + 
    "?action=" + acao +
    "&id=" + encodeURIComponent(idFinal) + 
    "&cpf=" + encodeURIComponent(cpf) +        // 1º
    "&nome=" + encodeURIComponent(nome) +      // 2º
    "&nasc=" + encodeURIComponent(nascRaw) +   // 3º
    "&municipio=" + encodeURIComponent(mun) +  // 4º
    "&tel=" + encodeURIComponent(tel) +        // 5º
    "&email=" + encodeURIComponent(email) +    // 6º ← EMAIL
    "&via=" + encodeURIComponent(via) +        // 7º
    "&atendente=" + encodeURIComponent(user.nome) +     // 8º
    "&parceiro=" + encodeURIComponent(user.parceiro) + // 9º
    "&boleto=" + encodeURIComponent("'" + boleto);   // 10º
  
  try {
    const response = await fetch(urlFinal);
    const res = await response.json();
    if (res.sucesso) {
      alert(idFinal ? `✅ ${via} ATUALIZADA com sucesso!` : "✅ Cadastro SALVO com sucesso!");
      try {
          // Verifica qual impressora está configurada
          const tipoImpressora = localStorage.getItem('tipoImpressora') || 'A4';
          console.log("🔍 Impressora selecionada:", tipoImpressora);  // ← ADICIONADO

          if (tipoImpressora === 'TERMICA') {
              console.log("✅ Entrou no IF da térmica");  // ← ADICIONADO
              // Usa impressão térmica
              if (typeof imprimirProtocoloTermica === "function") {
                  console.log("🎯 Chamando função térmica");  // ← ADICIONADO
                  imprimirProtocoloTermica(
                      res.id || idFinal,
                      res.cpf || cpf,
                      res.nome || nome,
                      res.nasc || nascRaw,
                      mun,
                      via,
                      user.nome,
                      user.parceiro,
                      res.data,
                      res.boleto || boleto
                  );
              } else {
                  console.log("❌ Função térmica NÃO encontrada");  // ← ADICIONADO
                  // Se não existir a função térmica, usa a normal
                  imprimirProtocolo(
                      res.id || idFinal,
                      res.cpf || cpf,
                      res.nome || nome,
                      res.nasc || nascRaw,
                      mun,
                      via,
                      user.nome,
                      user.parceiro,
                      res.data,
                      res.boleto || boleto,
                      email
                  );
              }
          } else {
              console.log("📄 Usando impressão A4 normal");  // ← ADICIONADO
              // Usa impressão A4 normal
              imprimirProtocolo(
                  res.id || idFinal,
                  res.cpf || cpf,
                  res.nome || nome,
                  res.nasc || nascRaw,
                  mun,
                  via,
                  user.nome,
                  user.parceiro,
                  res.data,
                  res.boleto || boleto,
                  email
              );
          }
      } catch (errPrint) { console.error("Erro na impressão:", errPrint); }
      
      // Limpar campos...
      
      // Limpar campos incluindo o email
      document.getElementById("cpf").value = "";
      document.getElementById("nome").value = "";
      document.getElementById("nascimento").value = "";
      document.getElementById("municipio").value = "";
      document.getElementById("telefone").value = "";
      document.getElementById("email").value = ""; // NOVO CAMPO
      document.getElementById("codigoBoleto").value = "";
      if(typeof idSendoEditado !== 'undefined') idSendoEditado = null;
    } else {
      alert("Aviso: " + res.erro);
    }
  } catch (error) {
    console.error("Erro fatal:", error);
    alert("Erro de conexão.");
  } finally {
    if(btn) { btn.disabled = false; btn.innerText = "CADASTRAR"; }
  }
}

// FUNÇÃO AUXILIAR PARA VALIDAR EMAIL
function validarEmail(email) {
  const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return regex.test(email);
}

// ============================================
// PARTE 2: FUNÇÃO DE IMPRESSÃO ATUALIZADA
// ============================================

function imprimirProtocolo(id, cpf, nome, nascimento, municipio, via, atendente, parceiro, data, boleto) {
  const telaPrint = window.open('', '_blank');
  if (!telaPrint || telaPrint.closed || typeof telaPrint.document === 'undefined') {
    alert("⚠️ O cadastro foi salvo, mas o seu navegador BLOQUEOU a janela de impressão.\n\nVerifique a barra de endereços e clique em 'Sempre permitir pop-ups' para este site.");
    return; 
  }
  telaPrint.document.write(`
    <html>
    <head>
      <title>Protocolo CTR - ${id}</title>
      <style>
        @page { size: A4 portrait; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 210mm; height: 297mm; font-family: Arial, sans-serif; background: white; display: flex; flex-direction: column; align-items: center; }
        .ticket { width: 190mm; margin-top: 5mm; border: 2px solid #000; padding: 5mm; background: white; font-size: 11px; height: 140mm; display: flex; flex-direction: column; }
        .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 4mm; padding-bottom: 2mm; }
        .header h2 { font-size: 18px; margin: 1mm 0; }
        .id-destaque { font-size: 14px; font-weight: bold; margin-bottom: 3mm; }
        .info-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 3mm; font-size: 12px; }
        .info-item { width: 48%; margin-bottom: 2mm; }
        .lgpd { font-size: 8px; font-style: italic; margin: 2mm 0; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 1.5mm 0; text-align: justify; }
        .rules { font-size: 8px; background: #f2f2f2; padding: 2mm; border: 1px solid #000; margin: 2mm 0; line-height: 1.3; }
        .declaracao { font-size: 10px; background: #f2f2f2; padding: 2mm; border: 1px solid #000; margin: 2mm 0; line-height: 1.3; text-align: justify; }
        .final-section { margin-top: 8mm; display: flex; flex-direction: column; }
        .assinatura-linha { border-top: 2px solid #000; width: 100%; margin: 5mm 0 2mm 0; }
        .assinatura-container { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold; }
        b { text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h2>PROTOCOLO DE SOLICITAÇÃO</h2>
          <div class="id-destaque">Nº BOLETO: ${boleto}</div>
        </div>
        <div class="info-grid">
          <div class="info-item"><b>NOME:</b> ${nome ? nome.toUpperCase() : ''}</div>
          <div class="info-item"><b>DATA:</b> ${data ? data.split(' ')[0] : ''}</div>
          <div class="info-item"><b>CPF:</b> ${cpf}</div>
          <div class="info-item"><b>VIA:</b> ${via}</div>
          <div class="info-item"><b>MUNICÍPIO:</b> ${municipio ? municipio.toUpperCase() : ''}</div>
          <div class="info-item"><b>ATENDENTE:</b> ${atendente}</div>
        </div>
        <div class="lgpd">
          Não nos responsabilizamos por informações no formulário entregue que divergirem dos documentos anexos, conforme Art. 9º da Lei 13.709/2018 (LGPD). A veracidade é de responsabilidade do declarante.
        </div>
        <div class="rules">
          <strong>Procedimento para Entrega da Carteira Estudantil:</strong><br>
          • Aluno, mãe, pai, irmãos ou filhos: Apresentar o comprovante de solicitação original e um documento oficial com foto.<br>
          • (Em caso de perda ou extravio do comprovante, apresentar uma cópia do documento oficial com foto de quem for receber.)<br>
          • Tios, primos, demais parentes ou terceiros: Apresentar o comprovante de solicitação original e um documento oficial com foto de quem estiver recebendo, juntamente com uma cópia do documento oficial do aluno.<br><br>
          <strong>EM HIPÓTESE ALGUMA ENTREGAREMOS A TERCEIROS SEM O COMPROVANTE DE SOLICITAÇÃO ORIGINAL EM MÃOS.</strong>
        </div>
        <div class="declaracao">
          <strong>DECLARAÇÃO DO REQUERENTE:</strong><br><br>
          Declaro que o pagamento destina-se à solicitação da Carteira de Identidade Estudantil, para identificação como estudante, usufruto da meia cultural e conforme critérios da ARCE os benefício do transporte. Estou ciente de que NÃO HAVERÁ DEVOLUÇÃO do valor em caso de não atendimento aos critérios da ARCE. Havendo indeferimento, terei 90 (noventa) dias corridos para regularizar a documentação. Não havendo regularização, a carteira será emitida apenas para a meia cultural. A solicitação somente será INICIADA APÓS A ENTREGA INTEGRAL DA DOCUMENTAÇÃO em posto de atendimento. A apresentação de documento falso é crime, conforme o Código Penal.
        </div>
        <div class="final-section">
          <div class="assinatura-linha"></div>
          <div class="assinatura-container">
            <span class="assinatura-texto">Assinatura do Requerente</span>
            <span class="via-info">Via do Aluno / ${parceiro} / ID: ${id}</span>
          </div>
        </div>
      </div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}

// ============================================
// PARTE 3: FUNÇÕES DE EDIÇÃO ATUALIZADAS
// ============================================

function prepararEdicao(item) {
  idSendoEditado = item.id; 
  const popUp = document.getElementById('corrigirBox');
  if(popUp) popUp.style.display = 'flex'; 
  if(document.getElementById("edit_cpf")) document.getElementById("edit_cpf").value = item.cpf || "";
  if(document.getElementById("edit_nome")) document.getElementById("edit_nome").value = item.nome || "";
  if(document.getElementById("edit_municipio")) document.getElementById("edit_municipio").value = item.municipio || "";
  if(document.getElementById("edit_telefone")) document.getElementById("edit_telefone").value = item.tel || "";
  if(document.getElementById("edit_email")) document.getElementById("edit_email").value = item.email || ""; // NOVO CAMPO
  if(document.getElementById("edit_codigoBoleto")) document.getElementById("edit_codigoBoleto").value = item.boleto || "";
  const viaValor = item.via || "1ª VIA";
  const labelVia = document.getElementById("edit_label_via");
  if(labelVia) labelVia.innerText = viaValor.toUpperCase();
  const hiddenVia = document.getElementById("edit_via_hidden");
  if(hiddenVia) hiddenVia.value = viaValor;
  if(item.nasc && document.getElementById("edit_nascimento")) {
    const p = item.nasc.split('/');
    if(p.length === 3) {
      document.getElementById("edit_nascimento").value = `${p[2]}-${p[1]}-${p[0]}`;
    }
  }
}

async function executarEdicao() {
  const userStr = sessionStorage.getItem("usuario");
  if(!userStr) return alert("Sessão expirada. Faça login novamente.");
  const user = JSON.parse(userStr);
  const id = idSendoEditado;
  const cpf = document.getElementById("edit_cpf").value;
  const nome = document.getElementById("edit_nome").value;
  const nasc = document.getElementById("edit_nascimento").value;
  const mun = document.getElementById("edit_municipio").value;
  const tel = document.getElementById("edit_telefone").value;
  const email = document.getElementById("edit_email").value; // NOVO CAMPO
  const boleto = document.getElementById("edit_codigoBoleto").value;
  const via = document.getElementById("edit_via_hidden").value;
  
  // Validação com email obrigatório
  if(!cpf || !nome || !email) {
    alert("ERRO: CPF, Nome e E-mail são obrigatórios!");
    return;
  }
  
  if(email && !validarEmail(email)) {
    alert("ERRO: Por favor, digite um e-mail válido!");
    return;
  }
  
  if(!via) { alert("Erro: Via não detectada."); return; }
  
  let dataFormatada = nasc;
  if(nasc && nasc.includes("-")) {
    const p = nasc.split("-");
    dataFormatada = `${p[2]}/${p[1]}/${p[0]}`;
  }
  
  const btn = document.querySelector("#corrigirBox button[onclick='executarEdicao()']");
  if(btn) { btn.disabled = true; btn.innerText = "SALVANDO..."; }
  
  const urlFinal = `${urlSistema}?action=editarCadastroAppsScript` +
    `&id=${encodeURIComponent(id)}` +
    `&cpf=${encodeURIComponent(cpf)}` +
    `&nome=${encodeURIComponent(nome)}` +
    `&nasc=${encodeURIComponent(dataFormatada)}` +
    `&municipio=${encodeURIComponent(mun)}` +
    `&tel=${encodeURIComponent(tel)}` +
    `&email=${encodeURIComponent(email)}` + // NOVO CAMPO
    `&via=${encodeURIComponent(via)}` + 
    `&atendente=${encodeURIComponent(user.nome)}` +
    `&parceiro=${encodeURIComponent(user.parceiro)}` +
    `&boleto=${encodeURIComponent(boleto)}`;
  
  try {
    const response = await fetch(urlFinal);
    const res = await response.json();
    if (res.sucesso) {
      alert("✅ Atualizado com sucesso!");
      document.getElementById('corrigirBox').style.display = 'none';
      if(typeof carregarLista === "function") carregarLista();
    } else {
      alert("Erro ao salvar: " + res.erro);
    }
  } catch (error) {
    alert("Erro de conexão com o servidor.");
  } finally {
    if(btn) { btn.disabled = false; btn.innerText = "SALVAR ALTERAÇÕES"; }
  }
}

async function executarConserto() {
  const userStr = sessionStorage.getItem("usuario");
  if(!userStr) { alert("Sessão expirada!"); return; }
  const user = JSON.parse(userStr);
  const id = idSendoEditado;
  const cpf = document.getElementById("cpf").value;
  const nome = document.getElementById("nome").value;
  const nascRaw = document.getElementById("nascimento").value;
  const mun = document.getElementById("municipio").value;
  const tel = document.getElementById("telefone").value;
  const email = document.getElementById("email").value; // NOVO CAMPO
  const boleto = document.getElementById("codigoBoleto").value.trim();
  const viaEl = document.querySelector('input[name="via"]:checked');
  const via = viaEl ? viaEl.value : "1ª VIA";
  
  if(!cpf || !nome || !nascRaw || !boleto || !email) { 
    alert("ERRO: CPF, Nome, Nascimento, E-mail e Número do Boleto são obrigatórios!"); 
    return; 
  }
  
  if(email && !validarEmail(email)) {
    alert("ERRO: Por favor, digite um e-mail válido!");
    return;
  }
  
  let nascParaEnvio = nascRaw;
  if(nascRaw.includes("-")) {
    const p = nascRaw.split("-");
    nascParaEnvio = `${p[2]}/${p[1]}/${p[0]}`;
  }
  
 const urlFinal = urlSistema + 
  "?action=" + acao +
  "&id=" + encodeURIComponent(idFinal) + 
  "&cpf=" + encodeURIComponent(cpf) +        // 1º
  "&nome=" + encodeURIComponent(nome) +      // 2º
  "&nasc=" + encodeURIComponent(nascRaw) +   // 3º
  "&municipio=" + encodeURIComponent(mun) +  // 4º
  "&tel=" + encodeURIComponent(tel) +        // 5º
  "&via=" + encodeURIComponent(via) +        // 6º ← VIA
  "&parceiro=" + encodeURIComponent(user.parceiro) + // 7º ← PARCEIRO
  "&atendente=" + encodeURIComponent(user.nome) +    // 8º ← ATENDENTE
  "&boleto=" + encodeURIComponent(boleto) +  // 9º
  "&email=" + encodeURIComponent(email);     // 10º ← EMAIL (ÚLTIMO)
  
  const btn = document.querySelector("button[onclick='executarConserto()']");
  if(btn) { btn.disabled = true; btn.innerText = "ATUALIZANDO..."; }
  
  try {
    const response = await fetch(urlFinal);
    const res = await response.json();
    if (res.sucesso) {
      alert("✅ Registro consertado com sucesso!");
      if (typeof imprimirProtocolo === "function") {
          imprimirProtocolo(id, cpf, nome, nascParaEnvio, mun, via, user.nome, user.parceiro, res.data, boleto, email);
      }
      document.getElementById("cpf").value = "";
      document.getElementById("nome").value = "";
      document.getElementById("nascimento").value = "";
      document.getElementById("municipio").value = "";
      document.getElementById("telefone").value = "";
      document.getElementById("email").value = ""; // NOVO CAMPO
      document.getElementById("codigoBoleto").value = "";
      if(btn) {
        btn.innerText = "CADASTRAR";
        btn.setAttribute("onclick", "salvarCadastro()");
        btn.style.backgroundColor = ""; 
      }
      idSendoEditado = null;
      modoEdicao = false;
    } else {
      alert("Aviso do Servidor: " + res.erro);
    }
  } catch (error) {
    console.error("Erro fatal:", error);
    alert("Erro de conexão ao consertar.");
  } finally {
    if(btn) btn.disabled = false;
  }
}

// ============================================
// FUNÇÃO DE IMPRESSÃO TÉRMICA PARA CADASTRO
// ============================================

function imprimirProtocoloTermica(id, cpf, nome, nascimento, municipio, via, atendente, parceiro, data, boleto) {
  const telaPrint = window.open('', '_blank');
  if (!telaPrint || telaPrint.closed || typeof telaPrint.document === 'undefined') {
    alert("⚠️ O cadastro foi salvo, mas o seu navegador BLOQUEOU a janela de impressão.\n\nVerifique a barra de endereços e clique em 'Sempre permitir pop-ups' para este site.");
    return; 
  }
  
  telaPrint.document.write(`
    <html>
    <head>
      <title>Protocolo CTR - ${id}</title>
      <style>
          @page { size: 80mm 297mm; margin: 1mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
              width: 74mm; 
              font-family: Arial, sans-serif; 
              font-size: 14px;      /* ← AUMENTADO de 12px para 14px */
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
              font-size: 16px;      /* ← AUMENTADO de 12px para 16px */
              margin: 0; 
          }
          .id-destaque { 
              font-size: 14px;      /* ← AUMENTADO de 11px para 14px */
              font-weight: bold; 
              margin-bottom: 2mm; 
          }
          .info-grid { 
              margin-bottom: 2mm; 
          }
          .info-item { 
              width: 100%; 
              margin-bottom: 1.5mm; 
              font-size: 13px;      /* ← AUMENTADO de 11px para 13px */
          }
          .lgpd { 
              font-size: 11px;      /* ← AUMENTADO de 9px para 11px */
              font-style: italic; 
              margin: 1.5mm 0; 
              border-top: 1px solid #ccc; 
              border-bottom: 1px solid #ccc; 
              padding: 1mm 0; 
              text-align: justify; 
          }
          .rules { 
              font-size: 11px;      /* ← AUMENTADO de 9px para 11px */
              background: #f2f2f2; 
              padding: 1.5mm; 
              border: 1px solid #000; 
              margin: 1.5mm 0; 
              line-height: 1.3; 
          }
          .declaracao { 
              font-size: 11px;      /* ← AUMENTADO de 10px para 11px */
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
              font-size: 12px;      /* ← AUMENTADO de 10px para 12px */
              font-weight: bold; 
          }
          b { text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
            <h2>PROTOCOLO DE SOLICITAÇÃO</h2>
            <div class="id-destaque" style="display: flex; justify-content: space-between;">
                <span>Nº BOLETO: ${boleto}</span>
                <span>DATA: ${new Date().toLocaleString()}</span>
            </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><b>NOME:</b> ${nome ? nome.toUpperCase() : ''}</div>
          <div class="info-item"><b>NASCIMENTO:</b> ${nascimento ? nascimento : ''}</div>
          <div class="info-item"><b>CPF:</b> ${cpf}</div>
          <div class="info-item"><b>VIA:</b> ${via}</div>
          <div class="info-item"><b>MUNICÍPIO:</b> ${municipio ? municipio.toUpperCase() : ''}</div>
          <div class="info-item"><b>ATENDENTE:</b> ${atendente}</div>
        </div>
        <div class="lgpd">
          Não nos responsabilizamos por informações no formulário entregue que divergirem dos documentos anexos, conforme Art. 9º da Lei 13.709/2018 (LGPD). A veracidade é de responsabilidade do declarante.
        </div>
        <div class="rules">
          <strong>Procedimento para Entrega da Carteira Estudantil:</strong><br>
          • Aluno, mãe, pai, irmãos ou filhos: Apresentar o comprovante de solicitação original e um documento oficial com foto.<br>
          • (Em caso de perda ou extravio do comprovante, apresentar uma cópia do documento oficial com foto de quem for receber.)<br>
          • Tios, primos, demais parentes ou terceiros: Apresentar o comprovante de solicitação original e um documento oficial com foto de quem estiver recebendo, juntamente com uma cópia do documento oficial do aluno.<br><br>
          <strong>EM HIPÓTESE ALGUMA ENTREGAREMOS A TERCEIROS SEM O COMPROVANTE DE SOLICITAÇÃO ORIGINAL EM MÃOS.</strong>
        </div>
        <div class="declaracao">
          <strong>DECLARAÇÃO DO REQUERENTE:</strong><br><br>
          Declaro que o pagamento destina-se à solicitação da Carteira de Identidade Estudantil, para identificação como estudante, usufruto da meia cultural e conforme critérios da ARCE os benefício do transporte. Estou ciente de que NÃO HAVERÁ DEVOLUÇÃO do valor em caso de não atendimento aos critérios da ARCE. Havendo indeferimento, terei 90 (noventa) dias corridos para regularizar a documentação. Não havendo regularização, a carteira será emitida apenas para a meia cultural. A solicitação somente será INICIADA APÓS A ENTREGA INTEGRAL DA DOCUMENTAÇÃO em posto de atendimento. A apresentação de documento falso é crime, conforme o Código Penal.
        </div>
        <div class="final-section">
          <div class="assinatura-linha"></div>
          <div class="assinatura-container">
            <span class="assinatura-texto">Assinatura do Requerente</span>
            <span class="via-info">Via do Aluno / ${parceiro} / ID: ${id}</span>
          </div>
        </div>
      </div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
    </body>
    </html>
  `);
  telaPrint.document.close();
}
