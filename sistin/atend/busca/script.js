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

// ==================== FORMULÁRIO DE ENVIO DE DOCUMENTOS (VERSÃO SIMPLIFICADA CELULAR) ====================

// ==================== FORMULÁRIO DE ENVIO DE DOCUMENTOS (SELFIE CORRIGIDA) ====================

function abrirFormularioDocumentos(dadosUsuario) {
    const novaAba = window.open('', '_blank');
    
    novaAba.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Envio de Documentos</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 16px;
                    min-height: 100vh;
                }
                
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                
                .header {
                    background: linear-gradient(135deg, #e67e22, #f39c12);
                    color: white;
                    padding: 16px;
                    text-align: center;
                }
                
                .header h1 { font-size: 1.3rem; margin-bottom: 4px; }
                .header p { font-size: 0.75rem; opacity: 0.9; }
                
                .content { padding: 16px; }
                
                .info-box {
                    background: #f0f7ff;
                    padding: 12px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    font-size: 0.85rem;
                }
                
                .info-box p { margin-bottom: 4px; }
                .info-box strong { color: #e67e22; }
                
                .form-group { margin-bottom: 16px; }
                
                label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                    font-size: 0.85rem;
                    color: #333;
                }
                
                input[type="file"] {
                    width: 100%;
                    padding: 10px;
                    border: 2px dashed #ddd;
                    border-radius: 10px;
                    background: #fafafa;
                    font-size: 0.8rem;
                }
                
                .camera-area {
                    background: #000;
                    border-radius: 16px;
                    padding: 0;
                    overflow: hidden;
                    position: relative;
                }
                
                .video-wrapper {
                    position: relative;
                    width: 100%;
                    background: #000;
                }
                
                video {
                    width: 100%;
                    height: auto;
                    display: block;
                    transform: scaleX(-1);
                }
                
                .face-oval {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 180px;
                    height: 220px;
                    border: 3px solid #27ae60;
                    border-radius: 50%;
                    pointer-events: none;
                    box-shadow: 0 0 0 999px rgba(0,0,0,0.5);
                    display: none;
                }
                
                .face-oval.show {
                    display: block;
                }
                
                .status {
                    margin-top: 10px;
                    padding: 10px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    text-align: center;
                    font-weight: 500;
                }
                
                .status-success { background: #d4edda; color: #155724; }
                .status-warning { background: #fff3cd; color: #856404; }
                .status-error { background: #f8d7da; color: #721c24; }
                .status-info { background: #cce5ff; color: #004085; }
                
                button {
                    border: none;
                    border-radius: 12px;
                    padding: 12px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                
                .btn-camera {
                    background: #2c3e50;
                    color: white;
                    margin-top: 10px;
                    width: 100%;
                }
                
                .btn-capture {
                    background: #27ae60;
                    color: white;
                    margin-top: 10px;
                    width: 100%;
                }
                
                .btn-submit {
                    width: 100%;
                    background: linear-gradient(135deg, #e67e22, #f39c12);
                    color: white;
                    margin-top: 16px;
                }
                
                .btn-submit:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .preview {
                    margin-top: 12px;
                    text-align: center;
                    padding: 8px;
                    background: #f5f5f5;
                    border-radius: 10px;
                }
                
                .preview img {
                    max-width: 80px;
                    border-radius: 12px;
                    border: 3px solid #27ae60;
                }
                
                canvas { display: none; }
                
                .loading {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    z-index: 1000;
                }
                
                .spinner {
                    width: 45px;
                    height: 45px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #e67e22;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .hidden { display: none; }
                
                .button-group {
                    padding: 12px;
                    background: #1a1a2e;
                }
                
                small {
                    display: block;
                    margin-top: 8px;
                    font-size: 0.7rem;
                    color: #666;
                    text-align: center;
                }
                
                .info-text {
                    background: #e9ecef;
                    padding: 8px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    text-align: center;
                    margin-top: 8px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📎 Envio de Documentos</h1>
                    <p>Regularize sua situação</p>
                </div>
                
                <div class="content">
                    <div class="info-box">
                        <p><strong>👤 Nome:</strong> ${dadosUsuario.nome}</p>
                        <p><strong>📄 CPF:</strong> ${dadosUsuario.cpf}</p>
                        <p><strong>📊 Status:</strong> ${dadosUsuario.status}</p>
                        <p><strong>💬 Motivo:</strong> ${dadosUsuario.motivo || 'Documentação pendente'}</p>
                    </div>
                    
                    <form id="formDocs">
                        <div class="form-group">
                            <label>📄 Declaração de Ensino</label>
                            <input type="file" id="doc1" accept=".pdf,.jpg,.jpeg,.png">
                        </div>
                        
                        <div class="form-group">
                            <label>🏠 Comprovante de Residência</label>
                            <input type="file" id="doc2" accept=".pdf,.jpg,.jpeg,.png">
                        </div>
                        
                        <div class="form-group">
                            <label>🆔 Foto do CPF</label>
                            <input type="file" id="doc3" accept=".jpg,.jpeg,.png">
                        </div>
                        
                        <div class="form-group" id="grupoResp">
                            <label>👨‍👩‍👧 Documento do Responsável</label>
                            <input type="file" id="doc4" accept=".pdf,.jpg,.jpeg,.png">
                        </div>
                        
                        <div class="form-group">
                            <label>🤳 Selfie - Centralize o rosto na moldura oval</label>
                            <div class="camera-area">
                                <div class="video-wrapper">
                                    <video id="video" autoplay playsinline></video>
                                    <div id="faceOval" class="face-oval"></div>
                                </div>
                                <canvas id="canvas"></canvas>
                                <div class="button-group">
                                    <button type="button" id="btnCamera" class="btn-camera">📷 Abrir Câmera</button>
                                    <button type="button" id="btnFoto" class="btn-capture hidden">📸 Tirar Selfie</button>
                                </div>
                                <div id="statusMsg" class="status hidden"></div>
                                <div id="preview" class="preview hidden"></div>
                                <input type="hidden" id="selfieData">
                            </div>
                            <div class="info-text">
                                💡 Dicas: Fundo claro | Rosto dentro da moldura oval | Boa iluminação
                            </div>
                        </div>
                        
                        <button type="submit" id="submitBtn" class="btn-submit" disabled>📤 Enviar Documentos</button>
                    </form>
                    
                    <div id="resultMsg"></div>
                </div>
            </div>
            
            <script>
                (function() {
                    const video = document.getElementById('video');
                    const canvas = document.getElementById('canvas');
                    const btnCamera = document.getElementById('btnCamera');
                    const btnFoto = document.getElementById('btnFoto');
                    const faceOval = document.getElementById('faceOval');
                    const statusDiv = document.getElementById('statusMsg');
                    const previewDiv = document.getElementById('preview');
                    const selfieInput = document.getElementById('selfieData');
                    const submitBtn = document.getElementById('submitBtn');
                    let stream = null;
                    let fotoOk = false;
                    
                    // Verificar menor de idade
                    const nascimento = '${dadosUsuario.nascimento}';
                    let anoNasc = 0;
                    if (nascimento.includes('/')) {
                        anoNasc = parseInt(nascimento.split('/')[2]);
                    } else if (nascimento.includes('-')) {
                        anoNasc = parseInt(nascimento.split('-')[0]);
                    }
                    const idade = new Date().getFullYear() - anoNasc;
                    if (idade >= 18) {
                        const grupo = document.getElementById('grupoResp');
                        if (grupo) grupo.style.display = 'none';
                    }
                    
                    btnCamera.addEventListener('click', async () => {
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({ 
                                video: { 
                                    facingMode: 'user',
                                    width: { ideal: 1280 },
                                    height: { ideal: 720 }
                                } 
                            });
                            video.srcObject = stream;
                            video.style.display = 'block';
                            faceOval.classList.add('show');
                            btnCamera.classList.add('hidden');
                            btnFoto.classList.remove('hidden');
                            statusDiv.classList.remove('hidden');
                            statusDiv.className = 'status status-info';
                            statusDiv.innerHTML = '🎯 Posicione seu rosto dentro da moldura oval e clique em "Tirar Selfie"';
                            
                            // Aguardar o vídeo carregar
                            await new Promise(r => setTimeout(r, 500));
                        } catch(err) {
                            statusDiv.className = 'status status-error';
                            statusDiv.innerHTML = '❌ Erro ao acessar câmera: ' + err.message;
                            statusDiv.classList.remove('hidden');
                        }
                    });
                    
                    btnFoto.addEventListener('click', () => {
                        const ctx = canvas.getContext('2d');
                        
                        // Definir tamanho da foto (boa qualidade)
                        const targetWidth = 1200;
                        const targetHeight = 900;
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        
                        // Desenhar o vídeo no canvas
                        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                        
                        // Verificar qualidade (megapixels)
                        const megapixels = (canvas.width * canvas.height) / 1000000;
                        if (megapixels < 1.5) {
                            statusDiv.className = 'status status-warning';
                            statusDiv.innerHTML = '⚠️ Qualidade baixa (' + megapixels.toFixed(1) + 'MP). Tente melhorar a iluminação.';
                            return;
                        }
                        
                        // Verificar se tem rosto na imagem (detecção simples por cor de pele)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const centerX = canvas.width / 2;
                        const centerY = canvas.height / 2;
                        const centerPixel = ctx.getImageData(centerX, centerY, 1, 1).data;
                        
                        // Verificar se a cor no centro é pele (tons médios)
                        const r = centerPixel[0];
                        const g = centerPixel[1];
                        const b = centerPixel[2];
                        const isSkinTone = (r > 60 && r < 200) && (g > 40 && g < 170) && (b > 30 && b < 150);
                        
                        if (!isSkinTone) {
                            statusDiv.className = 'status status-warning';
                            statusDiv.innerHTML = '⚠️ Rosto não detectado no centro. Centralize seu rosto na moldura oval.';
                            return;
                        }
                        
                        // Verificar fundo claro (simplificado - amostras nas bordas)
                        let amostrasClaras = 0;
                        let totalAmostras = 0;
                        const bordas = [
                            { x: 20, y: 20 }, { x: canvas.width - 20, y: 20 },
                            { x: 20, y: canvas.height - 20 }, { x: canvas.width - 20, y: canvas.height - 20 },
                            { x: canvas.width/2, y: 20 }, { x: canvas.width/2, y: canvas.height - 20 },
                            { x: 20, y: canvas.height/2 }, { x: canvas.width - 20, y: canvas.height/2 }
                        ];
                        
                        bordas.forEach(pos => {
                            const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
                            const brilho = (pixel[0] + pixel[1] + pixel[2]) / 3;
                            totalAmostras++;
                            if (brilho > 180) amostrasClaras++;
                        });
                        
                        const percentualClaro = (amostrasClaras / totalAmostras) * 100;
                        
                        if (percentualClaro < 50) {
                            statusDiv.className = 'status status-warning';
                            statusDiv.innerHTML = '⚠️ Fundo escuro! Use um fundo claro (parede branca).';
                            return;
                        }
                        
                        // Tudo OK - salvar a selfie
                        const fotoData = canvas.toDataURL('image/jpeg', 0.85);
                        selfieInput.value = fotoData;
                        
                        // Mostrar preview
                        previewDiv.classList.remove('hidden');
                        previewDiv.innerHTML = '<img src="' + fotoData + '" alt="selfie"><p style="margin-top:5px; font-size:12px; color:#27ae60;">✅ Selfie aprovada!</p>';
                        
                        statusDiv.className = 'status status-success';
                        statusDiv.innerHTML = '✅ Selfie capturada com sucesso!';
                        
                        fotoOk = true;
                        submitBtn.disabled = false;
                        
                        // Fechar câmera
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                            video.style.display = 'none';
                        }
                        btnFoto.classList.add('hidden');
                        faceOval.classList.remove('show');
                        btnCamera.classList.remove('hidden');
                        btnCamera.innerHTML = '📷 Reabrir Câmera';
                    });
                    
                    document.getElementById('formDocs').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        if (!fotoOk && !selfieInput.value) {
                            statusDiv.className = 'status status-error';
                            statusDiv.innerHTML = '❌ Você precisa tirar uma selfie primeiro!';
                            statusDiv.classList.remove('hidden');
                            return;
                        }
                        
                        const resultDiv = document.getElementById('resultMsg');
                        resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p style="color:white; margin-top:12px">Enviando documentos...</p></div>';
                        
                        const lerArquivo = (file) => {
                            return new Promise((resolve) => {
                                if (!file || !file.name) { resolve(null); return; }
                                const reader = new FileReader();
                                reader.onload = (e) => resolve({ base64: e.target.result, nome: file.name });
                                reader.readAsDataURL(file);
                            });
                        };
                        
                        const doc1 = await lerArquivo(document.getElementById('doc1').files[0]);
                        const doc2 = await lerArquivo(document.getElementById('doc2').files[0]);
                        const doc3 = await lerArquivo(document.getElementById('doc3').files[0]);
                        const doc4 = await lerArquivo(document.getElementById('doc4').files[0]);
                        
                        const arquivos = [];
                        if (doc1) arquivos.push({ ...doc1, tipo: 'declaracao_ensino' });
                        if (doc2) arquivos.push({ ...doc2, tipo: 'comprovante_residencia' });
                        if (doc3) arquivos.push({ ...doc3, tipo: 'cpf_documento' });
                        if (doc4) arquivos.push({ ...doc4, tipo: 'documento_responsavel' });
                        
                        const dados = {
                            cpf: '${dadosUsuario.cpf}',
                            nome: '${dadosUsuario.nome}',
                            status: '${dadosUsuario.status}',
                            selfie: selfieInput.value,
                            arquivos: arquivos
                        };
                        
                        try {
                            const resp = await fetch('${SCRIPT_URL}', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(dados)
                            });
                            const res = await resp.json();
                            
                            if (res.success) {
                                resultDiv.innerHTML = '<div class="loading" style="background:rgba(0,0,0,0.9)"><div style="background:white; padding:24px; border-radius:16px; text-align:center; max-width:280px"><span style="font-size:3rem">✅</span><p style="margin-top:12px; font-weight:600">Documentos enviados com sucesso!</p><button onclick="window.close()" style="margin-top:16px; padding:10px 24px; background:#27ae60; color:white; border:none; border-radius:10px">Fechar</button></div></div>';
                            } else {
                                resultDiv.innerHTML = '<div class="loading"><div style="background:white; padding:24px; border-radius:16px; text-align:center"><span style="font-size:3rem">❌</span><p style="margin-top:12px; color:#ef476f">Erro: ' + res.message + '</p><button onclick="location.reload()" style="margin-top:16px; padding:10px 20px; background:#e67e22; color:white; border:none; border-radius:10px">Tentar novamente</button></div></div>';
                            }
                        } catch(err) {
                            resultDiv.innerHTML = '<div class="loading"><div style="background:white; padding:24px; border-radius:16px; text-align:center"><span style="font-size:3rem">❌</span><p style="margin-top:12px; color:#ef476f">Erro de conexão</p><button onclick="location.reload()" style="margin-top:16px; padding:10px 20px; background:#e67e22; color:white; border:none; border-radius:10px">Tentar novamente</button></div></div>';
                        }
                    });
                })();
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
