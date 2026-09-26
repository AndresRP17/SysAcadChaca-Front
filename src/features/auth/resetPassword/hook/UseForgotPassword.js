import { useState } from 'react';
import { api } from '../../../../shared/api/api';

export const useForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const requestPasswordReset = async (event) => {
        event?.preventDefault();
        setError('');
        setSuccess('');

        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            setError('Ingresá tu correo electrónico.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/forgot-password', {
                email: normalizedEmail
            });

            setSuccess('Te enviamos las instrucciones para restablecer tu contraseña.');
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(
                responseData?.message
                || responseData?.error
                || requestError.message
                || 'No pudimos procesar tu solicitud.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleTryAgain = () => {
        setSuccess('');
        setError('');
    };

    const reset = () => {
        setEmail('');
        setLoading(false);
        setError('');
        setSuccess('');
    };

    return {
        email,
        setEmail,
        loading,
        error,
        success,
        requestPasswordReset,
        handleTryAgain,
        reset,
    };
};