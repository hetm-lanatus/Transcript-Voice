import { Box, Typography, Alert, Chip, CircularProgress, Button, Divider } from '@mui/material';
import { useRef } from 'react';
import { useGroq } from './useGroq';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';
import CloudIcon from '@mui/icons-material/Cloud';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function GroqPage() {
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
  } = useGroq();

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
      <ImplementationGuide>
        <Typography variant="h6" gutterBottom>Implementation Details</Typography>
        <Typography variant="body1" paragraph><strong>Model Used:</strong> <code>whisper-large-v3</code> (OpenAI's Whisper model running on Groq's high-speed LPU inference engine).</Typography>
        <Typography variant="body1" paragraph><strong>Pricing:</strong> Extremely cost-effective at $0.111 per hour (approx. $0.00185 per minute) for the Large v3 model.</Typography>
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
