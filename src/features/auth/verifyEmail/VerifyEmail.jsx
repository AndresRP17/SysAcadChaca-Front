import {
    ArrowLeft,
    CheckCircle,
    Mail,
    Send,
    RefreshCw,
    XCircle,
    Loader2,
} from 'lucide-react';
import { useVerifyEmail } from './hook/useVerifyEmail';
import './VerifyEmail.css';

export const VerifyEmailPage = () => {
    const {
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
        handleGoToLogin,
    } = useVerifyEmail();

    if (showResend) {
        return (
            <div className="verify-email-card">
                <div className="verify-email-visual">
                    <div className={`verify-email-icon-badge ${resendSuccess ? 'verify-email-icon-success' : ''}`}>
                        {resendSuccess ? <CheckCircle size={30} /> : <Mail size={30} />}
                    </div>

                    <span className="verify-email-status">
                        {resendSuccess ? 'Listo' : 'Verificación'}
                    </span>

                    <p>
                        {resendSuccess
                            ? 'Tu correo está en camino.'
                            : 'Recibí un nuevo enlace para verificar tu cuenta.'}
                    </p>
                </div>

                <div className="verify-email-content">
                    <div className="verify-email-header">
                        <h2>{resendSuccess ? 'Correo enviado' : 'Reenviar verificación'}</h2>
                        <p>
                            {resendSuccess
                                ? `Enviamos el enlace a ${resendEmail}. Revisá tu casilla o spam.`
                                : 'Ingresá tu correo para recibir un nuevo enlace de verificación.'}
                        </p>
                    </div>

                    {resendError && (
                        <div className="verify-email-alert verify-email-alert-error" role="alert">
                            {resendError}
                        </div>
                    )}

                    {resendSuccess ? (
                        <div className="verify-email-success-block">
                            <div className="verify-email-alert verify-email-alert-success" role="status">
                                {resendSuccess}
                            </div>
                            <button
                                type="button"
                                className="verify-email-secondary-btn"
                                onClick={handleGoToLogin}
                            >
                                <ArrowLeft size={16} />
                                Ir al inicio de sesión
                            </button>
                        </div>
                    ) : (
                        <form className="verify-email-form" onSubmit={requestResend}>
                            <div className="verify-email-field">
                                <label htmlFor="resend-email">Correo electrónico</label>
                                <div className="verify-email-input-wrapper">
                                    <Mail size={18} />
                                    <input
                                        id="resend-email"
                                        type="email"
                                        placeholder="tu-correo@ejemplo.com"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        autoFocus
                                        disabled={resending}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="verify-email-primary-btn"
                                disabled={resending}
                            >
                                {resending ? (
                                    <>
                                        <Loader2 size={17} className="verify-email-spinner" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={17} />
                                        Enviar nuevo enlace
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="verify-email-card">
            <div className={`verify-email-visual ${success ? 'visual-success' : error ? 'visual-error' : ''}`}>
                <div className={`verify-email-icon-badge ${success ? 'verify-email-icon-success' : error ? 'verify-email-icon-error' : ''}`}>
                    {loading && <Loader2 size={30} className="verify-email-spinner" />}
                    {!loading && success && <CheckCircle size={30} />}
                    {!loading && error && <XCircle size={30} />}
                    {!loading && !success && !error && <Mail size={30} />}
                </div>

                <span className="verify-email-status">
                    {loading && 'Procesando'}
                    {!loading && success && 'Completado'}
                    {!loading && error && 'Atención'}
                </span>

                <p>
                    {loading && 'Validando tu información...'}
                    {!loading && success && 'Tu cuenta fue verificada correctamente.'}
                    {!loading && error && 'El enlace necesita atención.'}
                </p>
            </div>

            <div className="verify-email-content">
                <div className="verify-email-header">
                    <h2>
                        {loading && 'Verificando tu email...'}
                        {!loading && success && '¡Email verificado!'}
                        {!loading && error && 'No se pudo verificar'}
                    </h2>

                    <p>
                        {loading && 'Estamos validando tu enlace, esperá un momento.'}
                        {!loading && success && success}
                        {!loading && error && error}
                    </p>
                </div>

                {!loading && success && (
                    <div className="verify-email-actions">
                        <button
                            type="button"
                            className="verify-email-primary-btn"
                            onClick={handleGoToLogin}
                        >
                            Ir al inicio de sesión
                        </button>
                    </div>
                )}

                {!loading && error && (
                    <div className="verify-email-actions">
                        <button
                            type="button"
                            className="verify-email-primary-btn"
                            onClick={handleTryAgain}
                        >
                            <RefreshCw size={16} />
                            Reenviar correo
                        </button>

                        <button
                            type="button"
                            className="verify-email-secondary-btn"
                            onClick={handleGoToLogin}
                        >
                            <ArrowLeft size={16} />
                            Ir al inicio de sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};