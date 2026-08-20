import { describe, expect, it } from 'vitest';
import { expandLoginPasswords } from '@/lib/auth/password-aliases';

describe('expandLoginPasswords', () => {
  it('lets @CD and @CreativeDirector both attempt the canonical password', () => {
    expect(expandLoginPasswords('@CD')).toEqual(['@CD', '@CreativeDirector']);
    expect(expandLoginPasswords('@cd')).toEqual(['@cd', '@CreativeDirector']);
    expect(expandLoginPasswords('@CreativeDirector')).toEqual(['@CreativeDirector']);
  });

  it('does not rewrite unrelated passwords', () => {
    expect(expandLoginPasswords('668104')).toEqual(['668104']);
  });
});
