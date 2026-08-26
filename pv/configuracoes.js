// ==========================================
// CONFIGURACOES.JS - COMPLETO E CORRIGIDO
// ==========================================

// ==========================================
// FUNÇÃO GLOBAL PARA MOSTRAR ERROS
// ==========================================
function mostrarErroTela(mensagem) {
    const msgErro = document.getElementById('msg-erro');
    if (msgErro) {
        msgErro.innerText = '❌ ' + mensagem;
        msgErro.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const nomeUsuario = localStorage.getItem('pv43_nome_usuario');
    const tipoUsuario = localStorage.getItem('pv43_tipo_usuario');

    // VERIFICA SE ESTÁ LOGADO
    if (!nomeUsuario) {
        alert('⚠️ Acesso restrito! Redirecionando para a tela de login.');
        window.location.href = 'pv43.html';
        return;
    }

    // EXIBE NOME DO USUÁRIO
    document.getElementById('usuario-logado-texto').innerText = `Logado como: ${nomeUsuario} (${tipoUsuario.toUpperCase()})`;

    // VERIFICA SE É ADMIN
    if (tipoUsuario !== 'admin') {
        document.getElementById('aviso-admin').style.display = 'block';
        document.getElementById('form-cadastro-user').style.display = 'none';
    }

    // ==========================================
    // CARREGAR LISTA DE USUÁRIOS
    // ==========================================
    function carregarUsuarios() {
        const tbody = document.getElementById('corpo-tabela-usuarios');
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
    // CADASTRAR USUÁRIO (Usando o padrão do seu sistema)
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

        if (!usuario) { mostrarErroTela('Digite o usuário.'); return; }
        if (!senha) { mostrarErroTela('Digite a senha.'); return; }
        if (!nome) { mostrarErroTela('Digite o nome completo.'); return; }

        const loginLogado = localStorage.getItem('pv43_login_usuario') || localStorage.getItem('pv43_nome_usuario');

        // Objeto de dados enviado através da função central chamarAPI do sistema
        const dados = {
            usuario: usuario,
            senha: senha,
            nome: nome,
            tipo: tipo,
            cadastrado_por: loginLogado
        };

        this.disabled = true;
        this.innerText = 'Cadastrando...';

        // Usa a mesma função padrão do api.js que o resto do sistema usa com sucesso
        chamarAPI('cadastrarUsuario', dados)
            .then(resposta => {
                if (resposta.sucesso) {
                    msgSucesso.innerText = '✅ ' + resposta.mensagem;
                    msgSucesso.style.display = 'block';
                    
                    // Limpa o formulário
                    document.getElementById('novo-usuario').value = '';
                    document.getElementById('nova-senha').value = '';
                    document.getElementById('novo-nome').value = '';
                    document.getElementById('novo-tipo').value = 'operador';

                    // Recarrega a lista
                    carregarUsuarios();
                } else {
                    mostrarErroTela(resposta.mensagem || 'Erro ao cadastrar usuário.');
                }
            })
            .catch(erro => {
                mostrarErroTela('Erro de comunicação: ' + erro.message);
            })
            .finally(() => {
                this.disabled = false;
                this.innerText = '✅ Cadastrar Usuário';
            });
    });

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
