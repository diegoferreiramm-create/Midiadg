// ==========================================
// LISTA.JS - CONTROLE DA PÁGINA DE LISTAGEM
// ==========================================

const URL_API = window.API_CONFIG ? window.API_CONFIG.BASE_URL : null;

if (!URL_API) {
    console.error('❌ API_CONFIG não encontrada!');
    alert('Erro de configuração: API não encontrada.');
}

// ==========================================
// VARIÁVEIS GLOBAIS DE CONTROLE DO SISTEMA
// ==========================================
// Armazena a lista completa de registros vindos do banco/arquivo JSON
let todosOsDados = [];
// Armazena apenas os registros que passaram pelo filtro de busca atual
let dadosFiltrados = [];
// Controla quais colunas da tabela devem aparecer ou ficar ocultas na tela
let colunasVisiveis = {};
// Armazena os dados do perfil do usuário logado atualmente no sistema
let usuarioAtual = null;
// Define se o usuário logado possui privilégios de Administrador (true ou false)
let isAdmin = false;
// Armazena o nome por extenso do usuário logado para exibição na interface
let usuarioNome = '';
// Controla em qual número de página o usuário está posicionado no momento
let paginaAtual = 1;
// Define quantos registros aparecem por página na tabela 
// (Pode receber números fixos como 10, 25, 50, 100 ou a string 'todos' para desativar o corte e exibir tudo de uma vez)
let itensPorPagina = 25; // Garanta que começa com número, nunca como elemento HTML

// ==========================================
// BUSCAR DADOS DO USUÁRIO NA ABA "User"
// ==========================================
function buscarDadosUsuario(nomeUsuario) {
    return new Promise((resolve, reject) => {
        if (!URL_API) {
            reject('API não configurada');
            return;
        }

        var url = URL_API + '?acao=buscarUsuario&nome=' + encodeURIComponent(nomeUsuario);
        console.log('🔍 Buscando usuário:', url);

        fetch(url, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(resposta => {
            console.log('📦 Resposta usuário:', resposta);
            if (resposta.sucesso && resposta.dados) {
                resolve(resposta.dados);
            } else {
                reject(resposta.mensagem || 'Usuário não encontrado');
            }
        })
        .catch(erro => {
            reject(erro.message);
        });
    });
}

// ==========================================
// DEFINIÇÃO DAS 21 COLUNAS
// ==========================================
const COLUNAS = [
    { id: 'id', nome: 'ID', visivel: true, largura: '45px' },
    { id: 'numero_cha', nome: 'ADMIN', visivel: true, largura: '80px' },
    { id: 'numero_sec', nome: 'RESPONSÁVEL', visivel: true, largura: '110px' },
    { id: 'nome', nome: 'NOME', visivel: true, largura: '170px' },
    { id: 'data_nasc', nome: 'NASCIMENTO', visivel: false, largura: '85px' },
    { id: 'endereco', nome: 'ENDEREÇO', visivel: false, largura: '140px' },
    { id: 'n_casa', nome: 'Nº CASA', visivel: false, largura: '45px' },
    { id: 'bairro', nome: 'BAIRRO', visivel: true, largura: '110px' },
    { id: 'cidade', nome: 'CIDADE', visivel: true, largura: '110px' },
    { id: 'telefone', nome: 'TELEFONE', visivel: true, largura: '110px' },
    { id: 'candidato', nome: 'CANDIDATO', visivel: true, largura: '190px' },
    { id: 'titulo', nome: 'TÍTULO', visivel: false, largura: '100px' },
    { id: 'zona', nome: 'ZONA', visivel: true, largura: '45px' },
    { id: 'secao', nome: 'SEÇÃO', visivel: true, largura: '55px' },
    { id: 'nome_mae', nome: 'NOME DA MÃE', visivel: false, largura: '130px' },
    { id: 'local_vot', nome: 'LOCAL VOTAÇÃO', visivel: true, largura: '130px' },
    { id: 'bairro_vot', nome: 'BAIRRO VOTAÇÃO', visivel: true, largura: '110px' },
    { id: 'endereco_vot', nome: 'END VOTAÇÃO', visivel: false, largura: '130px' },
    { id: 'obs', nome: 'OBS', visivel: false, largura: '140px' },
    { id: 'data', nome: 'DATA CADASTRO', visivel: true, largura: '100px' },
    { id: 'nivel', nome: 'NÍVEL', visivel: true, largura: '70px' },
    { id: 'acoes', nome: 'AÇÕES', visivel: true, largura: '120px' }
];

// ==========================================
// INICIALIZAÇÃO - CORRIGIDA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // CARREGA O USUÁRIO DA SESSÃO
    const nomeUsuario = localStorage.getItem('pv43_nome_usuario');
    
    if (!nomeUsuario) {
        alert('⚠️ Acesso restrito! Redirecionando para a tela de login.');
        window.location.href = 'pv43.html';
        return;
    }
    
    usuarioNome = nomeUsuario;
    usuarioAtual = usuarioNome;

    console.log('👤 Usuário logado:', usuarioNome);

    // REMOVE AS DATAS AUTOMÁTICAS
    // const hoje = new Date().toISOString().split('T')[0];
    // const dataInicio = document.getElementById('fDataInicio');
    // const dataFim = document.getElementById('fDataFim');
    // if (dataInicio) dataInicio.value = hoje;
    // if (dataFim) dataFim.value = hoje;

    COLUNAS.forEach(col => {
        colunasVisiveis[col.id] = col.visivel;
    });

    carregarPreferenciasColunas();
    gerarControlesColunas();
    carregarDados();

    // CONECTA OS EVENTOS DOS FILTROS
    const camposFiltro = [
        'fNome', 'fBairro', 'fCidade', 'fCandidato', 
        'fZona', 'fSecao', 'fLocalVot', 'fNivel', 
        'fResponsavel', 'fAdmin', 'fDataInicio', 'fDataFim'
    ];

    camposFiltro.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                console.log('🔄 Evento input em:', id, 'valor:', this.value);
                window.filtrarTabela();
            });
            el.addEventListener('change', function() {
                console.log('🔄 Evento change em:', id, 'valor:', this.value);
                window.filtrarTabela();
            });
        }
    });
});

// ==========================================
// FUNÇÃO PARA CONVERTER DATA DD/MM/AAAA PARA TIMESTAMP
// ==========================================
function converterDataParaTimestamp(dataStr) {
    if (!dataStr) return null;
    
    if (dataStr.includes('-')) {
        return new Date(dataStr + 'T00:00:00').getTime();
    }
    
    if (dataStr.includes('/')) {
        const partes = dataStr.split('/');
        if (partes.length === 3) {
            const dia = parseInt(partes[0]);
            const mes = parseInt(partes[1]) - 1;
            const ano = parseInt(partes[2]);
            return new Date(ano, mes, dia).getTime();
        }
    }
    
    return null;
}

// ==========================================
// FUNÇÃO DE FILTRO - COM DATA CORRIGIDA E HIERARQUIA
// ==========================================
window.filtrarTabela = function() {
    console.log('🔍 FILTRO EXECUTADO!');
    
    if (!todosOsDados || todosOsDados.length === 0) {
        console.warn('⏳ Sem dados para filtrar');
        return;
    }

    const fNome = document.getElementById('fNome')?.value?.trim() || '';
    const fBairro = document.getElementById('fBairro')?.value?.trim() || '';
    const fCidade = document.getElementById('fCidade')?.value?.trim() || '';
    const fCandidato = document.getElementById('fCandidato')?.value?.trim() || '';
    const fZona = document.getElementById('fZona')?.value?.trim() || '';
    const fSecao = document.getElementById('fSecao')?.value?.trim() || '';
    const fLocalVot = document.getElementById('fLocalVot')?.value?.trim() || '';
    const fNivel = document.getElementById('fNivel')?.value?.trim() || '';
    const fResponsavel = document.getElementById('fResponsavel')?.value?.trim() || '';
    const fAdmin = document.getElementById('fAdmin')?.value?.trim() || '';
    const fDataInicio = document.getElementById('fDataInicio')?.value || '';
    const fDataFim = document.getElementById('fDataFim')?.value || '';

    console.log('📝 Valores dos filtros:', { 
        fNome, fBairro, fCidade, 
        fDataInicio, fDataFim 
    });

    const temFiltro = fNome !== '' || fBairro !== '' || fCidade !== '' || 
                     fCandidato !== '' || fZona !== '' || fSecao !== '' || 
                     fLocalVot !== '' || fNivel !== '' || fResponsavel !== '' || 
                     fAdmin !== '' || fDataInicio !== '' || fDataFim !== '';

    if (!temFiltro) {
        dadosFiltrados = [...todosOsDados];
        console.log('🔄 Nenhum filtro - Lista completa:', dadosFiltrados.length);
        renderizarTabela();
        document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
        return;
    }

    dadosFiltrados = todosOsDados.filter(item => {
        const nome = String(item.nome || '').toUpperCase();
        const bairro = String(item.bairro || '').toUpperCase();
        const cidade = String(item.cidade || '').toUpperCase();
        const candidato = String(item.candidato || '').toUpperCase();
        const zona = String(item.zona || '');
        const secao = String(item.secao || '');
        const localVot = String(item.local_vot || '').toUpperCase();
        const nivel = String(item.nivel || '');
        const responsavel = String(item.numero_sec || '').toUpperCase();
        const admin = String(item.numero_cha || '').toUpperCase();
        
        const dataCadastro = item.data || '';
        const dataTimestamp = converterDataParaTimestamp(dataCadastro);
        const dataInicioTimestamp = fDataInicio ? new Date(fDataInicio + 'T00:00:00').getTime() : null;
        const dataFimTimestamp = fDataFim ? new Date(fDataFim + 'T00:00:00').getTime() : null;

        if (fNome && !nome.includes(fNome.toUpperCase())) return false;
        if (fBairro && !bairro.includes(fBairro.toUpperCase())) return false;
        if (fCidade && !cidade.includes(fCidade.toUpperCase())) return false;
        if (fCandidato && !candidato.includes(fCandidato.toUpperCase())) return false;
        if (fZona && !zona.includes(fZona)) return false;
        if (fSecao && !secao.includes(fSecao)) return false;
        if (fLocalVot && !localVot.includes(fLocalVot.toUpperCase())) return false;
        if (fNivel && nivel !== fNivel) return false;
        if (fResponsavel && !responsavel.includes(fResponsavel.toUpperCase())) return false;
        if (fAdmin && !admin.includes(fAdmin.toUpperCase())) return false;
        
        if (fDataInicio && dataTimestamp !== null && dataTimestamp < dataInicioTimestamp) return false;
        if (fDataFim && dataTimestamp !== null && dataTimestamp > dataFimTimestamp) return false;

        return true;
    });

    console.log('🔍 Resultado do filtro:', dadosFiltrados.length, 'registros');

    renderizarTabela();
    document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
};

// ==========================================
// FUNÇÃO PARA LIMPAR FILTROS
// ==========================================
function limparFiltros() {
    const campos = ['fNome', 'fBairro', 'fCidade', 'fCandidato', 'fZona', 'fSecao', 'fLocalVot', 'fResponsavel', 'fAdmin'];
    
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const selectNivel = document.getElementById('fNivel');
    if (selectNivel) selectNivel.value = '';
    
    const dataInicio = document.getElementById('fDataInicio');
    const dataFim = document.getElementById('fDataFim');
    if (dataInicio) dataInicio.value = '';
    if (dataFim) dataFim.value = '';
    
    dadosFiltrados = [...todosOsDados];
    renderizarTabela();
    document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
    console.log('🧹 Filtros limpos - Lista completa:', dadosFiltrados.length);
}

// ==========================================
// CARREGAR DADOS - COM FILTRO POR RESPONSÁVEL
// ==========================================
function carregarDados() {
    const tbody = document.getElementById('corpo-tabela');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="30" style="text-align:center; padding:40px; color:#94a3b8;">⏳ Carregando dados...</td></tr>';
    }

    if (!URL_API) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="30" style="text-align:center; padding:40px; color:#ef4444;">❌ API não configurada.</td></tr>';
        }
        return;
    }

    // BUSCA OS DADOS DO USUÁRIO NA PLANILHA
    buscarDadosUsuario(usuarioNome)
        .then(dadosUsuario => {
            console.log('👤 Dados do usuário encontrados:', dadosUsuario);
            
            // Verifica se é admin baseado no campo 'tipo'
            const tipo = dadosUsuario.tipo || 'operador';
            isAdmin = tipo.toLowerCase() === 'admin';
            
            // NOME do usuário (coluna C da aba User) - usado para filtrar como responsável
            const nomeUsuario = dadosUsuario.nome || usuarioNome;
            
            console.log('👤 Usuário (login):', usuarioNome);
            console.log('👤 Nome (para filtrar como responsável):', nomeUsuario);
            console.log('🔑 Admin:', isAdmin);
            
            // ATUALIZA O CABEÇALHO COM O NOME DA PESSOA
            const usuarioEl = document.getElementById('usuario-logado-texto');
            if (usuarioEl) {
                const tipoUsuario = isAdmin ? '🔑 ADMIN' : '👤 OPERADOR';
                usuarioEl.innerText = `Logado como: ${nomeUsuario} (${tipoUsuario})`;
            }

            // CARREGA OS DADOS DOS CADASTROS
            var url = URL_API + '?acao=listarCadastros';
            console.log('🔍 Chamando:', url);

            return fetch(url, {
                method: 'GET'
            });
        })
        .then(response => {
            console.log('📡 Status:', response.status);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .then(resposta => {
            console.log('📦 Resposta:', resposta);
            
            if (resposta.sucesso && resposta.dados) {
                let dadosFiltradosPorUsuario = resposta.dados;
                
                if (!isAdmin) {
                    // OPERADOR: mostra apenas registros onde o NOME dele está no campo responsavel
                    return buscarDadosUsuario(usuarioNome)
                        .then(dadosUsuario => {
                            const nomeResponsavel = dadosUsuario.nome || usuarioNome;
                            
                            dadosFiltradosPorUsuario = resposta.dados.filter(item => {
                                // Campo responsavel = numero_sec (coluna C) 
                                // OU responsavel (dependendo de como vem do back-end)
                                const responsavelRegistro = String(item.numero_sec || item.responsavel || '').toUpperCase();
                                const nomeBusca = String(nomeResponsavel).toUpperCase();
                                const encontrou = responsavelRegistro === nomeBusca;
                                
                                if (!encontrou) {
                                    console.log('🔒 Ocultando registro ID:', item.id, 
                                        'Responsável:', responsavelRegistro, 
                                        'Usuário:', nomeBusca);
                                }
                                return encontrou;
                            });
                            
                            console.log('👤 OPERADOR - Filtrando por responsável:', nomeResponsavel);
                            console.log('📊 Registros encontrados:', dadosFiltradosPorUsuario.length);
                            
                            return dadosFiltradosPorUsuario;
                        });
                } else {
                    console.log('🔑 ADMIN - Mostrando todos os registros:', resposta.dados.length);
                    return resposta.dados;
                }
            } else {
                throw new Error(resposta.mensagem || 'Erro ao carregar dados');
            }
        })
        .then(dadosFinais => {
            todosOsDados = dadosFinais;
            dadosFiltrados = [...todosOsDados];
            
            document.getElementById('totalRegistros').innerText = todosOsDados.length;
            document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
            
            renderizarTabela();
        })
        .catch(erro => {
            console.error('❌ Erro:', erro);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="30" style="text-align:center; padding:40px; color:#ef4444;">❌ Erro: ' + erro.message + '</td></tr>';
            }
        });
}

// ==========================================
// RENDERIZAR TABELA - COM PAGINAÇÃO E CONTROLE DE AÇÕES
// ==========================================
function renderizarTabela() {
    const thead = document.getElementById('cabecalho-tabela');
    const tbody = document.getElementById('corpo-tabela');

    if (!thead || !tbody) return;

    let headerHtml = '<tr>';
    COLUNAS.forEach(col => {
        const visivel = colunasVisiveis[col.id] !== false;
        headerHtml += `<th style="display: ${visivel ? '' : 'none'}; width: ${col.largura || 'auto'};">${col.nome}</th>`;
    });
    headerHtml += '</tr>';
    thead.innerHTML = headerHtml;

    // Ativa o redimensionamento de colunas estilo Excel
    setTimeout(tornarColunasRedimensionaveis, 50);

    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + COLUNAS.length + '" style="text-align:center; padding:40px; color:#94a3b8;">📭 Nenhum registro encontrado.</td></tr>';
        
        // Atualiza os contadores para zero se não houver registros
        const elPaginaAtual = document.getElementById('paginaAtual');
        const elTotalPaginas = document.getElementById('totalPaginas');
        const elTotalExibidos = document.getElementById('totalExibidos');
        
        if (elPaginaAtual) elPaginaAtual.innerText = '1';
        if (elTotalPaginas) elTotalPaginas.innerText = '1';
        if (elTotalExibidos) elTotalExibidos.innerText = '0';
        return;
    }

    // ==========================================
    // CÁLCULO DA PAGINAÇÃO E FATIAMENTO DOS DADOS
    // ==========================================
    const totalRegistros = dadosFiltrados.length;
    const limite = itensPorPagina === 'todos' ? totalRegistros : itensPorPagina;
    const totalPgs = itensPorPagina === 'todos' ? 1 : (Math.ceil(totalRegistros / limite) || 1);
    
    if (paginaAtual > totalPgs) paginaAtual = totalPgs;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = itensPorPagina === 'todos' ? 0 : (paginaAtual - 1) * limite;
    const fim = itensPorPagina === 'todos' ? totalRegistros : inicio + limite;
    const dadosPaginados = dadosFiltrados.slice(inicio, fim);

    // Atualiza os textos informativos da paginação na tela
    const elPaginaAtual = document.getElementById('paginaAtual');
    const elTotalPaginas = document.getElementById('totalPaginas');
    const elTotalExibidos = document.getElementById('totalExibidos');
    
    if (elPaginaAtual) elPaginaAtual.innerText = paginaAtual;
    if (elTotalPaginas) elTotalPaginas.innerText = totalPgs;
    if (elTotalExibidos) elTotalExibidos.innerText = `${totalRegistros > 0 ? inicio + 1 : 0} - ${Math.min(fim, totalRegistros)} de ${totalRegistros}`;

    let bodyHtml = '';
    
    // Itera apenas sobre os dados fatiados da página atual (ou todos se "Mostrar Tudo" estiver ativo)
    dadosPaginados.forEach((item) => {
        bodyHtml += '<tr>';
        
        COLUNAS.forEach(col => {
            let valor = '';
            const visivel = colunasVisiveis[col.id] !== false;
            
            switch(col.id) {
                case 'id': valor = item.id || ''; break;
                case 'numero_cha': valor = item.numero_cha || ''; break;
                case 'numero_sec': valor = item.numero_sec || ''; break;
                case 'nome': valor = item.nome || ''; break;
                case 'data_nasc': valor = item.data_nasc || ''; break;
                case 'endereco': valor = item.endereco || ''; break;
                case 'n_casa': valor = item.n_casa || ''; break;
                case 'bairro': valor = item.bairro || ''; break;
                case 'cidade': valor = item.cidade || ''; break;
                case 'telefone': valor = item.telefone || ''; break;
                case 'candidato': 
                    let textoCandidato = item.candidato || '';
                    if (textoCandidato) {
                        let partes = textoCandidato.split(/,|\n/);
                        let htmlCandidatos = '';
                        
                        partes.forEach(parte => {
                            let p = parte.trim();
                            if (p !== '') {
                                let textoUpper = p.toUpperCase();
                                if (textoUpper.includes('FEDERAL') || textoUpper.includes('(FED')) {
                                    htmlCandidatos += `<span class="badge-candidato badge-candidato-federal">${p}</span>`;
                                } else if (textoUpper.includes('ESTADUAL') || textoUpper.includes('(EST')) {
                                    htmlCandidatos += `<span class="badge-candidato badge-candidato-estadual">${p}</span>`;
                                } else {
                                    htmlCandidatos += `<span class="badge-candidato badge-candidato-federal">${p}</span>`;
                                }
                            }
                        });
                        valor = htmlCandidatos;
                    } else {
                        valor = '';
                    }
                    break;
                case 'titulo': valor = item.titulo || ''; break;
                case 'zona': valor = item.zona || ''; break;
                case 'secao': valor = item.secao || ''; break;
                case 'nome_mae': valor = item.nome_mae || ''; break;
                case 'local_vot': valor = item.local_vot || ''; break;
                case 'bairro_vot': valor = item.bairro_vot || ''; break;
                case 'endereco_vot': valor = item.endereco_vot || ''; break;
                case 'obs': valor = item.obs || ''; break;
                case 'data': valor = item.data || ''; break;
                case 'nivel': 
                    const nivelMap = {
                        '1': '<span class="badge-nivel badge-nivel-1">COMUM</span>',
                        '2': '<span class="badge-nivel badge-nivel-2">RELEVANTE</span>',
                        '3': '<span class="badge-nivel badge-nivel-3">LÍDER</span>'
                    };
                    valor = nivelMap[item.nivel] || item.nivel || '';
                    break;
                case 'acoes': 
                    const id = item.id || '';
                    let podeEditar = false;
                    
                    if (isAdmin) {
                        podeEditar = true;
                    } else {
                        const nomeResponsavel = String(item.numero_sec || item.responsavel || '').toUpperCase();
                        const usuarioLogado = String(usuarioNome).toUpperCase();
                        podeEditar = nomeResponsavel === usuarioLogado;
                    }
                    
                    if (podeEditar) {
                        valor = `
                            <div style="display: flex; gap: 3px; flex-wrap: wrap;">
                                <button class="btn-excluir" onclick="excluirRegistro('${id}')" title="Excluir">🗑️</button>
                            </div>
                        `;
                    } else {
                        valor = `
                            <div style="display: flex; gap: 3px; flex-wrap: wrap;">
                                <span style="font-size: 0.5rem; color: #94a3b8; margin-left: 3px;">🔒</span>
                            </div>
                        `;
                    }
                    break;
                default: valor = '';
            }

            bodyHtml += `<td style="display: ${visivel ? '' : 'none'};">${valor}</td>`;
        });

        bodyHtml += '</tr>';
    });

    tbody.innerHTML = bodyHtml;
}

// ==========================================
// FUNÇÕES DE AÇÃO
// ==========================================
function editarRegistro(id) {
    if (!id) { alert('❌ ID inválido!'); return; }
    
    // Verifica permissão
    if (!isAdmin) {
        const registro = todosOsDados.find(item => item.id === id);
        if (registro && String(registro.numero_cha || '').toUpperCase() !== usuarioNome.toUpperCase()) {
            alert('❌ Você não tem permissão para editar este registro!');
            return;
        }
    }
    
    const registro = todosOsDados.find(item => item.id === id);
    if (!registro) { alert('❌ Registro não encontrado!'); return; }
    alert('✏️ Editar registro ID: ' + id + '\n\n' + JSON.stringify(registro, null, 2));
}

function visualizarRegistro(id) {
    if (!id) { alert('❌ ID inválido!'); return; }
    const registro = todosOsDados.find(item => item.id === id);
    if (!registro) { alert('❌ Registro não encontrado!'); return; }

    let mensagem = '📋 DETALHES DO CADASTRO\n';
    mensagem += '═'.repeat(40) + '\n';
    mensagem += 'ID: ' + (registro.id || '-') + '\n';
    mensagem += 'ADMIN: ' + (registro.numero_cha || '-') + '\n';
    mensagem += 'RESPONSÁVEL: ' + (registro.numero_sec || '-') + '\n';
    mensagem += 'NOME: ' + (registro.nome || '-') + '\n';
    mensagem += 'NASCIMENTO: ' + (registro.data_nasc || '-') + '\n';
    mensagem += 'ENDEREÇO: ' + (registro.endereco || '') + ', ' + (registro.n_casa || '') + '\n';
    mensagem += 'BAIRRO: ' + (registro.bairro || '-') + '\n';
    mensagem += 'CIDADE: ' + (registro.cidade || '-') + '\n';
    mensagem += 'TELEFONE: ' + (registro.telefone || '-') + '\n';
    mensagem += 'CANDIDATO: ' + (registro.candidato || '-') + '\n';
    mensagem += 'TÍTULO: ' + (registro.titulo || '-') + '\n';
    mensagem += 'ZONA/SEÇÃO: ' + (registro.zona || '-') + '/' + (registro.secao || '-') + '\n';
    mensagem += 'NOME MÃE: ' + (registro.nome_mae || '-') + '\n';
    mensagem += 'LOCAL VOTAÇÃO: ' + (registro.local_vot || '-') + '\n';
    mensagem += 'BAIRRO VOTAÇÃO: ' + (registro.bairro_vot || '-') + '\n';
    mensagem += 'END VOTAÇÃO: ' + (registro.endereco_vot || '-') + '\n';
    mensagem += 'OBS: ' + (registro.obs || '-') + '\n';
    mensagem += 'DATA CADASTRO: ' + (registro.data || '-') + '\n';
    mensagem += 'NÍVEL: ' + (registro.nivel || '-') + '\n';
    mensagem += '═'.repeat(40);

    alert(mensagem);
}

function excluirRegistro(id) {
    if (!id) { alert('❌ ID inválido!'); return; }
    
    // Verifica permissão - APENAS ADMIN PODE EXCLUIR
    if (!isAdmin) {
        alert('❌ Apenas administradores podem excluir registros!');
        return;
    }
    
    if (!confirm('⚠️ Tem certeza que deseja EXCLUIR o registro ID: ' + id + '?\n\nEsta ação não pode ser desfeita!')) return;

    if (!URL_API) { alert('❌ API não configurada.'); return; }

    var url = URL_API + '?acao=excluirCadastro&id=' + encodeURIComponent(id);
    console.log('🔍 Excluindo:', url);

    fetch(url, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(resposta => {
        if (resposta.sucesso) {
            alert('✅ Registro ID: ' + id + ' excluído com sucesso!');
            carregarDados();
        } else {
            alert('❌ Erro ao excluir: ' + (resposta.mensagem || 'Erro desconhecido'));
        }
    })
    .catch(erro => alert('❌ Erro de comunicação: ' + erro.message));
}

// Controla os botões de avançar, voltar e ir para primeira/última página
function mudarPagina(destino) {
    const totalRegistros = dadosFiltrados.length;
    const limite = itensPorPagina === 'todos' ? totalRegistros : itensPorPagina;
    const totalPgs = itensPorPagina === 'todos' ? 1 : (Math.ceil(totalRegistros / limite) || 1);

    if (destino === 'primeira') paginaAtual = 1;
    if (destino === 'anterior' && paginaAtual > 1) paginaAtual--;
    if (destino === 'proxima' && paginaAtual < totalPgs) paginaAtual++;
    if (destino === 'ultima') paginaAtual = totalPgs;

    renderizarTabela();
}

// ==========================================
// CORREÇÃO DO SELETOR DE ITENS POR PÁGINA
// ==========================================
function alterarItensPorPagina() {
    const select = document.getElementById('itensPorPagina');
    if (select) {
        // Pega explicitamente o .value do select (ex: "10", "25", "50", "100" ou "todos")
        const valorSelecionado = select.value;
        
        if (valorSelecionado === 'todos') {
            itensPorPagina = 'todos';
        } else {
            itensPorPagina = parseInt(valorSelecionado) || 25;
        }
        
        paginaAtual = 1; // Volta para a primeira página sempre que alterar o limite
        renderizarTabela();
    }
}

// ==========================================
// EXPORTAÇÕES
// ==========================================

// EXPORTAR CSV
window.exportarCSV = function() {
    console.log('📊 Exportando CSV...');
    
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        alert('❌ Não há dados para exportar!');
        return;
    }

    const colunasVisiveisArray = COLUNAS.filter(col => 
        colunasVisiveis[col.id] !== false && col.id !== 'acoes'
    );

    if (colunasVisiveisArray.length === 0) {
        alert('❌ Nenhuma coluna visível para exportar!');
        return;
    }

    const cabecalho = colunasVisiveisArray.map(col => col.nome);
    let csv = cabecalho.join(';') + '\n';

    dadosFiltrados.forEach(item => {
        const linha = colunasVisiveisArray.map(col => {
            let valor = item[col.id] || '';
            
            if (col.id === 'nivel' && valor) {
                const nivelMap = {
                    '1': 'COMUM',
                    '2': 'RELEVANTE',
                    '3': 'LÍDER'
                };
                valor = nivelMap[valor] || valor;
            }
            
            if (typeof valor === 'string' && (valor.includes(';') || valor.includes('"') || valor.includes('\n'))) {
                return '"' + valor.replace(/"/g, '""') + '"';
            }
            return valor;
        });
        csv += linha.join(';') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cadastros_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log('✅ CSV exportado com sucesso!');
};

// EXPORTAR EXCEL
window.exportarExcel = function() {
    console.log('📊 Exportando Excel...');
    
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        alert('❌ Não há dados para exportar!');
        return;
    }

    const colunasVisiveisArray = COLUNAS.filter(col => 
        colunasVisiveis[col.id] !== false && col.id !== 'acoes'
    );

    if (colunasVisiveisArray.length === 0) {
        alert('❌ Nenhuma coluna visível para exportar!');
        return;
    }

    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>Cadastros</x:Name>
                        <x:WorksheetOptions>
                            <x:DisplayGridlines/>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
            th { background-color: #00562e; color: #ffffff; font-weight: bold; padding: 6px 8px; border: 1px solid #00562e; text-align: left; }
            td { padding: 4px 8px; border: 1px solid #cccccc; }
            tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <h2 style="color: #00562e;">📋 LISTA DE CADASTROS - PV43</h2>
        <p>Total: ${dadosFiltrados.length} registros | Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <table>
            <thead>
                <tr>`;

    colunasVisiveisArray.forEach(col => {
        html += `<th>${col.nome}</th>`;
    });
    html += `</tr></thead><tbody>`;

    dadosFiltrados.forEach(item => {
        html += `<tr>`;
        colunasVisiveisArray.forEach(col => {
            let valor = item[col.id] || '';
            
            if (col.id === 'nivel' && valor) {
                const nivelMap = {
                    '1': 'COMUM',
                    '2': 'RELEVANTE',
                    '3': 'LÍDER'
                };
                valor = nivelMap[valor] || valor;
            }
            
            html += `<td>${valor}</td>`;
        });
        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
        <p style="color: #999; font-size: 10px; margin-top: 10px;">
            Relatório gerado pelo Sistema PV43 - Partido Verde
        </p>
    </body>
    </html>`;

    const blob = new Blob([html], { 
        type: 'application/vnd.ms-excel;charset=utf-8' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cadastros_' + new Date().toISOString().slice(0,10) + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log('✅ Excel exportado com sucesso!');
};

// EXPORTAR PDF
window.exportarPDF = function() {
    console.log('📄 Exportando PDF...');
    
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        alert('❌ Não há dados para exportar!');
        return;
    }

    const colunasVisiveisArray = COLUNAS.filter(col => 
        colunasVisiveis[col.id] !== false && col.id !== 'acoes'
    );

    if (colunasVisiveisArray.length === 0) {
        alert('❌ Nenhuma coluna visível para exportar!');
        return;
    }

    const janela = window.open('', '_blank', 'width=1200,height=800');
    if (!janela) {
        alert('❌ Por favor, permita pop-ups para exportar PDF.');
        return;
    }

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Lista de Cadastros - PV43</title>
        <style>
            @page { 
                size: landscape; 
                margin: 8mm;
            }
            body { 
                font-family: Arial, sans-serif; 
                font-size: 9px; 
                background: white;
                padding: 10px;
            }
            h1 { 
                text-align: center; 
                color: #00562e; 
                font-size: 14px; 
                margin-bottom: 3px; 
            }
            .info { 
                text-align: center; 
                color: #666; 
                font-size: 10px; 
                margin-bottom: 10px; 
            }
            .info span {
                display: inline-block;
                margin: 0 10px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 8px;
                page-break-inside: auto;
            }
            th { 
                background: #00562e; 
                color: white; 
                padding: 4px 6px; 
                border: 1px solid #00562e; 
                text-align: left;
                font-weight: bold;
            }
            td { 
                padding: 3px 6px; 
                border: 1px solid #ccc; 
                text-align: left;
            }
            tr:nth-child(even) { 
                background: #f5f5f5; 
            }
            .footer { 
                text-align: center; 
                font-size: 8px; 
                color: #999; 
                margin-top: 8px; 
                border-top: 1px solid #ddd; 
                padding-top: 6px; 
            }
            @media print {
                .no-print { display: none; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
            }
        </style>
    </head>
    <body>
        <h1>🌿 PARTIDO VERDE - MARACANAÚ</h1>
        <div class="info">
            📋 LISTA DE CADASTROS
            <span>Total: ${dadosFiltrados.length} registros</span>
            <span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span>
            <span>Colunas: ${colunasVisiveisArray.length}</span>
        </div>
        <table>
            <thead>
                <tr>`;

    colunasVisiveisArray.forEach(col => {
        html += `<th>${col.nome}</th>`;
    });
    html += `</tr></thead><tbody>`;

    dadosFiltrados.forEach(item => {
        html += `<tr>`;
        colunasVisiveisArray.forEach(col => {
            let valor = item[col.id] || '';
            
            if (col.id === 'nivel' && valor) {
                const nivelMap = {
                    '1': 'COMUM',
                    '2': 'RELEVANTE',
                    '3': 'LÍDER'
                };
                valor = nivelMap[valor] || valor;
            }
            
            if (typeof valor === 'string' && valor.length > 50) {
                valor = valor.substring(0, 47) + '...';
            }
            
            html += `<td>${valor}</td>`;
        });
        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
        <div class="footer">
            Relatório gerado pelo Sistema PV43 - Partido Verde
        </div>
        <div class="no-print" style="text-align:center; margin-top:15px;">
            <button onclick="window.print()" style="padding:8px 20px; background:#00562e; color:white; border:none; border-radius:4px; cursor:pointer;">
                🖨️ IMPRIMIR / SALVAR PDF
            </button>
            <button onclick="window.close()" style="padding:8px 20px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; margin-left:10px;">
                ❌ FECHAR
            </button>
        </div>
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 1000);
            };
        <\/script>
    </body>
    </html>`;

    janela.document.write(html);
    janela.document.close();
    
    console.log('✅ PDF exportado com sucesso!');
};

console.log('✅ Funções de exportação carregadas!');
console.log('📊 CSV disponível:', typeof window.exportarCSV);
console.log('📊 Excel disponível:', typeof window.exportarExcel);
console.log('📄 PDF disponível:', typeof window.exportarPDF);

// ==========================================
// CONTROLES DE COLUNAS
// ==========================================
function salvarPreferenciasColunas() {
    const preferencias = {};
    COLUNAS.forEach(col => {
        preferencias[col.id] = colunasVisiveis[col.id];
    });
    localStorage.setItem('pv43_colunas_visiveis', JSON.stringify(preferencias));
}

function carregarPreferenciasColunas() {
    const salvo = localStorage.getItem('pv43_colunas_visiveis');
    if (salvo) {
        try {
            const preferencias = JSON.parse(salvo);
            COLUNAS.forEach(col => {
                if (preferencias[col.id] !== undefined) {
                    colunasVisiveis[col.id] = preferencias[col.id];
                    col.visivel = preferencias[col.id];
                }
            });
        } catch (e) {
            console.log('Erro ao carregar preferências:', e);
        }
    }
}

function gerarControlesColunas() {
    const container = document.getElementById('grupoCheckboxes');
    if (!container) return;

    container.innerHTML = '';

    COLUNAS.forEach((col, index) => {
        if (col.id === 'acoes') return;

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = colunasVisiveis[col.id] !== false;
        checkbox.dataset.index = index;
        checkbox.dataset.colId = col.id;
        checkbox.addEventListener('change', function() {
            colunasVisiveis[col.id] = this.checked;
            salvarPreferenciasColunas();
            aplicarVisibilidadeColunas();
            if (this.checked) {
                label.classList.add('checked');
            } else {
                label.classList.remove('checked');
            }
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + col.nome));
        
        if (colunasVisiveis[col.id] !== false) {
            label.classList.add('checked');
        }
        
        container.appendChild(label);
    });
}

function resetarColunas() {
    COLUNAS.forEach(col => {
        colunasVisiveis[col.id] = col.visivel;
    });
    salvarPreferenciasColunas();
    
    const container = document.getElementById('grupoCheckboxes');
    if (container) {
        const labels = container.querySelectorAll('label');
        labels.forEach(label => {
            const checkbox = label.querySelector('input[type="checkbox"]');
            if (checkbox) {
                const colId = checkbox.dataset.colId;
                const col = COLUNAS.find(c => c.id === colId);
                if (col) {
                    checkbox.checked = col.visivel;
                    if (col.visivel) {
                        label.classList.add('checked');
                    } else {
                        label.classList.remove('checked');
                    }
                }
            }
        });
    }
    
    aplicarVisibilidadeColunas();
}

function aplicarVisibilidadeColunas() {
    const tabela = document.getElementById('tabela-lista');
    if (!tabela) return;

    const cabecalho = tabela.querySelector('thead tr');
    if (cabecalho) {
        const ths = cabecalho.querySelectorAll('th');
        ths.forEach((th, index) => {
            if (index < COLUNAS.length) {
                const colId = COLUNAS[index].id;
                th.style.display = colunasVisiveis[colId] !== false ? '' : 'none';
            }
        });
    }

    const linhas = tabela.querySelectorAll('tbody tr');
    linhas.forEach(linha => {
        const tds = linha.querySelectorAll('td');
        tds.forEach((td, index) => {
            if (index < COLUNAS.length) {
                const colId = COLUNAS[index].id;
                td.style.display = colunasVisiveis[colId] !== false ? '' : 'none';
            }
        });
    });
}

// ==========================================
// ATALHOS
// ==========================================
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const inputNome = document.getElementById('fNome');
        if (inputNome) { inputNome.focus(); inputNome.select(); }
    }
    
    if (e.key === 'Escape') {
        const inputAtivo = document.activeElement;
        if (inputAtivo && (inputAtivo.tagName === 'INPUT' || inputAtivo.tagName === 'SELECT')) {
            limparFiltros();
        }
    }
});

console.log('✅ lista.js carregado com sucesso!');
console.log('📡 API URL:', URL_API || '❌ NÃO CONFIGURADA');