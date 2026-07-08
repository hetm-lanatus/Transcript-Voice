import { Box, Typography, Paper, Chip, Divider, IconButton, Tooltip } from '@mui/material';
import { useWebSpeech } from '../browser-api/useWebSpeech';
import { useDeepgram } from '../deepgram/useDeepgram';
import { useWhisper } from '../whisper/useWhisper';
import { useGroq } from '../groq/useGroq';
import { useAssemblyAI } from '../assemblyai/useAssemblyAI';
import { useSpeechmatics } from '../speechmatics/useSpeechmatics';
import { useGladia } from '../gladia/useGladia';

import MicrophoneButton from '../../shared/components/MicrophoneButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export default function ComparisonPage() {
  const browser = useWebSpeech();
  const deepgram = useDeepgram();
  const whisper = useWhisper();
  const groq = useGroq();
  const assemblyai = useAssemblyAI();
  const speechmatics = useSpeechmatics();
  const gladia = useGladia();

  const engines = [
    { id: 'browser', name: 'Browser API', hook: browser },
    { id: 'deepgram', name: 'Deepgram', hook: deepgram },
    { id: 'whisper', name: 'Whisper (OpenAI)', hook: whisper },
    { id: 'groq', name: 'Groq Whisper', hook: groq },
    { id: 'assemblyai', name: 'AssemblyAI', hook: assemblyai },
    { id: 'speechmatics', name: 'Speechmatics', hook: speechmatics },
    { id: 'gladia', name: 'Gladia', hook: gladia },
  ];

  const isAnyRecording = engines.some(e => e.hook.isRecording);

  const handleMasterToggle = () => {
    engines.forEach(e => {
      if (!isAnyRecording && !e.hook.isRecording) {
        if (e.id === 'browser') (e.hook as any).toggleRecording();
        else (e.hook as any).toggleRecording();
      } else if (isAnyRecording && e.hook.isRecording) {
        e.hook.toggleRecording();
      }
    });
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Ultimate Comparison
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Run all transcription engines side-by-side to compare latency, accuracy, and formatting in real-time.
        </Typography>
      </Box>

      {/* Master Controller */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MicrophoneButton 
              isRecording={isAnyRecording} 
              onToggle={handleMasterToggle}
            />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Mic</Typography>
          </Box>
        </Box>
      </Box>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
          gap: 3,
          width: '100%'
        }}
      >
        {engines.map((engine) => (
          <Paper 
            key={engine.id}
            elevation={0} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              height: 320,
              border: engine.hook.isRecording ? '1px solid #4caf50' : '1px solid rgba(255, 255, 255, 0.1)',
              bgcolor: '#111',
              transition: 'all 0.2s ease',
              position: 'relative',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 2 }}>
              <Typography variant="subtitle1" fontWeight="600" noWrap>
                {engine.name}
              </Typography>
              <Chip 
                label={engine.hook.connectionState || 'disconnected'} 
                color={getStatusColor(engine.hook.connectionState || '') as any}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', flexShrink: 0 }}
              />
            </Box>
            
            <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.05)' }} />

            {engine.hook.error && (
              <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.8rem' }}>
                {engine.hook.error}
              </Typography>
            )}

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#E0E0E0' }}>
                {engine.hook.finalTranscript}
                <Box component="span" sx={{ color: '#777', fontStyle: 'italic', ml: engine.hook.finalTranscript ? 1 : 0 }}>
                  {engine.hook.interimTranscript}
                </Box>
              </Typography>
              {(!engine.hook.finalTranscript && !engine.hook.interimTranscript && !engine.hook.error) && (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 4 }}>
                  Waiting for speech...
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
