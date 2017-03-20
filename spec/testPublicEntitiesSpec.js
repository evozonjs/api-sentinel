describe("publicEntity", function() {
  var { PublicEntity, CustomError } = require("../lib/index.js")

  it("should pass", function(){
    let testPublicObj = { Text1: 'abcdef', Array1: [ true, false, false ] }
    let publicObj = new PublicEntity('test', testPublicObj)
    let privateObj = publicObj.makePrivate();
    expect(privateObj).toEqual({ text1: 'abcdef', array1: [ true, false, false ] })
  })

  it("should fail MANDATORY test", function(){
    let testPublicObj = { Array1: [ true, false, false ] }
    let publicObj = new PublicEntity('test', testPublicObj)
    let errorString = "MANDATORY check failed for test.Text1\ntest.Text1 is mandatory but was not found."
    expect( function(){ publicObj.makePrivate(); }).toThrow(new CustomError(errorString, "error"));
  })

  it("should fail TYPE test", function(){
    let testPublicObj = { Text1: 1, Array1: [ true, false, false ] }
    let publicObj = new PublicEntity('test', testPublicObj)
    let errorString = "TYPE check failed for test.Text1\n typeof test.Text1 == number (string expected)"
    expect( function(){ publicObj.makePrivate(); }).toThrow(new CustomError(errorString, "error"));
  })

  it("should fail REGEX validation test", function(){
    let testPublicObj = { Text1: "abcde", Array1: [ true, false, false ] }
    let publicObj = new PublicEntity('test', testPublicObj)
    let errorString = "VALIDATE check failed for test.Text1\n'abcde' doesn't match regex: /.{6,}$/";
    expect( function(){ publicObj.makePrivate(); }).toThrow(new CustomError(errorString, "error"));
  })

  it("should fail FUNCTION validation test", function(){
    let testPublicObj = { Text1: "abcdef", Array1: [ true, false ] }
    let publicObj = new PublicEntity('test', testPublicObj)
    let errorString = "VALIDATE check failed for test.Array1\n'true,false' doesn't pass Fn: testArray";
    expect( function(){ publicObj.makePrivate(); }).toThrow(new CustomError(errorString, "error"));
  })

});
