import { appropriateFreePeriods } from './../src/bg/library.js';

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
