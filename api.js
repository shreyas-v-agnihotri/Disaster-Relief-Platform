/* Node API for Disaster Relief Platform (CS61 Final Project)
Author: Shreyas Agnihotri, Thanh Nguyen Jr, Ayan Agarwal, Michael Zhou
Dartmouth CS61, Spring 2020

Add config.js file to root directory
To run: `nodemon api.js sunapee`
Then: make calls to http://localhost:3000
App will use the database credentials and port stored in config.js for sunapee server
Insomnia / Postman used to test endpoints
*/

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable eqeqeq */

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

// Returns request with auth credentials removed and password hashed (if included)
const saltRounds = 10;
const clean = (req) => {
  delete req.body.AuthUsername;
  delete req.body.AuthPassword;
  if (req.body.NewAdminPassword) {
    req.body.AdminHashedPassword = bcrypt.hashSync(req.body.NewAdminPassword, saltRounds, (error, hash) => {
      if (error) throw error;
      return (hash);
    });
    delete req.body.NewAdminPassword;
  } else if (req.body.NewPledgerPassword) {
    req.body.PledgerHashedPassword = bcrypt.hashSync(req.body.NewPledgerPassword, saltRounds, (error, hash) => {
      if (error) throw error;
      return (hash);
    });
    delete req.body.NewPledgerPassword;
  } else if (req.body.NewNonProfitPassword) {
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

// Combine user authentication functions into one & output response parameters
const validateUser = (e, r, f, res, req) => {
  const user = r[0];

  // Ensure user is found
  if (!user) {
    return [400, 'Username not found', null];
  }
  const [hashedPassword, role, ID] = [user.HashedPassword, user.Role, user.ID];

  // Ensure password is correct
  if (!isPasswordCorrect(req, hashedPassword)) {
    return [400, 'Incorrect password', null];
  }

  // Return role, ID, and whether user is searched
  return [null, null, { ROLE: role, IS_SEARCHED: isUserSearched(user, req), ID }];
};

const selectAccounts = `(SELECT AdminHashedPassword as HashedPassword, "Admin" as Role, AdminID as ID FROM Dubois_sp20.Admins Where AdminUsername = ?)
                        UNION
                        (SELECT PledgerHashedPassword as HashedPassword, "Pledger" as Role, PledgerID as ID FROM Dubois_sp20.Pledgers Where PledgerUsername = ?)
                        UNION
                        (SELECT NonProfitHashedPassword as HashedPassword, "NonProfit" as Role, NonProfitID as ID FROM Dubois_sp20.NonProfits Where NonProfitUsername = ?);`;

/*
    GET Role
    Access: Admin, NonProfit, Pledger
    Return: user's role and ID
*/
router.get('/api/role', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      return res.send(JSON.stringify({ status: 200, error: null, response: { role: returnResponse.ROLE, ID: returnResponse.ID } }));
    });
});

/*
    GET Funds
    Access: Admin, NonProfit, Pledger
    Return: list of funds
*/
router.get('/api/funds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Get all funds
      return global.connection.query('SELECT * FROM Dubois_sp20.Funds',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    PUT Funds
    Access: Admin
    Return: confirmation with fund ID
*/
router.put('/api/funds/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Admin
      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only Admin can PUT in `Funds`', response: returnResponse }));

      // Update a single fund with ID = req.params.id on only the passed params
      const request = clean(req);
      return global.connection.query('UPDATE Dubois_sp20.Funds SET ? WHERE FundID = ?', [request.body, req.params.id],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a put -- update fund with ID ${req.params.id}` }));
        });
    });
});

/*
    GET Pledgers
    Access: Admin
    Return: list of pledgers
*/
router.get('/api/pledgers', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Admin
      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only Admin can GET in `Pledgers`', response: returnResponse }));

      // Get all pledgers
      return global.connection.query('SELECT * FROM Dubois_sp20.Pledgers',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    GET Admins
    Access: Admin
    Return: list of admins
*/
router.get('/api/admins', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Admin
      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only Admin can GET in `Admins`', response: returnResponse }));

      // Get all admins
      return global.connection.query('SELECT * FROM Dubois_sp20.Admins',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    GET NonProfits
    Access: Admin
    Return: list of non-profits
*/
router.get('/api/nonprofits', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Admin
      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only Admin can GET in `NonProfits`', response: returnResponse }));

      // Get all NonProfits
      return global.connection.query('SELECT * FROM Dubois_sp20.NonProfits',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    GET NonProfitFunds
    Access: NonProfit
    Return: list of accessible funds for specific nonprofit
*/
router.get('/api/nonprofitfunds', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to NonProfit
      if (returnResponse.ROLE !== Roles.NON_PROFIT) return res.send(JSON.stringify({ status: 400, error: 'Only NonProfit can GET in `NonProfitFunds`', response: returnResponse }));

      // Prepare query
      const nonProfitID = returnResponse.ID;
      const query = `SELECT F.FundID, F.FundName, F.FundDescription, F.FundAccessible, F.FundBalance 
                    FROM Dubois_sp20.Funds F JOIN Dubois_sp20.NonProfitFunds NPF USING(FundID) 
                    WHERE NPF.NonProfitID = ? AND F.FundAccessible IS TRUE;`;

      // Get the Funds that correspond to the caller's NonProfitID
      return global.connection.query(query, [nonProfitID],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    GET Pledges
    Access: Admin
    Return: list of pledges
*/
router.get('/api/pledges', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Admin
      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only Admin can GET in `Pledges`', response: returnResponse }));

      // Get all Pledges
      return global.connection.query('SELECT * FROM Dubois_sp20.Pledges',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    GET Pledges
    Access: Pledger
    Return: list of pledger's pledges
*/
router.get('/api/pledges/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Pledger searching for self
      if ((returnResponse.ROLE !== Roles.PLEDGER) || !returnResponse.IS_SEARCHED) return res.send(JSON.stringify({ status: 400, error: 'Only Pledger can GET its own `Pledges`', response: returnResponse }));

      const query = `SELECT PledgeDateTime, PledgeAmount, FundName
                    FROM Pledges P JOIN Funds F USING(FundID)
                    WHERE PledgerID = ?`;

      // Get pledger's Pledges
      return global.connection.query(query, [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    POST Pledges
    Access: Pledger
    Return: confirmation with fund ID
*/
router.post('/api/pledges', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Pledger
      if (returnResponse.ROLE !== Roles.PLEDGER) return res.send(JSON.stringify({ status: 400, error: 'Only Pledger can POST in `Pledges`', response: returnResponse }));

      // Prepare data
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = {
        PledgeAmount: req.body.PledgeAmount,
        PledgeDateTime: currentTime,
        FundID: req.body.FundID,
        PledgerID: returnResponse.ID,
      };

      // Create a new Pledges entry
      return global.connection.query('INSERT INTO Dubois_sp20.Pledges SET ?', [payload],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- created a new pledge for FundID = ${req.body.FundID}` }));
        });
    });
});

/*
    GET Withdrawals
    Access: Admin
    Return: list of withdrawals
*/
router.get('/api/withdrawals', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to Admin
      if (returnResponse.ROLE !== Roles.ADMIN) return res.send(JSON.stringify({ status: 400, error: 'Only Admin can GET in `Withdrawals`', response: returnResponse }));

      // Get all Withdrawals
      return global.connection.query('SELECT * FROM Dubois_sp20.Withdrawals',
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    GET Withdrawals
    Access: NonProfit
    Return: list of nonprofit's withdrawals
*/
router.get('/api/withdrawals/:id', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to NonProfit searching for self
      if ((returnResponse.ROLE !== Roles.NON_PROFIT) || !returnResponse.IS_SEARCHED) return res.send(JSON.stringify({ status: 400, error: 'Only NonProfit can GET its own `Withdrawals`', response: returnResponse }));

      const query = `SELECT WithdrawalDateTime, WithdrawalAmount, FundName
                    FROM Withdrawals P JOIN Funds F USING(FundID)
                    WHERE NonProfitID = ?`;

      // Get nonprofit's Withdrawals
      return global.connection.query(query, [req.params.id],
        (error, results) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: results }));
        });
    });
});

/*
    POST Withdrawals
    Access: NonProfit
    Return: confirmation with fund ID
*/
router.post('/api/withdrawals', (req, res) => {
  global.connection.query(selectAccounts, [req.body.AuthUsername, req.body.AuthUsername, req.body.AuthUsername],
    (e, r, f) => {
      const [returnStatus, returnError, returnResponse] = validateUser(e, r, f, res, req);
      if (returnStatus) return res.send(JSON.stringify({ status: returnStatus, error: returnError, response: returnResponse }));

      // Restrict access to NonProfit
      if (returnResponse.ROLE !== Roles.NON_PROFIT) return res.send(JSON.stringify({ status: 400, error: 'Only NonProfit can POST in `Withdrawals`', response: returnResponse }));

      // Prepare data
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = {
        WithdrawalAmount: req.body.WithdrawalAmount,
        WithdrawalDateTime: currentTime,
        FundID: req.body.FundID,
        NonProfitID: returnResponse.ID,
      };

      // Create a new Withdrawals entry
      return global.connection.query('INSERT INTO Dubois_sp20.Withdrawals SET ?', [payload],
        (error) => {
          if (error) return res.send(JSON.stringify({ status: 400, error, response: null }));
          return res.send(JSON.stringify({ status: 200, error: null, response: `here on a post -- created a new withdrawal from FundID = ${req.body.FundID}` }));
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
