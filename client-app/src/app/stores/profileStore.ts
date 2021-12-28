import agent from 'app/api/agent';
import { Photo, Profile } from 'app/models/profile';
import { makeAutoObservable, runInAction } from 'mobx';
import { store } from './stores';

export default class ProfileStore {
  profile: Profile | null = null;
  loadingProfile = false;
  uploading = false;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

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

  setLoadingProfile = (state: boolean) => {
    this.loadingProfile = state;
  };

  setUploading = (state: boolean) => {
    this.uploading = state;
  };

  setProfile = (profile: Profile) => {
    this.profile = profile;
  };
}
