/* Node API
Author: Shreyas Agnihotri, Thanh Nguyen Jr, Ayan Agarwal, Micahel Zhou
Dartmouth CS61, Spring 2020

Add config.js file to root directory
To run: nodemon api.js <local|sunapee>
Then: make calls to http://localhost:3000
Assumes database table has been created (code in Lab 3.sql)
App will use the database credentials and port stored in config.js for local or sunapee server
Insomnia used to test endpoints
*/

/* eslint-disable eqeqeq */
/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express(); // allows us to get passed in api calls easily
const bcrypt = require('bcrypt'); // enables password hashing/salting

// get config
const env = process.argv[2] || 'local'; // use localhost if enviroment not specified
const config = require('./config')[env]; // read credentials from config.js

// Database connection
app.use((req, res, next) => {
  global.connection = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.schema,
  });
  // eslint-disable-next-line no-undef
  connection.connect();
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set up router
const router = express.Router();

// log request types to server console
router.use((req, res, next) => {
  console.log(`/${req.method}`);
  next();
});

// set up routing
// calls should be made to /api/employees with GET/PUT/POST/DELETE verbs
// you can test GETs with a browser using URL http://localhost:3000/api/employees
// or http://localhost:3000/api/employees/30075445
// recommend Postman app for testing other verbs, find it at https://www.postman.com/
router.get('/', (req, res) => {
  res.send("Yo! This my API. Call it right, or don't call it at all!");
});

const Roles = {
  PLEDGER: 'Pledger',
  ADMIN: 'Admin',
  NON_PROFIT: 'NonProfit',
};

// Returns request with auth credentials removed and password hashed
const clean = (req) => {
  delete req.body.AuthUsername;
  delete req.body.AuthPassword;
  if (req.body.Password) {
    req.body.Password = bcrypt.hashSync(req.body.Password, 10, (error, hash) => {
      if (error) throw error;
      return (hash);
    });
  }
  return req;
};

// Check for user log-in, admin status, and personal rights
const isPasswordCorrect = (req, password) => bcrypt.compareSync(req.body.AuthPassword, password);
// const isUserAdmin = (user) => user.IsAdmin;
// const isUserSearched = (user, req) => user.ID == req.params.id;

// Combine validation functions into one & output response parameters
const validateUser = (e, r, f, res, req) => {
  const user = r[0];
  if (!user) {
    return [400, 'Username not found', null];
  }

  const [adminPassword, pledgerPassword, nonProfitPassword] = [user.AdminHashedPassword, user.PledgerHashedPassword, user.NonProfitHashedPassword];
  if (adminPassword) {
    if (isPasswordCorrect(req, adminPassword)) {
      return [null, null, Roles.ADMIN];
    }
  } else if (pledgerPassword) {
    if (isPasswordCorrect(req, pledgerPassword)) {
      return [null, null, Roles.PLEDGER];
    }
  } else if (nonProfitPassword) {
    if (isPasswordCorrect(req, nonProfitPassword)) {
      return [null, null, Roles.NON_PROFIT];
    }
  }
  return [400, 'Incorrect password', null];
};

const selectAccounts = `(SELECT AdminHashedPassword FROM Dubois_sp20.Admins Where AdminUsername = ?)
                        UNION
                        (SELECT PledgerHashedPassword FROM Dubois_sp20.Pledgers Where PledgerUsername = ?)
                        UNION
                        (SELECT NonProfitHashedPassword FROM Dubois_sp20.NonProfits Where NonProfitUsername = ?);`;

// GET `Funds` - all 'roles' can access - return status code 200 if successful
router.get('/api/funds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // get all funds, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.Funds',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// GET `Funds` by ID - return status code 200 if successful
router.get('/api/funds/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // get all funds, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.Funds WHERE FundID = ?', [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// PUT `Funds` - admins only - return status code 200 if successful
router.put('/api/funds/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can PUT in `Funds`', response: returnResponse }));

      // update a single fund with ID = req.params.id on only the passed params, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('UPDATE Dubois_sp20.Funds SET ? WHERE FundID = ?', [request.body, req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a put -- update fund with ID ${req.params.id}` }));
        });
    });
});

// POST `Funds` - admins only - return status code 200 if successful
router.post('/api/funds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can POST in `Funds`', response: returnResponse }));

      // create a new fund, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('INSERT INTO Dubois_sp20.Funds SET ?', [request.body],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- create a new entry for ${req.body.FundName}` }));
        });
    });
});

// DELETE `Funds` - admins only - return status code 200 if successful
router.delete('/api/funds/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can DELETE in `Funds`', response: returnResponse }));

      // delete a single fund with ID = req.params.id, return status code 200 if successful, 400 if not
      return global.connection.query('DELETE FROM Dubois_sp20.Funds WHERE FundID = ?', [req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a delete -- remove fund with ID ${req.params.id}` }));
        });
    });
});

// start server running on port 3000 (or whatever is set in env)
app.use(express.static(`${__dirname}/`));
app.use('/', router);
app.set('port', (process.env.PORT || config.port || 3000));

app.listen(app.get('port'), () => {
  console.log(`Node server is running on port ${app.get('port')}`);
  console.log(`Environment is ${env}`);
});
