import { Box, Typography, Alert } from '@mui/material';
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
      <Box sx={{ p: 3 }}>
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



  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Browser Web Speech API</Typography>
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
      <ImplementationGuide title="Browser Native Business Overview">
        <Typography variant="body1" sx={{ mb: 2 }}><strong>Pricing:</strong> 100% Free.</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}><strong>Free Tier:</strong> Unlimited usage, as it relies on the user's operating system or browser engine.</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}><strong>Key Benefits for Clients:</strong> Requires zero backend infrastructure, no API keys, and no monthly bills. It simply leverages the voice recognition capabilities already built into Google Chrome or Apple Safari.</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}><strong>Best Used For:</strong> Hobby projects, simple voice command interfaces where budget is zero, or internal tools where browser standardization (e.g., forcing everyone to use Chrome) is possible.</Typography>
      </ImplementationGuide>
    </Box>
  );
}
