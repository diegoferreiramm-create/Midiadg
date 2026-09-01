// ============================================================
// API.JS - CONFIGURAÇÃO CENTRALIZADA
// ============================================================

const API_CONFIG = {

    BASE_URL:
        "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec"

};

window.API_CONFIG = API_CONFIG;


// ============================================================
// GET
// ============================================================

function chamarAPI_GET(acao, dados) {

    return new Promise((resolve, reject) => {

        var url =
            API_CONFIG.BASE_URL +
            "?acao=" +
            encodeURIComponent(acao);


        if (dados) {

            for (var chave in dados) {

                url +=
                    "&" +
                    encodeURIComponent(chave) +
                    "=" +
                    encodeURIComponent(dados[chave]);
            }
        }


        console.log("📡 GET:", url);


        fetch(url, {
            method: "GET"
        })

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "HTTP " + response.status
                );
            }

            return response.json();
        })

        .then(resolve)
        .catch(reject);

    });
}


// ============================================================
// POST
// ============================================================

function chamarAPI_POST(acao, dados) {

    return new Promise((resolve, reject) => {

        var params =
            new URLSearchParams();


        params.append("acao", acao);


        if (dados) {

            for (var chave in dados) {

                var valor = dados[chave];


                // Arrays
                if (Array.isArray(valor)) {

                    valor =
                        JSON.stringify(valor);
                }


                // Objetos
                else if (
                    typeof valor === "object" &&
                    valor !== null
                ) {

                    valor =
                        JSON.stringify(valor);
                }


                params.append(
                    chave,
                    valor == null ? "" : String(valor)
                );
            }
        }

        fetch(API_CONFIG.BASE_URL, {

            method: "POST",
            body: params

        })

        .then(async response => {

            if (!response.ok) {

                throw new Error(
                    "HTTP " + response.status
                );
            }


            var texto =
                await response.text();


            console.log(
                "📥 Resposta:",
                texto
            );


            if (!texto) {

                throw new Error(
                    "Servidor retornou resposta vazia."
                );
            }


            try {

                return JSON.parse(texto);

            } catch (erro) {

                console.error(
                    "Resposta não é JSON:",
                    texto
                );

                throw new Error(
                    "Servidor não retornou JSON válido."
                );
            }

        })

        .then(resolve)
        .catch(reject);

    });
}