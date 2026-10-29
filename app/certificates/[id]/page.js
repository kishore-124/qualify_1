import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import PrintButton from '@/components/PrintButton';
import Logo from '@/components/Logo';
import { formatDate, APP_NAME } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Certificate of completion' };

export default async function CertificatePage({ params }) {
  const { id } = await params;
  const cert = await prisma.certificate.findFirst({
    where: { OR: [{ id }, { serial: id }] },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, slug: true, instructor: { select: { name: true } } } },
    },
  });
  if (!cert) notFound();

  return (
    <div className="bg-surface py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 no-print flex-wrap gap-2" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="small"><span className="badge bg-success me-2"><i className="bi bi-patch-check-fill me-1" />Verified</span>This certificate is authentic and was issued by {APP_NAME}.</div>
          <PrintButton />
        </div>
        <div className="certificate">
          <div className="inner">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <Logo size={34} />
              <div className="text-end fs-7 text-muted-2">Certificate no: <b>{cert.serial}</b><br />Issued: {formatDate(cert.issuedAt)}</div>
            </div>
            <div className="fw-bold text-primary mb-3">Certificate of completion</div>
            <div className="text-muted-2 mb-2">This is to certify that</div>
            <div className="name mb-3">{cert.user.name}</div>
            <div className="text-muted-2 mb-2">has successfully completed the online course</div>
            <h2 className="fw-bold mb-5 px-lg-5">{cert.course.title}</h2>
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-4">
              <div className="text-start">
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.6rem' }}>{cert.course.instructor.name}</div>
                <div className="border-top pt-1 fs-7 text-muted-2" style={{ minWidth: 200 }}>Instructor</div>
              </div>
              <div className="seal"><i className="bi bi-check-lg" style={{ fontSize: '2.6rem', lineHeight: 1 }} /><span className="fs-8">Verified</span></div>
              <div className="text-end">
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.6rem' }}>{APP_NAME} Academy</div>
                <div className="border-top pt-1 fs-7 text-muted-2" style={{ minWidth: 200 }}>Director of Learning</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
