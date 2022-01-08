import React from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Grid, Header, Tab } from 'semantic-ui-react';
import { useStore } from 'app/stores/stores';
import ProfileCard from './ProfileCard';

export default observer(function ProfileFollowings() {
  const {
    profileStore: { profile, followings, loadingFollowings, activeTab },
  } = useStore();

  return (
    <Tab.Pane loading={loadingFollowings}>
      <Grid>
        <Grid.Column width={16}>
          <Header
            floated="left"
            icon="user"
            content={
              activeTab === 3
                ? `People following ${profile?.displayName}`
                : `People ${profile?.displayName} is following`
            }
          />
        </Grid.Column>

        <Grid.Column width={16}>
          <Card.Group itemsPerRow={4}>
            {followings.map((follower) => (
              <ProfileCard key={profile?.username} profile={follower} />
            ))}
          </Card.Group>
        </Grid.Column>
      </Grid>
    </Tab.Pane>
  );
});
