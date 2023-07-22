const { Pool } = require("pg");
const pool = new Pool({
  user: "labber",
  password: "labber",
  host: "localhost",
  database: "lightbnb",
});
const query = function (text, params, callback) {
  return pool.query(text, params, callback)
}

module.exports = {query}