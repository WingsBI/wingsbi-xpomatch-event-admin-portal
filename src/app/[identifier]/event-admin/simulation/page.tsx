"use client";

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  BusinessCenter,
  Person,
  ChevronLeft,
  ChevronRight,
  LocationOn,
  Visibility,
  Close,
  ArrowBackIos,
  ArrowForwardIos,
  Favorite,
  FavoriteBorder,
  Business,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import { apiService, matchmakingApi, ExhibitormatchmakingApi } from '@/services/apiService';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import VisitorDetailsDialog from '@/components/common/VisitorDetailsDialog';
import ExhibitorDetailsDialog from '@/components/common/ExhibitorDetailsDialog';
import RecommendationWeightDialog from '@/components/common/RecommendationWeightDialog';

interface Participant {
  id: number;
  name: string;
  email?: string;
  company?: string;
  companyType?: string;
  location?: string;
  phone?: string;
  matchScore?: number;
}

interface VisitorDetail {
  id: number;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  companyName?: string;
  location?: string;
  phone?: string;
  matchScore: number;
  description?: string;
  designation?: string;
}

interface ExhibitorDetail {
  id: number;
  name?: string;
  companyName?: string;
  email?: string;
  location?: string;
  phone?: string;
  matchScore: number;
  description?: string;
  companyType?: string;
}

type RoleType = 'visitor' | 'exhibitor';

export default function SimulationPage() {
  const params = useParams();
  const identifier = params.identifier as string;

  // State for role selection
  const [selectedRole, setSelectedRole] = useState<RoleType | ''>('');
  
  // State for visitors and exhibitors (for dropdowns)
  const [visitors, setVisitors] = useState<Participant[]>([]);
  const [exhibitors, setExhibitors] = useState<Participant[]>([]);
  
  // State for selected participants
  const [selectedVisitor, setSelectedVisitor] = useState<Participant | null>(null);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Participant | null>(null);
  
  // State for recommendations
  const [visitorRecommendations, setVisitorRecommendations] = useState<ExhibitorDetail[]>([]);
  const [exhibitorVisitorRecommendations, setExhibitorVisitorRecommendations] = useState<VisitorDetail[]>([]);
  const [exhibitorExhibitorRecommendations, setExhibitorExhibitorRecommendations] = useState<ExhibitorDetail[]>([]);
  
  // Loading states
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [loadingExhibitors, setLoadingExhibitors] = useState(false);
  const [loadingVisitorMatches, setLoadingVisitorMatches] = useState(false);
  const [loadingExhibitorMatches, setLoadingExhibitorMatches] = useState(false);

  // Pagination states
  const [visitorPage, setVisitorPage] = useState(1);
  const [exhibitorVisitorPage, setExhibitorVisitorPage] = useState(1);
  const [exhibitorExhibitorPage, setExhibitorExhibitorPage] = useState(1);
  const [pageDirection, setPageDirection] = useState<'left' | 'right'>('right');
  const itemsPerPage = 5;

  // Dialog states
  const [visitorDialogOpen, setVisitorDialogOpen] = useState(false);
  const [exhibitorDialogOpen, setExhibitorDialogOpen] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | null>(null);
  const [selectedExhibitorId, setSelectedExhibitorId] = useState<number | null>(null);
  const [recommendationWeightDialogOpen, setRecommendationWeightDialogOpen] = useState(false);
  const [clickedMatchScore, setClickedMatchScore] = useState<number | undefined>(undefined);

  // Load visitors and exhibitors on component mount
  useEffect(() => {
    loadParticipants();
  }, [identifier]);

  // Reset selections when role changes
  useEffect(() => {
    setSelectedVisitor(null);
    setSelectedExhibitor(null);
    setVisitorRecommendations([]);
    setExhibitorVisitorRecommendations([]);
    setExhibitorExhibitorRecommendations([]);
    setVisitorPage(1);
    setExhibitorVisitorPage(1);
    setExhibitorExhibitorPage(1);
  }, [selectedRole]);

  const loadParticipants = async () => {
    try {
      setLoadingVisitors(true);
      setLoadingExhibitors(true);

      const [visitorsResponse, exhibitorsResponse] = await Promise.all([
        apiService.getAllVisitors(identifier),
        fieldMappingApi.getAllExhibitors(identifier)
      ]);

      if (visitorsResponse.success && visitorsResponse.data?.result) {
        const visitorData = visitorsResponse.data.result;
        console.log('Raw visitor data:', visitorData[0]); // Debug first visitor
        const mappedVisitors = visitorData.map((visitor: any) => ({
          id: visitor.id,
          name: `${visitor.salutation || ''} ${visitor.firstName || ''} ${visitor.lastName || ''}`.trim(),
          email: visitor.email,
          company: visitor.userProfile?.companyName || visitor.company,
          location: visitor.userAddress?.cityName || visitor.location,
          phone: visitor.userProfile?.phone || visitor.phone
        }));
        console.log('Mapped visitor data:', mappedVisitors[0]); // Debug first mapped visitor
        setVisitors(mappedVisitors);
      }

      if (exhibitorsResponse.statusCode === 200 && exhibitorsResponse.result) {
        console.log('Raw exhibitor data:', exhibitorsResponse.result[0]); // Debug first exhibitor
        const mappedExhibitors = exhibitorsResponse.result.map((exhibitor: any) => {
          // Get the first exhibitor user from exhibitorToUserMaps
          const exhibitorUser = exhibitor.exhibitorToUserMaps?.[0];
          const userName = exhibitorUser 
            ? `${exhibitorUser.salutation || ''} ${exhibitorUser.firstName || ''} ${exhibitorUser.lastName || ''}`.trim()
            : exhibitor.name || exhibitor.companyName;
          
          return {
            id: exhibitor.id,
            name: userName,
            email: exhibitorUser?.email || exhibitor.email,
            company: exhibitor.companyName,
            companyType: exhibitor.companyType,
            location: exhibitor.exhibitorAddress?.[0]?.city || exhibitor.location,
            phone: exhibitorUser?.phone || exhibitor.phone
          };
        });
        console.log('Mapped exhibitor data:', mappedExhibitors[0]); // Debug first mapped exhibitor
        setExhibitors(mappedExhibitors);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoadingVisitors(false);
      setLoadingExhibitors(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  const handleVisitorChange = async (visitor: Participant | null) => {
    setSelectedVisitor(visitor);
    setVisitorRecommendations([]);
    setVisitorPage(1);
    
    if (visitor) {
      try {
        setLoadingVisitorMatches(true);
        
        // Call getVisitorById to get visitor details
        const visitorDetailResponse = await fieldMappingApi.getVisitorById(identifier, visitor.id);
        console.log('Visitor details:', visitorDetailResponse);
        
        // Call getVisitorMatch to get recommended exhibitors
        const matchResponse = await matchmakingApi.getVisitorMatch(identifier, visitor.id, null);
        
                 if (matchResponse.statusCode === 200 && matchResponse.result) {
           setVisitorRecommendations(matchResponse.result.map((match: any) => ({
             id: match.id,
             name: match.name,
             companyName: match.companyName,
             email: match.exhibitorToUserMaps?.[0]?.email || '',
             location: match.exhibitorAddress?.[0]?.city || match.location || '',
             phone: match.phone,
             matchScore: match.matchPercentage || 0,
             description: match.description,
             companyType: match.companyType
           })));
         }
      } catch (error) {
        console.error('Error fetching visitor matches:', error);
      } finally {
        setLoadingVisitorMatches(false);
      }
    }
  };

  const handleExhibitorChange = async (exhibitor: Participant | null) => {
    setSelectedExhibitor(exhibitor);
    setExhibitorVisitorRecommendations([]);
    setExhibitorExhibitorRecommendations([]);
    setExhibitorVisitorPage(1);
    setExhibitorExhibitorPage(1);
    
    if (exhibitor) {
      try {
        setLoadingExhibitorMatches(true);
        
        // Call getExhibitorById to get exhibitor details
        const exhibitorDetailResponse = await fieldMappingApi.getExhibitorById(identifier, exhibitor.id);
        console.log('Exhibitor details:', exhibitorDetailResponse);
        
        // Call both APIs to get recommendations
        const [visitorMatchesResponse, exhibitorMatchesResponse] = await Promise.all([
          ExhibitormatchmakingApi.getExhibitorMatch(identifier, exhibitor.id, null),
          ExhibitormatchmakingApi.getExhibitortoExhibitorMatch(identifier, exhibitor.id, null)
        ]);
        
                 if (visitorMatchesResponse.statusCode === 200 && visitorMatchesResponse.result) {
           setExhibitorVisitorRecommendations(visitorMatchesResponse.result.map((match: any) => ({
             id: match.id,
             salutation: match.salutation,
             firstName: match.firstName,
             lastName: match.lastName,
             email: match.email,
             companyName: match.userProfile?.companyName || match.companyName,
             location: match.location,
             phone: match.phone,
             matchScore: match.matchPercentage || 0,
             description: match.description,
             designation: match.userProfile?.jobTitle || match.designation
           })));
         }
        
                 if (exhibitorMatchesResponse.statusCode === 200 && exhibitorMatchesResponse.result) {
           setExhibitorExhibitorRecommendations(exhibitorMatchesResponse.result.map((match: any) => ({
             id: match.id,
             name: match.name,
             companyName: match.companyName,
             email: match.exhibitorToUserMaps?.[0]?.email || '',
             location: match.exhibitorAddress?.[0]?.city || match.location || '',
             phone: match.phone,
             matchScore: match.matchPercentage || 0,
             description: match.description,
             companyType: match.companyType
           })));
         }
      } catch (error) {
        console.error('Error fetching exhibitor matches:', error);
      } finally {
        setLoadingExhibitorMatches(false);
      }
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return '#d32f2f'; // Green
    if (score >= 50) return '#d32f2f'; // Orange
    return '#d32f2f'; // Red
  };

  const getVisitorDisplayName = (visitor: VisitorDetail) => {
    const parts = [];
    if (visitor.salutation) parts.push(visitor.salutation);
    if (visitor.firstName) parts.push(visitor.firstName);
    if (visitor.lastName) parts.push(visitor.lastName);
    return parts.join(' ') || 'Unknown Visitor';
  };

  const handleVisitorPageChange = (event: any, newPage: number) => {
    setPageDirection(newPage > visitorPage ? 'left' : 'right');
    setVisitorPage(newPage);
  };

  const handleExhibitorVisitorPageChange = (event: any, newPage: number) => {
    setPageDirection(newPage > exhibitorVisitorPage ? 'left' : 'right');
    setExhibitorVisitorPage(newPage);
  };

  const handleExhibitorExhibitorPageChange = (event: any, newPage: number) => {
    setPageDirection(newPage > exhibitorExhibitorPage ? 'left' : 'right');
    setExhibitorExhibitorPage(newPage);
  };

  // Dialog handlers
  const handleVisitorClick = (visitorId: number) => {
    setSelectedVisitorId(visitorId);
    setVisitorDialogOpen(true);
  };

  const handleExhibitorClick = (exhibitorId: number) => {
    setSelectedExhibitorId(exhibitorId);
    setExhibitorDialogOpen(true);
  };

  const handleVisitorDialogClose = () => {
    setVisitorDialogOpen(false);
    setSelectedVisitorId(null);
  };

  const handleExhibitorDialogClose = () => {
    setExhibitorDialogOpen(false);
    setSelectedExhibitorId(null);
  };

  const handleRecommendationWeightClick = (matchScore: number) => {
    setClickedMatchScore(matchScore);
    setRecommendationWeightDialogOpen(true);
  };

  const handleRecommendationWeightDialogClose = () => {
    setRecommendationWeightDialogOpen(false);
  };

  const VisitorCard = ({ visitor }: { visitor: VisitorDetail }) => {
    const displayName = getVisitorDisplayName(visitor);

    return (
      <Card
        sx={{
          mt: 0,
          borderRadius: 3,
          height: '100%',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e8eaed',
          bgcolor: 'background.paper',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        elevation={1}
      >
        {/* Match Percentage (top right) */}
        <Box sx={{ position: 'absolute', top: 2, right: 10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 0 }}>
          <Typography
            variant="subtitle1"
            onClick={() => handleRecommendationWeightClick(visitor.matchScore)}
            sx={{
              fontStyle: 'italic',
              color: '#222',
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: 0.5,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.7,
                textDecoration: 'underline'
              }
            }}
          >
            {visitor.matchScore?.toFixed(0)}%
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 1, pb: 0.5, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          {/* Header with Avatar, Name, Job Title, Company, Location */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1} sx={{ minHeight: '60px' }}>
            <Avatar sx={{
              bgcolor: 'success.main',
              width: 36,
              height: 36,
              mr: 1.5,
              fontSize: '0.9rem',
              fontWeight: 'bold',
              flexShrink: 0,
              color: 'white',
              alignSelf: 'top',
              mt: 2,
            }}>
              {getInitials(visitor.firstName, visitor.lastName)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, mt: 3}}>
              <Box>
                <Typography
                  variant="body2"
                  component="div"
                  fontWeight="600"
                  sx={{
                    ml: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt:-1,
                    lineHeight: 1.2,
                    cursor: 'pointer',
                    color: 'primary.main',
                    textDecoration: 'none',
                    transition: 'text-decoration 0.2s',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={() => handleVisitorClick(visitor.id)}
                >
                  {visitor.salutation} {visitor.firstName} {visitor.lastName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}>
                  {visitor.designation}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" mb={1}>
            <BusinessCenter sx={{ alignSelf: 'start', fontSize: 15, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
              {visitor.companyName || 'No company'}
            </Typography>
          </Box>
          
          {visitor.location && (
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ alignSelf: 'start', fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2" color="text.secondary">
                {visitor.location}
              </Typography>
            </Box>
          )}
          
         
        </CardContent>
      </Card>
    );
  };

  const ExhibitorCard = ({ exhibitor }: { exhibitor: ExhibitorDetail }) => {
    const displayName = exhibitor.companyName || exhibitor.name;

    return (
      <Card
        sx={{
          mt: 0,
          borderRadius: 3,
          height: '100%',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e8eaed',
          bgcolor: 'background.paper',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        elevation={1}
      >
        {/* Match Percentage (top right) */}
        <Box sx={{ position: 'absolute', top: 2, right: 10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 0 }}>
          <Typography
            variant="subtitle1"
            onClick={() => handleRecommendationWeightClick(exhibitor.matchScore)}
            sx={{
              fontStyle: 'italic',
              color: '#222',
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: 0.5,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.7,
                textDecoration: 'underline'
              }
            }}
          >
            {exhibitor.matchScore?.toFixed(0)}%
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 0.5, pb: 0.5, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          {/* Header with Avatar, Name, Company Type */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1} sx={{ minHeight: '60px' }}>
            <Avatar sx={{
              bgcolor: 'success.main',
              width: 36,
              height: 36,
              mr: 1.5,
              fontSize: '0.9rem',
              fontWeight: 'bold',
              flexShrink: 0,
              color: 'white',
              alignSelf: 'top',
              mt: 2,
            }}>
              {exhibitor.companyName ? exhibitor.companyName.charAt(0).toUpperCase() : 'E'}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, mt: 3}}>
              <Box>
                <Typography
                  variant="body2"
                  component="div"
                  fontWeight="600"
                  sx={{
                    ml: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    cursor: 'pointer',
                    color: 'primary.main',
                    textDecoration: 'none',
                    transition: 'text-decoration 0.2s',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={() => handleExhibitorClick(exhibitor.id)}
                >
                  {exhibitor.companyName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}>
                  {exhibitor.companyType}
                </Typography>
              </Box>
            </Box>
          </Box>

          {exhibitor.location && (
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ alignSelf: 'start', fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2" color="text.secondary">
                {exhibitor.location}
              </Typography>
            </Box>
          )}

        </CardContent>
      </Card>
    );
  };





  return (
    <ResponsiveDashboardLayout title="Matchmaking Simulation">
      <Container maxWidth="lg" sx={{ py: 4, mt: -4 }}>
        {/* Header */}
        <Box sx={{ mb: 4,mt: -1 }}>
          <Typography variant="h5" component="h1" fontWeight="600" sx={{ mb: 1 }}>
            Matchmaking Simulation
          </Typography>
        </Box>

                 {/* Role and Participant Selection Section */}
         <Box sx={{ mb: 4, mt: -1 }}>
           <Box sx={{ display: 'flex', gap: 10, alignItems: 'flex-start',mb: -2 }}>
             {/* Role Selection */}
             <Box sx={{ minWidth: 200 }}>
               <Typography variant="h6" fontWeight="500" sx={{ mb: 1, mt: -2 }}>
                 Select Role
               </Typography>
               
               <FormControl sx={{ minWidth: 200 }}>
                  
                 <Select
                   value={selectedRole}
                   displayEmpty
                   onChange={(e) => setSelectedRole(e.target.value as RoleType | '')}
                   size="small"
                  
                   sx={{
                     '& .MuiSelect-select': {
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: selectedRole ? 'flex-start' : 'center',
                       gap: selectedRole ? 1 : 0
                     }
                   }}
                   renderValue={(value) => {
                     if (!value) {
                       return <span style={{ color: '#666'}}><Person sx={{ fontSize: 15, mb:-0.3,ml:0.5 }}/>visitor/<Business sx={{ fontSize: 15, mb:-0.3,mr:0.5 }}/>exhibitor</span>;
                     }
                     return (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         {value === 'visitor' ?<Person sx={{ fontSize: 17}}/> : <Business sx={{ fontSize: 17}}/>}
                         {value === 'visitor' ? 'Visitor' : 'Exhibitor'}
                       </div>
                     );
                   }}
                 >
                   <MenuItem value="">
                     <em>Select role</em>
                   </MenuItem>
                   <MenuItem value="visitor">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <Person sx={{ fontSize: 17}}/>Visitor
                     </div>
                   </MenuItem>
                   <MenuItem value="exhibitor">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <Business sx={{ fontSize: 17}}/>Exhibitor
                     </div>
                   </MenuItem>
                 </Select>
               </FormControl>
             </Box>
             
             {/* Participant Selection */}
             {selectedRole && (
               <Box sx={{ minWidth: 400,mt: 1.7 }}>
                 
                 
                 {selectedRole === 'visitor' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Autocomplete
                      options={visitors}
                      getOptionLabel={(option) => `${option.name}${option.company ? ` (${option.company})` : ''}`}
                      value={selectedVisitor}
                      onChange={(_, newValue) => handleVisitorChange(newValue)}
                      loading={loadingVisitors}
                      disabled={!!selectedVisitor}
                      sx={{ flex: 1 }}
                                             renderInput={(params) => (
                         <TextField
                           {...params}
                           label="Select Visitor"
                           variant="outlined"
                           fullWidth
                           size="small"
                           disabled={!!selectedVisitor}
                           InputProps={{
                             ...params.InputProps,
                             startAdornment: (
                               <>
                                 {selectedVisitor && (
                                   <Person sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                                 )}
                                 {params.InputProps.startAdornment}
                               </>
                             ),
                             endAdornment: (
                               <>
                                 {selectedVisitor && (
                                   <IconButton
                                     onClick={() => handleVisitorChange(null)}
                                     size="small"
                                     sx={{ 
                                       p: 0.5,
                                       '&:hover': { 
                                         bgcolor: 'rgba(0, 0, 0, 0.04)' 
                                       }
                                     }}
                                   >
                                     <Close sx={{ fontSize: 16, color: 'text.secondary' }} />
                                   </IconButton>
                                 )}
                                 {params.InputProps.endAdornment}
                               </>
                             ),
                           }}
                         />
                       )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="body1">{option.name}</Typography>
                              {option.company && (
                                <Typography variant="body2" color="text.secondary">
                                  {option.company}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    />
                                         {selectedVisitor && (
                       <Tooltip title="View Visitor Details">
                         <IconButton 
                           onClick={() => handleVisitorClick(selectedVisitor.id)}
                           size="small"
                           sx={{ 
                             bgcolor: 'grey.500', 
                             color: 'white',
                             '&:hover': { bgcolor: 'grey.600' }
                           }}
                         >
                           <Visibility sx={{ fontSize: 16 }} />
                         </IconButton>
                       </Tooltip>
                     )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Autocomplete
                      options={exhibitors}
                      getOptionLabel={(option) => `${option.name}${option.company ? ` (${option.company})` : ''}`}
                      value={selectedExhibitor}
                      onChange={(_, newValue) => handleExhibitorChange(newValue)}
                      loading={loadingExhibitors}
                      disabled={!!selectedExhibitor}
                      sx={{ flex: 1 }}
                                             renderInput={(params) => (
                         <TextField
                           {...params}
                           label="Select Exhibitor"
                           variant="outlined"
                           fullWidth
                           size="small"
                           disabled={!!selectedExhibitor}
                           InputProps={{
                             ...params.InputProps,
                             startAdornment: (
                               <>
                                 {selectedExhibitor && (
                                   <Person sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                                 )}
                                 {params.InputProps.startAdornment}
                               </>
                             ),
                             endAdornment: (
                               <>
                                 {selectedExhibitor && (
                                   <IconButton
                                     onClick={() => handleExhibitorChange(null)}
                                     size="small"
                                     sx={{ 
                                       p: 0.5,
                                       '&:hover': { 
                                         bgcolor: 'rgba(0, 0, 0, 0.04)' 
                                       }
                                     }}
                                   >
                                     <Close sx={{ fontSize: 16, color: 'text.secondary' }} />
                                   </IconButton>
                                 )}
                                 {params.InputProps.endAdornment}
                               </>
                             ),
                           }}
                         />
                       )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              {option.name && option.name !== option.company && (
                                <Typography variant="body1">
                                  {option.name}
                                </Typography>
                              )}
                              {option.companyType && (
                                <Typography variant="body2" color="text.secondary">
                                  {option.company || option.name} ({option.companyType})
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    />
                                         {selectedExhibitor && (
                       <Tooltip title="View Exhibitor Details">
                         <IconButton 
                           onClick={() => handleExhibitorClick(selectedExhibitor.id)}
                           size="small"
                           sx={{ 
                             bgcolor: 'grey.500', 
                             color: 'white',
                             '&:hover': { bgcolor: 'grey.600' }
                           }}
                         >
                           <Visibility sx={{ fontSize: 16 }} />
                         </IconButton>
                       </Tooltip>
                     )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Loading Indicators */}
        {loadingVisitorMatches && <LinearProgress sx={{ mb: 2 }} />}
        {loadingExhibitorMatches && <LinearProgress sx={{ mb: 2 }} />}

        {/* Recommendations Sections */}
        {selectedRole === 'visitor' && selectedVisitor && (
          <Container maxWidth="lg" sx={{ mt: -2, mb: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0 }}>
              <Typography variant="h5" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary' }}>
                Recommended Exhibitors for You
              </Typography>
            </Box>
            {visitorRecommendations.length > 0 ? (
              <>
                <AnimatePresence mode="wait" custom={pageDirection}>
                  <motion.div
                    key={visitorPage}
                    custom={pageDirection}
                    variants={{
                      enter: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? 40 : -40 }),
                      center: { opacity: 1, x: 0 },
                      exit: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? -40 : 40 })
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <Grid container spacing={2} sx={{ mb: -1 }}>
                      {visitorRecommendations
                        .slice((visitorPage - 1) * itemsPerPage, visitorPage * itemsPerPage)
                        .map((rec) => (
                          <Grid item xs={12} sm={6} md={2.4} key={rec.id}>
                            <ExhibitorCard exhibitor={rec} />
                          </Grid>
                        ))}
                    </Grid>
                  </motion.div>
                </AnimatePresence>
                {/* Pagination UI */}
                {Math.ceil(visitorRecommendations.length / itemsPerPage) > 1 && (
                  <Box display="flex" justifyContent="center" alignItems="center" mt={1} mb={0.5} gap={1}>
                    <IconButton
                      onClick={() => handleVisitorPageChange(null, Math.max(1, visitorPage - 1))}
                      disabled={visitorPage === 1}
                      sx={{ color: 'primary.main' }}
                    >
                      <ArrowBackIos fontSize="small" />
                    </IconButton>
                    {Array.from({ length: Math.ceil(visitorRecommendations.length / itemsPerPage) }).map((_, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          mx: 0.5,
                          backgroundColor:
                            visitorPage === idx + 1
                              ? 'primary.main'
                              : alpha('#1976d2', 0.25),
                          opacity: 1,
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          border: visitorPage === idx + 1 ? '2px solid #1565c0' : 'none'
                        }}
                        onClick={() => handleVisitorPageChange(null, idx + 1)}
                      />
                    ))}
                    <IconButton
                      onClick={() => handleVisitorPageChange(null, Math.min(Math.ceil(visitorRecommendations.length / itemsPerPage), visitorPage + 1))}
                      disabled={visitorPage === Math.ceil(visitorRecommendations.length / itemsPerPage)}
                      sx={{ color: 'primary.main' }}
                    >
                      <ArrowForwardIos fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </>
            ) : (
              !loadingVisitorMatches && (
                <Alert severity="info">No recommended exhibitors found for this visitor.</Alert>
              )
            )}
          </Container>
        )}

        {selectedRole === 'exhibitor' && selectedExhibitor && (
          <>
            {/* Section 1: Recommended Visitors */}
            <Container maxWidth="lg" sx={{ mt: -2, mb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0 }}>
                <Typography variant="h5" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary' }}>
                  Recommended Visitors for You
                </Typography>
              </Box>
              {exhibitorVisitorRecommendations.length > 0 ? (
                <>
                  <AnimatePresence mode="wait" custom={pageDirection}>
                    <motion.div
                      key={exhibitorVisitorPage}
                      custom={pageDirection}
                      variants={{
                        enter: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? 40 : -40 }),
                        center: { opacity: 1, x: 0 },
                        exit: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? -40 : 40 })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                      <Grid container spacing={2} sx={{ mb: -1 }}>
                        {exhibitorVisitorRecommendations
                          .slice((exhibitorVisitorPage - 1) * itemsPerPage, exhibitorVisitorPage * itemsPerPage)
                          .map((rec) => (
                            <Grid item xs={12} sm={6} md={2.4} key={rec.id}>
                              <VisitorCard visitor={rec} />
                            </Grid>
                          ))}
                      </Grid>
                    </motion.div>
                  </AnimatePresence>
                  {/* Pagination UI */}
                  {Math.ceil(exhibitorVisitorRecommendations.length / itemsPerPage) > 1 && (
                    <Box display="flex" justifyContent="center" alignItems="center" mt={1} mb={0.5} gap={1}>
                      <IconButton
                        onClick={() => handleExhibitorVisitorPageChange(null, Math.max(1, exhibitorVisitorPage - 1))}
                        disabled={exhibitorVisitorPage === 1}
                        sx={{ color: 'primary.main' }}
                      >
                        <ArrowBackIos fontSize="small" />
                      </IconButton>
                      {Array.from({ length: Math.ceil(exhibitorVisitorRecommendations.length / itemsPerPage) }).map((_, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            mx: 0.5,
                            backgroundColor:
                              exhibitorVisitorPage === idx + 1
                                ? 'primary.main'
                                : alpha('#1976d2', 0.25),
                            opacity: 1,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            border: exhibitorVisitorPage === idx + 1 ? '2px solid #1565c0' : 'none'
                          }}
                          onClick={() => handleExhibitorVisitorPageChange(null, idx + 1)}
                        />
                      ))}
                      <IconButton
                        onClick={() => handleExhibitorVisitorPageChange(null, Math.min(Math.ceil(exhibitorVisitorRecommendations.length / itemsPerPage), exhibitorVisitorPage + 1))}
                        disabled={exhibitorVisitorPage === Math.ceil(exhibitorVisitorRecommendations.length / itemsPerPage)}
                        sx={{ color: 'primary.main' }}
                      >
                        <ArrowForwardIos fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </>
              ) : (
                !loadingExhibitorMatches && (
                  <Alert severity="info">No recommended visitors found for this exhibitor.</Alert>
                )
              )}
            </Container>
            
            {/* Section 2: Recommended Exhibitors */}
           

            <Container maxWidth="lg" sx={{ mt: -2, mb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0 }}>
                <Typography variant="h5" sx={{ fontStyle: 'italic',mb: -2, fontWeight: 600, color: 'text.secondary' }}>
                  Recommended Exhibitors for You
                </Typography>
              </Box>
              {exhibitorExhibitorRecommendations.length > 0 ? (
                <>
                  <AnimatePresence mode="wait" custom={pageDirection}>
                    <motion.div
                      key={exhibitorExhibitorPage}
                      custom={pageDirection}
                      variants={{
                        enter: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? 40 : -40 }),
                        center: { opacity: 1, x: 0 },
                        exit: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? -40 : 40 })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                      <Grid container spacing={2} sx={{ mb: -1, mt: 0, ml: 1 }}>
                        {exhibitorExhibitorRecommendations
                          .slice((exhibitorExhibitorPage - 1) * itemsPerPage, exhibitorExhibitorPage * itemsPerPage)
                          .map((rec) => (
                            <Grid item xs={12} sm={6} md={2.3} key={rec.id}>
                              <ExhibitorCard exhibitor={rec} />
                            </Grid>
                          ))}
                      </Grid>
                    </motion.div>
                  </AnimatePresence>
                  {/* Pagination UI */}
                  {Math.ceil(exhibitorExhibitorRecommendations.length / itemsPerPage) > 1 && (
                    <Box display="flex" justifyContent="center" alignItems="center" mt={1} mb={0.5} gap={1}>
                      <IconButton
                        onClick={() => handleExhibitorExhibitorPageChange(null, Math.max(1, exhibitorExhibitorPage - 1))}
                        disabled={exhibitorExhibitorPage === 1}
                        sx={{ color: 'primary.main' }}
                      >
                        <ArrowBackIos fontSize="small" />
                      </IconButton>
                      {Array.from({ length: Math.ceil(exhibitorExhibitorRecommendations.length / itemsPerPage) }).map((_, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            mx: 0.5,
                            backgroundColor:
                              exhibitorExhibitorPage === idx + 1
                                ? 'primary.main'
                                : alpha('#1976d2', 0.25),
                            opacity: 1,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            border: exhibitorExhibitorPage === idx + 1 ? '2px solid #1565c0' : 'none'
                          }}
                          onClick={() => handleExhibitorExhibitorPageChange(null, idx + 1)}
                        />
                      ))}
                      <IconButton
                        onClick={() => handleExhibitorExhibitorPageChange(null, Math.min(Math.ceil(exhibitorExhibitorRecommendations.length / itemsPerPage), exhibitorExhibitorPage + 1))}
                        disabled={exhibitorExhibitorPage === Math.ceil(exhibitorExhibitorRecommendations.length / itemsPerPage)}
                        sx={{ color: 'primary.main' }}
                      >
                        <ArrowForwardIos fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </>
              ) : (
                !loadingExhibitorMatches && (
                  <Alert severity="info">No recommended exhibitors found for this exhibitor.</Alert>
                )
              )}
            </Container>
          </>
        )}
      </Container>

      {/* Visitor Details Dialog */}
      <VisitorDetailsDialog
        visitorId={selectedVisitorId}
        open={visitorDialogOpen}
        onClose={handleVisitorDialogClose}
        identifier={identifier}
      />

      {/* Exhibitor Details Dialog */}
      <ExhibitorDetailsDialog
        exhibitorId={selectedExhibitorId}
        open={exhibitorDialogOpen}
        onClose={handleExhibitorDialogClose}
        identifier={identifier}
      />

      {/* Recommendation Weight Dialog */}
      <RecommendationWeightDialog
        open={recommendationWeightDialogOpen}
        onClose={handleRecommendationWeightDialogClose}
        identifier={identifier}
        matchScore={clickedMatchScore}
      />
    </ResponsiveDashboardLayout>
  );
}
