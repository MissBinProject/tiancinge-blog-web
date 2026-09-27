import { describe, expect, it } from 'vitest';
import { readAdminRuntimeConfig } from './config';

const valid = { ADMIN_USERNAME: ' Tiancinge ', ADMIN_PASSWORD_HASH: 'hash', ADMIN_CREDENTIAL_VERSION: '2', ADMIN_ALLOWED_ORIGIN: 'https://tiancinge-admin.web.app/' };

describe('admin runtime config', () => {
  it('normalizes a valid server-only configuration', () => {
  expect(readAdminRuntimeConfig(valid)).toEqual({ username: 'tiancinge', passwordHash: 'hash', credentialVersion: '2', allowedOrigin: 'https://tiancinge-admin.web.app', totpSecret: '' });
  });

  it('fails closed when a required value is missing or unsafe', () => {
    expect(readAdminRuntimeConfig({ ...valid, ADMIN_PASSWORD_HASH: '' })).toBeNull();
    expect(readAdminRuntimeConfig({ ...valid, ADMIN_ALLOWED_ORIGIN: 'http://localhost:3000' })).toBeNull();
    expect(readAdminRuntimeConfig({ ...valid, ADMIN_USERNAME: 'a' })).toBeNull();
  });
});
