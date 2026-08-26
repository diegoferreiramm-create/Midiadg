// ============================================================
// API.JS - CONFIGURAÇÃO CENTRALIZADA (ESTILO CARTEIRAS - GET)
// ============================================================

const API_CONFIG = {
    BASE_URL: "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec"
};

window.API_CONFIG = API_CONFIG;

// ============================================================
// FUNÇÃO PARA CHAMAR A API (GET PURO - IGUAL AO CARTEIRAS)
// ============================================================
function chamarAPI(action, dados) {
    return new Promise((resolve, reject) => {
        // CONSTRÓI A URL (IGUAL AO CARTEIRAS)
        var url = API_CONFIG.BASE_URL + '?action=' + encodeURIComponent(action);
        
        if (dados) {
            for (var chave in dados) {
                url += '&' + encodeURIComponent(chave) + '=' + encodeURIComponent(dados[chave]);
            }
        }
        
        console.log('📡 Chamando API (GET):', url);
        
        // ==========================================
        // 🔥 GET PURO - IGUAL AO CARTEIRAS
        // ==========================================
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
