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

    if (
        typeof API_CONFIG === 'undefined' ||
        !API_CONFIG.BASE_URL
    ) {

        console.error('API_CONFIG não encontrada.');

        alert(
            'Erro de configuração: a URL da API não foi encontrada.'
        );

        return;
    }


    console.log(
        'API configurada:',
        API_CONFIG.BASE_URL
    );


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
    // LOGIN
    // =====================================================

    const formLogin = document.getElementById('form-login');


    if (formLogin) {

        formLogin.addEventListener('submit', async function (e) {

            e.preventDefault();


            // ---------------------------------------------
            // PEGA OS DADOS
            // ---------------------------------------------

            const usuarioInput =
                document.getElementById('usuario');

            const senhaInput =
                document.getElementById('senha');


            const usuario =
                usuarioInput.value.trim();

            const senha =
                senhaInput.value.trim();


            // ---------------------------------------------
            // VALIDAÇÃO
            // ---------------------------------------------

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


            // ---------------------------------------------
            // BOTÃO
            // ---------------------------------------------

            const botao =
                formLogin.querySelector(
                    'button[type="submit"]'
                );


            const textoOriginal =
                botao ? botao.innerText : 'Entrar';


            if (botao) {

                botao.disabled = true;

                botao.innerText = 'Entrando...';
            }


            try {

                console.log('Enviando login...');

                console.log('Usuário:', usuario);


                // -----------------------------------------
                // ENVIA COMO FORMULÁRIO
                // Evita problemas de preflight/CORS
                // -----------------------------------------

                const dados = new URLSearchParams();

                dados.append(
                    'acao',
                    'login'
                );

                dados.append(
                    'usuario',
                    usuario
                );

                dados.append(
                    'senha',
                    senha
                );


                // -----------------------------------------
                // REQUISIÇÃO
                // -----------------------------------------

                const respostaHTTP = await fetch(
                    API_CONFIG.BASE_URL,
                    {
                        method: 'POST',
                        body: dados
                    }
                );


                console.log(
                    'Status HTTP:',
                    respostaHTTP.status
                );


                // -----------------------------------------
                // VERIFICA STATUS HTTP
                // -----------------------------------------

                if (!respostaHTTP.ok) {

                    throw new Error(
                        'Servidor retornou HTTP ' +
                        respostaHTTP.status
                    );
                }


                // -----------------------------------------
                // CONVERTE RESPOSTA PARA JSON
                // -----------------------------------------

                const resposta =
                    await respostaHTTP.json();


                console.log(
                    'Resposta da API:',
                    resposta
                );


                // -----------------------------------------
                // LOGIN APROVADO
                // -----------------------------------------

                if (resposta.sucesso) {

                    console.log(
                        'Login realizado com sucesso.'
                    );


                    // -------------------------------------
                    // SALVA DADOS DA SESSÃO
                    // -------------------------------------

                    localStorage.setItem(
                        'pv43_nome_usuario',
                        resposta.nome || usuario
                    );


                    localStorage.setItem(
                        'pv43_tipo_usuario',
                        resposta.tipo || ''
                    );


                    // -------------------------------------
                    // REDIRECIONA PARA O MENU
                    // -------------------------------------

                    window.location.href =
                        'menu.html';

                }

                // -----------------------------------------
                // LOGIN NEGADO
                // -----------------------------------------

                else {

                    alert(
                        'Erro no login:\n\n' +
                        (
                            resposta.mensagem ||
                            'Usuário ou senha incorretos.'
                        )
                    );

                }


            } catch (erro) {

                console.error(
                    'ERRO COMPLETO NO LOGIN:',
                    erro
                );


                alert(
                    'Erro na comunicação com o servidor.\n\n' +
                    erro.message
                );


            } finally {

                // -----------------------------------------
                // RESTAURA BOTÃO
                // -----------------------------------------

                if (botao) {

                    botao.disabled = false;

                    botao.innerText =
                        textoOriginal;
                }

            }

        });

    }


    // =====================================================
    // TROCA DE SENHA
    // =====================================================

    const formTroca =
        document.getElementById('form-troca');


    if (formTroca) {

        formTroca.addEventListener(
            'submit',
            async function (e) {

                e.preventDefault();


                // -----------------------------------------
                // PEGA OS DADOS
                // -----------------------------------------

                const usuarioInput =
                    document.getElementById(
                        'usuario-troca'
                    );

                const senhaAtualInput =
                    document.getElementById(
                        'senha-atual'
                    );

                const novaSenhaInput =
                    document.getElementById(
                        'nova-senha'
                    );


                const usuario =
                    usuarioInput.value.trim();

                const senhaAtual =
                    senhaAtualInput.value.trim();

                const novaSenha =
                    novaSenhaInput.value.trim();


                // -----------------------------------------
                // VALIDAÇÃO
                // -----------------------------------------

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


                // -----------------------------------------
                // ENVIA PARA A API
                // -----------------------------------------

                try {

                    const dados =
                        new URLSearchParams();


                    dados.append(
                        'acao',
                        'trocarSenha'
                    );

                    dados.append(
                        'usuario',
                        usuario
                    );

                    dados.append(
                        'senhaAtual',
                        senhaAtual
                    );

                    dados.append(
                        'novaSenha',
                        novaSenha
                    );


                    console.log(
                        'Solicitando alteração de senha...'
                    );


                    const respostaHTTP =
                        await fetch(
                            API_CONFIG.BASE_URL,
                            {
                                method: 'POST',
                                body: dados
                            }
                        );


                    console.log(
                        'Status HTTP:',
                        respostaHTTP.status
                    );


                    if (!respostaHTTP.ok) {

                        throw new Error(
                            'Servidor retornou HTTP ' +
                            respostaHTTP.status
                        );
                    }


                    const resposta =
                        await respostaHTTP.json();


                    console.log(
                        'Resposta da troca de senha:',
                        resposta
                    );


                    // -------------------------------------
                    // SENHA ALTERADA
                    // -------------------------------------

                    if (resposta.sucesso) {

                        alert(
                            'Senha alterada com sucesso!'
                        );


                        trocaSenhaBox.classList.add(
                            'hidden'
                        );

                        loginBox.classList.remove(
                            'hidden'
                        );


                        formTroca.reset();


                    }

                    // -------------------------------------
                    // ERRO
                    // -------------------------------------

                    else {

                        alert(
                            'Erro:\n\n' +
                            (
                                resposta.mensagem ||
                                'Não foi possível alterar a senha.'
                            )
                        );
                    }


                } catch (erro) {

                    console.error(
                        'ERRO NA TROCA DE SENHA:',
                        erro
                    );


                    alert(
                        'Erro na comunicação com o servidor.\n\n' +
                        erro.message
                    );
                }

            }
        );

    }

});