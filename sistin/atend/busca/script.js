// URL do Google Apps Script (Verifique se é a versão mais atualizada)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3mlbt1TcoW03bZsm_C0zKhqKvO9yDx5o8b_oncsLGcctJT-NxQZMJiSrQZogJT95b/exec';

// ==================== FUNÇÕES DE INTERFACE (DEFINIDAS PRIMEIRO) ====================

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
    // Converte YYYY-MM-DD para DD/MM/YYYY
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    return data;
}

// ==================== COMUNICAÇÃO COM O SERVIDOR ====================

async function buscarDados(cpf, dataNasc) {
    // Usamos URLSearchParams para garantir compatibilidade com o doGet/doPost do Apps Script
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ cpf: cpf, dataNascimento: dataNasc })
    });
    return await response.json();
}

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
    container.innerHTML = `
        <div class="dados-usuario">
            <div class="info-row"><div class="info-label">Carteira:</div><div class="info-value"><strong>${d.numeroCarteira || '---'}</strong></div></div>
            <div class="info-row"><div class="info-label">Nome:</div><div class="info-value">${d.nome || '---'}</div></div>
            <div class="info-row"><div class="info-label">CPF:</div><div class="info-value">${d.cpf || '---'}</div></div>
            <div class="info-row"><div class="info-label">Nascimento:</div><div class="info-value">${formatarData(d.nascimento) || '---'}</div></div>
            <div class="info-row"><div class="info-label">Município:</div><div class="info-value">${d.municipio || '---'}</div></div>
            <div class="info-row"><div class="info-label">Status:</div><div class="info-value"><span class="status-badge ${d.status === 'Aprovado' ? 'status-ok' : 'status-error'}">${d.status || 'Pendente'}</span></div></div>
            <div class="info-row"><div class="info-label">Lote:</div><div class="info-value">${d.lote || '---'}</div></div>
            
            <div style="margin-top: 25px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="window.print()" style="flex:1; padding:12px; background:#4361ee; color:white; border:none; border-radius:8px; cursor:pointer;">🖨️ Imprimir</button>
                <button onclick="location.reload()" style="flex:1; padding:12px; background:#edf2f4; color:#2b2d42; border:none; border-radius:8px; cursor:pointer;">🔍 Nova Consulta</button>
            </div>
        </div>
    `;
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
                const resultado = await buscarDados(cpfLimpo, dataNascValue);
                exibirResultado(resultado);
                showResult();
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
            searchForm.reset();
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
