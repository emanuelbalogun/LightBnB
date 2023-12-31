//const { db } = require("./access");
const db = require("./access.js");
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return db
    .query(`SELECT * FROM users WHERE email = $1;`, [email])
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return db
    .query(`SELECT * FROM users WHERE id = $1;`, [id])
    .then((result) => {
      return Promise.resolve(result.rows);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return db
    .query(
      `INSERT INTO users(name,email, password) Values($1,$2,$3) RETURNING *;`,
      [user.name, user.email, user.password]
    )
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return db
    .query(
      `SELECT reservations.*, title, cost_per_night, avg(rating) as average_rating
    FROM reservations 
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews On property_reviews.property_id = reservations.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id 
    ORDER BY start_date DESC
    LIMIT $2;`,
      [guest_id, limit]
    )
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id`;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += queryString.includes("WHERE")
      ? ` AND owner_id = $${queryParams.length}`
      : ` WHERE owner_id = $${queryParams.length}`;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += queryString.includes("WHERE")
      ? ` AND (cost_per_night/100) between $${queryParams.length}`
      : ` WHERE (cost_per_night between/100) $${queryParams.length}`;

    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += ` AND  $${queryParams.length}`;
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += queryString.includes("WHERE")
      ? ` AND rating >= $${queryParams.length}`
      : ` WHERE rating >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}`;

  return db
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const options = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night * 100,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
  ];

  const queryString = `INSERT INTO properties(owner_id,title, description,
    thumbnail_photo_url,cover_photo_url,cost_per_night,street,city,
    province,post_code,country,parking_spaces,number_of_bathrooms,number_of_bedrooms) 
  values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *;`;

  return db
    .query(queryString, options)
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
