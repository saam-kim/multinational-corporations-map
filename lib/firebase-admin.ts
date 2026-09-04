import 'server-only';
import { Firestore } from '@google-cloud/firestore';
import { ExternalAccountClient } from 'google-auth-library';
import { getVercelOidcToken } from '@vercel/oidc';

let database: Firestore | undefined;
export function classroomDb() {
  if (database) return database;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase project is not configured');
  const audience = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER;
  const serviceAccount = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  if (!audience || !serviceAccount) {
    // Local development may use explicitly configured Google ADC or the emulator.
    if (process.env.VERCEL) throw new Error('Vercel Firebase identity is not configured');
    database = new Firestore({projectId, preferRest: true});
    return database;
  }
  const authClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience: '//iam.googleapis.com/' + audience,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/' + serviceAccount + ':generateAccessToken',
    subject_token_supplier: {getSubjectToken: () => getVercelOidcToken()},
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });
  if (!authClient) throw new Error('Unable to initialize workload identity');
  database = new Firestore({projectId, authClient, preferRest: true});
  return database;
}
