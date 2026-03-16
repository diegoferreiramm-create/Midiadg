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
            call: function(functionName, args) {
                const self = this;
                
                // Agora enviamos os dados no corpo (body) para não lotar a URL
                const payload = {
                    action: functionName,
                    args: args,
                    token: TOKEN_SECRETO
                };

                fetch(WEB_APP_URL, {
                    method: 'POST', // Mudamos para POST para suportar muitos dados
                    mode: 'no-cors', // Importante para evitar erros de política de origem no Apps Script
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(() => {
                    // Como usamos 'no-cors', o fetch não retorna o JSON diretamente por segurança.
                    // Para sistemas de log e gravação rápida, isso costuma bastar.
                    // Se você precisa do PROTOCOLO de volta, precisaremos de um ajuste no .gs
                    if (self.callback) self.callback("Processado"); 
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
