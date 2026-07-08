import { useState, useRef, useCallback, useEffect } from 'react';

export function useAssemblyAI() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const connectionRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY || '';

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
      // Send a close message to AssemblyAI to signify end of stream (v3 API)
      if (connectionRef.current.readyState === WebSocket.OPEN) {
        connectionRef.current.send(JSON.stringify({ terminate_session: true }));
      }
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setConnectionState('disconnected');
    setInterimTranscript('');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('');

      // 1. Fetch token
      const response = await fetch('/api/assemblyai-token');
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Failed to get AssemblyAI token');
      }

      // 2. Get Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Initialize AssemblyAI Native WebSocket Connection
      // We fetch a temporary authentication token from our local Vite backend API
      const tokenResponse = await fetch('/api/assemblyai-token');
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get AssemblyAI token: ${tokenData.error || 'Unknown error'}`);
      }

      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model=universal-3-5-pro&mode=balanced&token=${tokenData.token}`;
      const connection = new WebSocket(wsUrl);
      connectionRef.current = connection;

      connection.onopen = () => {
        setConnectionState('connected');
        setIsRecording(true);
        setIsPaused(false);
        
        // 3. Process audio to 16-bit PCM for AssemblyAI
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        
        // Use ScriptProcessorNode (deprecated but highly compatible) to get raw float data
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (connection.readyState !== WebSocket.OPEN) return;
          if (isPaused) return;

          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32 to Int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Send binary directly for v3 API
          connection.send(pcmData.buffer);
        };
      };

      connection.onmessage = (message) => {
        const data = JSON.parse(message.data);
        
        if (data.type === 'Begin') {
          console.log('AssemblyAI Session Begins:', data);
          return;
        }

        if (data.type === 'Turn') {
          if (data.end_of_turn) {
            if (data.transcript) {
              setFinalTranscript((prev) => prev + data.transcript + ' ');
            }
            setInterimTranscript('');
          } else {
            setInterimTranscript(data.transcript);
          }
        } else if (data.error) {
          setError(`AssemblyAI API Error: ${data.error}`);
          setConnectionState('error');
          stopRecording();
        }
      };

      connection.onerror = (err) => {
        console.error('AssemblyAI WebSocket error:', err);
        setError('AssemblyAI connection error. Check API key and network.');
        setConnectionState('error');
        stopRecording();
      };

      connection.onclose = (event) => {
        if (event.code !== 1000 && event.code !== 1005) {
          setError(`AssemblyAI WebSocket closed unexpectedly. Code: ${event.code}`);
          setConnectionState('error');
        } else if (connectionState !== 'error') {
          setConnectionState('disconnected');
        }
        setIsRecording(false);
      };

    } catch (e: any) {
      console.error(e);
      setError(`Failed to start recording: ${e.message}`);
      setConnectionState('error');
      stopRecording();
    }
  }, [apiKey, stopRecording, connectionState, isPaused]);

  const transcribeFile = useCallback(async (file: File) => {
    if (!apiKey) {
      setError('AssemblyAI API key is missing.');
      return;
    }

    try {
      setIsTranscribingFile(true);
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('Uploading file...');

      // 1. Upload the file
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });
      const uploadData = await uploadResponse.json();

      if (!uploadData.upload_url) {
        throw new Error('Upload failed');
      }

      setInterimTranscript('Transcribing... please wait...');

      // 2. Start transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audio_url: uploadData.upload_url })
      });
      const transcriptData = await transcriptResponse.json();

      if (!transcriptData.id) {
        throw new Error('Failed to start transcription');
      }

      // 3. Poll for completion
      const poll = async () => {
        const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
          headers: { 'Authorization': apiKey }
        });
        const pollData = await pollResponse.json();

        if (pollData.status === 'completed') {
          setFinalTranscript(pollData.text);
          setInterimTranscript('');
          setIsTranscribingFile(false);
        } else if (pollData.status === 'error') {
          throw new Error(pollData.error || 'Transcription failed');
        } else {
          setTimeout(poll, 3000);
        }
      };
      
      poll();

    } catch (e: any) {
      console.error('AssemblyAI file transcription error:', e);
      setError(`Failed to transcribe file: ${e.message}`);
      setIsTranscribingFile(false);
      setInterimTranscript('');
    }
  }, [apiKey]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearTranscript = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isPaused,
    isTranscribingFile,
    finalTranscript,
    interimTranscript,
    error,
    connectionState,
    startRecording,
    stopRecording,
    toggleRecording,
    transcribeFile,
    clearTranscript,
  };
}
