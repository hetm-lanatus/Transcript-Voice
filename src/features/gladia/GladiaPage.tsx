import { Box, Typography } from '@mui/material';
import ImplementationGuide from '../../shared/components/ImplementationGuide';

export default function GladiaPage() {
  return (
    <Box>
      <Typography variant="h4">GladiaPage</Typography>
      <ImplementationGuide title="Implementation Details">
        <Typography>This feature will be fully implemented soon. Ensure API keys are added to .env.local.</Typography>
      </ImplementationGuide>
    </Box>
  );
}
