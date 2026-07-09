// 재고 스냅샷 표 — 서버/클라이언트 페이지 양쪽에서 재사용(서버 전용 API 미사용).
export type InvItem = {
  sku: string;
  name: string;
  qty: number;
  site: string;
  status: string;
  location: string; // 로케이션 코드 (랙이름-행-열, 예: R1-1-3)
  unitWeightKg: number; // 단위 중량(kg) — 낱개/박스 1개 기준
};

function statusClass(s: string) {
  if (s === "정상") return "st st-ok";
  if (s === "부족") return "st st-warn";
  return "st st-bad"; // 이상
}

export function InventoryTable({ items }: { items: InvItem[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>품목</th>
          <th>수량</th>
          <th>거점</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.sku}>
            <td style={{ fontFamily: "monospace" }}>{it.sku}</td>
            <td>{it.name}</td>
            <td>{it.qty.toLocaleString()}</td>
            <td className="dim">{it.site}</td>
            <td>
              <span className={statusClass(it.status)}>{it.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
