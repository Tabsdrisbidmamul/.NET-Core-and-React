import React from 'react';
import useQuery from '../../app/common/util/hooks';
import agent from '../../app/api/agent';
import { toast } from 'react-toastify';
import { Button, Header, Icon, Segment } from 'semantic-ui-react';

export default function RegisterSuccess() {
  const email = useQuery().get('email') as string;

  function handleConfirmEmailResend() {
    agent.Account.resendEmailConfirm(email)
      .then(() => {
        toast.success('Verification email resent, please check your email');
      })
      .catch((e) => {
        console.log(e);
      });
  }

  return (
    <Segment placeholder textAlign="center">
      <Header icon color="green">
        <Icon name="check" />
        Successfully registered
      </Header>
      <p>Please check your email (including junk email) for the verification email</p>
      {email && (
        <>
          <p>Didn't receive the email? Click the below button to resend</p>
          <Button primary onClick={handleConfirmEmailResend} content="Resend email" size="huge" />
        </>
      )}
    </Segment>
  );
}
