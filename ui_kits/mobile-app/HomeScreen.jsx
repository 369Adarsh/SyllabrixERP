// HomeScreen.jsx
function HomeScreen() {
  const Spark = ({ stroke, fill }) => (
    <svg className="m-kpi-spark" viewBox="0 0 120 32" preserveAspectRatio="none">
      <path d="M0 24 L18 18 L36 22 L54 12 L72 14 L90 6 L108 8 L120 4 L120 32 L0 32 Z" fill={fill}/>
      <path d="M0 24 L18 18 L36 22 L54 12 L72 14 L90 6 L108 8 L120 4" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
  return (
    <>
      <div className="m-greet">
        <h1 className="m-greet-h">Good morning, Riya.</h1>
        <p className="m-greet-sub">Here's your shop today.</p>
      </div>

      <div className="m-kpis">
        <div className="m-kpi">
          <div className="m-kpi-lbl">Sales today</div>
          <div className="m-kpi-v numeric">₹1,24,560</div>
          <div className="m-kpi-d">▲ 18% vs yesterday</div>
          <Spark stroke="#2D2BB8" fill="rgba(45,43,184,0.12)" />
        </div>
        <div className="m-kpi m-kpi-gradient">
          <div className="m-kpi-lbl">Bills today</div>
          <div className="m-kpi-v numeric">86</div>
          <div className="m-kpi-d">▲ 9 vs avg</div>
          <Spark stroke="#F8B547" fill="rgba(248,181,71,0.18)" />
        </div>
        <div className="m-kpi">
          <div className="m-kpi-lbl">Low stock</div>
          <div className="m-kpi-v numeric">12</div>
          <div className="m-kpi-d" style={{ color: 'var(--vermilion-400)' }}>Reorder needed</div>
          <Spark stroke="#DC2626" fill="rgba(220,38,38,0.10)" />
        </div>
      </div>

      <div className="m-sec-h"><h3 className="m-sec-t">Quick actions</h3></div>
      <div className="m-quick">
        <button className="m-quick-tile">
          <div className="m-quick-ico"><i data-lucide="scan-barcode"></i></div>
          <div className="m-quick-l">Scan & bill</div>
          <div className="m-quick-s">Open POS scanner</div>
        </button>
        <button className="m-quick-tile">
          <div className="m-quick-ico"><i data-lucide="package-plus"></i></div>
          <div className="m-quick-l">Add product</div>
          <div className="m-quick-s">New SKU in 30s</div>
        </button>
        <button className="m-quick-tile">
          <div className="m-quick-ico"><i data-lucide="receipt-indian-rupee"></i></div>
          <div className="m-quick-l">Send invoice</div>
          <div className="m-quick-s">WhatsApp or print</div>
        </button>
        <button className="m-quick-tile m-quick-saffron">
          <div className="m-quick-ico"><i data-lucide="sparkles"></i></div>
          <div className="m-quick-l">Make a reel</div>
          <div className="m-quick-s">From your products</div>
        </button>
      </div>

      <div className="m-sec-h"><h3 className="m-sec-t">Today's tasks</h3><a className="m-sec-link">All →</a></div>
      <div className="m-list">
        <div className="m-row">
          <div className="m-row-time">09:30</div>
          <div className="m-row-meta">
            <div className="m-row-t">Reorder cooking oil — 12 SKUs</div>
            <div className="m-row-s">Suggested supplier: Patel Distributors</div>
          </div>
          <span className="m-pill m-pill-warn">Due</span>
        </div>
        <div className="m-row">
          <div className="m-row-time">11:00</div>
          <div className="m-row-meta">
            <div className="m-row-t">Festive WhatsApp blast — 240 customers</div>
            <div className="m-row-s">Drafted by Copilot, awaiting your OK</div>
          </div>
          <span className="m-pill m-pill-info">Draft</span>
        </div>
        <div className="m-row">
          <div className="m-row-time">15:00</div>
          <div className="m-row-meta">
            <div className="m-row-t">Cash deposit — Bank of Baroda</div>
            <div className="m-row-s">₹38,420 collected today</div>
          </div>
          <span className="m-pill m-pill-ok">On track</span>
        </div>
      </div>
    </>
  );
}
window.HomeScreen = HomeScreen;
