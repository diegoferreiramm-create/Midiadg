// ============================================================
// API.JS - CONFIGURAÇÃO CENTRALIZADA (ESTILO CARTEIRAS)
// ============================================================

const API_CONFIG = {
    // Sua URL atual de execução do Apps Script publicada como Web App
    BASE_URL: "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec"
};

window.API_CONFIG = API_CONFIG;

// ============================================================
// FUNÇÃO PARA CHAMAR A API (ESTILO CARTEIRAS - GET)
// ============================================================
function chamarAPI(action, dados) {
    return new Promise((resolve, reject) => {
        // CONSTRÓI A URL COM PARÂMETROS (ESTILO CARTEIRAS)
        var url = API_CONFIG.BASE_URL + '?action=' + encodeURIComponent(action);
        
        if (dados) {
            for (var chave in dados) {
                url += '&' + encodeURIComponent(chave) + '=' + encodeURIComponent(dados[chave]);
            }
        }
        
        console.log('📡 Chamando API (GET):', url);
        
        // CHAMADA GET (ESTILO CARTEIRAS)
        fetch(url, {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
}
