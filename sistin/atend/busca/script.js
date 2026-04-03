// ============================================
// CONFIGURAÇÃO - Proxy no servidor
// ============================================

const URL_BUSCA = "https://www.midiadg.com.br/sistin/atend/busca/proxy.php";

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

function executarBusca() {
    const cpf = document.getElementById("cpf").value;
    const dataNasc = document.getElementById("dataNascimento").value;
    
    if (!cpf) {
        exibirMensagem("Digite o CPF", "erro");
        return;
    }
    
    if (!dataNasc) {
        exibirMensagem("Selecione a data de nascimento", "erro");
        return;
    }
    
    const [ano, mes, dia] = dataNasc.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    mostrarCarregando(true);
    esconderResultado();
    
    fetch(`${URL_BUSCA}?action=buscar&cpf=${cpfLimpo}&data_nasc=${dataFormatada}`)
        .then(resposta => resposta.json())
        .then(dados => {
            mostrarCarregando(false);
            
            if (dados && dados.success) {
                exibirResultado(dados.dados);
                exibirMensagem("Registro encontrado!", "sucesso");
            } else {
                exibirMensagem(dados?.mensagem || "Nenhum registro encontrado", "erro");
            }
        })
        .catch(erro => {
            mostrarCarregando(false);
            console.error("Erro:", erro);
            exibirMensagem("Erro na consulta. Tente novamente.", "erro");
        });
}

function exibirResultado(item) {
    const container = document.getElementById("resultadoConteudo");
    
    const isIndeferido = item.status && (
        item.status.toLowerCase().includes('indeferido') || 
        item.status.toLowerCase().includes('negado')
    );
    
    let classeStatus = 'status-erro';
    if (item.status === 'Ativo' || item.status === 'Aprovado' || item.status === 'Deferido') {
        classeStatus = 'status-ok';
    } else if (item.status === 'Pedido a caminho da ARCE') {
        classeStatus = 'status-alerta';
    }
    
    container.innerHTML = `
        <div class="resultado-card">
            <div class="resultado-linha"><strong>CPF:</strong> ${formatarCPF(item.cpf)}</div>
            <div class="resultado-linha"><strong>NOME:</strong> ${item.nome || '-'}</div>
            <div class="resultado-linha"><strong>DATA NASCIMENTO:</strong> ${item.nasc || '-'}</div>
            <div class="resultado-linha"><strong>MUNICÍPIO:</strong> ${item.municipio || '-'}</div>
            <div class="resultado-linha"><strong>VIA:</strong> ${item.via || '-'}</div>
            <div class="resultado-linha"><strong>PARCEIRO:</strong> ${item.parceiro || '-'}</div>
            <div class="resultado-linha"><strong>DATA SOLICITAÇÃO:</strong> ${item.data || '-'}</div>
            <div class="resultado-linha"><strong>STATUS:</strong> <span class="status-badge ${classeStatus}">${item.status || '-'}</span></div>
            <div class="resultado-linha"><strong>MOTIVO:</strong> ${item.motivo || '-'}</div>
            <div class="resultado-linha"><strong>DATA STATUS:</strong> ${item.data_status || '-'}</div>
            ${isIndeferido ? `<div class="resultado-linha"><strong>PRAZO:</strong> ⏰ ${item.prazo || '-'}</div>` : ''}
        </div>
    `;
    
    document.getElementById("areaResultado").style.display = "block";
}

function formatarCPF(cpf) {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function mostrarCarregando(mostrar) {
    const loading = document.getElementById("loadingOverlay");
    if (loading) loading.style.display = mostrar ? "flex" : "none";
}

function exibirMensagem(texto, tipo) {
    const toast = document.getElementById("toastMessage");
    toast.textContent = texto;
    toast.className = `toast-message ${tipo}`;
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

function esconderResultado() {
    document.getElementById("areaResultado").style.display = "none";
}

// ============================================
// MÁSCARA DO CPF
// ============================================

document.getElementById("cpf").addEventListener("input", function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length >= 4) valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    if (valor.length >= 8) valor = valor.replace(/(\d{3})(\d{3})(\d)/, '$1.$2.$3');
    if (valor.length >= 11) valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
    e.target.value = valor;
});

// ============================================
// EVENTOS
// ============================================

document.getElementById("searchForm").addEventListener("submit", function(e) {
    e.preventDefault();
    executarBusca();
});

document.getElementById("btnFechar").addEventListener("click", function() {
    document.getElementById("areaResultado").style.display = "none";
});
