'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit,
  Event as EventIcon,
  LocationOn,
  People,
  Business,
  CalendarToday,
} from '@mui/icons-material';
import { Event } from '@/types';

interface EventDetailsCardProps {
  event: Event;
  onEventUpdate: () => void;
}

export default function EventDetailsCard({ event, onEventUpdate }: EventDetailsCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>(event);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/event-admin/event/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedEvent),
      });

      if (response.ok) {
        onEventUpdate();
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };



  return (
    <>
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                {event.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={event.status}
                  color={getStatusColor(event.status) as any}
                  sx={{ textTransform: 'capitalize' }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: 'grey.100',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                  }}
                >
                  {event.eventId}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              {/* <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={handleShare}
              >
                Share
              </Button> */}
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEdit}
              >
                Edit Event
              </Button>
            </Box>
          </Box>

          {event.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {event.description}
            </Typography>
          )}

          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={9} mb={2}>
                <Box display="flex" alignItems="center" minWidth="200px">
                  <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2">Start Date</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.startDate)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" minWidth="200px">
                  <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2">End Date</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.endDate)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" minWidth="200px">
                  <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2">Location</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.location}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <People sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2">Max Visitors</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.maxVisitors || 'Unlimited'}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" mb={2}>
                <Business sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2">Max Exhibitors</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.maxExhibitors || 'Unlimited'}
                  </Typography>
                </Box>
              </Box>

              {event.marketingAbbreviation && (
                <Box display="flex" alignItems="center" mb={2}>
                  <EventIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2">Marketing Code</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.marketingAbbreviation}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid> */}
          </Grid>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Event Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Name"
                value={editedEvent.name || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editedEvent.description || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={editedEvent.startDate ? new Date(editedEvent.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, startDate: new Date(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={editedEvent.endDate ? new Date(editedEvent.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, endDate: new Date(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={editedEvent.location || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Visitors"
                type="number"
                value={editedEvent.maxVisitors || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, maxVisitors: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Exhibitors"
                type="number"
                value={editedEvent.maxExhibitors || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, maxExhibitors: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Marketing Abbreviation"
                value={editedEvent.marketingAbbreviation || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, marketingAbbreviation: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 