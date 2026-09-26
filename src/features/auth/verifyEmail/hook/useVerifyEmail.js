import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../../../shared/api/api';

export const useVerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [showResend, setShowResend] = useState(false);
    const [resendEmail, setResendEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [resendError, setResendError] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');

    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;
        hasVerified.current = true;

        const token = searchParams.get('token');

        if (!token) {
            setLoading(false);
            setError('El enlace no contiene un token de verificación.');
            return;
        }

        const verify = async () => {
            setError('');
            setSuccess('');
            setLoading(true);

            try {
                const url = `/verify-email?token=${encodeURIComponent(token)}`;
                const response = await api.get(url);

                setSuccess('¡Email verificado correctamente! Ya podés iniciar sesión.');
            } catch (requestError) {
                const responseData = requestError.response?.data;
                setError(
                    responseData?.message
                    || responseData?.error
                    || requestError.message
                    || 'No pudimos verificar tu email.'
                );
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [searchParams]);

    const handleTryAgain = () => {
        setShowResend(true);
        setResendEmail('');
        setResendError('');
        setResendSuccess('');
        setError('');
    };

    const requestResend = async (event) => {
        event?.preventDefault();
        setResendError('');
        setResendSuccess('');

        const normalizedEmail = resendEmail.trim();
        if (!normalizedEmail) {
            setResendError('Ingresá tu correo electrónico.');
            return;
        }

        setResending(true);
        try {
            await api.post('/resend-verify-email', { email: normalizedEmail });
            setResendSuccess('Te enviamos un nuevo correo de verificación. Revisá tu casilla o spam.');
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setResendError(
                responseData?.message
                || responseData?.error
                || requestError.message
                || 'No pudimos reenviar el correo.'
            );
        } finally {
            setResending(false);
        }
    };

    const reset = () => {
        setShowResend(false);
        setResendEmail('');
        setResending(false);
        setResendError('');
        setResendSuccess('');
    };

    const handleGoToLogin = () => navigate('/', { state: { openLogin: true } });

    return {
        loading,
        error,
        success,
        showResend,
        resendEmail,
        setResendEmail,
        resending,
        resendError,
        resendSuccess,
        handleTryAgain,
        requestResend,
        reset,
        handleGoToLogin,
    };
};