const ModuloMalote = {
    // Lista de itens que farão parte do malote
    dadosMalote: [],

    // --- NAVEGAÇÃO ---
    abrirTela: function() {
        document.getElementById('menuBox').style.display = 'none';
        document.getElementById('maloteBox').style.display = 'flex';
        this.limparCampos();
    },

    // --- BUSCA E ADIÇÃO ---
    buscarParaMalote: function() {
        var cod = document.getElementById('maloteCod').value.trim();
        var lote = document.getElementById('maloteLote').value.trim();

        if (!cod || !lote) {
            alert("Informe Código e Lote para buscar!");
            return;
        }

        google.script.run.withSuccessHandler((data) => {
            if (data && data.length > 0) {
                // Concatena com o que já existe (permite montar malote com vários lotes)
                this.dadosMalote = this.dadosMalote.concat(data);
                this.renderizarTabela();
            } else {
                alert("Nenhum item encontrado ou lote já processado.");
            }
        }).buscarParaNovoMalote(cod, lote);
    },

    // --- INTERFACE E EDIÇÃO ---
    renderizarTabela: function() {
        const corpo = document.getElementById('corpoMalote');
        let html = "";

        this.dadosMalote.forEach((item, index) => {
            // item[0]=ID, item[2]=Nome, item[4]=Municipio
            html += `<tr style="border-bottom: 1px solid #334155;">
                <td style="padding:8px;">${item[0]}</td> 
                <td>${item[2]}</td> 
                <td>${item[4]}</td> 
                <td style="text-align:center;">
                    <button onclick="ModuloMalote.removerLinha(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">✕</button>
                </td>
            </tr>`;
        });

        corpo.innerHTML = html;
        document.getElementById('contagemMalote').innerText = "Itens no Malote: " + this.dadosMalote.length;
    },

    removerLinha: function(index) {
        if(confirm("Remover este item do malote?")) {
            this.dadosMalote.splice(index, 1);
            this.renderizarTabela();
        }
    },

    // --- FECHAMENTO E SALVAMENTO (COM FATIAMENTO) ---
    salvarEImprimir: function() {
        const destino = document.getElementById('maloteDestino').value;
        if (this.dadosMalote.length === 0) {
            alert("O malote está vazio!");
            return;
        }
        if (!destino) {
            alert("Informe o destino do malote!");
            return;
        }

        if (!confirm("Deseja finalizar este malote com " + this.dadosMalote.length + " itens?")) return;

        const btn = document.querySelector("#maloteBox button[onclick*='salvarEImprimir']");
        btn.disabled = true;
        btn.innerText = "FECHANDO MALOTE...";

        const total = this.dadosMalote.length;
        const tamanhoLote = 5; 
        let atual = 0;
        let protocoloGerado = "";

        const enviarPedaçoMalote = () => {
            const fim = Math.min(atual + tamanhoLote, total);
            const pedaço = this.dadosMalote.slice(atual, fim);

            google.script.run.withSuccessHandler((res) => {
                protocoloGerado = res;
                atual = fim;

                if (atual < total) {
                    btn.innerText = `PROCESSANDO (${atual}/${total})...`;
                    enviarPedaçoMalote();
                } else {
                    // FINALIZOU TUDO
                    this.prepararImpressao(protocoloGerado, destino, this.dadosMalote, AppSessao.nome);
                    
                    setTimeout(() => {
                        window.print();
                        alert("Malote Fechado com Sucesso! Protocolo: " + protocoloGerado);
                        this.limparCampos();
                        ModuloUtils.voltarParaMenu();
                        btn.disabled = false;
                        btn.innerText = "FINALIZAR E IMPRIMIR";
                    }, 500);
                }
            }).gravarMaloteFinal(pedaço, destino, AppSessao.nome);
        };

        enviarPedaçoMalote();
    },

    // --- REIMPRESSÃO DE MALOTE (TUDO DA PARTE 1) ---
    abrirReimpressao: function() {
        document.getElementById('reimpressaoMaloteBox').style.display = 'block';
    },

    buscarReimpressao: function() {
        const prot = document.getElementById('reimpMaloteProt').value.trim();
        if (!prot) return alert("Informe o protocolo do malote!");

        google.script.run.withSuccessHandler((dados) => {
            if (!dados || dados.length === 0) return alert("Malote não encontrado.");
            
            // Assume que dados[0][12] é o destino e dados[0][13] é o atendente no histórico de malotes
            this.prepararImpressao(prot, dados[0][12] || "DESTINO", dados, dados[0][13] || "S/A");
            
            document.getElementById('reimpressaoMaloteBox').style.display = 'none';
            setTimeout(() => { window.print(); }, 500);
        }).buscarDadosMaloteGeral(prot, "", "");
    },

    // --- HTML DE IMPRESSÃO ---
    prepararImpressao: function(protocolo, destino, listaItens, atendente) {
        document.getElementById('impProtocolo').innerText = "MALOTE: " + protocolo;
        document.getElementById('impParceiroLote').innerText = "DESTINO: " + destino.toUpperCase();
        document.getElementById('impDataHora').innerText = "EMISSÃO: " + new Date().toLocaleString('pt-BR');
        document.getElementById('impNomeAtendente').innerText = atendente.toUpperCase();

        let htmlImp = "";
        listaItens.forEach(item => {
            htmlImp += `<tr>
                <td style="border:1px solid black; padding:2px;">${item[0] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${item[1] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${item[2] || ""}</td>
                <td colspan="7" style="border:1px solid black; padding:2px; text-align:center;">CONFERIDO NO MALOTE</td>
            </tr>`;
        });
        document.getElementById('corpoImpressao').innerHTML = htmlImp;
    },

    limparCampos: function() {
        this.dadosMalote = [];
        const corpo = document.getElementById('corpoMalote');
        if(corpo) corpo.innerHTML = "";
        document.getElementById('maloteCod').value = "";
        document.getElementById('maloteLote').value = "";
        document.getElementById('maloteDestino').value = "";
        document.getElementById('contagemMalote').innerText = "Itens no Malote: 0";
    }
};
