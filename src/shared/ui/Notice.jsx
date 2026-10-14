import "./Notice.css";

// Aviso informativo de pantalla (no es un error: para eso está LoadError). Es una tarjeta con
// borde de acento; el contenido es libre, por ejemplo un texto con un <Link>.
export default function Notice({ children }) {
  return (
    <div className="notice" role="status">
      <p className="notice-text">{children}</p>
    </div>
  );
}
