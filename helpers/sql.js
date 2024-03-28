"use strict";

const { BadRequestError } = require("../expressError");

/** Turns JavaScript data into data that can be used with a SQL update
 *
 * Takes an object with data to update (dataToUpdate),
 * ex: { firstName, lastName }
 *
 * Takes an object of JS variable names as keys and their corresponding SQL
 * column names as values (jsToSql),
 * ex: { firstName: first_name, lastName: last_name }
 *
 * Returns an object that holds a string (setCols) and an array (values) to be
 * used in the SQL statement
 * ex:
 * {
 *   setCols: '"first_name"=$1, "last_name"=$2',
 *   values: [firstName, lastName]
 * }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


/** Turns JavaScript data into data that can be used with a SQL filter
 *
 * Takes an object with data to update (dataToFilter),
 * ex:
 * {
 *  nameLike: {data: "net", method: "ILIKE"}
 *  minEmployees: {data; 300, method: ">="}
 * }
 *
 * Takes an object of JS variable names as keys and their corresponding SQL
 * column names as values (jsToSql),
 * ex: { nameLike: name, minEmployees: employee_num}
 *
 * Returns an object that holds a string (filterCols) and an array (values) to be
 * used in the SQL statement
 * ex:
 * {
 *   filterCols: 'WHERE name ILIKE $1 AND employee_num >= $2',
 *   values: [net, 300]
 * }
 */
function sqlForFilter(dataToFilter, jsToSql) {
  const keys = Object.keys(dataToFilter);

  //['"name" ILIKE $1', '"num_employees" < $2']
  const cols = keys.map((colName, idx) =>
    `${jsToSql[colName] || colName} ${dataToFilter[colName].method} $${idx + 1}`,
  );

  return {  //TODO: ternary operator for potential empty string
    filterCols: "WHERE " + cols.join(" AND "),
    values: Object.values(dataToFilter).map(obj => obj.data),
  };
}


module.exports = { sqlForPartialUpdate, sqlForFilter };
