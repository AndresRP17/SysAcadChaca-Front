import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SetNewPasswordModal } from '../setNewPassword/SetNewPasswordModal';
import { AlertTriangle } from 'lucide-react';
import "./ResetPasswordPage.css";


export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState(null);
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');

        if (!tokenFromUrl) {
            setToken(null);
        } else {
            setToken(tokenFromUrl);
        }
        setIsValidating(false);
    }, [searchParams]);

    if (isValidating) {
        return null;
    }

    if (!token) {
        return (
            <div className="snp-error-page-wrapper">
                <div className="snp-error-page-card">
                    <div className="snp-error-page-heading">
                        <div className="snp-error-page-icon">
                            <AlertTriangle size={26} />
                        </div>
                        <h2>Acceso no válido</h2>
                        <p>
                            Para restablecer tu contraseña debés acceder desde el enlace enviado a tu casilla de correo electrónico.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="snp-error-page-button"
                        onClick={() => navigate('/', { state: { openLogin: true } })}
                    >
                        Ir al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }
    return (
        <SetNewPasswordModal
            token={token}
            onSuccessRedirect={() => navigate('/', { state: { openLogin: true } })}
        />
    );
};