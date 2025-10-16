const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and return user payload
 * @param {string} token - Google credential token from frontend
 * @returns {Promise<Object>} User payload from Google
 */
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        return {
            googleId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            name: payload.name,
            givenName: payload.given_name,
            familyName: payload.family_name,
            picture: payload.picture,
        };
    } catch (error) {
        console.error('Error verifying Google token:', error);
        throw new Error('Invalid Google token');
    }
};

module.exports = {
    verifyGoogleToken,
};
