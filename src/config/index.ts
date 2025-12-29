/**
 * Configuration Management for Marketing Service
 */

import dotenv from 'dotenv';
import { MarketingConfig } from '../types';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export const config: MarketingConfig = {
  database: {
    connectionString: requireEnv('DATABASE_URL'),
  },
  amazon: {
    clientId: optionalEnv('AMAZON_ADS_CLIENT_ID'),
    clientSecret: optionalEnv('AMAZON_ADS_CLIENT_SECRET'),
    refreshToken: optionalEnv('AMAZON_ADS_REFRESH_TOKEN'),
    profileId: optionalEnv('AMAZON_ADS_PROFILE_ID'),
  },
  facebook: {
    appId: optionalEnv('FACEBOOK_APP_ID'),
    appSecret: optionalEnv('FACEBOOK_APP_SECRET'),
    accessToken: optionalEnv('FACEBOOK_ACCESS_TOKEN'),
    adAccountId: optionalEnv('FACEBOOK_AD_ACCOUNT_ID'),
  },
  bookbub: {
    apiKey: optionalEnv('BOOKBUB_API_KEY'),
    publisherId: optionalEnv('BOOKBUB_PUBLISHER_ID'),
  },
  netgalley: {
    apiKey: optionalEnv('NETGALLEY_API_KEY'),
    publisherId: optionalEnv('NETGALLEY_PUBLISHER_ID'),
  },
  mailchimp: {
    apiKey: optionalEnv('MAILCHIMP_API_KEY'),
    serverPrefix: optionalEnv('MAILCHIMP_SERVER_PREFIX'),
    listId: optionalEnv('MAILCHIMP_LIST_ID'),
  },
  nexusCRM: {
    url: optionalEnv('NEXUS_CRM_URL', 'http://localhost:9200'),
    apiKey: optionalEnv('NEXUS_CRM_API_KEY'),
  },
  mageAgent: {
    url: optionalEnv('MAGEAGENT_URL', 'http://localhost:9003'),
    apiKey: optionalEnv('MAGEAGENT_API_KEY'),
  },
};

export const serverConfig = {
  port: parseInt(optionalEnv('PORT', '9105'), 10),
  wsPort: parseInt(optionalEnv('WS_PORT', '9106'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
};

export default config;
