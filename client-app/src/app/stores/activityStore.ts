import agent from 'app/api/agent';
import { Activity, ActivityFormValues } from 'app/models/activity';
import { Pagination, PagingParams } from 'app/models/pagination';
import { Profile } from 'app/models/profile';
import { format } from 'date-fns';
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { store } from './stores';

export default class ActivityStore {
  activityRegistry = new Map<string, Activity>();
  selectedActivity: Activity | undefined = undefined;
  editMode = false;
  loading = false;
  loadingInitial = false;
  pagination: Pagination | null = null;
  pagingParams = new PagingParams();
  predicate = new Map().set('all', true);

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => this.predicate.keys(),
      () => {
        this.pagingParams = new PagingParams();
        this.activityRegistry.clear();
        this.loadActivities();
      }
    );
  }

  setPagingParams = (pagingParams: PagingParams) => {
    this.pagingParams = pagingParams;
  };

  get axiosParams() {
    const params = new URLSearchParams();
    params.append('pageNumber', this.pagingParams.pageNumber.toString());
    params.append('pageSize', this.pagingParams.pageSize.toString());

    this.predicate.forEach((value, key) => {
      if (key === 'startDate') {
        params.append('startDate', (value as Date).toISOString());
      } else {
        params.append(key, value);
      }
    });

    return params;
  }

  setPredicate = (predicate: string, value: any) => {
    const resetPredicate = () => {
      this.predicate.forEach((value, key) => {
        if (key !== 'startDate') this.predicate.delete(key);
      });
    };

    switch (predicate) {
      case 'all':
        resetPredicate();
        this.predicate.set('all', true);
        break;
      case 'isGoing':
        resetPredicate();
        this.predicate.set('isGoing', true);
        break;
      case 'isHost':
        resetPredicate();
        this.predicate.set('isHost', true);
        break;
      case 'startDate':
        this.predicate.delete('startDate');
        this.predicate.set('startDate', value);
        break;
    }
  };

  get activitiesByDate() {
    return Array.from(this.activityRegistry.values()).sort(
      (a, b) => a.date!.getTime() - b.date!.getTime()
    );
  }

  /**
   * Returns back an array of arrays which are grouped by date and activityList
   * [
   *  [2021-05-09, [activityObj1, activityObj2, activityObj3]],
   *  [2021-09-06, [activityObj1, activityObj2, activityObj3]]
   * ]
   *
   */
  get groupedActivities() {
    return Object.entries(
      this.activitiesByDate.reduce((activities, activity) => {
        const date = format(activity.date!, 'dd MMM yyyy');
        activities[date] = activities[date] ? [...activities[date], activity] : [activity];
        return activities;
      }, {} as { [key: string]: Activity[] })
    );
  }

  loadActivities = async () => {
    this.setLoadingInitial(true);
    try {
      const result = await agent.Activities.list(this.axiosParams);

      result.data.forEach((activity) => {
        this.setActivity(activity);
      });

      this.setPagination(result.pagination);
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoadingInitial(false);
    }
  };

  setPagination = (pagination: Pagination) => {
    this.pagination = pagination;
  };

  loadActivity = async (id: string) => {
    let activity = this.getActivity(id);
    if (activity !== undefined) {
      this.setSelectedActivity(activity);
      return activity;
    } else {
      this.setLoadingInitial(true);
      try {
        activity = await agent.Activities.details(id);
        this.setActivity(activity);
        this.setSelectedActivity(activity);

        return activity;
      } catch (error) {
        console.log(error);
      } finally {
        this.setLoadingInitial(false);
      }
    }
  };

  updateHostProfile = (profile: Profile) => {
    const user = store.userStore.user;

    if (user) {
      this.activityRegistry.forEach((activity) => {
        if (activity.hostUsername === user.username) {
          activity.host!.image = profile.image;

          this.updateAttendeeProfile(activity.attendees, user, profile);
        }
      });
    }
  };

  private updateAttendeeProfile = (attendees: Profile[], user: Profile, profile: Profile) => {
    attendees.forEach((attendeeProfile) => {
      if (attendeeProfile.username === user.username) {
        attendeeProfile.image = profile.image;
      }
    });
  };

  private setActivity = (activity: Activity) => {
    const user = store.userStore.user;

    if (user) {
      activity.isGoing = activity.attendees!.some((a) => a.username === user.username);

      activity.isHost = activity.hostUsername === user?.username;
      activity.host = activity.attendees?.find((x) => x.username === activity.hostUsername);
    }

    activity.date = new Date(activity.date!);
    this.activityRegistry.set(activity.id, activity);
  };

  private getActivity = (id: string) => {
    return this.activityRegistry.get(id);
  };

  private setSelectedActivity = (activity: Activity) => {
    this.selectedActivity = activity;
  };

  setLoadingInitial = (state: boolean) => {
    this.loadingInitial = state;
  };

  setLoading = (state: boolean) => {
    this.loading = state;
  };

  createActivity = async (activity: ActivityFormValues) => {
    const user = store.userStore.user;
    const attendee = new Profile(user!);

    try {
      await agent.Activities.create(activity);
      const newActivity = new Activity(activity);

      newActivity.hostUsername = user!.username;
      newActivity.attendees = [attendee];
      this.setActivity(newActivity);

      runInAction(() => {
        this.selectedActivity = newActivity;
      });
    } catch (error) {
      console.log(error);
    }
  };

  updateActivity = async (activity: ActivityFormValues) => {
    try {
      await agent.Activities.edit(activity);

      runInAction(() => {
        if (activity.id) {
          let updatedActivity = { ...this.getActivity(activity.id), ...activity };
          this.activityRegistry.set(activity.id, updatedActivity as Activity);
          this.selectedActivity = updatedActivity as Activity;
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  deleteActivity = async (id: string) => {
    this.setLoading(true);

    try {
      await agent.Activities.delete(id);
      runInAction(() => {
        this.activityRegistry.delete(id);
        this.editMode = false;
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  updateAttendance = async () => {
    const user = store.userStore.user;
    this.setLoading(true);

    try {
      await agent.Activities.attend(this.selectedActivity!.id);
      runInAction(() => {
        if (this.selectedActivity?.isGoing) {
          this.selectedActivity.attendees = this.selectedActivity.attendees?.filter(
            (a) => a.username !== user?.username
          );
          this.selectedActivity.isGoing = false;
        } else {
          const attendee = new Profile(user!);
          this.selectedActivity?.attendees?.push(attendee);
          this.selectedActivity!.isGoing = true;
        }

        this.activityRegistry.set(this.selectedActivity!.id, this.selectedActivity!);
      });
    } catch (error) {
    } finally {
      this.setLoading(false);
    }
  };

  cancelActivityToggle = async () => {
    this.setLoading(true);

    try {
      await agent.Activities.attend(this.selectedActivity!.id);

      runInAction(() => {
        this.selectedActivity!.isCancelled = !this.selectedActivity?.isCancelled;
        this.activityRegistry.set(this.selectedActivity!.id, this.selectedActivity!);
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  clearSelectedActivity = () => (this.selectedActivity = undefined);

  updateAttendeeFollowing = (username: string) => {
    this.activityRegistry.forEach((activity) => {
      activity.attendees.forEach((attendee) => {
        if (attendee.username === username) {
          attendee.following ? attendee.followersCount-- : attendee.followersCount++;
          attendee.following = !attendee.following;
        }
      });
    });
  };
}
