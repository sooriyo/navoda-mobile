import {APIRequestResources} from "../enums"

export type APIRequestResource =
  APIRequestResources.AuthService |
  APIRequestResources.RouteService|
  APIRequestResources.EmployeeService|
  APIRequestResources.ProductService



export type APIRequestMethod = 'delete' | 'get' | 'post' | 'put'

export type APIRequestCacheStrategy = 'performance' | 'freshness'
