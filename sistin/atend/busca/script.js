// ============================================
// CONFIGURAÇÕES - Usando proxy local
// ============================================

const urlSistema = "https://midiadg.com.br/sistin/atend/busca/proxy.php";

// ============================================
// BUSCA (igual ao seu sistema que funciona)
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
    
    fetch(`${urlSistema}?action=buscar&cpf=${cpfLimpo}&data_nasc=${dataFormatada}`)
        .then(res => res.json())
        .then(res => {
            showLoading(false);
            
            if(!res || !res.success) {
                showToast(res.mensagem || "Nenhum registro encontrado", "error");
                return;
            }
            
            // Exibe o resultado
            const div = document.getElementById("resultContent");
            div.innerHTML = "";
            
            const item = res.dados;
            
            // Verifica se é indeferido para mostrar prazo
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
        })
        .catch(err => {
            showLoading(false);
            console.error("Erro:", err);
            showToast("Erro ao pesquisar: " + err.message, "error");
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
    if(!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ============================================
// MÁSCARA CPF E EVENTOS
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
    
    // Submit do formulário
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            executarBusca();
        });
    }
    
    // Fechar resultado
    if(btnFechar) {
        btnFechar.addEventListener('click', function() {
            document.getElementById('resultArea').style.display = 'none';
        });
    }
});
