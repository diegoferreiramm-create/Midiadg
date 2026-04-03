// ============================================
// CONFIGURAÇÕES - VOCÊ DEVE AJUSTAR AQUI!
// ============================================

// URL do seu Web App do Google Apps Script
// Depois de publicar o App Script, cole a URL aqui
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz4Oz1hxpYjRiRMTo1FaVc4FS8tLEe-VLZeXYhL6BwXTkcfGHMwg2ZN-4eRdXu_of3-/exec";

// Mapeamento das colunas da sua planilha (conforme sua estrutura)
// A ordem das colunas A até W:
// A=ID, B=CPF, C=NOME, D=NASC, E=MUNICIPIO, F=TEL, G=VIA, H=PARCEIRO, 
// I=DATA, J=ATENDENTE, K=BOLETO, L=STATUS, M=MOTIVO, N=DATA_STATUS, 
// O=TIPO, P=NUMERO_CARTEIRA, Q=lote, R=pagamento, S=prazo, 
// T=fechamento lote, U=data fechamento, V=logado, W=processo arce

const CAMPOS = {
    id: "ID",
    cpf: "CPF",
    nome: "NOME",
    nasc: "DATA DE NASCIMENTO",
    municipio: "MUNICÍPIO",
    telefone: "TELEFONE",
    via: "VIA",
    parceiro: "PARCEIRO",
    data: "DATA CADASTRO",
    atendente: "ATENDENTE",
    boleto: "BOLETO",
    status: "STATUS",
    motivo: "MOTIVO",
    data_status: "DATA STATUS",
    tipo: "TIPO",
    numero_carteira: "NÚMERO DA CARTEIRA",
    lote: "LOTE",
    pagamento: "PAGAMENTO",
    prazo: "PRAZO",
    fechamento_lote: "FECHAMENTO LOTE",
    data_fechamento: "DATA FECHAMENTO",
    logado: "LOGADO",
    processo_arce: "PROCESSO ARCE"
};

// ============================================
// CÓDIGO PRINCIPAL - NÃO PRECISA MEXER
// ============================================

// Aguardar o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('searchForm');
    const cpfInput = document.getElementById('cpf');
    const dataInput = document.getElementById('dataNascimento');
    const btnFechar = document.getElementById('btnFechar');
    
    // Máscara para CPF
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            // Aplica máscara
            if (value.length >= 4) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
            }
            if (value.length >= 8) {
                value = value.replace(/(\d{3})(\d{3})(\d)/, '$1.$2.$3');
            }
            if (value.length >= 11) {
                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
            }
            
            e.target.value = value;
        });
    }
    
    // Submit do formulário
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            let cpf = cpfInput.value.replace(/\D/g, '');
            const dataNascimento = dataInput.value;
            
            // Garante que o CPF tem 11 dígitos (adiciona zeros à esquerda se necessário)
            if (cpf && cpf.length < 11) {
                cpf = cpf.padStart(11, '0');
            }
            
            if (!cpf || cpf.length !== 11) {
                showToast('CPF inválido! Digite 11 números.', 'error');
                return;
            }
            
            if (!dataNascimento) {
                showToast('Selecione a data de nascimento!', 'error');
                return;
            }
            
            await buscarDados(cpf, dataNascimento);
        });
    }
    
    // Fechar resultado
    if (btnFechar) {
        btnFechar.addEventListener('click', function() {
            document.getElementById('resultArea').style.display = 'none';
        });
    }
});

// Função para buscar dados
async function buscarDados(cpf, dataNascimento) {
    showLoading(true);
    
    try {
        // Formata a data para DD/MM/AAAA (como está na planilha)
        const dataFormatada = formatarDataBR(dataNascimento);
        
        // Prepara os dados para enviar ao Web App
        const dados = new URLSearchParams();
        dados.append('cpf', cpf);
        dados.append('data_nasc', dataFormatada);
        dados.append('acao', 'buscar');
        
        // Faz a requisição
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: dados
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            exibirResultado(resultado.dados);
            showToast('Registro encontrado com sucesso!', 'success');
        } else {
            showToast(resultado.mensagem || 'Nenhum registro encontrado.', 'error');
            document.getElementById('resultArea').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao consultar. Verifique sua conexão.', 'error');
        document.getElementById('resultArea').style.display = 'none';
    } finally {
        showLoading(false);
    }
}

// Função para exibir o resultado
function exibirResultado(dados) {
    const resultContent = document.getElementById('resultContent');
    const resultArea = document.getElementById('resultArea');
    
    let html = '';
    
    // Percorre os campos definidos nas configurações
    for (const [chave, rotulo] of Object.entries(CAMPOS)) {
        if (dados[chave] && dados[chave] !== '') {
            let valor = dados[chave];
            
            // Formata CPF se existir
            if (chave === 'cpf' && valor) {
                valor = formatarCPF(valor);
            }
            
            // Formata status com badge
            if (chave === 'status') {
                const statusClass = (valor === 'Ativo' || valor === 'Aprovado' || valor === 'OK') ? 'status-ok' : 'status-error';
                html += `
                    <div class="info-row">
                        <div class="info-label">${rotulo}</div>
                        <div class="info-value">
                            <span class="status-badge ${statusClass}">${valor}</span>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="info-row">
                        <div class="info-label">${rotulo}</div>
                        <div class="info-value">${valor}</div>
                    </div>
                `;
            }
        }
    }
    
    resultContent.innerHTML = html;
    resultArea.style.display = 'block';
    
    // Scroll suave até o resultado
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Função para formatar data para DD/MM/AAAA
function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para formatar CPF
function formatarCPF(cpf) {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para mostrar/ocultar loading
function showLoading(show) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// Função para mostrar mensagem toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
