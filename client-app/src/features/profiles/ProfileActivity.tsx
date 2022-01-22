import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Grid, Header, Tab } from 'semantic-ui-react';
import ProfileListCard from './ProfileListCard';

export default observer(function ProfileActivity() {
  const { profileStore } = useStore();
  const { userActivities, setActivityTab } = profileStore;

  const panes = [
    { menuItem: 'Future Events', render: () => <ProfileListCard activities={userActivities} /> },
    { menuItem: 'Past Events', render: () => <ProfileListCard activities={userActivities} /> },
    { menuItem: 'Hosting', render: () => <ProfileListCard activities={userActivities} /> },
  ];

  return (
    <Tab.Pane>
      <Grid>
        <Grid.Column width={16}>
          <Header floated="left" icon="calendar" content="Activities" />
        </Grid.Column>

        <Grid.Column width={16}>
          <Tab
            menu={{ secondary: true, pointing: true }}
            menuPosition="right"
            panes={panes}
            onTabChange={(e, data) => setActivityTab(data.activeIndex)}
          />
        </Grid.Column>
      </Grid>
    </Tab.Pane>
  );
});
