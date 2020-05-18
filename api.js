/* Node API
Author: Shreyas Agnihotri, Dartmouth CS61, Spring 2020

Add config.js file to root directory
To run: nodemon api.js <local|sunapee>
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
const isPasswordCorrect = (req, user) => bcrypt.compareSync(req.body.AuthPassword, user.Password);
const isUserAdmin = (user) => user.IsAdmin;
const isUserSearched = (user, req) => user.ID == req.params.id;

// Combine validation functions into one & output response parameters
const validateUser = (e, r, f, res, req, adminOnly = true) => {
  const user = r[0];
  if (!user) {
    return [400, 'Username not found', null];
  }
  if (!isPasswordCorrect(req, user)) {
    return [400, 'Incorrect password', null];
  }
  if (!isUserAdmin(user) && (adminOnly || !isUserSearched(user, req))) {
    return [400, 'You do not have admin access', null];
  }
  return [null, null, null];
};

// GET - read data from database, return status code 200 if successful
router.get('/api/employees', (req, res) => {
  global.connection.query('SELECT * FROM nyc_inspections.Employees WHERE Username = ?', [req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // get all employees (limited to first 10 here), return status code 200
      return global.connection.query('SELECT * FROM nyc_inspections.Employees LIMIT 10',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// GET - read specific data from database, return status code 200 if successful
router.get('/api/employees/:id', (req, res) => {
  global.connection.query('SELECT * FROM nyc_inspections.Employees WHERE Username = ?', [req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req, false);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // read a single employee with ID = req.params.id (the :id in the url above), return status code 200 if successful, 400 if not
      return global.connection.query('SELECT * FROM nyc_inspections.Employees WHERE ID = ?', [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// PUT - UPDATE data in database, make sure to get the ID of the row to update from URL route, return status code 200 if successful
router.put('/api/employees/:id', (req, res) => {
  global.connection.query('SELECT * FROM nyc_inspections.Employees WHERE Username = ?', [req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req, false);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // update a single employee with ID = req.params.id on only the passed params, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('UPDATE nyc_inspections.Employees SET ? WHERE ID = ?', [request.body, req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a put -- update employee with ID ${req.params.id}` }));
        });
    });
});

// POST -- create new employee, return status code 200 if successful
router.post('/api/employees', (req, res) => {
  global.connection.query('SELECT * FROM nyc_inspections.Employees WHERE Username = ?', [req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // create a new employee, return status code 200 if successful, 400 if not
      const request = clean(req);
      request.body.DateHired = new Date();
      return global.connection.query('INSERT INTO nyc_inspections.Employees SET ?', [request.body],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- create a new entry for ${req.body.Name}` }));
        });
    });
});

// DELETE -- delete employee with ID of :id, return status code 200 if successful
router.delete('/api/employees/:id', (req, res) => {
  global.connection.query('SELECT * FROM nyc_inspections.Employees WHERE Username = ?', [req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // delete a single employee with ID = req.params.id, return status code 200 if successful, 400 if not
      return global.connection.query('DELETE FROM nyc_inspections.Employees WHERE ID = ?', [req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a delete -- remove employee with ID ${req.params.id}` }));
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
