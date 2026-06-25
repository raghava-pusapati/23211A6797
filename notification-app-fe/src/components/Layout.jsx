import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Home as HomeIcon, Notifications as NotificationsIcon, Star as StarIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Campus Notifications
          </Typography>
          
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Home
          </Button>
          
          <Button
            color="inherit"
            startIcon={<NotificationsIcon />}
            onClick={() => navigate('/notifications')}
            sx={{
              ml: 1,
              backgroundColor: isActive('/notifications') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Notifications
          </Button>
          
          <Button
            color="inherit"
            startIcon={<StarIcon />}
            onClick={() => navigate('/priority')}
            sx={{
              ml: 1,
              backgroundColor: isActive('/priority') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Priority
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200]
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            Campus Notification Platform © {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
