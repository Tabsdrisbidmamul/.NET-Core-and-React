import agent from 'app/api/agent';
import { Photo, Profile, UserActivity } from 'app/models/profile';
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { store } from './stores';

export default class ProfileStore {
  profile: Profile | null = null;
  loadingProfile = false;
  uploading = false;
  loading = false;
  loadingFollowings = false;
  followings: Profile[] = [];
  activeTab = 0;
  activityTab = 0;
  userActivities: UserActivity[] = [];
  loadingActivities = false;

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => this.activeTab,
      (activeTab) => {
        if (activeTab === 2) {
          let predicate = '';
          switch (this.activityTab) {
            case 0:
              predicate = 'future';
              break;
            case 1:
              predicate = 'past';
              break;
            case 3:
              predicate = 'hosting';
              break;
          }
          this.loadActivities(this.profile!.username, predicate);
        } else {
          this.userActivities = [];
        }

        if (activeTab === 3 || activeTab === 4) {
          const predicate = activeTab === 3 ? 'followers' : 'following';
          this.loadFollowings(predicate);
        } else {
          this.followings = [];
        }
      }
    );

    reaction(
      () => this.activityTab,
      (activityTab) => {
        let predicate = '';
        switch (activityTab) {
          case 0:
            predicate = 'future';
            break;
          case 1:
            predicate = 'past';
            break;
          case 3:
            predicate = 'hosting';
            break;
        }
        this.loadActivities(this.profile!.username, predicate);
      }
    );
  }

  setActiveTab = (activeTab: any) => {
    this.activeTab = activeTab;
  };

  setActivityTab = (activeTab: any) => {
    this.activityTab = activeTab;
  };

  get isCurrentUser() {
    if (store.userStore.user && this.profile) {
      return store.userStore.user.username === this.profile.username;
    }

    return false;
  }

  loadProfile = async (username: string) => {
    this.setLoadingProfile(true);

    try {
      this.setProfile(await agent.Profiles.get(username));
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoadingProfile(false);
    }
  };

  updateProfile = async (profile: Partial<Profile>) => {
    this.loading = true;
    try {
      await agent.Profiles.updateProfile(profile);

      runInAction(() => {
        if (profile.displayName && profile.displayName !== store.userStore.user?.displayName) {
          store.userStore.setDisplayName(profile.displayName);
        }
        this.profile = { ...this.profile, ...(profile as Profile) };
        this.loading = false;
      });
    } catch (error) {
      console.log(error);
      runInAction(() => (this.loading = false));
    }
  };

  uploadPhoto = async (file: Blob) => {
    this.setUploading(true);

    try {
      const response = await agent.Profiles.uploadPhoto(file);
      const photo = response.data;
      runInAction(() => {
        if (this.profile) {
          this.profile.photos?.push(photo);

          if (photo.isMain && store.userStore.user) {
            store.userStore.setImage(photo.url);
            this.profile.image = photo.url;
          }
        }
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setUploading(false);
    }
  };

  setMainPhoto = async (photo: Photo) => {
    this.setLoading(true);
    try {
      if (photo.isMain) {
        return;
      }

      await agent.Profiles.setMainPhoto(photo.id);
      store.userStore.setImage(photo.url);

      runInAction(() => {
        if (this.profile && this.profile.photos) {
          this.profile.photos.find((p) => p.isMain)!.isMain = false;
          this.profile.photos.find((p) => p.id === photo.id)!.isMain = true;
          this.profile.image = photo.url;

          store.activityStore.updateHostProfile(this.profile);
        }
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  deletePhoto = async (photo: Photo) => {
    this.setLoading(true);

    try {
      await agent.Profiles.deletePhoto(photo.id);

      runInAction(() => {
        this.profile!.photos = this.profile?.photos?.filter((p) => p.id !== photo.id);
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  setLoading = (state: boolean) => {
    this.loading = state;
  };

  setLoadingFollowing = (state: boolean) => {
    this.loadingFollowings = state;
  };

  setLoadingProfile = (state: boolean) => {
    this.loadingProfile = state;
  };

  setUploading = (state: boolean) => {
    this.uploading = state;
  };

  setProfile = (profile: Profile) => {
    this.profile = profile;
  };

  updateFollowing = async (username: string, following: boolean) => {
    this.setLoading(true);
    try {
      await agent.Profiles.updateFollowing(username);
      store.activityStore.updateAttendeeFollowing(username);

      runInAction(() => {
        if (
          this.profile &&
          this.profile.username !== store.userStore.user?.username &&
          this.profile.username === username
        ) {
          following ? this.profile.followersCount++ : this.profile.followersCount--;
          this.profile.following = !this.profile.following;
        }

        if (this.profile && this.profile.username === store.userStore.user?.username) {
          following ? this.profile.followingCount++ : this.profile.followingCount--;
        }

        this.followings.forEach((profile) => {
          if (profile.username === username) {
            profile.following ? profile.followersCount-- : profile.followersCount++;
            profile.following = !profile.following;
          }
        });
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoading(false);
    }
  };

  loadFollowings = async (predicate: string) => {
    this.setLoadingFollowing(true);

    try {
      if (this.profile?.username) {
        const profileFollowings = await agent.Profiles.listFollowing(
          this.profile?.username,
          predicate
        );
        runInAction(() => {
          this.followings = profileFollowings;
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoadingFollowing(false);
    }
  };

  loadActivities = async (username: string, predicate: string) => {
    this.setLoadingActivities(true);

    try {
      if (this.profile) {
        const activities = await agent.Profiles.activities(username, predicate);
        this.formatDates(activities);
        runInAction(() => {
          this.userActivities = activities;
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoadingActivities(false);
    }
  };

  setLoadingActivities = (state: boolean) => (this.loadingActivities = state);

  formatDates = (activities: UserActivity[]) => {
    activities.map((activity) => {
      activity.date = new Date(activity.date + 'Z');
      return activity;
    });
  };
}
