    <!-- ========================================== -->
    <!-- SCRIPTS - ORDEM CORRETA -->
    <!-- ========================================== -->
    <script src="api.js"></script>
    
    <!-- 🔥 LOGIN.JS PRIMEIRO (tem as funções) -->
    <script src="login.js"></script>
    
    <!-- ========================================== -->
    <!-- CONFIGURAÇÕES - CÓDIGO EMBUTIDO -->
    <!-- ========================================== -->
    <script>
        (function() {
            'use strict';

            console.log('🔧 Inicializando configurações...');
            console.log('📡 API_CONFIG:', typeof API_CONFIG !== 'undefined' ? 'OK' : 'NÃO ENCONTRADO');
            console.log('📡 window.listarUsuarios:', typeof window.listarUsuarios !== 'undefined' ? 'OK' : 'NÃO ENCONTRADO');

            const nomeUsuario = localStorage.getItem('pv43_nome_usuario');
            const tipoUsuario = localStorage.getItem('pv43_tipo_usuario');

            // ==========================================
            // VERIFICA LOGIN
            // ==========================================
            if (!nomeUsuario) {
                alert('⚠️ Acesso restrito! Redirecionando para a tela de login.');
                window.location.href = 'pv43.html';
                return;
            }

            document.getElementById('usuario-logado-texto').innerText = `Logado como: ${nomeUsuario} (${tipoUsuario.toUpperCase()})`;

            if (tipoUsuario !== 'admin') {
                document.getElementById('aviso-admin').style.display = 'block';
                document.getElementById('form-cadastro-user').style.display = 'none';
            }

            // ==========================================
            // VERIFICA SE AS FUNÇÕES DO LOGIN.JS ESTÃO DISPONÍVEIS
            // ==========================================
            if (typeof window.listarUsuarios === 'undefined') {
                console.error('❌ Função listarUsuarios não encontrada!');
                document.getElementById('corpo-tabela-usuarios').innerHTML = 
                    '<tr><td colspan="5" style="text-align:center; padding:30px; color:#ef4444;">❌ Erro: login.js não carregado. <br> <button onclick="location.reload()">Recarregar</button></td></tr>';
                return;
            }

            // ==========================================
            // CARREGAR LISTA DE USUÁRIOS
            // ==========================================
            function carregarUsuarios() {
                const tbody = document.getElementById('corpo-tabela-usuarios');
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">⏳ Carregando...</td></tr>';

                window.listarUsuarios()
                    .then(resposta => {
                        console.log('📡 Resposta listarUsuarios:', resposta);
                        if (resposta.sucesso && resposta.dados) {
                            renderizarTabela(resposta.dados);
                        } else {
                            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#ef4444;">❌ ' + (resposta.mensagem || 'Erro ao carregar usuários.') + '</td></tr>';
                        }
                    })
                    .catch(erro => {
                        console.error('❌ Erro:', erro);
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#ef4444;">❌ Erro: ' + erro.message + '</td></tr>';
                    });
            }

            function renderizarTabela(usuarios) {
                const tbody = document.getElementById('corpo-tabela-usuarios');
                
                if (!usuarios || usuarios.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">📭 Nenhum usuário cadastrado.</td></tr>';
                    return;
                }

                let html = '';
                usuarios.forEach(user => {
                    const tipoBadge = user.tipo === 'admin' 
                        ? '<span class="badge-admin">🔑 ADMIN</span>' 
                        : '<span class="badge-operador">👤 OPERADOR</span>';

                    const podeExcluir = user.usuario !== 'admin' ? 
                        `<button class="btn-excluir-user" onclick="window.excluirUsuarioHandler('${user.usuario}')">🗑️</button>` : 
                        '<span style="color:#999;font-size:0.7rem;">✖️</span>';

                    html += `
                        <tr>
                            <td><strong>${user.usuario}</strong></td>
                            <td>${user.nome || '-'}</td>
                            <td>${tipoBadge}</td>
                            <td>${user.cadastrado_por || '-'}</td>
                            <td>${podeExcluir}</td>
                        </tr>
                    `;
                });

                tbody.innerHTML = html;
            }

            // ==========================================
            // CADASTRAR USUÁRIO
            // ==========================================
            document.getElementById('btn-cadastrar-user').addEventListener('click', function() {
                const usuario = document.getElementById('novo-usuario').value.trim();
                const senha = document.getElementById('nova-senha').value.trim();
                const nome = document.getElementById('novo-nome').value.trim();
                const tipo = document.getElementById('novo-tipo').value;

                const msgErro = document.getElementById('msg-erro');
                const msgSucesso = document.getElementById('msg-sucesso');

                msgErro.style.display = 'none';
                msgSucesso.style.display = 'none';

                if (!usuario) { alert('Digite o usuário.'); return; }
                if (!senha) { alert('Digite a senha.'); return; }
                if (!nome) { alert('Digite o nome completo.'); return; }

                const loginLogado = localStorage.getItem('pv43_login_usuario') || localStorage.getItem('pv43_nome_usuario');

                this.disabled = true;
                this.innerText = 'Cadastrando...';

                window.cadastrarUsuario(usuario, senha, nome, tipo, loginLogado)
                    .then(resposta => {
                        console.log('📡 Resposta cadastrarUsuario:', resposta);
                        if (resposta.sucesso) {
                            msgSucesso.innerText = '✅ ' + resposta.mensagem;
                            msgSucesso.style.display = 'block';
                            
                            document.getElementById('novo-usuario').value = '';
                            document.getElementById('nova-senha').value = '';
                            document.getElementById('novo-nome').value = '';
                            document.getElementById('novo-tipo').value = 'operador';

                            carregarUsuarios();
                        } else {
                            alert('❌ ' + (resposta.mensagem || 'Erro ao cadastrar usuário.'));
                        }
                    })
                    .catch(erro => {
                        console.error('❌ Erro:', erro);
                        alert('❌ Erro de comunicação: ' + erro.message);
                    })
                    .finally(() => {
                        this.disabled = false;
                        this.innerText = '✅ Cadastrar Usuário';
                    });
            });

            // ==========================================
            // EXCLUIR USUÁRIO
            // ==========================================
            window.excluirUsuarioHandler = function(usuario) {
                if (!confirm('⚠️ Tem certeza que deseja excluir o usuário "' + usuario + '"?\n\nEsta ação não pode ser desfeita!')) return;

                window.excluirUsuario(usuario)
                    .then(resposta => {
                        console.log('📡 Resposta excluirUsuario:', resposta);
                        if (resposta.sucesso) {
                            alert('✅ Usuário excluído com sucesso!');
                            carregarUsuarios();
                        } else {
                            alert('❌ ' + (resposta.mensagem || 'Erro ao excluir'));
                        }
                    })
                    .catch(erro => alert('❌ Erro de comunicação: ' + erro.message));
            };

            // ==========================================
            // INICIALIZAR
            // ==========================================
            carregarUsuarios();

        })();
    </script>
</body>
</html>
