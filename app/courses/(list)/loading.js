export default function Loading() {
  return (
    <div className="container py-5">
      <div className="skeleton mb-4" style={{ height: 48, width: '40%' }} />
      <div className="row g-4">
        {[1, 2, 3, 4].map((i) => (
          <div className="col-sm-6 col-lg-3" key={i}>
            <div className="skeleton mb-2" style={{ aspectRatio: '16/9' }} />
            <div className="skeleton mb-2" style={{ height: 18 }} />
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
