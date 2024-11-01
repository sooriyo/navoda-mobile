import {environment} from "../../../environments/environment";

export class ApiConfig {
  public static baseURL = environment.API_BASE

  public static authURL = `${environment.API_BASE}/auth/login`
}
