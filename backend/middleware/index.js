const auth = require('./auth');
const authorization = require('./authorization');
const { errorHandler, notFoundHandler, asyncHandler, AppError } = require('./errorHandler');
const rateLimiter = require('./rateLimiter');

module.exports = {
    // Auth middleware
    ...auth,

    // Authorization middleware
    ...authorization,

    // Error handling
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,

    // Rate limiting
    ...rateLimiter
};