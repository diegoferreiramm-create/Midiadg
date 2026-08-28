// ============================================================
// LOGIN.JS - LÓGICA DA TELA DE LOGIN, TROCA DE SENHA E USUÁRIOS
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    const formLogin = document.getElementById("form-login");
    const formTroca = document.getElementById("form-troca");
    
    const loginBox = document.getElementById("login-box");
    const trocaSenhaBox = document.getElementById("troca-senha-box");
    
    const linkTrocaSenha = document.getElementById("link-trocar-senha");
    const linkVoltarLogin = document.getElementById("link-voltar-login");

    // Só executa a lógica de alternância e submissão se estivermos na página de login
    if (formLogin && linkTrocaSenha && linkVoltarLogin) {
        // Alternar visibilidade das telas
        linkTrocaSenha.addEventListener("click", function (e) {
            e.preventDefault();
            loginBox.classList.add("hidden");
            trocaSenhaBox.classList.remove("hidden");
        });

        linkVoltarLogin.addEventListener("click", function (e) {
            e.preventDefault();
            trocaSenhaBox.classList.add("hidden");
            loginBox.classList.remove("hidden");
        });

        // Ação de Login
        formLogin.addEventListener("submit", function (e) {
            e.preventDefault();

            const usuario = document.getElementById("usuario").value.trim();
            const senha = document.getElementById("senha").value.trim();

            const botao = formLogin.querySelector("button[type='submit']");
            botao.disabled = true;
            botao.innerText = "Entrando...";

            chamarAPI_POST("login", { usuario: usuario, senha: senha })
                .then(response => {
                    if (response.sucesso) {
                        localStorage.setItem("pv43_nome_usuario", response.nome || usuario);
                        localStorage.setItem("pv43_tipo_usuario", response.tipo || "usuario");
                        

                        window.location.href = "menu.html";
                    } else {
                        alert("⚠️ " + (response.mensagem || "Usuário ou senha inválidos."));
                        botao.disabled = false;
                        botao.innerText = "Entrar";
                    }
                })
                .catch(erro => {
                    console.error("Erro no login:", erro);
                    alert("❌ Erro ao conectar com o servidor.");
                    botao.disabled = false;
                    botao.innerText = "Entrar";
                });
        });

        // Ação de Troca de Senha
        if (formTroca) {
            formTroca.addEventListener("submit", function (e) {
                e.preventDefault();

                const usuario = document.getElementById("usuario-troca").value.trim();
                const senhaAtual = document.getElementById("senha-atual").value.trim();
                const novaSenha = document.getElementById("nova-senha").value.trim();

                const botao = formTroca.querySelector("button[type='submit']");
                botao.disabled = true;
                botao.innerText = "Atualizando...";

                chamarAPI_POST("trocarSenha", {
                    usuario: usuario,
                    senhaAtual: senhaAtual,
                    novaSenha: novaSenha
                })
                .then(response => {
                    if (response.sucesso) {
                        alert("✅ Senha alterada com sucesso! Faça login com a nova senha.");
                        formTroca.reset();
                        trocaSenhaBox.classList.add("hidden");
                        loginBox.classList.remove("hidden");
                    } else {
                        alert("⚠️ " + (response.mensagem || "Não foi possível alterar a senha."));
                    }
                    botao.disabled = false;
                    botao.innerText = "Atualizar Senha";
                })
                .catch(erro => {
                    console.error("Erro na troca de senha:", erro);
                    alert("❌ Erro ao conectar com o servidor.");
                    botao.disabled = false;
                    botao.innerText = "Atualizar Senha";
                });
            });
        }
    }
});

// ============================================================
// 🔥 FUNÇÕES GLOBAIS PARA A TELA DE CONFIGURAÇÕES (GERENCIAMENTO DE USUÁRIOS)
// ============================================================

window.listarUsuarios = function() {
    return chamarAPI_POST("listarUsuarios", {});
};

window.cadastrarUsuario = function(usuario, senha, nome, tipo, cadastradoPor) {
    return chamarAPI_POST("cadastrarUsuario", {
        usuario: usuario,
        senha: senha,
        nome: nome,
        tipo: tipo,
        cadastrado_por: cadastradoPor
    });
};

window.excluirUsuario = function(usuario) {
    return chamarAPI_POST("excluirUsuario", {
        usuario: usuario
    });
};
