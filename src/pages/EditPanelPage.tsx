import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button, TextField, Box, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add'; // PlusIcon
import RemoveIcon from '@mui/icons-material/Remove'; // MinusIcon
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ChartPanel from '../components/ChartPanel';
import { PrometheusSeries } from '../hooks/usePrometheusRangeQuery';
import { RootState } from '../store';
import { addQuery, updateQuery, removeQuery, setSeriesForQuery, updateSeriesRename, updatePanelTitle, deletePanel, updatePanelFromFile, updateSeriesOverrides, SeriesObject } from '../store/dashboardSlice';

interface LocalQueryState {
  id: string;
  query: string;
}

const EditPanelPage = () => {
  const { panelId } = useParams<{ panelId: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!panelId) return <div>Invalid Panel ID</div>;

  // Use useSelector to get the specific panel from the Redux store
  const panel = useSelector((state: RootState) =>
    state.dashboard.panels.find((p) => p.id === panelId)
  );

  // Local state to manage query visibility for the preview
  const [queryVisibility, setQueryVisibility] = useState<Record<string, boolean>>({});

  // Local state for editing queries to avoid dispatching on every keystroke
  const [localQueries, setLocalQueries] = useState<LocalQueryState[]>([]);

  // Local state to track which queries have unsaved changes
  const [dirtyQueries, setDirtyQueries] = useState<Record<string, boolean>>({});

  // Local state to track which query is selected for settings by its stable ID
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);

  // Local state for editing the panel title
  const [localTitle, setLocalTitle] = useState('');

  // State to hold the series data from the chart panel for use in the settings
  const [seriesData, setSeriesData] = useState<PrometheusSeries[] | null>(null);

  // State and ref to handle focusing the new query input
  const [shouldFocusNewQuery, setShouldFocusNewQuery] = useState(false);
  const queriesContainerRef = useRef<HTMLDivElement>(null);

  // State to toggle display between original series name and its alias
  const [previewOriginal, setPreviewOriginal] = useState<Record<string, boolean>>({});

  // Local state for editing series settings to avoid dispatching on every keystroke
  const [localSeriesSettings, setLocalSeriesSettings] = useState<Record<string, Partial<SeriesObject>>>({});

  // State for the delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for upload progress
  const [isUploading, setIsUploading] = useState(false);

  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Sync local state with Redux panel.queries when panel changes (e.g., on refresh or Redux update)
  useEffect(() => {
    if (panel) {
      // This effect syncs local state when the panel from Redux changes.
      // It's important for initialization and for reacting to dispatched actions like add/remove.
      setLocalQueries(panel.queries.map(q => ({ id: q.id, query: q.query })));
      setLocalTitle(panel.title);

      const newVisibility: Record<string, boolean> = {};
      const newDirty: Record<string, boolean> = {};
      panel.queries.forEach(q => {
        newVisibility[q.id] = queryVisibility[q.id] ?? true; // Preserve existing or default to true
        newDirty[q.id] = dirtyQueries[q.id] ?? false; // Preserve existing or default to false
      });
      setQueryVisibility(newVisibility);
      setDirtyQueries(newDirty);
    }
  }, [panel]);

  useEffect(() => {
    if (shouldFocusNewQuery && queriesContainerRef.current) {
      // The new query's input will be the last one in the container.
      const inputs = queriesContainerRef.current.querySelectorAll('input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) {
        lastInput.focus();
      }
      setShouldFocusNewQuery(false);
    }
  }, [shouldFocusNewQuery, panel?.queries]); // Rerun when flag is set and queries have updated

  // Get the currently selected query object from Redux for the settings panel
  const selectedQueryObject = useMemo(() => {
    if (selectedQueryId === null || !panel) return null;
    return panel.queries.find(q => q.id === selectedQueryId);
  }, [selectedQueryId, panel]);

  // Reset the series name preview state when the selected query changes
  useEffect(() => {
    setPreviewOriginal({});
  }, [selectedQueryId]);

  // Sync local series settings when the selected query or its series change
  useEffect(() => {
    if (selectedQueryObject) {
      const newSettings: Record<string, Partial<SeriesObject>> = {};
      selectedQueryObject.series.forEach(s => {
        newSettings[s.series_name] = { ...s };
      });
      setLocalSeriesSettings(newSettings);
    } else {
      setLocalSeriesSettings({});
    }
  }, [selectedQueryObject]);

  const handleToggleVisibility = (queryId: string) => {
    setQueryVisibility(vis => ({ ...vis, [queryId]: !vis[queryId] }));
  };

  const handleSelectQueryForSettings = (queryId: string) => {
    setSelectedQueryId(prevId => (prevId === queryId ? null : queryId));
  };

  const handleAddQuery = () => {
    dispatch(addQuery({ panelId }));
    setShouldFocusNewQuery(true);
  };

  const handleRemoveQuery = (queryId: string) => {
    dispatch(removeQuery({ panelId, queryId }));
    // Adjust selected ID if the removed query was selected
    if (selectedQueryId === queryId) {
      setSelectedQueryId(null);
    }
  };

  const handleQueryChange = (queryId: string, value: string) => {
    setLocalQueries(lq => lq.map(q => (q.id === queryId ? { ...q, query: value } : q)));
    setDirtyQueries(dq => ({ ...dq, [queryId]: true }));
  };

  const handleSaveQuery = (queryId: string) => {
    const queryToSave = localQueries.find(q => q.id === queryId);
    if (queryToSave) {
      dispatch(updateQuery({ panelId, queryId, query: queryToSave.query }));
      setDirtyQueries(dq => ({ ...dq, [queryId]: false }));
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(event.target.value);
  };

  const handleTitleBlur = () => {
    // Only dispatch if the title has actually changed
    if (panel && panel.title !== localTitle) {
      dispatch(updatePanelTitle({ panelId, title: localTitle }));
    }
  };

  const handleDeletePanel = () => {
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    const panelTitle = panel?.title || 'Untitled Panel';
    dispatch(deletePanel({ panelId }));
    navigate('/dashboard', { state: { message: `Panel "${panelTitle}" was deleted.` } });
  };

  const handleCloseNotification = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };


  const handleLocalSeriesChange = (seriesName: string, field: keyof SeriesObject, value: string | number) => {
    setLocalSeriesSettings(prev => ({
      ...prev,
      [seriesName]: { ...prev[seriesName], [field]: value },
    }));
  };

  const handleSeriesSettingsBlur = (queryId: string, seriesName: string) => {
    if (!panelId) return;
    const localSettings = localSeriesSettings[seriesName];
    const originalSeries = selectedQueryObject?.series.find(s => s.series_name === seriesName);

    if (localSettings && originalSeries) {
      if (localSettings.series_rename !== originalSeries.series_rename) {
        dispatch(updateSeriesRename({ panelId, queryId, seriesName, newRename: localSettings.series_rename || '' }));
      }
      if (localSettings.units !== originalSeries.units || localSettings.resolution !== originalSeries.resolution) {
        dispatch(updateSeriesOverrides({
          panelId, queryId, seriesName,
          overrides: { units: localSettings.units, resolution: localSettings.resolution }
        }));
      }
    }
  };

  const handleSaveToFile = () => {
    if (!panel) return;
    // Create a config object for the current panel, excluding the ID.
    const { id, ...panelConfigToSave } = panel;

    // Stringify the panel config with pretty printing
    const stateToSave = JSON.stringify(panelConfigToSave, null, 2);
    // Create a blob from the JSON string
    const blob = new Blob([stateToSave], { type: 'application/json' });
    // Create a link element to trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${panel.title.replace(/\s+/g, '_') || 'panel'}-config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!seriesData || seriesData.length === 0) {
      setNotification({
        open: true,
        message: 'No data available to download.',
        severity: 'info',
      });
      return;
    }

    // Create a map of series name to its alias from the panel config
    const aliasMap = new Map<string, string>();
    panel?.queries.forEach(q => {
      q.series.forEach(s => {
        if (s.series_rename) {
          aliasMap.set(s.series_name, s.series_rename);
        }
      });
    });

    const dataByTimestamp: Map<number, Record<string, string>> = new Map();
    const seriesNames = new Set<string>();

    seriesData.forEach(series => {
      const originalName = series.labels.__name__;
      const displayName = aliasMap.get(originalName) || originalName;
      seriesNames.add(displayName);

      series.timestamps.forEach((timestamp, index) => {
        const value = series.values[index];
        if (!dataByTimestamp.has(timestamp)) {
          dataByTimestamp.set(timestamp, {});
        }
        dataByTimestamp.get(timestamp)![displayName] = value !== null ? String(value) : '';
      });
    });

    const sortedTimestamps = Array.from(dataByTimestamp.keys()).sort((a, b) => a - b);
    const sortedSeriesNames = Array.from(seriesNames).sort();

    const header = ['Time', ...sortedSeriesNames].join(',');

    const csvRows = [header];
    sortedTimestamps.forEach(timestamp => {
      const date = new Date(timestamp * 1000).toISOString();
      const rowData = dataByTimestamp.get(timestamp)!;
      const row = [date, ...sortedSeriesNames.map(name => rowData[name] ?? '')].join(',');
      csvRows.push(row);
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${localTitle.replace(/\s+/g, '_') || 'chart-data'}.csv`);
    link.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not a string.');
        const panelConfig = JSON.parse(text);

        // Basic validation
        if (typeof panelConfig.title !== 'string' || !Array.isArray(panelConfig.queries)) {
          throw new Error("Invalid panel configuration file. Missing 'title' or 'queries'.");
        }

        dispatch(updatePanelFromFile({ panelId, panelConfig }));
        setNotification({
          open: true,
          message: `Panel configuration updated from file.`,
          severity: 'success',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setNotification({
          open: true,
          message: `Failed to load panel configuration: ${errorMessage}`,
          severity: 'error',
        });
      } finally {
        if (event.target) event.target.value = ''; // Reset file input
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };
    reader.readAsText(file);
  };

  // This effect syncs the series discovered by the chart back to the Redux store.
  useEffect(() => {
    if (!seriesData || !panelId || !panel) return; // Ensure panel is available

    // Group series by their original queryId
    const seriesByQueryId = seriesData.reduce((acc, series) => {
      const queryId = series.queryId; // This is the stable ID
      if (!acc[queryId]) {
        acc[queryId] = [];
      }
      acc[queryId].push(series.labels.__name__);
      return acc;
    }, {} as Record<string, string[]>);

    // Dispatch an action for each query that has series
    Object.entries(seriesByQueryId).forEach(([queryId, seriesNames]) => {
      dispatch(setSeriesForQuery({
        panelId,
        queryId,
        seriesNames,
      }));
    });
  }, [seriesData, panelId, dispatch, panel]); // Added panel to dependencies

  if (!panel) return <div>Panel not found</div>;

  // Combine queries with their visibility status for the ChartPanel prop
  const queriesWithVisibility = useMemo(() => panel.queries.map(q => ({
    ...q, // Pass the full query object including id, query, and series
    visible: queryVisibility[q.id] ?? true,
  })), [panel.queries, queryVisibility]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] text-white">
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="text-xl font-bold text-black">Edit Panel</div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="application/json"
          />
          <Button
            onClick={handleUploadClick}
            variant="outlined"
            startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <FileUploadIcon />}
            disabled={isUploading}
          >
            {isUploading ? 'Loading...' : 'Load Panel'}
          </Button>
          <Button onClick={handleSaveToFile} variant="outlined" startIcon={<SaveAltIcon />}>
            Save Panel
          </Button>
          <Button onClick={handleDeletePanel} variant="outlined" color="error" startIcon={<DeleteIcon />}>
            Delete Panel
          </Button>
          <Button component={Link} to="/dashboard" variant="contained" startIcon={<ArrowBackIcon />}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            backgroundColor: '#2d2f34', // A dark background matching the theme
            color: 'white',
          },
        }}
      >
        <DialogTitle id="alert-dialog-title">
          {`Delete Panel "${panel?.title}"?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to permanently delete this panel? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chart Preview */}
      <div className="flex-grow min-h-[500px] p-4">
        <div className="w-full h-full bg-[#181B1F] rounded-lg overflow-hidden flex flex-col">
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2 }}>
            <TextField
              fullWidth
              variant="standard"
              value={localTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              placeholder="Panel Title"
              sx={{
                '& .MuiInput-underline:before': { borderBottomColor: 'transparent' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'rgba(255,255,255,0.3)' },
                '& .MuiInput-underline:after': { borderBottomColor: 'primary.main' },
                '& .MuiInputBase-input': {
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                },
              }}
            />
            <IconButton
              onClick={handleDownloadCSV}
              aria-label="Download CSV"
              title="Download data as CSV"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
          <div className="flex-grow min-h-0">
            <ChartPanel query={queriesWithVisibility} title={localTitle} onDataFetched={setSeriesData} />
          </div>
        </div>
      </div>

      {/* Query Editor Section */}
      <div className="flex-shrink-0 border-t border-gray-700 flex flex-row bg-[#202226]" style={{ height: '40vh' }}>
        {/* Left Panel: Query List */}
        <div
          className={`p-4 bg-[#202226] flex flex-col transition-all duration-300 ease-in-out ${selectedQueryId !== null ? 'w-1/2' : 'w-full'}`}
        >
          <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Queries</h3>
          <Box
            ref={queriesContainerRef}
            className="flex-grow overflow-y-auto pr-2"
            sx={{
              // Webkit (Chrome, Safari, Edge)
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent', // The track will be the same as the container's background
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#4B5563', // A mid-gray for the thumb
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#6B7280', // Lighter gray on hover
                },
              },
              // Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 transparent', // thumb color and track color
            }}
          >
            {panel.queries.map((query) => {
              const localQuery = localQueries.find(lq => lq.id === query.id);
              const isDirty = dirtyQueries[query.id] ?? false;
              const isVisible = queryVisibility[query.id] ?? true;

              return (
              <Box key={query.id} sx={{ // Use stable ID from Redux for key
                display: 'flex', 
                alignItems: 'center', 
                mb: 2, 
                p: 1, 
                borderRadius: 1,
                backgroundColor: selectedQueryId === query.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: selectedQueryId === query.id ? '1px solid rgba(9, 100, 235, 0.6)' : '1px solid transparent',
                transition: 'background-color 0.3s, border 0.3s',
              }}>
                <TextField
                variant="outlined"
                size="small"
                value={localQuery?.query ?? ''}
                onChange={(e) => handleQueryChange(query.id, e.target.value)}
                placeholder={`Query ${panel.queries.indexOf(query) + 1}`}
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#26272B',
                    '& fieldset': {
                      borderColor: '#4B5563', // approx gray-600 from tailwind
                    },
                    '&:hover fieldset': {
                      borderColor: '#9CA3AF', // a lighter gray for hover
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
                />
                <IconButton
                  onClick={() => handleSaveQuery(query.id)}
                  aria-label="Save query"
                  size="small"
                  disabled={!isDirty} // Use stable ID for dirty state
                  sx={{
                    ml: 1,
                    // Style for the enabled ("dirty") state
                    backgroundColor: 'rgba(35, 91, 38, 1)', // Purplish-red for "dirty"
                    color: '#FFF',
                    borderRadius: 1,
                    transition: 'background-color 0.3s',
                    '&:hover': {
                      // This hover color (green) is different from the base "dirty" color (purplish-red)
                      backgroundColor: 'rgba(46, 125, 50, 0.9)',
                    },
                    // Override styles for the disabled ("saved") state
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(9, 100, 235, 0.4)', // Blue for "saved"
                      color: 'rgba(255, 255, 255, 0.3)', // A lighter color for the icon on a blue background
                    },
                  }}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleSelectQueryForSettings(query.id)} // Pass stable ID
                  aria-label="Query settings"
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFF',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    borderRadius: 1,
                  }}
                >
                  <DisplaySettingsIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleToggleVisibility(query.id)}
                  aria-label="Toggle query visibility"
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: isVisible ? '#FFF' : '#888',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    borderRadius: 1, // Makes the button square
                  }}
                >
                  {isVisible ? (
                    <VisibilityIcon fontSize="small" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton
                  onClick={() => handleRemoveQuery(query.id)} // Pass stable ID
                  aria-label="Remove query"
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(249, 3, 3, 0.7)',
                    color: '#FFF',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    borderRadius: 1, // Makes the button square
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )})}
          </Box>
          <IconButton
          onClick={handleAddQuery}
          aria-label="Add query"
          sx={{
            mt: 2,
            width: '100%',
            border: '1px solid',
            borderColor: 'success.main',
            color: 'success.main',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(46, 125, 50, 0.1)', // A subtle green hover
            },
          }}
        >
          <AddIcon />
        </IconButton>
        </div>

        {/* Right Panel: Settings (conditionally rendered) */}
        {selectedQueryId !== null && selectedQueryObject && ( // Ensure selectedQueryObject exists
          <Box
            className="w-1/2 pt-4 pl-4 pb-4 pr-3 bg-[#2d2f34] overflow-y-auto"
            style={{ borderLeft: '1px solid rgba(9, 100, 235, 0.6)' }}
            sx={{
              // Webkit (Chrome, Safari, Edge)
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#4B5563', // A mid-gray for the thumb
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#6B7280', // Lighter gray on hover
                },
              },
              // Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 transparent', // thumb color and track color
            }}
          >
            <>
              <h3 className="text-lg font-semibold mb-4">Query Settings</h3>
              <p className="text-gray-400 mb-4">Editing query: {selectedQueryObject.query}</p>
              <h4 className="text-md font-semibold mb-2 text-gray-300">Series Aliases</h4>
              {selectedQueryObject.series.length > 0 ? (
                selectedQueryObject.series.map((series, seriesIndex) => (
                  <React.Fragment key={seriesIndex}>
                    {(() => {
                      const isPreviewing = previewOriginal[series.series_name] ?? false;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <TextField
                            label="Alias"
                            value={isPreviewing ? series.series_name : localSeriesSettings[series.series_name]?.series_rename ?? ''}
                            onChange={(e) => handleLocalSeriesChange(series.series_name, 'series_rename', e.target.value)}
                            onBlur={() => handleSeriesSettingsBlur(selectedQueryObject.id, series.series_name)}
                            helperText={`Original: ${series.series_name}`}
                            variant="outlined"
                            fullWidth
                            InputProps={{
                              readOnly: isPreviewing,
                            }}
                            sx={{
                              flexGrow: 1,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isPreviewing ? '#3a3d42' : '#26272B',
                                '& fieldset': {
                                  borderColor: '#4B5563',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#9CA3AF',
                                },
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                cursor: isPreviewing ? 'default' : 'text',
                              },
                              '& .MuiFormLabel-root': {
                                color: '#9CA3AF',
                                '&.Mui-focused': {
                                  color: '#A5B4FC',
                                },
                              },
                              '& .MuiFormHelperText-root': {
                                color: '#6B7280',
                              },
                            }}
                          />
                          <IconButton
                            onClick={() => setPreviewOriginal(prev => ({ ...prev, [series.series_name]: !prev[series.series_name] }))}
                            disabled={series.series_name === series.series_rename}
                            aria-label="Toggle between original and custom alias"
                            title="Toggle between original and custom alias"
                            sx={{
                              backgroundColor: isPreviewing ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                              color: '#FFF',
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: isPreviewing ? 'primary.dark' : 'rgba(255, 255, 255, 0.2)',
                              },
                              '&.Mui-disabled': {
                                color: 'rgba(255, 255, 255, 0.3)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                          >
                            <RestartAltIcon />
                          </IconButton>
                        </Box>
                      );
                    })()}
                    {(() => {
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, pl: 1, pr: '52px' }}>
                          <TextField
                            label="Units"
                            value={localSeriesSettings[series.series_name]?.units ?? ''}
                            onChange={(e) => handleLocalSeriesChange(series.series_name, 'units', e.target.value)}
                            variant="outlined"
                            onBlur={() => handleSeriesSettingsBlur(selectedQueryObject.id, series.series_name)}
                            size="small"
                            sx={{
                              flex: 1,
                              '& .MuiOutlinedInput-root': { backgroundColor: '#26272B', '& fieldset': { borderColor: '#4B5563' } },
                              '& .MuiInputBase-input': { color: 'white' },
                              '& .MuiFormLabel-root': { color: '#9CA3AF' },
                            }}
                          />
                          <Box sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            // When this box or any of its children are focused, apply focus styles to all children
                            '&:focus-within': {
                              '& .MuiOutlinedInput-root fieldset': {
                                borderColor: 'primary.main', // Use theme's primary color for focus
                              },
                              '& .MuiIconButton-root': {
                                borderColor: 'primary.main',
                              },
                            },
                          }}
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              handleSeriesSettingsBlur(selectedQueryObject.id, series.series_name);
                            }
                          }}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const currentValue = localSeriesSettings[series.series_name]?.resolution ?? 0;
                                if (currentValue > 0) {
                                  handleLocalSeriesChange(series.series_name, 'resolution', currentValue - 1);
                                }
                              }}
                              sx={{
                                backgroundColor: '#26272B',
                                color: 'white',
                                borderRadius: 1,
                                border: '1px solid #4B5563',
                                transition: 'border-color 0.2s',
                              }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <TextField
                              label="Resolution"
                              type="number"
                              value={localSeriesSettings[series.series_name]?.resolution ?? 0}
                              variant="outlined"
                              size="small"
                              InputProps={{
                                readOnly: true,
                                inputProps: { min: 0, step: 1, max: 3, style: { textAlign: 'center' } },
                              }}
                              sx={{
                                flex: 1,
                                '& .MuiOutlinedInput-root': { backgroundColor: '#26272B', '& fieldset': { borderColor: '#4B5563' } },
                                // Change cursor to indicate it's not a standard text input
                                '& .MuiInputBase-input': { color: 'white', cursor: 'default' },
                                '& .MuiFormLabel-root': { color: '#9CA3AF' },
                                // Hide browser default number input spinners
                                'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': { display: 'none' },
                                'input[type=number]': { MozAppearance: 'textfield' },
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                const currentValue = localSeriesSettings[series.series_name]?.resolution ?? 0;
                                if (currentValue < 3) { // Respect max value
                                  handleLocalSeriesChange(series.series_name, 'resolution', currentValue + 1);
                                }
                              }}
                              sx={{
                                backgroundColor: '#26272B',
                                color: 'white',
                                borderRadius: 1,
                                border: '1px solid #4B5563',
                                transition: 'border-color 0.2s',
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })()}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-gray-400">No series returned for this query, or query has not been run. Ensure the query is saved and valid.</p>
              )}
            </>
          </Box>
        )}
      </div>
    </div>
  );
};

export default EditPanelPage;