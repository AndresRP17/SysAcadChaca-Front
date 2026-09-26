import { useNavigate } from 'react-router-dom';
import { ResetPasswordModal } from './ResetPasswordModal';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    return <ResetPasswordModal onBack={() => navigate('/')} />;
};
