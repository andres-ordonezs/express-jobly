"use strict";

const { BadRequestError } = require('../expressError');
const { sqlForPartialUpdate, sqlForFilter, createFilterData } = require('./sql');

describe("Test sqlForPartialUpdate", function () {
  test("Function works given correct data", function () {
    const dataToUpdate = {
      firstName: "Test",
      lastName: "Tester"
    };
    const jsToSql = {
      firstName: "first_name",
      lastName: "last_name"
    };

    const results = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(results).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2',
      values: ["Test", "Tester"]
    });
  });

  test("Function doesn't change one word variables", function () {
    const dataToUpdate = {
      age: 45
    };
    const jsToSql = {};

    const results = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(results).toEqual({
      setCols: '"age"=$1',
      values: [45]
    });
  });

  test("Function throws bad request error if not given data", function () {
    const dataToUpdate = {};
    const jsToSql = {};

    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrow(BadRequestError);
  });
});


// describe("Test sqlForFilter", function () {
//   test("Function works given proper data", function () {
//     const dataToFilter = {
//       nameLike: {
//         data: "net",
//         method: "ILIKE"
//       },
//       minEmployees: {
//         data: 30,
//         method: "<="
//       }
//     };
//     const jsToSql = {
//       nameLike: "name",
//       minEmployees: "num_employees",
//       maxEmployees: "num_employees"
//     };

//     const results = sqlForFilter(dataToFilter, jsToSql);

//     expect(results).toEqual({
//       filterCols: 'WHERE name ILIKE $1 AND num_employees <= $2',
//       values: ["net", 30]
//     });
//   });

// test("Function does not include AND with one piece of data", function () {
//   const dataToFilter = {
//     name: {
//       data: "and",
//       method: "ILIKE"
//     }
//   };
//   const jsToSql = {
//     nameLike: "name",
//     minEmployees: "num_employees",
//     maxEmployees: "num_employees"
//   };

//   const results = sqlForFilter(dataToFilter, jsToSql);

//   expect(results).toEqual({
//     filterCols: 'WHERE name ILIKE $1',
//     values: ["and"]
//   });
// });

// test("function throws bad request error if not given data", function () {
//   expect(() => {
//     sqlForPartialUpdate({}, {});
//   }).toThrow(BadRequestError);
// });
// });
