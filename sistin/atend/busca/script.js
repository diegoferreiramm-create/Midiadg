const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz4Oz1hxpYjRiRMTo1FaVc4FS8tLEe-VLZeXYhL6BwXTkcfGHMwg2ZN-4eRdXu_of3-/exec";

// Mapeamento dos campos que serão exibidos (na ordem que você quer)
const CAMPOS = {
    cpf: "CPF",
    nome: "NOME COMPLETO",
    nasc: "DATA DE NASCIMENTO",
    municipio: "MUNICÍPIO",
    via: "VIA",
    parceiro: "PARCEIRO",
    data: "DATA SOLICITAÇÃO",
    status: "STATUS",
    motivo: "MOTIVO",
    data_status: "DATA STATUS",
    prazo: "PRAZO"  // Será exibido apenas se status for indeferido
};

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('searchForm');
    const cpfInput = document.getElementById('cpf');
    const dataInput = document.getElementById('dataNascimento');
    const btnFechar = document.getElementById('btnFechar');
    
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length >= 4) value = value.replace(/(\d{3})(\d)/, '$1.$2');
            if (value.length >= 8) value = value.replace(/(\d{3})(\d{3})(\d)/, '$1.$2.$3');
            if (value.length >= 11) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
            e.target.value = value;
        });
    }
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            let cpf = cpfInput.value.replace(/\D/g, '');
            const dataNascimento = dataInput.value;
            
            if (cpf && cpf.length < 11) cpf = cpf.padStart(11, '0');
            
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
    
    if (btnFechar) {
        btnFechar.addEventListener('click', function() {
            document.getElementById('resultArea').style.display = 'none';
        });
    }
});

async function buscarDados(cpf, dataNascimento) {
    showLoading(true);
    
    try {
        const [ano, mes, dia] = dataNascimento.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        const url = `${WEB_APP_URL}?acao=buscar&cpf=${cpf}&data_nasc=${dataFormatada}`;
        
        console.log("🔍 Buscando:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        
        const resultado = await response.json();
        
        console.log("📦 Resultado:", resultado);
        
        if (resultado.success) {
            exibirResultado(resultado.dados);
            showToast('Registro encontrado com sucesso!', 'success');
        } else {
            showToast(resultado.mensagem || 'Nenhum registro encontrado.', 'error');
            document.getElementById('resultArea').style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        showToast('Erro ao consultar: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function exibirResultado(dados) {
    const resultContent = document.getElementById('resultContent');
    const resultArea = document.getElementById('resultArea');
    
    let html = '';
    
    // Verifica se o status é indeferido para mostrar o prazo
    const statusIndeferido = dados.status && (
        dados.status.toLowerCase().includes('indeferido') || 
        dados.status.toLowerCase().includes('negado')
    );
    
    for (const [chave, rotulo] of Object.entries(CAMPOS)) {
        // Pula o campo prazo se NÃO for indeferido
        if (chave === 'prazo' && !statusIndeferido) {
            continue;
        }
        
        let valor = dados[chave];
        
        if (valor && valor !== '') {
            // Formata CPF
            if (chave === 'cpf') {
                valor = formatarCPF(valor);
            }
            
            // Formata data de nascimento e data solicitação
            if ((chave === 'nasc' || chave === 'data' || chave === 'data_status') && valor) {
                valor = formatarDataExibicao(valor);
            }
            
            // Formata status com badge colorido
            if (chave === 'status') {
                let statusClass = 'status-error';
                if (valor === 'Ativo' || valor === 'Aprovado' || valor === 'Deferido') {
                    statusClass = 'status-ok';
                } else if (valor === 'Pedido a caminho da ARCE') {
                    statusClass = 'status-warning';
                }
                html += `
                    <div class="info-row">
                        <div class="info-label">${rotulo}</div>
                        <div class="info-value">
                            <span class="status-badge ${statusClass}">${valor}</span>
                        </div>
                    </div>
                `;
            } 
            // Formata prazo especial
            else if (chave === 'prazo') {
                html += `
                    <div class="info-row prazo-row">
                        <div class="info-label">${rotulo}</div>
                        <div class="info-value prazo-value">⏰ ${valor}</div>
                    </div>
                `;
            }
            else {
                html += `
                    <div class="info-row">
                        <div class="info-label">${rotulo}</div>
                        <div class="info-value">${valor}</div>
                    </div>
                `;
            }
        }
    }
    
    // Se não mostrou nada, exibe mensagem
    if (html === '') {
        html = '<div class="info-row">Nenhuma informação disponível para este registro.</div>';
    }
    
    resultContent.innerHTML = html;
    resultArea.style.display = 'block';
    resultArea.scrollIntoView({ behavior: 'smooth' });
}

function formatarCPF(cpf) {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarDataExibicao(data) {
    if (!data) return '';
    
    // Se já está no formato DD/MM/AAAA
    if (typeof data === 'string' && data.includes('/')) {
        return data;
    }
    
    // Se é objeto Date
    if (data instanceof Date) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }
    
    // Se é string no formato YYYY-MM-DD
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}/)) {
        const partes = data.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    
    return data;
}

function showLoading(show) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = show ? 'flex' : 'none';
}

function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
