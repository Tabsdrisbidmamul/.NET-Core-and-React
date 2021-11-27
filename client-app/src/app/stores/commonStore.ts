import { constants } from 'app/common/constants/constant';
import { ServerError } from 'app/models/ServerError';
import { makeAutoObservable, reaction } from 'mobx';

export default class CommonStore {
  error: ServerError | null = null;
  token: string | null = window.localStorage.getItem(constants.jwt);
  appLoaded = false;

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => this.token,
      (token) => {
        if (token) {
          window.localStorage.setItem(constants.jwt, token);
        } else {
          window.localStorage.removeItem(constants.jwt);
        }
      }
    );
  }

  setServerError = (error: ServerError) => {
    this.error = error;
  };

  setToken = (token: string | null) => {
    this.token = token;
  };

  setAppLoaded = () => {
    this.appLoaded = true;
  };
}
