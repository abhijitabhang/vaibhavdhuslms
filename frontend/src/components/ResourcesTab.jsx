import React, { useState } from 'react';
import { FileText, Download, Lock, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { resourceService } from '../services/lmsServices';

export default function ResourcesTab({ resources = [], isEnrolled = false }) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDownload = async (resource) => {
    setDownloadingId(resource.id);
    setErrorMsg(null);
    try {
      await resourceService.downloadPdf(resource.id, resource.file_name);
      setDownloadSuccessId(resource.id);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = Math.round(bytes / 1024);
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb} KB`;
  };

  if (!resources || resources.length === 0) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <FileText size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
        <p>No downloadable resources attached to this lesson.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
      {errorMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger)',
          fontSize: '0.85rem'
        }}>
          {errorMsg}
        </div>
      )}

      {resources.map((res) => {
        const canDownload = res.is_free === 1 || isEnrolled;
        const isDownloading = downloadingId === res.id;
        const isSuccess = downloadSuccessId === res.id;

        return (
          <div
            key={res.id}
            className="card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(var(--color-primary-rgb), 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText size={22} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{res.title}</h4>
                  {res.is_free === 1 ? (
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Free PDF</span>
                  ) : (
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Enrolled Only</span>
                  )}
                </div>
                {res.description && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                    {res.description}
                  </p>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.75rem' }}>
                  <span>PDF Document</span>
                  <span>•</span>
                  <span>{formatFileSize(res.file_size_bytes)}</span>
                  <span>•</span>
                  <span>{res.download_count || 0} downloads logged</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div>
              {canDownload ? (
                <button
                  onClick={() => handleDownload(res)}
                  disabled={isDownloading}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={15} className="pulse-active" />
                      <span>Downloading...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 size={15} color="var(--color-success)" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: 0.5, cursor: 'not-allowed', gap: '0.4rem' }}
                  title="Enroll in course to unlock"
                >
                  <Lock size={15} />
                  <span>Locked</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
