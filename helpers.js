/**
 * 
 * @param {*} email The email we needed to check if it is existing or not
 * @param database Database containing all users
 * @returns userId if email exists in database object, else returns null
 */
 const getUserByEmail  = (email, database) => {
  for (let userId in database) {
    if (database[userId].email === email) {
      return userId;
    }
  }
  return null;
};

/**
 * @returns a string of 6 random alphanumeric characters
 */
 const generateRandomString = () => {
  let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = "";
  let charactersLength = characters.length;

  for (let i = 0; i <= 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

/**
 * 
 * @param id id of the currently logged in user
 * @param urlDatabase object conating all urls
 * @returns only that objects of urlDatabase which are relevent to currently logged in user
 */
 const urlsForUser = (id, urlDatabase) => {
  let currUserUrlDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      currUserUrlDatabase[url] = urlDatabase[url];
    }
  }
  return currUserUrlDatabase;
};

/**
 * 
 * @param url shortUrl to check if it belongs to current user
 * @param currUserId userID of current user
 * @param urlDatabase object containing all urls
 * @returns true if provided short url belongs to current user, else returns false.
 */
 const urlBelongsToCurrentUser = (url, currUserId, urlDatabase) => {
  let currUserUrlDatabase = urlsForUser(currUserId, urlDatabase);
  let shortUrlsForCurrUser = Object.keys(currUserUrlDatabase);
  if (!(shortUrlsForCurrUser.includes(url))) {
    return false;
  } 
  return true;
}

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  urlBelongsToCurrentUser
}