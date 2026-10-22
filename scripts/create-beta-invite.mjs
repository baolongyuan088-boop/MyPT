import { randomBytes, createHash } from 'node:crypto';
// Run privately on the deployment host. Never commit or paste these values into issues.
const code = randomBytes(24).toString('base64url');
console.log('Invitation for one tester:', code);
console.log('MYPT_BETA_INVITE_HASHES=' + createHash('sha256').update(code).digest('hex'));
console.log('MYPT_BETA_EXPIRES_AT=' + new Date(Date.now() + 7 * 86400000).toISOString());
