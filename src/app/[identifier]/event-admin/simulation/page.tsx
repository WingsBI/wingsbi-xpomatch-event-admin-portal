"use client";

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
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
  Grid,
  Paper,
  IconButton,
  Fade,
  Slide,
  Divider,
} from '@mui/material';
import {
  Business,
  Person,
  Email,
  ChevronLeft,
  ChevronRight,
  Favorite,
  Work,
  LocationOn,
  LinkedIn,
  Language,
  Handshake,
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import { apiService, matchmakingApi, ExhibitormatchmakingApi } from '@/services/apiService';
import { fieldMappingApi } from '@/services/fieldMappingApi';

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

export default function SimulationPage() {
  const params = useParams();
  const identifier = params.identifier as string;

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

  // Load visitors and exhibitors on component mount
  useEffect(() => {
    loadParticipants();
  }, [identifier]);

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
        const mappedExhibitors = exhibitorsResponse.result.map((exhibitor: any) => ({
          id: exhibitor.id,
          name: exhibitor.name || exhibitor.companyName,
          email: exhibitor.email,
          company: exhibitor.companyName,
          companyType: exhibitor.companyType,
          location: exhibitor.location,
          phone: exhibitor.phone
        }));
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
             location: match.location,
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
             location: match.location,
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
    if (score >= 80) return '#2e7d32'; // Green
    if (score >= 50) return '#ed6c02'; // Orange
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

  const VisitorCard = ({ visitor }: { visitor: VisitorDetail }) => {
    const displayName = getVisitorDisplayName(visitor);
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
      <Card 
        sx={{ 
          minWidth: 190,
          maxWidth: 200,
          height: 100,
          mx: 1,
          border: '1px solid #e0e0e0',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 3,
            borderColor: 'primary.main',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent sx={{ p: 1, height: '50%', display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'success.main', width: 30, height: 30, fontSize: '0.8rem' ,color: 'white'}}>
              {initials}
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} >
              <Typography variant="body2" fontWeight="medium" noWrap>
                {displayName}
              </Typography>

              </Box>
                             <Typography variant="body2" color="text.secondary" noWrap>
                   {visitor.companyName}
                 </Typography>
               {/* {visitor.designation && (
                 <Typography variant="body2" color="text.secondary" noWrap>
                   {visitor.designation}
                 </Typography>
               )} */}
               <Typography 
                 variant="body2" 
                 fontWeight="medium"
                 sx={{ color: getMatchScoreColor(visitor.matchScore) }}
               >
                   {visitor.matchScore}%
                 </Typography>
              
            </Box>
          </Box>          
          
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
          minWidth: 190,
          maxWidth: 200,
          height: 100,
          mx: 1,
          border: '1px solid #e0e0e0',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 3,
            borderColor: 'primary.main',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent sx={{ p: 2, height: '50%', display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'success.main', width: 30, height: 30, fontSize: '0.8rem' ,color: 'white'}}>
              {initial}
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight="medium" noWrap>
                 {displayName}
               </Typography>

               </Box>
               {exhibitor.companyType && (
                 <Typography variant="body2" color="text.secondary" noWrap>
                   {exhibitor.companyType}
                 </Typography>
               )}
               <Typography 
                 variant="body2" 
                 fontWeight="medium"
                 sx={{ color: getMatchScoreColor(exhibitor.matchScore) }}
               >
                   {exhibitor.matchScore}%
                 </Typography>
              
            </Box>
          </Box>
          
        
          
         
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
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
      <Container maxWidth="lg" sx={{ py: 4, mt: -1}}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 600 ,fontStyle: 'italic' ,mt: -4}}>
          Matchmaking Simulation
        </Typography>

        {/* Section 1: Visitor Dropdown and Recommended Exhibitors */}
        
          <Typography variant="body1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
            Visitor Selection
          </Typography>
          
          <Autocomplete
            options={visitors}
            getOptionLabel={(option) => `${option.name}${option.company ? ` (${option.company})` : ''}`}
            value={selectedVisitor}
            onChange={(_, newValue) => handleVisitorChange(newValue)}
            loading={loadingVisitors}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Visitor"
                variant="outlined"
                fullWidth
                size="small"
                sx={{ maxWidth: 400, mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Person sx={{ mr: 1, color: 'text.secondary'}} />
                      {params.InputProps.startAdornment}
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

          {loadingVisitorMatches && <LinearProgress sx={{ mt: 2, mb: 2 }} />}
          
          <CarouselRecommendations
            items={visitorRecommendations}
            title="Recommended Exhibitors for You"
            type="exhibitor"
            currentPage={visitorPage}
            onPageChange={setVisitorPage}
          />
          
          {selectedVisitor && !loadingVisitorMatches && visitorRecommendations.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>No recommended exhibitors found for this visitor.</Alert>
          )}
        <Divider sx={{ my: 2 , mt: -1, mb: 1}} />

        {/* Section 2: Exhibitor Dropdown and Recommendations */}
        
          <Typography variant="body1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
            Exhibitor Selection
          </Typography>
          
          <Autocomplete
            options={exhibitors}
            getOptionLabel={(option) => `${option.company || option.name}${option.companyType ? ` (${option.companyType})` : ''}`}
            value={selectedExhibitor}
            onChange={(_, newValue) => handleExhibitorChange(newValue)}
            loading={loadingExhibitors}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Exhibitor"
                variant="outlined"
                fullWidth
                size="small"
                sx={{ maxWidth: 400, mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {option.company || option.name}
                    </Typography>
                    {option.companyType && (
                      <Typography variant="body2" color="text.secondary">
                        {option.companyType}
                      </Typography>
                    )}
                    {option.name && option.name !== option.company && (
                      <Typography variant="body2" color="text.secondary">
                        {option.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          />

          {loadingExhibitorMatches && <LinearProgress sx={{ mt: 2, mb: 2 }} />}
          
          <CarouselRecommendations
            items={exhibitorVisitorRecommendations}
            title="Recommended Visitors for You"
            type="visitor"
            currentPage={exhibitorVisitorPage}
            onPageChange={setExhibitorVisitorPage}
          />
          
          <CarouselRecommendations
            items={exhibitorExhibitorRecommendations}
            title="Recommended Exhibitors for You"
            type="exhibitor"
            currentPage={exhibitorExhibitorPage}
            onPageChange={setExhibitorExhibitorPage}
          />
          
          {selectedExhibitor && !loadingExhibitorMatches && 
           exhibitorVisitorRecommendations.length === 0 && 
           exhibitorExhibitorRecommendations.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>No recommendations found for this exhibitor.</Alert>
          )}
        
      </Container>
    </ResponsiveDashboardLayout>
  );
}
