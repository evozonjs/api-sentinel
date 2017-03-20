const PublicSchema = require("./entities")
const PrivateSchema = require("./entities-private")

const log = {
  LOG: "log",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  CRIT: "critical"
}

function CustomError(msg, level){
  this.name = "Generic error";
  if(level == "critical") this.name = "Critical Error";
  if(level == "error") this.name = "Parsing Error";

  this.message = msg + "\n ^^^^^^^^^^^^"
  Error.apply(this);
}

class Entity {
  constructor(schema = null, data = {}, skipTests = false, logger = this._logger){
    this._logger = logger;
    if(typeof schema !== "string" || schema === ''){
      this._logger("A schema must be specified", log.CRIT);
      return this;
    }

    if(!this._isObject(PrivateSchema[schema]) || this._objIsEmpty(PrivateSchema[schema])){
      this._logger("A private schema must be specified for "+schema, log.CRIT);
      return this;
    }

    if(!this._isObject(PublicSchema[schema]) || this._objIsEmpty(PublicSchema[schema])){
      this._logger("A public schema must be specified for " + schema, log.CRIT);
      return this;
    }

    this.schema = schema;
    this.privateSchema = PrivateSchema[schema];
    this.publicSchema = PublicSchema[schema];
    this.skipTests = skipTests;
    this.data = data;
    this.path = [schema];
  }

  _logger(errorString, level){
    if(level == "warn"){
      console.log("\n > Warning:", errorString + "\n");
    }else if(level == "error"){
      throw new CustomError(errorString, level)
    }else if(level == "critical"){
      throw new CustomError(errorString, level)
    }
  }

  _isObject(obj){
    return (obj instanceof Object && !Array.isArray(obj));
  }

  _isNull(obj){
    return obj === null;
  }

  _isUndefined(obj){
    return obj === undefined;
  }

  _isString(str){
    return typeof str === "string";
  }

  _isArray(arr){
    return Array.isArray(arr);
  }

  _isNumber(number){
    return typeof number === "number";
  }

  _isFunction(fn){
    return typeof fn === "function";
  }

  _objIsEmpty(obj) {
    if (obj == null) return true;
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
    }
    return true;
  }
}

class PublicEntity extends Entity {
  constructor(schema, data, skipTests, logger){
    super(schema, data, skipTests, logger);
  }

  makePrivate(){
    let result = {};
    this.validateData();
    this._mapData(result, this.data);
    return result;
  }

  validateData(checkFromServer){
    if(checkFromServer) this.checkFromServer = true;
    this._checkData(this.data, {
      "mandatory": this._mandatoryCheck.bind(this),
      "type": this._typeCheck.bind(this),
      "itemType": this._itemTypeCheck.bind(this),
      "validate": this._validateCheck.bind(this)
    });
  }

   // maps object keys (from UI) to DB keys (for server), using ENTITIES_PRIVATE
  _mapData(root, data, entities){
    if(!entities) entities = this.privateSchema;

    if(this._isArray(data)){
      data.map(function(item, index){
        if(this._isObject(item)){
          root[index] = {};
          this._mapData(root[index], item, entities);
        }else{
          //add leaf to array
          root.push(item);
        }
      }, this);
    }else if(this._isObject(data)) {
      Object.keys(data).map(function (objectKey, index) {
        let newKey = entities[objectKey]._privateName;
        let item = data[objectKey];
        if (this._isObject(item)) {
          root[newKey] = {};
          this._mapData(root[newKey], item, entities[objectKey]);
        } else if (this._isArray(item)) {
          root[newKey] = [];
          this._mapData(root[newKey], item, entities[objectKey]._item);
        }
        //add leaf to object
        if (!this._isObject(item) && !this._isArray(item)) {
          root[newKey] = item;
        }
      }, this);
    }
  }

  // makes recursive checks
  _checkData(data, checkFns, entities, i = -1){
    if(!entities) entities = this.publicSchema;

    Object.keys(entities).map(function(objectKey, index){
      if(objectKey == "_item"){
        let entity = entities[objectKey];
        data.map(function(item, index){
          this._checkData(item, checkFns, entity, index);
        }, this);
      }

      if(objectKey.charAt(0) != '_'){
        let item = data[objectKey];
        let entity = entities[objectKey];

        if(i != -1){
          let auxP = objectKey+"["+i+"]";
          let lastP = this.path.pop();
          let aux = lastP.split("[");
          let newP = aux[0];
          if(aux.length > 0){
            newP = newP + "[" + i + "]";
          }
          this.path.push(newP);
          this.path.push(objectKey);
        }else{
          this.path.push(objectKey);
        }

        if(this._isUndefined(entity._mandatory)){
          let errorString = 'missing _mandatory field for '+this.path.join(".");
          this._logger(errorString, log.WARN);
        }

        if(!(this.checkFromServer && this._isUndefined(item))){
          Object.keys(checkFns).map(function(fnKey, index){
            checkFns[fnKey](item, entity, objectKey);
          }, this);
        }

        if(!this._isUndefined(item) && this._isObject(item)){
          this._checkData(item, checkFns, entity);
        }else if(!this._isUndefined(item) && this._isArray(item)){
          this._checkData(item, checkFns, entity);
        }
        this.path.pop();
      }
    }, this);
  }

  _mandatoryCheck(item, entity, name){
    if(
      (entity._mandatory && !this._isUndefined(item)) ||
      (!entity._mandatory || this._isUndefined(entity._mandatory))
      ){
      return true;
    }else{
      let errorString = "MANDATORY check failed for "+this.path.join(".")+"\n"+this.path.join(".")+" is mandatory but was not found."
      this._logger(errorString, log.ERROR);
      return false;
    }
  }

  _typeCheck(item, entity, name){
    if(
      ((!entity._mandatory || this._isUndefined(entity._mandatory)) && this._isUndefined(item)) ||
      (entity._type === typeof item) ||
      (entity._type === "array" && this._isArray(item))||
      (entity._type === "object" && this._isObject(item))
      ){
      return true;
    }else{
      let errorString = "TYPE check failed for "+this.path.join(".")+"\n typeof "+this.path.join(".")+" == "+(typeof item) + " ("+entity._type+" expected)";
      this._logger(errorString, log.ERROR);
      return false;
    }
  }

  _validateCheck(item, entity, name){
    // console.log("Validate", item, name);
    if(
      (
        (!entity._mandatory || this._isUndefined(entity._mandatory)) &&
        this._isUndefined(item)
        ) ||
      (!this._isUndefined(entity._validate))
      ){
        if(this._isString(entity._validate)){
          let regEx = new RegExp(entity._validate);

          if(!regEx.test(item)){
            let errorString = "VALIDATE check failed for "+this.path.join(".")+"\n'"+item+"' doesn't match regex: /"+entity._validate+"/";
            this._logger(errorString, log.ERROR);
          }
        }else if(this._isFunction(entity._validate)){
          if(!entity._validate(item)){
            let errorString = "VALIDATE check failed for "+this.path.join(".")+"\n'"+item+"' doesn't pass Fn: "+entity._validate.name;
            this._logger(errorString, log.ERROR);
          }
          // return entity._validate(item);
        }
    }else{
      return true;
    }
  }

  _itemTypeCheck(item, entity, name){
    if(entity._type === "array" && !this._isUndefined(entity._itemType)){
      let result = true;
      item.map(function(elem, index){
        if(!result){
          return;
        }
        result = ((entity._itemType === typeof elem) ||
          (entity._itemType === "array" && this._isArray(elem)) ||
          (entity._itemType === "object" && this._isObject(elem)));

        if(!result){
          //let errorString = 'ITEM FAILED '+index+' '+this.path.join(".");
          let errorString = "ARRAY ITEM TYPE check failed for "+this.path.join(".")+"["+index+"]\n"+
          "typeof "+this.path.join(".")+"["+index+"] == "+(typeof elem)+" ("+entity._itemType+" expected)";
          this._logger(errorString, log.ERROR);
        }
      }, this);

      return result;
    }else{
      return true;
    }
  }

}

class PrivateEntity extends Entity {
  constructor(schema, data, skipTests, logger){
    super(schema, data, skipTests, logger);
  }

  makePublic(checkPublicData){
    let result = {};
    this._mapData(result, this.data);
    if(checkPublicData){
      let publicObj = new PublicEntity(this.schema, result, this.skipTests, this._logger);
      publicObj.validateData(true);
    }
    return result;
  }

  // makes recursive public checks, and maps object
  _mapData(root, data, entities){
      if(!entities) entities = this.privateSchema;

      Object.keys(entities).map(function(objectKey, index){
        let entity = entities[objectKey];
        let item = data[entities[objectKey]._privateName];

        if(!this._isUndefined(entity._decorator)){
          let decorator = entity._decorator;
          if(this._isFunction(decorator)){
            item = decorator(item);
          }
        }

        if(objectKey == "_item"){
          data.map(function(item, index){
            root[index] = {};
            this._mapData(root[index], item, entity);
          }, this);
        }

        if(objectKey.charAt(0) != '_'){
          if(this._publicCheck(item, entity)){
            if(!this._isUndefined(item) && this._isObject(item)){
              root[objectKey] = {};
              this._mapData(root[objectKey], item, entity);
            }else if(!this._isUndefined(item) && this._isArray(item)){
              if(!this._isUndefined(entity._item)){
                root[objectKey] = [];
                this._mapData(root[objectKey], item, entity);
              }else{
                root[objectKey] = item;
              }
            }else if(!this._isUndefined(item)){
              root[objectKey] = item;
            }
          }
        }
      }, this);
    }

  //defines public checks
  _publicCheck(item, entity){
    if(entity._public){
      return true;
    }else{
      return false;
    }
  }
}

module.exports = {
  PublicEntity,
  PrivateEntity,
  CustomError
}
