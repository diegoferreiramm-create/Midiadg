const ModuloBipagem = {
    cacheGrafica: [],            // Base carregada para validar o bip
    dadosEntradaLocalizados: [], // Itens bipados na sessão atual
    dadosParaImpressaoBip: [],   // Cache para a camada de detalhe/reimpressão

    // --- 1. INICIALIZAÇÃO E CACHE ---
    abrirTela: function() {
        document.getElementById('menuBox').style.display = 'none';
        document.getElementById('entradaBox').style.display = 'flex';
        
        const input = document.getElementById('inputBipagem');
        input.disabled = true;
        input.placeholder = "Carregando base da gráfica...";

        // Busca a base de produção para validar os bips localmente (mais rápido)
        google.script.run.withSuccessHandler((dados) => {
            this.cacheGrafica = dados || [];
            input.disabled = false;
            input.placeholder = "Bipe a carteira aqui...";
            input.focus();
        }).carregarDadosProducao();
        
        this.limparSessao();
    },

    // --- 2. LOGICA DE BIPAGEM ---
    processarBip: function(valor) {
        if (!valor || valor.length < 5) return;

        // Procura no cache (Coluna 0 = ID/Código)
        const itemEncontrado = this.cacheGrafica.find(r => 
            r[0].toString().trim() === valor.trim()
        );

        if (itemEncontrado) {
            const jaExiste = this.dadosEntradaLocalizados.some(d => d[0] === itemEncontrado[0]);
            
            if (jaExiste) {
                alert("Item já está na lista!");
            } else {
                // Adiciona ao topo para facilitar visualização
                this.dadosEntradaLocalizados.unshift([...itemEncontrado]);
                this.renderizarTabela();
                if(typeof ModuloUtils !== 'undefined') ModuloUtils.tocarSomSucesso();
            }
        } else {
            alert("Código " + valor + " não encontrado na base da gráfica!");
            if(typeof ModuloUtils !== 'undefined') ModuloUtils.tocarSomErro();
        }

        document.getElementById('inputBipagem').value = "";
        document.getElementById('inputBipagem').focus();
    },

    renderizarTabela: function() {
        const corpo = document.getElementById('corpoTabelaEntrada');
        let html = "";

        this.dadosEntradaLocalizados.forEach((item, index) => {
            html += `<tr style="border-bottom: 1px solid #334155;">
                <td style="padding:8px;">${item[0]}</td>
                <td>${item[1]}</td>
                <td>${item[2]}</td>
                <td>${item[4]}</td>
                <td>${item[5]}</td>
                <td style="text-align:center;">
                    <button onclick="ModuloBipagem.removerItem(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button>
                </td>
            </tr>`;
        });

        corpo.innerHTML = html;
        document.getElementById('contagemEntrada').innerText = "Bipados: " + this.dadosEntradaLocalizados.length;
    },

    removerItem: function(index) {
        this.dadosEntradaLocalizados.splice(index, 1);
        this.renderizarTabela();
    },

    // --- 3. SALVAMENTO (COM FATIAMENTO PARA EVITAR ERRO) ---
    salvar: function() {
        if (this.dadosEntradaLocalizados.length === 0) return alert("Nada para salvar!");
        
        const remessa = document.getElementById('entRemessa').value || "S/N";
        const btn = document.getElementById('btnSalvarEntrada');
        
        btn.disabled = true;
        btn.innerText = "SALVANDO...";

        const total = this.dadosEntradaLocalizados.length;
        const tamanhoLote = 5; 
        let atual = 0;
        let protocoloFinal = "";

        const enviarLoteBip = () => {
            const fim = Math.min(atual + tamanhoLote, total);
            const pedaço = this.dadosEntradaLocalizados.slice(atual, fim);

            google.script.run.withSuccessHandler((protocolo) => {
                protocoloFinal = protocolo;
                atual = fim;

                if (atual < total) {
                    btn.innerText = `SALVANDO (${atual}/${total})...`;
                    enviarLoteBip();
                } else {
                    alert("Salvo com sucesso! Protocolo: " + protocoloFinal);
                    this.limparSessao();
                    ModuloUtils.voltarParaMenu();
                    btn.disabled = false;
                    btn.innerText = "SALVAR ENTRADA";
                }
            }).gravarEntradaNoServidor(pedaço, remessa, AppSessao.nome);
        };

        enviarLoteBip();
    },

    // --- 4. SISTEMA DE CONSULTA (CAMADAS SOBREPOSTAS) ---
    abrirReimpressaoBipagem: function() {
        document.getElementById('camadaResumoBipagem').style.display = 'flex';
        const corpo = document.getElementById("corpoResumoBipagem");
        corpo.innerHTML = "<tr><td colspan='2'>Carregando...</td></tr>";

        google.script.run.withSuccessHandler((dados) => {
            let html = "";
            if(!dados || dados.length == 0) { 
                corpo.innerHTML = "<tr><td colspan='2'>Vazio</td></tr>"; 
                return; 
            }
            for(let i=0; i<dados.length; i++){
                // Supondo que dados[i].quantidade venha do servidor
                html += `<tr onclick="ModuloBipagem.verDetalhesBipagem('${dados[i].protocolo}', '${dados[i].qtd || 0}')" style="cursor:pointer;">
                            <td>${dados[i].remessa}</td>
                            <td>${dados[i].protocolo}</td>
                         </tr>`;
            }
            corpo.innerHTML = html;
        }).buscarResumoBipagemV2();
    },

    verDetalhesBipagem: function(protocolo, qtd) {
        document.getElementById('camadaDetalheBipagem').style.display = 'flex';
        document.getElementById('tituloDetalhe').innerText = "PROTOCOLO: " + protocolo;
        document.getElementById('subtituloQuantidade').innerText = "Total de itens: " + qtd;
        
        const corpo = document.getElementById('corpoDetalheBipagem');
        corpo.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Buscando itens...</td></tr>";

        google.script.run.withSuccessHandler((dados) => {
            this.dadosParaImpressaoBip = dados;
            let html = "";
            dados.forEach(item => {
                html += `<tr style="border-bottom: 1px solid #0f172a;">
                    <td style="padding:8px;">${item[0]}</td>
                    <td>${item[1]}</td><td>${item[2]}</td>
                    <td>${item[4]}</td><td>${item[5]}</td>
                </tr>`;
            });
            corpo.innerHTML = html;
        }).buscarItensBipagemPorProtocolo(protocolo);
    },

    // --- 5. IMPRESSÃO DO LOTE BIPADO ---
    dispararImpressaoBipagem: function() {
        if (this.dadosParaImpressaoBip.length === 0) return alert("Sem dados.");
        
        const r = this.dadosParaImpressaoBip[0];
        document.getElementById('impParceiroLote').innerText = "REMESSA: " + (r[11] || "S/N");
        document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + (r[12] || "S/P");
        document.getElementById('impDataHora').innerText = "DATA BIPAGEM: " + (r[10] || "");
        document.getElementById('impNomeAtendente').innerText = (r[13] || AppSessao.nome).toUpperCase();

        let html = "";
        this.dadosParaImpressaoBip.forEach(item => {
            html += `<tr>
                <td style="border:1px solid black; padding:2px;">${item[0]}</td>
                <td style="border:1px solid black; padding:2px;">${item[1]}</td>
                <td style="border:1px solid black; padding:2px;">${item[2]}</td>
                <td style="border:1px solid black; padding:2px;">${item[3]}</td>
                <td style="border:1px solid black; padding:2px;">${item[4]}</td>
                <td style="border:1px solid black; padding:2px; text-align:center;">${item[5]}</td>
                <td colspan="4" style="border:1px solid black; padding:2px; text-align:center;">ENTRADA CONFIRMADA</td>
            </tr>`;
        });
        
        document.getElementById('corpoImpressao').innerHTML = html;
        setTimeout(() => { window.print(); }, 300);
    },

    limparSessao: function() {
        this.dadosEntradaLocalizados = [];
        this.renderizarTabela();
        document.getElementById('entRemessa').value = "";
    }
};

// Vinculação Global para o Leitor
window.autoBip = (val) => ModuloBipagem.processarBip(val);
