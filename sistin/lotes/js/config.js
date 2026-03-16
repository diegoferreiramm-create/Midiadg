// --- CONFIGURAÇÃO GLOBAL ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby0Ls9ct32TDn6N1x7n3w5gMByQRUYRr7izo-0RtbKFqie3KYYAAtWuJLi2MRKbDc1F/exec";
const TOKEN_SECRETO = "MACRO@MACRO";

// Objeto para centralizar os dados da sessão
const AppSessao = {
    nome: "",
    parceiro: "",
    clicouSair: false,
    intervaloRelogio: null
};

// A "Ponte" google.script.run - RECONSTRUÍDA PARA SER TOTALMENTE COMPATÍVEL
const google = {
    script: {
        run: {
            withSuccessHandler: function(callback) { 
                this.callback = callback; 
                return this; 
            },
            withFailureHandler: function(fail) { 
                this.failCallback = fail; 
                return this; 
            },
            // Função centralizadora de chamadas (Mantendo o GET para não quebrar o Login)
            call: function(functionName, args) {
                const self = this;
                const urlFinal = WEB_APP_URL + "?action=" + functionName + "&args=" + encodeURIComponent(JSON.stringify(args)) + "&token=" + TOKEN_SECRETO;

                fetch(urlFinal, {
                    method: 'GET',
                    mode: 'cors',
                    redirect: 'follow'
                })
                .then(res => res.json())
                .then(data => {
                    if (self.callback) self.callback(data);
                })
                .catch(err => {
                    console.error("Erro na comunicação:", err);
                    if (self.failCallback) self.failCallback(err);
                });
            },
            
            // --- MAPEAMENTO COMPLETO DE TODAS AS FUNÇÕES DO SEU .GS ---
            validarLogin: function(u, p) { this.call("validarLogin", [u, p]); },
            filtrarHistorico: function(c, l) { this.call("filtrarHistorico", [c, l]); },
            processarRecebimento: function(a, b, c) { this.call("processarRecebimento", [a, b, c]); },
            carregarDadosProducao: function() { this.call("carregarDadosProducao", []); },
            gravarEntradaNoServidor: function(a, b, c) { this.call("gravarEntradaNoServidor", [a, b, c]); },
            buscarParaNovoMalote: function(a, b) { this.call("buscarParaNovoMalote", [a, b]); },
            gravarMaloteFinal: function(a, b, c) { this.call("gravarMaloteFinal", [a, b, c]); },
            
            // Funções de Reimpressão e Consulta que estavam faltando no seu novo config:
            buscarDadosRecebidos: function(p, c, l) { this.call("buscarDadosRecebidos", [p, c, l]); },
            buscarDadosMaloteGeral: function(p, c, l) { this.call("buscarDadosMaloteGeral", [p, c, l]); },
            buscarResumoBipagemV2: function() { this.call("buscarResumoBipagemV2", []); },
            buscarItensBipagemPorProtocolo: function(a) { this.call("buscarItensBipagemPorProtocolo", [a]); },
            registrarAcaoNoLog: function(u, p, a, i) { this.call("registrarAcaoNoLog", [u, p, a, i]); },
            cadastrarNoServidor: function(u, p, n, pc) { this.call("cadastrarNoServidor", [u, p, n, pc]); }
        }
    }
};
