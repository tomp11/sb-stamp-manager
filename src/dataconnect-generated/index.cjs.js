const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'sb-stamp-manager',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const addStampToCollectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddStampToCollection', inputVars);
}
addStampToCollectionRef.operationName = 'AddStampToCollection';
exports.addStampToCollectionRef = addStampToCollectionRef;

exports.addStampToCollection = function addStampToCollection(dcOrVars, vars) {
  return executeMutation(addStampToCollectionRef(dcOrVars, vars));
};

const listPublicCollectionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicCollections');
}
listPublicCollectionsRef.operationName = 'ListPublicCollections';
exports.listPublicCollectionsRef = listPublicCollectionsRef;

exports.listPublicCollections = function listPublicCollections(dc) {
  return executeQuery(listPublicCollectionsRef(dc));
};

const createStampRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateStamp', inputVars);
}
createStampRef.operationName = 'CreateStamp';
exports.createStampRef = createStampRef;

exports.createStamp = function createStamp(dcOrVars, vars) {
  return executeMutation(createStampRef(dcOrVars, vars));
};

const getMyStampsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyStamps');
}
getMyStampsRef.operationName = 'GetMyStamps';
exports.getMyStampsRef = getMyStampsRef;

exports.getMyStamps = function getMyStamps(dc) {
  return executeQuery(getMyStampsRef(dc));
};
