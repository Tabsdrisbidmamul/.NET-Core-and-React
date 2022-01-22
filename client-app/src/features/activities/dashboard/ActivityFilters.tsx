import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Calendar from 'react-calendar';
import { Header, Icon, Menu } from 'semantic-ui-react';

export default observer(function ActivityFilters() {
  const { activityStore } = useStore();
  const { setPredicate, predicate } = activityStore;

  return (
    <>
      <Menu vertical size="large" style={{ width: '100%', marginTop: 28 }}>
        <Header attached color="teal">
          <Icon name="filter" />
          Filters
        </Header>
        <Menu.Item
          content="All Activities"
          active={predicate.has('all')}
          onClick={() => setPredicate('all', 'true')}
        />
        <Menu.Item
          content="I'm going"
          active={predicate.has('isGoing')}
          onClick={() => setPredicate('isGoing', 'true')}
        />
        <Menu.Item
          content="I'm hosting"
          active={predicate.has('isHost')}
          onClick={() => setPredicate('isHost', 'true')}
        />
      </Menu>

      <Header />
      <Calendar
        onChange={(date: Date) => setPredicate('startDate', date)}
        value={predicate.get('startDate') || new Date()}
      />
    </>
  );
});
