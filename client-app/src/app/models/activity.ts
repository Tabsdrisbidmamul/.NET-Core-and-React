import { Profile } from './profile';

export interface Activity {
  id: string;
  title: string;
  date: Date | null;
  description: string;
  category: string;
  city: string;
  venue: string;
  hostUsername: string;
  isCancelled: boolean;
  isGoing: boolean;
  isHost?: boolean;
  host: Profile | undefined;
  attendees: Profile[];
}

export class Activity implements Activity {
  constructor(init?: ActivityFormValues) {
    Object.assign(this, init);
  }
}

export class ActivityFormValues {
  id?: string = undefined;
  title = '';
  category = '';
  description = '';
  city = '';
  date: Date | null = null;
  venue = '';

  constructor(activity?: ActivityFormValues) {
    if (activity) {
      this.id = activity.id;
      this.title = activity.title;
      this.category = activity.category;
      this.city = activity.city;
      this.venue = activity.venue;
      this.date = activity.date;
    }
  }
}
