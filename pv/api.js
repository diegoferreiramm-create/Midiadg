// ============================================================
// API.JS - CONFIGURAÇÃO CENTRALIZADA
// ============================================================

const API_CONFIG = {
    // Sua URL atual de execução do Apps Script publicada como Web App
    BASE_URL: "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec"
};

window.API_CONFIG = API_CONFIG;

// ============================================================
// FUNÇÃO PARA CHAMAR A API (USANDO POST COM URLSearchParams - IGUAL O LOGIN.JS)
// ============================================================
function chamarAPI(action, dados) {
    return new Promise((resolve, reject) => {
        // Cria o FormData igual ao login.js
        const params = new URLSearchParams();
        params.append('acao', action);  // ← usa 'acao' igual o login.js
        
        // Adiciona os parâmetros
        if (dados) {
            for (var chave in dados) {
                params.append(chave, dados[chave]);
            }
        }
        
        console.log('📡 Chamando API:', API_CONFIG.BASE_URL);
        console.log('📦 Ação:', action);
        console.log('📦 Dados:', params.toString());
        
        fetch(API_CONFIG.BASE_URL, {
            method: 'POST',        // ← POST igual o login.js
            body: params           // ← URLSearchParams igual o login.js
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
