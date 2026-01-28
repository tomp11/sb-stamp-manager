import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddStampToCollectionData {
  collectionStamp_insert: CollectionStamp_Key;
}

export interface AddStampToCollectionVariables {
  collectionId: UUIDString;
  stampId: UUIDString;
  note?: string | null;
}

export interface CollectionStamp_Key {
  collectionId: UUIDString;
  stampId: UUIDString;
  __typename?: 'CollectionStamp_Key';
}

export interface Collection_Key {
  id: UUIDString;
  __typename?: 'Collection_Key';
}

export interface CreateStampData {
  stamp_insert: Stamp_Key;
}

export interface CreateStampVariables {
  name: string;
  country: string;
  yearOfIssue: number;
}

export interface GetMyStampsData {
  stamps: ({
    id: UUIDString;
    name: string;
    country: string;
    yearOfIssue: number;
    imageUrl?: string | null;
  } & Stamp_Key)[];
}

export interface ListPublicCollectionsData {
  collections: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    owner?: {
      id: UUIDString;
      username: string;
    } & User_Key;
  } & Collection_Key)[];
}

export interface Stamp_Key {
  id: UUIDString;
  __typename?: 'Stamp_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface AddStampToCollectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddStampToCollectionVariables): MutationRef<AddStampToCollectionData, AddStampToCollectionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddStampToCollectionVariables): MutationRef<AddStampToCollectionData, AddStampToCollectionVariables>;
  operationName: string;
}
export const addStampToCollectionRef: AddStampToCollectionRef;

export function addStampToCollection(vars: AddStampToCollectionVariables): MutationPromise<AddStampToCollectionData, AddStampToCollectionVariables>;
export function addStampToCollection(dc: DataConnect, vars: AddStampToCollectionVariables): MutationPromise<AddStampToCollectionData, AddStampToCollectionVariables>;

interface ListPublicCollectionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicCollectionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPublicCollectionsData, undefined>;
  operationName: string;
}
export const listPublicCollectionsRef: ListPublicCollectionsRef;

export function listPublicCollections(): QueryPromise<ListPublicCollectionsData, undefined>;
export function listPublicCollections(dc: DataConnect): QueryPromise<ListPublicCollectionsData, undefined>;

interface CreateStampRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateStampVariables): MutationRef<CreateStampData, CreateStampVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateStampVariables): MutationRef<CreateStampData, CreateStampVariables>;
  operationName: string;
}
export const createStampRef: CreateStampRef;

export function createStamp(vars: CreateStampVariables): MutationPromise<CreateStampData, CreateStampVariables>;
export function createStamp(dc: DataConnect, vars: CreateStampVariables): MutationPromise<CreateStampData, CreateStampVariables>;

interface GetMyStampsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyStampsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyStampsData, undefined>;
  operationName: string;
}
export const getMyStampsRef: GetMyStampsRef;

export function getMyStamps(): QueryPromise<GetMyStampsData, undefined>;
export function getMyStamps(dc: DataConnect): QueryPromise<GetMyStampsData, undefined>;

