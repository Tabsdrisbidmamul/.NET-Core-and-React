import agent from 'app/api/agent';
import { User, UserFormValues } from 'app/models/user';
import { history } from 'index';
import { makeAutoObservable, runInAction } from 'mobx';
import { constants } from '../common/constants/constant';
import { store } from './stores';

export default class UserStore {
  user: User | null = null;
  fbAccessToken: string | null = null;
  fbLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  login = async (creds: UserFormValues) => {
    try {
      const user = await agent.Account.login(creds);
      store.commonStore.setToken(user.token);
      this.setUser(user);

      history.push(constants.activities);

      store.modalStore.closeModal();
    } catch (error) {
      throw error;
    }
  };

  logout = () => {
    store.commonStore.setToken(null);
    window.localStorage.removeItem(constants.jwt);
    this.setUser(null);

    history.push(constants.home);
  };

  register = async (creds: UserFormValues) => {
    try {
      const user = await agent.Account.register(creds);
      store.commonStore.setToken(user.token);
      this.setUser(user);

      history.push(constants.activities);

      store.modalStore.closeModal();
    } catch (error) {
      throw error;
    }
  };

  setDisplayName = (name: string) => {
    if (this.user) this.user.displayName = name;
  };

  setImage = (image: string) => {
    if (this.user) this.user.image = image;
  };

  getUser = async () => {
    try {
      const user = await agent.Account.current();
      this.setUser(user);
    } catch (error) {
      console.log(error);
    }
  };

  setUser = (user: User | null) => {
    this.user = user;
  };

  setFbLoading = (status: boolean) => {
    this.fbLoading = status;
  };

  getFacebookLoginStatus = async () => {
    window.FB.getLoginStatus((response) => {
      if (response.status === 'connected') {
        this.fbAccessToken = response.authResponse.accessToken;
      }
    });
  };

  facebookLogin = () => {
    this.setFbLoading(true);

    const apiLogin = (accessToken: string) => {
      agent.Account.fbLogin(accessToken)
        .then((user) => {
          store.commonStore.setToken(user.token);
          runInAction(() => {
            this.user = user;
          });

          history.push('/activities');
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => this.setFbLoading(false));
    };

    if (this.fbAccessToken) {
      apiLogin(this.fbAccessToken);
    } else {
      window.FB.login(
        (response) => {
          apiLogin(response.authResponse.accessToken);
        },
        { scope: 'public_profile,email' }
      );
    }
  };
}
