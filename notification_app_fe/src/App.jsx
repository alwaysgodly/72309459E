import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AllNotifications from './pages/AllNotifications';
import PriorityNotifications from './pages/PriorityNotifications';
import { Log } from "../../logging_middleware/frontendLogger";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f57c00',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    Log("frontend", "info", "page", "App loaded");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ mb: 2 }}>
          <Toolbar>
            <NotificationsIcon sx={{ mr: 2, fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                Campus Notifications
              </h1>
            </Box>
          </Toolbar>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiTabs-indicator': { backgroundColor: '#fff' },
            }}
          >
            <Tab
              icon={<NotificationsIcon />}
              label="All Notifications"
              id="tab-0"
              aria-controls="tabpanel-0"
              iconPosition="start"
            />
            <Tab
              icon={<PriorityHighIcon />}
              label="Priority"
              id="tab-1"
              aria-controls="tabpanel-1"
              iconPosition="start"
            />
          </Tabs>
        </AppBar>

        <Container
          maxWidth="lg"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            py: 2,
          }}
        >
          <TabPanel value={tabValue} index={0}>
            <AllNotifications />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <PriorityNotifications />
          </TabPanel>
        </Container>

        <Box
          component="footer"
          sx={{
            backgroundColor: '#f5f5f5',
            py: 2,
            textAlign: 'center',
            mt: 'auto',
            borderTop: '1px solid #e0e0e0',
          }}
        >
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            © 2024 Campus Notification Platform
          </p>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
