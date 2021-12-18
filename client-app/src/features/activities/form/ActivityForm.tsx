import React, { useEffect, useState } from 'react';
import MyTextInput from 'app/common/form/MyTextInput';
import LoadingComponent from 'app/layout/LoadingComponent';
import { useStore } from 'app/stores/stores';
import { Formik, Form } from 'formik';
import { observer } from 'mobx-react-lite';
import { useHistory, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { Button, Header, Segment } from 'semantic-ui-react';
import { v4 as uuid } from 'uuid';
import * as Yup from 'yup';
import MyTextArea from 'app/common/form/MyTextArea';
import MySelectInput from 'app/common/form/MySelectInput';
import { categoryOptions } from 'app/common/options/categoryOptions';
import MyDateInput from 'app/common/form/MyDateInput';
import { ActivityFormValues } from 'app/models/activity';

export default observer(function ActivityForm() {
  const history = useHistory();
  const { activityStore } = useStore();
  const { createActivity, updateActivity, loadActivity, loadingInitial } = activityStore;
  const { id } = useParams<{ id: string }>();

  const [activity, setActivity] = useState<ActivityFormValues>(new ActivityFormValues());

  const validationSchema = Yup.object({
    title: Yup.string().required('The activity title is required'),
    description: Yup.string().required('The activity description is required'),
    category: Yup.string().required('The activity category is required'),
    date: Yup.string().required('The activity date is required').nullable(),
    city: Yup.string().required('The activity city is required'),
    venue: Yup.string().required('The activity venue is required'),
  });

  useEffect(() => {
    if (id) {
      loadActivity(id).then((activity) => {
        if (activity) setActivity(new ActivityFormValues(activity));
      });
    }
  }, [id, loadActivity]);

  const handleFormSubmit = (activity: ActivityFormValues) => {
    if (!activity.id) {
      const newActivity = { ...activity, id: uuid() };

      createActivity(newActivity).then(() => {
        history.push(`/activities/${newActivity.id}`);
      });
    } else {
      updateActivity(activity).then(() => history.push(`/activities/${activity.id}`));
    }
  };

  if (loadingInitial) return <LoadingComponent content="Loading activity..." />;

  return (
    <Segment clearing>
      <Header content="Activity Details" sub color="teal" />
      <Formik
        enableReinitialize
        initialValues={activity}
        validationSchema={validationSchema}
        onSubmit={(values) => handleFormSubmit(values)}
      >
        {({ handleSubmit, isValid, isSubmitting, dirty }) => (
          <Form className="ui form" onSubmit={handleSubmit} autoComplete="off">
            <MyTextInput name="title" placeholder="Title" />
            <MyTextArea placeholder="Description" name="description" rows={3} />
            <MySelectInput placeholder="Category" name="category" options={categoryOptions} />
            <MyDateInput
              placeholderText="Date"
              name="date"
              showTimeSelect
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
            />
            <Header content="Location Details" sub color="teal" />

            <MyTextInput placeholder="City" name="city" />
            <MyTextInput placeholder="Venue" name="venue" />
            <Button
              floated="right"
              positive
              type="submit"
              content="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !dirty || !isValid}
            />
            <Button as={Link} to="/activities" floated="right" type="button" content="cancel" />
          </Form>
        )}
      </Formik>
    </Segment>
  );
});
