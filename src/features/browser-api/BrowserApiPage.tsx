import { Box, Typography, Alert, Stack, Divider } from '@mui/material';
import { useWebSpeech } from './useWebSpeech';
import MicrophoneButton from '../../shared/components/MicrophoneButton';
import TranscriptViewer from '../../shared/components/TranscriptViewer';
import RecordingControls from '../../shared/components/RecordingControls';
import ImplementationGuide from '../../shared/components/ImplementationGuide';

export default function BrowserApiPage() {
  const {
    isSupported,
    isRecording,
    isPaused,
    finalTranscript,
    interimTranscript,
    error,
    toggleRecording,
    clearTranscript
  } = useWebSpeech({ continuous: true, interimResults: true });

  if (!isSupported) {
    return (
      <Box p={3}>
        <Alert severity="error">
          The Web Speech API is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari.
        </Alert>
      </Box>
    );
  }

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([finalTranscript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "transcript.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const data = JSON.stringify({ transcript: finalTranscript, provider: 'Browser API', timestamp: new Date().toISOString() }, null, 2);
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = "transcript.json";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Browser Web Speech API</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Uses the built-in browser engine (usually handled by the OS or Google Cloud for Chrome). No API key required.
          </Typography>
        </Box>
        {/* Status indicator could go here */}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Main Interaction Area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4, gap: 2 }}>
        <MicrophoneButton 
          isRecording={isRecording} 
          onToggle={toggleRecording} 
        />
        <Typography variant="caption" color="text.secondary">
          {isRecording ? 'Listening...' : 'Click to start'}
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
        <Typography variant="body1" paragraph><strong>Model Used:</strong> Built-in browser speech recognition engine (e.g., Google's engine on Chrome, Apple's on Safari).</Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Utilizes the native <code>window.SpeechRecognition</code> or <code>window.webkitSpeechRecognition</code> Web Speech API. It runs entirely on the client side without needing any external API keys, SDKs, or backend services.</Typography>
        <Typography variant="body1" paragraph><strong>Features & Capabilities:</strong></Typography>
        <ul>
          <li>Supports <code>continuous</code> listening mode and provides <code>interimResults</code> for real-time feedback.</li>
          <li>Requires zero dependencies and is completely free to use.</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> No API key needed, completely free, built directly into the browser, simple to implement.</li>
          <li><strong>Cons:</strong> Inconsistent support across browsers (e.g., experimental/disabled in Firefox), privacy concerns (audio might be sent to Google/Apple without strict guarantees), varying accuracy depending on OS/Browser, and no advanced features like speaker diarization.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
