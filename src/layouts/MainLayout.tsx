import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MicIcon from '@mui/icons-material/Mic';
import CloudIcon from '@mui/icons-material/Cloud';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';

const drawerWidth = 260;

const NAVIGATION = [
  { id: 'browser-api', label: 'Browser API', icon: <MicIcon /> },
  { id: 'deepgram', label: 'Deepgram', icon: <CloudIcon /> },
  { id: 'whisper', label: 'Whisper', icon: <SmartToyIcon /> },
  { id: 'faster-whisper', label: 'Faster Whisper', icon: <SmartToyIcon /> },
  { id: 'groq', label: 'Groq Whisper', icon: <CloudIcon /> },
  { id: 'assemblyai', label: 'AssemblyAI', icon: <SettingsVoiceIcon /> },
  { id: 'speechmatics', label: 'Speechmatics', icon: <SettingsVoiceIcon /> },
  { id: 'gladia', label: 'Gladia', icon: <SettingsVoiceIcon /> },
  { id: 'comparison', label: 'Comparison', icon: <DashboardIcon /> },
];

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (id: string) => {
    navigate(`/${id}`);
    if (mobileOpen) setMobileOpen(false);
  };

  const currentPath = location.pathname.substring(1);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          STT Playground
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAVIGATION.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPath === item.id}
              onClick={() => handleNavigation(item.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.dark',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  }
                },
                borderRadius: '0 24px 24px 0',
                mr: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {NAVIGATION.find((n) => n.id === currentPath)?.label || 'Playground'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(255, 255, 255, 0.12)' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
