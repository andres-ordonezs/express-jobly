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
  jobs
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

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

/************************************** findAll() */

describe("Get list of jobs", function () {
  test("works", async function () {
    const result = await Job.findAll();
    expect(result).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1000,
        equity: "0.5",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2000,
        equity: "0.5",
        company_handle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3000,
        equity: "0.2",
        company_handle: "c3",
      },
    ]);
  });
});

/************************************** get job */

describe("Gets a given job", function () {
  console.log("****************jobs: ", jobs);
  test("works", async function () {
    //  TODO: check how to get id
    const result = await Job.get(id);
    expect(result).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 1000,
      equity: "0.5",
      company_handle: "c1"
    });
  });

  test("wrong - job is not found", async function () {
    try {
      await Job.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});