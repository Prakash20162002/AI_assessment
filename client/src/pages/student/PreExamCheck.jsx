import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Camera, Maximize, Wifi, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import useCamera from '../../hooks/useCamera';

const PreExamCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [checks, setChecks] = useState({
    camera: false,
    fullscreen: false,
    internet: navigator.onLine,
  });

  const { videoRef, cameraActive, cameraError, startCamera } = useCamera({
    enabled: false,
    examId: id,
    studentId: 'setup', 
  });

  // Internet check
  useEffect(() => {
    const handleOnline = () => setChecks((p) => ({ ...p, internet: true }));
    const handleOffline = () => setChecks((p) => ({ ...p, internet: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Camera check
  const handleCameraCheck = async () => {
    try {
      await startCamera();
      setChecks((p) => ({ ...p, camera: true }));
    } catch (err) {
      setChecks((p) => ({ ...p, camera: false }));
    }
  };

  // Fullscreen check
  const handleFullscreenCheck = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setChecks((p) => ({ ...p, fullscreen: true }));
    } catch (err) {
      toast.error('Fullscreen request failed');
      setChecks((p) => ({ ...p, fullscreen: false }));
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setChecks((p) => ({ ...p, fullscreen: !!document.fullscreenElement }));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const allPassed = checks.camera && checks.fullscreen && checks.internet;

  const handleStart = () => {
    if (!allPassed) return;
    navigate(`/student/exams/${id}/play`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden page-enter"
      style={{ background: 'var(--bg-dark)' }}>
      
      <div className="glass-card p-8 w-full max-w-2xl mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-2">Pre-Exam System Check</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please complete the following checks to begin your exam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Checks List */}
          <div className="space-y-4">
            {/* Internet Check */}
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <Wifi size={20} style={{ color: checks.internet ? '#10b981' : '#ef4444' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Internet Connection</span>
              </div>
              {checks.internet ? <CheckCircle2 style={{ color: '#10b981' }} /> : <XCircle style={{ color: '#ef4444' }} />}
            </div>

            {/* Camera Check */}
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <Camera size={20} style={{ color: checks.camera ? '#10b981' : 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Webcam Access</span>
              </div>
              {checks.camera ? (
                <CheckCircle2 style={{ color: '#10b981' }} />
              ) : (
                <button onClick={handleCameraCheck} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                  Enable
                </button>
              )}
            </div>

            {/* Fullscreen Check */}
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <Maximize size={20} style={{ color: checks.fullscreen ? '#10b981' : 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Fullscreen Mode</span>
              </div>
              {checks.fullscreen ? (
                <CheckCircle2 style={{ color: '#10b981' }} />
              ) : (
                <button onClick={handleFullscreenCheck} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Camera Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full aspect-video rounded-xl overflow-hidden relative mb-4"
              style={{ background: '#0a0a14', border: '1px solid var(--border)' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : ''}`}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                  <Camera size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: '13px' }}>{cameraError || 'Camera preview will appear here'}</p>
                </div>
              )}
            </div>
            
            <p className="text-sm text-center px-4" style={{ color: 'var(--text-secondary)' }}>
              Ensure your face is clearly visible and well-lit. 
              The camera will be active during the exam for proctoring.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleStart}
            disabled={!allPassed}
            className="btn-primary"
            style={{ width: '100%', maxWidth: '300px' }}
          >
            Start Exam <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreExamCheck;
