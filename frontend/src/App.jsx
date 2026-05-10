import { useState, useEffect } from "react";

const CAMPAIGNS = [
  { id: "cmp-a001-01-000000010599304", name: "동탄파라곤3차" },
  { id: "cmp-a001-01-000000010573194", name: "RE용인푸르지오" },
  { id: "cmp-a001-01-000000010552818", name: "용인양지서희스타힐스" },
  { id: "cmp-a001-01-000000010510091", name: "용인고림동문더이스트" },
  { id: "cmp-a001-01-000000010441646", name: "힐스테이트장안" },
  { id: "cmp-a001-01-000000010350831", name: "남수원파크힐" },
  { id: "cmp-a001-01-000000010134403", name: "원클러스터파크" },
];

const PERIODS = ["어제", "오늘", "7일"];

function fmt(n) { return (!n || n === 0) ? "-" : Number(n).toLocaleString("ko-KR"); }
function fmtW(n) { return "₩" + Number(n).toLocaleString("ko-KR"); }

function getDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function App() {
  const [period, setPeriod] = useState("오늘");
  const [selectedCampaign, setSelectedCampaign] = useState(CAMPAIGNS[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const since = period === "어제" ? getDateStr(-1) : period === "7일" ? getDateStr(-6) : getDateStr(0);
const until = period === "어제" ? getDateStr(-1) : getDateStr(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/report?since=${since}&until=${until}&id=${selectedCampaign.id}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError("데이터 없음"); setRows([]); }
        else setRows(json.data || []);
      })
      .catch(() => setError("서버 연결 실패"))
      .finally(() => setLoading(false));
  }, [since, until, selectedCampaign]);

  const total = rows.reduce((acc, r) => ({
    impCnt: acc.impCnt + (r.impCnt || 0),
    clkCnt: acc.clkCnt + (r.clkCnt || 0),
    salesAmt: acc.salesAmt + (r.salesAmt || 0),
  }), { impCnt: 0, clkCnt: 0, salesAmt: 0 });
  const avgCpc = total.clkCnt > 0 ? Math.round(total.salesAmt / total.clkCnt) : 0;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ background: "#042C53", padding: "16px 16px 12px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ color: "#B5D4F4", fontSize: 13, fontWeight: 500 }}>검색광고 보고서</span>
          <span style={{ color: "#85B7EB", fontSize: 12 }}>{since}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ color: "#85B7EB", fontSize: 11, marginBottom: 4 }}>총 비용</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 500 }}>{fmtW(total.salesAmt)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ color: "#85B7EB", fontSize: 11, marginBottom: 4 }}>총 클릭</div>
            <div style={{ color: "#5DCAA5", fontSize: 20, fontWeight: 500 }}>{fmt(total.clkCnt)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #eee", background: "#fff", position: "sticky", top: 116, zIndex: 9 }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: "10px 0", fontSize: 12, border: "none", background: "none", cursor: "pointer",
            fontWeight: period === p ? 600 : 400, color: period === p ? "#185FA5" : "#888",
            borderBottom: period === p ? "2px solid #185FA5" : "2px solid transparent",
          }}>{p}</button>
        ))}
      </div>

      <div style={{ padding: "12px 16px 8px" }}>
        <select
          value={selectedCampaign.id}
          onChange={e => setSelectedCampaign(CAMPAIGNS.find(c => c.id === e.target.value))}
          style={{ width: "100%", fontSize: 16, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          {CAMPAIGNS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 16px 12px" }}>
        {[
          { label: "총 노출수", value: fmt(total.impCnt) },
          { label: "총 클릭수", value: fmt(total.clkCnt) },
          { label: "평균 CPC", value: avgCpc > 0 ? fmtW(avgCpc) : "-" },
          { label: "총 비용", value: fmtW(total.salesAmt) },
        ].map(s => (
          <div key={s.label} style={{ background: "#f5f7fa", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        {loading && <div style={{ textAlign: "center", padding: 20, color: "#888" }}>불러오는 중...</div>}
        {error && <div style={{ textAlign: "center", padding: 20, color: "#e24b4a" }}>{error}</div>}
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                {["날짜", "노출수", "클릭수", "CPC", "총비용", "순위"].map(h => (
                  <th key={h} style={{ padding: "8px 4px", textAlign: h === "시간대" ? "left" : "right", fontWeight: 600, color: "#666", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 4px", fontWeight: 500, fontSize: 11 }}>{row.dateStart}</td>
                  <td style={{ padding: "9px 4px", textAlign: "right" }}>{fmt(row.impCnt)}</td>
                  <td style={{ padding: "9px 4px", textAlign: "right", color: row.clkCnt > 0 ? "#185FA5" : "#bbb" }}>{fmt(row.clkCnt)}</td>
                  <td style={{ padding: "9px 4px", textAlign: "right" }}>{fmt(row.cpc)}</td>
                  <td style={{ padding: "9px 4px", textAlign: "right", color: row.salesAmt > 0 ? "#185FA5" : "#bbb" }}>{fmt(row.salesAmt)}</td>
                  <td style={{ padding: "9px 4px", textAlign: "right", color: row.avgRnk <= 1.5 ? "#0F6E56" : row.avgRnk >= 3 ? "#993C1D" : "#333" }}>{row.avgRnk ? Number(row.avgRnk).toFixed(1) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}