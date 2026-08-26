// ============================================================
// API.JS - CONFIGURAÇÃO CENTRALIZADA
// ============================================================

const API_CONFIG = {
    BASE_URL: "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec"
};

window.API_CONFIG = API_CONFIG;

// ============================================================
// FUNÇÃO PARA LEITURA (GET) - IGUAL AO CARTEIRAS
// ============================================================
function chamarAPI_GET(action, dados) {
    return new Promise((resolve, reject) => {
        var url = API_CONFIG.BASE_URL + '?action=' + encodeURIComponent(action);
        
        if (dados) {
            for (var chave in dados) {
                url += '&' + encodeURIComponent(chave) + '=' + encodeURIComponent(dados[chave]);
            }
        }
        
        console.log('📡 GET:', url);
        
        fetch(url, { method: 'GET' })
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(resolve)
            .catch(reject);
    });
}

// ============================================================
// FUNÇÃO PARA ESCRITA (POST) - IGUAL AO LOGIN
// ============================================================
function chamarAPI_POST(action, dados) {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('acao', action);
        
        if (dados) {
            for (var chave in dados) {
                params.append(chave, dados[chave]);
            }
        }
        
        console.log('📡 POST:', API_CONFIG.BASE_URL);
        console.log('📦 Dados:', params.toString());
        
        fetch(API_CONFIG.BASE_URL, {
            method: 'POST',
            body: params
        })
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
}
