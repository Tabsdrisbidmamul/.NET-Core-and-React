import React, { SyntheticEvent } from 'react';
import { Profile } from 'app/models/profile';
import { Button, Reveal } from 'semantic-ui-react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'app/stores/stores';

interface Props {
  profile: Profile;
}

export default observer(function FollowButton({ profile }: Props) {
  const { profileStore, userStore } = useStore();
  const { updateFollowing, loading } = profileStore;

  if (userStore.user?.username === profile.username) return null;

  function handleFollow(e: SyntheticEvent, username: string) {
    e.preventDefault();

    profile.following ? updateFollowing(username, false) : updateFollowing(username, true);
  }

  return (
    <Reveal animated="move">
      <Reveal.Content visible style={{ width: '100%' }}>
        <Button fluid color="teal" content={profile.following ? 'Following' : 'Not following'} />
      </Reveal.Content>

      <Reveal.Content hidden style={{ width: '100%' }}>
        <Button
          basic
          fluid
          color={profile.following ? 'red' : 'green'}
          content={profile.following ? 'Unfollow' : 'Follow'}
          onClick={(e) => handleFollow(e, profile.username)}
          loading={loading}
        />
      </Reveal.Content>
    </Reveal>
  );
});
