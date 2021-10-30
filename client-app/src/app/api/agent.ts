import { Activity } from 'app/models/activity';
import axios, { AxiosResponse } from 'axios';

const sleep = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

axios.defaults.baseURL = 'http://localhost:5000/api';

axios.interceptors.response.use(async (response) => {
  try {
    await sleep(1000);
    return response;
  } catch (error) {
    console.log(error);
    return await Promise.reject(error);
  }
});

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

const requests = {
  get: <T>(url: string) => axios.get<T>(url).then(responseBody),
  post: <T>(url: string, body: T) =>
    axios.post<T>(url, body).then(responseBody),
  put: <T>(url: string, body: T) => axios.put<T>(url, body).then(responseBody),
  del: <T>(url: string) => axios.delete<T>(url).then(responseBody),
};

const Activities = {
  list: () => requests.get<Activity[]>('/activities'),
  details: (id: string) => requests.get<Activity>(`/activities/${id}`),
  create: (activity: Activity) =>
    requests.post<Activity>('/activities', activity),
  edit: (activity: Activity) =>
    requests.put<Activity>(`/activities/${activity.id}`, activity),
  delete: (id: string) => requests.del<Activity>(`/activities/${id}`),
};

const agent = {
  Activities,
};

export default agent;
