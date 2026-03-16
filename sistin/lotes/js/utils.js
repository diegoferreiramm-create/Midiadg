const ModuloUtils = {
    // 1. Relógio do Cabeçalho (HUD)
    atualizarRelogio: function() {
        const el = document.getElementById('dataHoraHud');
        if (el) {
            el.innerText = new Date().toLocaleString('pt-BR');
        }
    },

    // 2. Navegação Global: Esconde todas as telas e mostra o Menu
    voltarParaMenu: function() {
        const telas = [
            'recebimentoBox', 
            'maloteBox', 
            'entregaBox', 
            'entradaBox', 
            'hudUsuario', 
            'camadaResumoBipagem', 
            'camadaDetalheBipagem'
        ];
        
        telas.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Mostra o Menu e o HUD novamente
        document.getElementById('menuBox').style.display = 'flex';
        document.getElementById('hudUsuario').style.display = 'block';
        
        // Garante que a rolagem volte ao topo
        window.scrollTo(0, 0);
    },

    // 3. Feedback Sonoro (Opcional, mas útil na Bipagem)
    tocarSomSucesso: function() {
        // Se desejar, pode adicionar um Beep aqui
        console.log("Bip: Sucesso");
    },

    tocarSomErro: function() {
        // Se desejar, pode adicionar um alerta sonoro aqui
        console.log("Bip: Erro");
    }
};

// --- LOG DE FECHAMENTO E ATUALIZAÇÃO (SISTEMA DE SEGURANÇA) ---
// Esta parte roda automaticamente para monitorar a aba
window.addEventListener('beforeunload', function () {
    if (typeof AppSessao !== 'undefined' && AppSessao.nome && AppSessao.nome !== "") {
        let mensagemAcao = "";
        
        // Diferencia se foi botão Sair, F5 ou fechar aba
        if (AppSessao.clicouSair) {
            mensagemAcao = "SAIU PELO BOTAO (LOGOUT)";
        } else if (window.performance && performance.navigation.type === 1) {
            mensagemAcao = "PAGINA ATUALIZADA (F5)";
        } else {
            mensagemAcao = "ABA OU NAVEGADOR FECHADO";
        }

        const argsLog = [
            AppSessao.nome, 
            AppSessao.parceiro || "S/P", 
            mensagemAcao, 
            "Sistema Lotes"
        ];
        
        // Montagem da URL exata para o seu doGet reconhecer (usando as constantes do config.js)
        const urlFinal = WEB_APP_URL + 
                         "?action=registrarAcaoNoLog" + 
                         "&args=" + encodeURIComponent(JSON.stringify(argsLog)) + 
                         "&token=" + TOKEN_SECRETO;

        // Envia o log de forma "invisível" usando Beacon API
        navigator.sendBeacon(urlFinal);
    }
});
