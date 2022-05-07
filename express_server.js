const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const bcrypt = require("bcryptjs");

let cookieSession = require('cookie-session');
app.set('trust proxy', 1) // trust first proxy

const { getUserByEmail, generateRandomString, urlsForUser, urlBelongsToCurrentUser } = require("./helpers");

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

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
    urls: urlsForUser(req.session.user_id, urlDatabase), 
    currentUser: users[req.session.user_id], 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    currentUser: users[req.session.user_id] 
  };
  if (templateVars.currentUser) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
  
});

app.get("/urls/:shortURL", (req, res) => {
  let longURL = "";
  if (urlBelongsToCurrentUser(req.params.shortURL, req.session.user_id, urlDatabase)) { 
    longURL = urlDatabase[req.params.shortURL].longURL;
  } else {
    longURL = null;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: longURL,
    currentUser: users[req.session.user_id], 
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) { 
    let shortURL = generateRandomString();
    let newUrlDatabaseObj = {
      longURL: req.body.longURL,
      userID: req.session.user_id 
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
  if (!(users[req.session.user_id])) { 
    res.status(403).send("You must log in to delete.");
  } else if (!(urlBelongsToCurrentUser(req.params.shortURL, req.session.user_id, urlDatabase))) { 
    res.status(403).send("This url doesnot belong to you. So you can not delete it.");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:id", (req, res) => {
  if (!(users[req.session.user_id])) { 
    res.status(403).send("You must log in to update.");
  } else if (!(urlBelongsToCurrentUser(req.params.id, req.session.user_id, urlDatabase))) { 
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
  let currUserId = getUserByEmail(email, users);
  if (!email && !password) {
    res.status(400).send("Email or password can't be empty");
  } else if (!currUserId) {
    res.status(403).send("Email cannot be found. Please check your email.");
  } else if (!(bcrypt.compareSync(password, users[currUserId].password))) { 
    res.status(403).send("Wrong password. Please check your password.");
  } else {
    req.session.user_id = currUserId;
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    currentUser: users[req.session.user_id]
  };
  res.render("login", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    currentUser: users[req.session.user_id] 
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
  } else if (getUserByEmail(email, users)) { //If email is already existing, send back a response with the 400 status code
    res.status(400).send("Email already exists. Please use another email");
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    let newUser = {
      userId,
      email,
      password: hashedPassword
    };
    users[userId] = newUser;
    req.session.user_id = userId;
    console.log(users);
    res.redirect("/urls");
  } 
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
