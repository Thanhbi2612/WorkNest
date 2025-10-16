const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // Password must be at least 8 characters long and contain at least one uppercase, one lowercase, and one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const validateUsername = (username) => {
    // Username must be 3-30 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
};

const validateName = (name) => {
    // Name must be 1-50 characters, letters and spaces only
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{1,50}$/;
    return nameRegex.test(name);
};

const validateUserRegistration = (userData) => {
    const errors = [];
    const { username, email, password, first_name, last_name } = userData;

    // Required fields
    if (!username) errors.push('Username is required');
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (!first_name) errors.push('First name is required');
    if (!last_name) errors.push('Last name is required');

    // Validation
    if (username && !validateUsername(username)) {
        errors.push('Username must be 3-30 characters, alphanumeric and underscores only');
    }

    if (email && !validateEmail(email)) {
        errors.push('Invalid email format');
    }

    if (password && !validatePassword(password)) {
        errors.push('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (first_name && !validateName(first_name)) {
        errors.push('First name must be 1-50 characters, letters and spaces only');
    }

    if (last_name && !validateName(last_name)) {
        errors.push('Last name must be 1-50 characters, letters and spaces only');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateAdminRegistration = (adminData) => {
    const errors = [];
    const { username, email, password } = adminData;

    // Required fields
    if (!username) errors.push('Username is required');
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');

    // Validation
    if (username && !validateUsername(username)) {
        errors.push('Username must be 3-30 characters, alphanumeric and underscores only');
    }

    if (email && !validateEmail(email)) {
        errors.push('Invalid email format');
    }

    if (password && !validatePassword(password)) {
        errors.push('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateLogin = (loginData) => {
    const errors = [];
    const { identifier, password } = loginData;

    if (!identifier) errors.push('Username or email is required');
    if (!password) errors.push('Password is required');

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    validateName,
    validateUserRegistration,
    validateAdminRegistration,
    validateLogin
};