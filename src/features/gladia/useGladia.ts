import { useState, useRef, useCallback } from 'react';

export function useGladia() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const apiKey = import.meta.env.VITE_GLADIA_API_KEY || '';

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setConnectionState('disconnected');
    setInterimTranscript('');
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      setConnectionState('connecting');
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('');

      // 1. Fetch short-lived initialization URL from backend proxy
      const initResponse = await fetch('/api/gladia-init');
      const initData = await initResponse.json();
      
      if (!initData.url) {
        throw new Error(initData.error || 'Failed to initialize Gladia session');
      }

      // 2. Get Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const wsUrl = initData.url;

      // 3. Connect to Gladia WebSocket
      const connection = new WebSocket(wsUrl);
      connectionRef.current = connection;

      connection.onopen = async () => {
        setConnectionState('connected');

        const stream = streamRef.current;
        if (!stream) return;

        // Gladia v2 requires 16000Hz PCM
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        // ScriptProcessorNode is deprecated but widely supported for raw PCM extraction
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (!connectionRef.current || connectionRef.current.readyState !== WebSocket.OPEN || isPaused) {
            return;
          }

          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32 (-1.0 to 1.0) to Int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Send raw binary
          connection.send(pcmData.buffer);
        };

        setIsRecording(true);
      };

      connection.onmessage = (message) => {
        const received = JSON.parse(message.data);
        
        if (received.type === 'transcript' && received.data && received.data.utterance) {
          const transcript = received.data.utterance.text;
          
          if (received.data.is_final) {
            setFinalTranscript((prev) => prev + transcript + ' ');
            setInterimTranscript('');
          } else {
            setInterimTranscript(transcript);
          }
        } else if (received.type === 'error') {
          setError(`Gladia Error: ${received.message}`);
          setConnectionState('error');
          stopRecording();
        }
      };

      connection.onerror = (error) => {
        console.error('Gladia WebSocket Error:', error);
        setError('WebSocket error connecting to Gladia');
        setConnectionState('error');
        stopRecording();
      };

      connection.onclose = () => {
        if (isRecording) stopRecording();
      };

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error starting Gladia');
      setConnectionState('error');
      stopRecording();
    }
  }, [isRecording, isPaused, stopRecording]);

  const transcribeFile = useCallback(async (file: File) => {
    if (!apiKey) {
      setError('Gladia API key is missing.');
      return;
    }

    try {
      setIsTranscribingFile(true);
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('Uploading file...');

      const formData = new FormData();
      formData.append('audio', file);

      // 1. Upload File
      const uploadResponse = await fetch('https://api.gladia.io/v2/upload', {
        method: 'POST',
        headers: {
          'x-gladia-key': apiKey
        },
        body: formData
      });
      const uploadData = await uploadResponse.json();

      if (!uploadData.audio_url) {
        throw new Error(uploadData.message || 'Failed to upload file');
      }

      setInterimTranscript('Transcribing... please wait...');

      // 2. Start Transcription
      const transcribeResponse = await fetch('https://api.gladia.io/v2/transcription', {
        method: 'POST',
        headers: {
          'x-gladia-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audio_url: uploadData.audio_url })
      });
      const transcribeData = await transcribeResponse.json();

      if (!transcribeData.id) {
        throw new Error(transcribeData.message || 'Failed to start transcription');
      }

      // 3. Poll for completion
      const poll = async () => {
        const pollResponse = await fetch(`https://api.gladia.io/v2/transcription/${transcribeData.id}`, {
          headers: { 'x-gladia-key': apiKey }
        });
        const pollData = await pollResponse.json();

        if (pollData.status === 'done') {
          // The transcript is in pollData.result.transcription.full_transcript
          const text = pollData.result?.transcription?.full_transcript || '';
          setFinalTranscript(text);
          setInterimTranscript('');
          setIsTranscribingFile(false);
        } else if (pollData.status === 'error') {
          throw new Error('Transcription failed');
        } else {
          setTimeout(poll, 3000);
        }
      };

      poll();

    } catch (e: any) {
      console.error('Gladia file transcription error:', e);
      setError(`Failed to transcribe file: ${e.message}`);
      setIsTranscribingFile(false);
      setInterimTranscript('');
    }
  }, [apiKey]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      // AudioContext resume logic if needed
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  }, [isPaused]);

  return {
    isRecording,
    isPaused,
    isTranscribingFile,
    toggleRecording,
    togglePause,
    transcribeFile,
    finalTranscript,
    interimTranscript,
    connectionState,
    error,
    resetTranscript: () => {
      setFinalTranscript('');
      setInterimTranscript('');
    }
  };
}
