import { UserActivity } from 'app/models/profile';
import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Card, Tab } from 'semantic-ui-react';
import ProfileActivityCard from './ProfileActivityCard';

interface Props {
  activities: UserActivity[];
}

export default observer(function ProfileListCard({ activities }: Props) {
  const { profileStore } = useStore();
  const { loadingActivities } = profileStore;

  return (
    <Tab.Pane loading={loadingActivities}>
      <Card.Group itemsPerRow={4}>
        {activities.map((activity) => (
          <ProfileActivityCard key={activity.id} activity={activity} />
        ))}
      </Card.Group>
    </Tab.Pane>
  );
});
