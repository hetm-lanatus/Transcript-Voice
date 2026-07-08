import { Fab, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function MicrophoneButton({ isRecording, onToggle, disabled = false }: MicrophoneButtonProps) {
  return (
    <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'} placement="top" arrow>
      <span>
        <Fab
          color={isRecording ? 'error' : 'primary'}
          aria-label="record"
          onClick={onToggle}
          disabled={disabled}
          sx={{
            width: 80,
            height: 80,
            backgroundColor: isRecording ? '#d32f2f' : '#ffffff',
            color: isRecording ? '#ffffff' : '#000000',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: isRecording ? '#b71c1c' : '#eeeeee',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '2.5rem',
            },
          }}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </Fab>
      </span>
    </Tooltip>
  );
}
