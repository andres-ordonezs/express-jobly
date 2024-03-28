"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilter } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies with optional filters:
   * {nameLike, minEmployees, maxEmployees}.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(query = {}) {
    const {dataToFilter, jsToSql} = Company.createFilterData(query);

    let filter = {filterCols:"", values:[]};

    if(Object.keys(dataToFilter).length !== 0) {
      filter = sqlForFilter(dataToFilter, jsToSql);
    }

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${filter.filterCols}
        ORDER BY name`,
        filter.values);
    return companiesRes.rows;
  }


  /** Creates data to be used in sqlForFilter
 *
 * takes optional query data: {nameLike, minEmployees, maxEmployees}
 *
 * returns an object of dataToFilter and jsToSql for sqlForFilter
 * ex:
 * {
 *  dataToFilter: {
 *    nameLike: {data: "net", method: "ILIKE"},
 *    minEmployees: {data; 300, method: ">="},
 *    maxEmployeed: {data: 700, method: "<="}
 *  },
 *  jsToSql: {
 *    nameLike: "name",
 *    minEmployees: "num_employees",
 *    maxEmployees: "num_employees"
 *  }
 * }
 *
 */
  static createFilterData(queryData) {
    const jsToSql = {
      nameLike: "name",
      minEmployees: "num_employees",
      maxEmployees: "num_employees"
    };

    const dataToFilter = {};

    const { nameLike, minEmployees, maxEmployees } = queryData;

    if (minEmployees > maxEmployees) {  //TODO: move into findAll
      throw new BadRequestError("minEmployees must be less than maxEmployees");
    }

    if (nameLike) {
      dataToFilter.nameLike = { data: `%${nameLike}%` };
      dataToFilter.nameLike.method = "ILIKE";
    }

    if (minEmployees) {
      dataToFilter.minEmployees = { data: minEmployees };
      dataToFilter.minEmployees.method = ">=";
    }

    if (maxEmployees) {
      dataToFilter.maxEmployees = { data: maxEmployees };
      dataToFilter.maxEmployees.method = "<=";
    };


    return { dataToFilter, jsToSql };
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
