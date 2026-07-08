import { useState, useRef, useCallback } from 'react';

export function useWhisper() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const recordingIdRef = useRef(0);
  const lastSuccessfulFetchSequenceRef = useRef(0);
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
      
      recordingIdRef.current += 1;
      const currentRecordingId = recordingIdRef.current;
      lastSuccessfulFetchSequenceRef.current = 0;
      let fetchSequence = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          
          fetchSequence += 1;
          const currentFetchSequence = fetchSequence;
          
          // Combine all chunks so the WebM header is always present
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });

          const formData = new FormData();
          formData.append('file', audioBlob, 'chunk.webm');
          formData.append('model', 'whisper-1');
          formData.append('response_format', 'json');
          formData.append('language', 'en'); // Optional, to force English

          try {
            const response = await fetch('/api/openai/audio/transcriptions', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            
            if (recordingIdRef.current === currentRecordingId && currentFetchSequence > lastSuccessfulFetchSequenceRef.current) {
              if (response.ok && data.text) {
                lastSuccessfulFetchSequenceRef.current = currentFetchSequence;
                // Overwrite the entire transcript instead of appending for chunked approach
                setFinalTranscript(data.text.trim());
              } else if (!response.ok) {
                const errorMessage = data.error?.message || 'Unknown OpenAI API Error';
                console.error('OpenAI API Error:', data.error || data);
                setError(`OpenAI Error: ${errorMessage}`);
                setConnectionState('error');
                stopRecording();
              }
            }
          } catch (err: any) {
            if (recordingIdRef.current === currentRecordingId) {
              console.error('OpenAI transcription error:', err);
              setError(`Network Error: ${err.message}`);
              setConnectionState('error');
              stopRecording();
            }
          }
        }
      };

      // Slice every 2 seconds for a responsive feel, although OpenAI is slower than Groq
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

  const transcribeFile = useCallback(async (file: File) => {
    try {
      setIsTranscribingFile(true);
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');
      formData.append('language', 'en');

      const response = await fetch('/api/openai/audio/transcriptions', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.text) {
        setFinalTranscript(data.text.trim());
      } else {
        const errorMessage = data.error?.message || 'Unknown OpenAI API Error';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Whisper file transcription error:', err);
      setError(`Failed to transcribe file: ${err.message}`);
    } finally {
      setIsTranscribingFile(false);
    }
  }, []);

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
