import { TechnicalTopic } from "../types";

export const technicalTopics: TechnicalTopic[] = [
  {
    id: "extraction-pipeline",
    title: "1. O Pipeline de Extração de Áudio",
    summary: "Como um aplicativo decodifica o formato de contêiner de uma gravação de tela (ex: MP4/WebM) para extrair os bytes brutos de áudio PCM.",
    details: [
      "Desmultiplexação do Contêiner (Demuxing): Leitura do arquivo de vídeo (MP4, MKV, MOV, WebM) para isolar a faixa de áudio alvo (AAC, Opus, Vorbis) da faixa de vídeo (H.264, VP9).",
      "Decodificação de Codec: Inicialização de um decodificador (como libfdk_aac ou libopus) para traduzir fluxos de bits compactados em canais de áudio PCM (Pulse-Code Modulation) de ponto flutuante float32 não compactados.",
      "Taxas de Quadros Variáveis (VFR): Gravações de tela são notoriamente gravadas em VFR, o que pode causar saltos em players de vídeo normais e levar a desvios graves de fase no áudio se os carimbos de duração não forem sincronizados.",
      "Correspondência de Taxa de Amostragem (Sample Rate): Padronização da taxa de amostragem extraída (geralmente 44.1kHz ou 48kHz) para corresponder perfeitamente com a configuração do codificador alvo."
    ],
    codeTitle: "Comando CLI do FFmpeg para Extração",
    language: "bash",
    codeSnippet: `# Isola o fluxo de áudio (-vn), mapeia a primeira trilha, decodifica,
# e grava um WAV PCM de 16 bits sem perdas (estéreo de qualidade de CD)
ffmpeg -i input_recording.mp4 -vn -acodec pcm_s16le -ar 44100 -ac 2 extracted_audio.wav

# Copia diretamente a trilha de áudio compactada sem codificar novamente (Instantâneo, zero perda de qualidade)
ffmpeg -i input_recording.mp4 -vn -c:a copy extracted_original.aac`
  },
  {
    id: "mp3-psychoacoustics",
    title: "2. Compressão MP3 & Psicoacústica",
    summary: "Como o PCM bruto é compactado em MP3 de alta qualidade (MPEG-1 Audio Layer III) usando as configurações do codificador LAME.",
    details: [
      "Modelagem Psicoacústica: A compressão padrão do MP3 aplica um modelo de limiar de audição humana, removendo frequências que são mascaradas por sons mais altos próximos (mascaramento espectral) ou sons posteriores (mascaramento temporal).",
      "Filtragem de Sub-bandas: Divisão do sinal PCM linear em 32 sub-bandas de frequência para comprimir e codificar cada banda de forma independente.",
      "Quantização & Codificação de Huffman: Alocação de orçamento de bits baseado em modelos de entropia. Altas taxas de bits (320kbps) minimizam o ruído de quantização, tornando a diferença imperceptível ao ouvido humano.",
      "Estratégias de Taxa de Bits: O CBR (Constant Bitrate) aloca um tamanho de quadro estático (ex: 320kbps), enquanto o VBR (Variable Bitrate) ajusta dinamicamente a taxa de bits para preservar a fidelidade em trechos de áudio complexos."
    ],
    codeTitle: "Predefinições de Codificação LAME MP3 no FFmpeg",
    language: "bash",
    codeSnippet: `# Codifica para MP3 de alta fidelidade constante de 320kbps (CBR)
ffmpeg -i extracted_audio.wav -codec:a libmp3lame -b:a 320k -ar 44100 premium_audio.mp3

# Codifica usando Taxa de Bits Variável (VBR) LAME nível 0 (máxima qualidade, média de 220-260kbps)
ffmpeg -i extracted_audio.wav -codec:a libmp3lame -q:a 0 highest_vbr_audio.mp3`
  },
  {
    id: "wasm-ffmpeg",
    title: "3. WebAssembly no Navegador (FFmpeg.wasm)",
    summary: "Executando comandos FFmpeg completos diretamente na aba do navegador do usuário usando wrappers binários compilados em WebAssembly (Emscripten).",
    details: [
      "Integração WebAssembly: A compilação do código-fonte em C do FFmpeg em instruções WebAssembly (.wasm) permite que decodificações e codificações pesadas rodem de forma isolada dentro de uma Web Worker separada do navegador.",
      "SharedArrayBuffer: Workers do WebAssembly requerem acesso a memória compartilhada para melhor desempenho multi-threaded. Isso exige cabeçalhos de segurança COOP (Cross-Origin-Opener-Policy) e COEP (Cross-Origin-Embedder-Policy) configurados no servidor de hospedagem.",
      "Isolamento em Sandbox do Navegador: Como o processamento roda 100% no dispositivo do usuário, resolve por completo problemas de gargalo de banda do servidor e elimina qualquer risco de privacidade ao lidar com conteúdos protegidos.",
      "Latência de Carregamento: O principal desafio técnico reside no tamanho do arquivo WebAssembly (normalmente de 10MB a 30MB) que precisa ser baixado no primeiro acesso."
    ],
    codeTitle: "Exemplo de Implementação de FFmpeg.wasm em JS/TS",
    language: "typescript",
    codeSnippet: `import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

async function initFFmpeg() {
  // Carrega os binários do ffmpeg.wasm a partir de uma CDN ou recursos locais
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.js\`, 'text/javascript'),
    wasmURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.wasm\`, 'application/wasm'),
  });
}

async function convertVideoToMp3(videoFile: File) {
  // Grava o arquivo no sistema de arquivos virtual em memória do FFmpeg
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
  
  // Executa os comandos de extração e compressão do FFmpeg
  await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-b:a', '320k', 'output.mp3']);
  
  // Recupera os bytes do MP3 finalizado
  const data = await ffmpeg.readFile('output.mp3');
  const mp3Blob = new Blob([data], { type: 'audio/mp3' });
  return URL.createObjectURL(mp3Blob);
}`
  },
  {
    id: "web-audio-api",
    title: "4. Processamento via Web Audio API (Nativo do Navegador)",
    summary: "Uma abordagem nativa alternativa e altamente responsiva que decodifica trilhas de áudio usando o decodificador de hardware interno do próprio navegador.",
    details: [
      "Aceleração de Hardware: O método nativo AudioContext.decodeAudioData() do navegador utiliza decodificadores de hardware do sistema operacional para processar fluxos de áudio de contêineres em microssegundos.",
      "Canvas de Áudio Offline: O OfflineAudioContext realiza o processamento em um motor de áudio virtual não bloqueante, efetuando conversões de taxa de amostragem, nivelamento de volume e pontos de corte com extrema rapidez.",
      "Extração Direta de Amostras: Os dados dos canais podem ser lidos diretamente como Float32Arrays convencionais, permitindo desenhar waveforms personalizadas, multiplicar o ganho de volume e realizar compressão MP3 manual com encoders em JS (como o LAME.js).",
      "Limitações: Os decodificadores nativos do navegador podem falhar ao tentar ler estruturas de contêiner complexas (como MKV) ou codecs menos comuns que não possuem suporte em tags convencionais de vídeo HTML5."
    ],
    codeTitle: "Codificação em TypeScript para Decodificação & Processamento",
    language: "typescript",
    codeSnippet: `// Inicializa pipeline nativo de extração de áudio no navegador
async function extractAudioWithBrowser(videoFile: File, trimStart: number, trimEnd: number, volumeGain: number) {
  const arrayBuffer = await videoFile.arrayBuffer();
  
  // Cria um AudioContext genérico para decodificar os streams do contêiner
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Decodificação de hardware nativa para PCM de ponto flutuante
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Calcula os frames que compõem o trecho recortado
  const sampleRate = audioBuffer.sampleRate;
  const startFrame = Math.floor(trimStart * sampleRate);
  const endFrame = Math.floor(Math.min(trimEnd || audioBuffer.duration, audioBuffer.duration) * sampleRate);
  const durationFrames = endFrame - startFrame;
  
  // Inicializa o Offline Audio Context não bloqueante
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    durationFrames,
    sampleRate
  );
  
  // Configura o nó de origem do buffer
  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;
  
  // Opcional: Aplica ganho de multiplicador de volume
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = volumeGain;
  
  // Conecta o pipeline
  bufferSource.connect(gainNode);
  gainNode.connect(offlineCtx.destination);
  
  // Reproduz apenas o segmento recortado
  bufferSource.start(0, trimStart, durationFrames / sampleRate);
  
  // Renderiza o buffer final não compactado
  const renderedBuffer = await offlineCtx.startRendering();
  return renderedBuffer; // Canais PCM Float32 prontos para compressão/codificação
}`
  }
];
