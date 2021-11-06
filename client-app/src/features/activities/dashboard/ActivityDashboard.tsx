import React, { useEffect } from 'react';
import { Grid } from 'semantic-ui-react';
import ActivityList from './ActivityList';
import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import LoadingComponent from 'app/layout/LoadingComponent';

export default observer(function ActivityDashboard() {
  const { activityStore } = useStore();
  const { activityRegistry, loadActivities, loadingInitial } = activityStore;

  useEffect(() => {
    if (activityRegistry.size <= 1) loadActivities();
  }, [loadActivities, activityRegistry]);

  if (loadingInitial) return <LoadingComponent content="Loading app" />;

  return (
    <Grid fluid="true">
      <Grid.Column width="10">
        <ActivityList />
      </Grid.Column>
      <Grid.Column width="6">
        <h2>Activity filters</h2>
      </Grid.Column>
    </Grid>
  );
});
