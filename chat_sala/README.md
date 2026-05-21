# 💬 Sistema de Chat Corporativo com Google Sheets

Um aplicativo de chat corporativo moderno, seguro e elegante em **Dark Mode Premium**, que utiliza uma planilha do **Google Sheets** como banco de dados através do **Google Apps Script**.

Esta arquitetura serverless inovadora elimina a necessidade de configurar servidores de banco de dados tradicionais, utilizando a infraestrutura em nuvem gratuita do Google.

---

## ✨ Recursos

*   **🎨 Design Premium:** Interface limpa baseada em Glassmorphism, paleta de cores HSL cuidadosamente selecionada e transições suaves.
*   **🔒 Segurança e Autenticação:** Sistema de login com validação na planilha (insensível a maiúsculas/minúsculas e tratamento de tipos numéricos).
*   **👤 Cadastro Dinâmico:** Tela de registro que cria o perfil de usuário e o adiciona automaticamente à lista de contatos do chat.
*   **⚡ Sincronização em Tempo Real (Polling):** Atualização automática da conversa a cada 4 segundos utilizando requisições assíncronas.
*   **🛡️ Proteção CORS Avançada:** Contorno de preflight HTTP OPTIONS utilizando requisições baseadas em `text/plain` compatíveis com o Apps Script.
*   **📱 Responsividade Total:** Perfeitamente adaptável para telas de computadores, tablets e smartphones.

---

## 📁 Estrutura do Projeto

*   `login.html` - Página de entrada com formulário dinâmico de Login e Cadastro.
*   `chat.html` - Interface de bate-papo, lista de contatos corporativos e histórico.
*   `Codigo.js` - Código JavaScript backend a ser inserido no editor do Google Apps Script.

---

## 🛠️ Configurando o Banco de Dados (Google Sheets)

Para o sistema funcionar, crie uma Planilha do Google com **três abas** com os nomes exatos listados abaixo:

### 1. Aba `LOGIN`
Esta aba gerencia o acesso dos usuários ao sistema.
*   **Coluna A:** `usuario` (Nome de usuário para o login)
*   **Coluna B:** `senha` (Senha de acesso)
*   **Coluna C:** `setor` (Setor corporativo da pessoa)
*   **Coluna D:** `ativo` (Insira `TRUE` para usuários autorizados ou `FALSE` para bloqueados)

### 2. Aba `CONTATOS`
Esta aba gerencia o diretório de pessoas disponíveis para conversar.
*   **Coluna A:** `nome` (Nome completo)
*   **Coluna B:** `setor` (Departamento corporativo)

### 3. Aba `CHAT`
Esta aba registra o histórico seguro de mensagens.
*   **Coluna A:** `data` (Data/Hora de envio gerada pelo servidor)
*   **Coluna B:** `remetente` (Nome de usuário que enviou)
*   **Coluna C:** `destinatario` (Nome de usuário que recebeu)
*   **Coluna D:** `mensagem` (Texto da mensagem)
*   **Coluna E:** `extra` (Espaço reservado)

---

## 🚀 Configurando a API no Google Apps Script

1. Na sua planilha, clique em **Extensões** > **Apps Script**.
2. Substitua o código existente pelo conteúdo do arquivo [Codigo.js](./Codigo.js).
3. Clique em **Salvar** (💾).
4. No topo superior direito, clique em **Implantar** > **Nova implantação**.
5. Clique na engrenagem ao lado de "Selecionar tipo" e escolha **Aplicativo da Web**.
6. Defina as configurações:
   * **Executar como:** `Eu (seu-email@gmail.com)`
   * **Quem tem acesso:** `Qualquer pessoa` (Anyone)
7. Clique em **Implantar** e autorize o acesso à sua conta.
8. Copie a **URL do aplicativo da Web** gerada.

---

## 🌐 Configurando o Frontend Local

1. Abra os arquivos `login.html` e `chat.html` no seu editor (como VS Code).
2. Localize a constante `API_URL` próxima ao início da tag `<script>` em ambos os arquivos:
   ```javascript
   const API_URL = "COLE_A_SUA_URL_DO_WEB_APP_AQUI";
   ```
3. Substitua pelo link que você copiou do Google Apps Script.
4. Salve os arquivos e execute localmente (recomendável usar a extensão **Live Server** do VS Code).

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para utilizar, modificar e distribuir.
