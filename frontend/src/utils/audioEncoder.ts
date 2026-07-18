// Converts any browser-recorded audio Blob (usually WebM Opus) into a standard universal WAV Blob
export async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
  // Read the Blob into an ArrayBuffer
  const arrayBuffer = await webmBlob.arrayBuffer();
  
  // Use the AudioContext to seamlessly decode the WebM/Opus data into raw PCM AudioBuffer
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // WAV Format specifications
  const numOfChan = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numOfChan * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  // Helper to write string to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  let offset = 0;
  
  // Write WAV Header
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, 36 + length, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size (16 for PCM)
  view.setUint16(offset, 1, true); offset += 2; // AudioFormat (1 for PCM)
  view.setUint16(offset, numOfChan, true); offset += 2; // NumChannels
  view.setUint32(offset, sampleRate, true); offset += 4; // SampleRate
  view.setUint32(offset, sampleRate * 2 * numOfChan, true); offset += 4; // ByteRate
  view.setUint16(offset, numOfChan * 2, true); offset += 2; // BlockAlign
  view.setUint16(offset, 16, true); offset += 2; // BitsPerSample
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, length, true); offset += 4;

  // Interleave audio channels
  const interleaved = new Float32Array(audioBuffer.length * numOfChan);
  
  if (numOfChan === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    let index = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      interleaved[index++] = left[i];
      interleaved[index++] = right[i];
    }
  } else {
    interleaved.set(audioBuffer.getChannelData(0));
  }
  
  // Write PCM audio data (16-bit)
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return new Blob([view], { type: 'audio/wav' });
}
