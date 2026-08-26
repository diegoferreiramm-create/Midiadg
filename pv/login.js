// login.js - Substitua o bloco de login

document.addEventListener('DOMContentLoaded', function () {
    const loginBox = document.getElementById('login-box');
    const trocaSenhaBox = document.getElementById('troca-senha-box');
    const linkTrocarSenha = document.getElementById('link-trocar-senha');
    const linkVoltarLogin = document.getElementById('link-voltar-login');

    if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
        console.error('API_CONFIG não encontrada.');
        alert('Erro de configuração: a URL da API não foi encontrada.');
        return;
    }

    console.log('API configurada:', API_CONFIG.BASE_URL);

    // =====================================================
    // Alternar entre Login e Troca de Senha
    // =====================================================
    if (linkTrocarSenha) {
        linkTrocarSenha.addEventListener('click', function (e) {
            e.preventDefault();
            loginBox.classList.add('hidden');
            trocaSenhaBox.classList.remove('hidden');
        });
    }

    if (linkVoltarLogin) {
        linkVoltarLogin.addEventListener('click', function (e) {
            e.preventDefault();
            trocaSenhaBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
        });
    }

    // =====================================================
    // LOGIN (POST com URLSearchParams)
    // =====================================================
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async function (e) {
            e.preventDefault();

            const usuarioInput = document.getElementById('usuario');
            const senhaInput = document.getElementById('senha');

            const usuario = usuarioInput.value.trim();
            const senha = senhaInput.value.trim();

            if (!usuario) {
                alert('Digite o usuário.');
                usuarioInput.focus();
                return;
            }

            if (!senha) {
                alert('Digite a senha.');
                senhaInput.focus();
                return;
            }

            const botao = formLogin.querySelector('button[type="submit"]');
            const textoOriginal = botao ? botao.innerText : 'Entrar';

            if (botao) {
                botao.disabled = true;
                botao.innerText = 'Entrando...';
            }

            try {
                // 🔥 USANDO POST com URLSearchParams
                const params = new URLSearchParams();
                params.append('acao', 'login');
                params.append('usuario', usuario);
                params.append('senha', senha);

                console.log('📡 Enviando POST para:', API_CONFIG.BASE_URL);
                console.log('📦 Dados:', params.toString());

                const respostaHTTP = await fetch(API_CONFIG.BASE_URL, {
                    method: 'POST',
                    body: params  // ← URLSearchParams, NÃO JSON
                });

                if (!respostaHTTP.ok) {
                    throw new Error('Servidor retornou HTTP ' + respostaHTTP.status);
                }

                const resposta = await respostaHTTP.json();
                console.log('📥 Resposta:', resposta);

                if (resposta.sucesso) {
                    localStorage.setItem('pv43_nome_usuario', resposta.nome || usuario);
                    localStorage.setItem('pv43_login_usuario', usuario);
                    localStorage.setItem('pv43_tipo_usuario', resposta.tipo || '');
                    window.location.href = 'menu.html';
                } else {
                    alert('Erro no login:\n\n' + (resposta.mensagem || 'Usuário ou senha incorretos.'));
                }

            } catch (erro) {
                console.error('ERRO COMPLETO NO LOGIN:', erro);
                alert('Erro na comunicação com o servidor.\n\n' + erro.message);
            } finally {
                if (botao) {
                    botao.disabled = false;
                    botao.innerText = textoOriginal;
                }
            }
        });
    }

    // =====================================================
    // TROCA DE SENHA (POST com URLSearchParams)
    // =====================================================
    const formTroca = document.getElementById('form-troca');

    if (formTroca) {
        formTroca.addEventListener('submit', async function (e) {
            e.preventDefault();

            const usuarioInput = document.getElementById('usuario-troca');
            const senhaAtualInput = document.getElementById('senha-atual');
            const novaSenhaInput = document.getElementById('nova-senha');

            const usuario = usuarioInput.value.trim();
            const senhaAtual = senhaAtualInput.value.trim();
            const novaSenha = novaSenhaInput.value.trim();

            if (!usuario) {
                alert('Digite o usuário.');
                usuarioInput.focus();
                return;
            }

            if (!senhaAtual) {
                alert('Digite a senha atual.');
                senhaAtualInput.focus();
                return;
            }

            if (!novaSenha) {
                alert('Digite a nova senha.');
                novaSenhaInput.focus();
                return;
            }

            try {
                const params = new URLSearchParams();
                params.append('acao', 'trocarSenha');
                params.append('usuario', usuario);
                params.append('senhaAtual', senhaAtual);
                params.append('novaSenha', novaSenha);

                const respostaHTTP = await fetch(API_CONFIG.BASE_URL, {
                    method: 'POST',
                    body: params
                });

                if (!respostaHTTP.ok) {
                    throw new Error('Servidor retornou HTTP ' + respostaHTTP.status);
                }

                const resposta = await respostaHTTP.json();

                if (resposta.sucesso) {
                    alert('Senha alterada com sucesso!');
                    trocaSenhaBox.classList.add('hidden');
                    loginBox.classList.remove('hidden');
                    formTroca.reset();
                } else {
                    alert('Erro:\n\n' + (resposta.mensagem || 'Não foi possível alterar a senha.'));
                }

            } catch (erro) {
                console.error('ERRO NA TROCA DE SENHA:', erro);
                alert('Erro na comunicação com o servidor.\n\n' + erro.message);
            }
        });
    }
});

// ============================================================
// FUNÇÕES GLOBAIS PARA CONFIGURAÇÕES (POST com URLSearchParams)
// ============================================================

window.listarUsuarios = function() {
    return new Promise((resolve, reject) => {
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
            reject(new Error('API não configurada'));
            return;
        }
        
        // Usando GET para listagem (leitura)
        const url = API_CONFIG.BASE_URL + '?acao=listarUsuarios';
        console.log('📡 Listando usuários (GET):', url);

        fetch(url, { method: 'GET' })
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(resolve)
            .catch(reject);
    });
};

window.cadastrarUsuario = function(usuario, senha, nome, tipo, cadastradoPor) {
    return new Promise((resolve, reject) => {
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
            reject(new Error('API não configurada'));
            return;
        }
        
        const dados = new URLSearchParams();
        dados.append('acao', 'cadastrarUsuario');
        dados.append('usuario', usuario);
        dados.append('senha', senha);
        dados.append('nome', nome);
        dados.append('tipo', tipo);
        dados.append('cadastrado_por', cadastradoPor);

        console.log('📡 Cadastrando usuário:', usuario);

        fetch(API_CONFIG.BASE_URL, {
            method: 'POST',
            body: dados
        })
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
};

window.excluirUsuario = function(usuario) {
    return new Promise((resolve, reject) => {
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
            reject(new Error('API não configurada'));
            return;
        }
        
        const dados = new URLSearchParams();
        dados.append('acao', 'excluirUsuario');
        dados.append('usuario', usuario);

        console.log('📡 Excluindo usuário:', usuario);

        fetch(API_CONFIG.BASE_URL, {
            method: 'POST',
            body: dados
        })
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
};

console.log('✅ login.js carregado (versão POST)');
