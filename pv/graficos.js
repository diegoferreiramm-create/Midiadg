// ============================================================
// GRAFICOS.JS - CONTROLE DO DASHBOARD E GRÁFICOS
// ============================================================

const URL_API = window.API_CONFIG ? window.API_CONFIG.BASE_URL : null;

if (!URL_API) {
    console.error('❌ API_CONFIG não encontrada!');
    alert('Erro de configuração: API não encontrada.');
}

let todosOsDados = [];
let dadosFiltrados = [];
let usuarioAtual = null;
let isAdmin = false;
let usuarioNome = '';
let graficosInstancias = {};

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
// INICIALIZAÇÃO DO DASHBOARD
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const nomeUsuario = localStorage.getItem('pv43_nome_usuario');
    
    if (!nomeUsuario) {
        alert('⚠️ Acesso restrito! Redirecionando para a tela de login.');
        window.location.href = 'pv43.html';
        return;
    }
    
    usuarioNome = nomeUsuario;
    usuarioAtual = usuarioNome;

    console.log('👤 Usuário logado no Dashboard:', usuarioNome);

    carregarDadosDashboard();

    // Eventos dos Filtros Globais do Dashboard
    const camposFiltro = [
        'fNome', 'fBairro', 'fCidade', 'fCandidato', 
        'fZona', 'fSecao', 'fLocalVot', 'fNivel', 
        'fResponsavel', 'fAdmin', 'fDataInicio', 'fDataFim'
    ];

    camposFiltro.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', filtrarDashboard);
            el.addEventListener('change', filtrarDashboard);
        }
    });
});

// ==========================================
// CARREGAR DADOS COM HIERARQUIA DE PERMISSÃO
// ==========================================
function carregarDadosDashboard() {
    if (!URL_API) {
        console.error('❌ API não configurada.');
        return;
    }

    buscarDadosUsuario(usuarioNome)
        .then(dadosUsuario => {
            const tipo = dadosUsuario.tipo || 'operador';
            isAdmin = tipo.toLowerCase() === 'admin';
            const nomeUsuarioReg = dadosUsuario.nome || usuarioNome;
            
            const usuarioEl = document.getElementById('usuario-logado-texto');
            if (usuarioEl) {
                const tipoUsuario = isAdmin ? '🔑 ADMIN' : '👤 OPERADOR';
                usuarioEl.innerText = `Logado como: ${nomeUsuarioReg} (${tipoUsuario})`;
            }

            var url = URL_API + '?acao=listarCadastros';
            return fetch(url, { method: 'GET' });
        })
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(resposta => {
            if (resposta.sucesso && resposta.dados) {
                let dados = resposta.dados;
                
                if (!isAdmin) {
                    return buscarDadosUsuario(usuarioNome).then(dadosUsuario => {
                        const nomeResp = dadosUsuario.nome || usuarioNome;
                        return dados.filter(item => {
                            const respReg = String(item.numero_sec || item.responsavel || '').toUpperCase();
                            return respReg === String(nomeResp).toUpperCase();
                        });
                    });
                }
                return dados;
            } else {
                throw new Error(resposta.mensagem || 'Erro ao carregar dados');
            }
        })
        .then(dadosFinais => {
            todosOsDados = dadosFinais;
            dadosFiltrados = [...todosOsDados];
            
            popularFiltrosSelects();
            atualizarDashboard();
        })
        .catch(erro => {
            console.error('❌ Erro no carregamento do dashboard:', erro);
        });
}

// ==========================================
// POPULAR SELECTS DE FILTROS AUTOMATICAMENTE
// ==========================================
function popularFiltrosSelects() {
    const preencherSelect = (idElemento, campo) => {
        const select = document.getElementById(idElemento);
        if (!select) return;
        
        const valorAtual = select.value;
        const valoresUnicos = [...new Set(todosOsDados.map(item => item[campo]))].filter(Boolean).sort();
        
        select.innerHTML = `<option value="">Todos os ${idElemento.replace('f', '')}</option>`;
        valoresUnicos.forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            select.appendChild(opt);
        });
        select.value = valorAtual;
    };

    preencherSelect('fBairro', 'bairro');
    preencherSelect('fCidade', 'cidade');
    
    // Tratamento especial para o Candidato (caso venha separado por vírgula na mesma célula)
    const selectCand = document.getElementById('fCandidato');
    if (selectCand) {
        const valorAtualCand = selectCand.value;
        const candidatosSet = new Set();
        todosOsDados.forEach(item => {
            if (item.candidato) {
                item.candidato.split(',').forEach(parte => {
                    const limpo = parte.trim();
                    if (limpo) candidatosSet.add(limpo);
                });
            }
        });
        selectCand.innerHTML = '<option value="">Todos os Candidato</option>';
        [...candidatosSet].sort().forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            selectCand.appendChild(opt);
        });
        selectCand.value = valorAtualCand;
    }

    preencherSelect('fZona', 'zona');
    preencherSelect('fNivel', 'nivel');
    
    // CORRIGIDO: Responsável agora puxa a Coluna C (numero_sec)
    preencherSelect('fResponsavel', 'numero_sec');
    
    // CORRIGIDO: Administrador agora puxa a Coluna B (vamos usar a chave correspondente da coluna B, ex: numero_cha ou admin)
    // Se o seu script do Apps Script mapeia a coluna B como 'numero_cha' ou 'admin', ajuste aqui:
    preencherSelect('fAdmin', 'numero_cha'); 
}

// ==========================================
// FILTRAGEM DOS DADOS DO DASHBOARD
// ==========================================
function filtrarDashboard() {
    const fNome = document.getElementById('fNome')?.value?.trim().toUpperCase() || '';
    const fBairro = document.getElementById('fBairro')?.value?.trim().toUpperCase() || '';
    const fCidade = document.getElementById('fCidade')?.value?.trim().toUpperCase() || '';
    const fCandidato = document.getElementById('fCandidato')?.value?.trim().toUpperCase() || '';
    const fZona = document.getElementById('fZona')?.value?.trim() || '';
    const fSecao = document.getElementById('fSecao')?.value?.trim() || '';
    const fLocalVot = document.getElementById('fLocalVot')?.value?.trim().toUpperCase() || '';
    const fNivel = document.getElementById('fNivel')?.value?.trim() || '';
    
    // Valores dos filtros corrigidos
    const fResponsavel = document.getElementById('fResponsavel')?.value?.trim() || '';
    const fAdmin = document.getElementById('fAdmin')?.value?.trim() || '';
    
    const fDataInicio = document.getElementById('fDataInicio')?.value || '';
    const fDataFim = document.getElementById('fDataFim')?.value || '';

    dadosFiltrados = todosOsDados.filter(item => {
        if (fNome && !String(item.nome || '').toUpperCase().includes(fNome)) return false;
        if (fBairro && !String(item.bairro || '').toUpperCase().includes(fBairro)) return false;
        if (fCidade && !String(item.cidade || '').toUpperCase().includes(fCidade)) return false;
        
        if (fCandidato) {
            const candItem = String(item.candidato || '').toUpperCase();
            if (!candItem.includes(fCandidato)) return false;
        }

        if (fZona && String(item.zona || '') !== fZona) return false;
        if (fSecao && !String(item.secao || '').includes(fSecao)) return false;
        if (fLocalVot && !String(item.local_vot || '').toUpperCase().includes(fLocalVot)) return false;
        if (fNivel && String(item.nivel || '') !== fNivel) return false;
        
        // CORRIGIDO: Responsável valida estritamente a Coluna C (numero_sec)
        if (fResponsavel && String(item.numero_sec || '').trim() !== fResponsavel) return false;
        
        // CORRIGIDO: Administrador valida estritamente a Coluna B (numero_cha)
        if (fAdmin && String(item.numero_cha || '').trim() !== fAdmin) return false;

        if (fDataInicio || fDataFim) {
            const dataItem = converterDataParaTimestamp(item.data);
            if (dataItem) {
                if (fDataInicio && dataItem < new Date(fDataInicio + 'T00:00:00').getTime()) return false;
                if (fDataFim && dataItem > new Date(fDataFim + 'T00:00:00').getTime()) return false;
            }
        }
        return true;
    });

    atualizarDashboard();
}

function limparFiltrosDashboard() {
    const ids = ['fNome', 'fBairro', 'fCidade', 'fCandidato', 'fZona', 'fSecao', 'fLocalVot', 'fNivel', 'fResponsavel', 'fAdmin', 'fDataInicio', 'fDataFim'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    dadosFiltrados = [...todosOsDados];
    atualizarDashboard();
}

function converterDataParaTimestamp(dataStr) {
    if (!dataStr) return null;
    if (dataStr.includes('-')) return new Date(dataStr + 'T00:00:00').getTime();
    if (dataStr.includes('/')) {
        const p = dataStr.split('/');
        if (p.length === 3) return new Date(p[2], p[1] - 1, p[0]).getTime();
    }
    return null;
}

// ==========================================
// ATUALIZAÇÃO DOS GRÁFICOS E INDICADORES
// ==========================================
function atualizarDashboard() {
    atualizarKPIs();
    criarGraficoCandidatos();
    criarGraficoBairros();
    criarGraficoNivel();
    criarGraficoEvolucaoTempo();
}

function atualizarKPIs() {
    const totalEl = document.getElementById('kpiTotalCadastros');
    const lideresEl = document.getElementById('kpiTotalLideres');
    const bairrosEl = document.getElementById('kpiTotalBairros');

    if (totalEl) totalEl.innerText = dadosFiltrados.length;
    if (lideresEl) lideresEl.innerText = dadosFiltrados.filter(i => String(i.nivel) === '3').length;
    if (bairrosEl) bairrosEl.innerText = new Set(dadosFiltrados.map(i => i.bairro)).size;
}

function destruirGraficoSeExistir(idCanvas) {
    if (graficosInstancias[idCanvas]) {
        graficosInstancias[idCanvas].destroy();
        delete graficosInstancias[idCanvas];
    }
}

// 1. Gráfico de Candidatos (Rosca / Doughnut)
function criarGraficoCandidatos() {
    const ctx = document.getElementById('graficoCandidatos')?.getContext('2d');
    if (!ctx) return;

    const contagem = {};
    dadosFiltrados.forEach(item => {
        const cand = item.candidato || 'Não informado';
        contagem[cand] = (contagem[cand] || 0) + 1;
    });

    destruirGraficoSeExistir('graficoCandidatos');

    graficosInstancias['graficoCandidatos'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(contagem),
            datasets: [{
                data: Object.values(contagem),
                backgroundColor: ['#00562e', '#28a745', '#ffc107', '#17a2b8', '#6c757d', '#fd7e14']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 2. Gráfico de Bairros (Barras)
function criarGraficoBairros() {
    const ctx = document.getElementById('graficoBairros')?.getContext('2d');
    if (!ctx) return;

    const contagem = {};
    dadosFiltrados.forEach(item => {
        const bairro = item.bairro || 'Outros';
        contagem[bairro] = (contagem[bairro] || 0) + 1;
    });

    // Ordenar e pegar os top 10
    const ordenados = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 10);

    destruirGraficoSeExistir('graficoBairros');

    graficosInstancias['graficoBairros'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ordenados.map(item => item[0]),
            datasets: [{
                label: 'Eleitores por Bairro',
                data: ordenados.map(item => item[1]),
                backgroundColor: '#00562e'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 3. Gráfico de Níveis de Engajamento (Pizza)
function criarGraficoNivel() {
    const ctx = document.getElementById('graficoNivel')?.getContext('2d');
    if (!ctx) return;

    const mapaNivel = { '1': 'Comum', '2': 'Relevante', '3': 'Líder' };
    const contagem = { 'Comum': 0, 'Relevante': 0, 'Líder': 0 };

    dadosFiltrados.forEach(item => {
        const texto = mapaNivel[String(item.nivel)] || 'Outros';
        contagem[texto] = (contagem[texto] || 0) + 1;
    });

    destruirGraficoSeExistir('graficoNivel');

    graficosInstancias['graficoNivel'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(contagem),
            datasets: [{
                data: Object.values(contagem),
                backgroundColor: ['#6c757d', '#ffc107', '#00562e']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 4. Gráfico de Evolução por Tempo / Data Cadastro (Linha)
function criarGraficoEvolucaoTempo() {
    const ctx = document.getElementById('graficoEvolucao')?.getContext('2d');
    if (!ctx) return;

    const contagem = {};
    dadosFiltrados.forEach(item => {
        const data = item.data ? item.data.split('T')[0] : 'Desconhecida';
        contagem[data] = (contagem[data] || 0) + 1;
    });

    const datasOrdenadas = Object.keys(contagem).sort();

    destruirGraficoSeExistir('graficoEvolucao');

    graficosInstancias['graficoEvolucao'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datasOrdenadas,
            datasets: [{
                label: 'Cadastros por Dia',
                data: datasOrdenadas.map(d => contagem[d]),
                borderColor: '#00562e',
                backgroundColor: 'rgba(0, 86, 46, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
