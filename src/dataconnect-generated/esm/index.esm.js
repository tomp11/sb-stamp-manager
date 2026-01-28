import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'sb-stamp-manager',
  location: 'us-east4'
};

export const addStampToCollectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddStampToCollection', inputVars);
}
addStampToCollectionRef.operationName = 'AddStampToCollection';

export function addStampToCollection(dcOrVars, vars) {
  return executeMutation(addStampToCollectionRef(dcOrVars, vars));
}

export const listPublicCollectionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicCollections');
}
listPublicCollectionsRef.operationName = 'ListPublicCollections';

export function listPublicCollections(dc) {
  return executeQuery(listPublicCollectionsRef(dc));
}

export const createStampRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateStamp', inputVars);
}
createStampRef.operationName = 'CreateStamp';

export function createStamp(dcOrVars, vars) {
  return executeMutation(createStampRef(dcOrVars, vars));
}

export const getMyStampsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyStamps');
}
getMyStampsRef.operationName = 'GetMyStamps';

export function getMyStamps(dc) {
  return executeQuery(getMyStampsRef(dc));
}

