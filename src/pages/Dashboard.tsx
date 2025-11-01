import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import ChartPanel from '../components/ChartPanel';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addPanel, setDashboardState } from '../store/dashboardSlice';
import { IconButton, Snackbar, Alert, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Responsive, WidthProvider } from 'react-grid-layout';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// By default, react-grid-layout shows a transparent red placeholder.
// We can override this with CSS to make it less intrusive and match our theme.
// A dashed border is a common and clear indicator for a drop zone.
const placeholderStyle = `
  .react-grid-layout .react-grid-placeholder {
    background: none !important;
    border: 2px dashed rgba(255, 255, 255, 0.2) !important;
    border-radius: 0.5rem; /* Matches rounded-lg */
  }
`;

const Dashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  // Get the entire dashboard state for saving, and panels for rendering
  const dashboardState = useSelector((state: RootState) => state.dashboard);
  const { panels } = dashboardState;

  const [notification, setNotification] = useState({ open: false, message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state?.message) {
      setNotification({ open: true, message: location.state.message });
      // Clear the state from the location so the message doesn't reappear on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleCloseNotification = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const handleAddPanel = () => {
    dispatch(addPanel());
  };

  const handleDownloadDashboard = () => {
    const stateToSave = JSON.stringify(dashboardState, null, 2);
    const blob = new Blob([stateToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not a string.');
        const loadedState = JSON.parse(text);

        if (!Array.isArray(loadedState.panels)) {
          throw new Error("Invalid dashboard configuration file. Missing 'panels' array.");
        }

        dispatch(setDashboardState(loadedState));
        setNotification({ open: true, message: 'Dashboard loaded successfully!' });
      } catch (error) {
        alert(`Failed to load dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  // Dynamically generate layouts for all breakpoints
  const generateLayouts = () => {
    const breakpoints = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const layouts: { [key: string]: ReactGridLayout.Layout[] } = {};

    for (const breakpoint of Object.keys(breakpoints)) {
      const cols = breakpoints[breakpoint as keyof typeof breakpoints];
      // Use 2 columns for larger screens, 1 for smaller ones
      const itemsPerRow = cols >= 6 ? 2 : 1;
      const panelWidth = Math.floor(cols / itemsPerRow);

      const layout = panels.map((panel, index) => ({
        i: panel.id,
        x: (index * panelWidth) % cols,
        y: Math.floor((index * panelWidth) / cols) * 2,
        w: panelWidth,
        h: 2,
      }));

      layout.push({
        i: 'add-panel-placeholder',
        x: (panels.length * panelWidth) % cols,
        y: Math.floor((panels.length * panelWidth) / cols) * 2,
        w: panelWidth,
        h: 2,
        static: true,
      });
      layouts[breakpoint] = layout;
    }
    return layouts;
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="application/json"
      />
      <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="text-xl font-bold text-black">Dashboard</div>
        <div className="flex items-center gap-4">
        <Button onClick={handleUploadClick} variant="outlined" startIcon={<FileUploadIcon />}>
          Upload Dashboard
        </Button>
        <Button
          onClick={handleDownloadDashboard}
          variant="outlined"
          startIcon={<FileDownloadIcon />}
        >
          Download Dashboard
        </Button>
        </div>
      </div>
      <style>{placeholderStyle}</style>
    <ResponsiveGridLayout
      className="layout"
      layouts={generateLayouts()}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={200} // Adjust row height to your liking
      draggableHandle=".drag-handle"
      draggableCancel=".no-drag" // Prevent dragging when clicking on the edit link
    >
      {panels.map((panel) => (
        <div key={panel.id} className="bg-[#181B1F] rounded-lg overflow-hidden flex flex-col">
          <div className="drag-handle cursor-move bg-[#1F2126] p-2 text-white font-semibold flex justify-between items-center flex-shrink-0">
            <span>{panel.title}</span>
            <IconButton
              component={RouterLink}
              to={`/edit-panel/${panel.id}`}
              className="no-drag"
              size="small"
              aria-label="Edit Panel"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                borderRadius: 1, // Makes the button square
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="flex-grow min-h-0">
            <ChartPanel query={panel.queries} title={panel.title} />
          </div>
        </div>
      ))}
      {/* Add Panel Tile */}
      <div key="add-panel-placeholder" className="bg-[#181B1F] rounded-lg">
        <button
          onClick={handleAddPanel}
          className="w-full h-full flex flex-col items-center justify-center text-gray-400 rounded-lg cursor-pointer hover:bg-[#2d2f34] transition-colors"
          aria-label="Add new panel"
        >
          <AddIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.7)' }} />
          <span className="mt-2 text-lg">Add Panel</span>
        </button>
      </div>
    </ResponsiveGridLayout>
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity="success" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Dashboard;