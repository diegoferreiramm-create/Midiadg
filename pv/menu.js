document.addEventListener('DOMContentLoaded', function() {
    // 🔒 SEGURANÇA: Verifica obrigatoriamente se o usuário está logado
    const nomeUsuario = localStorage.getItem('pv43_nome_usuario');
    const tipoUsuario = localStorage.getItem('pv43_tipo_usuario');

    // Se não houver dados salvos, expulsa de volta para o login
    if (!nomeUsuario || !tipoUsuario) {
        alert('Acesso negado! Faça o login pelo sistema.');
        window.location.href = 'pv43.html';
        return;
    }

    // Exibe o nome e o tipo do usuário autenticado no menu
    document.getElementById('usuario-logado-texto').innerText = `Logado como: ${nomeUsuario} (${tipoUsuario.toUpperCase()})`;

    // Ação do botão Sair
    document.getElementById('btn-sair').addEventListener('click', function() {
        localStorage.removeItem('pv43_nome_usuario');
        localStorage.removeItem('pv43_tipo_usuario');
        window.location.href = 'pv43.html';
    });
});

// Função que direciona para os módulos internos a partir do menu
function redirecionar(modulo) {
    switch(modulo) {
        case 'cadastramento':
            window.location.href = 'cadastramento.html';
            break;
        case 'agendamentos':
            window.location.href = 'agendamentos.html';
            break;
        case 'lista':
            window.location.href = 'lista.html';
            break;
        case 'graficos':
            window.location.href = 'graficos.html';
            break;
        case 'configuracoes':
            window.location.href = 'configuracoes.html';
            break;
        default:
            alert('Módulo em desenvolvimento.');
    }
}