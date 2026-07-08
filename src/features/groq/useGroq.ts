import { useState, useRef, useCallback } from 'react';

export function useGroq() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setConnectionState('disconnected');
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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          
          // Combine all chunks so the WebM header is always present
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });

          const formData = new FormData();
          formData.append('file', audioBlob, 'chunk.webm');
          formData.append('model', 'whisper-large-v3');
          formData.append('response_format', 'json');
          formData.append('language', 'en');

          try {
            const response = await fetch('/api/groq/audio/transcriptions', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            
            if (response.ok && data.text) {
              // Overwrite the entire transcript instead of appending.
              // This is great because it gives Whisper more context and fixes word-boundary cutoffs!
              setFinalTranscript(data.text.trim());
            } else if (!response.ok) {
              console.error('Groq API Error:', data.error || data);
            }
          } catch (err) {
            console.error('Groq transcription error:', err);
          }
        }
      };

      // Slice every 2 seconds for a responsive feel
      mediaRecorder.start(2000);  

      setIsRecording(true);
      setConnectionState('connected');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error starting microphone');
      setConnectionState('error');
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  return {
    isRecording,
    isPaused,
    toggleRecording,
    togglePause,
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
