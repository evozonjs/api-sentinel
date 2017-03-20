const helpers = {
  upperText: function(item){
    return item.toUpperCase();
  }
}

const model = {
  Text1: {
    _public: true,
    _decorator: helpers.upperText,
    _privateName: "text1"
  },
  Array1: {
    _public: true,
    _privateName: "array1"
  }
}
module.exports = model;
