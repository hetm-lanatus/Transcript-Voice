import { Box, Typography, Alert, Chip, CircularProgress, Button, Divider } from '@mui/material';
import { useRef } from 'react';
import { useSpeechmatics } from './useSpeechmatics';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function SpeechmaticsPage() {
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
  } = useSpeechmatics();

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
    element.download = "speechmatics_transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const data = JSON.stringify({ transcript: finalTranscript, provider: 'Speechmatics', timestamp: new Date().toISOString() }, null, 2);
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = "speechmatics_transcript.json";
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
          <Typography variant="h4" fontWeight="bold">Speechmatics</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Enterprise-grade real-time transcription via WebSocket streaming.
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
              {connectionState === 'connecting' ? 'Generating Token...' : (isRecording ? 'Listening...' : 'Microphone')}
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
        <Typography variant="body1" paragraph><strong>Model Used:</strong> Speechmatics Enhanced English Model</Typography>
        <Typography variant="body1" paragraph><strong>Pricing:</strong> Generous free tier with <strong>50 hours (3,000 minutes) per month completely free</strong>. After that, Pro pricing starts at $0.129 per hour (approx. $0.002 per minute).</Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Uses a <strong>Backend-Proxied JWT Token Authentication</strong> followed by a pure <strong>WebSocket (wss://)</strong> connection. </Typography>
        <ul>
          <li><strong>Step 1 (Auth):</strong> The frontend makes a request to our Vite Proxy (<code>/api/speechmatics-token</code>), which securely fetches a short-lived JSON Web Token (JWT) using the hidden API key.</li>
          <li><strong>Step 2 (Connect):</strong> The frontend connects to the Speechmatics WebSocket endpoint passing the JWT in the connection URL.</li>
          <li><strong>Step 3 (Handshake):</strong> The frontend sends a <code>StartRecognition</code> JSON payload detailing the audio format. We pass <code>type: "file"</code> to instruct Speechmatics to handle standard raw media chunks.</li>
          <li><strong>Step 4 (Stream):</strong> <code>MediaRecorder</code> slices the microphone input into raw WebM binary blobs every 250ms and sends them over the socket.</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> Excellent accuracy across accents, numbers, and jargon. Incredible enterprise-level formatting. By using the <code>type: file</code> config, we avoid the complex manual downsampling (AudioContext/PCM) required by other APIs like AssemblyAI!</li>
          <li><strong>Cons:</strong> Highest pricing among the popular commercial APIs. Requires a proxy token-generation endpoint for secure frontend usage.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
