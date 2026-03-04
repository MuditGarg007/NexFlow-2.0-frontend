import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

export default function OAuthCallback() {
  const { integrationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      return;
    }

    if (code) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => navigate('/integrations'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="oauth-callback">
      <div className="oauth-card glass-card">
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 20px' }} />
            <h2>Connecting...</h2>
            <p>Completing the authorization</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="icon-circle success">
              <CheckCircle size={32} />
            </div>
            <h2>Connected!</h2>
            <p>{integrationId} has been connected successfully. Redirecting...</p>
            <button className="redirect-btn" onClick={() => navigate('/integrations')}>
              Go to Integrations
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="icon-circle error">
              <XCircle size={32} />
            </div>
            <h2>Connection Failed</h2>
            <p>Something went wrong while connecting. Redirecting...</p>
            <button className="redirect-btn" onClick={() => navigate('/integrations')}>
              Go to Integrations
            </button>
          </>
        )}
      </div>
    </div>
  );
}
