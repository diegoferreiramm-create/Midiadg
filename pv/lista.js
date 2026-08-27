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
    
    // Se já estiver no formato YYYY-MM-DD (input date)
    if (dataStr.includes('-')) {
        return new Date(dataStr + 'T00:00:00').getTime();
    }
    
    // Se estiver no formato DD/MM/AAAA
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
// FUNÇÃO DE FILTRO - COM DATA CORRIGIDA
// ==========================================
window.filtrarTabela = function() {
    console.log('🔍 FILTRO EXECUTADO!');
    
    if (!todosOsDados || todosOsDados.length === 0) {
        console.warn('⏳ Sem dados para filtrar');
        return;
    }

    // PEGA OS VALORES DOS FILTROS
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

    // VERIFICA SE TEM ALGUM FILTRO PREENCHIDO
    const temFiltro = fNome !== '' || fBairro !== '' || fCidade !== '' || 
                     fCandidato !== '' || fZona !== '' || fSecao !== '' || 
                     fLocalVot !== '' || fNivel !== '' || fResponsavel !== '' || 
                     fAdmin !== '' || fDataInicio !== '' || fDataFim !== '';

    // SE NÃO TEM FILTRO, RESTAURA A LISTA COMPLETA
    if (!temFiltro) {
        dadosFiltrados = [...todosOsDados];
        console.log('🔄 Nenhum filtro - Lista completa:', dadosFiltrados.length);
        renderizarTabela();
        document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
        return;
    }

    // APLICA OS FILTROS
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
        
        // DATA - CONVERTER PARA TIMESTAMP PARA COMPARAÇÃO
        const dataCadastro = item.data || '';
        const dataTimestamp = converterDataParaTimestamp(dataCadastro);
        const dataInicioTimestamp = fDataInicio ? new Date(fDataInicio + 'T00:00:00').getTime() : null;
        const dataFimTimestamp = fDataFim ? new Date(fDataFim + 'T00:00:00').getTime() : null;

        // APLICA OS FILTROS
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
        
        // FILTRO DE DATA - COMPARANDO TIMESTAMPS
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
// CARREGAR DADOS
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
// RENDERIZAR TABELA
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
    dadosFiltrados.forEach((item) => {
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
                case 'candidato': valor = item.candidato || ''; break;
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

            bodyHtml += `<td style="display: ${visivel ? '' : 'none'};">${valor}</td>`;
        });

        bodyHtml += '</tr>';
    });

    tbody.innerHTML = bodyHtml;
    document.getElementById('totalExibidos').innerText = dadosFiltrados.length;
}

// ==========================================
// FUNÇÕES DE AÇÃO
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
// EXPORTAÇÃO
// ==========================================
// ==========================================
// EXPORTAÇÕES - VERSÃO CORRIGIDA
// ==========================================

// EXPORTAR CSV
window.exportarCSV = function() {
    console.log('📊 Exportando CSV...');
    
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        alert('❌ Não há dados para exportar!');
        return;
    }

    // VERIFICA SE colunasVisiveis EXISTE
    if (typeof colunasVisiveis === 'undefined') {
        alert('❌ Erro: colunasVisiveis não definido!');
        return;
    }

    // Pega apenas as colunas visíveis (excluindo AÇÕES)
    const colunasVisiveisArray = COLUNAS.filter(col => 
        colunasVisiveis[col.id] !== false && col.id !== 'acoes'
    );

    if (colunasVisiveisArray.length === 0) {
        alert('❌ Nenhuma coluna visível para exportar!');
        return;
    }

    // Cabeçalho
    const cabecalho = colunasVisiveisArray.map(col => col.nome);
    let csv = cabecalho.join(';') + '\n';

    // Dados
    dadosFiltrados.forEach(item => {
        const linha = colunasVisiveisArray.map(col => {
            let valor = item[col.id] || '';
            
            // Formatação especial para nível
            if (col.id === 'nivel' && valor) {
                const nivelMap = {
                    '1': 'COMUM',
                    '2': 'RELEVANTE',
                    '3': 'LÍDER'
                };
                valor = nivelMap[valor] || valor;
            }
            
            // Escape para CSV
            if (typeof valor === 'string' && (valor.includes(';') || valor.includes('"') || valor.includes('\n'))) {
                return '"' + valor.replace(/"/g, '""') + '"';
            }
            return valor;
        });
        csv += linha.join(';') + '\n';
    });

    // BOM para UTF-8
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

    // VERIFICA SE colunasVisiveis EXISTE
    if (typeof colunasVisiveis === 'undefined') {
        alert('❌ Erro: colunasVisiveis não definido!');
        return;
    }

    // Pega apenas as colunas visíveis (excluindo AÇÕES)
    const colunasVisiveisArray = COLUNAS.filter(col => 
        colunasVisiveis[col.id] !== false && col.id !== 'acoes'
    );

    if (colunasVisiveisArray.length === 0) {
        alert('❌ Nenhuma coluna visível para exportar!');
        return;
    }

    // Cria o HTML para Excel
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

    // Cabeçalho
    colunasVisiveisArray.forEach(col => {
        html += `<th>${col.nome}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Dados
    dadosFiltrados.forEach(item => {
        html += `<tr>`;
        colunasVisiveisArray.forEach(col => {
            let valor = item[col.id] || '';
            
            // Formatação especial para nível
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

    // Cria o blob com o tipo correto para Excel
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

    // VERIFICA SE colunasVisiveis EXISTE
    if (typeof colunasVisiveis === 'undefined') {
        alert('❌ Erro: colunasVisiveis não definido!');
        return;
    }

    // Pega apenas as colunas visíveis (excluindo AÇÕES)
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

    // Cabeçalho com as colunas visíveis
    colunasVisiveisArray.forEach(col => {
        html += `<th>${col.nome}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Dados
    dadosFiltrados.forEach(item => {
        html += `<tr>`;
        colunasVisiveisArray.forEach(col => {
            let valor = item[col.id] || '';
            
            // Formatação especial para nível
            if (col.id === 'nivel' && valor) {
                const nivelMap = {
                    '1': 'COMUM',
                    '2': 'RELEVANTE',
                    '3': 'LÍDER'
                };
                valor = nivelMap[valor] || valor;
            }
            
            // Trunca textos longos
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
