const config = {
  sunapee: {
    database: {
      host: 'sunapee.cs.dartmouth.edu',
      user: 'Dubois_sp20', // 'your sunapee username here'
      password: '&Q$ke2Pk-h', // 'your sunapee password here'
      schema: 'Dubois_sp20', // 'your sunapee default schema'
    },
    port: 3000,
  },
  local: {
    database: {
      host: 'localhost',
      user: 'cs61', // 'your localhost username here'
      password: 'password', // your localhost password here'
      schema: 'nyc_inspections', // 'your localhost default schema here'
    },
    port: 3000,
  },
};
module.exports = config;
