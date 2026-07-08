import { Box, Typography } from '@mui/material';
import ImplementationGuide from '../../shared/components/ImplementationGuide';

export default function ComparisonPage() {
  return (
    <Box>
      <Typography variant="h4">ComparisonPage</Typography>
      <ImplementationGuide title="Implementation Details">
        <Typography>This feature will be fully implemented soon. Ensure API keys are added to .env.local.</Typography>
      </ImplementationGuide>
    </Box>
  );
}
