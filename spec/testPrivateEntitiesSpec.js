describe("privateEntity", function() {
  var { PrivateEntity } = require("../lib/index.js")

  it("should pass", function(){
    let testPrivateObj = {text1: 'abcdef', array1:[true, false, false]}
    let privateObj = new PrivateEntity('test', testPrivateObj)
    let publicObj = privateObj.makePublic();
    expect(publicObj).toEqual({ Text1: 'ABCDEF', Array1: [ true, false, false ] })
  })
});
