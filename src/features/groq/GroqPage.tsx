import { Box, Typography, Alert, Chip, CircularProgress } from '@mui/material';
import { useGroq } from './useGroq';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import CloudIcon from '@mui/icons-material/Cloud';

export default function GroqPage() {
  const {
    isRecording,
    isPaused,
    finalTranscript,
    interimTranscript,
    error,
    connectionState,
    toggleRecording,
    resetTranscript,
  } = useGroq();

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([finalTranscript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "groq_transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const data = JSON.stringify({ transcript: finalTranscript, provider: 'Groq', timestamp: new Date().toISOString() }, null, 2);
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = "groq_transcript.json";
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
          <Typography variant="h4" fontWeight="bold">Groq</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Fast transcription using Groq's Whisper Large V3 API via chunked uploads.
          </Typography>
        </Box>
        <Box>
          {getConnectionChip()}
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Main Interaction Area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4, gap: 2 }}>
        <MicrophoneButton 
          isRecording={isRecording} 
          onToggle={toggleRecording} 
          disabled={connectionState === 'connecting'}
        />
        <Typography variant="caption" color="text.secondary">
          {connectionState === 'connecting' ? 'Connecting to Groq...' : (isRecording ? 'Listening...' : 'Click to start')}
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
          onClear={resetTranscript}
        />
      </Box>

      {/* Documentation Panel */}
      <ImplementationGuide>
        <Typography variant="h6" gutterBottom>Implementation Details</Typography>
        <Typography variant="body1" paragraph><strong>Model Used:</strong> <code>whisper-large-v3</code> (OpenAI's Whisper model running on Groq's high-speed LPU inference engine).</Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Uses a chunked HTTP POST approach rather than WebSockets. The <code>MediaRecorder</code> API slices the user's microphone audio into 2-second chunks. Each chunk is sent as a <code>multipart/form-data</code> upload to Groq's API endpoint (via a Vite proxy to hide the API key). The response is then parsed to update the transcript.</Typography>
        <Typography variant="body1" paragraph><strong>Features & Capabilities:</strong></Typography>
        <ul>
          <li>Provides near-realtime transcription due to Groq's incredibly fast inference speeds.</li>
          <li>Forced English transcription using the <code>language: 'en'</code> parameter to prevent arbitrary language switching.</li>
          <li>Overwrites the transcript with each response instead of appending, to provide more context to Whisper and avoid word-boundary cutoffs.</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> Extremely low inference latency for Whisper. Excellent accuracy from the large-v3 model. Very simple to implement using standard HTTP requests.</li>
          <li><strong>Cons:</strong> Not true streaming; audio chunk boundaries can occasionally cause minor transcription glitches (e.g. cutting words in half) if not handled with overlapping logic.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
