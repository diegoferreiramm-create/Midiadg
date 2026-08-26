// ==========================================
// CONFIGURACOES.JS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    // 🔒 VERIFICAÇÃO RIGOROSA DE ADMIN
    const tipoUsuario = localStorage.getItem("pv43_tipo_usuario");

    // Se não for admin, bloqueia imediatamente e chuta para o menu
    if (tipoUsuario !== "admin") {
        alert("⛔ Acesso restrito! Apenas administradores podem acessar esta página.");
        window.location.href = "menu.html"; // Redireciona para o menu principal
        return; // Interrompe a execução de qualquer outra coisa no script
    }

    // PEGA OS DADOS DO USUÁRIO LOGADO CORRETAMENTE
    const nomeUsuario = localStorage.getItem("pv43_nome_usuario") || "Administrador";

    // EXIBE NOME DO USUÁRIO NA TELA
    const elTextoLogado = document.getElementById('usuario-logado-texto');
    if (elTextoLogado) {
        elTextoLogado.innerText = `Logado como: ${nomeUsuario} (${tipoUsuario.toUpperCase()})`;
    }

    // ==========================================
    // CARREGAR LISTA DE USUÁRIOS
    // ==========================================
    function carregarUsuarios() {
        const tbody = document.getElementById('corpo-tabela-usuarios');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">⏳ Carregando...</td></tr>';

        if (typeof chamarAPI === 'undefined') {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#ef4444;">❌ API não configurada.</td></tr>';
            return;
        }

        chamarAPI('listarUsuarios')
            .then(resposta => {
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
        if (!tbody) return;
        
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
                `<button class="btn-excluir-user" onclick="excluirUsuario('${user.usuario}')">🗑️</button>` : 
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
    const btnCadastrar = document.getElementById('btn-cadastrar-user');
    if (btnCadastrar) {
        btnCadastrar.addEventListener('click', function() {
            const usuario = document.getElementById('novo-usuario').value.trim();
            const senha = document.getElementById('nova-senha').value.trim();
            const nome = document.getElementById('novo-nome').value.trim();
            const tipo = document.getElementById('novo-tipo').value;

            const msgErro = document.getElementById('msg-erro');
            const msgSucesso = document.getElementById('msg-sucesso');

            if (msgErro) msgErro.style.display = 'none';
            if (msgSucesso) msgSucesso.style.display = 'none';

            if (!usuario) { mostrarErro('Digite o usuário.'); return; }
            if (!senha) { mostrarErro('Digite a senha.'); return; }
            if (!nome) { mostrarErro('Digite o nome completo.'); return; }

            // PEGA QUEM ESTÁ CADASTRANDO
            const loginLogado = localStorage.getItem('pv43_login_usuario') || localStorage.getItem('pv43_nome_usuario') || 'Admin';

            const dados = {
                usuario: usuario,
                senha: senha,
                nome: nome,
                tipo: tipo,
                cadastrado_por: nomeCompletoLogado  // ← Vai preencher certinho na Coluna E
            };

            this.disabled = true;
            this.innerText = 'Cadastrando...';

            chamarAPI('cadastrarUsuario', dados)
                .then(resposta => {
                    if (resposta.sucesso) {
                        if (msgSucesso) {
                            msgSucesso.innerText = '✅ ' + resposta.mensagem;
                            msgSucesso.style.display = 'block';
                        }
                        
                        // Limpa o formulário
                        document.getElementById('novo-usuario').value = '';
                        document.getElementById('nova-senha').value = '';
                        document.getElementById('novo-nome').value = '';
                        document.getElementById('novo-tipo').value = 'operador';

                        // Recarrega a lista
                        carregarUsuarios();
                    } else {
                        mostrarErro(resposta.mensagem || 'Erro ao cadastrar usuário.');
                    }
                })
                .catch(erro => {
                    mostrarErro('Erro de comunicação: ' + erro.message);
                })
                .finally(() => {
                    this.disabled = false;
                    this.innerText = '✅ Cadastrar Usuário';
                });
        });
    }

    function mostrarErro(mensagem) {
        const msgErro = document.getElementById('msg-erro');
        if (msgErro) {
            msgErro.innerText = '❌ ' + mensagem;
            msgErro.style.display = 'block';
        } else {
            alert('❌ ' + mensagem);
        }
    }

    // ==========================================
    // EXCLUIR USUÁRIO (APENAS ADMIN)
    // ==========================================
    window.excluirUsuario = function(usuario) {
        if (!confirm('⚠️ Tem certeza que deseja excluir o usuário "' + usuario + '"?\n\nEsta ação não pode ser desfeita!')) return;

        chamarAPI('excluirUsuario', { usuario: usuario })
            .then(resposta => {
                if (resposta.sucesso) {
                    alert('✅ Usuário excluído com sucesso!');
                    carregarUsuarios();
                } else {
                    alert('❌ Erro ao excluir: ' + (resposta.mensagem || 'Erro desconhecido'));
                }
            })
            .catch(erro => alert('❌ Erro de comunicação: ' + erro.message));
    };

    // ==========================================
    // INICIALIZAR
    // ==========================================
    carregarUsuarios();
});
