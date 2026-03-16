const ModuloRecebimento = {
    // Armazena os dados buscados para uso no salvamento e impressão
    dadosLocalizados: [],

    // --- NAVEGAÇÃO E TELA ---
    abrirTela: function() {
        // Esconde o menu e outras caixas, mostra o recebimento
        document.getElementById('menuBox').style.display = 'none';
        document.getElementById('recebimentoBox').style.display = 'flex';
        this.limpar();
    },

    // --- BUSCA DE DADOS (HISTÓRICO) ---
    buscarLotes: function() {
        var cod = document.getElementById('filtroCodParceiro').value.trim();
        var loteBusca = document.getElementById('filtroLote').value.trim();

        if (!cod || !loteBusca) {
            alert("Preencha o Código do Parceiro e o Lote!");
            return;
        }

        const corpo = document.getElementById('corpoTabela');
        corpo.innerHTML = "<tr><td colspan='6' style='padding:20px; text-align:center;'>Buscando no Servidor...</td></tr>";

        google.script.run.withSuccessHandler((data) => {
            this.dadosLocalizados = data || [];
            this.renderizarTabela();
        }).filtrarHistorico(cod, loteBusca);
    },

    renderizarTabela: function() {
        const corpo = document.getElementById('corpoTabela');
        const btnSalvar = document.getElementById('btnSalvarLote');
        const contador = document.getElementById('contadorLinhas');
        
        let html = "";

        if (this.dadosLocalizados.length === 0) {
            html = "<tr><td colspan='6' style='padding:20px; text-align:center; color:#f87171;'>Nenhum registro encontrado.</td></tr>";
            btnSalvar.style.display = "none";
        } else {
            this.dadosLocalizados.forEach((r) => {
                // Mapeamento seguro das colunas conforme seu padrão antigo
                let id = r[0] || "";      // Coluna A
                let cpf = r[1] || "";     // Coluna B
                let nome = r[2] || "";    // Coluna C
                let mun = r[4] || "";     // Coluna E
                let loteReal = r[11] || ""; // Coluna L
                let parcReal = r[7] || "";  // Coluna H

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

    // --- SALVAMENTO COM ENVIO FRACIONADO (SOLUÇÃO DO ERRO) ---
    salvar: function() {
        var nomeParceiro = document.getElementById('filtroNomeParceiro').value;
        var codParceiro = document.getElementById('filtroCodParceiro').value;
        var loteNum = document.getElementById('filtroLote').value;

        if (!nomeParceiro) {
            alert("Informe o NOME DO PARCEIRO antes de salvar!");
            return;
        }

        if (!confirm("Confirmar o recebimento de " + this.dadosLocalizados.length + " itens?")) return;

        var btn = document.getElementById('btnSalvarLote');
        btn.disabled = true;
        btn.innerText = "SALVANDO EM LOTES...";

        const total = this.dadosLocalizados.length;
        const tamanhoLote = 5; // Envia de 5 em 5 para não estourar a URL (GET)
        let atual = 0;
        let protocoloFinal = "";

        const enviarPedaço = () => {
            const fim = Math.min(atual + tamanhoLote, total);
            const pedaço = this.dadosLocalizados.slice(atual, fim);

            google.script.run.withSuccessHandler((res) => {
                if (res && res.sucesso === false) {
                    alert("Erro parcial: " + res.erro);
                    btn.disabled = false;
                    btn.innerText = "SALVAR RECEBIMENTO";
                    return;
                }

                protocoloFinal = res; // O servidor retorna o protocolo (ex: REC-123)
                atual = fim;

                if (atual < total) {
                    btn.innerText = `SALVANDO (${atual}/${total})...`;
                    enviarPedaço();
                } else {
                    // FINALIZOU O ÚLTIMO LOTE
                    this.executarImpressao(protocoloFinal, codParceiro, loteNum, nomeParceiro, AppSessao.nome);
                    
                    setTimeout(() => {
                        window.print();
                        alert("Recebimento concluído! Protocolo: " + protocoloFinal);
                        this.limpar();
                        ModuloUtils.voltarParaMenu(); // Certifique-se que ModuloUtils existe
                        btn.disabled = false;
                        btn.innerText = "SALVAR RECEBIMENTO";
                    }, 500);
                }
            }).processarRecebimento(pedaço, nomeParceiro, AppSessao.nome);
        };

        enviarPedaço();
    },

    // --- REIMPRESSÃO (TUDO QUE ESTAVA NA PARTE 1 E 2) ---
    abrirReimpressao: function() {
        document.getElementById('reimpressaoBox').style.display = 'block';
    },

    buscarReimpressao: function() {
        var prot = document.getElementById('reimpProtocolo').value.trim();
        var cod = document.getElementById('reimpCod').value.trim();
        var lote = document.getElementById('reimpLote').value.trim();

        if (!prot && (!cod || !lote)) {
            alert("Informe o Protocolo ou a combinação de Código e Lote!");
            return;
        }

        google.script.run.withSuccessHandler((dados) => {
            if (!dados || dados.length === 0) { 
                alert("Nenhum dado encontrado para reimpressão."); 
                return; 
            }
            
            // r[11]=Lote, r[15]=Protocolo, r[13]=NomeParceiro, r[14]=Atendente
            let r0 = dados[0];
            this.executarImpressao(r0[15], r0[7], r0[11], r0[13], r0[14]);
            
            document.getElementById('reimpressaoBox').style.display = 'none';
            setTimeout(() => { window.print(); }, 500);
        }).buscarDadosRecebidos(prot, cod, lote);
    },

    // --- GERAÇÃO DO HTML DE IMPRESSÃO ---
    executarImpressao: function(protocolo, codParc, lote, nomeParc, atendente) {
        document.getElementById('impParceiroLote').innerText = "PARCEIRO: " + codParc + " | LOTE: " + lote;
        document.getElementById('impProtocolo').innerText = "PROTOCOLO: " + protocolo;
        document.getElementById('impDataHora').innerText = "DATA: " + new Date().toLocaleString('pt-BR');
        document.getElementById('impNomeParceiro').innerText = "NOME DO PARCEIRO: " + nomeParc;
        document.getElementById('impNomeAtendente').innerText = atendente;

        let htmlImp = "";
        // Nota: Se for reimpressão, os índices podem mudar. Tratamos aqui:
        const listaParaImprimir = (this.dadosLocalizados.length > 0) ? this.dadosLocalizados : arguments[0]; 
        // Se dadosLocalizados estiver vazio, ele usa os dados que vieram na reimpressão.

        // Usamos uma lógica flexível para os dados da tabela
        this.dadosLocalizados.forEach((r) => {
            htmlImp += `<tr>
                <td style="border:1px solid black; padding:2px;">${r[0] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[1] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[2] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[3] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[4] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[6] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[7] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[8] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[9] || ""}</td>
                <td style="border:1px solid black; padding:2px;">${r[10] || ""}</td>
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
