import { useState } from 'react';
import { Lock, KeyRound, CheckCircle, Save } from 'lucide-react';
import { api } from '../../../shared/api/api';
import './SetNewPassword.css';

export const SetNewPasswordModal = ({ token, onSuccessRedirect }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reset-password', {
                token,
                password,
                confirmPassword,
            });

            setSuccess(true);
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(
                responseData?.message
                || responseData?.error
                || requestError.message
                || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-view">
            <div className="reset-password-heading">
                <div className="reset-password-icon">
                    {success ? <CheckCircle size={25} /> : <KeyRound size={25} />}
                </div>
                <h2>{success ? '¡Contraseña actualizada!' : 'Nueva contraseña'}</h2>
                <p>
                    {success
                        ? 'Tu contraseña fue modificada con éxito. Ya podés iniciar sesión.'
                        : 'Ingresá tu nueva contraseña para recuperar el acceso a tu cuenta.'}
                </p>
            </div>

            {error && (
                <div className="reset-password-message reset-password-message-error" role="alert">
                    {error}
                </div>
            )}

            {success ? (
                <button
                    type="button"
                    className="reset-password-submit"
                    onClick={onSuccessRedirect}
                >
                    Ir al inicio de sesión
                </button>
            ) : (
                <form className="reset-password-form" onSubmit={handleSubmit}>
                    <div className="reset-password-field">
                        <label htmlFor="new-password">Nueva contraseña</label>
                        <div className="reset-password-input-group">
                            <Lock size={19} />
                            <input
                                id="new-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div className="reset-password-field">
                        <label htmlFor="confirm-password">Confirmar contraseña</label>
                        <div className="reset-password-input-group">
                            <Lock size={19} />
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="reset-password-submit"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : <><Save size={17} /> Guardar</>}
                    </button>
                </form>
            )}
        </div>
    );
};