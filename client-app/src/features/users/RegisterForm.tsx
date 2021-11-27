import MyTextInput from 'app/common/form/MyTextInput';
import { useStore } from 'app/stores/stores';
import ValidationErrors from 'features/errors/ValidationErrors';
import { ErrorMessage, Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Button, Header } from 'semantic-ui-react';
import * as Yup from 'yup';

export default observer(function RegisterForm() {
  const { userStore } = useStore();

  return (
    <Formik
      initialValues={{ displayName: '', username: '', email: '', password: '', error: null }}
      onSubmit={(values, { setErrors }) =>
        userStore.register(values).catch((error) => setErrors({ error }))
      }
      validationSchema={Yup.object({
        displayName: Yup.string().required(),
        username: Yup.string().required(),
        email: Yup.string().required().email(),
        password: Yup.string().required(),
      })}
    >
      {({ handleSubmit, isSubmitting, errors, isValid, dirty }) => (
        <Form className="ui form error" onSubmit={handleSubmit} autoComplete="off">
          <Header as="h2" content="Sign up to Reactivities" color="teal" textAlign="center" />
          <MyTextInput placeholder={'Display Name'} name={'displayName'} type="text" />
          <MyTextInput placeholder={'User Name'} name={'username'} type="text" />
          <MyTextInput placeholder={'Email'} name={'email'} type="email" />
          <MyTextInput placeholder={'Password'} name={'password'} type="password" />
          <ErrorMessage name="error" render={() => <ValidationErrors errors={errors.error} />} />
          <Button
            disabled={!isValid || !dirty || isSubmitting}
            loading={isSubmitting}
            positive
            content="Register"
            type="submit"
            fluid
          />
        </Form>
      )}
    </Formik>
  );
});
