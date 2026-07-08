import { Box, Typography, Alert, Chip, CircularProgress } from '@mui/material';
import { useDeepgram } from './useDeepgram';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import CloudIcon from '@mui/icons-material/Cloud';

export default function DeepgramPage() {
  const {
    isRecording,
    isPaused,
    finalTranscript,
    interimTranscript,
    error,
    connectionState,
    toggleRecording,
    clearTranscript
  } = useDeepgram();

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
            Real-time streaming via WebSocket using Nova-2 model.
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
        <MicrophoneButton 
          isRecording={isRecording} 
          onToggle={toggleRecording} 
          disabled={connectionState === 'connecting'}
        />
        <Typography variant="caption" color="text.secondary">
          {connectionState === 'connecting' ? 'Connecting to Deepgram...' : (isRecording ? 'Listening...' : 'Click to start')}
        </Typography>

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
