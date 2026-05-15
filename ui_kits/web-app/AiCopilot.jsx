// AiCopilot.jsx — floating chip → bottom-right panel
function AiCopilot({ profile }) {
  const [open, setOpen] = React.useState(false);
  const [history, setHistory] = React.useState(profile.copilotHistory);
  const [input, setInput] = React.useState('');
  const send = () => {
    if (!input.trim()) return;
    setHistory([...history, { role: 'user', text: input }, { role: 'ai', text: profile.copilotReply }]);
    setInput('');
  };

  if (!open) {
    return (
      <button className="copilot-chip" onClick={() => setOpen(true)}>
        <span className="copilot-avatar"><i data-lucide="sparkles"></i></span>
        <span>Ask Copilot</span>
        <kbd>⌘J</kbd>
      </button>
    );
  }

  return (
    <div className="copilot-panel">
      <div className="copilot-head">
        <div className="copilot-head-l">
          <span className="copilot-avatar"><i data-lucide="sparkles"></i></span>
          <div>
            <div className="copilot-title">Syllabrix Copilot</div>
            <div className="copilot-sub">Knows your {profile.label.toLowerCase()}</div>
          </div>
        </div>
        <button className="copilot-x" onClick={() => setOpen(false)}><i data-lucide="x"></i></button>
      </div>
      <div className="copilot-body">
        {history.map((m, i) => (
          <div key={i} className={`copilot-msg copilot-msg-${m.role}`}>{m.text}</div>
        ))}
        <div className="copilot-suggest">
          {profile.copilotSuggest.map((s, i) => (
            <button key={i} onClick={() => { setInput(s); setTimeout(send, 50); }}>{s}</button>
          ))}
        </div>
      </div>
      <div className="copilot-input">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask anything about your business…" />
        <button onClick={send}><i data-lucide="arrow-up"></i></button>
      </div>
    </div>
  );
}
window.AiCopilot = AiCopilot;
