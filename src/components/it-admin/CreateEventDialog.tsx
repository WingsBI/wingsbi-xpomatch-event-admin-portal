'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

interface EventForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxVisitors: number;
  maxExhibitors: number;
  eventAdminEmail: string;
  eventAdminFirstName: string;
  eventAdminLastName: string;
  eventAdminPassword: string;
  marketingAbbreviation: string;
}

export default function CreateEventDialog({ open, onClose, onEventCreated }: CreateEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedEventId, setGeneratedEventId] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<EventForm>();

  const generateEventId = () => {
    const id = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    setGeneratedEventId(id);
    return id;
  };

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    setError('');

    try {
      const eventId = generatedEventId || generateEventId();
      
      const payload = {
        ...data,
        eventId,
        maxVisitors: Number(data.maxVisitors),
        maxExhibitors: Number(data.maxExhibitors),
      };

      const response = await fetch('/api/it-admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onEventCreated();
        handleClose();
      } else {
        setError(result.error || 'Failed to create event');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    setGeneratedEventId('');
    onClose();
  };

  const handleGenerateId = () => {
    generateEventId();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Create New Event
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new event and assign an event administrator
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Event ID Section */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Event Identification
            </Typography>
            <Box display="flex" gap={2} alignItems="end">
              <TextField
                fullWidth
                label="Event ID"
                value={generatedEventId}
                InputProps={{ readOnly: true }}
                helperText="Auto-generated unique identifier"
              />
              <Button
                variant="outlined"
                onClick={handleGenerateId}
                sx={{ minWidth: 120, height: 56 }}
              >
                Generate ID
              </Button>
            </Box>
          </Box>

          {/* Event Details Section */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Event Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Name"
                  {...register('name', { required: 'Event name is required' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  {...register('description')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...register('startDate', { required: 'Start date is required' })}
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...register('endDate', { required: 'End date is required' })}
                  error={!!errors.endDate}
                  helperText={errors.endDate?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  {...register('location', { required: 'Location is required' })}
                  error={!!errors.location}
                  helperText={errors.location?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Visitors"
                  type="number"
                  {...register('maxVisitors', { 
                    required: 'Max visitors is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                  error={!!errors.maxVisitors}
                  helperText={errors.maxVisitors?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Exhibitors"
                  type="number"
                  {...register('maxExhibitors', { 
                    required: 'Max exhibitors is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                  error={!!errors.maxExhibitors}
                  helperText={errors.maxExhibitors?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Marketing Abbreviation"
                  placeholder="e.g., TECH2024, EXPO24"
                  {...register('marketingAbbreviation')}
                  helperText="Optional: Short code for marketing purposes"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Event Admin Section */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Event Administrator
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  {...register('eventAdminFirstName', { required: 'First name is required' })}
                  error={!!errors.eventAdminFirstName}
                  helperText={errors.eventAdminFirstName?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  {...register('eventAdminLastName', { required: 'Last name is required' })}
                  error={!!errors.eventAdminLastName}
                  helperText={errors.eventAdminLastName?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  {...register('eventAdminEmail', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    }
                  })}
                  error={!!errors.eventAdminEmail}
                  helperText={errors.eventAdminEmail?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Temporary Password"
                  type="password"
                  {...register('eventAdminPassword', { 
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  })}
                  error={!!errors.eventAdminPassword}
                  helperText={errors.eventAdminPassword?.message || 'Event admin will be required to change this on first login'}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !generatedEventId}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 