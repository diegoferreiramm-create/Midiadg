const ModuloRecebimento = {
    // Variável interna: só este módulo mexe nestes dados buscados
    dadosLocalizados: [],

    // Abre a tela de recebimento
    abrirTela: function() {
        document.getElementById('menuBox').style.display = 'none';
        document.getElementById('recebimentoBox').style.display = 'flex';
    },

    // Executa a busca no servidor (.gs)
    buscarLotes: function() {
        var cod = document.getElementById('filtroCodParceiro').value;
        var loteBusca = document.getElementById('filtroLote').value;

        if (!cod || !loteBusca) {
            alert("Preencha o Código do Parceiro e o Lote!");
            return;
        }

        const corpo = document.getElementById('corpoTabela');
        corpo.innerHTML = "<tr><td colspan='6' style='padding:20px; text-align:center;'>Buscando...</td></tr>";

        google.script.run.withSuccessHandler((data) => {
            this.dadosLocalizados = data; // Armazena os dados dentro do módulo
            this.renderizarTabela();
        }).filtrarHistorico(cod, loteBusca);
    },

    // Desenha a tabela na tela
    renderizarTabela: function() {
        const corpo = document.getElementById('corpoTabela');
        const btnSalvar = document.getElementById('btnSalvarLote');
        const contador = document.getElementById('contadorLinhas');
        
        var html = "";

        if (!this.dadosLocalizados || this.dadosLocalizados.length === 0) {
            html = "<tr><td colspan='6' style='padding:20px; text-align:center; color:#f87171;'>Nenhum registro encontrado.</td></tr>";
            btnSalvar.style.display = "none";
        } else {
            this.dadosLocalizados.forEach((r) => {
                // Função auxiliar interna para evitar campos nulos
                const getVal = (obj, nomes, index) => {
                    if (!obj || Array.isArray(obj)) return obj[index] || "";
                    for (let key in obj) {
                        if (nomes.includes(key.toUpperCase().trim())) return obj[key];
                    }
                    return "";
                };

                let id = getVal(r, ["ID"], 0);
                let cpf = getVal(r, ["CPF"], 1);
                let nome = getVal(r, ["NOME"], 2);
                let mun = getVal(r, ["MUNICIPIO", "MUN"], 4);
                let loteReal = getVal(r, ["LOTE", "NUMLOTE"], 11);
                let parcReal = getVal(r, ["PARCEIRO", "PARC"], 7);

                html += `<tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 10px;">${id}</td>
                    <td>${cpf}</td>
                    <td>${nome}</td>
                    <td>${mun}</td>
                    <td style="font-weight: bold; color: #fbbf24;">${loteReal}</td> 
                    <td>${parcReal}</td>
                </tr>`;
            });
            btnSalvar.style.display = "block";
        }
        
        corpo.innerHTML = html;
        contador.innerText = "Total: " + this.dadosLocalizados.length + " registros";
    },

    // Processa o salvamento e gera a impressão
    salvar: function() {
        var nomeParceiro = document.getElementById('filtroNomeParceiro').value;
        var codParceiro = document.getElementById('filtroCodParceiro').value;
        var loteNum = document.getElementById('filtroLote').value;

        if (!nomeParceiro) {
            alert("Informe o NOME DO PARCEIRO antes de salvar!");
            return;
        }

        if (!confirm("Confirmar o recebimento?")) return;

        var btn = document.getElementById('btnSalvarLote');
        btn.disabled = true;
        btn.innerText = "SALVANDO...";

        google.script.run.withSuccessHandler((res) => {
            if (res.sucesso === false) {
                alert("Erro ao salvar: " + res.erro);
                btn.disabled = false;
                btn.innerText = "SALVAR RECEBIMENTO";
                return;
            }

            // 'res' aqui é o protocolo gerado
            this.executarImpressao(res, codParceiro, loteNum, nomeParceiro);
            
            setTimeout(() => {
                window.print();
                alert("Sucesso! Protocolo: " + res);
                ModuloUtils.voltarParaMenu(); // Chama a navegação global
                btn.disabled = false;
                btn.innerText = "SALVAR RECEBIMENTO";
            }, 500);
        }).processarRecebimento(this.dadosLocalizados, nomeParceiro, AppSessao.nome);
    },

    // Prepara o HTML oculto de impressão
    executarImpressao: function(protocolo, codParc, lote, nomeParc) {
        document.getElementById('impParceiroLote').innerText = "PARCEIRO: " + codParc + " | LOTE: " + lote;
        document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + protocolo;
        document.getElementById('impDataHora').innerText = "DATA: " + new Date().toLocaleString('pt-BR');
        document.getElementById('impNomeParceiro').innerText = "NOME DO PARCEIRO: " + nomeParc;
        document.getElementById('impNomeAtendente').innerText = AppSessao.nome;

        var htmlImp = "";
        this.dadosLocalizados.forEach(function(r) {
            htmlImp += `<tr>
                <td style="border:1px solid black; padding:2px;">${r[0] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[1] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[2] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[3] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[4] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[6] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[7] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[8] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[9] || "---"}</td>
                <td style="border:1px solid black; padding:2px;">${r[10] || "---"}</td>
            </tr>`;
        });
        document.getElementById('corpoImpressao').innerHTML = htmlImp;
    },

    limpar: function() {
        this.dadosLocalizados = [];
        document.getElementById('corpoTabela').innerHTML = "";
        document.getElementById('contadorLinhas').innerText = "Total: 0 registros";
        document.getElementById('btnSalvarLote').style.display = "none";
        document.getElementById('filtroCodParceiro').value = "";
        document.getElementById('filtroLote').value = "";
        document.getElementById('filtroNomeParceiro').value = "";
    }
};
