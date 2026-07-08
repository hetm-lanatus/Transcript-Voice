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
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 300,
        maxHeight: 500,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Copy Transcript">
            <IconButton size="small" onClick={handleCopy} disabled={!finalTranscript}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {onClear && (
            <Tooltip title="Clear Transcript">
              <IconButton size="small" onClick={onClear} color="error" disabled={!finalTranscript && !interimTranscript}>
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          p: 2,
          flexGrow: 1,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          fontSize: '1.1rem',
          lineHeight: 1.6,
        }}
      >
        <Typography variant="body1" component="span" sx={{ color: 'text.primary' }}>
          {finalTranscript}
        </Typography>
        {finalTranscript && interimTranscript && ' '}
        <Typography variant="body1" component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          {interimTranscript}
        </Typography>

        {!finalTranscript && !interimTranscript && (
          <Typography variant="body1" sx={{ color: 'text.disabled', textAlign: 'center', mt: 4 }}>
            Waiting for speech...
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
