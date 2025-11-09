const { AsyncLocalStorage } = require("async_hooks");
const HttpError = require("../lib/errors/HttpError");
const permissionsOptions = require("../lib/permissionsoptions");
const defaultOptions = require("../lib/defaultoptions");
const stateOptions = require("../lib/stateoptions");
const entities = require("../models/entities");
const utilsArrays = require("./utilsarrays");
const config = require("config");
const logger = require("./logger");
const mongoose = require("mongoose");
const {User} = require("../models/schemas/users");
const {organizationModel} = require("../models/schemas/organizations");

const {stringNormalizer} = require("./stringNormalizer");

//can region
//const embededFields = ["createdBy", "updatedBy", "organization" ];

const isSuperUser = (sessionPermissions) => {
  return sessionPermissions.includes(permissionsOptions.SU);
};

const canCreate = (entityPermissions) => {
  if (isSuperUser(entityPermissions)) return true;
  if (entityPermissions.includes(permissionsOptions.CREATE)) return true;
  return false;
};

const canUpdate = (entityPermissions) => {
  if (isSuperUser(entityPermissions)) return true;
  if (
    entityPermissions.includes(permissionsOptions.UPDATE) ||
    entityPermissions.includes(permissionsOptions.UPDATE_ORGANIZATION) ||
    entityPermissions.includes(permissionsOptions.UPDATE_OWN)
  )
    return true;

  return false;
};

const canRetrieve = (entityPermissions) => {
  if (isSuperUser(entityPermissions)) return true;
  if (
    entityPermissions.includes(permissionsOptions.RETRIEVE) ||
    entityPermissions.includes(permissionsOptions.RETRIEVE_ORGANIZATION) ||
    entityPermissions.includes(permissionsOptions.RETRIEVE_OWN)
  )
    return true;

  return false;
};

const canDelete = (entityPermissions) => {
  if (isSuperUser(entityPermissions)) return true;
  if (
    entityPermissions.includes(permissionsOptions.DELETE) ||
    entityPermissions.includes(permissionsOptions.DELETE_ORGANIZATION) ||
    entityPermissions.includes(permissionsOptions.DELETE_OWN)
  )
    return true;

  return false;
};

const canChangeCreator = (entityPermissions) => {
  if (isSuperUser(entityPermissions)) return true;
  if (entityPermissions.includes(permissionsOptions.CHANGE_CREATOR))
    return true;
  return false;
};

const canChangeUpdater = (entityPermissions) => {
  if (isSuperUser(entityPermissions)) return true;
  if (entityPermissions.includes(permissionsOptions.CHANGE_UPDATER))
    return true;
  return false;
};

const canChangeOrganization = (entityPermissions) => {
  if (isSuperUser(entityPermissions)) return true;

  if (entityPermissions.includes(permissionsOptions.CHANGE_ORGANIZATION))
    return true;
  return false;
};

// prepares region

const prepareCreate =  async (entity, data) => {
  delete data.updatedBy;
  const { entityPermissions, organization, user } = getAccessData(entity);
  if (!canCreate(entityPermissions))
    throw new HttpError("Create permission denied", 403);

  if (!(data.createdBy && canChangeCreator(entityPermissions))){
    const userFind = await User.findById(user._id);
    data.createdBy ={ _id: userFind._id.toString(), username: userFind.username};
  }
  if (!data.organization) {
    const orgFind = await organizationModel.findById(organization._id).select('_id organizationName');
       data.organization = { _id: orgFind._id.toString(), organizationName: orgFind.organizationName };
  }else {
        if (Array.isArray(data.organization)) {
      const orgs = await organizationModel.find({ _id: { $in: data.organization } }).select('_id organizationName');
      const orgIds = orgs.map(o => ({ _id: o._id.toString(), organizationName: o.organizationName }));

      const orgFind = await organizationModel.findById(data.organization._id).select('_id organizationName');
      const currentOrg = orgFind ? { _id: orgFind._id.toString(), organizationName: orgFind.organizationName } : null;

      data.organization = [
        ...orgIds.filter(o => String(o._id) !== String(organization._id)),
        currentOrg
      ].filter(Boolean);
    } else {
      const orgFind = await organizationModel.findById(data.organization).select('_id organizationName');
      if (orgFind) {
        data.organization = { _id: orgFind._id.toString(), organizationName: orgFind.organizationName };
      }
    }
  }
    
  if ((!data.organization && user._id === defaultOptions.ANONYMOUS_USER)) {
      data.organization = { _id: defaultOptions.NO_ORGANIZATION, organizationName: "No Organization" };
  }

//  if (!data.state && user._id === defaultOptions.ANONYMOUS_USER)
//      data.state = defaultOptions.DEFAULT_ANONYMOUS_STATE; // for anonymous sign up
    return { data: stringNormalizer(data) };
};

const prepareUpdate =  async (entity, data) => {
  delete data.createdBy;
  const { entityPermissions, organization, user, orgChild } = getAccessData(entity);

  if (!canUpdate(entityPermissions))
    throw new HttpError("Update permission denied", 403);

  if (!(data.updateBy && canChangeUpdater(entityPermissions))) {
    const userFind = await User.findById(user._id);
    data.updatedBy = { _id: userFind._id.toString(), username: userFind.username };
    if( Array.isArray(data.coOwners) && data.coOwners.length >0 ){
        const hasUser = data.coOwners.some(o => String(o?._id) === String(userFind._id));
        if (!hasUser) {
          data.coOwners.push({ _id: userFind._id.toString(), username: userFind.username });
        }
    }else if(Array.isArray(data.coOwners)){
      data.coOwners.push({ _id: userFind._id.toString(), username: userFind.username });
    }
  }
  
  if (!(data.organization && canChangeOrganization(entityPermissions))) {
    const orgFind = await organizationModel.findById(organization._id).select('_id organizationName');
       data.organization = { _id: orgFind._id.toString(), organizationName: orgFind.organizationName };
  }else if (data.organization && canChangeOrganization(entityPermissions)) {
        if (Array.isArray(data.organization)) {
      const orgs = await organizationModel.find({ _id: { $in: data.organization } }).select('_id organizationName');
      const orgIds = orgs.map(o => ({ _id: o._id.toString(), organizationName: o.organizationName }));

      const orgFind = await organizationModel.findById(data.organization._id).select('_id organizationName');
      const currentOrg = orgFind ? { _id: orgFind._id.toString(), organizationName: orgFind.organizationName } : null;

      data.organization = [
        ...orgIds.filter(o => String(o._id) !== String(organization._id)),
        currentOrg
      ].filter(Boolean);
    } else {
      const orgFind = await organizationModel.findById(organization._id).select('_id organizationName');
      if (orgFind) {
        data.organization = { _id: orgFind._id.toString(), organizationName: orgFind.organizationName };
      }
    }
  }
    
  
  const result =  {data: stringNormalizer(data) };
  if (entityPermissions.includes(permissionsOptions.UPDATE)) {
    result.filters = {};
    return result;
  }
  if (entityPermissions.includes(permissionsOptions.UPDATE_ORGANIZATION)) {
            const orgFind = await organizationModel.findById(organization._id).select('_id organizationName');
    result.filters ={ $or: [ 
        { organization: { _id: orgFind._id.toString(), organizationName: orgFind.organizationName } },
        { "organization._id": {$in: orgChild} }
       ] 
     };
    return result;
  }
  if (entityPermissions.includes(permissionsOptions.UPDATE_OWN)) {
        
          const userFind = await User.findById(user._id);
    result.filters = {
        $or: [
            { createdBy:  { _id: userFind._id.toString(), username: userFind.username } },
                    {
              coOwners: {
                $elemMatch: {
                  _id: userFind._id,
                  username: userFind.username
                }
              }
            }
        ]
    };
    return result;
  };
  
    return result;
};

const prepareRetrieve = (entity, req) => {
  const { entityPermissions, organization, user, orgChild } = getAccessData(entity);
  if (!canRetrieve(entityPermissions))
    throw new HttpError("Retrieve permission denied", 403);

  const result = {};
  if (entityPermissions.includes(permissionsOptions.RETRIEVE)) {
    result.filters = {};
    return result;
  }
  if (entityPermissions.includes(permissionsOptions.RETRIEVE_ORGANIZATION)) {
      result.filters ={ $or: [ 
        { "organization._id": new mongoose.Types.ObjectId(organization._id) },
        {"organization._id": {$in: orgChild.map(id => new mongoose.Types.ObjectId(id))} }
       ] 
     };
    return result;
  }

  if (entityPermissions.includes(permissionsOptions.RETRIEVE_OWN)) {
    result.filters = {
        $or: [
          {"createdBy._id": user._id.toString() },
          { "coOwners._id": { $in: [ user._id.toString()] } }
        ]
    };
    result.own = true;
    return result;
  }
  
    return result;
};

const prepareDelete = (entity) => {
  const { entityPermissions, organization, user, orgChild} = getAccessData(entity);
  if (!canDelete(entityPermissions))
    throw new HttpError("Delete permission denied", 403);

  const result = {};
  if (entityPermissions.includes(permissionsOptions.DELETE)) {
    result.filters = {};
    return result;
  }

  if (entityPermissions.includes(permissionsOptions.DELETE_ORGANIZATION)) {
      result.filters ={ $or: [ 
        { organization: organization },
        {organization: {$in: orgChild} }
       ] 
     };
    return result;
  }

  if (entityPermissions.includes(permissionsOptions.DELETE_OWN)) {
     result.filters = {
        $or: [
          { createdBy: user._id.toString() },
          { user: user._id.toString() },
          { coOwners: { $in: [ user._id.toString() ] } }
        ]
    };
    return result;
  }

  return result;
};

// misc region

const asyncLocalStorage = new AsyncLocalStorage();

const getAccessData = (entity) => {
  if (!entity) throw new HttpError("Not a valid entity", 400);
  const session = getSessionData();
  if (!session) throw new HttpError("Not logged in", 401);
  const permissionItem = session.session.permissions.find((item) => {
    return item.entity === entity || item.entity === entities.SU;
  });
  if (!permissionItem) throw new HttpError("Permission denied", 403);
  const entityPermissions = permissionItem.allowed;
  const organization = session.organization;  
  const user = session.session.user;
  const orgChild = session.organizationChildren;
  
  return { entityPermissions, organization, user, orgChild };
};

const flattenPermissions = (User) => {
  const roles = User.roles;
  
  let allowed = {};
  let denied = {};
  roles.forEach((role) => {
    flattenPermission(role, allowed, denied);
  });

  return Object.keys(allowed).map((entity) => {
    return { entity: entity, allowed: [...new Set(allowed[entity])] };
  });
};

const flattenPermission = (role, allowed, denied) => {
  if (role.permissions) {
    role.permissions.forEach((permission) => {
      const entity = permission.entity;
      if (!allowed[entity]) allowed[entity] = [];
      if (!denied[entity]) denied[entity] = [];

      denied[entity] = denied[entity].concat(permission.denied);
      const allowedCurrent = utilsArrays.diffPrim(
        permission.allowed,
        denied[entity],
      );
      allowed[entity] = allowed[entity].concat(allowedCurrent);
      // if (entity==="users"){
      //   allowed["partners"] = allowed[entity].concat(allowedCurrent);
      // }
    });
  } else {
    return;
  }

  if (role.parent) {
    flattenPermission(role.parent, allowed, denied);
  } else {
    return;
  }
};

const anonymousSessionData = () => {
  return {
    session: {
      refreshToken: "",
      tempToken: "",
      permissions: [
        {
          entity: "users",
          allowed: [1]
        }
      ],
      expiresAt: "1900-01-01",
      user: {
        _id: defaultOptions.ANONYMOUS_USER
       }
    },
    organization: { _id:  defaultOptions.NO_ORGANIZATION},
    organizationChildren: [],
    state: stateOptions.INACTIVE,
    createdBy: defaultOptions.ANONYMOUS_USER
  };
};

const getSessionData = () => {
  const store = asyncLocalStorage.getStore();
  if (!store) throw new HttpError("Seems you are not logged in", 401);
  return store.get("session");
};

const setSessionData = (value) => {
  const store = asyncLocalStorage.getStore();
  if (!store) throw new HttpError("AsyncLocalStorage not initialized", 500);
  store.set("session", value);
};

module.exports = {
  asyncLocalStorage,
  flattenPermissions,
  setSessionData,
  getSessionData,
  prepareCreate,
  prepareUpdate,
  prepareRetrieve,
  prepareDelete,
  anonymousSessionData
};
