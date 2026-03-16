const ModuloLogin = {
    // Tenta realizar o login
    entrar: function() {
        const user = document.getElementById('userLogin').value;
        const pass = document.getElementById('passLogin').value;
        const msg = document.getElementById('msg');

        if (!user || !pass) {
            msg.className = "erro";
            msg.innerText = "Preencha todos os campos!";
            return;
        }

        msg.className = "";
        msg.innerText = "Validando acesso...";

        // Chamada via nossa ponte configurada no config.js
        google.script.run.withSuccessHandler(function(res) {
            if (res.sucesso) {
                // Salva os dados no objeto global de sessão
                AppSessao.nome = res.nome;
                AppSessao.parceiro = res.parceiro;

                // Transição de telas
                document.getElementById('loginBox').style.display = 'none';
                document.getElementById('menuBox').style.display = 'flex';
                
                // Atualiza o HUD (Cabeçalho)
                document.getElementById('infoUsuario').innerText = "USUÁRIO: " + AppSessao.nome + " | PARCEIRO: " + AppSessao.parceiro;
                document.getElementById('hudUsuario').style.display = 'block';
                
                // Inicia o relógio que está no Utils
                if (typeof ModuloUtils !== 'undefined') {
                    AppSessao.intervaloRelogio = setInterval(ModuloUtils.atualizarRelogio, 1000);
                }
            } else {
                msg.className = "erro";
                msg.innerText = res.erro || "Usuário ou senha incorretos!";
            }
        }).validarLogin(user, pass);
    },

    // Limpa a tela e encerra a visualização
    finalizarSessaoVisual: function() {
        if (AppSessao.nome === "") return;

        // Esconde todas as possíveis caixas abertas
        const boxes = ['menuBox', 'recebimentoBox', 'hudUsuario', 'maloteBox', 'entradaBox'];
        boxes.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        // Reseta campos de input
        document.getElementById('userLogin').value = "";
        document.getElementById('passLogin').value = "";
        document.getElementById('msg').innerText = "";
        
        // Limpa os dados de sessão
        AppSessao.nome = "";
        AppSessao.parceiro = "";
        
        if (AppSessao.intervaloRelogio) {
            clearInterval(AppSessao.intervaloRelogio);
        }
        
        document.getElementById('loginBox').style.display = 'flex';
        console.log("Sistema resetado para login.");
    }
};
