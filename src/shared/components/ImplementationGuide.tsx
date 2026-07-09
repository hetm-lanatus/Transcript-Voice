import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';

interface ImplementationGuideProps {
  title?: string;
  children: React.ReactNode;
}

export default function ImplementationGuide({ title = "Implementation Guide", children }: ImplementationGuideProps) {
  return (
    <Accordion sx={{ mt: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          <Typography sx={{ fontWeight: 500 }}>{title}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Typography component="div" variant="body2" sx={{ '& h3, & h4': { mt: 2, mb: 1 }, '& p, & ul': { mb: 2 } }}>
          {children}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
