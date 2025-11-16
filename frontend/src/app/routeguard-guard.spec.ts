import { TestBed } from '@angular/core/testing';
import { CanActivateChildFn } from '@angular/router';

import { routeguardGuard } from './routeguard-guard';

describe('routeguardGuard', () => {
  const executeGuard: CanActivateChildFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => routeguardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
