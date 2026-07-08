import { Box, Typography, Alert, Chip, CircularProgress, Button, Divider } from '@mui/material';
import { useRef } from 'react';
import { useDeepgram } from './useDeepgram';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import CloudIcon from '@mui/icons-material/Cloud';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function DeepgramPage() {
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
    clearTranscript
  } = useDeepgram();

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
    element.download = "deepgram_transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const data = JSON.stringify({ transcript: finalTranscript, provider: 'Deepgram', timestamp: new Date().toISOString() }, null, 2);
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = "deepgram_transcript.json";
    document.body.appendChild(element);
    element.click();
  };

  const getConnectionChip = () => {
    switch (connectionState) {
      case 'connecting':
        return <Chip icon={<CircularProgress size={16} />} label="Connecting..." color="warning" size="small" />;
      case 'connected':
        return <Chip icon={<CloudIcon fontSize="small" />} label="Connected" color="success" size="small" />;
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
          <Typography variant="h4" fontWeight="bold">Deepgram</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Real-time streaming via WebSocket using Nova-3 model.
          </Typography>
        </Box>
        <Box>
          {getConnectionChip()}
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      
      {!import.meta.env.VITE_DEEPGRAM_API_KEY && (
        <Alert severity="warning">
          Missing VITE_DEEPGRAM_API_KEY in .env.local file. Transcription will fail.
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
          onClear={clearTranscript}
        />
      </Box>

      {/* Documentation Panel */}
      <ImplementationGuide>
        <Typography variant="h6" gutterBottom>Implementation Details</Typography>
        <Typography variant="body1" paragraph><strong>Model Used:</strong> <code>nova-2</code> (Deepgram's fastest and most accurate model).</Typography>
        <Typography variant="body1" paragraph><strong>Pricing:</strong> Approximately $0.35 per hour for the Nova-2 streaming model.</Typography>
        <Typography variant="body1" paragraph><strong>Pricing:</strong> Approximately $0.29 per hour for the Nova-3 streaming model.</Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Establishes a native WebSocket connection to <code>wss://api.deepgram.com/v1/listen</code> for real-time streaming audio transcription. The browser captures audio using <code>MediaRecorder</code>, chunks it into 250ms <code>audio/webm</code> blobs, and streams it directly to the Deepgram server. Deepgram responds asynchronously via WebSocket messages with interim and final JSON transcripts.</Typography>
        <Typography variant="body1" paragraph><strong>Features & Capabilities:</strong></Typography>
        <ul>
          <li>Highly responsive with low latency (typically ~300ms).</li>
          <li>Provides robust interim results (<code>interim_results=true</code>) and automatic smart formatting/punctuation (<code>smart_format=true</code>).</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> Extremely fast latency, highly accurate (Nova-2 model), robust punctuation, supports many languages, easily identifiable interim vs final results.</li>
          <li><strong>Cons:</strong> Requires a paid API key. In a production app, securely managing the API key requires setting up backend token generation or proxying the WebSocket, as exposing it client-side is insecure.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
