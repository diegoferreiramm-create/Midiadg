// Configuração - URL do seu Web App do Google Apps Script
// Depois de publicar o script, cole a URL aqui
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3mlbt1TcoW03bZsm_C0zKhqKvO9yDx5o8b_oncsLGcctJT-NxQZMJiSrQZogJT95b/exec';

// Função para limpar CPF
function limparCPF(cpf) {
    return cpf.replace(/[^\d]/g, '');
}

// Função para formatar CPF
function formatarCPF(cpf) {
    const cpfLimpo = limparCPF(cpf);
    if (cpfLimpo.length === 11) {
        return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

// Função para formatar data
function formatarData(data) {
    if (!data || data === 'Não informado') return data;
    
    if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    
    return data;
}

// Função para buscar dados via Apps Script
async function buscarDadosPlanilha(cpf, dataNascimento) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cpf: cpf,
                dataNascimento: dataNascimento
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Erro na consulta');
        }
        
        return result;
        
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
    }
}

// Função para exibir os resultados
function exibirResultado(resultado) {
    const resultContent = document.getElementById('resultContent');
    
    if (!resultado.success || !resultado.data) {
        resultContent.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <h3>Nenhum registro encontrado</h3>
                <p>${resultado.message || 'Verifique se o CPF e a data de nascimento estão corretos.'}</p>
                <p><small>Caso o problema persista, entre em contato com o suporte.</small></p>
            </div>
        `;
        return;
    }
    
    const dados = resultado.data;
    
    resultContent.innerHTML = `
        <div class="dados-usuario">
            <div class="info-group">
                <label>Número da Carteira:</label>
                <span class="destaque">${dados.numeroCarteira || 'Não informado'}</span>
            </div>
            
            <div class="info-group">
                <label>Nome Completo:</label>
                <span>${dados.nome || 'Não informado'}</span>
            </div>
            
            <div class="info-group">
                <label>CPF:</label>
                <span>${dados.cpf || 'Não informado'}</span>
            </div>
            
            <div class="info-group">
                <label>Data de Nascimento:</label>
                <span>${formatarData(dados.nascimento) || 'Não informado'}</span>
            </div>
            
            <div class="info-group">
                <label>Município:</label>
                <span>${dados.municipio || 'Não informado'}</span>
            </div>
            
            <div class="info-group">
                <label>Telefone:</label>
                <span>${dados.telefone || 'Não informado'}</span>
            </div>
            
            <div class="info-group">
                <label>Status:</label>
                <span class="status-badge status-${(dados.status || '').toLowerCase().replace(/\s/g, '-')}">
                    ${dados.status || 'Pendente'}
                </span>
            </div>
            
            <div class="info-group">
                <label>Tipo:</label>
                <span>${dados.tipo || 'Não informado'}</span>
            </div>
            
            ${dados.parceiro ? `
            <div class="info-group">
                <label>Parceiro:</label>
                <span>${dados.parceiro}</span>
            </div>
            ` : ''}
            
            ${dados.motivo ? `
            <div class="info-group">
                <label>Motivo:</label>
                <span>${dados.motivo}</span>
            </div>
            ` : ''}
            
            ${dados.lote ? `
            <div class="info-group">
                <label>Lote:</label>
                <span>${dados.lote}</span>
            </div>
            ` : ''}
            
            <div class="info-group">
                <label>Data de Cadastro:</label>
                <span>${formatarData(dados.data) || 'Não informada'}</span>
            </div>
            
            ${dados.atendente ? `
            <div class="info-group">
                <label>Atendente:</label>
                <span>${dados.atendente}</span>
            </div>
            ` : ''}
            
            <div class="info-actions">
                <button onclick="window.print()" class="print-btn">
                    🖨️ Imprimir
                </button>
                <button onclick="location.reload()" class="new-search-btn">
                    🔍 Nova Consulta
                </button>
            </div>
        </div>
    `;
}

// Resto do código permanece igual...
// (incluir as funções showToast, showLoading, hideLoading, showResult, hideResult
// e o event listener do formulário, adaptando para usar a nova função buscarDadosPlanilha)

// Evento de submit do formulário (versão atualizada)
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cpf = document.getElementById('cpf').value;
    const dataNascimento = document.getElementById('dataNascimento').value;
    
    if (!cpf || !dataNascimento) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    const cpfLimpo = limparCPF(cpf);
    if (cpfLimpo.length !== 11) {
        showToast('CPF inválido. Digite um CPF válido com 11 dígitos', 'error');
        return;
    }
    
    hideResult();
    showLoading();
    
    try {
        const resultado = await buscarDadosPlanilha(cpf, dataNascimento);
        exibirResultado(resultado);
        showResult();
        
        if (resultado.success) {
            showToast('Dados encontrados com sucesso!', 'success');
        } else {
            showToast(resultado.message || 'Usuário não encontrado', 'warning');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message || 'Erro ao realizar consulta', 'error');
    } finally {
        hideLoading();
    }
});
