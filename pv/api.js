// ============================================================
// API.JS - CONFIGURAÇÃO CENTRALIZADA
// ============================================================

const API_CONFIG = {
    // Sua URL atual de execução do Apps Script publicada como Web App
    BASE_URL: "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec"
};

window.API_CONFIG = API_CONFIG;

// ============================================================
// FUNÇÃO PARA CHAMAR A API (USANDO A MESMA LÓGICA DO SEU OUTRO PROJETO)
// ============================================================
function chamarAPI(action, dados) {
    return new Promise((resolve, reject) => {
        var url = API_CONFIG.BASE_URL;
        
        // Se já tem '?', adiciona &, senão adiciona ?
        var separador = url.includes('?') ? '&' : '?';
        url += separador + 'action=' + encodeURIComponent(action);
        
        // Adiciona os parâmetros na URL (GET)
        if (dados) {
            for (var chave in dados) {
                url += '&' + encodeURIComponent(chave) + '=' + encodeURIComponent(dados[chave]);
            }
        }
        
        console.log('📡 Chamando API:', url);
        
        fetch(url, {
            method: 'GET',  // Usando GET como no seu outro projeto
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(resolve)
        .catch(reject);
    });
}