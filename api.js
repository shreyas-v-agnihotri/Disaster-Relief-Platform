/* Node API for Disaster Relief Platform (CS61 Final Project)
Author: Shreyas Agnihotri, Thanh Nguyen Jr, Ayan Agarwal, Michael Zhou
Dartmouth CS61, Spring 2020

Add config.js file to root directory
To run: `nodemon api.js sunapee`
Then: make calls to http://localhost:3000
App will use the database credentials and port stored in config.js for sunapee server
Insomnia / Postman used to test endpoints
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
  if (req.body.NewAdminPassword) {
    req.body.AdminHashedPassword = bcrypt.hashSync(req.body.NewAdminPassword, saltRounds, (error, hash) => {
      if (error) throw error;
      return (hash);
    });
    delete req.body.NewAdminPassword;
  }
  else if (req.body.NewPledgerPassword) {
    req.body.PledgerHashedPassword = bcrypt.hashSync(req.body.NewPledgerPassword, saltRounds, (error, hash) => {
      if (error) throw error;
      return (hash);
    });
    delete req.body.NewPledgerPassword;
  }
  else if (req.body.NewNonProfitPassword) {
    req.body.NonProfitHashedPassword = bcrypt.hashSync(req.body.NewNonProfitPassword, saltRounds, (error, hash) => {
      if (error) throw error;
      return (hash);
    });
    delete req.body.NewNonProfitPassword;
  }
  return req;
};

// Check for user log-in / if they are the user specified by id in the params
const isPasswordCorrect = (req, password) => bcrypt.compareSync(req.body.AuthPassword, password);
const isUserSearched = (user, req) => user.ID == req.params.id;

// Combine validation functions into one & output response parameters
const validateUser = (e, r, f, res, req) => {
  const user = r[0];
  if (!user) {
    return [400, 'Username not found', null];
  }
  const [hashedPassword, role] = [user.HashedPassword, user.Role];

  if (isPasswordCorrect(req, hashedPassword)) {
    if (isUserSearched(user, req)) return [null, null, {ROLE: role, IS_SEARCHED: true}]
    return [null, null, {ROLE: role, IS_SEARCHED: false}];
  }

  return [400, 'Incorrect password', null];
};

const saltRounds = 10;

const selectAccounts = `(SELECT AdminHashedPassword as HashedPassword, "Admin" as Role, AdminID as ID FROM Dubois_sp20.Admins Where AdminUsername = ?)
                        UNION
                        (SELECT PledgerHashedPassword as HashedPassword, "Pledger" as Role, PledgerID as ID FROM Dubois_sp20.Pledgers Where PledgerUsername = ?)
                        UNION
                        (SELECT NonProfitHashedPassword as HashedPassword, "NonProfit" as Role, NonProfitID as ID FROM Dubois_sp20.NonProfits Where NonProfitUsername = ?);`;

// GET `Funds` - all 'roles' can access - return status code 200 if successful
// If a NonProfitID is specified in the request body, only return the Funds
// accessible to that NonProfit
router.get('/api/funds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // get all funds accessible to the NonProfit specified in the request body
      if (req.body.NonProfitID) {
        return global.connection.query('SELECT F.FundID, F.FundName, F.FundDescription, F.FundAccessible, F.FundBalance FROM Dubois_sp20.Funds F JOIN Dubois_sp20.NonProfitFunds NPF ON NPF.FundID WHERE NPF.NonProfitID = ?', [req.body.NonProfitID],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
      }

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

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can PUT in `Funds`', response: returnResponse }));

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

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can POST in `Funds`', response: returnResponse }));

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

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can DELETE in `Funds`', response: returnResponse }));

      // delete a single fund with ID = req.params.id, return status code 200 if successful, 400 if not
      return global.connection.query('DELETE FROM Dubois_sp20.Funds WHERE FundID = ?', [req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a delete -- remove fund with ID ${req.params.id}` }));
        });
    });
});

// GET `Pledgers` - admins only - return status code 200 if successful
router.get('/api/pledgers', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can GET in `Pledgers`', response: returnResponse }));

      // get all pledgers, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.Pledgers',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// GET `Pledgers` specific ID - admins & the specified pledger can access - return status code 200 if successful
router.get('/api/pledgers/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN && !(returnResponse.IS_SEARCHED && returnResponse.ROLE === Roles.PLEDGER)) return res.send(JSON.stringify({ status: 400, error: 'Only admin user or searched Pledger can GET in `Pledgers`', response: returnResponse }));

      // get the specified pledger, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.Pledgers WHERE PledgerID = ?', [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// PUT `Pledgers` - admins & the specified pledger can access - return status code 200 if successful
router.put('/api/pledgers/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN && !(returnResponse.IS_SEARCHED && returnResponse.ROLE === Roles.PLEDGER)) return res.send(JSON.stringify({ status: 400, error: 'Only admin user or specified Pledger can PUT in `Pledgers`', response: returnResponse }));

      // update a single pledger with ID = req.params.id on only the passed params, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('UPDATE Dubois_sp20.Pledgers SET ? WHERE PledgerID = ?', [request.body, req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a put -- update pledger with ID ${req.params.id}` }));
        });
    });
});

// POST `Pledgers` - admins only - return status code 200 if successful
router.post('/api/pledgers', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can POST in `Pledgers`', response: returnResponse }));

      // create a new fund, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('INSERT INTO Dubois_sp20.Pledgers SET ?', [request.body],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- create a new entry for ${req.body.PledgerUsername}` }));
        });
    });
});

// DELETE `Pledgers` - admins only - return status code 200 if successful
router.delete('/api/pledgers/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can DELETE in `Pledgers`', response: returnResponse }));

      // delete a single pledger with ID = req.params.id, return status code 200 if successful, 400 if not
      return global.connection.query('DELETE FROM Dubois_sp20.Pledgers WHERE PledgerID = ?', [req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a delete -- remove pledger with ID ${req.params.id}` }));
        });
    });
});

// GET `Admins` - admins only - return status code 200 if successful
router.get('/api/admins', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can GET in `Admins`', response: returnResponse }));

      // get all admins, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.Admins',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// GET `Admins` specific ID - admins only - return status code 200 if successful
router.get('/api/admins/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can GET in `Admins`', response: returnResponse }));

      // get all admins, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.Admins WHERE AdminID = ?', [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// PUT `Admins` - admins only - return status code 200 if successful
router.put('/api/admins/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can PUT in `Admins`', response: returnResponse }));

      // update a single admin with ID = req.params.id on only the passed params, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('UPDATE Dubois_sp20.Admins SET ? WHERE AdminID = ?', [request.body, req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a put -- update admin with ID ${req.params.id}` }));
        });
    });
});

// POST `Admins` - admins only - return status code 200 if successful
router.post('/api/admins', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can POST in `Admins`', response: returnResponse }));

      // create a new fund, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('INSERT INTO Dubois_sp20.Admins SET ?', [request.body],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- create a new entry for ${req.body.AdminUsername}` }));
        });
    });
});

// DELETE `Admins` - admins only - return status code 200 if successful
router.delete('/api/admins/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can DELETE in `Admins`', response: returnResponse }));

      // delete a single pledger with ID = req.params.id, return status code 200 if successful, 400 if not
      return global.connection.query('DELETE FROM Dubois_sp20.Admins WHERE AdminID = ?', [req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a delete -- remove admin with ID ${req.params.id}` }));
        });
    });
});

// GET `NonProfits` - admins only - return status code 200 if successful
router.get('/api/nonprofits', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can GET in `NonProfits`', response: returnResponse }));

      // get all NonProfits, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.NonProfits',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// GET `NonProfits` specific ID - admins & the specified NonProfit can access - return status code 200 if successful
router.get('/api/nonprofits/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN && !(returnResponse.IS_SEARCHED && returnResponse.ROLE === Roles.NON_PROFIT)) return res.send(JSON.stringify({ status: 400, error: 'Only admin user or searched NonProfit can GET in `NonProfits`', response: returnResponse }));

      // get the specified NonProfit, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.NonProfits WHERE NonProfitID = ?', [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// PUT `NonProfits` - admins & the specified NonProfit can access - return status code 200 if successful
router.put('/api/nonprofits/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN && !(returnResponse.IS_SEARCHED && returnResponse.ROLE === Roles.NON_PROFIT)) return res.send(JSON.stringify({ status: 400, error: 'Only admin user or specified NonProfit can PUT in `NonProfits`', response: returnResponse }));

      // update a single pledger with ID = req.params.id on only the passed params, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('UPDATE Dubois_sp20.NonProfits SET ? WHERE NonProfitID = ?', [request.body, req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a put -- update NonProfit with ID ${req.params.id}` }));
        });
    });
});

// POST `NonProfits` - admins only - return status code 200 if successful
router.post('/api/nonprofits', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can POST in `NonProfits`', response: returnResponse }));

      // create a new NonProfit, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('INSERT INTO Dubois_sp20.NonProfits SET ?', [request.body],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- create a new entry for ${req.body.NonProfitName}` }));
        });
    });
});

// DELETE `NonProfits` - admins only - return status code 200 if successful
router.delete('/api/nonprofits/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can DELETE in `NonProfits`', response: returnResponse }));

      // delete a single NonProfit with ID = req.params.id, return status code 200 if successful, 400 if not
      return global.connection.query('DELETE FROM Dubois_sp20.NonProfits WHERE NonProfitID = ?', [req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a delete -- remove NonProfit with ID ${req.params.id}` }));
        });
    });
});

// GET `NonProfitFunds` - admins only - return status code 200 if successful
router.get('/api/nonprofitfunds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can GET in `NonProfitFunds`', response: returnResponse }));

      // get all NonProfitFunds, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.NonProfitFunds',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// GET `NonProfitFunds` specific NonProfitID - admins & the specified NonProfit can access - return status code 200 if successful
router.get('/api/nonprofitfunds/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN && !(returnResponse.IS_SEARCHED && returnResponse.ROLE === Roles.NON_PROFIT)) return res.send(JSON.stringify({ status: 400, error: 'Only admin user or searched NonProfit can GET in `NonProfitFunds`', response: returnResponse }));

      // get the specified NonProfitFund, return status code 200
      return global.connection.query('SELECT * FROM Dubois_sp20.NonProfitFunds WHERE NonProfitID = ?', [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

// POST `NonProfitFunds` - admins only - return status code 200 if successful
router.post('/api/nonprofitfunds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can POST in `NonProfitFunds`', response: returnResponse }));

      // create a new NonProfitFund entry, return status code 200 if successful, 400 if not
      const request = clean(req);
      return global.connection.query('INSERT INTO Dubois_sp20.NonProfitFunds SET ?', [request.body],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- create a new entry for NonProfitID = ${req.body.NonProfitID}, FundID = ${req.body.FundID}` }));
        });
    });
});

// DELETE `NonProfitFunds` - admins only - return status code 200 if successful
router.delete('/api/nonprofitfunds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only admin user can DELETE in `NonProfitFunds`', response: returnResponse }));

      // delete a single NonProfit with ID = req.params.id, return status code 200 if successful, 400 if not
      return global.connection.query('DELETE FROM Dubois_sp20.NonProfitFunds WHERE NonProfitID = ? AND FundID = ?', [req.body.NonProfitID, req.body.FundID],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a delete -- remove row from NonProfitFunds where NonProfitID = ${req.body.NonProfitID}, FundID = ${req.body.FundID}` }));
        });
    });
});

// GET `Role` - anyone - authenticates user and returns the role - return status code 200 if successful
router.get('/api/role', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      return res.send(JSON.stringify({ status: 200, error: null, response: returnResponse.ROLE }));
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
