import React, { useEffect } from 'react';
import { Container } from 'semantic-ui-react';
import NavBar from './NavBar';
import ActivityDashboard from '../../features/activities/dashboard/ActivityDashboard';
import { observer } from 'mobx-react-lite';
import { Route, Switch, useLocation } from 'react-router';
import HomePage from 'features/home/HomePage';
import ActivityForm from 'features/activities/form/ActivityForm';
import ActivityDetails from 'features/activities/details/ActivityDetails';
import TestErrors from 'features/errors/TestError';
import { ToastContainer } from 'react-toastify';
import NotFound from 'features/errors/NotFound';
import ServerError from 'features/errors/ServerError';
import { useStore } from 'app/stores/stores';
import LoadingComponent from './LoadingComponent';
import ModalContainer from 'app/common/modals/ModalContainer';
import ProfilePage from 'features/profiles/ProfilePage';
import RegisterSuccess from 'features/users/RegisterSuccess';
import ConfirmEmail from 'features/users/ConfirmEmail';
import PrivateRoute from './PrivateRoute';

function App() {
  const location = useLocation();

  const { commonStore, userStore } = useStore();

  useEffect(() => {
    if (commonStore.token) {
      userStore.getUser().finally(() => commonStore.setAppLoaded());
    } else {
      userStore.getFacebookLoginStatus().then(() => commonStore.setAppLoaded());
    }
  }, [commonStore, userStore]);

  if (!commonStore.appLoaded) return <LoadingComponent content="Loading App..." />;

  return (
    <>
      <ToastContainer position="bottom-right" hideProgressBar />
      <ModalContainer />
      <Route exact path="/" component={HomePage} />

      <Route
        path={'/(.+)'}
        render={() => (
          <>
            <NavBar />
            <Container style={{ marginTop: '7em' }}>
              <Switch>
                <PrivateRoute exact path="/activities" component={ActivityDashboard} />
                <PrivateRoute path="/activities/:id" component={ActivityDetails} />
                <PrivateRoute
                  path={['/create-activity', '/manage/:id']}
                  component={ActivityForm}
                  key={location.key}
                />
                <PrivateRoute path="/profiles/:username" component={ProfilePage} />
                <PrivateRoute path="/profiles/:username" component={ProfilePage} />
                <PrivateRoute path="/errors" component={TestErrors} />
                <Route path="/account/registerSuccess" component={RegisterSuccess} />
                <Route path="/account/verifyEmail" component={ConfirmEmail} />
                <Route path="/server-error" component={ServerError} />
                <Route component={NotFound} />
              </Switch>
            </Container>
          </>
        )}
      />
    </>
  );
}

export default observer(App);
