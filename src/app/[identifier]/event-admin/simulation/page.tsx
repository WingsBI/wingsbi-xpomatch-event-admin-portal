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
} from '@mui/material';
import {
  BusinessCenter,
  Person,
  ChevronLeft,
  ChevronRight,
  LocationOn,
  Visibility,
  Close,
} from '@mui/icons-material';

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

  // Carousel states
  const [visitorPage, setVisitorPage] = useState(0);
  const [exhibitorVisitorPage, setExhibitorVisitorPage] = useState(0);
  const [exhibitorExhibitorPage, setExhibitorExhibitorPage] = useState(0);
  const itemsPerPage = 5;

  // Dialog states
  const [visitorDialogOpen, setVisitorDialogOpen] = useState(false);
  const [exhibitorDialogOpen, setExhibitorDialogOpen] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | null>(null);
  const [selectedExhibitorId, setSelectedExhibitorId] = useState<number | null>(null);
  const [recommendationWeightDialogOpen, setRecommendationWeightDialogOpen] = useState(false);

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
    setVisitorPage(0);
    setExhibitorVisitorPage(0);
    setExhibitorExhibitorPage(0);
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

  const handleVisitorChange = async (visitor: Participant | null) => {
    setSelectedVisitor(visitor);
    setVisitorRecommendations([]);
    setVisitorPage(0);
    
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
    setExhibitorVisitorPage(0);
    setExhibitorExhibitorPage(0);
    
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

  const handlePageChange = (currentPage: number, newPage: number, setPage: (page: number) => void) => {
    setPage(newPage);
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

  const handleRecommendationWeightClick = () => {
    setRecommendationWeightDialogOpen(true);
  };

  const handleRecommendationWeightDialogClose = () => {
    setRecommendationWeightDialogOpen(false);
  };

  const VisitorCard = ({ visitor }: { visitor: VisitorDetail }) => {
    const displayName = getVisitorDisplayName(visitor);
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
      <Card 
          sx={{ 
          minWidth: 200,
          maxWidth: 220,
          height: 140,
          borderRadius: 3,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e8eaed",
        bgcolor: "background.paper",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
        }}
      >
        <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Match Score at Top Right */}
          <Box sx={{ position: 'absolute', top: 8, right: 8 ,mb:1}}>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              onClick={handleRecommendationWeightClick}
              sx={{ 
                color: getMatchScoreColor(visitor.matchScore), 
                fontSize:'0.8rem',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.7,
                  textDecoration: 'underline'
                }
              }}
            >
              {Math.round(visitor.matchScore)}%
            </Typography>
          </Box>

          {/* Header with Avatar and Name */}
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 30, height: 30, fontSize: '1rem', color: 'white',mr:0.2}}>
              {initials}
            </Avatar>
            <Box flex={1} sx={{ pr: 3 }}>
              <Typography 
                variant="body2" 
                fontWeight="medium" 
                sx={{ 
                  fontSize: '0.9rem',
                  mb:-1,
                  mt:1,
                  wordBreak: "break-word",
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }
                }}
                noWrap
                onClick={() => handleVisitorClick(visitor.id)}
              >
                {displayName}
              </Typography>
              {visitor.designation && (
                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, mt:1, 
                 wordBreak: 'break-word',lineHeight: 1,fontSize:'0.75rem'}}>
               
                  {visitor.designation}
                </Typography>
              )}
            </Box>

          </Box>

          {/* Company Information */}
          {visitor.companyName && (
            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <BusinessCenter sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {visitor.companyName}
              </Typography>
            </Box>
          )}

         
        </CardContent>
      </Card>
    );
  };

  const ExhibitorCard = ({ exhibitor }: { exhibitor: ExhibitorDetail }) => {
    const displayName = exhibitor.companyName || exhibitor.name;
    const initial = displayName ? displayName.charAt(0).toUpperCase() : 'E';

    return (
      <Card 
        sx={{ 
          minWidth: 200,
          maxWidth: 220,
          height: 140,
          borderRadius: 3,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e8eaed",
        bgcolor: "background.paper",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
        }}
      >
        <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Match Score at Top Right */}
          <Box sx={{ position: 'absolute', top: 8, right: 8, mb:1}}>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              onClick={handleRecommendationWeightClick}
              sx={{ 
                color: getMatchScoreColor(exhibitor.matchScore), 
                fontSize:'0.8rem',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.7,
                  textDecoration: 'underline'
                }
              }}
            >
              {Math.round(exhibitor.matchScore)}%
            </Typography>
          </Box>

          {/* Header with Avatar and Name */}
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 30, height: 30, fontSize: '1rem', color: 'white',mr:0.2}}>
              {initial}
            </Avatar>
            <Box flex={1} sx={{ pr: 2 }}>
              <Typography 
                variant="body2" 
                fontWeight="medium" 
                sx={{ 
                  fontSize: '0.9rem',
                  mb:-1,
                  mt:1,
                  wordBreak: "break-word",
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }
                }}
                noWrap
                onClick={() => handleExhibitorClick(exhibitor.id)}
              >
                {displayName}
              </Typography>
              {exhibitor.companyType && (
                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, mt:1, 
                  wordBreak: 'break-word',lineHeight: 1,fontSize:'0.75rem'}}>
                  {exhibitor.companyType}
                </Typography>
              )}
            </Box>

          </Box>

         

          {/* Location */}
          {exhibitor.location && (
            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                             <Typography
                 variant="subtitle2"
                 color="text.secondary"
                 sx={{ lineHeight: 1.3, fontSize: "0.75rem", wordBreak: "break-word" }}
               >
                 {exhibitor.location}
               </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const CarouselRecommendations = ({ 
    items, 
    title, 
    type, 
    currentPage, 
    onPageChange
  }: { 
    items: any[]; 
    title: string; 
    type: 'visitor' | 'exhibitor';
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    if (items.length === 0) return null;

    const handleNext = () => {
      if (currentPage < totalPages - 1) {
        handlePageChange(currentPage, currentPage + 1, onPageChange);
      }
    };

    const handlePrev = () => {
      if (currentPage > 0) {
        handlePageChange(currentPage, currentPage - 1, onPageChange);
      }
    };

    const handleDotClick = (page: number) => {
      handlePageChange(currentPage, page, onPageChange);
    };

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          {title}
        </Typography>
        
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handlePrev}
            disabled={currentPage === 0}
            sx={{
              position: 'absolute',
              left: -20,
              zIndex: 1,
              bgcolor: 'white',
              boxShadow: 2,
              '&:hover': { bgcolor: 'grey.50' },
              '&.Mui-disabled': { opacity: 0.3 }
            }}
          >
            <ChevronLeft />
          </IconButton>
          
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: 1,
              justifyContent: 'center',
              maxWidth: '100%'
            }}>
              {currentItems.map((item) => (
                type === 'visitor' ? (
                  <VisitorCard key={item.id} visitor={item} />
                ) : (
                  <ExhibitorCard key={item.id} exhibitor={item} />
                )
              ))}
            </Box>
          </Box>
          
          <IconButton
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            sx={{
              position: 'absolute',
              right: -20,
              zIndex: 1,
              bgcolor: 'white',
              boxShadow: 2,
              '&:hover': { bgcolor: 'grey.50' },
              '&.Mui-disabled': { opacity: 0.3 }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
        
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" gap={1} mt={3}>
            {Array.from({ length: totalPages }, (_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: currentPage === index ? 'success.main' : 'grey.300',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: currentPage === index ? 'success.dark' : 'grey.400',
                    transform: 'scale(1.2)'
                  }
                }}
              />
            ))}
          </Box>
        )}
      </Box>
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
                 <InputLabel>visitor/exhibitor</InputLabel>
                 <Select
                   value={selectedRole}
                   label="visitor/exhibitor"
                   onChange={(e) => setSelectedRole(e.target.value as RoleType | '')}
                   size="small"
                 >
                   <MenuItem value="">
                     <em>Select role</em>
                   </MenuItem>
                   <MenuItem value="visitor">Visitor</MenuItem>
                   <MenuItem value="exhibitor">Exhibitor</MenuItem>
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
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>
              Recommended Visitors for you
            </Typography>

              <CarouselRecommendations
                items={visitorRecommendations}
                title=""
                type="exhibitor"
                currentPage={visitorPage}
                onPageChange={setVisitorPage}
              />
              {!loadingVisitorMatches && visitorRecommendations.length === 0 && (
                <Alert severity="info">No recommended exhibitors found for this visitor.</Alert>
              )}

          </Box>
        )}

        {selectedRole === 'exhibitor' && selectedExhibitor && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>
                Recommended Visitors for you
              </Typography>
             
                <CarouselRecommendations
                  items={exhibitorVisitorRecommendations}
                  title=""
                  type="visitor"
                  currentPage={exhibitorVisitorPage}
                  onPageChange={setExhibitorVisitorPage}
                />
                {!loadingExhibitorMatches && exhibitorVisitorRecommendations.length === 0 && (
                  <Alert severity="info">No recommended visitors found for this exhibitor.</Alert>
                )}
              
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>
                Recommended Exhibitors for you
              </Typography>
              
                <CarouselRecommendations
                  items={exhibitorExhibitorRecommendations}
                  title=""
                  type="exhibitor"
                  currentPage={exhibitorExhibitorPage}
                  onPageChange={setExhibitorExhibitorPage}
                />
                {!loadingExhibitorMatches && exhibitorExhibitorRecommendations.length === 0 && (
                  <Alert severity="info">No recommended exhibitors found for this exhibitor.</Alert>
                )}
              
            </Box>
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
      />
    </ResponsiveDashboardLayout>
  );
}
