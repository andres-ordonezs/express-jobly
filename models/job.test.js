"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Create job", function () {
  test("works", async function () {
    const results = await Job.create({
      title: "manager",
      salary: 100000,
      equity: 0.8,
      companyHandle: "c1"
    });

    expect(results).toEqual({
      id: expect.any(Number),
      title: "manager",
      salary: 100000,
      equity: "0.8",
      company_handle: "c1"
    });
  });

  test("non-existent company handle", async function () {
    try {
      await Job.create({
        title: "manager",
        salary: 100000,
        equity: 0.8,
        companyHandle: "doesnt_exist"
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});