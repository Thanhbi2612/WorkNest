import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
    const { register, isLoading, error } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        // Username validation
        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username phải chứa ít nhất 3 kí tự';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username = 'Username chỉ được chứa chữ,số và gạch dưới';
        }

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Hãy nhập email hợp lệ';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password phải chứa ít nhất 8 kí tự';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(formData.password)) {
            errors.password = 'Password phải chứa ít nhất 1 kí tự viết hoa,1 kí tự viết thường và 1 số';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords không khớp';
        }

        // First name validation
        if (!formData.first_name.trim()) {
            errors.first_name = 'First name is required';
        } else if (!/^[a-zA-ZÀ-ỹ\s]{1,50}$/.test(formData.first_name)) {
            errors.first_name = 'First name can only contain letters and spaces (max 50 characters)';
        }

        // Last name validation
        if (!formData.last_name.trim()) {
            errors.last_name = 'Last name is required';
        } else if (!/^[a-zA-ZÀ-ỹ\s]{1,50}$/.test(formData.last_name)) {
            errors.last_name = 'Last name can only contain letters and spaces (max 50 characters)';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const { confirmPassword, ...registrationData } = formData;
        const result = await register(registrationData);

        if (result.success) {
            if (onSuccess) {
                onSuccess(result.user);
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className="form-title">Tạo tài khoản</h2>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error">
                        <div className="alert-title">Đăng ký thất bại</div>
                        <div>{error}</div>
                    </div>
                )}

                {/* Name Fields Row */}
                <div className="form-row">
                    {/* First Name */}
                    <div className="form-group">
                        <label htmlFor="first_name" className="form-label">
                            First Name
                        </label>
                        <div className="input-group">
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                autoComplete="given-name"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                className={`form-input ${validationErrors.first_name ? 'error' : ''}`}
                                placeholder="First name"
                            />
                        </div>
                        {validationErrors.first_name && (
                            <div className="error-message">{validationErrors.first_name}</div>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="form-group">
                        <label htmlFor="last_name" className="form-label">
                            Last Name
                        </label>
                        <div className="input-group">
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                autoComplete="family-name"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                className={`form-input ${validationErrors.last_name ? 'error' : ''}`}
                                placeholder="Last name"
                            />
                        </div>
                        {validationErrors.last_name && (
                            <div className="error-message">{validationErrors.last_name}</div>
                        )}
                    </div>
                </div>

                {/* Username Field */}
                <div className="form-group">
                    <label htmlFor="username" className="form-label">
                        Username
                    </label>
                    <div className="input-group">
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            className={`form-input ${validationErrors.username ? 'error' : ''}`}
                            placeholder="Choose a username"
                        />
                    </div>
                    {validationErrors.username && (
                        <div className="error-message">{validationErrors.username}</div>
                    )}
                </div>

                {/* Email Field */}
                <div className="form-group">
                    <label htmlFor="email" className="form-label">
                        Email Address
                    </label>
                    <div className="input-group">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-input ${validationErrors.email ? 'error' : ''}`}
                            placeholder="Enter your email"
                        />
                    </div>
                    {validationErrors.email && (
                        <div className="error-message">{validationErrors.email}</div>
                    )}
                </div>

                {/* Password Field */}
                <div className="form-group">
                    <label htmlFor="password" className="form-label">
                        Password
                    </label>
                    <div className="input-group">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className={`form-input ${validationErrors.password ? 'error' : ''}`}
                            placeholder="Create a password"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="password-toggle"
                        >
                            {showPassword ? (
                                <EyeSlashIcon />
                            ) : (
                                <EyeIcon />
                            )}
                        </button>
                    </div>
                    {validationErrors.password && (
                        <div className="error-message">{validationErrors.password}</div>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                        Confirm Password
                    </label>
                    <div className="input-group">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                            placeholder="Confirm your password"
                        />
                        <button
                            type="button"
                            onClick={toggleConfirmPasswordVisibility}
                            className="password-toggle"
                        >
                            {showConfirmPassword ? (
                                <EyeSlashIcon />
                            ) : (
                                <EyeIcon />
                            )}
                        </button>
                    </div>
                    {validationErrors.confirmPassword && (
                        <div className="error-message">{validationErrors.confirmPassword}</div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="form-group">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-success"
                    >
                        {isLoading ? (
                            <>
                                <div className="loading-spinner"></div>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </div>

                {/* Switch to Login */}
                {onSwitchToLogin && (
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="link-button"
                        >
                            Already have an account? Sign in
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default RegisterForm;