import { Box, Typography, Alert, Chip, CircularProgress, Button, Divider } from '@mui/material';
import { useRef } from 'react';
import { useGladia } from './useGladia';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function GladiaPage() {
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
  } = useGladia();

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
    element.download = "gladia_transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const data = JSON.stringify({ transcript: finalTranscript, provider: 'Gladia', timestamp: new Date().toISOString() }, null, 2);
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = "gladia_transcript.json";
    document.body.appendChild(element);
    element.click();
  };

  const getConnectionChip = () => {
    switch (connectionState) {
      case 'connecting':
        return <Chip icon={<CircularProgress size={16} />} label="Initializing..." color="warning" size="small" />;
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
          <Typography variant="h4" fontWeight="bold">Gladia</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Lightning-fast real-time transcription powered by advanced audio models.
          </Typography>
        </Box>
        <Box>
          {getConnectionChip()}
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      
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
              {connectionState === 'connecting' ? 'Initializing...' : (isRecording ? 'Listening...' : 'Microphone')}
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
        <Typography variant="body1" paragraph><strong>API Version:</strong> Gladia v2 Live API</Typography>
        <Typography variant="body1" paragraph><strong>Pricing:</strong> Free tier includes 10 hours per month. Pay-as-you-go is ~0.83¢ per minute (approx. $0.50 per hour).</Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Uses a <strong>Proxy Session Initializer</strong> followed by a <strong>WebSocket (wss://)</strong> connection streaming Raw PCM Audio. </Typography>
        <ul>
          <li><strong>Step 1 (Init):</strong> The frontend makes a request to our Vite Proxy (<code>/api/gladia-init</code>), which securely sends a <code>POST</code> request to Gladia's v2 API using the hidden API key to request a new session.</li>
          <li><strong>Step 2 (Connect):</strong> The frontend receives a unique, temporary <code>wss://api.gladia.io/v2/live?token=...</code> URL and opens a connection.</li>
          <li><strong>Step 3 (Downsample):</strong> Because Gladia's real-time endpoint strictly expects raw uncompressed audio, we use the browser's <code>AudioContext</code> to manually downsample the microphone stream into 16,000Hz 16-bit PCM (Pulse-Code Modulation) binary buffers.</li>
          <li><strong>Step 4 (Stream):</strong> The raw buffers are streamed directly over the WebSocket.</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> Excellent speed and accuracy. Clean v2 API design where the token is baked into the URL.</li>
          <li><strong>Cons:</strong> Requires heavy manual PCM downsampling in the frontend. Free tier is strictly limited to 1 concurrent WebSocket connection.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
