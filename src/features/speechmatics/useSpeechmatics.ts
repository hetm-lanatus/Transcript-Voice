import { useState, useRef, useCallback } from 'react';

export function useSpeechmatics() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectionRef = useRef<WebSocket | null>(null);

  const apiKey = import.meta.env.VITE_SPEECHMATICS_API_KEY || '';

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
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
    setConnectionState('disconnected');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('');

      // 1. Fetch short-lived token from backend proxy
      const response = await fetch('/api/speechmatics-token');
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Failed to get Speechmatics token');
      }

      // 2. Get Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect to Speechmatics WebSocket
      const wsUrl = `wss://eu2.rt.speechmatics.com/v2/en?jwt=${data.token}`;
      const connection = new WebSocket(wsUrl);
      connectionRef.current = connection;

      connection.onopen = async () => {
        // 4. Send StartRecognition Message
        connection.send(JSON.stringify({
          message: 'StartRecognition',
          audio_format: {
            type: 'file',
          },
          transcription_config: {
            language: 'en',
            enable_partials: true,
          }
        }));

        setConnectionState('connected');

        // 4. Start Recording Audio (WebM File Chunks)
        const stream = streamRef.current;
        if (!stream) return;
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && connection.readyState === WebSocket.OPEN) {
            connection.send(event.data);
          }
        };

        // Slice frequently to simulate streaming a file
        mediaRecorder.start(250);
        setIsRecording(true);
      };

      connection.onmessage = (message) => {
        const received = JSON.parse(message.data);
        
        if (received.message === 'AddPartialTranscript' || received.message === 'AddTranscript') {
          const results = received.results;
          if (results && results.length > 0) {
            const transcript = results.map((r: any) => r.alternatives[0].content).join(' ');
            
            if (received.message === 'AddTranscript') {
              setFinalTranscript((prev) => prev + transcript + ' ');
              setInterimTranscript('');
            } else {
              setInterimTranscript(transcript);
            }
          }
        } else if (received.message === 'EndOfTranscript') {
          stopRecording();
        } else if (received.message === 'Error') {
          setError(`Speechmatics Error: ${received.type} - ${received.reason}`);
          setConnectionState('error');
          stopRecording();
        }
      };

      connection.onerror = (error) => {
        console.error('Speechmatics WebSocket Error:', error);
        setError('WebSocket error connecting to Speechmatics');
        setConnectionState('error');
        stopRecording();
      };

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error starting Speechmatics');
      setConnectionState('error');
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const transcribeFile = useCallback(async (file: File) => {
    if (!apiKey) {
      setError('Speechmatics API key is missing.');
      return;
    }

    try {
      setIsTranscribingFile(true);
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('Uploading file...');

      const formData = new FormData();
      formData.append('data_file', file);
      formData.append('config', JSON.stringify({
        type: 'transcription',
        transcription_config: {
          language: 'en',
          operating_point: 'enhanced'
        }
      }));

      // 1. Submit Job
      const submitResponse = await fetch('https://asr.api.speechmatics.com/v2/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });
      const submitData = await submitResponse.json();

      if (!submitData.id) {
        throw new Error(submitData.error || 'Failed to submit job');
      }

      setInterimTranscript('Transcribing... please wait...');

      // 2. Poll for completion
      const poll = async () => {
        const pollResponse = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${submitData.id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const pollData = await pollResponse.json();

        if (pollData.job?.status === 'done') {
          // Fetch the transcript text
          const transcriptResponse = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${submitData.id}/transcript?format=txt`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          const transcriptText = await transcriptResponse.text();
          
          setFinalTranscript(transcriptText);
          setInterimTranscript('');
          setIsTranscribingFile(false);
        } else if (pollData.job?.status === 'rejected' || pollData.job?.status === 'deleted') {
          throw new Error('Transcription job failed or was rejected');
        } else {
          setTimeout(poll, 3000);
        }
      };
      
      poll();

    } catch (e: any) {
      console.error('Speechmatics file transcription error:', e);
      setError(`Failed to transcribe file: ${e.message}`);
      setIsTranscribingFile(false);
      setInterimTranscript('');
    }
  }, [apiKey]);

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
