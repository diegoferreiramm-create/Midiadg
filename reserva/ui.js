// ============================================
// FUNÇÕES DE REIMPRESSÃO
// ============================================

function abrirModalReimprimir() {
    const modal = document.getElementById('modalReimprimirProtocolo');
    if(modal) {
        modal.style.display = 'flex';
        document.getElementById('idReimprimir').value = '';
        const msgDiv = document.getElementById('msgReimprimir');
        if(msgDiv) msgDiv.innerHTML = '';
    }
}

function fecharModalReimprimirProtocolo() {
    const modal = document.getElementById('modalReimprimirProtocolo');
    if(modal) {
        modal.style.display = 'none';
    }
}

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
        
        const response = await fetch(`${urlSistema}?action=buscarCadastroPorId&id=${encodeURIComponent(id)}&parceiro=${user.parceiro}`);
        const resultado = await response.json();
        
        if(!resultado.encontrado) {
            if(msgDiv) msgDiv.innerHTML = `❌ ${resultado.erro || 'ID não encontrado!'}`;
            return;
        }
        
        const dados = resultado.dados;
        
        const telaPrint = window.open('', '_blank');
        if (!telaPrint) {
            alert("⚠️ Permita pop-ups para este site.");
            return;
        }
        
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
                    .reimpressao { background: #ffeb3b; color: #000; font-size: 12px; font-weight: bold; text-align: center; padding: 2mm; margin-bottom: 3mm; border: 1px solid #000; }
                    .id-destaque { font-size: 14px; font-weight: bold; margin-bottom: 3mm; display: flex; justify-content: space-between; align-items: center; }
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
                            <span style="background:#ffeb3b; padding:2px 6px; border-radius:4px;">🔁 REIMPRESSÃO - ${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><b>NOME:</b> ${dados.nome ? dados.nome.toUpperCase() : ''}</div>
                        <div class="info-item"><b>DATA:</b> ${dados.dataSolicitacao ? dados.dataSolicitacao.split(' ')[0] : new Date().toLocaleDateString()}</div>
                        <div class="info-item"><b>CPF:</b> ${dados.cpf}</div>
                        <div class="info-item"><b>VIA:</b> ${dados.via || '1ª'}</div>
                        <div class="info-item"><b>MUNICÍPIO:</b> ${dados.municipio ? dados.municipio.toUpperCase() : ''}</div>
                        <div class="info-item"><b>ATENDENTE:</b> ${dados.atendente || ''}</div>
                    </div>
                    <div class="lgpd">
                        Não nos responsabilizamos por informações no formulário entregue que divergirem dos documentos anexos, conforme Art. 9º da Lei 13.709/2018 (LGPD).
                    </div>
                    <div class="rules">
                        <strong>Procedimento para Entrega da Carteira Estudantil:</strong><br>
                        • Aluno, mãe, pai, irmãos ou filhos: Apresentar o comprovante de solicitação original e um documento oficial com foto.<br>
                        • Em caso de perda ou extravio, apresentar cópia do documento oficial com foto.<br>
                        • Tios, primos, demais parentes ou terceiros: Apresentar comprovante original e documento oficial.<br><br>
                        <strong>EM HIPÓTESE ALGUMA ENTREGAREMOS A TERCEIROS SEM O COMPROVANTE ORIGINAL.</strong>
                    </div>
                    <div class="declaracao">
                        <strong>DECLARAÇÃO DO REQUERENTE:</strong><br><br>
                        Declaro que o pagamento destina-se à solicitação da Carteira de Identidade Estudantil.
                    </div>
                    <div class="final-section">
                        <div class="assinatura-linha"></div>
                        <div class="assinatura-container">
                            <span>Assinatura do Requerente</span>
                            <span>ID: ${dados.id}</span>
                        </div>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
            </body>
            </html>
        `);
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
