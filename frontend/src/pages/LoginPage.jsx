import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isAdmin, isUser } = useAuth();

    const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'

    // Check if this is admin login page
    const isAdminPage = location.pathname === '/admin/login';
    const userType = isAdminPage ? 'admin' : 'user';

    // Get the intended destination from location state
    const from = location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleLoginSuccess = () => {
        // Redirect to main dashboard for all users
        navigate('/dashboard', { replace: true });
    };

    const handleRegisterSuccess = (user) => {
        // Show success message and switch to login
        setCurrentView('login');
        // Could also auto-login the user here if desired
    };

    const switchToRegister = () => {
        setCurrentView('register');
    };

    const switchToLogin = () => {
        setCurrentView('login');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Logo/Brand */}
                <div className="login-header">
                    <h1 className="brand-title">Task Management</h1>
                    <p className="brand-subtitle">Manage your tasks efficiently</p>
                </div>

                {/* Main Form */}
                {currentView === 'login' ? (
                    <LoginForm
                        userType={userType}
                        onSuccess={handleLoginSuccess}
                    />
                ) : (
                    <RegisterForm
                        onSuccess={handleRegisterSuccess}
                        onSwitchToLogin={switchToLogin}
                    />
                )}

                {/* Switch between Login and Register - Only show for user pages */}
                {currentView === 'login' && !isAdminPage && (
                    <div className="text-center mt-20">
                        <button
                            onClick={switchToRegister}
                            className="link-button"
                        >
                            Chưa có tài khoản? Đăng ký
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;