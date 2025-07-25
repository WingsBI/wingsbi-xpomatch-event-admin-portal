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

interface ExhibitorDetailsDialogProps {
  exhibitorId: number | null;
  open: boolean;
  onClose: () => void;
  identifier: string;
}

const ExhibitorDetailsDialog: React.FC<ExhibitorDetailsDialogProps> = ({ exhibitorId, open, onClose, identifier }) => {
  const [loading, setLoading] = useState(false);
  const [exhibitor, setExhibitor] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && exhibitorId) {
      setLoading(true);
      setError(null);
      fieldMappingApi.getExhibitorById(identifier, exhibitorId)
        .then((res) => {
          if (res && res.statusCode === 200 && res.result) {
            setExhibitor(res.result);
          } else {
            setError(res.message || 'No exhibitor data found.');
            setExhibitor(null);
          }
        })
        .catch(() => {
          setError('Failed to fetch exhibitor details.');
          setExhibitor(null);
        })
        .finally(() => setLoading(false));
    } else {
      setExhibitor(null);
      setError(null);
    }
  }, [open, exhibitorId, identifier]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Typography variant="h6">Exhibitor Details</Typography>
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
        ) : exhibitor ? (
          <Box sx={{ p: 2 }}>
            {/* Basic Info */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                {exhibitor.companyName?.[0] || exhibitor.firstName?.[0] || ''}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>{exhibitor.companyName || (exhibitor.firstName + ' ' + exhibitor.lastName)}</Typography>
                {/* <Typography variant="body2" color="text.secondary">{exhibitor.jobTitle || '-'}</Typography> */}
                <Typography variant="body2" color="text.secondary">{exhibitor.industry || '-'}</Typography>
              </Box>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={4} mb={2}>
              <Box minWidth={320}>
                <Typography variant="body2"><b>Email:</b> {exhibitor.email || '-'}</Typography>
                <Typography variant="body2"><b>Phone:</b> {exhibitor.phoneNumber || '-'}</Typography>
                <Typography variant="body2"><b>Country:</b> {exhibitor.country || '-'}</Typography>
                <Typography variant="body2"><b>Status:</b> {exhibitor.status || '-'}</Typography>
                <Typography variant="body2"><b>Registration Date:</b> {exhibitor.registrationDate ? new Date(exhibitor.registrationDate).toLocaleString() : '-'}</Typography>
                <Typography variant="body2"><b>Company Type:</b> {exhibitor.companyType || '-'}</Typography>
                <Typography variant="body2"><b>Booth Number:</b> {exhibitor.boothNumber || '-'}</Typography>
                <Typography variant="body2"><b>Booth Size:</b> {exhibitor.boothSize || '-'}</Typography>
                <Typography variant="body2"><b>Website:</b> {exhibitor.website ? <a href={exhibitor.website} target="_blank" rel="noopener noreferrer">{exhibitor.website}</a> : '-'}</Typography>
              </Box>
              <Box minWidth={320}>
                <Typography variant="body2"><b>Industry:</b> {exhibitor.industry || '-'}</Typography>

                <Typography variant="body2"><b>Company Description:</b> {exhibitor.companyDescription || '-'}</Typography>
               
                <Typography variant="body2"><b>Technology:</b> {exhibitor.technology || '-'}</Typography>
                <Typography variant="body2"><b>Looking For:</b> {exhibitor.lookingFor && exhibitor.lookingFor.length > 0 ? exhibitor.lookingFor.join(', ') : '-'}</Typography>
              </Box>
              <Box minWidth={320}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Location</Typography>
                <Typography variant="body2"><b>Address:</b> {exhibitor.address || '-'}</Typography>
                <Typography variant="body2"><b>City:</b> {exhibitor.city || '-'}</Typography>
              
              </Box>
            </Box>

            {/* Exhibitor Profile */}
            {exhibitor.exhibitorProfile && exhibitor.exhibitorProfile.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Profile</Typography>
                {exhibitor.exhibitorProfile.map((profile: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Company Profile:</b> {profile.companyProfile}</Typography>
                    <Typography variant="body2"><b>Listing As:</b> {profile.listingAs}</Typography>
                    <Typography variant="body2"><b>ISO Certificates:</b> {profile.isoCertificates}</Typography>
                    <Typography variant="body2"><b>Social Links:</b> {profile.linkedInLink && (<a href={profile.linkedInLink} target="_blank" rel="noopener noreferrer">LinkedIn</a>)} {profile.instagramLink && (<a href={profile.instagramLink} target="_blank" rel="noopener noreferrer">Instagram</a>)} {profile.twitterLink && (<a href={profile.twitterLink} target="_blank" rel="noopener noreferrer">Twitter</a>)} {profile.youTubeLink && (<a href={profile.youTubeLink} target="_blank" rel="noopener noreferrer">YouTube</a>)}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Exhibitor Address */}
            {exhibitor.exhibitorAddress && exhibitor.exhibitorAddress.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Addresses</Typography>
                {exhibitor.exhibitorAddress.map((addr: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Address:</b> {addr.addressLine1}</Typography>
                    <Typography variant="body2"><b>City:</b> {addr.city}</Typography>
                    <Typography variant="body2"><b>State:</b> {addr.stateProvince}</Typography>
                    <Typography variant="body2"><b>Postal Code:</b> {addr.zipPostalCode}</Typography>
                    <Typography variant="body2"><b>PO Box:</b> {addr.poBox}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Exhibitor Custom Fields */}
            {exhibitor.exhibitorCustomField && exhibitor.exhibitorCustomField.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Custom Fields</Typography>
                {exhibitor.exhibitorCustomField.map((field: any, idx: number) => (
                  <Typography key={idx} variant="body2"><b>{field.fieldName}:</b> {field.fieldValue}</Typography>
                ))}
              </Box>
            )}

            {/* Exhibitor Contacts (ToUserMaps) */}
            {exhibitor.exhibitorToUserMaps && exhibitor.exhibitorToUserMaps.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Contacts</Typography>
                {exhibitor.exhibitorToUserMaps.map((user: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Name:</b> {user.salutation} {user.firstName} {user.middleName} {user.lastName}</Typography>
                    <Typography variant="body2"><b>Email:</b> {user.email}</Typography>
                    <Typography variant="body2"><b>Designation:</b> {user.designation}</Typography>
                    <Typography variant="body2"><b>Role:</b> {user.roleName}</Typography>
                    <Typography variant="body2"><b>LinkedIn:</b> {user.linkedInProfile ? (<a href={user.linkedInProfile} target="_blank" rel="noopener noreferrer">{user.linkedInProfile}</a>) : '-'}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Products */}
            {exhibitor.product && exhibitor.product.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Products</Typography>
                {exhibitor.product.map((prod: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Title:</b> {prod.title}</Typography>
                    <Typography variant="body2"><b>Category:</b> {prod.category}</Typography>
                    <Typography variant="body2"><b>Description:</b> {prod.description}</Typography>
                    {/* {prod.imagePath && <img src={prod.imagePath} alt={prod.title} style={{ maxWidth: 120, marginTop: 4 }} />} */}
                  </Box>
                ))}
              </Box>
            )}

            {/* Brands */}
            {exhibitor.brand && exhibitor.brand.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Brands</Typography>
                {exhibitor.brand.map((brand: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Name:</b> {brand.brandName}</Typography>
                    <Typography variant="body2"><b>Category:</b> {brand.category}</Typography>
                    <Typography variant="body2"><b>Description:</b> {brand.description}</Typography>
                    {/* {brand.logoPath && <img src={brand.logoPath} alt={brand.brandName} style={{ maxWidth: 120, marginTop: 4 }} />} */}
                  </Box>
                ))}
              </Box>
            )}

            {/* Brochures */}
            {exhibitor.brochure && exhibitor.brochure.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Brochures</Typography>
                {exhibitor.brochure.map((b: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Title:</b> {b.title}</Typography>
                    {b.filePath && <a href={b.filePath} target="_blank" rel="noopener noreferrer">Download</a>}
                  </Box>
                ))}
              </Box>
            )}

            {/* Press Releases */}
            {exhibitor.pressRelease && exhibitor.pressRelease.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Press Releases</Typography>
                {exhibitor.pressRelease.map((pr: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Title:</b> {pr.title}</Typography>
                    {pr.filePath && <a href={pr.filePath} target="_blank" rel="noopener noreferrer">Download</a>}
                  </Box>
                ))}
              </Box>
            )}

            {/* Videos */}
            {exhibitor.exhibitorVideos && exhibitor.exhibitorVideos.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Videos</Typography>
                {exhibitor.exhibitorVideos.map((v: any, idx: number) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2"><b>Title:</b> {v.title || '-'}</Typography>
                    <Typography variant="body2"><b>Description:</b> {v.description || '-'}</Typography>
                    {v.videoLink && <a href={v.videoLink} target="_blank" rel="noopener noreferrer">Watch Video</a>}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ExhibitorDetailsDialog; 