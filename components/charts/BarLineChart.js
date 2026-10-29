'use client';

import { Chart as ChartJS, BarController, LineController, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { formatMoney } from '@/lib/utils';

ChartJS.register(BarController, LineController, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

/** Revenue bars + count line on a secondary axis. */
export default function BarLineChart({ labels, revenue, counts, countLabel = 'Sales', amountLabel = 'Revenue' }) {
  const data = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: amountLabel,
        data: revenue,
        backgroundColor: '#2b3fe0',
        hoverBackgroundColor: '#2131b8',
        borderRadius: 8,
        maxBarThickness: 42,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: countLabel,
        data: counts,
        borderColor: '#f2b705',
        backgroundColor: '#f2b705',
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Schibsted Grotesk', weight: '600' } } },
      tooltip: {
        callbacks: {
          label: (ctx) => (ctx.dataset.yAxisID === 'y' ? ` ${amountLabel}: ${formatMoney(ctx.parsed.y)}` : ` ${countLabel}: ${ctx.parsed.y}`),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Schibsted Grotesk' } } },
      y: { beginAtZero: true, grid: { color: '#eef1f9' }, ticks: { callback: (v) => formatMoney(v), font: { family: 'Schibsted Grotesk' } } },
      y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { precision: 0 } },
    },
  };
  return (
    <div style={{ height: 300 }}>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}
