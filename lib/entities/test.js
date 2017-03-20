const helpers = {
    testArray: function testArray(item){
        return item.length > 2
    }
}
const model = {
    Text1: {
      _type: "string",
      _mandatory: true,
      _validate: ".{6,}$",
    },
    Array1: {
      _type: "array",
      _itemType: "boolean",
      _mandatory: true,
      _validate: helpers.testArray,
    },
}
module.exports = model;