import { AddStampToCollectionData, AddStampToCollectionVariables, ListPublicCollectionsData, CreateStampData, CreateStampVariables, GetMyStampsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAddStampToCollection(options?: useDataConnectMutationOptions<AddStampToCollectionData, FirebaseError, AddStampToCollectionVariables>): UseDataConnectMutationResult<AddStampToCollectionData, AddStampToCollectionVariables>;
export function useAddStampToCollection(dc: DataConnect, options?: useDataConnectMutationOptions<AddStampToCollectionData, FirebaseError, AddStampToCollectionVariables>): UseDataConnectMutationResult<AddStampToCollectionData, AddStampToCollectionVariables>;

export function useListPublicCollections(options?: useDataConnectQueryOptions<ListPublicCollectionsData>): UseDataConnectQueryResult<ListPublicCollectionsData, undefined>;
export function useListPublicCollections(dc: DataConnect, options?: useDataConnectQueryOptions<ListPublicCollectionsData>): UseDataConnectQueryResult<ListPublicCollectionsData, undefined>;

export function useCreateStamp(options?: useDataConnectMutationOptions<CreateStampData, FirebaseError, CreateStampVariables>): UseDataConnectMutationResult<CreateStampData, CreateStampVariables>;
export function useCreateStamp(dc: DataConnect, options?: useDataConnectMutationOptions<CreateStampData, FirebaseError, CreateStampVariables>): UseDataConnectMutationResult<CreateStampData, CreateStampVariables>;

export function useGetMyStamps(options?: useDataConnectQueryOptions<GetMyStampsData>): UseDataConnectQueryResult<GetMyStampsData, undefined>;
export function useGetMyStamps(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyStampsData>): UseDataConnectQueryResult<GetMyStampsData, undefined>;
