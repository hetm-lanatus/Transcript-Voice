import { Box, Typography, Alert, Chip, CircularProgress, Button, Divider } from '@mui/material';
import { useRef } from 'react';
import { useAssemblyAI } from './useAssemblyAI';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function AssemblyaiPage() {
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
  } = useAssemblyAI();

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
          interimTranscript={finalTranscript ? interimTranscript : ''} // Sometimes AssemblyAI sends partials slightly out of sync
          onClear={clearTranscript}
        />
      </Box>

      {/* Documentation Panel */}
      <ImplementationGuide>
        <Typography variant="h6" gutterBottom>Implementation Details</Typography>
        <Typography variant="body1" paragraph><strong>Model Used:</strong> <code>universal-3.5-pro</code> (AssemblyAI's latest and most accurate Universal model).</Typography>
        <Typography variant="body1" paragraph><strong>Pricing:</strong> $0.21 per hour for Universal-3.5 Pro and Universal-3 Pro, and $0.15 per hour for Universal-2.</Typography>
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
