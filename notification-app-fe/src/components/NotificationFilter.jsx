import { Box, Chip } from '@mui/material';
import { NOTIFICATION_TYPES } from '../config';

export default function NotificationFilter({ selectedFilter, onFilterChange }) {
  const handleFilterClick = (type) => {
    if (selectedFilter === type) {
      onFilterChange(null);
    } else {
      onFilterChange(type);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      {NOTIFICATION_TYPES.map((type) => (
        <Chip
          key={type}
          label={type}
          onClick={() => handleFilterClick(type)}
          color={selectedFilter === type ? 'primary' : 'default'}
          variant={selectedFilter === type ? 'filled' : 'outlined'}
          sx={{ 
            cursor: 'pointer',
            fontSize: '0.9rem',
            '&:hover': {
              backgroundColor: selectedFilter === type ? 'primary.dark' : 'action.hover'
            }
          }}
        />
      ))}
      {selectedFilter && (
        <Chip
          label="Clear Filter"
          onClick={() => onFilterChange(null)}
          color="secondary"
          variant="outlined"
          sx={{ cursor: 'pointer' }}
        />
      )}
    </Box>
  );
}
