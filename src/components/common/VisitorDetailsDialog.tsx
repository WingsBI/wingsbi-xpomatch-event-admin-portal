import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { fieldMappingApi } from '@/services/fieldMappingApi';

interface VisitorDetailsDialogProps {
  visitorId: number | null;
  open: boolean;
  onClose: () => void;
  identifier: string;
}

const VisitorDetailsDialog: React.FC<VisitorDetailsDialogProps> = ({ visitorId, open, onClose, identifier }) => {
  const [loading, setLoading] = useState(false);
  const [visitor, setVisitor] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && visitorId) {
      setLoading(true);
      setError(null);
      fieldMappingApi.getVisitorById(identifier, visitorId)
        .then((res) => {
          if (res && res.statusCode === 200 && res.result && res.result.length > 0) {
            setVisitor(res.result[0]);
          } else {
            setError(res.message || 'No visitor data found.');
            setVisitor(null);
          }
        })
        .catch((err) => {
          setError('Failed to fetch visitor details.');
          setVisitor(null);
        })
        .finally(() => setLoading(false));
    } else {
      setVisitor(null);
      setError(null);
    }
  }, [open, visitorId, identifier]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Typography variant="h6">Visitor Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ background: '#f7fffa' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : visitor ? (
          <Box sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: '#4caf50', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                {visitor.firstName?.[0]}{visitor.lastName?.[0]}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>{visitor.salutation} {visitor.firstName} {visitor.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{visitor.userProfile?.jobTitle || visitor.userProfile?.designation || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">{visitor.userProfile?.companyName || '-'}</Typography>
              </Box>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={4}>
              <Box minWidth={320}>
                <Typography variant="body2"><b>Email:</b> {visitor.email || '-'}</Typography>
                <Typography variant="body2"><b>Phone:</b> {visitor.userProfile?.phone || '-'}</Typography>
                <Typography variant="body2"><b>Country:</b> {visitor.userAddress?.countryName || '-'}</Typography>
                <Typography variant="body2"><b>Status:</b> {visitor.statusName || '-'}</Typography>
                <Typography variant="body2"><b>Registration Date:</b> {visitor.createdDate ? new Date(visitor.createdDate).toLocaleString() : '-'}</Typography>
                <Typography variant="body2"><b>Salutation:</b> {visitor.salutation || '-'}</Typography>
                <Typography variant="body2"><b>Middle Name:</b> {visitor.middleName || '-'}</Typography>
                <Typography variant="body2"><b>Gender:</b> {visitor.gender || '-'}</Typography>
                <Typography variant="body2"><b>Date of Birth:</b> {visitor.dateOfBirth || '-'}</Typography>
                <Typography variant="body2"><b>Nationality:</b> {visitor.userProfile?.nationality || '-'}</Typography>
              </Box>
              <Box minWidth={320}>
                <Typography variant="body2"><b>LinkedIn:</b> {visitor.userProfile?.linkedInProfile ? <a href={visitor.userProfile.linkedInProfile} target="_blank" rel="noopener noreferrer">{visitor.userProfile.linkedInProfile}</a> : '-'}</Typography>
                <Typography variant="body2"><b>Instagram:</b> {visitor.userProfile?.instagramProfile ? <a href={visitor.userProfile.instagramProfile} target="_blank" rel="noopener noreferrer">{visitor.userProfile.instagramProfile}</a> : '-'}</Typography>
                <Typography variant="body2"><b>GitHub:</b> {visitor.userProfile?.gitHubProfile ? <a href={visitor.userProfile.gitHubProfile} target="_blank" rel="noopener noreferrer">{visitor.userProfile.gitHubProfile}</a> : '-'}</Typography>
                <Typography variant="body2"><b>Twitter:</b> {visitor.userProfile?.twitterProfile ? <a href={visitor.userProfile.twitterProfile} target="_blank" rel="noopener noreferrer">{visitor.userProfile.twitterProfile}</a> : '-'}</Typography>
                <Typography variant="body2"><b>Decision Maker:</b> {visitor.userProfile?.decisionmaker !== undefined ? (visitor.userProfile.decisionmaker ? 'Yes' : 'No') : '-'}</Typography>
                <Typography variant="body2"><b>Experience:</b> {visitor.userProfile?.experienceYears !== undefined ? visitor.userProfile.experienceYears : '-'}</Typography>
                <Typography variant="body2"><b>Interests:</b> {visitor.interest || '-'}</Typography>
                <Typography variant="body2"><b>Technology:</b> {visitor.userProfile?.technology || '-'}</Typography>
                <Typography variant="body2"><b>Looking For:</b> {visitor.userProfile?.lookingFor || '-'}</Typography>
              </Box>
              <Box minWidth={320}>
                <Typography variant="body2"><b>Address:</b> {visitor.userAddress?.addressLine1 || '-'} {visitor.userAddress?.addressLine2 || ''}</Typography>
                <Typography variant="body2"><b>City:</b> {visitor.userAddress?.cityName || '-'}</Typography>
                <Typography variant="body2"><b>State:</b> {visitor.userAddress?.stateName || '-'}</Typography>
                <Typography variant="body2"><b>Postal Code:</b> {visitor.userAddress?.postalCode || '-'}</Typography>
                <Typography variant="body2"><b>Location:</b> {visitor.userAddress?.cityName && visitor.userAddress?.stateName ? `${visitor.userAddress.cityName}, ${visitor.userAddress.stateName}` : '-'}</Typography>
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default VisitorDetailsDialog; 