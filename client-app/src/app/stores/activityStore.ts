import agent from 'app/api/agent';
import { Activity } from 'app/models/activity';
import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

export default class ActivityStore {
  activityRegistry = new Map<string, Activity>();
  selectedActivity: Activity | undefined = undefined;
  editMode = false;
  loading = false;
  loadingInitial = true;

  constructor() {
    makeAutoObservable(this);
  }

  get activitiesByDate() {
    return Array.from(this.activityRegistry.values()).sort(
      (a, b) => Date.parse(a.date) - Date.parse(b.date)
    );
  }

  loadActivities = async () => {
    this.setLoadingInitial(true);
    try {
      const activities = await agent.Activities.list();
      activities.forEach((activity) => {
        activity.date = activity.date.split('T')[0];
        this.activityRegistry.set(activity.id, activity);
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoadingInitial(false);
    }
  };

  setLoadingInitial = (state: boolean) => {
    this.loadingInitial = state;
  };

  setLoading = (state: boolean) => {
    this.loading = state;
  };

  setSelectedActivity = (id: string) => {
    this.selectedActivity = this.activityRegistry.get(id);
  };

  cancelSelectedActivity = () => {
    this.selectedActivity = undefined;
  };

  openForm = (id?: string) => {
    id ? this.setSelectedActivity(id) : this.cancelSelectedActivity();
    this.editMode = true;
  };

  closeForm = () => {
    this.editMode = false;
  };

  private createActivity = async (activity: Activity) => {
    this.setLoading(true);

    activity.id = uuidv4();
    try {
      await agent.Activities.create(activity);
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
        this.selectedActivity = activity;
        this.editMode = false;
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  private updateActivity = async (activity: Activity) => {
    this.setLoading(true);

    try {
      await agent.Activities.edit(activity);

      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);

        this.selectedActivity = activity;
        this.editMode = false;
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  deleteActivity = async (id: string) => {
    this.setLoading(true);

    try {
      await agent.Activities.delete(id);
      runInAction(() => {
        this.activityRegistry.delete(id);
        if (this.selectedActivity?.id === id) this.cancelSelectedActivity();
        this.editMode = false;
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  createOrEditActivity = (activity: Activity) => {
    activity.id ? this.updateActivity(activity) : this.createActivity(activity);
  };
}
