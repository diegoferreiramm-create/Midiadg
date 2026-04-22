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

// ============================================
// FUNÇÕES PARA REIMPRESSÃO DE PROTOCOLO
// ============================================

// Abrir o modal
function abrirModalReimprimir() {
    const modal = document.getElementById('modalReimprimirProtocolo');
    if(modal) {
        modal.style.display = 'flex';
        document.getElementById('idReimprimir').value = '';
        document.getElementById('idReimprimir').focus();
        const msgDiv = document.getElementById('msgReimprimir');
        if(msgDiv) msgDiv.innerHTML = '';
    }
}

// Fechar o modal
function fecharModalReimprimirProtocolo() {
    const modal = document.getElementById('modalReimprimirProtocolo');
    if(modal) {
        modal.style.display = 'none';
    }
}

// Buscar e reimprimir (layout IGUAL ao cadastro, com ajustes)
async function reimprimirProtocolo() {
    const id = document.getElementById('idReimprimir').value.trim();
    const msgDiv = document.getElementById('msgReimprimir');
    
    if(!id) {
        if(msgDiv) msgDiv.innerHTML = '❌ Digite o ID do cadastro!';
        return;
    }
    
    if(msgDiv) msgDiv.innerHTML = '🔄 Buscando dados...';
    
    try {
        const userStr = sessionStorage.getItem("usuario");
        if(!userStr) {
            if(msgDiv) msgDiv.innerHTML = '❌ Sessão expirada. Faça login novamente.';
            return;
        }
        
        const user = JSON.parse(userStr);
        
        const response = await fetch(`${urlSistema}?action=buscarCadastroPorId&id=${encodeURIComponent(id)}&parceiro=${user.parceiro}&atendente=${user.nome}`);
        const resultado = await response.json();
        console.log("Resultado da busca:", resultado); // ADICIONE ISSO
        
        if(!resultado.encontrado) {
            if(msgDiv) msgDiv.innerHTML = `❌ ${resultado.erro || 'ID não encontrado!'}`;
            return;
        }
        
        const dados = resultado.dados;
        
        const telaPrint = window.open('', '_blank');
        if (!telaPrint || telaPrint.closed || typeof telaPrint.document === 'undefined') {
            alert("⚠️ O navegador BLOQUEOU a janela de impressão.\n\nVerifique a barra de endereços e clique em 'Sempre permitir pop-ups' para este site.");
            return;
        }
        
        // ============================================
        // VERIFICA QUAL IMPRESSORA ESTÁ CONFIGURADA
        // ============================================
        const tipoImpressora = localStorage.getItem('tipoImpressora') || 'A4';
        
        if (tipoImpressora === 'TERMICA') {
            // IMPRESSÃO TÉRMICA - MESMO TEXTO, APENAS AJUSTE DE CSS
            telaPrint.document.write(`
                <html>
                <head>
                    <title>REIMPRESSÃO - Protocolo ${dados.id}</title>
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
                            <h2>PROTOCOLO DE SOLICITAÇÃO</h2>
                            <div class="id-destaque">
                                <span>Nº BOLETO: ${dados.boleto || 'SEM BOLETO'}</span>
                                <span style="background:#ffeb3b; padding:2px 6px; border-radius:4px;">🔁 REIMPRESSÃO - ${dados.dataSolicitacao ? dados.dataSolicitacao.split(' ')[0] + ' ' + (dados.dataSolicitacao.split(' ')[1] || '') : new Date().toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="info-grid">
                            <div class="info-item"><b>NOME:</b> ${dados.nome ? dados.nome.toUpperCase() : ''}</div>
                            <div class="info-item"><b>NASCIMENTO:</b> ${dados.nasc ? dados.nasc : ''}</div>
                            <div class="info-item"><b>CPF:</b> ${dados.cpf}</div>
                            <div class="info-item"><b>VIA:</b> ${dados.via || '1ª'}</div>
                            <div class="info-item"><b>MUNICÍPIO:</b> ${dados.municipio ? dados.municipio.toUpperCase() : ''}</div>
                            <div class="info-item"><b>ATENDENTE:</b> ${dados.atendente || user.nome}</div>
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
                                <span class="via-info">Via do Aluno / ${dados.parceiro || user.parceiro} / ID: ${dados.id}</span>
                            </div>
                        </div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
                </body>
                </html>
            `);
        } else {
            // IMPRESSÃO A4 - SEU TEXTO ORIGINAL COMPLETO
            telaPrint.document.write(`
                <html>
                <head>
                    <title>REIMPRESSÃO - Protocolo ${dados.id}</title>
                    <style>
                        @page { size: A4 portrait; margin: 0; }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { width: 210mm; height: 297mm; font-family: Arial, sans-serif; background: white; display: flex; flex-direction: column; align-items: center; }
                        .ticket { width: 190mm; margin-top: 5mm; border: 2px solid #000; padding: 5mm; background: white; font-size: 11px; height: 140mm; display: flex; flex-direction: column; }
                        .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 4mm; padding-bottom: 2mm; }
                        .header h2 { font-size: 18px; margin: 1mm 0; }
                        .id-destaque { font-size: 12px; font-weight: bold; margin-bottom: 3mm; display: flex; justify-content: space-between; align-items: center; }
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
                            <div class="id-destaque">
                                <span>Nº BOLETO: ${dados.boleto || 'SEM BOLETO'}</span>
                                <span style="background:#ffeb3b; padding:2px 6px; border-radius:4px;">🔁 REIMPRESSÃO - ${dados.dataSolicitacao ? dados.dataSolicitacao.split(' ')[0] + ' ' + (dados.dataSolicitacao.split(' ')[1] || '') : new Date().toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="info-grid">
                            <div class="info-item"><b>NOME:</b> ${dados.nome ? dados.nome.toUpperCase() : ''}</div>
                            <div class="info-item"><b>DATA:</b> ${dados.dataSolicitacao ? dados.dataSolicitacao.split(' ')[0] : new Date().toLocaleDateString()}</div>
                            <div class="info-item"><b>CPF:</b> ${dados.cpf}</div>
                            <div class="info-item"><b>VIA:</b> ${dados.via || '1ª'}</div>
                            <div class="info-item"><b>MUNICÍPIO:</b> ${dados.municipio ? dados.municipio.toUpperCase() : ''}</div>
                            <div class="info-item"><b>ATENDENTE:</b> ${dados.atendente || user.nome}</div>
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
                                <span class="via-info">Via do Aluno / ${dados.parceiro || user.parceiro} / ID: ${dados.id}</span>
                            </div>
                        </div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
                </body>
                </html>
            `);
        }
        
        telaPrint.document.close();
        
        if(msgDiv) msgDiv.innerHTML = '✅ Protocolo reimpresso!';
        setTimeout(() => {
            fecharModalReimprimirProtocolo();
        }, 1500);
        
    } catch(error) {
        console.error('Erro:', error);
        const msgDiv = document.getElementById('msgReimprimir');
        if(msgDiv) msgDiv.innerHTML = '❌ Erro ao buscar dados.';
    }
}

// ============================================
// CONFIGURAÇÃO DA IMPRESSORA
// ============================================

function abrirConfigImpressora() {
    const modal = document.getElementById('modalConfigImpressora');
    if(modal) {
        modal.style.display = 'flex';
        document.getElementById('msgConfig').innerHTML = '';
        
        // Mostrar qual está salva atualmente
        const atual = localStorage.getItem('tipoImpressora') || 'A4';
        const nomeAtual = atual === 'TERMICA' ? 'Térmica (80mm)' : 'A4 (Comum)';
        document.getElementById('msgConfig').innerHTML = `Atual: ${nomeAtual}`;
    }
}

function fecharConfigImpressora() {
    const modal = document.getElementById('modalConfigImpressora');
    if(modal) {
        modal.style.display = 'none';
    }
}

function salvarConfigImpressora(tipo) {
    localStorage.setItem('tipoImpressora', tipo);
    const nome = tipo === 'TERMICA' ? 'Térmica (80mm)' : 'A4 (Comum)';
    document.getElementById('msgConfig').innerHTML = `✅ Salvo: ${nome}`;
    
    setTimeout(() => {
        fecharConfigImpressora();
    }, 1500);
}

function getTipoImpressora() {
    return localStorage.getItem('tipoImpressora') || 'A4';
}
