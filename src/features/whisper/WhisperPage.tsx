import { Box, Typography, Alert, Chip, CircularProgress, Button, Divider } from '@mui/material';
import { useRef } from 'react';
import { useWhisper } from './useWhisper';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function WhisperPage() {
  const {
    isRecording,
    isPaused,
    isTranscribingFile,
    finalTranscript,
    interimTranscript,
    error,
    connectionState,
    toggleRecording,
    transcribeFile,
    resetTranscript,
  } = useWhisper();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    transcribeFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([finalTranscript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "whisper_transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const data = JSON.stringify({ transcript: finalTranscript, provider: 'Whisper', timestamp: new Date().toISOString() }, null, 2);
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = "whisper_transcript.json";
    document.body.appendChild(element);
    element.click();
  };

  const getConnectionChip = () => {
    switch (connectionState) {
      case 'connecting':
        return <Chip icon={<CircularProgress size={16} />} label="Connecting..." color="warning" size="small" />;
      case 'connected':
        return <Chip icon={<SmartToyIcon fontSize="small" />} label="Connected" color="success" size="small" />;
      case 'error':
        return <Chip label="Error" color="error" size="small" />;
      default:
        return <Chip label="Disconnected" size="small" />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">OpenAI Whisper</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Transcription using OpenAI's standard Whisper model via chunked uploads.
          </Typography>
        </Box>
        <Box>
          {getConnectionChip()}
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      
      {!import.meta.env.VITE_OPENAI_API_KEY && (
        <Alert severity="warning">
          Missing VITE_OPENAI_API_KEY in .env.local file. Transcription will fail.
        </Alert>
      )}

      {/* Main Interaction Area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MicrophoneButton 
              isRecording={isRecording} 
              onToggle={toggleRecording} 
              disabled={connectionState === 'connecting' || isTranscribingFile}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {connectionState === 'connecting' ? 'Connecting...' : (isRecording ? 'Listening...' : 'Microphone')}
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem />

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input 
              type="file" 
              accept="audio/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={isTranscribingFile ? <CircularProgress size={20} /> : <UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || isTranscribingFile}
              sx={{ height: 64, width: 180, borderRadius: 2 }}
            >
              {isTranscribingFile ? 'Transcribing...' : 'Upload File'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Static File Transcription
            </Typography>
          </Box>
        </Box>

        <RecordingControls 
          isRecording={isRecording}
          isPaused={isPaused}
          hasTranscript={!!finalTranscript}
          onDownloadTxt={handleDownloadTxt}
          onDownloadJson={handleDownloadJson}
        />
      </Box>

      {/* Transcript Area */}
      <Box sx={{ flexGrow: 1, minHeight: 400 }}>
        <TranscriptViewer 
          finalTranscript={finalTranscript}
          interimTranscript={interimTranscript}
          onClear={resetTranscript}
        />
      </Box>

      {/* Documentation Panel */}
      <ImplementationGuide title="Implementation Details">
        <Typography variant="body1" paragraph><strong>Model Used:</strong> <code>whisper-1</code> (OpenAI's standard Whisper model via REST API).</Typography>
        <Typography variant="body1" paragraph><strong>Pricing:</strong> $0.006 per minute for the standard <code>whisper-1</code> model. <em>Note: OpenAI does not provide free trial credits for new accounts; a paid billing account is required to avoid "insufficient_quota" errors.</em></Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Uses standard HTTP POST requests to the OpenAI REST API (<code>/v1/audio/transcriptions</code>). Since OpenAI's standard Whisper API does not support WebSockets or native streaming, audio must be recorded using <code>MediaRecorder</code> into chunks or complete files, then uploaded as <code>multipart/form-data</code>.</Typography>
        <Typography variant="body1" paragraph><strong>Features & Capabilities:</strong></Typography>
        <ul>
          <li>High accuracy for pre-recorded or chunked audio.</li>
          <li>Provides transcription for multiple languages and translation to English.</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> Industry-standard accuracy, very robust model, simple REST API integration.</li>
          <li><strong>Cons:</strong> Lacks native streaming (WebSocket) support, meaning true real-time transcription with interim results is not natively possible. Relying on chunked uploads introduces latency and can cause word boundary issues.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
