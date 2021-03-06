<p align="center">
  <img src="https://img.shields.io/badge/version-v0.2.1-brightgreen.svg">
  <img src="https://img.shields.io/badge/tests-6/6-orange.svg">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg">
</p>

# api-sentinel
a JS layer between back-end and front-end 

### Info
It's a JS layer between back-end and front-end that converts private objects (from server) to public ones (for front-end) and vice-versa, using predefined schemas. For every entity that is transmitted to/from server, there are 2 files (descriptors) containing JSON schemas that describe it.

One is public (used by the front-end developers) and describes how the entity should be transmitted to server. It also contains validators.

The other is private (only the back-end developers should have access to it) and describes what part of the entity is public or not. It also maps fields to DB fields, and has decorators defined.

### Example of public descriptor:
```javascript
// file name: entities/test.js
const helpers = {
  parseTestArray: function testArray(item){
    return item.length > 2
  }
}
const model = {
  Text1: {
    _type: 'string',
    _mandatory: true,
    _validate: '.{6,}$',
  },
  Array1: {
    _type: 'array',
    _itemType: 'boolean',
    _validate: helpers.testArray,
  },
}
module.exports = model;
```

**In this example:**

_Text1_
+ has to be a string
+ it is mandatory
+ it has to validate against a regEx.

_Array1_
+ has to be an array
+ the items from array must be of type boolean
+ it is not mandatory (by default mandatory == false if missing - throws warning)
+ the array must validate against testArray function


### Example or private descriptor:
```javascript
// file name: entities-private/test.js
const helpers = {
  upperText: function(item){
    return item.toUpperCase();
  }
}
const model = {
  Text1: {
    _public: true,
    _decorator: helpers.upperText,
    _privateName: 'text1'
  },
  Array1: {
    _public: false,
    _privateName: 'array1'
  },
}
module.exports = model;
```

**In this example:**

_Text1_
+ is public (it is exposed to front-end)
+ it has a decorator
+ it's DB field is 'text1'

_Array1_
+ is public (it is exposed to front-end)
+ it's DB field is 'array1'

### Usage examples

Example: prepare private object (from server) for front-end
```javascript
let testPrivateObj = {text1: 'abcdef', array1: [true, false, false]}

let privateObj = new privateEntity('test', testPrivateObj);
// 'test' - entity name (the file name of the entity descriptor)

console.log(privateObj.makePublic());
// will print: {Text1: 'ABCDEF', Array1: [true, false, false]}
```

Example: prepare public object (received from front-end) for server manipulation
```javascript
let testPublicObj = {Text1: 'abcdef', Array1: [true, false, false]}

let publicObj = new publicEntity('test', testPublicObj);
// 'test' - entity name (the file name of the entity descriptor)

console.log(publicEntity.makePrivate());
// will print: {text1: 'abcdef', array1: [true, false, false]}
```

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
