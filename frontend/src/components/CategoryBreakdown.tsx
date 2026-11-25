import { ChartPie } from "lucide-react";
import type { Summary } from "../types";
import { money } from "./Feedback";

// Percentages are only chart presentation. Exact amounts come from Laravel.
export function CategoryBreakdown({ summary }: { summary: Summary }) {
  const total = Number(summary.total);
  return (
    <section className="panel breakdown">
      <div className="panel-heading">
        <div>
          <h2>¿En qué estás gastando?</h2>
          <p>Distribución por categoría</p>
        </div>
        <ChartPie size={20} />
      </div>
      {!summary.by_category.length ? (
        <div className="empty compact">
          <ChartPie size={30} />
          <p>Tu distribución aparecerá al registrar gastos.</p>
        </div>
      ) : (
        <div className="breakdown-list">
          {summary.by_category.map((category) => {
            const percent =
              total > 0 ? (Number(category.total) / total) * 100 : 0;
            return (
              <div className="breakdown-row" key={category.id}>
                <div>
                  <span>
                    <i style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                  <strong>{money(category.total, summary.currency)}</strong>
                </div>
                <div className="bar-track">
                  <span
                    style={{
                      width: `${percent}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
                <small>
                  {category.count} {category.count === 1 ? "gasto" : "gastos"}{" "}
                  <span>{percent.toFixed(1)}%</span>
                </small>
              </div>
            );
          })}
        </div>
      )}
      <div className="breakdown-footer">
        Cada registro cuenta. Conocer tus hábitos es el primer paso.
      </div>
    </section>
  );
}
