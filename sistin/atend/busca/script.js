// URL do Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3mlbt1TcoW03bZsm_C0zKhqKvO9yDx5o8b_oncsLGcctJT-NxQZMJiSrQZogJT95b/exec';

// ==================== FUNÇÕES AUXILIARES ====================

function limparCPF(cpf) {
    return cpf.replace(/[^\d]/g, '');
}

function formatarCPF(cpf) {
    const cpfLimpo = limparCPF(cpf);
    if (cpfLimpo.length === 11) {
        return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

function formatarData(data) {
    if (!data || data === 'Não informado') return data;
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    return data;
}

function showToast(message, type) {
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
}

function showLoading() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'flex';
}

function hideLoading() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'none';
}

function showResult() {
    const el = document.getElementById('resultArea');
    if (el) {
        el.style.display = 'block';
        el.scrollIntoView({ behavior: 'smooth' });
    }
}

function hideResult() {
    const el = document.getElementById('resultArea');
    if (el) el.style.display = 'none';
}

// ==================== FUNÇÕES PRINCIPAIS ====================

async function buscarDados(cpf, dataNasc) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf, dataNascimento: dataNasc })
    });
    const result = await response.json();
    return result;
}

function exibirResultado(result) {
    const container = document.getElementById('resultContent');
    if (!container) return;
    
    if (!result.success || !result.data) {
        container.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <h3>Nenhum registro encontrado</h3>
                <p>${result.message || 'Verifique CPF e data de nascimento'}</p>
            </div>
        `;
        return;
    }
    
    const d = result.data;
    container.innerHTML = `
        <div class="dados-usuario">
            <div class="info-group"><label>Número da Carteira:</label><span class="destaque">${d.numeroCarteira || 'Não informado'}</span></div>
            <div class="info-group"><label>Nome:</label><span>${d.nome || 'Não informado'}</span></div>
            <div class="info-group"><label>CPF:</label><span>${d.cpf || 'Não informado'}</span></div>
            <div class="info-group"><label>Nascimento:</label><span>${formatarData(d.nascimento) || 'Não informado'}</span></div>
            <div class="info-group"><label>Município:</label><span>${d.municipio || 'Não informado'}</span></div>
            <div class="info-group"><label>Telefone:</label><span>${d.telefone || 'Não informado'}</span></div>
            <div class="info-group"><label>Status:</label><span class="status-badge">${d.status || 'Pendente'}</span></div>
            <div class="info-group"><label>Tipo:</label><span>${d.tipo || 'Não informado'}</span></div>
            ${d.parceiro ? `<div class="info-group"><label>Parceiro:</label><span>${d.parceiro}</span></div>` : ''}
            <div class="info-actions">
                <button onclick="window.print()" class="print-btn">🖨️ Imprimir</button>
                <button onclick="location.reload()" class="new-search-btn">🔍 Nova Consulta</button>
            </div>
        </div>
    `;
}

// ==================== EVENTOS ====================

// Submit do formulário
document.getElementById('searchForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const cpf = document.getElementById('cpf').value;
    const dataNascimento = document.getElementById('dataNascimento').value;
    
    if (!cpf || !dataNascimento) {
        showToast('Preencha todos os campos', 'error');
        return;
    }
    
    const cpfLimpo = limparCPF(cpf);
    if (cpfLimpo.length !== 11) {
        showToast('CPF inválido', 'error');
        return;
    }
    
    hideResult();
    showLoading();
    
    try {
        const resultado = await buscarDados(cpf, dataNascimento);
        exibirResultado(resultado);
        showResult();
        if (resultado.success) {
            showToast('Dados encontrados!', 'success');
        } else {
            showToast(resultado.message || 'Não encontrado', 'warning');
        }
    } catch (error) {
        showToast('Erro na consulta: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Botão fechar
document.getElementById('btnFechar').addEventListener('click', function() {
    hideResult();
    document.getElementById('searchForm').reset();
});

// Formatação do CPF
document.getElementById('cpf').addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length >= 11) {
        v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (v.length >= 7) {
        v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (v.length >= 4) {
        v = v.replace(/(\d{3})(\d+)/, '$1.$2');
    }
    e.target.value = v;
});

// Limitar data de nascimento
const hoje = new Date().toISOString().split('T')[0];
document.getElementById('dataNascimento').setAttribute('max', hoje);

console.log('✅ Sistema inicializado com sucesso!');
console.log('✅ Função hideResult:', typeof hideResult);
