// AiStudioScreen.jsx
function AiStudioScreen() {
  const [goal, setGoal] = React.useState('offer');
  return (
    <>
      <div className="m-greet">
        <h1 className="m-greet-h">Make a reel</h1>
        <p className="m-greet-sub">From your shop, in under a minute.</p>
      </div>

      <div className="m-sec-h"><h3 className="m-sec-t">What's the goal?</h3></div>
      <div className="m-goal">
        <button className="m-goal-tile" data-active={goal==='offer'}     onClick={() => setGoal('offer')}>
          <div className="m-goal-ico"><i data-lucide="tag"></i></div>
          <div className="m-goal-l">Festive offer</div>
          <div className="m-goal-s">Flat-discount or BOGO</div>
        </button>
        <button className="m-goal-tile" data-active={goal==='launch'}    onClick={() => setGoal('launch')}>
          <div className="m-goal-ico"><i data-lucide="package"></i></div>
          <div className="m-goal-l">New arrivals</div>
          <div className="m-goal-s">Fresh stock this week</div>
        </button>
        <button className="m-goal-tile" data-active={goal==='greeting'}  onClick={() => setGoal('greeting')}>
          <div className="m-goal-ico"><i data-lucide="party-popper"></i></div>
          <div className="m-goal-l">Festive greeting</div>
          <div className="m-goal-s">Diwali · Eid · NY</div>
        </button>
        <button className="m-goal-tile" data-active={goal==='reengage'}  onClick={() => setGoal('reengage')}>
          <div className="m-goal-ico"><i data-lucide="heart-handshake"></i></div>
          <div className="m-goal-l">Re-engage</div>
          <div className="m-goal-s">For 60+ day inactives</div>
        </button>
      </div>

      <div className="m-sec-h"><h3 className="m-sec-t">Pick a template</h3><a className="m-sec-link">Browse all →</a></div>
      <div className="m-tpls">
        <div className="m-tpl">
          <div>
            <div className="m-tpl-eyebrow">Diwali · 9:16</div>
            <div className="m-tpl-h">Flat 25% off everything you light up</div>
          </div>
          <span className="m-tpl-cta">Shop now</span>
        </div>
        <div className="m-tpl m-tpl-2">
          <div>
            <div className="m-tpl-eyebrow">Reel · 15s</div>
            <div className="m-tpl-h">Fresh haul. Just for the festival.</div>
          </div>
          <span className="m-tpl-cta">View store</span>
        </div>
        <div className="m-tpl m-tpl-3">
          <div>
            <div className="m-tpl-eyebrow">Story · 9:16</div>
            <div className="m-tpl-h">We missed you. Here's ₹100 off.</div>
          </div>
          <span className="m-tpl-cta">Claim</span>
        </div>
        <div className="m-tpl m-tpl-4">
          <div>
            <div className="m-tpl-eyebrow">Reel · 30s</div>
            <div className="m-tpl-h">Pantry, restocked.</div>
          </div>
          <span className="m-tpl-cta">Order</span>
        </div>
      </div>

      <div className="m-render-bar">
        <div className="m-render-bar-l">
          <div className="m-render-eyebrow">Ready to render</div>
          <div className="m-render-title">Diwali offer · 9:16 · Hindi + English</div>
        </div>
        <button className="m-render-cta"><i data-lucide="sparkles"></i> Generate</button>
      </div>
    </>
  );
}
window.AiStudioScreen = AiStudioScreen;
