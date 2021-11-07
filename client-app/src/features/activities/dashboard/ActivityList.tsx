import React, { Fragment } from 'react';
import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import { Header } from 'semantic-ui-react';
import ActivityListItem from './ActivityListItem';

export default observer(function ActivityList() {
  const { activityStore } = useStore();
  const { groupedActivities } = activityStore;

  return (
    <>
      {groupedActivities.map(([group, activityList]) => (
        <Fragment key={group}>
          <Header sub color="teal">
            {group}
          </Header>

          {activityList.map((activity) => (
            <ActivityListItem key={activity.id} activity={activity} />
          ))}
        </Fragment>
      ))}
    </>
  );
});
