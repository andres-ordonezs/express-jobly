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
  const keys = Object.keys(dataToFilter);       //["name", "minEmployees"]
  if (keys.length === 0) throw new BadRequestError("No data");

  //['"name" ILIKE $1', '"num_employees" < $2']
  const cols = keys.map((colName, idx) =>
    `${jsToSql[colName] || colName} ${dataToFilter[colName].method} $${idx + 1}`,
  );

  return {
    filterCols: "WHERE " + cols.join(" AND "),
    values: Object.values(dataToFilter).map(obj => obj.data),
  };
}


/** Creates data to be used in sqlForFilter
 *
 * takes optional query data: {nameLike, minEmployees, maxEmployees}
 *
 * returns an object of dataToFilter and jsToSql for sqlForFilter
 *
 */
// TODO: Include examples on docstring + use equal rather than startsWith
//TODO: Move this method to Company class
// TODO: Use object destructuring for each key: namelike, etc.
// TODO: Include min<max employees validation
function createFilterData(queryData) {
  const jsToSql = {
    nameLike: "name",
    minEmployees: "num_employees",
    maxEmployees: "num_employees"
  };

  const dataToFilter = {};

  for (const key in queryData) {

    if (key.startsWith("name")) {
      dataToFilter[key] = { data: `%${queryData[key]}%` };
      dataToFilter[key].method = "ILIKE";

    } else if (key.startsWith("min")) {
      dataToFilter[key] = { data: queryData[key] };
      dataToFilter[key].method = ">=";

    } else if (key.startsWith("max")) {
      dataToFilter[key] = { data: queryData[key] };
      dataToFilter[key].method = "<=";
    };

  }

  return { dataToFilter, jsToSql };
}

module.exports = { sqlForPartialUpdate, sqlForFilter, createFilterData };
