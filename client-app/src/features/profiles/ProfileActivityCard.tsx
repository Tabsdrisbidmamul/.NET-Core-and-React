import { UserActivity } from 'app/models/profile';
import { format } from 'date-fns';
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Image } from 'semantic-ui-react';

interface Props {
  activity: UserActivity;
}

export default function ProfileActivityCard({ activity }: Props) {
  function truncate(str: string | undefined) {
    if (str) {
      return str.length > 40 ? str.substring(0, 37) + '...' : str;
    }
  }

  return (
    <Card as={Link} to={`/activities/${activity.id}`}>
      <Image
        styles={{ minHeight: 100, objectFit: 'cover' }}
        src={`/assets/categoryImages/${activity.category}.jpg`}
      />
      <Card.Content>
        <Card.Header textAlign="center">{truncate(activity.title)}</Card.Header>
        <Card.Meta textAlign="center">
          <div>{format(new Date(activity.date), 'do MMM')}</div>
          <div>{format(new Date(activity.date), 'p')}</div>
        </Card.Meta>
      </Card.Content>
    </Card>
  );
}
