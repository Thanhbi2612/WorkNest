import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const LoginForm = ({ onSuccess }) => {
    const { login, isLoading, error, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [rememberMe, setRememberMe] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Load saved credentials on component mount
    useEffect(() => {
        const savedCredentials = localStorage.getItem('rememberedCredentials');
        if (savedCredentials) {
            const { identifier, password, rememberMe: savedRememberMe } = JSON.parse(savedCredentials);
            setFormData(prev => ({
                ...prev,
                identifier: identifier || '',
                password: password || ''
            }));
            setRememberMe(savedRememberMe || false);
        }
    }, []);

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

        if (!formData.identifier.trim()) {
            errors.identifier = 'Username or email is required';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password phải chứa ít nhất 6 kí tự';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await login(formData.identifier, formData.password);

        if (result.success) {
            // Save credentials if remember me is checked
            if (rememberMe) {
                const credentialsToSave = {
                    identifier: formData.identifier,
                    password: formData.password,
                    rememberMe: true
                };
                localStorage.setItem('rememberedCredentials', JSON.stringify(credentialsToSave));
            } else {
                // Remove saved credentials if remember me is unchecked
                localStorage.removeItem('rememberedCredentials');
            }

            if (onSuccess) {
                onSuccess();
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Handle Google login success
    const handleGoogleSuccess = async (credentialResponse) => {
        setGoogleLoading(true);
        try {
            const result = await authService.googleLogin(credentialResponse.credential);

            if (result.success) {
                // Update auth context
                updateUser(result.user);

                toast.success('Đăng nhập Google thành công!');

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(result.message || 'Đăng nhập Google thất bại');
            }
        } catch (error) {
            console.error('Google login error:', error);
            toast.error('Đã có lỗi xảy ra khi đăng nhập Google');
        } finally {
            setGoogleLoading(false);
        }
    };

    // Handle Google login error
    const handleGoogleError = () => {
        console.error('Google login failed');
        toast.error('Đăng nhập Google thất bại');
        setGoogleLoading(false);
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                {/* Form Title */}
                <div className="text-center mb-20">
                    <h2 className="form-title">Đăng nhập</h2>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error">
                        <div className="alert-title">Đăng nhập thất bại, có lỗi</div>
                        <div>{error}</div>
                    </div>
                )}

                {/* Username/Email Field */}
                <div className="form-group">
                    <label htmlFor="identifier" className="form-label">
                        Tên user hoặc email
                    </label>
                    <div className="input-group">
                        <input
                            id="identifier"
                            name="identifier"
                            type="text"
                            autoComplete="username"
                            required
                            value={formData.identifier}
                            onChange={handleChange}
                            className={`form-input ${validationErrors.identifier ? 'error' : ''}`}
                            placeholder="Nhập tên người dùng hoặc email"
                        />
                    </div>
                    {validationErrors.identifier && (
                        <div className="error-message">{validationErrors.identifier}</div>
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
                            autoComplete="current-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className={`form-input ${validationErrors.password ? 'error' : ''}`}
                            placeholder="Nhập password"
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

                {/* Remember Me Checkbox */}
                <div className="form-group">
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="checkbox-input"
                        />
                        <span className="checkbox-label">Nhớ tài khoản</span>
                    </label>
                </div>

                {/* Submit Button */}
                <div className="form-group">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading ? (
                            <>
                                <div className="loading-spinner"></div>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </div>

                {/* Divider */}
                <div className="divider">
                    <span>hoặc</span>
                </div>

                {/* Google Login Button */}
                <div className="form-group google-login-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        text="Đăng nhập với Google"
                        shape="pill"
                        logo_alignment="left"
                        width="370"
                        locale="vi"
                    />
                </div>

            </form>
        </div>
    );
};

export default LoginForm;