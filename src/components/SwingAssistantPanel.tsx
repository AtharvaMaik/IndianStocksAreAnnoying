import type { IndicatorPoint } from "@/types";
import type { SwingAnalysis } from "@/lib/swing";
import { SwingSetupChart } from "./charts";

const money = (value: number | null) => (value === null ? "--" : `₹${value.toLocaleString("en-IN")}`);
const pct = (value: number | null) => (value === null ? "--" : `${value.toFixed(2)}%`);

export function SwingAssistantPanel({ analysis, indicators }: { analysis: SwingAnalysis; indicators: IndicatorPoint[] }) {
  return (
    <section className="panel swing-panel" style={{ marginBottom: 24 }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">Swing Trading Assistant</div>
          <div className="muted">Short-term setup scanner for NIFTY 100 stocks near bottom zones</div>
        </div>
        <span className={`signal-pill ${analysis.signal.toLowerCase()}`}>{analysis.signal}</span>
      </div>
      <div className="swing-grid">
        <div className="swing-score">
          <span className="muted">Setup Score</span>
          <strong>{analysis.score}/100</strong>
          <span>{analysis.confidence} confidence</span>
        </div>
        <div className="metric-card compact">
          <div className="muted">Entry</div>
          <div className="price">{money(analysis.entry)}</div>
        </div>
        <div className="metric-card compact">
          <div className="muted">Stop Loss</div>
          <div className="price">{money(analysis.stopLoss)}</div>
        </div>
        <div className="metric-card compact">
          <div className="muted">Target</div>
          <div className="price">{money(analysis.target)}</div>
        </div>
        <div className="metric-card compact">
          <div className="muted">Upside</div>
          <div className="price positive">{pct(analysis.expectedUpsidePercent)}</div>
        </div>
        <div className="metric-card compact">
          <div className="muted">Risk / Reward</div>
          <div className="price">{analysis.riskReward?.toFixed(2) ?? "--"}x</div>
        </div>
      </div>
      <SwingSetupChart data={indicators} analysis={analysis} />
      <div className="swing-notes">
        <div>
          <strong>Why this signal</strong>
          <ul>
            {analysis.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Risk checks</strong>
          <ul>
            {analysis.cautions.map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: 0 }}>
        Educational signal only. Validate liquidity, news, and market direction before trading.
      </p>
    </section>
  );
}
