import { RoadmapPhase } from "../types";

export const roadmapPhases: RoadmapPhase[] = [
  {
    id: "phase-1",
    number: 1,
    title: "Iniciação do Projeto & Viabilidade Técnica",
    description: "Estabelecer a base do ambiente, validar as capacidades de desmultiplexação de contêineres em diferentes sistemas operacionais e avaliar os limites de memória para o processamento local.",
    duration: "Semanas 1–2",
    tasks: [
      "Selecionar o framework principal (Electron para acesso desktop nativo vs Next.js full-stack vs React SPA).",
      "Esboçar testes de perfil de memória padrão: Medir a pressão da memória do navegador ao carregar gravações de tela de mais de 300MB (MP4/WebM).",
      "Avaliar a velocidade de decodificação nativa do AudioContext contra módulos compilados em WebAssembly (Emscripten).",
      "Formular checklist de licenciamento para distribuição de bibliotecas compartilhadas do FFmpeg junto ao aplicativo de produção."
    ],
    challenges: [
      "Limites de alocação de memória no navegador (normalmente 2GB por aba do motor V8) provocando travamentos súbitos no navegador durante a decodificação de gravações longas.",
      "Disparidade de codecs entre Sistemas Operacionais: O Safari lida com MOV/AAC facilmente, mas falha no WebM/VP9, enquanto o Chrome lida com WebM perfeitamente."
    ],
    mitigations: [
      "Implementar segmentação no lado do cliente ou recomendar fluxos via WebAssembly para evitar o carregamento de arquivos inteiros na memória de uma vez.",
      "Incorporar caminhos de contingência que utilizem decodificadores nativos do navegador quando possível, alternando para o núcleo completo em WebAssembly quando codecs não suportados forem detectados."
    ],
    codeTitle: "Cabeçalhos do Servidor para SharedArrayBuffer",
    language: "typescript",
    codeSnippet: `// Se estiver implementando o FFmpeg via WebAssembly no navegador, seu servidor Express / CDN
// DEVE incluir estes cabeçalhos de resposta para habilitar a memória compartilhada multi-thread:
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});`
  },
  {
    id: "phase-2",
    number: 2,
    title: "Engenharia do Pipeline Central",
    description: "Desenvolver os módulos isolados de desmultiplexação e codificação de áudio. Fazer a interface com as bibliotecas do FFmpeg e criar os extratores de dados PCM personalizados.",
    duration: "Semanas 3–5",
    tasks: [
      "Configurar vinculações do wrapper fluent-ffmpeg no servidor de backend ou empacotar o ffmpeg.wasm nos recursos do cliente.",
      "Implementar extratores de frames PCM para isolar os fluxos estereofônicos diretamente.",
      "Integrar vinculações de codec MP3 LAME: Configurar taxas de bits constantes (CBR) e níveis psicoacústicos de taxas de bits variáveis (VBR).",
      "Construir um relógio robusto de sincronização A/V para corrigir desvios de fase causados por taxas de quadros variáveis (VFR) das gravações de tela."
    ],
    challenges: [
      "Desvio de áudio (Audio drift): Gravações de tela de navegadores frequentemente perdem quadros de vídeo sob alta carga do sistema, fazendo com que a duração da faixa de áudio divirja da duração do vídeo se codificada sequencialmente sem offsets."
    ],
    mitigations: [
      "Ler os carimbos de data/hora (timestamps) nativos dos quadros diretamente do índice do contêiner (nível do desmultiplexador) e preencher ou emendar buffers silenciosos para alinhar o desvio do relógio."
    ],
    codeTitle: "Sincronia de Taxa de Quadros Variáveis no FFmpeg",
    language: "bash",
    codeSnippet: `# Força uma taxa de quadros de saída constante e mantém o áudio sincronizado ao vídeo
# -vsync cfr (ou -fps_mode cfr no FFmpeg 6+) evita desvios de sincronização no áudio
ffmpeg -i input_vfr_recording.mp4 -vsync cfr -c:a libmp3lame -b:a 320k synced_output.mp3`
  },
  {
    id: "phase-3",
    number: 3,
    title: "Desenvolvimento de UI Interativa & Visualizador",
    description: "Projetar e implementar o espaço de trabalho do usuário. Criar o sistema de drag-and-drop, o cortador de waveform e os visualizadores de conversão em tempo real.",
    duration: "Semanas 6–8",
    tasks: [
      "Projetar um layout elegante de tema escuro que respeite o espaço negativo e o ritmo visual.",
      "Desenvolver um módulo de renderização de forma de onda baseado em Canvas de alto desempenho a partir das médias de decibéis do envelope de buffers PCM decodificados.",
      "Criar controles deslizantes interativos com precisão de quadro para o corte de áudio.",
      "Escrever Web Workers multi-threaded para codificação em segundo plano, evitando o travamento da thread de UI durante a compactação de MP3."
    ],
    challenges: [
      "Congelamento de UI: Desenhar formas de onda de alta resolução para um vídeo longo na thread principal do React causa lentidão perceptível no render.",
      "Precisão do slider: Controlar e cortar frações de milissegundos com precisão em cartões deslizantes de toque personalizados."
    ],
    mitigations: [
      "Reduzir a resolução das amostras dos canais de áudio para uma matriz leve de 1.000 pontos antes de desenhar a waveform no Canvas, mantendo os loops de desenho abaixo de 1 milissegundo.",
      "Delegar a codificação LAME MP3 a uma thread de Web Worker separada e comunicar as porcentagens de progresso via retornos de chamada postMessage()."
    ],
    codeTitle: "Despachante de Codificação MP3 via Web Worker",
    language: "typescript",
    codeSnippet: `// Inicializa o worker de codificação em segundo plano
const worker = new Worker(new URL('./mp3.worker.ts', import.meta.url));

function dispatchToWorker(leftChannel: Float32Array, rightChannel: Float32Array, config: any) {
  worker.postMessage({
    type: 'ENCODE_START',
    left: leftChannel.buffer,
    right: rightChannel.buffer,
    config
  }, [leftChannel.buffer, rightChannel.buffer]); // Objetos transferíveis (zero cópia de sobrecarga!)
  
  worker.onmessage = (e) => {
    if (e.data.type === 'PROGRESS') {
      updateProgressState(e.data.percentage);
    } else if (e.data.type === 'ENCODE_DONE') {
      const mp3Blob = new Blob([e.data.buffer], { type: 'audio/mp3' });
      triggerFileDownload(mp3Blob);
    }
  };
}`
  },
  {
    id: "phase-4",
    number: 4,
    title: "Garantia de Qualidade & Conformidade de Codec",
    description: "Testar rigorosamente casos especiais de codecs, limites de estresse de memória e validação cruzada entre plataformas.",
    duration: "Semanas 9–10",
    tasks: [
      "Testar os resultados de extração em diversas fontes de gravação: Gravação de Tela do Android (MP4), iOS (MP4), macOS QuickTime (MOV) e OBS Studio (MKV).",
      "Realizar análise espectral nos arquivos MP3 de saída usando ferramentas como o Spek para verificar se altas frequências não são truncadas abaixo dos limites selecionados.",
      "Executar perfilamento de memória (profiling) nas ferramentas de desenvolvedor do Chrome e Safari para detectar e mitigar vazamentos de memória ArrayBuffer."
    ],
    challenges: [
      "Inchaço de memória: Esquecer de desalocar buffers de AudioContext antigos, gerando erros de falta de memória (out-of-memory) no navegador após conversões repetidas."
    ],
    mitigations: [
      "Implementar uma rotina rígida de coleta de lixo (garbage collection): Limpar explicitamente referências de ArrayBuffers, encerrar Web Workers ativos e invocar audioContext.close() logo após o sucesso ou cancelamento."
    ],
    codeTitle: "Pipeline Seguro com Coleta de Lixo",
    language: "typescript",
    codeSnippet: `function cleanupAudioPipeline(audioContext: AudioContext | null, sourceNode: AudioBufferSourceNode | null) {
  if (sourceNode) {
    try { sourceNode.stop(); } catch (e) {}
    sourceNode.disconnect();
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
  // Limpa explicitamente referências para o garbage collector do V8
  sourceNode = null;
  audioContext = null;
}`
  },
  {
    id: "phase-5",
    number: 5,
    title: "Implantação & Distribuição",
    description: "Lançar o produto de produção final. Configurar hospedagem, otimizar velocidades de carregamento e estabelecer as diretrizes finais do usuário.",
    duration: "Semanas 11–12",
    tasks: [
      "Configurar compilações automatizadas: Empacotar binários do Electron para Windows, macOS (Universal) e Linux.",
      "Configurar políticas de segurança rígidas nos servidores para proteger a privacidade dos dados locais do usuário.",
      "Publicar documentação técnica abrangente, fluxos de solução de problemas e avisos de uso ético e direitos autorais."
    ],
    challenges: [
      "Rejeição em Lojas de Aplicativos: Lojas como a Mac App Store podem bloquear aplicativos voltados para download direto do YouTube devido a direitos autorais."
    ],
    mitigations: [
      "Distribuir como uma ferramenta de código aberto auto-compilável no GitHub, ou publicar como um Progressive Web App (PWA) operando 100% no lado do cliente."
    ],
    codeTitle: "Proteção de Segurança do Electron em Produção",
    language: "typescript",
    codeSnippet: `// electron-main.ts: Aplica políticas CSP estritas para evitar scripts maliciosos
import { app, BrowserWindow, session } from 'electron';

app.on('ready', () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });
});`
  }
];
