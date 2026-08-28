document.addEventListener('DOMContentLoaded', function() {
    // 🔒 Trava de segurança: Impede acesso direto sem passar pelo login/menu
    const nomeUsuario = localStorage.getItem('pv43_nome_usuario');
    const tipoUsuario = localStorage.getItem('pv43_tipo_usuario');

    if (!nomeUsuario) {
        alert('Acesso restrito! Redirecionando para a tela de login.');
        window.location.href = 'pv43.html';
        return;
    }

    let numeroCha = '';
    let numeroSec = '';

    if (tipoUsuario === 'admin') {
        numeroCha = nomeUsuario;
        document.getElementById('info-responsavel').innerText = `Cadastrando via Administrador: ${nomeUsuario}`;
    } else {
        numeroSec = nomeUsuario;
        document.getElementById('info-responsavel').innerText = `Cadastrando via Operador: ${nomeUsuario}`;
    }

    // ==========================================
    // ✅ CONTROLE DOS RADIO BUTTONS (NÍVEL DE ATUAÇÃO)
    // ==========================================
    const radiosNivel = document.querySelectorAll('.nivel-radio');
    const spanNivelSelecionado = document.getElementById('nivel-selecionado');

    radiosNivel.forEach(function(radio) {
        radio.addEventListener('change', function() {
            const valor = this.value;
            const textos = {
                '1': '🟩 NÍVEL 1 (COMUM)',
                '2': '🟩 NÍVEL 2 (RELEVANTE)',
                '3': '🟩 NÍVEL 3 (LÍDER)'
            };
            const cores = {
                '1': '#8bc34a',
                '2': '#4caf50',
                '3': '#1b5e20'
            };
            spanNivelSelecionado.innerText = `✅ Selecionado: ${textos[valor] || valor}`;
            spanNivelSelecionado.style.color = cores[valor] || '#00562e';
            spanNivelSelecionado.style.fontWeight = 'bold';
        });
    });

    // ==========================================
    // BUSCA AUTOMÁTICA DE ZONA E SEÇÃO - CORRIGIDA
    // ==========================================
    const zonaInput = document.getElementById('zona');
    const secaoInput = document.getElementById('secao');

    function buscarDadosVotacao() {
        const zona = zonaInput.value.trim();
        const secao = secaoInput.value.trim();

        const urlApi = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) 
            ? API_CONFIG.BASE_URL 
            : "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec";

        if (zona.length > 0 || secao.length > 0) {
            // 🔥 CORREÇÃO: Usar GET com parâmetros na URL
            var url = urlApi + '?acao=buscarZona&zona=' + encodeURIComponent(zona) + '&secao=' + encodeURIComponent(secao);
            console.log('🔍 Buscando:', url);
            
            fetch(url, {
                method: 'GET'  // ← GET, não POST!
            })
            .then(response => response.json())
            .then(resposta => {
                console.log('📦 Resposta:', resposta);
                if (resposta.sucesso) {
                    document.getElementById('local_vot').value = resposta.local_vot || '';
                    document.getElementById('bairro_vot').value = resposta.bairro_vot || '';
                    document.getElementById('endereco_vot').value = resposta.endereco_vot || '';
                } else {
                    document.getElementById('local_vot').value = '';
                    document.getElementById('bairro_vot').value = '';
                    document.getElementById('endereco_vot').value = '';
                    console.log('⚠️ ' + resposta.mensagem);
                }
            })
            .catch(err => console.error('❌ Erro ao buscar:', err));
        } else {
            document.getElementById('local_vot').value = '';
            document.getElementById('bairro_vot').value = '';
            document.getElementById('endereco_vot').value = '';
        }
    }

    zonaInput.addEventListener('input', buscarDadosVotacao);
    secaoInput.addEventListener('input', buscarDadosVotacao);

    // ==========================================
    // CARREGAR CANDIDATOS DINAMICAMENTE DA ABA ANEXO
    // ==========================================
    function carregarCandidatosDinamicamente() {
        const urlApi = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) 
            ? API_CONFIG.BASE_URL 
            : "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec";
    
        var url = urlApi + '?acao=buscarCandidatos';
        
        fetch(url, { method: 'GET' })
        .then(response => response.json())
        .then(resposta => {
            const container = document.getElementById('container-candidatos');
            if (!container) return;
    
            container.innerHTML = ''; // Limpa o "Carregando..."
    
            if (resposta.sucesso && resposta.candidatos && resposta.candidatos.length > 0) {
                resposta.candidatos.forEach(function(nomeCandidato, index) {
                    // Cria a estrutura do checkbox para cada item encontrado na aba anexo
                    const label = document.createElement('label');
                    label.style.display = 'block';
                    label.style.marginBottom = '5px';
                    label.style.cursor = 'pointer';
    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = 'candidato';
                    checkbox.value = nomeCandidato;
                    checkbox.style.marginRight = '8px';
    
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(nomeCandidato));
                    container.appendChild(label);
                });
            } else {
                container.innerHTML = '<span style="color: #666; font-size: 13px;">Nenhum candidato cadastrado na aba anexo.</span>';
            }
        })
        .catch(err => {
            console.error('❌ Erro ao carregar candidatos:', err);
            const container = document.getElementById('container-candidatos');
            if (container) {
                container.innerHTML = '<span style="color: red; font-size: 13px;">Erro ao carregar candidatos.</span>';
            }
        });
    }
    
    // Dispara com segurança assim que o documento estiver pronto para o elemento existir
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', carregarCandidatosDinamicamente);
    } else {
        carregarCandidatosDinamicamente();
    }

    // ==========================================
    // VALIDAÇÃO DO TÍTULO DE ELEITOR
    // ==========================================
    function validarTituloEleitor(titulo) {
        titulo = titulo.replace(/\D/g, '');
        if (titulo === '') return true;
        if (titulo.length !== 12) return false;
        if (/^(\d)\1+$/.test(titulo)) return false;

        var titulosExcecaoValidos = [
            "041986370779",
            "058018950760"
        ];

        if (titulosExcecaoValidos.includes(titulo)) {
            return true;
        }

        try {
            var uf = parseInt(titulo.substring(8, 10), 10);
            if (uf < 1 || uf > 28) return false;

            var soma1 = 0;
            for (var i = 0; i < 8; i++) {
                soma1 += parseInt(titulo.charAt(i), 10) * (i + 2);
            }
            var resto1 = soma1 % 11;

            var dv1Calculado;
            if (uf === 1 || uf === 2) {
                if (resto1 === 0) dv1Calculado = 0;
                else if (resto1 === 1) dv1Calculado = 5;
                else dv1Calculado = 11 - resto1;
            } else {
                if (resto1 === 10 || resto1 === 11) dv1Calculado = 0;
                else dv1Calculado = resto1;
            }

            var dv1Informado = parseInt(titulo.charAt(10), 10);
            if (dv1Calculado !== dv1Informado) return false;

            var soma2 = (parseInt(titulo.charAt(8), 10) * 7) + 
                        (parseInt(titulo.charAt(9), 10) * 8) + 
                        (dv1Calculado * 9);
            var resto2 = soma2 % 11;

            var dv2Calculado;
            if (resto2 === 10 || resto2 === 11) dv2Calculado = 0;
            else dv2Calculado = resto2;

            var dv2Informado = parseInt(titulo.charAt(11), 10);
            if (dv2Calculado !== dv2Informado) return false;

            return true;
        } catch (erro) {
            return false;
        }
    }

    // ==========================================
    // CHECAGEM VISUAL DO TÍTULO (VERDE/VERMELHO)
    // ==========================================
    const tituloInput = document.getElementById('titulo');
    const tituloAntigoCheckbox = document.getElementById('titulo-antigo');

    function checarVisualmenteTitulo() {
        const valor = tituloInput.value.trim();
        const isAntigo = tituloAntigoCheckbox ? tituloAntigoCheckbox.checked : false;

        if (valor === "" || isAntigo) {
            tituloInput.style.borderColor = "";
            tituloInput.style.backgroundColor = "";
            return;
        }

        const apenasNumeros = valor.replace(/\D/g, '');

        if (apenasNumeros.length === 12 && validarTituloEleitor(apenasNumeros)) {
            tituloInput.style.borderColor = "green";
            tituloInput.style.backgroundColor = "#e6ffe6";
        } else {
            tituloInput.style.borderColor = "red";
            tituloInput.style.backgroundColor = "#ffe6e6";
        }
    }

    tituloInput.addEventListener('input', checarVisualmenteTitulo);
    if (tituloAntigoCheckbox) {
        tituloAntigoCheckbox.addEventListener('change', checarVisualmenteTitulo);
    }

    // ==========================================
    // SUBMISSÃO DO FORMULÁRIO DE CADASTRO
    // ==========================================
    const form = document.getElementById('form-cadastramento');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // ✅ PEGA O NÍVEL SELECIONADO
        const nivelSelecionado = document.querySelector('input[name="nivel"]:checked');
        const nivel = nivelSelecionado ? nivelSelecionado.value : '';

        // Valida se o nível foi selecionado
        if (!nivel) {
            alert('⚠️ Por favor, selecione um NÍVEL DE ATUAÇÃO (1, 2 ou 3).');
            return;
        }

        const tituloVal = tituloInput.value.trim();
        const isAntigo = tituloAntigoCheckbox ? tituloAntigoCheckbox.checked : false;

        if (tituloVal !== "" && !isAntigo) {
            if (!validarTituloEleitor(tituloVal)) {
                alert('Erro: O Título de Eleitor precisa ter 12 dígitos válidos. Verifique os números informados.');
                tituloInput.focus();
                tituloInput.style.borderColor = "red";
                tituloInput.style.backgroundColor = "#ffe6e6";
                return;
            }
        }

        const checkboxesCandidatos = document.querySelectorAll('input[name="candidato"]:checked');
        let candidatosSelecionados = [];
        checkboxesCandidatos.forEach(function(cb) {
            candidatosSelecionados.push(cb.value);
        });

        const urlApiEnvio = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) 
            ? API_CONFIG.BASE_URL 
            : "https://script.google.com/macros/s/AKfycbzYQYsCt9aW2r7y0KITNIVFtAKE1iM2k457iFvlwOYNLG25Cb3HVJesbKDLqFX2p93K1A/exec";

        const dadosEnvio = {
            acao: 'salvarCadastro',
            numero_cha: numeroCha,
            numero_sec: numeroSec,
            nome: document.getElementById('nome').value,
            data_nasc: document.getElementById('data_nasc').value,
            endereco: document.getElementById('endereco').value,
            n_casa: document.getElementById('n_casa').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            telefone: document.getElementById('telefone').value,
            candidatos: candidatosSelecionados,
            titulo: tituloVal,
            zona: zonaInput.value,
            secao: secaoInput.value,
            nome_mae: document.getElementById('nome_mae').value,
            local_vot: document.getElementById('local_vot').value,
            bairro_vot: document.getElementById('bairro_vot').value,
            endereco_vot: document.getElementById('endereco_vot').value,
            obs: document.getElementById('obs').value,
            nivel: nivel
        };

        console.log('📤 Enviando dados:', dadosEnvio);

        fetch(urlApiEnvio, {
            method: 'POST',
            body: JSON.stringify(dadosEnvio)
        })
        .then(response => response.json())
        .then(resposta => {
            if (resposta.sucesso) {
                alert('✅ Cadastro salvo com sucesso! ID gerado: ' + resposta.id + '\nNível: ' + nivel);
                form.reset();
                tituloInput.style.borderColor = "";
                tituloInput.style.backgroundColor = "";
                document.getElementById('nivel-selecionado').innerText = 'Nenhum nível selecionado';
                document.getElementById('nivel-selecionado').style.color = '#888';
                document.getElementById('nivel-selecionado').style.fontWeight = 'normal';
            } else {
                alert('❌ Erro ao salvar: ' + resposta.mensagem);
            }
        })
        .catch(erro => {
            alert('❌ Erro de comunicação com o servidor: ' + erro.message);
        });
    });
});
