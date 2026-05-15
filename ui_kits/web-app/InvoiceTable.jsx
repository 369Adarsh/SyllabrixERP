// InvoiceTable.jsx — generic data table used for invoices, students, appointments
function DataTable({ columns, rows, dense }) {
  return (
    <div className={`tbl ${dense ? 'tbl-dense' : ''}`}>
      <table>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{ textAlign: c.align || 'left' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c, j) => (
                <td key={j} style={{ textAlign: c.align || 'left' }}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ tone, children }) {
  return <span className={`pill pill-${tone}`}>● {children}</span>;
}

window.DataTable = DataTable;
window.StatusPill = StatusPill;
