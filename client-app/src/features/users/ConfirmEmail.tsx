import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Button, Header, Icon, Segment } from 'semantic-ui-react';
import agent from '../../app/api/agent';
import useQuery from '../../app/common/util/hooks';
import { useStore } from '../../app/stores/stores';
import LoginForm from '../users/LoginForm';

export default function ConfirmEmail() {
  const { modalStore } = useStore();
  const email = useQuery().get('email') as string;
  const token = useQuery().get('token') as string;

  const Status = {
    Verifying: 'Verifying',
    Failed: 'Failed',
    Success: 'Success',
  };

  function handleConfirmEmailResend() {
    agent.Account.resendEmailConfirm(email)
      .then(() => {
        toast.success('Verification email resent, please check your email');
      })
      .catch((e) => {
        console.log(e);
      });
  }

  function getBody() {
    switch (status) {
      case Status.Verifying:
        return <p>Verifying...</p>;
      case Status.Failed:
        return (
          <div>
            <p>Verification failed. You can try resending the verify link to your email</p>
            <Button
              primary
              onClick={handleConfirmEmailResend}
              content="Resend email verification link"
              size="huge"
            />
          </div>
        );
      case Status.Success:
        return (
          <div>
            <p>Email has been verified - you can now login</p>
            <Button
              primary
              onClick={() => modalStore.openModal(<LoginForm />)}
              size="huge"
              content="Login"
            />
          </div>
        );
    }
  }

  const [status, setStatus] = useState(Status.Verifying);

  useEffect(() => {
    agent.Account.verifyEmail(token, email)
      .then(() => {
        setStatus(Status.Success);
      })
      .catch(() => {
        setStatus(Status.Failed);
      });
  }, [Status.Failed, Status.Success, email, token]);

  return (
    <Segment placeholder textAlign="center">
      <Header icon>
        <Icon name="envelope" />
        Email Verification
      </Header>

      <Segment.Inline>{getBody()}</Segment.Inline>
    </Segment>
  );
}
