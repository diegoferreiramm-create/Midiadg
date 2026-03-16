const ModuloRecebimento = {
    dadosLocalizados: [],

    // --- NAVEGAÇÃO ---
    abrirTela: function() {
        document.getElementById('menuBox').style.display = 'none';
        document.getElementById('recebimentoBox').style.display = 'flex';
        this.limparBusca();
    },

    limparBusca: function() {
        this.dadosLocalizados = [];
        document.getElementById('corpoTabela').innerHTML = "";
        document.getElementById('contadorLinhas').innerText = "Total: 0 registros";
        document.getElementById('btnSalvarLote').style.display = "none";
        document.getElementById('filtroCodParceiro').value = "";
        document.getElementById('filtroLote').value = "";
        document.getElementById('filtroNomeParceiro').value = "";
    },

    // --- BUSCA DE DADOS ---
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
            this.dadosLocalizados = data; 
            var html = "";

            if (!data || data.length === 0) {
                html = "<tr><td colspan='6' style='padding:20px; text-align:center; color:#f87171;'>Nenhum registro encontrado.</td></tr>";
                document.getElementById('btnSalvarLote').style.display = "none";
            } else {
                data.forEach((r) => {
                    // Função de busca interna mantida exatamente como a sua
                    function getVal(obj, nomes) {
                        if (!obj || Array.isArray(obj)) return null; 
                        for (let key in obj) {
                            let k = key.toUpperCase().trim();
                            if (nomes.includes(k)) return obj[key];
                        }
                        return null;
                    }

                    let id    = getVal(r, ["ID"]) || r[0] || "";  
                    let cpf   = getVal(r, ["CPF"]) || r[1] || ""; 
                    let nome  = getVal(r, ["NOME"]) || r[2] || ""; 
                    let mun   = getVal(r, ["MUNICIPIO", "MUN"]) || r[4] || ""; 
                    let loteReal = getVal(r, ["LOTE", "NUMLOTE"]) || r[11] || ""; 
                    let parcReal = getVal(r, ["PARCEIRO", "PARC"]) || r[7] || "";  

                    html += `<tr style="border-bottom: 1px solid #1e293b;">
                        <td style="padding: 10px;">${id}</td>
                        <td>${cpf}</td>
                        <td>${nome}</td>
                        <td>${mun}</td>
                        <td style="font-weight: bold; color: #fbbf24;">${loteReal}</td> 
                        <td>${parcReal}</td>
                    </tr>`;
                });
                document.getElementById('btnSalvarLote').style.display = "block";
            }
            corpo.innerHTML = html;
            document.getElementById('contadorLinhas').innerText = "Total: " + data.length + " registros";
        }).filtrarHistorico(cod, loteBusca);
    },

    // --- SALVAMENTO ---
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

            var protocolo = res; 
            this.prepararImpressao(protocolo, codParceiro, loteNum, nomeParceiro, AppSessao.nome, this.dadosLocalizados);

            setTimeout(() => {
                window.print();
                alert("Sucesso! Protocolo: " + protocolo);
                ModuloUtils.voltarParaMenu();
                btn.disabled = false;
                btn.innerText = "SALVAR RECEBIMENTO";
            }, 500);
        }).processarRecebimento(this.dadosLocalizados, nomeParceiro, AppSessao.nome);
    },

    // --- REIMPRESSÃO ---
    abrirReimpressao: function() {
        const modal = document.getElementById('reimpressaoBox');
        if (modal) {
            modal.style.display = 'block';
        } else {
            alert("A tela de reimpressão não foi encontrada no HTML!");
        }
    },

    buscarReimpressao: function() {
        var prot = document.getElementById('reimpProtocolo').value;
        var cod = document.getElementById('reimpCod').value;
        var lote = document.getElementById('reimpLote').value;

        google.script.run.withSuccessHandler((dados) => {
            if (!dados || dados.length === 0) { alert("Nada encontrado."); return; }
            
            this.prepararImpressao(dados[0][15], dados[0][7], dados[0][11], dados[0][13], dados[0][14], dados);
            
            document.getElementById('reimpressaoBox').style.display = 'none';
            setTimeout(() => { window.print(); }, 500);
        }).buscarDadosRecebidos(prot, cod, lote);
    },

    // --- AUXILIAR DE IMPRESSÃO (Unificada para Salvar e Reimprimir) ---
    prepararImpressao: function(protocolo, codParceiro, loteNum, nomeParceiro, atendente, lista) {
        document.getElementById('impParceiroLote').innerText = "PARCEIRO: " + codParceiro + " | LOTE: " + loteNum;
        document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + protocolo;
        document.getElementById('impDataHora').innerText = "DATA: " + new Date().toLocaleString('pt-BR');
        document.getElementById('impNomeParceiro').innerText = "NOME DO PARCEIRO: " + nomeParceiro;
        document.getElementById('impNomeAtendente').innerText = atendente;

        var htmlImp = "";
        lista.forEach((r) => {
            // Mapeamento idêntico ao seu original
            let d_id    = r.id || r[0] || "---";
            let d_cpf   = r.cpf || r[1] || "---";
            let d_nome  = r.nome || r[2] || "---";
            let d_nasc  = r.nasc || r[3] || "---";
            let d_mun   = r.municipio || r[4] || "---";
            let d_via   = r.via || r[6] || "---";
            let d_parc  = r.parceiro || r[7] || "---";
            let d_data  = r.data || r[8] || "---";
            let d_atend = r.atendente || r[9] || "---";
            let d_bol   = r.boleto || r[10] || "---";

            htmlImp += `<tr>
                <td style="border:1px solid black; padding:2px;">${d_id}</td>
                <td style="border:1px solid black; padding:2px;">${d_cpf}</td>
                <td style="border:1px solid black; padding:2px;">${d_nome}</td>
                <td style="border:1px solid black; padding:2px;">${d_nasc}</td>
                <td style="border:1px solid black; padding:2px;">${d_mun}</td>
                <td style="border:1px solid black; padding:2px;">${d_via}</td>
                <td style="border:1px solid black; padding:2px;">${d_parc}</td>
                <td style="border:1px solid black; padding:2px;">${d_data}</td>
                <td style="border:1px solid black; padding:2px;">${d_atend}</td>
                <td style="border:1px solid black; padding:2px;">${d_bol}</td>
            </tr>`;
        });
        document.getElementById('corpoImpressao').innerHTML = htmlImp;
    }
};
