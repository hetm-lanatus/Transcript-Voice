import { Fab, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { keyframes } from '@emotion/react';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(244, 143, 177, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(244, 143, 177, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 143, 177, 0);
  }
`;

interface MicrophoneButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function MicrophoneButton({ isRecording, onToggle, disabled = false }: MicrophoneButtonProps) {
  return (
    <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'}>
      <span>
        <Fab
          color={isRecording ? 'secondary' : 'primary'}
          aria-label="record"
          onClick={onToggle}
          disabled={disabled}
          sx={{
            width: 80,
            height: 80,
            animation: isRecording ? `${pulse} 1.5s infinite` : 'none',
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
