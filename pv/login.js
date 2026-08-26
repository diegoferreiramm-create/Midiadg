document.addEventListener('DOMContentLoaded', function () {

    // =====================================================
    // ELEMENTOS DA TELA
    // =====================================================

    const loginBox = document.getElementById('login-box');
    const trocaSenhaBox = document.getElementById('troca-senha-box');
    const linkTrocarSenha = document.getElementById('link-trocar-senha');
    const linkVoltarLogin = document.getElementById('link-voltar-login');

    // =====================================================
    // VERIFICAÇÃO DA API
    // =====================================================

    if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
        console.error('API_CONFIG não encontrada.');
        alert('Erro de configuração: a URL da API não foi encontrada.');
        return;
    }

    console.log('API configurada:', API_CONFIG.BASE_URL);

    // =====================================================
    // ALTERNAR PARA TELA DE TROCA DE SENHA
    // =====================================================

    if (linkTrocarSenha) {
        linkTrocarSenha.addEventListener('click', function (e) {
            e.preventDefault();
            loginBox.classList.add('hidden');
            trocaSenhaBox.classList.remove('hidden');
        });
    }

    // =====================================================
    // VOLTAR PARA O LOGIN
    // =====================================================

    if (linkVoltarLogin) {
        linkVoltarLogin.addEventListener('click', function (e) {
            e.preventDefault();
            trocaSenhaBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
        });
    }

    // =====================================================
    // LOGIN (GET - IGUAL AO ORIGINAL)
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
                console.log('Enviando login...');
                console.log('Usuário:', usuario);

                // 🔥 GET - IGUAL AO ORIGINAL
                const url = API_CONFIG.BASE_URL + 
                    '?action=login' +
                    '&usuario=' + encodeURIComponent(usuario) +
                    '&senha=' + encodeURIComponent(senha);

                console.log('📡 URL:', url);

                const respostaHTTP = await fetch(url, { method: 'GET' });

                console.log('Status HTTP:', respostaHTTP.status);

                if (!respostaHTTP.ok) {
                    throw new Error('Servidor retornou HTTP ' + respostaHTTP.status);
                }

                const resposta = await respostaHTTP.json();
                console.log('Resposta da API:', resposta);

                if (resposta.sucesso) {
                    console.log('Login realizado com sucesso.');

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
    // TROCA DE SENHA (GET - IGUAL AO ORIGINAL QUE FUNCIONA)
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
                // 🔥 GET - IGUAL AO ORIGINAL QUE FUNCIONA
                const url = API_CONFIG.BASE_URL + 
                    '?action=trocarSenha' +
                    '&usuario=' + encodeURIComponent(usuario) +
                    '&senhaAtual=' + encodeURIComponent(senhaAtual) +
                    '&novaSenha=' + encodeURIComponent(novaSenha);

                console.log('📡 URL:', url);
                console.log('Solicitando alteração de senha...');

                const respostaHTTP = await fetch(url, { method: 'GET' });

                console.log('Status HTTP:', respostaHTTP.status);

                if (!respostaHTTP.ok) {
                    throw new Error('Servidor retornou HTTP ' + respostaHTTP.status);
                }

                const resposta = await respostaHTTP.json();
                console.log('Resposta da troca de senha:', resposta);

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
// 🔥 FUNÇÕES GLOBAIS PARA CONFIGURAÇÕES (NOVAS)
// ============================================================

// ============================================================
// LISTAR USUÁRIOS (GET - LEITURA)
// ============================================================
window.listarUsuarios = function() {
    return new Promise((resolve, reject) => {
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
            reject(new Error('API não configurada'));
            return;
        }
        
        const url = API_CONFIG.BASE_URL + '?action=listarUsuarios';
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

// ============================================================
// CADASTRAR USUÁRIO (POST - ESCRITA)
// ============================================================
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

        console.log('📡 Cadastrando usuário (POST):', usuario);

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

// ============================================================
// EXCLUIR USUÁRIO (POST - ESCRITA)
// ============================================================
window.excluirUsuario = function(usuario) {
    return new Promise((resolve, reject) => {
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
            reject(new Error('API não configurada'));
            return;
        }
        
        const dados = new URLSearchParams();
        dados.append('acao', 'excluirUsuario');
        dados.append('usuario', usuario);

        console.log('📡 Excluindo usuário (POST):', usuario);

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

console.log('✅ login.js carregado');
console.log('📖 GET (leitura): listarUsuarios');
console.log('✏️ POST (escrita): cadastrarUsuario, excluirUsuario');
