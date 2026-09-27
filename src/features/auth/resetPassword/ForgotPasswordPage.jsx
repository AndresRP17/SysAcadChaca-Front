import { useNavigate } from 'react-router-dom';
import { ResetPasswordModal } from './ResetPasswordModal';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    return (
        <div className="auth-page">
            <ResetPasswordModal onBack={() => navigate('/')} />
        </div>
    );
};
