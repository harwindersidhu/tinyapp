const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
let cookieParser = require('cookie-parser');
app.use(cookieParser());

const users = {};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.cookies["user_id"]),
    currentUser: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    currentUser: users[req.cookies["user_id"]]
  };
  if (templateVars.currentUser) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
  
});

app.get("/urls/:shortURL", (req, res) => {
  let longURL = "";
  if (urlBelongsToCurrentUser(req.params.shortURL, req.cookies["user_id"])) {
    longURL = urlDatabase[req.params.shortURL].longURL;
  } else {
    longURL = null;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: longURL,
    currentUser: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    let shortURL = generateRandomString();
    let newUrlDatabaseObj = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    }; 
    urlDatabase[shortURL] = newUrlDatabaseObj;
    console.log(urlDatabase);
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("You should login first in order to create new url");
  }
  
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    let longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(403).send("There is no such id present. Please check the given id.");
  }
  
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!(users[req.cookies["user_id"]])) { 
    res.status(403).send("You must log in to delete.");
  } else if (!(urlBelongsToCurrentUser(req.params.shortURL, req.cookies["user_id"]))) {
    res.status(403).send("This url doesnot belong to you. So you can not delete it.");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:id", (req, res) => {
  if (!(users[req.cookies["user_id"]])) {
    res.status(403).send("You must log in to update.");
  } else if (!(urlBelongsToCurrentUser(req.params.id, req.cookies["user_id"]))) {
    res.status(403).send("This url doesnot belong to you. So you can not update it.");
  } else {
    let newLongURL = req.body.newLongURL;
    urlDatabase[req.params.id].longURL = newLongURL;
    res.redirect("/urls");
  }
  
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let currUserId = userIsExisting(email);
  if (!email && !password) {
    res.status(400).send("Email or password can't be empty");
  } else if (!currUserId) {
    res.status(403).send("Email cannot be found. Please check your email.");
  } else if (!(passwordMatches(currUserId, password))) {
    res.status(403).send("Wrong password. Please check your password.");
  } else {
    res.cookie("user_id", currUserId);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    currentUser: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    currentUser: users[req.cookies["user_id"]]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  let userId = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  //If email or password is empty string, send back a response with the 400 status code
  if (email === "" || password === "") {
    res.status(400).send("Email or password can't be empty");
  } else if (userIsExisting(email)) { //If email is already existing, send back a response with the 400 status code
    res.status(400).send("Email already exists. Please use another email");
  } else {
    let newUser = {
      userId,
      email,
      password
    };
    users[userId] = newUser;
    res.cookie("user_id", userId);
    console.log(users);
    res.redirect("/urls");
  } 
});

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
 * @param {*} email The email we needed to check if it is existing or not
 * @returns userId if email exists in users object, else returns null
 */
const userIsExisting = (email) => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return userId;
    }
  }
  return null;
};

/**
 * 
 * @param userId userId of user
 * @param pass password received through request
 * @returns true if pass matches the password of saved user, else return false
 */
const passwordMatches = (userId, pass) => {
  if (users[userId].password === pass) return true;
  false;
}

/**
 * 
 * @param id id of the currently logged in user
 * @returns only that objects of urlDatabase which are relevent to currently logged in user
 */
const urlsForUser = (id) => {
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
 * @returns true if provided short url belongs to current user, else returns false.
 */
const urlBelongsToCurrentUser = (url, currUserId) => {
  let currUserUrlDatabase = urlsForUser(currUserId);
  let shortUrlsForCurrUser = Object.keys(currUserUrlDatabase);
  if (!(shortUrlsForCurrUser.includes(url))) {
    return false;
  } 
  return true;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});