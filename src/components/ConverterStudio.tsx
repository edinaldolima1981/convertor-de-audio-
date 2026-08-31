import React, { useState, useRef, useEffect } from "react";
import { 
  decodeAudioFile, 
  getWaveformPeaks, 
  renderProcessedAudio, 
  encodeWAV, 
  encodeMP3, 
  ProcessConfig 
} from "../utils/audioProcessor";
import { 
  Upload, 
  Music, 
  Settings, 
  Play, 
  Pause, 
  Sliders, 
  Download, 
  RotateCcw, 
  Loader2, 
  Video,
  CheckCircle,
  Clock,
  AudioLines,
  Database,
  Wifi,
  WifiOff,
  Calendar,
  FileAudio
} from "lucide-react";
import { saveConversionLog, getConversionLogs, DBConversion, isSupabaseConfigured } from "../utils/supabaseClient";

interface ConvertedFile {
  id: string;
  fileName: string;
  url: string;
  format: string;
  size: string;
  duration: number;
  bitrate: number | string;
  timestamp: string;
}

export default function ConverterStudio() {
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [sourceBuffer, setSourceBuffer] = useState<AudioBuffer | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Conversion Logs History
  const [historyLogs, setHistoryLogs] = useState<DBConversion[]>([]);
  
  // Session Converted Files list for batch download
  const [sessionFiles, setSessionFiles] = useState<ConvertedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Record<string, boolean>>({});

  // Load history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const logs = await getConversionLogs();
        setHistoryLogs(logs);
      } catch (e) {
        console.error("Failed to load conversion logs:", e);
      }
    }
    loadHistory();
  }, []);

  const handleToggleSelectFile = (id: string) => {
    setSelectedFileIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isAllSelected = sessionFiles.length > 0 && sessionFiles.every(f => selectedFileIds[f.id]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFileIds({});
    } else {
      const newSelected: Record<string, boolean> = {};
      sessionFiles.forEach(f => {
        newSelected[f.id] = true;
      });
      setSelectedFileIds(newSelected);
    }
  };

  const handleDownloadBatch = () => {
    const selectedFiles = sessionFiles.filter(f => selectedFileIds[f.id]);
    selectedFiles.forEach((f, index) => {
      // Stagger download signals slightly so modern browsers don't restrict them as suspicious concurrent popups
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = f.url;
        a.download = f.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 300);
    });
  };

  // Parameter configuration states
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");
  const [bitrate, setBitrate] = useState<128 | 192 | 256 | 320>(320);
  const [sampleRate, setSampleRate] = useState<44100 | 48000>(44100);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [volumeBoost, setVolumeBoost] = useState<number>(1.0);

  // Trimming states (in seconds)
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  // Conversion process states
  const [processingState, setProcessingState] = useState<
    "idle" | "decoding" | "decoded" | "encoding" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState("");

  // Playback preview state (using standard HTML5 audio elements)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create an object URL of the uploaded file for preview playback
  const [previewSrc, setPreviewSrc] = useState<string>("");

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewSrc(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewSrc("");
    }
  }, [file]);

  // Sync playback time updates
  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlaybackTime(audio.currentTime);
      // Automatically pause if playback exceeds trimmed range
      if (audio.currentTime >= trimEnd) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = trimStart;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      audio.currentTime = trimStart;
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [trimStart, trimEnd]);

  // Render the waveform on the Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformPeaks.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    const barWidth = Math.max(1, width / waveformPeaks.length - 1);
    const scale = height * 0.8;

    waveformPeaks.forEach((peak, i) => {
      const x = i * (barWidth + 1);
      const h = peak * scale;
      const y = (height - h) / 2;

      // Determine colors based on trim selection range
      const timeAtPoint = (i / waveformPeaks.length) * duration;
      const isInRange = timeAtPoint >= trimStart && timeAtPoint <= trimEnd;

      if (isInRange) {
        ctx.fillStyle = "#3b82f6"; // Blue-500 for Frosted Glass theme
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; // Soft transparent white for unselected
      }

      ctx.fillRect(x, y, barWidth, h);
    });

    // Draw active playback head line
    if (duration > 0 && playbackTime >= trimStart && playbackTime <= trimEnd) {
      const playRatio = playbackTime / duration;
      const x = playRatio * width;
      ctx.strokeStyle = "#3b82f6"; // Cyan-blue head
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [waveformPeaks, trimStart, trimEnd, duration, playbackTime]);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setProcessingState("decoding");
    setErrorMessage("");
    setSourceBuffer(null);
    setWaveformPeaks([]);
    setIsPlaying(false);
    setTrimStart(0);
    setTrimEnd(0);
    setPlaybackTime(0);

    try {
      // Decode container to AudioBuffer
      const decodedBuffer = await decodeAudioFile(selectedFile);
      setSourceBuffer(decodedBuffer);
      setDuration(decodedBuffer.duration);
      setTrimEnd(decodedBuffer.duration);
      
      // Calculate visual downsamples
      const peaks = getWaveformPeaks(decodedBuffer, 240);
      setWaveformPeaks(peaks);
      setProcessingState("decoded");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        "Supported files are MP4 screen recordings, WebM capture, or common audio containers. " +
        "Ensure your browser supports the video/audio codecs. Detail: " + (err.message || err.toString())
      );
      setProcessingState("error");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Toggle Play/Pause preview
  const handlePlayPause = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Synchronize player to start boundaries if outside trim
      if (audio.currentTime < trimStart || audio.currentTime > trimEnd) {
        audio.currentTime = trimStart;
      }
      audio.play().catch(err => {
        console.error("Playback failed:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleStopPreview = () => {
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = trimStart;
    }
    setIsPlaying(false);
    setPlaybackTime(trimStart);
  };

  // Trimming adjustments via double slider ratios
  const handleTrimStartChange = (val: number) => {
    const newStart = Math.max(0, Math.min(val, trimEnd - 1));
    setTrimStart(newStart);
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = newStart;
      setPlaybackTime(newStart);
    }
  };

  const handleTrimEndChange = (val: number) => {
    const newEnd = Math.max(trimStart + 1, Math.min(val, duration));
    setTrimEnd(newEnd);
  };

  // Core execution function - compiles Float32 arrays into MP3 or WAV
  const handleRunConversion = async () => {
    if (!sourceBuffer) return;

    setProcessingState("encoding");
    setEncodeProgress(0);
    setErrorMessage("");

    try {
      const config: ProcessConfig = {
        format,
        bitrate,
        sampleRate,
        channels,
        volumeBoost,
        trimStart,
        trimEnd
      };

      // 1. Render offline trimmed/boosted channel
      const processedBuffer = await renderProcessedAudio(sourceBuffer, config);

      let outputBlob: Blob;

      // 2. Run corresponding encoder
      if (format === "wav") {
        setEncodeProgress(50);
        outputBlob = encodeWAV(processedBuffer);
        setEncodeProgress(100);
      } else {
        // MP3 encoding using lamejs with iterative progress yields
        outputBlob = await encodeMP3(processedBuffer, bitrate, (pct) => {
          setEncodeProgress(pct);
        });
      }

      const url = URL.createObjectURL(outputBlob);
      setOutputUrl(url);

      // Compute friendly file size string
      const sizeBytes = outputBlob.size;
      const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
      const friendlySize = `${sizeMb} MB`;
      setOutputSize(friendlySize);

      setProcessingState("success");

      // Save to sessionFiles
      const cleanBaseName = file?.name ? (file.name.substring(0, file.name.lastIndexOf('.')) || file.name) : "extraido";
      const newSessionFile: ConvertedFile = {
        id: Math.random().toString(36).substring(7),
        fileName: `${cleanBaseName}_extraido_${Date.now()}.${format}`,
        url,
        format,
        size: friendlySize,
        duration: trimEnd - trimStart,
        bitrate: format === "wav" ? "1411" : bitrate,
        timestamp: new Date().toLocaleTimeString()
      };
      setSessionFiles(prev => [newSessionFile, ...prev]);
      setSelectedFileIds(prev => ({ ...prev, [newSessionFile.id]: true }));

      // Save to Supabase (or fallback to localStorage) and reload logs
      try {
        await saveConversionLog({
          file_name: file?.name || "extracted_audio",
          file_size: friendlySize,
          duration: trimEnd - trimStart,
          format,
          bitrate,
          channels,
          sample_rate: sampleRate,
          volume_boost: volumeBoost
        });
        const logs = await getConversionLogs();
        setHistoryLogs(logs);
      } catch (logErr) {
        console.warn("Error registering conversion log:", logErr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Encoding process failed: " + (err.message || err.toString()));
      setProcessingState("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setSourceBuffer(null);
    setWaveformPeaks([]);
    setTrimStart(0);
    setTrimEnd(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    setOutputUrl(null);
    setOutputSize("");
    setProcessingState("idle");
    setErrorMessage("");
  };

  // Helper to format seconds to clock timestamp
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 space-y-6" id="converter-studio-root">
      {/* Intro details */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Laboratório de Extração de Áudio</h2>
        <p className="text-sm text-slate-400 mt-1">
          Extraia, corte e comprima faixas de áudio das suas gravações de tela diretamente no navegador. Todo o processamento é feito localmente no seu computador.
        </p>
      </div>

      {/* ERROR MESSAGE CARD */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 backdrop-blur-md border border-red-500/30 text-xs text-red-200 leading-relaxed" id="error-card">
          <p className="font-bold">⚠️ Interrupção do Extrator:</p>
          <p className="mt-0.5">{errorMessage}</p>
        </div>
      )}

      {/* STATE 1: FILE DROPZONE (IDLE/DECODING) */}
      {(processingState === "idle" || processingState === "decoding") && (
        <div
          id="dropzone-container"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all p-6 ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/10 bg-white/5 backdrop-blur-lg hover:bg-white/10 hover:border-white/20"
          }`}
        >
          {processingState === "decoding" ? (
            <div className="flex flex-col items-center gap-3" id="decoding-state">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">Lendo o contêiner de gravação de tela...</p>
                <p className="text-xs text-slate-400 mt-0.5">Isolando codecs de áudio e desmultiplexando floats PCM na memória...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shadow-sm" id="upload-icon-circle">
                <Video className="h-7 w-7" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-200">Carregar Vídeo de Gravação de Tela</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Arraste e solte seu arquivo MP4, WebM ou MOV, ou selecione-o manualmente.
                </p>
              </div>
              <input
                id="file-input-field"
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                accept="video/*,audio/*"
                className="hidden"
              />
              <button
                id="upload-browse-btn"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
              >
                Escolher Arquivos
              </button>
            </>
          )}
        </div>
      )}

      {/* STATE 2: ACTIVE EDITOR (DECODED / ENCODING) */}
      {(processingState === "decoded" || processingState === "encoding" || processingState === "success") && (
        <div className="space-y-6" id="editor-workspace">
          {/* File details banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10" id="file-banner">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                <Music className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 line-clamp-1 max-w-md">{file?.name}</p>
                <p className="text-[10px] text-slate-400">
                  Formato do Contêiner: {file?.type || "desconhecido"} • Duração: {formatTime(duration)}
                </p>
              </div>
            </div>
            {processingState !== "encoding" && (
              <button
                id="reset-workspace-btn"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Alterar Arquivo</span>
              </button>
            )}
          </div>

          {/* HIDDEN PREVIEW AUDIO TAG */}
          {previewSrc && (
            <audio
              ref={previewAudioRef}
              src={previewSrc}
              preload="auto"
              className="hidden"
              id="preview-audio-tag"
            />
          )}

          {/* WAVEFORM VISUALIZER AND RANGE TRIMMERS */}
          <div className="space-y-4" id="visualizer-block">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <AudioLines className="h-4 w-4 text-blue-400" />
                <span>Ajustador de Envelope PCM Linear</span>
              </span>
              <span>
                Seleção: <strong className="text-slate-200">{formatTime(trimStart)}</strong> - <strong className="text-slate-200">{formatTime(trimEnd)}</strong> ({formatTime(trimEnd - trimStart)} total)
              </span>
            </div>

            {/* Canvas waveform envelope container */}
            <div className="relative bg-[#090d22]/80 rounded-2xl p-4 overflow-hidden shadow-inner border border-white/10" id="waveform-canvas-box">
              <canvas
                ref={canvasRef}
                width={800}
                height={140}
                className="w-full h-36 block cursor-pointer"
                id="waveform-canvas"
              />
            </div>

            {/* Dual slider ranges - absolute overlays */}
            <div className="space-y-4 pt-1" id="trim-sliders-section">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5" id="slider-start-box">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Início do Corte (Remover silêncio inicial):</span>
                    <span className="text-slate-200">{formatTime(trimStart)}</span>
                  </div>
                  <input
                    id="trim-start-range"
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => handleTrimStartChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    disabled={processingState === "encoding"}
                  />
                </div>

                <div className="space-y-1.5" id="slider-end-box">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Fim do Corte (Remover final):</span>
                    <span className="text-slate-200">{formatTime(trimEnd)}</span>
                  </div>
                  <input
                    id="trim-end-range"
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) => handleTrimEndChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    disabled={processingState === "encoding"}
                  />
                </div>
              </div>

              {/* Player control triggers */}
              <div className="flex items-center gap-3 pt-1 justify-center" id="player-controls">
                <button
                  id="preview-play-btn"
                  onClick={handlePlayPause}
                  className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-bold text-xs flex items-center gap-2 transition-all shadow-sm text-slate-200"
                  disabled={processingState === "encoding"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 text-blue-400" />
                      <span>Pausar Pré-via</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-blue-400 fill-blue-400" />
                      <span>Ouvir Seleção Cortada</span>
                    </>
                  )}
                </button>
                <button
                  id="preview-stop-btn"
                  onClick={handleStopPreview}
                  className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all text-xs"
                  disabled={processingState === "encoding"}
                >
                  Parar
                </button>
              </div>
            </div>
          </div>

          {/* PARAMETERS CONFIG PANEL */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4" id="config-parameters-panel">
            <div className="space-y-1.5" id="param-format">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Formato</label>
              <select
                id="select-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-white/10 bg-[#090d22] text-slate-200 focus:outline-none focus:border-blue-500"
                disabled={processingState === "encoding"}
              >
                <option value="mp3">MP3 (Comprimido)</option>
                <option value="wav">WAV (PCM Sem Perdas)</option>
              </select>
            </div>

            <div className="space-y-1.5" id="param-bitrate">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Taxa de Bits (Qualidade)</label>
              <select
                id="select-bitrate"
                value={bitrate}
                onChange={(e) => setBitrate(parseInt(e.target.value) as any)}
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-white/10 bg-[#090d22] text-slate-200 focus:outline-none focus:border-blue-500 disabled:bg-slate-900 disabled:text-slate-500"
                disabled={format === "wav" || processingState === "encoding"}
              >
                <option value={320}>320 kbps (Alta Fidelidade)</option>
                <option value={256}>256 kbps (Excelente)</option>
                <option value={192}>192 kbps (Padrão)</option>
                <option value={128}>128 kbps (Rascunho)</option>
              </select>
            </div>

            <div className="space-y-1.5" id="param-channels">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Canais</label>
              <select
                id="select-channels"
                value={channels}
                onChange={(e) => setChannels(parseInt(e.target.value) as any)}
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-white/10 bg-[#090d22] text-slate-200 focus:outline-none focus:border-blue-500"
                disabled={processingState === "encoding"}
              >
                <option value={2}>Estéreo (Duas Faixas)</option>
                <option value={1}>Mono (Faixa Única)</option>
              </select>
            </div>

            <div className="space-y-1.5" id="param-samplerate">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Taxa de Amostragem</label>
              <select
                id="select-samplerate"
                value={sampleRate}
                onChange={(e) => setSampleRate(parseInt(e.target.value) as any)}
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-white/10 bg-[#090d22] text-slate-200 focus:outline-none focus:border-blue-500"
                disabled={processingState === "encoding"}
              >
                <option value={44100}>44.1 kHz (Áudio CD)</option>
                <option value={48000}>48.0 kHz (Vídeo de Estúdio)</option>
              </select>
            </div>

            <div className="space-y-1.5" id="param-volumeboost">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nivelador de Volume</label>
              <select
                id="select-volumeboost"
                value={volumeBoost}
                onChange={(e) => setVolumeBoost(parseFloat(e.target.value))}
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-white/10 bg-[#090d22] text-slate-200 focus:outline-none focus:border-blue-500"
                disabled={processingState === "encoding"}
              >
                <option value={1.0}>100% (Original)</option>
                <option value={1.2}>120% (+1.5 dB)</option>
                <option value={1.5}>150% (+3.5 dB)</option>
                <option value={0.8}>80% (-2.0 dB)</option>
                <option value={0.5}>50% (-6.0 dB)</option>
              </select>
            </div>
          </div>

          {/* STATE 3: PROGRESS PANEL (ENCODING) */}
          {processingState === "encoding" && (
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center gap-4 text-center" id="encoding-progress-card">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <span className="absolute text-[10px] font-black text-blue-400">{encodeProgress}%</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">Compilando fluxo de áudio {format.toUpperCase()}...</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Alocando taxas de bits, executando filtragem de sub-banda e aplicando mascaramento psicoacústico localmente em threads separadas...
                </p>
              </div>

              {/* Progress Bar container */}
              <div className="h-1.5 w-64 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${encodeProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STATE 4: SUCCESS OUTPUT DOWNLOAD CARD */}
          {processingState === "success" && outputUrl && (
            <div className="p-6 rounded-2xl bg-emerald-950/20 backdrop-blur-md border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6" id="encoding-success-card">
              <div className="flex items-center gap-4 text-left">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base">Extração Concluída!</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                    <span className="font-semibold text-white uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[10px]">{format}</span>
                    <span>• Tamanho: <strong>{outputSize}</strong></span>
                    <span>• Taxa de Bits: <strong>{format === "wav" ? "1411 kbps" : `${bitrate} kbps`}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  id="reset-studio-btn"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all"
                >
                  Converter Outro
                </button>
                <a
                  id="download-mp3-link"
                  href={outputUrl}
                  download={`extraido_${Date.now()}.${format}`}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Áudio</span>
                </a>
              </div>
            </div>
          )}

          {/* TRIGGER ENCODING ACTION BUTTON */}
          {processingState === "decoded" && (
            <div className="flex justify-end pt-2" id="trigger-conversion-container">
              <button
                id="run-conversion-btn"
                onClick={handleRunConversion}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <Sliders className="h-4 w-4" />
                <span>Extrair &amp; Codificar {format.toUpperCase()}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SESSION CONVERTED FILES - BATCH DOWNLOAD PANEL */}
      {sessionFiles.length > 0 && (
        <div className="border-t border-white/10 pt-6 mt-6 space-y-4" id="batch-download-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl" id="batch-download-header">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-400" />
                <span>Downloads em Lote (Fila da Sessão: {sessionFiles.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Selecione múltiplos arquivos para baixar de uma vez de forma local e assíncrona.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition-all"
              >
                {isAllSelected ? "Desmarcar Todos" : "Selecionar Todos"}
              </button>
              <button
                onClick={handleDownloadBatch}
                disabled={Object.values(selectedFileIds).filter(Boolean).length === 0}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/10"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar Selecionados ({Object.values(selectedFileIds).filter(Boolean).length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="batch-files-grid">
            {sessionFiles.map((sessionFile) => {
              const isSelected = !!selectedFileIds[sessionFile.id];
              return (
                <div
                  key={sessionFile.id}
                  id={`session-file-card-${sessionFile.id}`}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected ? "bg-blue-600/10 border-blue-500/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleToggleSelectFile(sessionFile.id)}
                      className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-blue-600 border-blue-500 text-white" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate" title={sessionFile.fileName}>
                        {sessionFile.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatTime(sessionFile.duration)} • {sessionFile.format === "wav" ? "WAV Sem Perdas" : `${sessionFile.bitrate}kbps MP3`} • {sessionFile.size}
                      </p>
                    </div>
                  </div>
                  
                  <a
                    href={sessionFile.url}
                    download={sessionFile.fileName}
                    className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 rounded-lg shrink-0 transition-all"
                    title="Baixar este arquivo"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONVERSION HISTORY PANEL */}
      <div className="border-t border-white/10 pt-6 mt-6" id="history-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4" id="history-header">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <h3 className="font-bold text-slate-200 text-sm">Histórico de Conversões</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi className="h-3.5 w-3.5" />
                Sincronizado com Supabase Cloud
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <WifiOff className="h-3.5 w-3.5" />
                Histórico de Sessão Local (Offline)
              </span>
            )}
          </div>
        </div>

        {historyLogs.length === 0 ? (
          <div className="text-center py-6 border border-white/5 bg-white/[0.02] rounded-xl text-slate-500 text-xs" id="history-empty">
            Nenhuma conversão registrada ainda. Extraia sua primeira faixa de áudio para ver o histórico!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="history-grid">
            {historyLogs.map((log, index) => (
              <div 
                key={log.id || `log-${index}`}
                id={`history-item-${index}`}
                className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <FileAudio className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate" title={log.file_name}>
                      {log.file_name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {log.duration ? formatTime(log.duration) : "0:00"} • {log.format === "wav" ? "WAV Sem Perdas" : `${log.bitrate}kbps MP3`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {log.file_size}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">
                    {log.created_at ? new Date(log.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
