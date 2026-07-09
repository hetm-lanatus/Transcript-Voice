import { Box, Button, Tooltip } from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onPauseResume?: () => void;
  onRestart?: () => void;
  onDownloadTxt?: () => void;

  hasTranscript: boolean;
}

export default function RecordingControls({
  isRecording,
  isPaused,
  onPauseResume,
  onRestart,
  onDownloadTxt,

  hasTranscript
}: RecordingControlsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', mt: 2 }}>
      {onPauseResume && isRecording && (
        <Tooltip title={isPaused ? "Resume" : "Pause"}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            onClick={onPauseResume}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </Tooltip>
      )}

      {onRestart && (
        <Tooltip title="Restart Session">
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RestartAltIcon />}
            onClick={onRestart}
          >
            Restart
          </Button>
        </Tooltip>
      )}

      {onDownloadTxt && (
        <Tooltip title="Download as Text">
          <span>
            <Button
              variant="text"
              color="info"
              startIcon={<DownloadIcon />}
              onClick={onDownloadTxt}
              disabled={!hasTranscript}
            >
              TXT
            </Button>
          </span>
        </Tooltip>
      )}


    </Box>
  );
}
