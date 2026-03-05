# LingoQuest - Aventura em Inglês ⚔️🛡️

**LingoQuest** é um jogo de RPG gamificado focado no intercâmbio prático: você **aprende inglês de graça** tomando decisões, lendo histórias e lidando com vocabulários dinâmicos, tudo potencializado por Inteligência Artificial (AI).

O projeto permite que os jogadores leiam contos gerados dinamicamente, enfrentem desafios de vocabulário e gramática, escutem a narração, e vejam imagens estonteantes no estilo Pixel Art de suas aventuras.

## ✨ Funcionalidades

- **Múltiplos Cenários e Dificuldades**: Escolha o ambiente da sua aventura (Fantasia, Sci-Fi, Cyberpunk, etc.) e ajuste o nível de inglês (Iniciante, Intermediário, Avançado e Fluente).
- **Modo História (Guided)**: Participe de uma narrativa rica em 10 capítulos, tomando decisões ao final de cada cena que moldam o rumo da história.
- **Modo Sobrevivência (Survival)**: Enfrente batalhas rápidas de vocabulário para ver quantas ondas consecutivas consegue vencer.
- **Geração por IA (OpenAI)**:
  - Geração de narrativa e perguntas de múltipla escolha.
  - Geração de imagens via DALL-E 3 no estilo "32-bit retro RPG".
  - Geração de vozes e áudio (TTS-1) simulando narrações de NPCs.
  - Tradutor contextual de palavras ao clicar/tocar.
- **Criação de Avatar**: Edite um avatar customizado ou gere um visual único descrevendo-o para a IA.
- **Sistema de Saves**: Retome a sua jornada de onde parou. Todo histórico da aventura, imagens e áudios são persistidos por um Backend simples.
- **Áudio Imersivo e SFX**: Trilha sonora ambiente (Cyberpunk, Fantasia, Suspense) e sons em reações de acerto, nível máximo, e interações da interface.

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React (Vite)**
- **TypeScript**
- **Tailwind CSS** para estilização da interface (com estética Retro/Dark Quest).
- **PWA Ready** via `vite-plugin-pwa`.

### Backend

- **Node.js & Express** para gerenciar os arquivos salvos do jogo, imagens (em `Base64`) e áudios convertidos, armazenando tudo estaticamente e retornando estado JSON das sessões (`/saved_stories`).

### Inteligência Artificial

- **OpenAI API**: `gpt-4o-mini` (História, tutor e traduções), `dall-e-3` (Imagens e Avatares) e `tts-1` (Áudio das falas).

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18+ recomendada)
- Chave de API da OpenAI.

### 1. Clonando ou acessando o diretório do projeto

Se já estiver no diretório ou tiver baixado o repositório, proceda com:

```bash
npm install
```

_(Isso vai instalar as bibliotecas do Frontend e do Backend)._

### 2. Variáveis de Ambiente

Na raiz do projeto, edite o arquivo `.env` com suas configurações. Ele deve ser parecido com isso:

```env
OPENAI_API_KEY="sk-SuaChaveDaOpenAIAqui"
VITE_API_URL="http://localhost:3500"
```

### 3. Rodando o Backend (Local Storage Server)

Em um terminal (na raiz do projeto), execute o servidor que gerenciará os salvamentos (`server.js`):

```bash
node server.js
```

O backend ficará rodando em `http://localhost:3001` (porta 3001).

### 4. Rodando o Frontend (Aplicação React Vite)

Abra outra janela do terminal na raiz do projeto e inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A Aplicação será acessível no navegador geralmente na porta `3500` - confira o terminal (`http://localhost:3500/`).

---

## 📂 Estrutura Principal do Projeto

- `/components` - Componentes React da Interface (Interface, Modal, Histórico, Configurações).
- `/services`
  - `aiService.ts` / `openaiService.ts` - Funções que interagem com as APIs IAs de texto, áudios e imagens.
  - `audioService.ts` - Singleton responsável por carregar os SFXs locais ou criar o HTML Audio.
  - `storageService.ts` - Comunicação com o servidor backend (`server.js`) para gravar e puxar savegames.
  - `config.ts` - Organiza URLs expostos pelas _Envs_.
- `/public` - Assets de áudio (`sfx/`, `ambience/`) e favicon/manifest PWA.
- `/saved_stories` - Diretório criado via backend de forma automática para guardar os assets `Base64` salvos na máquina de cada jogo (`.json`, `.png`, `.mp3`).
- `server.js` - Servidor backend express minimalista.
- `App.tsx` - O Coração da Engine de Jogo que orquestra a máquina de estados (_Menu ↔ StoryView ↔ History_).

---

## 🤝 Contribua (Não Copie!)

**Um apelo à comunidade:** Este projeto nasceu de uma vontade forte de criar algo útil, mas ele foi desenvolvido com muita "vibe coding" (programação guiada pela intuição e testes rápidos focados no resultado) devido à minha falta de tempo no dia a dia. Revisei o máximo que pude para deixá-lo funcional e bonito, mas ainda há muito espaço para melhorias!

Por favor, **não apenas copie ou faça forks fantasmas** deste projeto. Se você gostou da ideia, achou legal a arquitetura ou viu pontos de melhoria no código: **Ajude a evoluí-lo!**

### Como Contribuir:

1. Faça um **Fork** do projeto.
2. Crie uma **Branch** para sua feature/correção (`git checkout -b feature/MinhaNovaIdeia`).
3. Faça o **Commit** das suas alterações (`git commit -m 'feat: adicionando nova funcionalidade bacana'`).
4. Faça o **Push** para a branch (`git push origin feature/MinhaNovaIdeia`).
5. Abra um **Pull Request (PR)** detalhando o que você fez e por que isso ajuda o LingoQuest.

Toda ajuda é bem-vinda: refatorações de código, padronizações, novas funcionalidades, correção de bugs, ou até melhorias na acessibilidade e UI!

---

## 🗺️ Roadmap

Nosso objetivo é tornar o app cada vez melhor para a comunidade. Algumas ideias de features futuras:

- [ ] **Modo Multiplayer/Co-op:** Enfrente desafios ou histórias com amigos.
- [ ] **Sistema de Login/Nuvem:** Conectar a uma API real (como Firebase ou Supabase) em vez de apenas arquivos locais, salvando na nuvem.
- [ ] **Flashcards e Revisão Espaçada:** Uma área para treinar os vocabulários em que o jogador mais errou.
- [ ] **Métricas Completas:** Painel com o progresso do aluno (tempo de estudo diário, curvas de aprendizado).
- [ ] **Tradução por Imagem:** IA analisando cenários e permitindo cliques interativos para ensinar objetos na imagem.

Sinta-se livre para abrir uma **Issue** propondo novos caminhos!

---

## 🛡️ Licença e Informações

Este projeto está licenciado sob a **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
Isso significa que você é livre para copiar, modificar e distribuir o código ou a aplicação para **fins não comerciais**, desde que atribua os devidos créditos ao autor original. É terminantemente proibida a comercialização deste software sem autorização.

Desenvolvido como um app gamificado para enriquecer a experiência de aprendizado da língua inglesa **gratuitamente**.
Use a criatividade, divirta-se e colabore com a comunidade open-source!
