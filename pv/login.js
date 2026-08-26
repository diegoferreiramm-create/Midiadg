// ============================================================
// LOGIN.JS - LÓGICA DA TELA DE LOGIN E TROCA DE SENHA
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    const formLogin = document.getElementById("form-login");
    const formTroca = document.getElementById("form-troca");
    
    const loginBox = document.getElementById("login-box");
    const trocaSenhaBox = document.getElementById("troca-senha-box");
    
    const linkTrocaSenha = document.getElementById("link-trocar-senha");
    const linkVoltarLogin = document.getElementById("link-voltar-login");

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
                    // Salva os dados do usuário logado no localStorage (usado no menu principal)
                    localStorage.setItem("pv43_nome_usuario", response.nome || usuario);
                    localStorage.setItem("pv43_tipo_usuario", response.tipo || "usuario");
                    
                    alert("✅ Login realizado com sucesso!");
                    window.location.href = "menu.html"; // Redireciona para o menu principal
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
});
