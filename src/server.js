const { ApolloServer } = require('apollo-server-express')
const { ApolloGateway } = require('@apollo/gateway')
const express = require('express')
const jwt = require('express-jwt')
const jwksRsa = require('jwks-rsa')

const SERVICE_1_ENDPOINT = process.env.SERVICE_1_ENDPOINT
const SERVICE_2_ENDPOINT = process.env.SERVICE_2_ENDPOINT
const SERVICE_3_ENDPOINT = process.env.SERVICE_3_ENDPOINT

const AUTH_DOMAIN = process.env.AUTH_DOMAIN
const AUTH_AUDIENCE = process.env.AUTH_AUDIENCE

const checkJwt = jwt({
    // Dynamically provide a signing key based on the [Key ID](https://tools.ietf.org/html/rfc7515#section-4.1.4) header parameter ("kid") and the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 1000,
        jwksUri: `https://${AUTH_DOMAIN}/.well-known/jwks.json`,
        handleSigningKeyError: (err, cb) => {
            if (err instanceof jwksRsa.SigningKeyNotFoundError) {
                return cb(new Error('JWT verification SigningKeyNotFoundError'));
            }
            return cb(err);
        }
    }),

    // Validate the audience and the issuer.
    audience: AUTH_AUDIENCE,
    issuer: `https://${AUTH_DOMAIN}/`,
    algorithms: ['RS256']
});

const corsOptions = {
    credentials: true,
    origin: [
        "http://localhost:3000"
    ]
};

const gateway = new ApolloGateway({
    serviceList: [
        {name: 'service1', url: SERVICE_1_ENDPOINT},
        {name: 'service2', url: SERVICE_2_ENDPOINT},
        {name: 'service3', url: SERVICE_3_ENDPOINT},
    ]
})

const server = new ApolloServer({
    cors: corsOptions,
    gateway,
    subscriptions: false,
    tracing: true,
})

const app = express();
app.use(checkJwt);
server.applyMiddleware({ app, path: '/' });
const PORT = process.env.PORT || 4000;
app.listen(
    {port: PORT},
    () => {
        console.log( `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
    }
);
