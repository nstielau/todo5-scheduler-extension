/**
 * Copyright (c) 2024 Nick Stielau
 * Licensed under the MIT License
 */

global.chrome = {
  i18n: {
    getMessage: jest.fn().mockReturnValue("Created by todo5-scheduler"),
  },
};

import { appropriateFreePeriods,
         determineFreePeriods,
         stubTaskEvent,
         findAlreadyScheduledTaskIds,
         actOnSchedulableTasks,
         ID_PREFIX, SUMMARY_PREFIX } from './../src/bg/library.js';

describe('appropriateFreePeriods function', function () {
  it('Return false for short periods', function () {
    const result =  appropriateFreePeriods({
      start: new Date(),
      end: new Date() + 5*60*1000
    });
    expect(result).toBe(false);
  });

  it('Return false for weekends', function () {
    const result =  appropriateFreePeriods({
      start: new Date('11/21/2023'),
      end: new Date('11/21/2023')
    });
    expect(result).toBe(false);
  });

  it('Return false for early preiods', function () {
    const result =  appropriateFreePeriods({
      start: new Date('11/21/2023 06:00:00'),
      end: new Date('11/21/2023 06:30:00')
    });
    expect(result).toBe(false);
  });

  it('Return false for late preiods', function () {
    const result =  appropriateFreePeriods({
      start: new Date('11/21/2023 23:00:00'),
      end: new Date('11/21/2023 23:30:00')
    });
    expect(result).toBe(false);
  });
});

describe('determineFreePeriods function', function () {
  it('Return a valid free period', function () {
    const result = determineFreePeriods([{
        start: {dateTime: '2023-10-20T09:00:00Z'},
        end: {dateTime: '2023-10-20T10:00:00Z'},
      },{
        start: {dateTime: '2023-10-20T11:00:00Z'},
        end: {dateTime: '2023-10-20T12:00:00Z'},
      },
    ]);
    expect(result[0]).toStrictEqual({
      "end": "2023-10-20T11:00:00.000Z",
      "start": "2023-10-20T10:00:00.000Z",
     });
  });
});

describe('stubTaskEvent function', function () {
  it('Return an object with ✅ in summary', function () {
    const result = stubTaskEvent(new Date(), 30, {});
    expect(result.summary).toContain(SUMMARY_PREFIX);
  });

  it('Return an object with id=XYZ in description', function () {
    const result = stubTaskEvent(new Date(), 30, {id:"1234"});
    expect(result.description).toContain('id=1234');
  });

  it('Set the summary to task content', function () {
    const result = stubTaskEvent(new Date(), 30, {content:"A task to do"});
    expect(result.summary).toContain("A task to do");
  });

  it('Set the description to task description', function () {
    const result = stubTaskEvent(new Date(), 30, {description:"description"});
    expect(result.description).toContain("description");
  });

  it('Set private to true', function () {
    const result = stubTaskEvent(new Date(), 30, {id:"1234"});
    expect(result.visibility).toEqual('private');
  });
});


describe('findAlreadyScheduledTaskIds function', function () {
  it('Find id for event with ID_PREFIX', function () {
    const result = findAlreadyScheduledTaskIds([
      {description: `${ID_PREFIX}1234`}
    ]);
    expect(result).toStrictEqual(["1234"]);
  });
});


describe('actOnSchedulableTasks function', function () {
  it('Calls 0 funcs without tasks', function () {
    // actOnSchedulableTasks(events, tasks, func)
    var calls = [];
    const result = actOnSchedulableTasks([], [], function(period, task) {
      calls.push([period, task])
    });
    expect(calls).toStrictEqual([]);
  });

  it('Calls 0 funcs if already scheduled', function () {
    // actOnSchedulableTasks(events, tasks, func)
    var calls = [];
    const result = actOnSchedulableTasks([{
      "description": `${ID_PREFIX}12345`,
      start: {dateTime: '2023-10-23T09:00:00'},
      end: {dateTime: '2023-10-23T10:00:00'},
    }], [{
      "id": "12345",
    }], function(period, task) {
      calls.push([period, task]);
    });
    expect(calls).toStrictEqual([]);
  });

  it('Calls func once', function () {
    // actOnSchedulableTasks(events, tasks, func)
    var calls = [];
    const result = actOnSchedulableTasks([{
      "description": `${ID_PREFIX}123456`,
      start: {dateTime: '2023-10-23T09:00:00'},
      end: {dateTime: '2023-10-23T10:00:00'},
    }], [{
      "id": "654321",
    }], function(period, task) {
      calls.push([period, task]);
    });
    expect(calls).toHaveLength(1);
  });
});


