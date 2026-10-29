import Logo from './Logo';

/** Left panel on login/register: a mock certificate, the thing learners come here to earn. */
export default function AuthSide({ title, text }) {
  return (
    <div className="auth-side">
      <div style={{ maxWidth: 440, width: '100%' }}>
        <Logo tone="light" size={36} />
        <h2 className="auth-title mt-5 mb-3">{title}</h2>
        <p className="auth-text mb-5">{text}</p>
        <div className="mini-cert" aria-hidden="true">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <span className="fs-8 text-muted-2">Certificate of completion</span>
            <span className="mini-seal"><i className="bi bi-check-lg" /></span>
          </div>
          <div className="mini-cert-name">Kavya Nair</div>
          <div className="small text-muted-2">completed</div>
          <div className="fw-bold">UI/UX Design with Figma: Zero to Pro</div>
          <div className="mini-cert-foot">
            <span>18 h of video</span>
            <span>ID QF-8C21E4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
