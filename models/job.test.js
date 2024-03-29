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

console.log("Jobs: ", jobs);

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
  test("works", async function () {
    const result = await Job.get(jobs[0].id);
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
      await Job.get(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update job */

describe("Update a given job", function () {
  test("works", async function () {
    const result = await Job.update(jobs[0].id, {
      title: "Test",
      salary: 500,
      equity: 0.25
    });

    expect(result).toEqual({
      id: expect.any(Number),
      title: "Test",
      salary: 500,
      equity: "0.25",
      company_handle: "c1"
    });
  });

  test("wrong - job is not found", async function () {
    try {
      await Job.update(0, {
        title: "Test",
        salary: 500,
        equity: 0.25
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("Removes a given job", function () {
  test("works", async function () {
    const deleteRes = await Job.remove(jobs[0].id);
    const selectRes = await db.query(
      `SELECT id FROM jobs WHERE id='${jobs[0].id}'`);

    expect(deleteRes).toEqual(jobs[0]);
    expect(selectRes.rows.length).toEqual(0);
  });

  test("wrong - job is not found", async function () {
    try {
      await Job.remove(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
});