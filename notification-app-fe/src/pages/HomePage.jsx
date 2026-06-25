import { Container, Typography, Box, Card, CardContent, Grid, Button } from '@mui/material';
import { Notifications as NotificationsIcon, Star as StarIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Campus Notification Platform
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Stay updated with placements, results, and events
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
            onClick={() => navigate('/notifications')}
          >
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="div" gutterBottom>
                All Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View all notifications with filters and pagination
              </Typography>
              <Button variant="contained" size="large">
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
            onClick={() => navigate('/priority')}
          >
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <StarIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
              <Typography variant="h5" component="div" gutterBottom>
                Priority Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View top priority notifications (Placements first)
              </Typography>
              <Button variant="contained" color="warning" size="large">
                View Priority
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Notifications are sorted by priority: Placement → Result → Event
        </Typography>
      </Box>
    </Container>
  );
}
