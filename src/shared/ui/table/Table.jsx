// shared/ui/table/Table.jsx
import "./Table.css";

export const Table = ({ columns = [], data = [], actions = [] }) => {
    // ✅ Asegurar que data sea un array
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="table-wrapper">
            <table className="modern-table">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx}>{col.label}</th>
                        ))}
                        {actions && actions.length > 0 && (
                            <th className="actions-header">Acciones</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {safeData.length > 0 ? (
                        safeData.map((row, idx) => (
                            <tr key={row.id || idx}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} data-label={col.label}>
                                        {col.render ? (
                                            col.render(row[col.key], row)
                                        ) : (
                                            row[col.key] || '-'
                                        )}
                                    </td>
                                ))}
                                {actions && actions.length > 0 && (
                                    <td className="action-buttons">
                                        {actions.map((action, actionIdx) => (
                                            <button
                                                key={actionIdx}
                                                className={`btn-icon btn-${action.name}`}
                                                onClick={() => action.handler(row)}
                                                title={action.name}
                                            >
                                                {action.icon}
                                            </button>
                                        ))}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        
                        <tr>
                            <td 
                                colSpan={columns.length + (actions?.length > 0 ? 1 : 0)}
                                className="empty-state-cell"
                            >
                                <div className="empty-state">
                                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p>No hay datos registrados</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};