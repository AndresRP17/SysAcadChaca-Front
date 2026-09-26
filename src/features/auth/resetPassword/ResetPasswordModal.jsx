import { ArrowLeft, CheckCircle, Mail, Send, RefreshCw } from 'lucide-react';
import { useForgotPassword } from './hook/UseForgotPassword';
import './ResetPasswordModal.css';

export const ResetPasswordModal = ({ onBack, onClose }) => {
    const {
        email,
        setEmail,
        loading,
        error,
        success,
        requestPasswordReset,
        handleTryAgain,
    } = useForgotPassword();

    return (
        <div className="forgot-pwd-card">
            {onBack && (
                <button
                    type="button"
                    className="forgot-pwd-back-btn"
                    onClick={onBack}
                    disabled={loading}
                >
                    <ArrowLeft size={17} />
                    Volver al inicio de sesión
                </button>
            )}

            <div className="forgot-pwd-header">
                <div className={`forgot-pwd-icon-badge ${success ? 'forgot-pwd-icon-success' : ''}`}>
                    {success ? <CheckCircle size={25} /> : <Mail size={25} />}
                </div>
                <h2>{success ? 'Correo enviado' : 'Recuperar contraseña'}</h2>
                <p>
                    {success
                        ? `Enviamos el enlace a ${email}. Revisá tu casilla de correo o la carpeta de spam.`
                        : 'Ingresá tu correo para recibir un enlace de restablecimiento.'}
                </p>
            </div>

            {error && (
                <div className="forgot-pwd-alert forgot-pwd-alert-error" role="alert">
                    {error}
                </div>
            )}

            {success ? (
                <div className="forgot-pwd-success-block">
                    <div className="forgot-pwd-alert forgot-pwd-alert-success" role="status">
                        {success}
                    </div>

                    <button
                        type="button"
                        className="forgot-pwd-secondary-btn"
                        onClick={handleTryAgain}
                    >
                        <RefreshCw size={16} />
                        Volver a enviar o cambiar correo
                    </button>
                </div>
            ) : (
                <form className="forgot-pwd-form" onSubmit={requestPasswordReset}>
                    <div className="forgot-pwd-field">
                        <label htmlFor="reset-password-email">Correo electrónico</label>
                        <div className="forgot-pwd-input-wrapper">
                            <Mail size={19} />
                            <input
                                id="reset-password-email"
                                type="email"
                                placeholder="tu-correo@ejemplo.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoFocus
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="forgot-pwd-primary-btn"
                        disabled={loading}
                    >
                        {loading ? 'Enviando...' : <><Send size={17} /> Enviar instrucciones</>}
                    </button>
                </form>
            )}

            {onClose && (
                <button
                    type="button"
                    className="forgot-pwd-close-btn"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cerrar
                </button>
            )}
        </div>
    );
};