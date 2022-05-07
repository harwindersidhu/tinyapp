const { assert } = require('chai');

const { getUserByEmail, urlBelongsToCurrentUser } = require('../helpers.js');

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, expectedUserID);
  });

  it('should return a null value with invalid email', function() {
    const user = getUserByEmail("useThreer@example.com", testUsers)
    const expectedUserID = null;
    assert.strictEqual(user, expectedUserID);
  });
});

describe('urlBelongsToCurrentUser', function() {
  it('should return true if given url belongs to given user', function() {
    const belongToUser = urlBelongsToCurrentUser("b2xVn2", "userRandomID", testUrlDatabase)
    const expectedOutout = true
    assert.strictEqual(belongToUser, expectedOutout);
  });

  it('should return false if given url doesnot belong to given user', function() {
    const belongToUser = urlBelongsToCurrentUser("b2xVn2", "user2RandomID", testUrlDatabase)
    const expectedOutout = false
    assert.strictEqual(belongToUser, expectedOutout);
  });
});

