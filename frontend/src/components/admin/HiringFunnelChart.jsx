import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

export default function HiringFunnelChart({ funnel }) {
  if (!funnel || !funnel.stages || funnel.stages.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Hiring Funnel</h3>
        <div className="text-gray-500 text-sm">No funnel data available</div>
      </div>
    );
  }

  // ✅ Normalize stage labels
  const data = funnel.stages.map((stage, index, arr) => {
    let displayName = stage.stage;

    // Keep first and last as-is
    if (stage.stage !== "SHORTLISTED" && stage.stage !== "HIRED") {
      // Determine round index (excluding shortlisted)
      const roundIndex = index;
      displayName = `Round ${roundIndex}`;
    }

    return {
      name: displayName,
      count: stage.count ?? 0,
      conversionRate: stage.conversionRate ?? null,
      dropOffRate: stage.dropOffRate ?? null,
      bottleneck: stage.bottleneck ?? false,
    };
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
      <h3 className="text-lg font-semibold mb-6">Hiring Funnel</h3>

      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            interval={0}
            textAnchor="end"
          />

          <YAxis domain={[0, "dataMax + 1"]} />

          <Tooltip
            formatter={(value, name, props) => {
              const { conversionRate, dropOffRate } = props.payload;

              return [
                `${value}`,
                `Count (Conv: ${conversionRate ?? "-"}% | Drop: ${
                  dropOffRate ?? "-"
                }%)`,
              ];
            }}
          />

          <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={45}>
            {/* 🔥 Color per stage */}
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.bottleneck ? "#dc2626" : "#4f46e5"}
              />
            ))}

            {/* 🔥 Conversion % above bars */}
            <LabelList
              dataKey="count"
              position="top"
              formatter={(value, entry) => {
                const conversion = entry?.payload?.conversionRate;

                if (conversion !== undefined && conversion !== null) {
                  return `${value} (${conversion}%)`;
                }

                return value;
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
