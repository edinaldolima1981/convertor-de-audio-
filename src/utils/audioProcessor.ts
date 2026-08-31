import * as lamejs from "@breezystack/lamejs";

// Audio processing config interface
export interface ProcessConfig {
  format: "mp3" | "wav";
  bitrate: number;
  sampleRate: number;
  channels: 1 | 2;
  volumeBoost: number;
  trimStart: number;
  trimEnd: number;
}

/**
 * Decodes an uploaded video or audio file and returns an AudioBuffer.
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  // Support standard and legacy audio contexts
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  
  try {
    return await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    await audioCtx.close();
  }
}

/**
 * Extracts and downsamples peaks from an AudioBuffer for visualizer rendering.
 */
export function getWaveformPeaks(audioBuffer: AudioBuffer, pointsCount: number = 200): number[] {
  const leftChannel = audioBuffer.getChannelData(0);
  const step = Math.ceil(leftChannel.length / pointsCount);
  const peaks: number[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const start = i * step;
    const end = Math.min(start + step, leftChannel.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(leftChannel[j]);
      if (val > max) {
        max = val;
      }
    }
    peaks.push(max);
  }

  // Normalize peaks
  const maxPeak = Math.max(...peaks, 0.01);
  return peaks.map(p => p / maxPeak);
}

/**
 * Processes an AudioBuffer (trims, gains) and returns an offline rendered AudioBuffer.
 */
export async function renderProcessedAudio(
  sourceBuffer: AudioBuffer,
  config: ProcessConfig
): Promise<AudioBuffer> {
  const { trimStart, trimEnd, volumeBoost, channels } = config;
  const sampleRate = sourceBuffer.sampleRate;
  
  // Calculate precise frames
  const startFrame = Math.floor(trimStart * sampleRate);
  const durationSec = trimEnd - trimStart;
  const durationFrames = Math.floor(durationSec * sampleRate);

  // Initialize offline context
  const offlineCtx = new OfflineAudioContext(
    channels,
    durationFrames,
    sampleRate
  );

  // Setup nodes
  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = sourceBuffer;

  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = volumeBoost;

  bufferSource.connect(gainNode);
  gainNode.connect(offlineCtx.destination);

  // Start playback at correct offsets
  bufferSource.start(0, trimStart, durationSec);

  return await offlineCtx.startRendering();
}

/**
 * Encodes an AudioBuffer into a WAV Blob.
 */
export function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 2) {
    result = interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
  } else {
    result = audioBuffer.getChannelData(0);
  }
  
  const buffer = new ArrayBuffer(44 + result.length * 2);
  const view = new DataView(buffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + result.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, result.length * 2, true);
  
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Encodes an AudioBuffer into an MP3 Blob using lamejs.
 * Integrates an iterative callback to report compression percentage.
 */
export async function encodeMP3(
  audioBuffer: AudioBuffer,
  bitrate: number,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Resolve lamejs components safely
  const Mp3EncoderClass = (lamejs as any).Mp3Encoder || (lamejs as any).default?.Mp3Encoder;
  if (!Mp3EncoderClass) {
    throw new Error("LameJS MP3 Encoder class not loaded correctly");
  }

  const encoder = new Mp3EncoderClass(channels, sampleRate, bitrate);
  const mp3Data: any[] = [];

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = channels === 2 ? audioBuffer.getChannelData(1) : null;

  // Convert Float32 arrays (-1 to 1) to Int16 values (-32768 to 32767)
  const leftInt16 = convertFloat32ToInt16(leftChannel);
  const rightInt16 = rightChannel ? convertFloat32ToInt16(rightChannel) : null;

  const sampleBlockSize = 1152; // standard LAME chunk size
  const totalSamples = leftInt16.length;
  
  let offset = 0;
  
  // Iterate in chunks to allow UI responsive progress updates
  while (offset < totalSamples) {
    const end = Math.min(offset + sampleBlockSize, totalSamples);
    const leftChunk = leftInt16.subarray(offset, end);
    let mp3buf;

    if (channels === 2 && rightInt16) {
      const rightChunk = rightInt16.subarray(offset, end);
      mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = encoder.encodeBuffer(leftChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    offset += sampleBlockSize;
    const pct = Math.floor((offset / totalSamples) * 100);
    onProgress(Math.min(pct, 99));

    // Yield control briefly to prevent locking browser UI
    if (offset % (sampleBlockSize * 100) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Flush remaining bytes
  const mp3buf = encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  onProgress(100);
  return new Blob(mp3Data, { type: "audio/mp3" });
}

// =================== HELPER FUNCTIONS ===================

function convertFloat32ToInt16(buffer: Float32Array): Int16Array {
  const l = buffer.length;
  const buf = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]));
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return buf;
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}
