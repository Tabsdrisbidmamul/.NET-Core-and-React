import agent from 'app/api/agent';
import { User, UserFormValues } from 'app/models/user';
import { history } from 'index';
import { makeAutoObservable } from 'mobx';
import { constants } from '../common/constants/constant';
import { store } from './stores';

export default class UserStore {
  user: User | null = null;

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

  facebookLogin = () => {
    window.FB.login(
      (response) => {
        console.log(response);
      },
      { scope: 'public_profile,email' }
    );
  };
}
