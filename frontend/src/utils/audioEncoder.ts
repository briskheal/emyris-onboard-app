// @ts-ignore
import lamejs from 'lamejs';

// Converts any browser-recorded audio Blob (usually WebM Opus) into a universal MP3 Blob
export async function convertWebmToMp3(webmBlob: Blob): Promise<Blob> {
  // Read the Blob into an ArrayBuffer
  const arrayBuffer = await webmBlob.arrayBuffer();
  
  // Use the AudioContext to decode WebM/Opus data into raw PCM AudioBuffer
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const sampleRate = audioBuffer.sampleRate;
  
  // Mix down to Mono for MP3 (Voice doesn't need stereo)
  const left = audioBuffer.getChannelData(0);
  const samples = new Int16Array(left.length);
  
  for (let i = 0; i < left.length; i++) {
    const s = Math.max(-1, Math.min(1, left[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Initialize Lame MP3 Encoder: 1 Channel (Mono), dynamic sample rate, 128kbps
  const encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const mp3Data: Int8Array[] = [];
  
  // Encode chunks
  const sampleBlockSize = 1152;
  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  
  const mp3buf = encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data as any, { type: 'audio/mp3' });
}
