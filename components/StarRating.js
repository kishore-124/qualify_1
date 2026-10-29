export default function StarRating({ value = 0, size = '0.85rem', showValue = false, count }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const cls = value >= i ? 'bi-star-fill' : value >= i - 0.5 ? 'bi-star-half' : 'bi-star';
    stars.push(<i key={i} className={`bi ${cls}`} />);
  }
  return (
    <span className="d-inline-flex align-items-center gap-1">
      {showValue && <span className="rating-num">{Number(value).toFixed(1)}</span>}
      <span className="stars" style={{ fontSize: size }}>{stars}</span>
      {count !== undefined && <span className="text-muted-2 fs-7">({count.toLocaleString()})</span>}
    </span>
  );
}
