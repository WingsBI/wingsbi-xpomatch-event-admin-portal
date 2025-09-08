"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close,
  Analytics,
  TrendingUp,
  Psychology,
  Group,
} from '@mui/icons-material';
import { matchmakingApi } from '@/services/apiService';

interface RecommendationWeight {
  exhibitorFieldName: string | null;
  visitorFieldName: string | null;
  collaborativeFieldName: string | null;
  weight: number;
  recommendationType: string;
}

interface RecommendationWeightDialogProps {
  open: boolean;
  onClose: () => void;
  identifier: string;
  matchScore?: number;
}

export default function RecommendationWeightDialog({
  open,
  onClose,
  identifier,
  matchScore,
}: RecommendationWeightDialogProps) {
  const [weights, setWeights] = useState<RecommendationWeight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && identifier) {
      fetchRecommendationWeights();
    }
  }, [open, identifier, matchScore]);

  const fetchRecommendationWeights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await matchmakingApi.getRecommendationWeight(identifier, matchScore ? Math.round(matchScore) : undefined);
      
      if (response.statusCode === 200 && response.result) {
        setWeights(response.result);
      } else {
        setError(response.message || 'Failed to fetch recommendation weights');
      }
    } catch (error) {
      console.error('Error fetching recommendation weights:', error);
      setError('Network error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'content':
        return <Analytics sx={{ fontSize: 16 }} />;
      case 'collaboration':
        return <Group sx={{ fontSize: 16 }} />;
      default:
        return <Psychology sx={{ fontSize: 16 }} />;
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'content':
        return 'primary';
      case 'collaboration':
        return 'secondary';
      default:
        return 'default';
    }
  };

  

  const getTotalWeight = () => {
    return weights.reduce((total, item) => total + item.weight, 0);
  };

  const getFieldDisplayName = (item: RecommendationWeight) => {
    if (item.collaborativeFieldName) {
      return item.collaborativeFieldName;
    }
    if (item.exhibitorFieldName && item.visitorFieldName) {
      return `${item.exhibitorFieldName} ↔ ${item.visitorFieldName}`;
    }
    return item.exhibitorFieldName || item.visitorFieldName || 'Unknown';
  };

  const contentWeights = weights.filter(w => w.recommendationType.toLowerCase() === 'content');
  const collaborationWeights = weights.filter(w => w.recommendationType.toLowerCase() === 'collaboration');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="600">
              Match Score Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recommendation weights and algorithm breakdown
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            {/* Summary Stats */}
            {/* <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
              <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="700" color="primary.main">
                  {getTotalWeight()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Weight
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="700" color="secondary.main">
                  {contentWeights.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Content Factors
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="700" color="info.main">
                  {collaborationWeights.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Collaboration Factors
                </Typography>
              </Paper>
            </Box> */}

            {/* Content-Based Recommendations */}
            {contentWeights.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Analytics color="primary" />
                  Content-Based Matching
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Exhibitor Fields</strong></TableCell>
                        <TableCell><strong>Visitor Fields</strong></TableCell>
                        <TableCell align="center"><strong>Score</strong></TableCell>
                       
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contentWeights.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {item.exhibitorFieldName}
                            </Typography>
                          
                          </TableCell>
                           <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {item.visitorFieldName}
                            </Typography>
                          
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.weight}
                              size="small"
                              sx={{
                               // bgcolor: getWeightColor(item.weight),
                                //color: 'white',
                                fontWeight: 'bold',
                                minWidth: 45,
                              }}
                            />
                          </TableCell>
                         
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Collaboration-Based Recommendations */}
            {collaborationWeights.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group color="secondary" />
                  Collaboration-Based Matching
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Interaction Type</strong></TableCell>
                        <TableCell align="center"><strong>Weight</strong></TableCell>
                        
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {collaborationWeights.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {getFieldDisplayName(item)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.weight}
                              size="small"
                              sx={{
                              //  bgcolor: getWeightColor(item.weight),
                                //color: 'white',
                                fontWeight: 'bold',
                                minWidth: 45,
                              }}
                            />
                          </TableCell>
                         
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {weights.length === 0 && !loading && (
              <Alert severity="info">
                No recommendation weight data available.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
