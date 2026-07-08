import { useState, useRef, useCallback, useEffect } from 'react';

export function useDeepgram() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const connectionRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY || '';

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
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

  const startRecording = useCallback(async () => {
    if (!apiKey) {
      setError('Deepgram API key is missing. Add VITE_DEEPGRAM_API_KEY to .env.local.');
      return;
    }

    try {
      setError(null);
      setConnectionState('connecting');
      setFinalTranscript('');
      setInterimTranscript('');

      // 1. Get Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Initialize Deepgram Native WebSocket Connection
      const wsUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&interim_results=true&smart_format=true';
      const connection = new WebSocket(wsUrl, ['token', apiKey]);
      connectionRef.current = connection;

      connection.onopen = () => {
        setConnectionState('connected');
        setIsRecording(true);
        setIsPaused(false);
        
        // 3. Start MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && connection.readyState === WebSocket.OPEN) {
            connection.send(event.data);
          }
        });

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(250); // Send chunks every 250ms
      };

      connection.onmessage = (message) => {
        const data = JSON.parse(message.data);
        
        // Deepgram sends empty transcript sometimes for keepalive, check for alternatives
        if (data.channel && data.channel.alternatives && data.channel.alternatives[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          
          if (data.is_final) {
            if (transcript) {
              setFinalTranscript((prev) => prev + transcript + ' ');
            }
            setInterimTranscript('');
          } else {
            setInterimTranscript(transcript);
          }
        }
      };

      connection.onerror = (err) => {
        console.error('Deepgram WebSocket error:', err);
        setError('Deepgram connection error. Please check your API key.');
        setConnectionState('error');
        stopRecording();
      };

      connection.onclose = () => {
        if (connectionState !== 'error') {
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
  }, [apiKey, stopRecording, connectionState]);

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
    finalTranscript,
    interimTranscript,
    error,
    connectionState,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscript,
  };
}
