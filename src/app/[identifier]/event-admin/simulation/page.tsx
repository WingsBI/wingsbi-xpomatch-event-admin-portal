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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Business,
  BusinessCenter,
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
  Psychology,
  TrendingUp,
  Group,
  Analytics,
  AutoAwesome,
  Visibility,
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import { apiService, matchmakingApi, ExhibitormatchmakingApi } from '@/services/apiService';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import VisitorDetailsDialog from '@/components/common/VisitorDetailsDialog';
import ExhibitorDetailsDialog from '@/components/common/ExhibitorDetailsDialog';

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
              sx={{ color: getMatchScoreColor(visitor.matchScore), fontSize:'0.8rem' }}
            >
              {visitor.matchScore}%
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
              sx={{ color: getMatchScoreColor(exhibitor.matchScore) , fontSize:'0.8rem'}}
            >
              {exhibitor.matchScore}%
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

  const FeatureCard = ({ icon: Icon, title, description, color }: { 
    icon: any; 
    title: string; 
    description: string; 
    color: string; 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid #e0e0e0',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            borderColor: color,
          },
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: `2px solid ${color}30`,
            }}
          >
            <Icon sx={{ fontSize: 28, color: color }} />
          </Box>
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#2c3e50' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const RoleSelectionCard = ({ role, title, description, icon: Icon, color, onClick }: {
    role: RoleType;
    title: string;
    description: string;
    icon: any;
    color: string;
    onClick: () => void;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          height: 150,
          width: 200,
          background: selectedRole === role 
            ? `linear-gradient(135deg, ${color}15 0%, ${color}25 70%)`
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 70%)',
          border: selectedRole === role 
            ? `1px solid ${color}` 
            : '1px solid #e0e0e0',
          borderRadius: 4,
          boxShadow: selectedRole === role 
            ? `0 8px 20px ${color}30`
            : '0 4px 15px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 8px 24px ${color}20`,
            borderColor: color,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
            transform: selectedRole === role ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 0.3s ease-in-out',
          },
        }}
      >
        <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: `0 8px 24px ${color}40`,
            }}
          >
            <Icon sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#2c3e50', mb: 1.5 }}>
            {title}
          </Typography>
          
          <Chip
            label={selectedRole === role ? "Selected" : "Choose Role"}
            color={selectedRole === role ? "primary" : "default"}
            variant={selectedRole === role ? "filled" : "outlined"}
            size="small"
            sx={{
              fontWeight: 600,
              background: selectedRole === role ? color : 'transparent',
              color: selectedRole === role ? 'white' : color,
              borderColor: color,
            }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <ResponsiveDashboardLayout title="Matchmaking Simulation">
      <Container maxWidth="lg" sx={{ py: 4, mt: -1 }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex',  mb: 1 }}>
             
              <Typography 
                variant="h5" 
                component="h1" 
                fontWeight="600" 
                marginTop={-2}
                marginBottom={-5}
             
              >
                Matchmaking Simulation
              </Typography>
            </Box>
            
          </Box>
        </motion.div>



        {/* Role Selection Section */}
        {!selectedRole ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Box sx={{ mb: 2, mt: -4 }}>
               <Typography 
                 variant="h6" 
                 fontWeight="500" 
                 sx={{ mb: 2, color: '#2c3e50' }}
               >
                 Choose Your Role to Begin
               </Typography>
               <Typography 
                 variant="body2" 
                 color="text.secondary" 
                 sx={{ mb: 5, maxWidth: 500 }}
               >
                 Select whether you're a visitor looking for exhibitors or an exhibitor seeking visitors and other exhibitors
               </Typography>
               
               <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                 <RoleSelectionCard
                   role="visitor"
                   title="Visitor"
                   description="I'm attending the event and looking for exhibitors that match my interests and business needs."
                   icon={Person}
                   color="#667eea"
                   onClick={() => setSelectedRole('visitor')}
                 />
                 <RoleSelectionCard
                   role="exhibitor"
                   title="Exhibitor"
                   description="I'm exhibiting at the event and want to connect with visitors and other exhibitors."
                   icon={Business}
                   color="#764ba2"
                   onClick={() => setSelectedRole('exhibitor')}
                 />
               </Box>
            </Box>
          </motion.div>
        ) : (
          /* Existing Role and Participant Selection */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ mb: 2 ,mt: -4}}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button
                  onClick={() => setSelectedRole('')}
                  startIcon={<ChevronLeft />}
                  sx={{ mr: 2, color: 'white' ,bgcolor: 'primary.main'}}
                >
                  Back 
                </Button>
                <Typography variant="h6" fontWeight="500" sx={{ color: '#2c3e50' }}>
                  {selectedRole === 'visitor' ? 'Visitor' : 'Exhibitor'} Matchmaking
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                Select {selectedRole === 'visitor' ? 'Visitor' : 'Exhibitor'}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Conditional Participant Selection */}
                <Box sx={{ flex: 1, maxWidth: 400 }}>
                  {selectedRole === 'visitor' ? (
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
                                  <Tooltip title="View Visitor Details">
                                    <IconButton 
                                      onClick={() => handleVisitorClick(selectedVisitor.id)}
                                      size="small"
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      <Visibility sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
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
                  ) : (
                    <Autocomplete
                      options={exhibitors}
                      getOptionLabel={(option) => `${option.name}${option.company ? ` (${option.company})` : ''}`}
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
                                  <Tooltip title="View Exhibitor Details">
                                    <IconButton 
                                      onClick={() => handleExhibitorClick(selectedExhibitor.id)}
                                      size="small"
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      <Visibility sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
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
                                <Typography variant="body1" >
                                  {option.name}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {option.company || option.name}
                              </Typography>
                              {option.companyType && (
                                <Typography variant="body2" color="text.secondary">
                                  {option.companyType}
                                </Typography>
                              )}
                              
                            </Box>
                          </Box>
                        </Box>
                      )}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Loading Indicators */}
            {loadingVisitorMatches && <LinearProgress sx={{ mt: 2, mb: 2 }} />}
            {loadingExhibitorMatches && <LinearProgress sx={{ mt: 2, mb: 2 }} />}

            {/* Recommendations Section */}
            {selectedRole === 'visitor' && selectedVisitor && (
              <Box>
                <CarouselRecommendations
                  items={visitorRecommendations}
                  title="Recommended Exhibitors for You"
                  type="exhibitor"
                  currentPage={visitorPage}
                  onPageChange={setVisitorPage}
                />
                
                {!loadingVisitorMatches && visitorRecommendations.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>No recommended exhibitors found for this visitor.</Alert>
                )}
              </Box>
            )}

            {selectedRole === 'exhibitor' && selectedExhibitor && (
              <Box>
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
                
                {!loadingExhibitorMatches && 
                 exhibitorVisitorRecommendations.length === 0 && 
                 exhibitorExhibitorRecommendations.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>No recommendations found for this exhibitor.</Alert>
                )}
              </Box>
            )}
          </motion.div>
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
    </ResponsiveDashboardLayout>
  );
}
