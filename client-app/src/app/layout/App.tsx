import React, { useState, useEffect } from 'react';
import agent from '../api/agent';
import { v4 as uuidv4 } from 'uuid';
import { Container } from 'semantic-ui-react';
import { Activity } from '../models/activity';
import NavBar from './NavBar';
import ActivityDashboard from '../../features/activities/dashboard/ActivityDashboard';
import LoadingComponent from './LoadingComponent';

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<
    Activity | undefined
  >(undefined);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    agent.Activities.list().then((res) => {
      let activities: Activity[] = [];
      res.forEach((activity) => {
        activity.date = activity.date.split('T')[0];
        activities.push(activity);
      });
      setActivities(activities);
      setLoading(false);
    });
  }, []);

  const handleSelectedActivity = (id: string) => {
    setSelectedActivity(activities.find((activity) => activity.id === id));
  };

  const handleCancelSelectedActivity = () => setSelectedActivity(undefined);

  const handleDeleteSelectedActivity = (id: string) => {
    setSubmitting(true);
    agent.Activities.delete(id).then(() => {
      setActivities([...activities.filter((x) => x.id !== id)]);
      setSubmitting(false);
    });
  };

  const handleFormOpen = (id?: string) => {
    id ? handleSelectedActivity(id) : handleCancelSelectedActivity();
    setEditMode(true);
  };

  const handleFormClose = () => {
    setEditMode(false);
  };

  const editActivity = (activity: Activity) => {
    agent.Activities.edit(activity).then(() => {
      setActivities([
        ...activities.filter((x) => x.id !== activity.id),
        activity,
      ]);

      setSelectedActivity(activity);
      setEditMode(false);
      setSubmitting(false);
    });
  };

  const createActivity = (activity: Activity) => {
    activity.id = uuidv4();

    agent.Activities.create(activity).then(() => {
      setActivities([
        ...activities.filter((x) => x.id !== activity.id),
        activity,
      ]);

      setSelectedActivity(activity);
      setEditMode(false);
      setSubmitting(false);
    });
  };

  const handleCreateOrEditActivity = (activity: Activity) => {
    setSubmitting(true);

    activity.id ? editActivity(activity) : createActivity(activity);
  };

  if (loading) return <LoadingComponent content="Loading app" />;

  return (
    <>
      <NavBar openForm={handleFormOpen} />
      <Container style={{ marginTop: '7em' }}>
        <ActivityDashboard
          activities={activities}
          selectedActivity={selectedActivity}
          selectActivity={handleSelectedActivity}
          cancelActivity={handleCancelSelectedActivity}
          editMode={editMode}
          openForm={handleFormOpen}
          closeForm={handleFormClose}
          createOrEdit={handleCreateOrEditActivity}
          deleteSelectedActivity={handleDeleteSelectedActivity}
          submitting={submitting}
        />
      </Container>
    </>
  );
}

export default App;
