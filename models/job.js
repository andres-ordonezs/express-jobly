"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class Job {

  static async create({ title, salary, equity, companyHandle }) {

    const companyCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [companyHandle]);

    if (companyCheck.rows.length === 0)
      throw new BadRequestError(`Company does not exist: ${companyHandle}`);

    const results = await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
      RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, companyHandle]);



    return results.rows[0];
  }



}


module.exports = Job;