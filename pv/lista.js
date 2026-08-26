// ==========================================
// LISTA.JS - CONTROLE DA PÁGINA DE LISTAGEM
// ==========================================

const URL_API = window.API_CONFIG ? window.API_CONFIG.BASE_URL : null;

if (!URL_API) {
    console.error('❌ API_CONFIG não encontrada!');
    alert('Erro de configuração: API não encontrada.');
}

let todosOsDados = [];
let dadosFiltrados = []; 
let colunasVisiveis = {};

// ==========================================
// DEFINIÇÃO DAS 21 COLUNAS (NOMES CORRETOS)
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
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const nomeUsuario = localStorage.getItem('pv43_nome_usuario');
    if (!nomeUsuario) {
        alert('⚠️ Acesso restrito! Redirecionando para a tela de login.');
        window.location.href = 'pv43.html';
        return;
    }
    
    const usuarioEl = document.getElementById('usuario-logado-texto');
    if (usuarioEl) {
        usuarioEl.innerText = `Logado como: ${nomeUsuario}`;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const dataInicio = document.getElementById('fDataInicio');
    const dataFim = document.getElementById('fDataFim');
    if (dataInicio) dataInicio.value = hoje;
    if (dataFim) dataFim.value = hoje;

    COLUNAS.forEach(col => {
        colunasVisiveis[col.id] = col.visivel;
    });

    carregarPreferenciasColunas();
    gerarControlesColunas();
    carregarDados();

    const camposFiltro = [
        'fNome', 'fBairro', 'fCidade', 'fCandidato', 
        'fZona', 'fSecao', 'fLocalVot', 'fNivel', 
        'fResponsavel', 'fAdmin', 'fDataInicio', 'fDataFim'
    ];

    camposFiltro.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', filtrarTabela);
            el.addEventListener('change', filtrarTabela);
        }
    });
});

// ==========================================
// SALVAR PREFERÊNCIAS
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

// ==========================================
// GERAR CHECKBOXES DAS 21 COLUNAS
// ==========================================
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

// ==========================================
// RESETAR COLUNAS
// ==========================================
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

// ==========================================
// APLICAR VISIBILIDADE
// ==========================================
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
// CARREGAR DADOS - USANDO GET
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

    var url = URL_API + '?acao=listarCadastros';
    console.log('🔍 Chamando:', url);

    fetch(url, {
        method: 'GET'
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
            todosOsDados = resposta.dados;
            dadosFiltrados = [...todosOsDados];
            
            document.getElementById('totalRegistros').innerText = todosOsDados.length;
            document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
            
            renderizarTabela();
        } else {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="30" style="text-align:center; padding:40px; color:#ef4444;">❌ ' + (resposta.mensagem || 'Erro ao carregar dados.') + '</td></tr>';
            }
        }
    })
    .catch(erro => {
        console.error('❌ Erro:', erro);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="30" style="text-align:center; padding:40px; color:#ef4444;">❌ Erro: ' + erro.message + '</td></tr>';
        }
    });
}

// ==========================================
// EXCLUIR REGISTRO - USANDO GET
// ==========================================
function excluirRegistro(id) {
    if (!id) { alert('❌ ID inválido!'); return; }
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

// ==========================================
// RENDERIZAR TABELA (MAPEAMENTO CORRIGIDO E ALINHADO)
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

    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + COLUNAS.length + '" style="text-align:center; padding:40px; color:#94a3b8;">📭 Nenhum registro encontrado.</td></tr>';
        document.getElementById('totalExibidos').innerText = '0';
        return;
    }

    let bodyHtml = '';
    dadosFiltrados.forEach((item, index) => {
        bodyHtml += '<tr>';
        
        COLUNAS.forEach(col => {
            let valor = '';
            const visivel = colunasVisiveis[col.id] !== false;
            
            // ==========================================
            // MAPEAMENTO EXATO COM OS NOMES DO BACK-END
            // ==========================================
            switch(col.id) {
                case 'id': valor = item.id || ''; break;
                case 'numero_cha': valor = item.numero_cha || ''; break; // Corrigido
                case 'numero_sec': valor = item.numero_sec || ''; break; // Corrigido
                case 'nome': valor = item.nome || ''; break;
                case 'data_nasc': valor = item.data_nasc || ''; break;
                case 'endereco': valor = item.endereco || ''; break;
                case 'n_casa': valor = item.n_casa || ''; break;
                case 'bairro': valor = item.bairro || ''; break;
                case 'cidade': valor = item.cidade || ''; break;
                case 'telefone': valor = item.telefone || ''; break;
                case 'candidato': valor = item.candidato || ''; break; // Corrigido
                case 'titulo': valor = item.titulo || ''; break;
                case 'zona': valor = item.zona || ''; break;
                case 'secao': valor = item.secao || ''; break;
                case 'nome_mae': valor = item.nome_mae || ''; break;
                case 'local_vot': valor = item.local_vot || ''; break;
                case 'bairro_vot': valor = item.bairro_vot || ''; break;
                case 'endereco_vot': valor = item.endereco_vot || ''; break;
                case 'obs': valor = item.obs || ''; break;
                case 'data': valor = item.data || ''; break; // Corrigido
                case 'nivel': valor = item.nivel || ''; break;
                case 'acoes': 
                    const id = item.id || '';
                    valor = `
                        <div style="display: flex; gap: 3px; flex-wrap: wrap;">
                            <button class="btn-editar" onclick="editarRegistro('${id}')" title="Editar">✏️</button>
                            <button class="btn-excluir" onclick="excluirRegistro('${id}')" title="Excluir">🗑️</button>
                            <button class="btn-visualizar" onclick="visualizarRegistro('${id}')" title="Visualizar">👁️</button>
                        </div>
                    `;
                    break;
                default: valor = '';
            }

            // Formatação especial
            if (col.id === 'numero_cha' && valor) {
                valor = `<span class="badge-admin badge-admin-sim">✅ ${valor}</span>`;
            }

            if (col.id === 'nivel' && valor) {
                const nivelMap = {
                    '1': '<span class="badge-nivel badge-nivel-1">COMUM</span>',
                    '2': '<span class="badge-nivel badge-nivel-2">RELEVANTE</span>',
                    '3': '<span class="badge-nivel badge-nivel-3">LÍDER</span>'
                };
                valor = nivelMap[valor] || valor;
            }

            if (col.id === 'candidato' && valor) {
                if (typeof valor === 'string' && valor.includes(',')) {
                    const cands = valor.split(',').map(c => c.trim());
                    valor = cands.map(c => `<span class="badge-candidato">${c}</span>`).join(' ');
                }
            }

            if (typeof valor === 'string' && valor.length > 50 && col.id !== 'acoes' && col.id !== 'nivel' && col.id !== 'numero_cha') {
                valor = valor.substring(0, 47) + '...';
            }

            bodyHtml += `<td style="display: ${visivel ? '' : 'none'};">${valor}</td>`;
        });

        bodyHtml += '</tr>';
    });

    tbody.innerHTML = bodyHtml;
    document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
}

// ==========================================
// FILTRAR TABELA
// ==========================================
function filtrarTabela() {
    const fNome = document.getElementById('fNome')?.value?.trim()?.toUpperCase() || '';
    const fBairro = document.getElementById('fBairro')?.value?.trim()?.toUpperCase() || '';
    const fCidade = document.getElementById('fCidade')?.value?.trim()?.toUpperCase() || '';
    const fCandidato = document.getElementById('fCandidato')?.value || '';
    const fZona = document.getElementById('fZona')?.value?.trim() || '';
    const fSecao = document.getElementById('fSecao')?.value?.trim() || '';
    const fLocalVot = document.getElementById('fLocalVot')?.value?.trim()?.toUpperCase() || '';
    const fNivel = document.getElementById('fNivel')?.value || '';
    const fResponsavel = document.getElementById('fResponsavel')?.value?.trim()?.toUpperCase() || '';
    const fAdmin = document.getElementById('fAdmin')?.value || '';
    const fDataInicio = document.getElementById('fDataInicio')?.value || '';
    const fDataFim = document.getElementById('fDataFim')?.value || '';

    dadosFiltrados = todosOsDados.filter(item => {
        if (fNome && !(item.nome || '').toUpperCase().includes(fNome)) return false;
        if (fBairro && !(item.bairro || '').toUpperCase().includes(fBairro)) return false;
        if (fCidade && !(item.cidade || '').toUpperCase().includes(fCidade)) return false;
        if (fCandidato) {
            const candidatos = item.candidato || '';
            if (!candidatos.toUpperCase().includes(fCandidato.toUpperCase())) return false;
        }
        if (fZona && (item.zona || '') !== fZona) return false;
        if (fSecao && (item.secao || '') !== fSecao) return false;
        if (fLocalVot && !(item.local_vot || '').toUpperCase().includes(fLocalVot)) return false;
        if (fNivel && item.nivel != fNivel) return false;
        if (fResponsavel && !(item.numero_sec || '').toUpperCase().includes(fResponsavel)) return false;
        if (fAdmin) {
            const adminVal = item.numero_cha || '';
            if (fAdmin === 'Administrador' && adminVal !== 'Administrador') return false;
            if (fAdmin === 'Operador' && adminVal !== 'Operador') return false;
            if (fAdmin !== 'Administrador' && fAdmin !== 'Operador') {
                if (!adminVal.toUpperCase().includes(fAdmin.toUpperCase())) return false;
            }
        }
        if (fDataInicio || fDataFim) {
            const dataCadastro = item.data || '';
            let dataComparar = '';
            if (dataCadastro.includes('/')) {
                const partes = dataCadastro.split('/');
                if (partes.length === 3) {
                    dataComparar = partes[2] + '-' + partes[1].padStart(2, '0') + '-' + partes[0].padStart(2, '0');
                }
            }
            if (!dataComparar) dataComparar = dataCadastro;

            if (fDataInicio && dataComparar < fDataInicio) return false;
            if (fDataFim && dataComparar > fDataFim) return false;
        }
        return true;
    });

    renderizarTabela();
}

// ==========================================
// LIMPAR FILTROS
// ==========================================
function limparFiltros() {
    const campos = [
        'fNome', 'fBairro', 'fCidade', 'fCandidato', 
        'fZona', 'fSecao', 'fLocalVot', 'fNivel', 
        'fResponsavel', 'fAdmin'
    ];
    
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
        }
    });
    
    const hoje = new Date().toISOString().split('T')[0];
    const dataInicio = document.getElementById('fDataInicio');
    const dataFim = document.getElementById('fDataFim');
    if (dataInicio) dataInicio.value = hoje;
    if (dataFim) dataFim.value = hoje;
    
    dadosFiltrados = [...todosOsDados];
    renderizarTabela();
}

// ==========================================
// AÇÕES
// ==========================================
function editarRegistro(id) {
    if (!id) { alert('❌ ID inválido!'); return; }
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

// ==========================================
// EXPORTAÇÃO
// ==========================================
function exportarCSV() {
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        alert('❌ Não há dados para exportar!');
        return;
    }

    const cabecalho = COLUNAS.filter(col => col.id !== 'acoes').map(col => col.nome);
    let csv = cabecalho.join(';') + '\n';

    dadosFiltrados.forEach(item => {
        const linha = COLUNAS.filter(col => col.id !== 'acoes').map(col => {
            let valor = item[col.id] || '';
            if (typeof valor === 'string' && (valor.includes(';') || valor.includes('"'))) {
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
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportarExcel() {
    exportarCSV();
}

function exportarPDF() {
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        alert('❌ Não há dados para exportar!');
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
            @page { size: landscape; margin: 8mm; }
            body { font-family: Arial, sans-serif; font-size: 9px; background: white; }
            h1 { text-align: center; color: #00562e; font-size: 14px; margin-bottom: 3px; }
            .info { text-align: center; color: #666; font-size: 10px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 8px; }
            th { background: #00562e; color: white; padding: 4px 3px; border: 1px solid #00562e; text-align: left; }
            td { padding: 3px; border: 1px solid #ccc; text-align: left; }
            tr:nth-child(even) { background: #f5f5f5; }
            .badge-nivel { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 7px; font-weight: bold; }
            .badge-nivel-1 { background: #d4edda; color: #155724; }
            .badge-nivel-2 { background: #cce5ff; color: #004085; }
            .badge-nivel-3 { background: #d6d8db; color: #1b1e21; }
            .footer { text-align: center; font-size: 8px; color: #999; margin-top: 8px; border-top: 1px solid #ddd; padding-top: 6px; }
        </style>
    </head>
    <body>
        <h1>🌿 PARTIDO VERDE - MARACANAÚ</h1>
        <div class="info">📋 LISTA DE CADASTROS - Total: ${dadosFiltrados.length} registros<br>Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
        <table><thead><tr>`;

    COLUNAS.forEach(col => {
        if (colunasVisiveis[col.id] !== false && col.id !== 'acoes') {
            html += `<th>${col.nome}</th>`;
        }
    });
    html += `</tr></thead><tbody>`;

    dadosFiltrados.forEach(item => {
        html += `<tr>`;
        COLUNAS.forEach(col => {
            if (colunasVisiveis[col.id] !== false && col.id !== 'acoes') {
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
            }
        });
        html += `</tr>`;
    });

    html += `
            </tbody></table>
            <div class="footer">Relatório gerado pelo Sistema PV43 - Partido Verde</div>
        </body>
        </html>`;

    janela.document.write(html);
    janela.document.close();
    
    setTimeout(function() {
        janela.print();
        janela.onafterprint = function() { janela.close(); };
    }, 500);
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
