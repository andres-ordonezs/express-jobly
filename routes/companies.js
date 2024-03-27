"use strict";


/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Company = require("../models/company");

const { sqlForFilter } = require("../helpers/sql");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companyFilterSchema = require("../schemas/CompanyFilter.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    companyNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.create(req.body);
  return res.status(201).json({ company });
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 *
 *
 */

router.get("/", async function (req, res, next) {

  const { nameLike, minEmployees, maxEmployees } = req.query;

  const results = jsonschema.validate(
    {
      nameLike: nameLike,
      minEmployees: parseInt(minEmployees) || undefined,
      maxEmployees: parseInt(maxEmployees) || undefined
    },
    companyFilterSchema,
    { required: true });

  console.log("********* maxEmployees: ", req.query);

  let companies;

  if (!results.valid) {
    const errs = results.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }
  if (Object.keys(req.query).length !== 0) {

    const jsToSql = {
      nameLike: "name",
      minEmployees: "num_employees",
      maxEmployees: "num_employees"
    };

    const dataToFilter = {};

    for (const key in req.query) {

      if (key.startsWith("name")) {
        dataToFilter[key] = { data: `%${req.query[key]}%` };
        dataToFilter[key].method = "ILIKE";

      } else if (key.startsWith("min")) {
        dataToFilter[key] = { data: req.query[key] };
        dataToFilter[key].method = ">=";

      } else if (key.startsWith("max")) {
        dataToFilter[key] = { data: req.query[key] };
        dataToFilter[key].method = "<=";
      };

    }

    const result = sqlForFilter(dataToFilter, jsToSql);

    companies = await Company.findFiltered(result);

  } else {
    companies = await Company.findAll();
  }

  return res.json({ companies });
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    companyUpdateSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.update(req.params.handle, req.body);
  return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  await Company.remove(req.params.handle);
  return res.json({ deleted: req.params.handle });
});


module.exports = router;
