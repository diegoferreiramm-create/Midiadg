const ModuloBipagem = {
    cacheGrafica: [],      // Dados carregados da "Base Produção" para validar o bip
    dadosEntradaLocalizados: [], // Itens que foram bipados com sucesso

    // 1. Inicia o módulo, limpa variáveis e carrega o cache do servidor
    abrirTela: function() {
        document.getElementById('menuBox').style.display = 'none';
        document.getElementById('entradaBox').style.display = 'flex';
        
        const input = document.getElementById('inputBipagem');
        input.disabled = true;
        input.placeholder = "Carregando base...";

        // Busca a base de dados para validação (Cache)
        google.script.run.withSuccessHandler((dados) => {
            this.cacheGrafica = dados || [];
            input.disabled = false;
            input.placeholder = "Bipe a carteira aqui...";
            input.focus();
            console.log("Cache da gráfica carregado: " + this.cacheGrafica.length + " itens.");
        }).carregarDadosProducao();
    },

    // 2. Processa o valor vindo do leitor (ou teclado)
    processarBip: function(valor) {
        if (!valor || valor.length < 8) return;

        // Procura o item no cache (coluna 0 costuma ser o ID/Código)
        const itemEncontrado = this.cacheGrafica.find(r => 
            r[0].toString().trim() === valor.trim() || 
            (r[0].toString().includes(valor.trim()))
        );

        if (itemEncontrado) {
            // Verifica se já foi bipado nesta sessão para não duplicar
            const jaExiste = this.dadosEntradaLocalizados.some(d => d[0] === itemEncontrado[0]);
            
            if (jaExiste) {
                alert("Item já bipado nesta lista!");
            } else {
                // Adiciona ao topo da lista (unshift) para o usuário ver o último bipado primeiro
                this.dadosEntradaLocalizados.unshift([...itemEncontrado]);
                this.renderizarTabela();
                ModuloUtils.tocarSomSucesso(); // Função opcional de feedback sonoro
            }
        } else {
            alert("Código " + valor + " não localizado na base da gráfica!");
            ModuloUtils.tocarSomErro();
        }

        // Limpa o campo para o próximo bip
        document.getElementById('inputBipagem').value = "";
        document.getElementById('inputBipagem').focus();
    },

    // 3. Atualiza a tabela de conferência na tela
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

    // 4. Remove um item caso tenha sido bipado errado
    removerItem: function(index) {
        this.dadosEntradaLocalizados.splice(index, 1);
        this.renderizarTabela();
    },

    // 5. Salva a remessa no servidor e gera o protocolo
    salvar: function() {
        if (this.dadosEntradaLocalizados.length === 0) {
            alert("Nenhum item bipado para salvar!");
            return;
        }

        const remessa = document.getElementById('entRemessa').value || "S/N";
        const btn = document.getElementById('btnSalvarEntrada');
        
        btn.disabled = true;
        btn.innerText = "PROCESSANDO...";

        google.script.run.withSuccessHandler((protocolo) => {
            alert("Entrada Salva! Protocolo: " + protocolo);
            
            // Limpa tudo após sucesso
            this.dadosEntradaLocalizados = [];
            document.getElementById('entRemessa').value = "";
            
            btn.disabled = false;
            btn.innerText = "SALVAR ENTRADA";
            
            ModuloUtils.voltarParaMenu();
        }).gravarEntradaNoServidor(this.dadosEntradaLocalizados, remessa, AppSessao.nome);
    }
};

// Vinculação para o leitor de código de barras (chamada global do index)
window.autoBip = (val) => ModuloBipagem.processarBip(val);
