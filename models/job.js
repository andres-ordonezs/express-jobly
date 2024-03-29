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
  /** Creates a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company doesn't exist.
   * */
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

  /** Find all jobs with optional filters:
    * {}.
    *
    * Returns [{ id, title, salary, equity, company_handle }, ...]
    * */
  static async findAll() {
    const jobs = await db.query(`
      SELECT
          id,
          title,
          salary,
          equity,
          company_handle
      FROM jobs
      ORDER BY title`);
    return (jobs.rows);
  }

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const job = await db.query(`
      SELECT
          id,
          title,
          salary,
          equity,
          company_handle
      FROM jobs
      WHERE id = $1`,
      [id]);

    if (job.rows.length === 0) {
      throw new NotFoundError(`No job: ${id}`);
    }


    return job.rows[0];

  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {}
    );

    const idIndex = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idIndex}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) {
      throw new NotFoundError(`No job: ${id}`);
    }

    return job;
  }

  /** Delete given company from database; returns undefined.
  *
  * Throws NotFoundError if company not found.
  **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No id: ${id}`);

    return job;
  }



//Test


}






module.exports = Job;