import { useStore } from 'app/stores/stores';
import { formatDistanceToNow } from 'date-fns';
import { Formik, Form, Field, FieldProps } from 'formik';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Segment, Header, Comment, Loader } from 'semantic-ui-react';
import * as Yup from 'yup';

interface Props {
  activityId: string;
}

export default observer(function ActivityDetailedChat({ activityId }: Props) {
  const { commentStore } = useStore();

  useEffect(() => {
    if (activityId) {
      commentStore.createHubConnection(activityId);
    }

    return () => {
      commentStore.clearComments(); // Will also stop the connection
    };
  }, [commentStore, activityId]);

  return (
    <>
      <Segment textAlign="center" attached="top" inverted color="teal" style={{ border: 'none' }}>
        <Header>Chat about this event</Header>
      </Segment>
      <Segment clearing>
        <Formik
          initialValues={{ activityId: '', body: '' }}
          validationSchema={Yup.object({
            body: Yup.string().required('Please enter a message'),
          })}
          onSubmit={(values, { resetForm }) =>
            commentStore.addComment(values).then(() => resetForm())
          }
        >
          {({ isValid, isSubmitting, handleSubmit }) => (
            <Form className="ui form">
              <Field name="body">
                {(props: FieldProps) => (
                  <div style={{ position: 'relative' }}>
                    <Loader active={isSubmitting} />
                    <textarea
                      placeholder="Enter your comment (Enter to submit, SHIFT + enter for new line)"
                      rows={2}
                      {...props.field}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.shiftKey) {
                          return;
                        }

                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          isValid && handleSubmit();
                        }
                      }}
                    ></textarea>
                  </div>
                )}
              </Field>
            </Form>
          )}
        </Formik>
        <Comment.Group>
          {commentStore.comments.map((chatComment) => (
            <Comment key={chatComment.id}>
              <Comment.Avatar src={chatComment.image || '/assets/user.png'} />
              <Comment.Content>
                <Comment.Author as={Link} to={`/profiles/${chatComment.username}`}>
                  {chatComment.displayName}
                </Comment.Author>
                <Comment.Metadata>
                  <div>{formatDistanceToNow(chatComment.createdAt)} ago</div>
                </Comment.Metadata>
                <Comment.Text style={{ whiteSpace: 'pre-wrap' }}>{chatComment.body}</Comment.Text>
              </Comment.Content>
            </Comment>
          ))}
        </Comment.Group>
      </Segment>
    </>
  );
});
