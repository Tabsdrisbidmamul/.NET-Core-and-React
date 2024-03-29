import { constants } from 'app/common/constants/constant';
import { useStore } from 'app/stores/stores';
import LoginForm from 'features/users/LoginForm';
import RegisterForm from 'features/users/RegisterForm';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Divider, Header, Image, Segment } from 'semantic-ui-react';

export default observer(function HomePage() {
  const { userStore, modalStore } = useStore();

  return (
    <Segment inverted textAlign="center" vertical className="masthead">
      <Container text>
        <Header as="h1" inverted>
          <Image size="massive" src="/assets/logo.png" alt="logo" style={{ marginBottom: 12 }} />
          Reactivities
        </Header>

        {userStore.isLoggedIn ? (
          <>
            <Header as="h2" inverted>
              Welcome to Reactivities
            </Header>

            <Button as={Link} to={constants.activities} size="huge" inverted>
              Go to Activities!
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => modalStore.openModal(<LoginForm />)} size="huge" inverted>
              Login!
            </Button>

            <Button onClick={() => modalStore.openModal(<RegisterForm />)} size="huge" inverted>
              Register!
            </Button>

            <Divider horizontal inverted>
              Or
            </Divider>

            <Button
              size="huge"
              loading={userStore.fbLoading}
              inverted
              color="facebook"
              onClick={userStore.facebookLogin}
            >
              Login with Facebook
            </Button>
          </>
        )}
      </Container>
    </Segment>
  );
});
