const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
require('dotenv').config();

const teamDomain = process.env.CLOUDFLARE_TEAM_DOMAIN;
const certsURL = `${teamDomain}/cdn-cgi/access/certs`;

const policyAUD = process.env.CLOUDFLARE_POLICY_AUD;

const jwks = jwksClient({
  jwksUri: certsURL
});

module.exports = (req, res, next) => {
  // skip if not in production
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  const accessJWT = req.headers['cf-access-jwt-assertion'];
  if (!accessJWT) {
    res.status(401).send('No token provided in header');
    return;
  }

  const options = {
    audience: policyAUD,
    issuer: teamDomain
  };

  jwt.verify(
    accessJWT,
    (header, callback) => {
      jwks.getSigningKey(header.kid, (err, key) => {
        if (err) {
          callback(err);
        } else {
          const signingKey = key.publicKey || key.rsaPublicKey;
          callback(null, signingKey);
        }
      });
    },
    options,
    (err, decoded) => {
      if (err) {
        res.status(401).send('Invalid token');
      } else {
        // check if email ends with company domain
        if (!decoded.email.endsWith(`@${process.env.COMPANY_DOMAIN}`)) {
          res.status(403).send('Not authorized');
          return;
        }

        req.user = {
          email: decoded.email,
          identity_nonce: decoded.identity_nonce,
          sub: decoded.sub,
          country: decoded.country
        };
        next();
      }
    }
  );
};
