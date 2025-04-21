import { ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, Send, Settings, Business } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <List>
      <ListItem button component={Link} to="/">
        <ListItemIcon>
          <Dashboard />
        </ListItemIcon>
        <ListItemText primary="Översikt" />
      </ListItem>
      <ListItem button component={Link} to="/send-hours">
        <ListItemIcon>
          <Send />
        </ListItemIcon>
        <ListItemText primary="Skicka tidrapport" />
      </ListItem>
      <ListItem button component={Link} to="/projects">
        <ListItemIcon>
          <Business />
        </ListItemIcon>
        <ListItemText primary="Projekt" />
      </ListItem>
      <ListItem button component={Link} to="/settings">
        <ListItemIcon>
          <Settings />
        </ListItemIcon>
        <ListItemText primary="Inställningar" />
      </ListItem>
    </List>
  );
};

export default Navigation; 