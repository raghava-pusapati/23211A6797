import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import {
  Work as PlacementIcon,
  Assessment as ResultIcon,
  Event as EventIcon
} from '@mui/icons-material';

const getTypeIcon = (type) => {
  switch (type) {
    case 'Placement':
      return <PlacementIcon sx={{ mr: 1 }} />;
    case 'Result':
      return <ResultIcon sx={{ mr: 1 }} />;
    case 'Event':
      return <EventIcon sx={{ mr: 1 }} />;
    default:
      return null;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'Placement':
      return 'success';
    case 'Result':
      return 'primary';
    case 'Event':
      return 'warning';
    default:
      return 'default';
  }
};

export default function NotificationCard({ notification }) {
  const formattedDate = new Date(notification.Timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card 
      sx={{ 
        mb: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getTypeIcon(notification.Type)}
            <Chip 
              label={notification.Type} 
              color={getTypeColor(notification.Type)}
              size="small"
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formattedDate}
          </Typography>
        </Box>
        
        <Typography variant="h6" component="div" sx={{ mt: 1 }}>
          {notification.Message}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          ID: {notification.ID}
        </Typography>
      </CardContent>
    </Card>
  );
}
