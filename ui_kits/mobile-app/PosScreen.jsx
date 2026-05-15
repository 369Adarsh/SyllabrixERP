// PosScreen.jsx
function PosScreen() {
  const [items, setItems] = React.useState([
    { sku: 'OIL-FRTNE-1L',  name: 'Fortune Sunflower Oil',     meta: '1 L · ₹160',  qty: 2, price: 160 },
    { sku: 'RIC-INDR-5KG',  name: 'India Gate Basmati',        meta: '5 kg · ₹620', qty: 1, price: 620 },
    { sku: 'BSC-PARLG-PK',  name: 'Parle-G Biscuits',          meta: '6-pack · ₹60', qty: 4, price: 60 },
  ]);
  const sub = items.reduce((a, i) => a + i.qty * i.price, 0);
  const tax = Math.round(sub * 0.05);
  const total = sub + tax;
  const setQty = (i, d) => setItems(items.map((it, idx) => idx === i ? { ...it, qty: Math.max(0, it.qty + d) } : it).filter(it => it.qty > 0));

  return (
    <>
      <div className="m-greet">
        <h1 className="m-greet-h">Quick bill</h1>
        <p className="m-greet-sub">Walk-in · 04:32 PM</p>
      </div>

      <div className="m-scan">
        <div className="m-scan-frame"><i data-lucide="scan-barcode"></i></div>
        <div className="m-scan-h">Scan product barcode</div>
        <div className="m-scan-s">Or search by name · 1,240 products</div>
      </div>

      <div className="m-cart">
        {items.map((it, i) => (
          <div className="m-cart-row" key={it.sku}>
            <div style={{flex: 1}}>
              <div className="m-cart-name">{it.name}</div>
              <div className="m-cart-meta">{it.meta}</div>
            </div>
            <div className="m-qty">
              <button onClick={() => setQty(i, -1)}><i data-lucide="minus"></i></button>
              <span className="m-qty-val">{it.qty}</span>
              <button onClick={() => setQty(i, +1)}><i data-lucide="plus"></i></button>
            </div>
            <div className="m-cart-amt numeric">₹{(it.qty * it.price).toLocaleString('en-IN')}</div>
          </div>
        ))}
        <div className="m-totals">
          <div className="m-tot-row"><span>Subtotal</span><span className="numeric">₹{sub.toLocaleString('en-IN')}</span></div>
          <div className="m-tot-row"><span>GST 5%</span><span className="numeric">₹{tax.toLocaleString('en-IN')}</span></div>
          <div className="m-tot-grand"><span>Total</span><span className="numeric">₹{total.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      <button className="m-pos-cta"><i data-lucide="indian-rupee"></i> Charge ₹{total.toLocaleString('en-IN')}</button>
    </>
  );
}
window.PosScreen = PosScreen;
