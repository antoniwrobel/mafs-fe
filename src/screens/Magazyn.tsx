import withLayout from '../components/layout/withLayout';
import { Box, Tab, Tabs } from '@mui/material';
import AuthContainer from '../components/auth/AuthContainer';
import { useState } from 'react';
import Inventory from './Inventory';

const Magazyn = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box display={'flex'} alignItems={'center'} flexDirection={'column'} boxShadow={2} margin={3}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Komis" />
          <Tab label="Priv" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Inventory />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <div>PRIV </div>
      </TabPanel>
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
      {value === index && (
        <Box>
          <>{children}</>
        </Box>
      )}
    </div>
  );
};

export default withLayout(Magazyn);