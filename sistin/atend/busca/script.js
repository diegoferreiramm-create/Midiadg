// URL do Google Apps Script (Verifique se é a versão mais atualizada)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxO3a3KbHj8naVTrrTRlKQcfHrElbQ54HloepIT2Cvd1kxWJXjsJyV225-3pPVBEB0/exec';

// ==================== FUNÇÕES DE INTERFACE ====================

const hideResult = () => {
    const el = document.getElementById('resultArea');
    if (el) el.style.display = 'none';
};

const showResult = () => {
    const el = document.getElementById('resultArea');
    if (el) {
        el.style.display = 'block';
        el.scrollIntoView({ behavior: 'smooth' });
    }
};

const showLoading = () => {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'flex';
};

const hideLoading = () => {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'none';
};

const showToast = (message, type) => {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast-message ${type || 'error'}`;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.style.display = 'none', 300);
    }, 5000);
};

// ==================== FUNÇÕES AUXILIARES ====================

function limparCPF(cpf) {
    return cpf.replace(/[^\d]/g, '');
}

function formatarData(data) {
    if (!data || data === 'Não informado') return data;
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    return data;
}

// ==================== COMUNICAÇÃO COM O SERVIDOR ====================

async function buscarDados(cpf, dataNasc) {
    const dados = { cpf: cpf, dataNascimento: dataNasc };
    
    console.log('Enviando requisição para:', SCRIPT_URL);
    
    try {
        const urlGet = `${SCRIPT_URL}?cpf=${cpf}&dataNascimento=${dataNasc}`;
        const responseGet = await fetch(urlGet, { method: 'GET' });
        const text = await responseGet.text();
        
        try {
            return JSON.parse(text);
        } catch(e) {
            console.log('Resposta não é JSON:', text);
            return { success: false, message: 'Erro no servidor' };
        }
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// ==================== EXIBIR RESULTADO (CORRIGIDA) ====================

function exibirResultado(result) {
    const container = document.getElementById('resultContent');
    if (!container) return;
    
    if (!result.success || !result.data) {
        container.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <span style="font-size: 3rem;">⚠️</span>
                <h3 style="color: #ef476f;">Nenhum registro encontrado</h3>
                <p>${result.message || 'Verifique se o CPF e a Data de Nascimento estão corretos.'}</p>
            </div>
        `;
        return;
    }
    
    const d = result.data;
    
    const formatValue = (value) => {
        if (!value || value === '' || value === 'Não informado') return '---';
        return value;
    };
    
    // Verifica se o status é indeferido
    const statusIndeferido = d.status === 'Solicitação Indeferida pela ARCE' || 
                              d.status === 'Solicitação Indeferida na Entidade Estudantil';
    
    const botaoEnviarDocs = statusIndeferido ? `
        <button id="btnEnviarDocs" style="width:100%; padding:12px; background:#e67e22; color:white; border:none; border-radius:8px; cursor:pointer; margin-bottom:10px;">
            📎 Enviar Documentos Pendentes
        </button>
    ` : '';
    
    container.innerHTML = `
        <div class="dados-usuario">
            <!-- Dados Pessoais -->
            <div style="background: #f0f7ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #0056b3;">👤 Dados Pessoais</h3>
                <div class="info-row"><div class="info-label">CPF:</div><div class="info-value"><strong>${formatValue(d.cpf)}</strong></div></div>
                <div class="info-row"><div class="info-label">Nome:</div><div class="info-value">${formatValue(d.nome)}</div></div>
                <div class="info-row"><div class="info-label">Nascimento:</div><div class="info-value">${formatValue(d.nascimento)}</div></div>
                <div class="info-row"><div class="info-label">Município:</div><div class="info-value">${formatValue(d.municipio)}</div></div>
                <div class="info-row"><div class="info-label">Telefone:</div><div class="info-value">${formatValue(d.telefone)}</div></div>
                <div class="info-row"><div class="info-label">Via:</div><div class="info-value">${formatValue(d.via)}</div></div>
                <div class="info-row"><div class="info-label">Data Solicitação:</div><div class="info-value">${formatValue(d.data)}</div></div>
            </div>
            
            <!-- Status -->
            <div style="background: #fff8f0; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #e67e22;">📊 Status do Processo</h3>
                <div class="info-row"><div class="info-label">Status:</div><div class="info-value"><span class="status-badge ${d.status === 'Aprovado' ? 'status-ok' : 'status-error'}">${formatValue(d.status)}</span></div></div>
                <div class="info-row"><div class="info-label">Motivo:</div><div class="info-value">${formatValue(d.motivo)}</div></div>
                <div class="info-row"><div class="info-label">Data Status:</div><div class="info-value">${formatValue(d.dataStatus)}</div></div>
                <div class="info-row"><div class="info-label">Prazo quando Indeferido para Conserto:</div><div class="info-value">${formatValue(d.prazo)}</div></div>
                <div class="info-row"><div class="info-label">Pagamento:</div><div class="info-value">${formatValue(d.pagamento)}</div></div>
                <div class="info-row"><div class="info-label">Nº Carteira:</div><div class="info-value">${formatValue(d.numeroCarteira)}</div></div>
            </div>
            
            <!-- Botões -->
            <div style="margin-top: 25px;">
                ${botaoEnviarDocs}
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="window.print()" style="flex:1; padding:12px; background:#4361ee; color:white; border:none; border-radius:8px; cursor:pointer;">🖨️ Imprimir</button>
                    <button onclick="location.reload()" style="flex:1; padding:12px; background:#edf2f4; color:#2b2d42; border:none; border-radius:8px; cursor:pointer;">🔍 Nova Consulta</button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar event listener para o botão de enviar documentos
    if (statusIndeferido) {
        const btnEnviarDocs = document.getElementById('btnEnviarDocs');
        if (btnEnviarDocs) {
            btnEnviarDocs.addEventListener('click', function() {
                abrirFormularioDocumentos(d);
            });
        }
    }
}

// ==================== ESCREVER NA NOVA ABA ====================

function escreverNaNovaAba(novaAba, result) {
    if (!result.success || !result.data) {
        novaAba.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Consulta - Não Encontrado</title>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="style.css">
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 Consulta de Beneficiários</h1>
                    </div>
                    <div class="form-card" style="text-align:center; padding: 40px;">
                        <span style="font-size: 3rem;">⚠️</span>
                        <h3 style="color: #ef476f;">Nenhum registro encontrado</h3>
                        <p>${result.message || 'Verifique os dados informados.'}</p>
                        <button onclick="window.close()" style="margin-top:20px; padding:12px 24px; background:#4361ee; color:white; border:none; border-radius:8px; cursor:pointer;">Fechar</button>
                    </div>
                </div>
            </body>
            </html>
        `);
        novaAba.document.close();
        return;
    }
    
    const d = result.data;
    const formatValue = (value) => {
        if (!value || value === '' || value === 'Não informado') return '---';
        return value;
    };
    
    // Verifica se o status é indeferido
    const statusIndeferido = d.status === 'Solicitação Indeferida pela ARCE' || 
                              d.status === 'Solicitação Indeferida na Entidade Estudantil';
    
    const botaoEnviarDocs = statusIndeferido ? `
        <button id="btnEnviarDocsNovaAba" style="width:100%; padding:12px; background:#e67e22; color:white; border:none; border-radius:8px; cursor:pointer; margin-bottom:10px;">
            📎 Enviar Documentos Pendentes
        </button>
    ` : '';
    
    novaAba.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Consulta - ${formatValue(d.nome)}</title>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="style.css">
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 Dados do Beneficiário</h1>
                    <p>Consulta realizada em ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="form-card">
                    <div class="dados-usuario">
                        <div style="background: #f0f7ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 10px 0; color: #0056b3;">👤 Dados Pessoais</h3>
                            <div class="info-row"><div class="info-label">CPF:</div><div class="info-value"><strong>${formatValue(d.cpf)}</strong></div></div>
                            <div class="info-row"><div class="info-label">Nome:</div><div class="info-value">${formatValue(d.nome)}</div></div>
                            <div class="info-row"><div class="info-label">Nascimento:</div><div class="info-value">${formatValue(d.nascimento)}</div></div>
                            <div class="info-row"><div class="info-label">Município:</div><div class="info-value">${formatValue(d.municipio)}</div></div>
                            <div class="info-row"><div class="info-label">Telefone:</div><div class="info-value">${formatValue(d.telefone)}</div></div>
                            <div class="info-row"><div class="info-label">Via:</div><div class="info-value">${formatValue(d.via)}</div></div>
                            <div class="info-row"><div class="info-label">Data Solicitação:</div><div class="info-value">${formatValue(d.data)}</div></div>
                        </div>
                        
                        <div style="background: #fff8f0; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 10px 0; color: #e67e22;">📊 Status do Processo</h3>
                            <div class="info-row"><div class="info-label">Status:</div><div class="info-value"><span class="status-badge ${d.status === 'Aprovado' ? 'status-ok' : 'status-error'}">${formatValue(d.status)}</span></div></div>
                            <div class="info-row"><div class="info-label">Motivo:</div><div class="info-value">${formatValue(d.motivo)}</div></div>
                            <div class="info-row"><div class="info-label">Data Status:</div><div class="info-value">${formatValue(d.dataStatus)}</div></div>
                            <div class="info-row"><div class="info-label">Prazo para Conserto:</div><div class="info-value">${formatValue(d.prazo)}</div></div>
                            <div class="info-row"><div class="info-label">Pagamento:</div><div class="info-value">${formatValue(d.pagamento)}</div></div>
                            <div class="info-row"><div class="info-label">Nº Carteira:</div><div class="info-value">${formatValue(d.numeroCarteira)}</div></div>
                        </div>
                        
                        <div style="margin-top: 25px;">
                            ${botaoEnviarDocs}
                            <div style="display: flex; gap: 10px;">
                                <button onclick="window.print()" style="flex:1; padding:12px; background:#4361ee; color:white; border:none; border-radius:8px; cursor:pointer;">🖨️ Imprimir</button>
                                <button onclick="window.close()" style="flex:1; padding:12px; background:#6c757d; color:white; border:none; border-radius:8px; cursor:pointer;">❌ Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                // Adiciona event listener para o botão de enviar documentos
                const btnEnviar = document.getElementById('btnEnviarDocsNovaAba');
                if (btnEnviar) {
                    btnEnviar.addEventListener('click', function() {
                        // Fecha a aba atual e abre o formulário
                        window.close();
                        window.opener.abrirFormularioDocumentos(${JSON.stringify(d)});
                    });
                }
            </script>
        </body>
        </html>
    `);
    novaAba.document.close();
}

// ==================== FORMULÁRIO DE ENVIO DE DOCUMENTOS ====================

// ==================== FORMULÁRIO DE ENVIO DE DOCUMENTOS (VERSÃO SIMPLES) ====================

function abrirFormularioDocumentos(dadosUsuario) {
    const novaAba = window.open('', '_blank');
    
    novaAba.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Envio de Documentos - ${dadosUsuario.nome}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 40px 20px;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #e67e22, #f39c12);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 { font-size: 24px; margin-bottom: 10px; }
                .content { padding: 30px; }
                .info-usuario {
                    background: #f0f7ff;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 25px;
                }
                .form-group { margin-bottom: 20px; }
                label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
                input[type="file"] {
                    width: 100%;
                    padding: 10px;
                    border: 2px dashed #ddd;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .camera-container {
                    background: #f5f5f5;
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                }
                .video-wrapper {
                    position: relative;
                    display: inline-block;
                }
                video {
                    width: 100%;
                    max-width: 400px;
                    border-radius: 10px;
                    margin: 10px 0;
                    transform: scaleX(-1);
                }
                canvas {
                    display: none;
                }
                .face-guide {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 180px;
                    height: 180px;
                    border: 3px solid #27ae60;
                    border-radius: 50%;
                    pointer-events: none;
                    box-shadow: 0 0 0 9999px rgba(0,0,0,0.3);
                    display: none;
                }
                .face-guide.active { display: block; }
                .status-message {
                    margin-top: 10px;
                    padding: 8px;
                    border-radius: 8px;
                    font-size: 14px;
                }
                .status-ok { background: #d4edda; color: #155724; }
                .status-warning { background: #fff3cd; color: #856404; }
                .status-error { background: #f8d7da; color: #721c24; }
                .btn-camera {
                    background: #2c3e50;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 5px;
                }
                .btn-capture { background: #27ae60; }
                .btn-submit {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #e67e22, #f39c12);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 20px;
                }
                .btn-submit:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .preview-img { max-width: 100px; margin: 5px; border-radius: 5px; }
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    background: #e67e22;
                    color: white;
                }
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    z-index: 1000;
                }
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #e67e22;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .success-msg { color: #27ae60; text-align: center; padding: 20px; }
                .error-msg { color: #ef476f; text-align: center; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📎 Envio de Documentos Pendentes</h1>
                    <p>Regularize sua situação enviando os documentos solicitados</p>
                </div>
                <div class="content">
                    <div class="info-usuario">
                        <h3>👤 Dados do Beneficiário</h3>
                        <p><strong>Nome:</strong> ${dadosUsuario.nome}</p>
                        <p><strong>CPF:</strong> ${dadosUsuario.cpf}</p>
                        <p><strong>Status:</strong> <span class="status-badge">${dadosUsuario.status}</span></p>
                        <p><strong>Motivo:</strong> ${dadosUsuario.motivo || 'Documentação pendente'}</p>
                    </div>
                    
                    <form id="formDocumentos">
                        <div class="form-group">
                            <label>📄 Declaração de Ensino</label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" id="declaracao">
                        </div>
                        <div class="form-group">
                            <label>🏠 Comprovante de Residência</label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" id="comprovante">
                        </div>
                        <div class="form-group">
                            <label>🆔 CPF (foto do documento)</label>
                            <input type="file" accept=".jpg,.jpeg,.png" id="cpfDoc">
                        </div>
                        <div class="form-group" id="grupoResponsavel">
                            <label>👨‍👩‍👧 Documento do Responsável</label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" id="responsavel">
                        </div>
                        <div class="form-group">
                            <label>🤳 Selfie (fundo claro, rosto centralizado)</label>
                            <div class="camera-container">
                                <div class="video-wrapper">
                                    <video id="video" autoplay playsinline></video>
                                    <div id="faceGuide" class="face-guide"></div>
                                </div>
                                <canvas id="canvas"></canvas>
                                <div>
                                    <button type="button" id="btnAbrirCamera" class="btn-camera">📷 Abrir Câmera</button>
                                    <button type="button" id="btnTirarFoto" class="btn-camera btn-capture" style="display:none;">📸 Tirar Foto</button>
                                </div>
                                <div id="cameraStatus" class="status-message" style="display:none;"></div>
                                <div id="fotoPreview"></div>
                                <input type="hidden" id="selfieData">
                            </div>
                            <small>⚠️ Centralize o rosto no círculo e use fundo claro</small>
                        </div>
                        <button type="submit" id="submitBtn" class="btn-submit" disabled>📤 Enviar para Drive</button>
                    </form>
                    <div id="statusMsg"></div>
                </div>
            </div>
            
            <script>
                const video = document.getElementById('video');
                const canvas = document.getElementById('canvas');
                const btnAbrirCamera = document.getElementById('btnAbrirCamera');
                const btnTirarFoto = document.getElementById('btnTirarFoto');
                const fotoPreview = document.getElementById('fotoPreview');
                const selfieInput = document.getElementById('selfieData');
                const cameraStatus = document.getElementById('cameraStatus');
                const faceGuide = document.getElementById('faceGuide');
                const submitBtn = document.getElementById('submitBtn');
                let stream = null;
                let fotoTirada = false;
                let fotoAprovada = false;
                
                // Configurações
                const MIN_MEGAPIXELS = 2;
                const BRANCO_THRESHOLD = 200;
                
                function isMenorIdade(dataNasc) {
                    const nasc = new Date(dataNasc);
                    const hoje = new Date();
                    let idade = hoje.getFullYear() - nasc.getFullYear();
                    const mes = hoje.getMonth() - nasc.getMonth();
                    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
                    return idade < 18;
                }
                
                if (!isMenorIdade('${dadosUsuario.nascimento}')) {
                    document.getElementById('grupoResponsavel').style.display = 'none';
                }
                
                // Verificar centralização (baseado na posição no círculo guia)
                function verificarCentralizacao(videoElement, guideElement) {
                    const videoRect = videoElement.getBoundingClientRect();
                    const guideRect = guideElement.getBoundingClientRect();
                    
                    if (!videoRect.width || !guideRect.width) return true;
                    
                    // Calcula o centro do círculo guia relativo ao vídeo
                    const guideCenterX = (guideRect.left + guideRect.right) / 2;
                    const guideCenterY = (guideRect.top + guideRect.bottom) / 2;
                    const videoCenterX = (videoRect.left + videoRect.right) / 2;
                    const videoCenterY = (videoRect.top + videoRect.bottom) / 2;
                    
                    const tolerancia = 50;
                    const centralizado = Math.abs(guideCenterX - videoCenterX) < tolerancia && 
                                        Math.abs(guideCenterY - videoCenterY) < tolerancia;
                    
                    return centralizado;
                }
                
                // Verificar fundo claro
                function verificarFundoClaro(ctx, width, height) {
                    const amostras = [];
                    const margem = 20;
                    
                    // Amostra nas bordas
                    for (let i = 0; i < 30; i++) {
                        const x = margem + Math.random() * 100;
                        const y = margem + Math.random() * 100;
                        const pixel = ctx.getImageData(x, y, 1, 1).data;
                        const brilho = (pixel[0] + pixel[1] + pixel[2]) / 3;
                        amostras.push(brilho);
                        
                        const x2 = width - margem - Math.random() * 100;
                        const y2 = height - margem - Math.random() * 100;
                        const pixel2 = ctx.getImageData(x2, y2, 1, 1).data;
                        const brilho2 = (pixel2[0] + pixel2[1] + pixel2[2]) / 3;
                        amostras.push(brilho2);
                    }
                    
                    const mediaBrilho = amostras.reduce((a, b) => a + b, 0) / amostras.length;
                    const fundoClaro = mediaBrilho > BRANCO_THRESHOLD;
                    
                    return { fundoClaro, mediaBrilho };
                }
                
                btnAbrirCamera.addEventListener('click', async () => {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
                        });
                        video.srcObject = stream;
                        video.style.display = 'block';
                        faceGuide.classList.add('active');
                        btnAbrirCamera.style.display = 'none';
                        btnTirarFoto.style.display = 'inline-block';
                        cameraStatus.style.display = 'block';
                        cameraStatus.innerHTML = '<span class="status-warning">📐 Centralize o rosto no círculo</span>';
                        cameraStatus.className = 'status-message status-warning';
                        
                        // Verificar centralização a cada segundo
                        const checkPosition = setInterval(() => {
                            if (video.videoWidth > 0) {
                                const centralizado = verificarCentralizacao(video, faceGuide);
                                if (centralizado) {
                                    cameraStatus.innerHTML = '<span class="status-ok">✅ Rosto centralizado! Pode tirar a foto.</span>';
                                    cameraStatus.className = 'status-message status-ok';
                                } else {
                                    cameraStatus.innerHTML = '<span class="status-warning">⚠️ Centralize o rosto no círculo</span>';
                                    cameraStatus.className = 'status-message status-warning';
                                }
                            }
                        }, 500);
                        
                        window.checkPositionInterval = checkPosition;
                        
                    } catch(err) {
                        alert('Erro ao acessar câmera: ' + err.message);
                    }
                });
                
                btnTirarFoto.addEventListener('click', () => {
                    if (window.checkPositionInterval) {
                        clearInterval(window.checkPositionInterval);
                    }
                    
                    const context = canvas.getContext('2d');
                    const targetWidth = 1600;
                    const targetHeight = 1200;
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    context.drawImage(video, 0, 0, targetWidth, targetHeight);
                    
                    // Verificar megapixels
                    const pixels = canvas.width * canvas.height;
                    if (pixels < MIN_MEGAPIXELS * 1000000) {
                        cameraStatus.innerHTML = '<span class="status-error">❌ Qualidade mínima: ' + MIN_MEGAPIXELS + ' megapixels</span>';
                        cameraStatus.className = 'status-message status-error';
                        return;
                    }
                    
                    // Verificar fundo claro
                    const { fundoClaro, mediaBrilho } = verificarFundoClaro(context, canvas.width, canvas.height);
                    
                    if (!fundoClaro) {
                        cameraStatus.innerHTML = '<span class="status-error">❌ Fundo escuro! Use fundo claro. Brilho: ' + Math.round(mediaBrilho) + '/255</span>';
                        cameraStatus.className = 'status-message status-error';
                        return;
                    }
                    
                    // Verificar centralização final
                    const centralizado = verificarCentralizacao(video, faceGuide);
                    if (!centralizado) {
                        cameraStatus.innerHTML = '<span class="status-error">❌ Centralize o rosto no círculo antes de tirar a foto</span>';
                        cameraStatus.className = 'status-message status-error';
                        return;
                    }
                    
                    // Tudo OK!
                    const fotoData = canvas.toDataURL('image/jpeg', 0.9);
                    selfieInput.value = fotoData;
                    
                    const img = document.createElement('img');
                    img.src = fotoData;
                    img.className = 'preview-img';
                    fotoPreview.innerHTML = '';
                    fotoPreview.appendChild(img);
                    
                    cameraStatus.innerHTML = '<span class="status-ok">✅ Selfie aprovada!</span>';
                    cameraStatus.className = 'status-message status-ok';
                    
                    fotoTirada = true;
                    fotoAprovada = true;
                    submitBtn.disabled = false;
                    
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                        video.style.display = 'none';
                    }
                    btnTirarFoto.style.display = 'none';
                    faceGuide.classList.remove('active');
                });
                
                document.getElementById('formDocumentos').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    if (!fotoTirada || !fotoAprovada) {
                        alert('É necessário tirar uma selfie válida antes de enviar!');
                        return;
                    }
                    
                    const statusDiv = document.getElementById('statusMsg');
                    statusDiv.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><p>Enviando documentos...</p></div>';
                    
                    const lerArquivo = (file) => {
                        return new Promise((resolve) => {
                            if (!file) { resolve(null); return; }
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                resolve({ base64: e.target.result, nome: file.name });
                            };
                            reader.readAsDataURL(file);
                        });
                    };
                    
                    const declaracao = await lerArquivo(document.getElementById('declaracao').files[0]);
                    const comprovante = await lerArquivo(document.getElementById('comprovante').files[0]);
                    const cpfDoc = await lerArquivo(document.getElementById('cpfDoc').files[0]);
                    const responsavel = await lerArquivo(document.getElementById('responsavel').files[0]);
                    const selfie = selfieInput.value;
                    
                    const arquivos = [];
                    if (declaracao) arquivos.push({ ...declaracao, tipo: 'declaracao_ensino' });
                    if (comprovante) arquivos.push({ ...comprovante, tipo: 'comprovante_residencia' });
                    if (cpfDoc) arquivos.push({ ...cpfDoc, tipo: 'cpf_documento' });
                    if (responsavel) arquivos.push({ ...responsavel, tipo: 'documento_responsavel' });
                    
                    const dadosEnvio = {
                        cpf: '${dadosUsuario.cpf}',
                        nome: '${dadosUsuario.nome}',
                        status: '${dadosUsuario.status}',
                        selfie: selfie,
                        arquivos: arquivos
                    };
                    
                    try {
                        const response = await fetch('${SCRIPT_URL}', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(dadosEnvio)
                        });
                        const result = await response.json();
                        
                        if (result.success) {
                            statusDiv.innerHTML = '<div class="success-msg">✅ Documentos enviados com sucesso!<br><button onclick="window.close()" style="margin-top:15px; padding:10px 20px; background:#27ae60; color:white; border:none; border-radius:8px;">Fechar</button></div>';
                        } else {
                            statusDiv.innerHTML = '<div class="error-msg">❌ Erro: ' + result.message + '</div>';
                        }
                    } catch(error) {
                        statusDiv.innerHTML = '<div class="error-msg">❌ Erro ao enviar: ' + error.message + '</div>';
                    }
                });
            </script>
        </body>
        </html>
    `);
    novaAba.document.close();
}

// ==================== EVENTOS ====================

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const cpfInput = document.getElementById('cpf');
    const btnFechar = document.getElementById('btnFechar');

    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const cpfValue = cpfInput.value;
            const dataNascValue = document.getElementById('dataNascimento').value;
            
            if (!cpfValue || !dataNascValue) {
                showToast('Preencha todos os campos', 'error');
                return;
            }
            
            const cpfLimpo = limparCPF(cpfValue);
            if (cpfLimpo.length !== 11) {
                showToast('CPF deve ter 11 dígitos', 'error');
                return;
            }
            
            hideResult();
            showLoading();
            
            try {
                const novaAba = window.open('', '_blank');
                
                if (novaAba) {
                    novaAba.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head><title>Carregando...</title><meta charset="UTF-8">
                        <style>
                            body {
                                font-family: 'Segoe UI', sans-serif;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                min-height: 100vh;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                margin: 0;
                            }
                            .loading-container {
                                text-align: center;
                                background: white;
                                padding: 40px;
                                border-radius: 20px;
                            }
                            .spinner {
                                width: 50px;
                                height: 50px;
                                border: 5px solid #f3f3f3;
                                border-top: 5px solid #4361ee;
                                border-radius: 50%;
                                animation: spin 1s linear infinite;
                                margin: 0 auto 20px auto;
                            }
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        </style>
                        </head>
                        <body>
                            <div class="loading-container">
                                <div class="spinner"></div>
                                <p>🔍 Consultando dados...</p>
                            </div>
                        </body>
                        </html>
                    `);
                    novaAba.document.close();
                }
                
                const resultado = await buscarDados(cpfLimpo, dataNascValue);
                
                if (novaAba) {
                    escreverNaNovaAba(novaAba, resultado);
                }
                
                if (resultado.success) {
                    showToast('Dados encontrados!', 'success');
                } else {
                    showToast(resultado.message, 'warning');
                }
            } catch (error) {
                showToast('Erro ao conectar com o servidor', 'error');
                console.error(error);
            } finally {
                hideLoading();
            }
        });
    }

    if (btnFechar) {
        btnFechar.addEventListener('click', function() {
            hideResult();
            if (searchForm) searchForm.reset();
        });
    }

    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length >= 11) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            else if (v.length >= 7) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
            else if (v.length >= 4) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
            e.target.value = v;
        });
    }
});
