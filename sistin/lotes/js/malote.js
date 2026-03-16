const ModuloMalote = {
    // Lista de itens que farão parte do malote
    dadosMalote: [],

    // Abre a tela de malote
    abrirTela: function() {
        document.getElementById('menuBox').style.display = 'none';
        document.getElementById('maloteBox').style.display = 'flex';
        this.limparCampos();
    },

    // Busca itens específicos para adicionar ao malote
    buscarParaMalote: function() {
        var cod = document.getElementById('maloteCod').value;
        var lote = document.getElementById('maloteLote').value;

        if (!cod || !lote) {
            alert("Informe Código e Lote para buscar!");
            return;
        }

        google.script.run.withSuccessHandler((data) => {
            if (data && data.length > 0) {
                this.dadosMalote = data;
                this.renderizarTabela();
            } else {
                alert("Nenhum item encontrado para este Malote.");
            }
        }).buscarParaNovoMalote(cod, lote);
    },

    // Renderiza a tabela de conferência do malote
    renderizarTabela: function() {
        const corpo = document.getElementById('corpoMalote');
        let html = "";

        this.dadosMalote.forEach((item, index) => {
            html += `<tr style="border-bottom: 1px solid #334155;">
                <td style="padding:8px;">${item[0]}</td> <td>${item[2]}</td> <td>${item[4]}</td> <td style="text-align:center;">
                    <button onclick="ModuloMalote.removerLinha(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button>
                </td>
            </tr>`;
        });

        corpo.innerHTML = html;
        document.getElementById('contagemMalote').innerText = "Itens no Malote: " + this.dadosMalote.length;
    },

    // Remove um item específico antes de fechar o malote
    removerLinha: function(index) {
        this.dadosMalote.splice(index, 1);
        this.renderizarTabela();
    },

    // Finaliza o malote, salva no banco e gera o protocolo de impressão
    salvarEImprimir: function() {
        if (this.dadosMalote.length === 0) {
            alert("O malote está vazio!");
            return;
        }

        const destino = document.getElementById('maloteDestino').value;
        if (!destino) {
            alert("Informe o destino do malote!");
            return;
        }

        if (!confirm("Deseja finalizar e imprimir este malote?")) return;

        google.script.run.withSuccessHandler((protocolo) => {
            // Preenche o protocolo de impressão (Parte que você não quer perder)
            this.prepararImpressao(protocolo, destino);
            
            setTimeout(() => {
                window.print(); // Dispara a impressão do protocolo
                alert("Malote Fechado! Protocolo: " + protocolo);
                this.dadosMalote = [];
                ModuloUtils.voltarParaMenu();
            }, 500);
        }).gravarMaloteFinal(this.dadosMalote, destino, AppSessao.nome);
    },

    // Alimenta o HTML de impressão com os dados do malote
    prepararImpressao: function(protocolo, destino) {
        document.getElementById('impProtocolo').innerText = "MALOTE: " + protocolo;
        document.getElementById('impParceiroLote').innerText = "DESTINO: " + destino.toUpperCase();
        document.getElementById('impDataHora').innerText = "EMISSÃO: " + new Date().toLocaleString('pt-BR');
        document.getElementById('impNomeAtendente').innerText = AppSessao.nome.toUpperCase();

        let htmlImp = "";
        this.dadosMalote.forEach(item => {
            htmlImp += `<tr>
                <td style="border:1px solid black; padding:2px;">${item[0]}</td>
                <td style="border:1px solid black; padding:2px;">${item[1]}</td>
                <td style="border:1px solid black; padding:2px;">${item[2]}</td>
                <td colspan="7" style="border:1px solid black; padding:2px; text-align:center;">CONFERIDO</td>
            </tr>`;
        });
        document.getElementById('corpoImpressao').innerHTML = htmlImp;
    },

    limparCampos: function() {
        this.dadosMalote = [];
        document.getElementById('corpoMalote').innerHTML = "";
        document.getElementById('maloteCod').value = "";
        document.getElementById('maloteLote').value = "";
        document.getElementById('maloteDestino').value = "";
    }
};
