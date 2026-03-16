// --- CONFIGURAÇÃO GLOBAL ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby0Ls9ct32TDn6N1x7n3w5gMByQRUYRr7izo-0RtbKFqie3KYYAAtWuJLi2MRKbDc1F/exec";
const TOKEN_SECRETO = "MACRO@MACRO";

const AppSessao = {
    nome: "",
    parceiro: "",
    clicouSair: false,
    intervaloRelogio: null
};

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
            // No seu js/config.js
            call: function(functionName, args) {
                const self = this;
                const payload = {
                    action: functionName,
                    args: args,
                    token: TOKEN_SECRETO
                };
            
                fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
                .then(res => res.json()) // O login precisa ler o JSON de retorno!
                .then(data => {
                    if (self.callback) self.callback(data);
                })
                .catch(err => {
                    console.error("Erro na comunicação:", err);
                    if (self.failCallback) self.failCallback(err);
                });
            },
            
            validarLogin: function(u, p) { this.call("validarLogin", [u, p]); },
            filtrarHistorico: function(c, l) { this.call("filtrarHistorico", [c, l]); },
            processarRecebimento: function(a, b, c) { this.call("processarRecebimento", [a, b, c]); },
            carregarDadosProducao: function() { this.call("carregarDadosProducao", []); },
            gravarEntradaNoServidor: function(a, b, c) { this.call("gravarEntradaNoServidor", [a, b, c]); },
            buscarParaNovoMalote: function(a, b) { this.call("buscarParaNovoMalote", [a, b]); },
            gravarMaloteFinal: function(a, b, c) { this.call("gravarMaloteFinal", [a, b, c]); }
        }
    }
};
