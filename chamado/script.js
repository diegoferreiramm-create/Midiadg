const URL_API = "https://script.google.com/macros/s/AKfycbzQI7wvnKmZyn01mK89WsDooyM9mH9NtmmMXJMhlKVihQnX81antMM1wNWwUtO8nYX5/exec";
let usuarioLogado = null;
let usuarioStatus = "user"; // <-- ADICIONE ESTA LINHA
let listaUsuariosCache = [];
let ordemSelecionadaMembros = []; 
let cacheChamadosGlobal = [];

document.addEventListener("DOMContentLoaded", () => {
    carregarChamados();
    carregarUsuariosParaMembros();

    // 🔄 ATUALIZAÇÃO DINÂMICA EM TEMPO REAL (A cada 5 segundos)
    setInterval(() => {
        const modalDetalhesAberto = document.getElementById("modal-detalhes").style.display === "flex";
        const modalCriarAberto = document.getElementById("modal-criar").style.display === "flex";

        if (!modalDetalhesAberto && !modalCriarAberto) {
            carregarChamadosSilencioso();
        }
    }, 5000);
});

function carregarChamadosSilencioso() {
    fetch(URL_API + "?acao=listar")
        .then(r => r.json())
        .then(data => {
            let novosDados = data.dados || [];
            if (JSON.stringify(novosDados) !== JSON.stringify(cacheChamadosGlobal)) {
                cacheChamadosGlobal = novosDados;
                renderizarQuadro(cacheChamadosGlobal);
            }
        })
        .catch(error => console.error("Erro na atualização silenciosa:", error));
}

function carregarChamados() {
    fetch(URL_API + "?acao=listar")
        .then(r => r.json())
        .then(data => {
            cacheChamadosGlobal = data.dados || [];
            renderizarQuadro(cacheChamadosGlobal);
        })
        .catch(error => console.error("Erro ao carregar:", error));
}

function carregarUsuariosParaMembros() {
    fetch(URL_API + "?acao=usuarios")
        .then(r => r.json())
        .then(data => {
            listaUsuariosCache = data.usuarios || [];
            montarCheckboxesMembros(listaUsuariosCache);
        })
        .catch(err => console.error("Erro ao carregar usuários:", err));
}

function montarCheckboxesMembros(usuarios) {
    const container = document.getElementById("lista-membros-checkboxes");
    if (!usuarios.length) {
        container.innerHTML = `<span style="font-size:12px; color:var(--text-muted);">Nenhum usuário encontrado na aba.</span>`;
        return;
    }
    
    ordemSelecionadaMembros = [];
    let html = "";
    usuarios.forEach((nome) => {
        html += `
            <div class="checkbox-item" onclick="clicarMembroItem(this, '${nome}')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="membroCheck" value="${nome}" onclick="event.stopPropagation(); processarCliqueCheckbox(this, '${nome}')">
                    <span>${nome}</span>
                </div>
                <span class="ordem-tag"></span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function clicarMembroItem(elementoDiv, nome) {
    const checkbox = elementoDiv.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    processarCliqueCheckbox(checkbox, nome);
}

function processarCliqueCheckbox(checkbox, nome) {
    if (checkbox.checked) {
        if (!ordemSelecionadaMembros.includes(nome)) ordemSelecionadaMembros.push(nome);
    } else {
        ordemSelecionadaMembros = ordemSelecionadaMembros.filter(item => item !== nome);
    }
    atualizarTagsOrdemVisual();
}

function atualizarTagsOrdemVisual() {
    const itens = document.querySelectorAll('.checkbox-item');
    itens.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const tag = item.querySelector('.ordem-tag');
        const nomeVal = checkbox.value;
        
        if (checkbox.checked) {
            let index = ordemSelecionadaMembros.indexOf(nomeVal);
            if (index !== -1) {
                tag.innerText = (index + 1) + "º";
                tag.style.display = "inline-block";
            }
        } else {
            tag.innerText = "";
            tag.style.display = "none";
        }
    });
}

function toggleMarcarTodos(masterCheckbox) {
    const checkboxes = document.querySelectorAll('input[name="membroCheck"]');
    ordemSelecionadaMembros = [];
    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
        if (cb.checked) ordemSelecionadaMembros.push(cb.value);
    });
    atualizarTagsOrdemVisual();
}

function parseDataBr(stringData) {
    if (!stringData) return null;
    try {
        // Tenta diferentes formatos
        let data = null;
        
        // Formato: "dd/mm/yyyy, HH:MM:SS" ou "dd/mm/yyyy HH:MM:SS"
        let partes = stringData.split(/[, ]+/);
        if (partes.length >= 1) {
            let dataPartes = partes[0].split("/");
            if (dataPartes.length === 3) {
                let horaPartes = partes[1] ? partes[1].split(":") : [0, 0, 0];
                data = new Date(
                    parseInt(dataPartes[2]), 
                    parseInt(dataPartes[1]) - 1, 
                    parseInt(dataPartes[0]), 
                    parseInt(horaPartes[0]) || 0, 
                    parseInt(horaPartes[1]) || 0, 
                    parseInt(horaPartes[2]) || 0
                );
            }
        }
        
        // Se falhou, tenta criar diretamente
        if (!data || isNaN(data.getTime())) {
            data = new Date(stringData);
        }
        
        return data;
    } catch (e) {
        return null;
    }
}

// Função auxiliar para verificar se o usuário está envolvido
function isUsuarioEnvolvido(chamado, usuarioLower) {
    const solicitanteLower = (chamado.solicitante || "").toLowerCase();
    const membrosList = (chamado.membros || "").split(",").map(m => m.trim().toLowerCase());
    
    return solicitanteLower === usuarioLower || membrosList.includes(usuarioLower);
}

// Função auxiliar para ordenar por data (mais recente primeiro)
function ordenarPorData(a, b) {
    const dataA = a.dataAbertura ? new Date(a.dataAbertura) : new Date(0);
    const dataB = b.dataAbertura ? new Date(b.dataAbertura) : new Date(0);
    return dataB - dataA;
}

// Função para atualizar estatísticas dos filtros
function atualizarStatsFiltros(total, filtrados) {
    const statsDiv = document.getElementById("filtros-stats");
    if (!statsDiv) return;

    const totalAbertos = filtrados.filter(c => c.status === "aberto").length;
    const totalPercurso = filtrados.filter(c => c.status === "percurso").length;
    const totalConcluidos = filtrados.filter(c => c.status === "concluido").length;

    let statsText = `Mostrando <strong>${filtrados.length}</strong> de <strong>${total.length}</strong> chamados`;
    
    if (filtrados.length > 0) {
        statsText += ` (${totalAbertos} abertos, ${totalPercurso} em percurso, ${totalConcluidos} concluídos)`;
    }

    statsDiv.innerHTML = statsText;
}

// Função para aplicar filtros
function aplicarFiltros() {
    if (cacheChamadosGlobal.length > 0) {
        renderizarQuadro(cacheChamadosGlobal);
    }
}

// Função para limpar filtros
function limparFiltros() {
    document.getElementById("filtro-usuario").value = "todos";
    document.getElementById("filtro-status").value = "todos";
    document.getElementById("filtro-prioridade").value = "todos";
    document.getElementById("filtro-busca").value = "";
    aplicarFiltros();
}

function renderizarQuadro(chamados) {
    const colAberto = document.getElementById("coluna-aberto");
    const colPercurso = document.getElementById("coluna-percurso");
    const colConcluido = document.getElementById("coluna-concluido");

    // Limpar colunas
    colAberto.innerHTML = "";
    if(colPercurso) colPercurso.innerHTML = "";
    if(colConcluido) colConcluido.innerHTML = "";

    // Aplicar filtros
    const filtroUsuario = document.getElementById("filtro-usuario")?.value || "todos";
    const filtroStatus = document.getElementById("filtro-status")?.value || "todos";
    const filtroPrioridade = document.getElementById("filtro-prioridade")?.value || "todos";
    const filtroBusca = document.getElementById("filtro-busca")?.value?.toLowerCase() || "";

    // Filtrar chamados
    let chamadosFiltrados = chamados.filter(c => {
        if (filtroUsuario === "meus" && usuarioLogado) {
            const usuarioLower = usuarioLogado.toLowerCase();
            const solicitanteLower = (c.solicitante || "").toLowerCase();
            const membrosList = (c.membros || "").split(",").map(m => m.trim().toLowerCase());
            const ehEnvolvido = solicitanteLower === usuarioLower || membrosList.includes(usuarioLower);
            if (!ehEnvolvido) return false;
        }
        if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
        if (filtroPrioridade !== "todos" && (c.prioridade || "Média") !== filtroPrioridade) return false;
        if (filtroBusca) {
            const buscaText = (c.titulo || "").toLowerCase() + 
                             (c.id || "").toLowerCase() + 
                             (c.descricao || "").toLowerCase() +
                             (c.solicitante || "").toLowerCase();
            if (!buscaText.includes(filtroBusca)) return false;
        }
        return true;
    });

    // Separar chamados por status
    let abertos = chamadosFiltrados.filter(c => c.status === "aberto");
    let percursos = chamadosFiltrados.filter(c => c.status === "percurso");
    let concluidos = chamadosFiltrados.filter(c => c.status === "concluido");

    // ============================================================
    // FUNÇÃO DE ORDENAÇÃO PRINCIPAL
    // ============================================================
    function ordenarChamados(lista) {
        const usuarioLower = usuarioLogado ? usuarioLogado.toLowerCase() : "";
        
        return lista.sort((a, b) => {
            // 1º CRITÉRIO: Chamados onde o usuário logado é o responsável atual (quemEstaCom)
            const aResponsavel = a.quemEstaCom ? a.quemEstaCom.toLowerCase() : "";
            const bResponsavel = b.quemEstaCom ? b.quemEstaCom.toLowerCase() : "";
            
            const aEhDoUsuario = usuarioLower && aResponsavel.includes(usuarioLower);
            const bEhDoUsuario = usuarioLower && bResponsavel.includes(usuarioLower);
            
            if (aEhDoUsuario && !bEhDoUsuario) return -1;
            if (!aEhDoUsuario && bEhDoUsuario) return 1;
            
            // 2º CRITÉRIO: Prioridade (Crítica > Alta > Média > Baixa)
            const ordemPrioridade = { "crítica": 0, "alta": 1, "média": 2, "media": 2, "baixa": 3 };
            const aPrio = (a.prioridade || "média").toLowerCase();
            const bPrio = (b.prioridade || "média").toLowerCase();
            
            const aNivel = ordemPrioridade[aPrio] !== undefined ? ordemPrioridade[aPrio] : 2;
            const bNivel = ordemPrioridade[bPrio] !== undefined ? ordemPrioridade[bPrio] : 2;
            
            if (aNivel !== bNivel) return aNivel - bNivel;
            
            // 3º CRITÉRIO: Data limite (mais próximo vence primeiro)
            const dataA = a.datalimite ? parseDataBr(a.datalimite) : null;
            const dataB = b.datalimite ? parseDataBr(b.datalimite) : null;
            
            if (dataA && dataB) return dataA - dataB;
            if (dataA && !dataB) return -1;
            if (!dataA && dataB) return 1;
            
            // 4º CRITÉRIO: Data de abertura (mais recente primeiro)
            const dataAberturaA = a.dataAbertura ? parseDataBr(a.dataAbertura) : new Date(0);
            const dataAberturaB = b.dataAbertura ? parseDataBr(b.dataAbertura) : new Date(0);
            return dataAberturaB - dataAberturaA;
        });
    }

    // Aplicar ordenação em cada lista
    abertos = ordenarChamados(abertos);
    percursos = ordenarChamados(percursos);
    concluidos = ordenarChamados(concluidos);

    // Atualizar estatísticas dos filtros
    atualizarStatsFiltros(chamados, chamadosFiltrados);

    // Renderizar cards
    renderizarCards(colAberto, abertos);
    if(colPercurso) renderizarCards(colPercurso, percursos);
    if(colConcluido) renderizarCards(colConcluido, concluidos);

    // Mostrar mensagens vazias
    if (abertos.length === 0) colAberto.innerHTML = `<div class="empty-state">Nenhum chamado aberto.</div>`;
    if (percursos.length === 0 && colPercurso) colPercurso.innerHTML = `<div class="empty-state">Nenhum em percurso.</div>`;
    if (concluidos.length === 0 && colConcluido) colConcluido.innerHTML = `<div class="empty-state">Nenhum concluído.</div>`;
}

// Função para renderizar os cards
function renderizarCards(container, chamados) {
    if (chamados.length === 0) return;

    chamados.forEach(c => {
        // ============================================================
        // VERIFICA SE O CHAMADO ESTÁ VENCIDO
        // ============================================================
        let isAtrasado = false;
        let isVencido = false;
        let diasAtraso = 0;
        
        if (c.status !== "concluido" && c.datalimite) {
            let prazoLimite = parseDataBr(c.datalimite);
            if (prazoLimite) {
                const hoje = new Date();
                // Remove as horas para comparar apenas datas
                hoje.setHours(0, 0, 0, 0);
                prazoLimite.setHours(0, 0, 0, 0);
                
                if (hoje > prazoLimite) {
                    isVencido = true;
                    isAtrasado = true;
                    // Calcula dias de atraso
                    const diffTime = hoje - prazoLimite;
                    diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } else if (hoje.getTime() === prazoLimite.getTime()) {
                    // Vence hoje - considera como atrasado também
                    isAtrasado = true;
                }
            }
        }

        let membrosLista = c.membros ? c.membros.split(",").map(m => m.trim().toLowerCase()) : [];
        let usuarioAtualLimpo = usuarioLogado ? usuarioLogado.trim().toLowerCase() : "";
        let solicitanteLimpo = c.solicitante ? c.solicitante.trim().toLowerCase() : "";

        let ehSolicitante = usuarioAtualLimpo && (solicitanteLimpo === usuarioAtualLimpo);
        let ehMembro = usuarioAtualLimpo && membrosLista.includes(usuarioAtualLimpo);
        let ehEnvolvido = ehSolicitante || ehMembro;

        const isMeuChamado = usuarioLogado && isUsuarioEnvolvido(c, usuarioLogado.toLowerCase());

        let acaoClique = "";
        if (ehEnvolvido) {
            acaoClique = `abrirDetalhesCard('${c.id}')`;
        } else {
            acaoClique = `alert('Acesso restrito: Apenas os envolvidos neste chamado (solicitante ou responsáveis) podem abrir este cartão.')`;
        }

        let prioridadeLower = (c.prioridade || "média").toLowerCase();
        let classePrio = "prio-media";
        if (prioridadeLower.includes("baixa")) classePrio = "prio-baixa";
        else if (prioridadeLower.includes("alta")) classePrio = "prio-alta";
        else if (prioridadeLower.includes("crít") || prioridadeLower.includes("crit")) classePrio = "prio-critica";

        // Badge de envolvimento
        let badgeEnvolvimento = "";
        if (ehSolicitante) {
            badgeEnvolvimento = `<span class="badge-envolvimento solicitante">📝 Solicitante</span>`;
        } else if (ehMembro) {
            badgeEnvolvimento = `<span class="badge-envolvimento responsavel">👤 Responsável</span>`;
        }

        // ============================================================
        // CLASSES DO CARD
        // ============================================================
        let classeCard = "kanban-card";
        if (isMeuChamado) classeCard += " meu-chamado";
        if (isVencido) classeCard += " card-vencido"; // Classe especial para vencido

        // ============================================================
        // BADGE DE VENCIMENTO
        // ============================================================
        let badgeVencimento = "";
        if (isVencido) {
            badgeVencimento = `<span class="badge-vencido">🔴 VENCIDO (${diasAtraso}d)</span>`;
        } else if (isAtrasado) {
            badgeVencimento = `<span class="badge-atraso">⚠️ Vence hoje</span>`;
        }

        let cardHtml = `
            <div class="${classeCard}" onclick="${acaoClique}">
                <div class="card-header-info">
                    <span class="badge-tipo">${c.tipo || 'Chamado'}</span>
                    <div>
                        ${isMeuChamado ? '<span class="badge-eu">⭐ Eu</span>' : ''}
                        ${badgeVencimento}
                        ${!ehEnvolvido ? '<span class="badge-atraso" style="background:#5e6c84;">🔒</span>' : ''}
                    </div>
                </div>
                
                <h4>${c.titulo}</h4>
                
                <div class="card-sub-header">
                    <span class="badge-responsavel">👤 ${c.quemEstaCom || 'Com: -'}</span>
                    <span class="badge-prioridade ${classePrio}">${c.prioridade || 'Média'}</span>
                </div>

                <div class="card-envolvidos-geral">
                    👥 <b>Envolvidos:</b> ${c.membros || 'Nenhum'}
                    ${badgeEnvolvimento}
                </div>

                <div class="card-section">
                    <div>📅 Abertura: <b>${c.dataAbertura || 'N/D'}</b></div>
                    <div>⏳ Limite: <b>${c.datalimite || 'Sem prazo'}${isVencido ? ' 🚨' : ''}</b></div>
                </div>

                <div class="card-participantes">
                    👥 <b>Participantes:</b> ${c.participantes || c.solicitante || 'Nenhum'}
                </div>
            </div>
        `;

        container.innerHTML += cardHtml;
    });
}

function abrirDetalhesCard(id) {
    const chamado = cacheChamadosGlobal.find(item => item.id == id);
    if (!chamado) return;

    document.getElementById("detalheIdCard").value = chamado.id;
    document.getElementById("detalhe-modal-titulo").innerText = chamado.id + " - " + chamado.titulo;
    document.getElementById("detalheTipo").value = chamado.tipo || "";
    document.getElementById("detalhePrioridade").value = chamado.prioridade || "";
    document.getElementById("detalheSolicitante").value = chamado.solicitante || "";
    document.getElementById("detalheContato").value = chamado.contato || "";
    document.getElementById("detalheDescricao").value = chamado.descricao || "";
    document.getElementById("detalheMembros").value = (chamado.membros || "") + " (" + (chamado.tipofluxo || "livre") + ")";
    document.getElementById("detalheDataLimite").value = chamado.datalimite || "Sem prazo";
    document.getElementById("detalheAnexos").value = chamado.anexos || "Nenhum";
    
    // ============================================================
    // MOSTRA OS PARTICIPANTES NO MODAL
    // ============================================================
    const participantesDiv = document.getElementById("detalheParticipantesContainer");
    if (participantesDiv) {
        const participantesLista = chamado.participantes ? chamado.participantes.split(",").map(p => p.trim()) : [];
        const usuarioAtualLimpo = usuarioLogado ? usuarioLogado.trim().toLowerCase() : "";
        const solicitanteLimpo = chamado.solicitante ? chamado.solicitante.trim().toLowerCase() : "";
        
        let html = '';
        participantesLista.forEach(p => {
            let classe = 'participante-tag';
            const pLower = p.toLowerCase();
            
            if (pLower === solicitanteLimpo) {
                classe += ' solicitante-tag';
            }
            if (pLower === usuarioAtualLimpo) {
                classe += ' eu-tag';
            }
            if (pLower !== solicitanteLimpo && pLower !== usuarioAtualLimpo) {
                classe += ' responsavel-tag';
            }
            
            html += `<span class="${classe}">${p}</span>`;
        });
        
        participantesDiv.innerHTML = html || '<span style="color: var(--text-muted);">Nenhum participante registrado.</span>';
    }
    
    if (Array.isArray(chamado.observacoes) && chamado.observacoes.length > 0) {
        document.getElementById("detalheHistorico").innerText = chamado.observacoes.join("\n\n");
    } else {
        document.getElementById("detalheHistorico").innerText = "Nenhuma observação registrada.";
    }
    
    document.getElementById("novaObservacaoTexto").value = "";

    const containerBotoes = document.getElementById("container-botoes-acao");
    let botoesHtml = `<button class="btn-cancelar" onclick="fecharModalDetalhes()">Fechar</button>`;

    // ============================================================
    // VERIFICA SE O USUÁRIO ESTÁ LOGADO
    // ============================================================
    if (usuarioLogado) {
        const usuarioAtualLimpo = usuarioLogado.trim().toLowerCase();
        const solicitanteLimpo = (chamado.solicitante || "").trim().toLowerCase();
        const membrosStr = chamado.membros || "";
        const membrosArr = membrosStr ? membrosStr.split(",").map(m => m.trim().toLowerCase()) : [];
        const tipoFluxo = (chamado.tipofluxo || "livre").toLowerCase();
        
        // ============================================================
        // VERIFICA SE O USUÁRIO É ENVOLVIDO
        // ============================================================
        const ehSolicitante = solicitanteLimpo === usuarioAtualLimpo;
        const ehMembro = membrosArr.includes(usuarioAtualLimpo);
        const ehEnvolvido = ehSolicitante || ehMembro;
        
        console.log("=== DEBUG ===");
        console.log("Usuario logado:", usuarioAtualLimpo);
        console.log("Solicitante:", solicitanteLimpo);
        console.log("Membros:", membrosArr);
        console.log("ehSolicitante:", ehSolicitante);
        console.log("ehMembro:", ehMembro);
        console.log("ehEnvolvido:", ehEnvolvido);
        console.log("tipoFluxo:", tipoFluxo);
        console.log("status:", chamado.status);
        console.log("=============");
        
        // ============================================================
        // SE FOR LIVRE E ENVOLVIDO - LIBERA TUDO!
        // ============================================================
        if (tipoFluxo === "livre" && ehEnvolvido) {
            // LIVRE: qualquer envolvido pode fazer tudo!
            
            if (chamado.status === "aberto" || chamado.status === "percurso") {
                botoesHtml += `<button class="btn-confirmar" onclick="tentarAcao('${chamado.id}', 'percurso')">➡️ Continuar</button>`;
            }
            
            if (chamado.status === "percurso") {
                botoesHtml += `<button class="btn-confirmar" onclick="tentarAcao('${chamado.id}', 'concluido')" style="background:var(--success-color);">✅ Concluir Chamado</button>`;
            }
            
            // Repassar (apenas para membros, não para solicitante)
            if (ehMembro && !ehSolicitante && membrosArr.length > 1) {
                botoesHtml += `<button class="btn-devolver" onclick="abrirModalRepassar('${chamado.id}', '${chamado.membros}')">🔄 Repassar</button>`;
            }
            
        } else if (tipoFluxo === "sequencial") {
            // ============================================================
            // SEQUENCIAL: SEGUE A ORDEM DA FILA
            // ============================================================
            const ehPrimeiroDaFila = membrosArr.length > 0 && membrosArr[0] === usuarioAtualLimpo;
            const solicitanteNaFila = membrosArr.length > 0 && membrosArr[membrosArr.length - 1] === solicitanteLimpo;
            
            if (chamado.status === "aberto" || chamado.status === "percurso") {
                if (ehPrimeiroDaFila || (ehSolicitante && solicitanteNaFila)) {
                    botoesHtml += `<button class="btn-confirmar" onclick="tentarAcao('${chamado.id}', 'percurso')">➡️ Continuar</button>`;
                }
            }
            
            if (chamado.status === "percurso") {
                let podeConcluir = false;
                
                if (solicitanteNaFila && ehSolicitante) {
                    podeConcluir = true;
                } else if (membrosArr.length > 0) {
                    const ultimoTecnico = membrosArr.filter(m => m !== solicitanteLimpo);
                    if (ultimoTecnico.length > 0 && ultimoTecnico[ultimoTecnico.length - 1] === usuarioAtualLimpo) {
                        podeConcluir = true;
                    }
                }
                
                if (podeConcluir) {
                    botoesHtml += `<button class="btn-confirmar" onclick="tentarAcao('${chamado.id}', 'concluido')" style="background:var(--success-color);">✅ Concluir Chamado</button>`;
                }
            }
            
            // Repassar (apenas primeiro da fila)
            if (ehPrimeiroDaFila && membrosArr.length > 1) {
                botoesHtml += `<button class="btn-devolver" onclick="abrirModalRepassar('${chamado.id}', '${chamado.membros}')">🔄 Repassar</button>`;
            }
        }
        
        // ============================================================
        // BOTÃO REABRIR (APENAS ADMIN)
        // ============================================================
        if (usuarioStatus === "admin" && chamado.status === "concluido") {
            botoesHtml += `<button class="btn-reabrir" onclick="reabrirChamadoAdmin('${chamado.id}')">🔄 Reabrir Chamado</button>`;
        }
    }

    containerBotoes.innerHTML = botoesHtml;
    document.getElementById("modal-detalhes").style.display = "flex";
}

function abrirModalRepassar(id, membrosTexto) {
    let membros = membrosTexto ? membrosTexto.split(",").map(m => m.trim()) : [];
    let usuarioAtualLimpo = usuarioLogado ? usuarioLogado.trim().toLowerCase() : "";
    
    // Filtra para não listar o próprio usuário que está logado nas opções de repasse
    let optionsHtml = "";
    membros.forEach(m => {
        if (m.toLowerCase() !== usuarioAtualLimpo) {
            optionsHtml += `<option value="${m}">${m}</option>`;
        }
    });

    if (!optionsHtml) {
        alert("Não há outros membros na lista para repassar.");
        return;
    }

    let destinatarioEscolhido = prompt("Selecione para qual dos envolvidos abaixo deseja repassar o chamado:\n\n" + membros.filter(m => m.toLowerCase() !== usuarioAtualLimpo).join("\n"), membros[0]);
    
    if (!destinatarioEscolhido) return;

    const obsTexto = document.getElementById("novaObservacaoTexto").value.trim();
    if (!obsTexto) {
        alert("Atenção: É obrigatório preencher a observação explicando o motivo do repasse antes de confirmar.");
        document.getElementById("novaObservacaoTexto").focus();
        return;
    }

    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({
            acao: "repassarChamado",
            id: id,
            usuarioLogado: usuarioLogado,
            destinatario: destinatarioEscolhido,
            observacao: obsTexto
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            fecharModalDetalhes();
            carregarChamados();
        } else {
            alert(data.mensagem || "Erro ao repassar o chamado.");
        }
    });
}

function fecharModalDetalhes() {
    document.getElementById("modal-detalhes").style.display = "none";
}

function salvarObservacao() {
    const id = document.getElementById("detalheIdCard").value;
    const obsTexto = document.getElementById("novaObservacaoTexto").value;

    if (!usuarioLogado) {
        alert("Você precisa estar logado para adicionar uma observação.");
        abrirModalLogin();
        return;
    }
    if (!obsTexto.trim()) {
        alert("Escreva alguma observação antes de enviar.");
        return;
    }

    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({
            acao: "adicionarObservacao",
            id: id,
            observacao: obsTexto,
            usuarioLogado: usuarioLogado
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            if (Array.isArray(data.observacoes) && data.observacoes.length > 0) {
                document.getElementById("detalheHistorico").innerText = data.observacoes.join("\n\n");
            } else {
                document.getElementById("detalheHistorico").innerText = "Nenhuma observação registrada.";
            }
            document.getElementById("novaObservacaoTexto").value = "";
            carregarChamados();
        } else {
            alert(data.mensagem || "Erro ao adicionar observação.");
        }
    });
}

function abrirModalLogin() { 
    console.log("Abrindo modal de login");
    const modal = document.getElementById("modal-login");
    if (modal) {
        modal.style.display = "flex";
        console.log("Modal encontrado e aberto");
    } else {
        console.error("Modal de login não encontrado!");
        alert("Erro: Modal de login não encontrado!");
    }
}

function fecharModalLogin() { 
    document.getElementById("modal-login").style.display = "none"; 
}

function abrirModalCriar() {
    document.getElementById("modalInputSolicitante").value = usuarioLogado || "";
    document.getElementById("check-todos").checked = false;
    montarCheckboxesMembros(listaUsuariosCache);
    document.getElementById("modalInputRevisao").checked = false;
    document.getElementById("modal-criar").style.display = "flex";
}
function fecharModalCriar() { document.getElementById("modal-criar").style.display = "none"; }

function fazerLogin() {
    const usuario = document.getElementById("user").value;
    const senha = document.getElementById("pass").value;

    if (!usuario || !senha) { alert("Preencha os campos!"); return; }

    fetch(URL_API, { 
        method: "POST", 
        body: JSON.stringify({ acao: "login", usuario: usuario, senha: senha }) 
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            usuarioLogado = data.nome;
            usuarioStatus = (data.userStatus || "user").toLowerCase();
            
            document.getElementById("btn-login-header").style.display = "none";
            document.getElementById("btn-novo-topo").style.display = "inline-block";
            document.getElementById("user-info").style.display = "inline";
            document.getElementById("nome-user").innerText = usuarioLogado;
            
            const badge = document.getElementById("user-status-badge");
            badge.style.display = "inline"; // <-- GARANTE QUE O BADGE APARECE
            
            if (usuarioStatus === "admin") {
                badge.textContent = "👑 Admin";
                document.getElementById("btn-config").style.display = "inline-block";
            } else {
                badge.textContent = "👤 User";
                document.getElementById("btn-config").style.display = "none";
            }
            
            document.getElementById("filtros-container").style.display = "block";
            document.getElementById("col-percurso").style.display = "flex";
            document.getElementById("col-concluido").style.display = "flex";
            document.getElementById("subtitulo-pagina").innerText = "Gerencie o fluxo completo de chamados em tempo real. Filtros disponíveis para seus chamados.";
            
            fecharModalLogin();
            carregarChamados();
        } else {
            alert(data.mensagem || "Login falhou!");
        }
    })
    .catch(error => {
        console.error("Erro no login:", error);
        alert("Erro ao conectar com o servidor. Verifique sua conexão.");
    });
}

function logout() {
    location.reload();
}

function criarChamado() {
    const titulo = document.getElementById("modalInputTitulo").value;
    const tipo = document.getElementById("modalInputTipo").value;
    const prioridade = document.getElementById("modalInputPrioridade").value;
    const solicitante = document.getElementById("modalInputSolicitante").value;
    const contato = document.getElementById("modalInputContato").value;
    const descricao = document.getElementById("modalInputDescricao").value;
    const tipoFluxo = document.getElementById("modalInputFluxo").value;
    const exigeRevisao = document.getElementById("modalInputRevisao").checked;
    const dataLimite = document.getElementById("modalInputDataLimite").value;
    const anexos = document.getElementById("modalInputAnexos").value;

    const membrosStr = ordemSelecionadaMembros.join(", ");

    if (!titulo || !solicitante) { alert("Preencha pelo menos o Título e o Solicitante!"); return; }

    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({ 
            acao: "criar", titulo, tipo, prioridade, solicitante, contato, descricao, membros: membrosStr, tipoFluxo, exigeRevisao, dataLimite, anexos
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            document.getElementById("modalInputTitulo").value = "";
            document.getElementById("modalInputDescricao").value = "";
            document.getElementById("modalInputContato").value = "";
            document.getElementById("modalInputDataLimite").value = "";
            document.getElementById("modalInputAnexos").value = "";
            fecharModalCriar();
            carregarChamados();
        } else {
            alert("Erro ao criar chamado.");
        }
    });
}

function tentarAcao(id, novoStatus) {
    if (!usuarioLogado) {
        alert("Por favor, faça login para gerenciar este chamado!");
        abrirModalLogin();
        return;
    }

    const obsTexto = document.getElementById("novaObservacaoTexto").value.trim();

    if (novoStatus !== "aberto" && !obsTexto) {
        alert("Atenção: É obrigatório preencher o campo de observação/parecer para avançar o chamado.");
        document.getElementById("novaObservacaoTexto").focus();
        return;
    }

    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({ 
            acao: "atualizarStatus", 
            id: id, 
            novoStatus: novoStatus, 
            usuarioLogado: usuarioLogado,
            observacao: obsTexto
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            fecharModalDetalhes();
            carregarChamados();
        } else {
            alert(data.mensagem || "Erro ao atualizar o chamado.");
        }
    });
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================

let tiposChamado = ["Bug", "Dúvida", "Solicitação", "Melhoria"];

function abrirConfiguracoes() {
    // CONVERTE PARA MINÚSCULO PARA COMPARAÇÃO
    if (usuarioStatus !== "admin") {
        alert("Apenas administradores podem acessar as configurações!");
        return;
    }
    
    carregarUsuariosConfig();
    carregarTiposConfig();
    
    document.getElementById("modal-config").style.display = "flex";
}

function fecharConfiguracoes() {
    document.getElementById("modal-config").style.display = "none";
}

// ============================================================
// GERENCIAR USUÁRIOS
// ============================================================

function carregarUsuariosConfig() {
    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({ acao: "listarUsuariosCompletos" })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            const tbody = document.getElementById("tabela-usuarios-body");
            tbody.innerHTML = "";
            data.usuarios.forEach(u => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${u.usuario}</td>
                    <td>${u.nome}</td>
                    <td>${u.email}</td>
                    <td><span class="badge-status ${u.status}">${u.status}</span></td>
                    <td>
                        <button class="btn-editar" onclick="editarUsuario('${u.usuario}')">✏️</button>
                        <button class="btn-excluir" onclick="excluirUsuario('${u.usuario}')">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    });
}

function abrirModalUsuario(usuario) {
    document.getElementById("modal-usuario").style.display = "flex";
    
    if (usuario) {
        // Editar - carregar dados
        document.getElementById("usuario-antigo").value = usuario;
        // Buscar dados do usuário
        fetch(URL_API, {
            method: "POST",
            body: JSON.stringify({ acao: "listarUsuariosCompletos" })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === "sucesso") {
                const user = data.usuarios.find(u => u.usuario === usuario);
                if (user) {
                    document.getElementById("usuario-input").value = user.usuario;
                    document.getElementById("usuario-input").disabled = true;
                    document.getElementById("senha-input").value = user.senha;
                    document.getElementById("nome-input").value = user.nome;
                    document.getElementById("email-input").value = user.email;
                    document.getElementById("status-select").value = user.status;
                }
            }
        });
        document.getElementById("modal-usuario-title").textContent = "Editar Usuário";
        document.getElementById("btn-salvar-usuario").textContent = "Atualizar";
    } else {
        // Novo
        document.getElementById("usuario-antigo").value = "";
        document.getElementById("usuario-input").disabled = false;
        document.getElementById("usuario-input").value = "";
        document.getElementById("senha-input").value = "";
        document.getElementById("nome-input").value = "";
        document.getElementById("email-input").value = "";
        document.getElementById("status-select").value = "user";
        document.getElementById("modal-usuario-title").textContent = "Novo Usuário";
        document.getElementById("btn-salvar-usuario").textContent = "Cadastrar";
    }
}

function fecharModalUsuario() {
    document.getElementById("modal-usuario").style.display = "none";
}

function salvarUsuario() {
    const usuario = document.getElementById("usuario-input").value;
    const senha = document.getElementById("senha-input").value;
    const nome = document.getElementById("nome-input").value;
    const email = document.getElementById("email-input").value;
    const status = document.getElementById("status-select").value;
    const usuarioAntigo = document.getElementById("usuario-antigo").value;
    
    if (!usuario || !senha || !nome) {
        alert("Preencha todos os campos obrigatórios!");
        return;
    }
    
    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({
            acao: "salvarUsuario",
            usuario: usuario,
            senha: senha,
            nome: nome,
            email: email,
            status: status,
            usuarioAntigo: usuarioAntigo
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            alert(data.mensagem);
            fecharModalUsuario();
            carregarUsuariosConfig();
        } else {
            alert(data.mensagem);
        }
    });
}

function editarUsuario(usuario) {
    abrirModalUsuario(usuario);
}

function excluirUsuario(usuario) {
    if (!confirm(`Deseja realmente excluir o usuário "${usuario}"?`)) return;
    
    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({
            acao: "excluirUsuario",
            usuario: usuario
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            alert(data.mensagem);
            carregarUsuariosConfig();
        } else {
            alert(data.mensagem);
        }
    });
}

// ============================================================
// GERENCIAR TIPOS DE CHAMADO
// ============================================================

function carregarTiposConfig() {
    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({ acao: "listarTipos" })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            tiposChamado = data.tipos || ["Bug", "Dúvida", "Solicitação", "Melhoria"];
            renderizarTipos();
            atualizarSelectTipos(); // Atualiza o select no modal de criar
        }
    })
    .catch(error => {
        console.error("Erro ao carregar tipos:", error);
        // Se falhar, usa os padrão
        tiposChamado = ["Bug", "Dúvida", "Solicitação", "Melhoria"];
        renderizarTipos();
    });
}

function renderizarTipos() {
    const container = document.getElementById("lista-tipos");
    if (!container) return;
    container.innerHTML = "";
    tiposChamado.forEach((tipo, index) => {
        const div = document.createElement("div");
        div.className = "tipo-item";
        div.innerHTML = `
            <span>${tipo}</span>
            <button onclick="removerTipo(${index})" title="Remover tipo">✕</button>
        `;
        container.appendChild(div);
    });
}

function adicionarTipo() {
    const input = document.getElementById("novo-tipo-input");
    const novoTipo = input.value.trim();
    if (!novoTipo) {
        alert("Digite um tipo!");
        return;
    }
    if (tiposChamado.includes(novoTipo)) {
        alert("Este tipo já existe!");
        return;
    }
    tiposChamado.push(novoTipo);
    input.value = "";
    renderizarTipos();
    salvarTipos();
}

function removerTipo(index) {
    const tipo = tiposChamado[index];
    if (!confirm(`Deseja remover o tipo "${tipo}"?`)) return;
    tiposChamado.splice(index, 1);
    renderizarTipos();
    salvarTipos();
}

function salvarTipos() {
    // Mostra loading
    const btnSalvar = document.getElementById("btn-salvar-tipos");
    if (btnSalvar) {
        btnSalvar.textContent = "⏳ Salvando...";
        btnSalvar.disabled = true;
    }
    
    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({
            acao: "atualizarTipos",
            tipos: tiposChamado
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            // Atualiza o select no modal de criar chamado
            atualizarSelectTipos();
            // Mostra feedback
            const feedback = document.getElementById("feedback-tipos");
            if (feedback) {
                feedback.textContent = "✅ Tipos salvos com sucesso!";
                feedback.style.color = "var(--success-color)";
                setTimeout(() => {
                    feedback.textContent = "";
                }, 3000);
            }
        } else {
            alert("Erro ao salvar tipos: " + data.mensagem);
        }
    })
    .catch(error => {
        console.error("Erro ao salvar tipos:", error);
        alert("Erro ao conectar com o servidor.");
    })
    .finally(() => {
        if (btnSalvar) {
            btnSalvar.textContent = "💾 Salvar Tipos";
            btnSalvar.disabled = false;
        }
    });
}

function atualizarSelectTipos() {
    const select = document.getElementById("modalInputTipo");
    if (select) {
        const valorAtual = select.value;
        select.innerHTML = "";
        tiposChamado.forEach(tipo => {
            const option = document.createElement("option");
            option.value = tipo;
            option.textContent = tipo;
            select.appendChild(option);
        });
        // Tenta manter o valor selecionado anterior
        if (tiposChamado.includes(valorAtual)) {
            select.value = valorAtual;
        }
    }
}

// Carregar tipos ao iniciar a página
function carregarTiposIniciais() {
    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({ acao: "listarTipos" })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            tiposChamado = data.tipos || ["Bug", "Dúvida", "Solicitação", "Melhoria"];
            atualizarSelectTipos();
        }
    })
    .catch(error => {
        console.error("Erro ao carregar tipos iniciais:", error);
    });
}

// Chamar no DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    carregarChamados();
    carregarUsuariosParaMembros();
    carregarTiposIniciais(); // <-- ADICIONE ESTA LINHA

    // 🔄 ATUALIZAÇÃO DINÂMICA EM TEMPO REAL (A cada 5 segundos)
    setInterval(() => {
        const modalDetalhesAberto = document.getElementById("modal-detalhes").style.display === "flex";
        const modalCriarAberto = document.getElementById("modal-criar").style.display === "flex";

        if (!modalDetalhesAberto && !modalCriarAberto) {
            carregarChamadosSilencioso();
        }
    }, 5000);
});

// ============================================================
// REABRIR CHAMADO (ADMIN)
// ============================================================

function reabrirChamadoAdmin(id) {
    if (!confirm("Deseja REABRIR este chamado? O status voltará para 'Em Percurso'.")) return;
    
    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({
            acao: "reabrirChamado",
            id: id
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "sucesso") {
            alert(data.mensagem);
            fecharModalDetalhes();
            carregarChamados();
        } else {
            alert(data.mensagem);
        }
    });
}
