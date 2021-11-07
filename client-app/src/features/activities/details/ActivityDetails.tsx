import React from 'react';
import LoadingComponent from 'app/layout/LoadingComponent';
import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Grid } from 'semantic-ui-react';
import ActivityDetailedHeader from './ActivityDetailedHeader';
import ActivityDetailedInfo from './ActivityDetailedInfo';
import ActivityDetailedChat from './ActivityDetailedChat';
import ActivityDetailedSidebar from './ActivityDetailedSidebar';

export default observer(function ActivityDetails() {
  const { activityStore } = useStore();
  const { id } = useParams<{ id: string }>();
  const {
    selectedActivity: activity,
    loadActivity,
    loadingInitial,
  } = activityStore;

  useEffect(() => {
    if (id) loadActivity(id);
  }, [id, loadActivity]);

  if (loadingInitial || !activity) return <LoadingComponent />;

  return (
    <Grid>
      <Grid.Column width="10">
        <ActivityDetailedHeader activity={activity} />
        <ActivityDetailedInfo activity={activity} />
        <ActivityDetailedChat />
      </Grid.Column>

      <Grid.Column width="6">
        <ActivityDetailedSidebar />
      </Grid.Column>
    </Grid>
  );
});
