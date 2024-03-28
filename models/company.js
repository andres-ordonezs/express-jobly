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

    if (query.minEmployees > query.maxEmployees) {
      throw new BadRequestError("minEmployees must be less than maxEmployees");
    }

    const filter = Company.createWhereClause(query);

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


  /** Turns JavaScript data into data that can be used with a SQL filter
   *
   * Takes an object with filtered data,
   * ex:
   * {
   *  nameLike: "net"
   *  minEmployees: 300
   * }
   *
   *
   * Returns an object that holds a string (filterCols) and an array (values) to be
   * used in the SQL statement
   * ex:
   * {
   *   filterCols: 'WHERE name ILIKE $1 AND employee_num >= $2',
   *   values: [net, 300]
   * }
   */
  static createWhereClause({ nameLike, minEmployees, maxEmployees }) {

    const whereClause = [];
    const values = [];

    if (nameLike) {
      values.push(`%${nameLike}%`);
      whereClause.push(`name ILIKE $${values.length}`);
    }

    if (minEmployees) {
      values.push(minEmployees);
      whereClause.push(`num_employees >= $${values.length}`);
    }

    if (maxEmployees) {
      values.push(maxEmployees);
      whereClause.push(`num_employees <= $${values.length}`);
    };

    return {
      filterCols: (values.length > 0) ?
        "WHERE " + whereClause.join(" AND ") : "",
      values: values
    };
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
