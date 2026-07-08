import { Box, Typography, Alert, Chip, CircularProgress } from '@mui/material';
import { useAssemblyAI } from './useAssemblyAI';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';

export default function AssemblyaiPage() {
  const {
    isRecording,
    isPaused,
    finalTranscript,
    interimTranscript,
    error,
    connectionState,
    toggleRecording,
    clearTranscript
  } = useAssemblyAI();

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([finalTranscript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "assemblyai_transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const data = JSON.stringify({ transcript: finalTranscript, provider: 'AssemblyAI', timestamp: new Date().toISOString() }, null, 2);
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = "assemblyai_transcript.json";
    document.body.appendChild(element);
    element.click();
  };

  const getConnectionChip = () => {
    switch (connectionState) {
      case 'connecting':
        return <Chip icon={<CircularProgress size={16} />} label="Connecting..." color="warning" size="small" />;
      case 'connected':
        return <Chip icon={<SettingsVoiceIcon fontSize="small" />} label="Connected" color="success" size="small" />;
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
          <Typography variant="h4" fontWeight="bold">AssemblyAI</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Real-time streaming via WebSocket using AssemblyAI Universal-1 model.
          </Typography>
        </Box>
        <Box>
          {getConnectionChip()}
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      
      {!import.meta.env.VITE_ASSEMBLYAI_API_KEY && (
        <Alert severity="warning">
          Missing VITE_ASSEMBLYAI_API_KEY in .env.local file. Transcription will fail.
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
          {connectionState === 'connecting' ? 'Connecting to AssemblyAI...' : (isRecording ? 'Listening...' : 'Click to start')}
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
          interimTranscript={finalTranscript ? interimTranscript : ''} // Sometimes AssemblyAI sends partials slightly out of sync
          onClear={clearTranscript}
        />
      </Box>

      {/* Documentation Panel */}
      <ImplementationGuide>
        <Typography variant="h6" gutterBottom>Implementation Details</Typography>
        <Typography variant="body1" paragraph><strong>Model Used:</strong> <code>universal-3-5-pro</code> (AssemblyAI's latest and most accurate Universal model).</Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Establishes a WebSocket connection to AssemblyAI's v3 streaming endpoint (<code>wss://streaming.assemblyai.com/v3/ws</code>). Because this endpoint requires 16-bit PCM audio, it uses a custom <code>AudioContext</code> and a <code>ScriptProcessorNode</code> to natively downsample the browser's float32 audio stream to 16kHz Int16 PCM in real-time. The binary PCM data is then streamed over the WebSocket.</Typography>
        <Typography variant="body1" paragraph><strong>Features & Capabilities:</strong></Typography>
        <ul>
          <li>Provides accurate real-time streaming with interim and final results (listens for <code>Turn</code> events).</li>
          <li>Fetches a temporary authentication token from the backend (<code>/api/assemblyai-token</code>) to establish the WebSocket connection securely.</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> Excellent accuracy, particularly with complex jargon or noisy environments. Fast latency, supports advanced features like PII redaction and custom vocabulary. Secure frontend integration via temporary tokens.</li>
          <li><strong>Cons:</strong> Requires audio to be manually downsampled and converted to PCM format in the browser via <code>ScriptProcessorNode</code> (unlike other APIs which accept raw WebM blobs), making the frontend audio integration slightly more complex.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
