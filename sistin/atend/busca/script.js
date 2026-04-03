// ============================================
// CONFIGURAÇÕES (igual ao seu sistema)
// ============================================

const urlSistema = "https://script.google.com/macros/s/AKfycbz4Oz1hxpYjRiRMTo1FaVc4FS8tLEe-VLZeXYhL6BwXTkcfGHMwg2ZN-4eRdXu_of3-/exec";

// ============================================
// BUSCA IGUAL AO SEU SISTEMA
// ============================================

function executarBusca() {
    const cpf = document.getElementById("cpf").value;
    const dataNasc = document.getElementById("dataNascimento").value;
    
    if(!cpf) {
        showToast("Digite o CPF", "error");
        return;
    }
    
    if(!dataNasc) {
        showToast("Selecione a data de nascimento", "error");
        return;
    }
    
    // Formata a data
    const [ano, mes, dia] = dataNasc.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    
    // Limpa CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    showLoading(true);
    document.getElementById("resultArea").style.display = "none";
    
    // Usa o mesmo formato do seu sistema que funciona
    fetch(`${urlSistema}?action=buscar&cpf=${cpfLimpo}&data_nasc=${dataFormatada}`, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.text())
    .then(text => {
        showLoading(false);
        
        // Tenta converter o texto para JSON
        let res;
        try {
            res = JSON.parse(text);
        } catch(e) {
            // Se não for JSON, tenta extrair de outra forma
            console.log("Resposta bruta:", text);
            showToast("Erro na resposta do servidor", "error");
            return;
        }
        
        if(res && res.success) {
            const div = document.getElementById("resultContent");
            div.innerHTML = "";
            
            const item = res.dados;
            
            const isIndeferido = item.status && (item.status.toLowerCase().includes('indeferido') || item.status.toLowerCase().includes('negado'));
            
            let statusClass = 'status-error';
            if(item.status === 'Ativo' || item.status === 'Aprovado' || item.status === 'Deferido') statusClass = 'status-ok';
            if(item.status === 'Pedido a caminho da ARCE') statusClass = 'status-warning';
            
            div.innerHTML = `
                <div class="res-card">
                    <b>CPF:</b> ${formatarCPF(item.cpf)}<br>
                    <b>NOME:</b> ${item.nome || '-'}<br>
                    <b>DATA DE NASCIMENTO:</b> ${item.nasc || '-'}<br>
                    <b>MUNICÍPIO:</b> ${item.municipio || '-'}<br>
                    <b>VIA:</b> ${item.via || '-'}<br>
                    <b>PARCEIRO:</b> ${item.parceiro || '-'}<br>
                    <b>DATA SOLICITAÇÃO:</b> ${item.data || '-'}<br>
                    <b>STATUS:</b> <span class="status-badge ${statusClass}">${item.status || '-'}</span><br>
                    <b>MOTIVO:</b> ${item.motivo || '-'}<br>
                    <b>DATA STATUS:</b> ${item.data_status || '-'}<br>
                    ${isIndeferido ? `<b>PRAZO:</b> ⏰ ${item.prazo || '-'}<br>` : ''}
                </div>
            `;
            
            document.getElementById("resultArea").style.display = "block";
            showToast("Registro encontrado!", "success");
        } else {
            showToast(res?.mensagem || "Nenhum registro encontrado", "error");
        }
    })
    .catch(err => {
        showLoading(false);
        console.error("Erro:", err);
        showToast("Erro ao pesquisar. Verifique o Web App.", "error");
    });
}

function formatarCPF(cpf) {
    if(!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if(numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function showLoading(show) {
    const loading = document.getElementById('loadingOverlay');
    if(loading) loading.style.display = show ? 'flex' : 'none';
}

function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ============================================
// MÁSCARA CPF E EVENTOS (igual seu sistema)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('searchForm');
    const cpfInput = document.getElementById('cpf');
    const btnFechar = document.getElementById('btnFechar');
    
    // Máscara CPF
    if(cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if(value.length > 11) value = value.slice(0, 11);
            if(value.length >= 4) value = value.replace(/(\d{3})(\d)/, '$1.$2');
            if(value.length >= 8) value = value.replace(/(\d{3})(\d{3})(\d)/, '$1.$2.$3');
            if(value.length >= 11) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
            e.target.value = value;
        });
    }
    
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            executarBusca();
        });
    }
    
    if(btnFechar) {
        btnFechar.addEventListener('click', function() {
            document.getElementById('resultArea').style.display = 'none';
        });
    }
});
