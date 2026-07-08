import { useEffect, useRef } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

interface TranscriptViewerProps {
  finalTranscript: string;
  interimTranscript: string;
  onClear?: () => void;
  autoScroll?: boolean;
}

export default function TranscriptViewer({
  finalTranscript,
  interimTranscript,
  onClear,
  autoScroll = true,
}: TranscriptViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [finalTranscript, interimTranscript, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalTranscript);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 300,
        maxHeight: 500,
        bgcolor: '#111',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        justifyContent: 'flex-end', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
        bgcolor: '#0a0a0a' 
      }}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Copy Transcript">
            <IconButton size="small" onClick={handleCopy} disabled={!finalTranscript} sx={{ color: 'text.secondary' }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {onClear && (
            <Tooltip title="Clear Transcript">
              <IconButton size="small" onClick={onClear} disabled={!finalTranscript && !interimTranscript} sx={{ color: 'text.secondary' }}>
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          p: 3,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          fontSize: '1rem',
          lineHeight: 1.6,
          color: 'text.primary',
        }}
      >
        {(!finalTranscript && !interimTranscript) ? (
          <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.disabled" sx={{ fontStyle: 'italic' }}>
              Waiting for speech...
            </Typography>
          </Box>
        ) : (
          <Typography component="div" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: 400 }}>
            <span style={{ color: '#E0E0E0' }}>{finalTranscript}</span>
            <span style={{ color: '#777', fontStyle: 'italic' }}>
              {interimTranscript && (finalTranscript ? ' ' : '') + interimTranscript}
            </span>
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
