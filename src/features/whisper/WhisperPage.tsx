import { Box, Typography } from '@mui/material';
import ImplementationGuide from '../../shared/components/ImplementationGuide';

export default function WhisperPage() {
  return (
    <Box>
      <Typography variant="h4">WhisperPage</Typography>
      <ImplementationGuide title="Implementation Details">
        <Typography variant="body1" paragraph><strong>Model Used:</strong> <code>whisper-1</code> (OpenAI's standard Whisper model via REST API).</Typography>
        <Typography variant="body1" paragraph><strong>Approach:</strong> Uses standard HTTP POST requests to the OpenAI REST API (<code>/v1/audio/transcriptions</code>). Since OpenAI's standard Whisper API does not support WebSockets or native streaming, audio must be recorded using <code>MediaRecorder</code> into chunks or complete files, then uploaded as <code>multipart/form-data</code>.</Typography>
        <Typography variant="body1" paragraph><strong>Features & Capabilities:</strong></Typography>
        <ul>
          <li>High accuracy for pre-recorded or chunked audio.</li>
          <li>Provides transcription for multiple languages and translation to English.</li>
        </ul>
        <Typography variant="body1" paragraph><strong>Pros & Cons:</strong></Typography>
        <ul>
          <li><strong>Pros:</strong> Industry-standard accuracy, very robust model, simple REST API integration.</li>
          <li><strong>Cons:</strong> Lacks native streaming (WebSocket) support, meaning true real-time transcription with interim results is not natively possible. Relying on chunked uploads introduces latency and can cause word boundary issues.</li>
        </ul>
      </ImplementationGuide>
    </Box>
  );
}
