import React, { Fragment } from 'react';
import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import { Item, Label } from 'semantic-ui-react';
import ActivityListItem from './ActivityListItem';
import { format } from 'date-fns';

export default observer(function ActivityList() {
  const { activityStore } = useStore();
  const { groupedActivities } = activityStore;

  return (
    <>
      {groupedActivities.map(([group, activityList]) => (
        <Fragment key={group}>
          <Label size="large" color="blue">
            {format(new Date(group), 'eeee do MMMM')}
          </Label>

          <Item.Group divided>
            {activityList.map((activity) => (
              <ActivityListItem key={activity.id} activity={activity} />
            ))}
          </Item.Group>
        </Fragment>
      ))}
    </>
  );
});
