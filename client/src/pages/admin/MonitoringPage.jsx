import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Monitor, Wifi, WifiOff, AlertTriangle, Camera, Clock, User } from 'lucide-react';
import api from '../../services/api';

const MonitoringPage = () => {
  const { socket } = useSocket();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [sessions, setSessions] = useState({});
  const [connected, setConnected] = useState(false);
  const videoRefs = useRef({});
  const peerConnections = useRef({});

  useEffect(() => {
    api.get('/admin/exams').then(({ data }) =>
      setExams(data.data.filter((e) => e.isPublished))
    );
  }, []);

  useEffect(() => {
    if (!socket || !selectedExam) return;

    socket.emit('admin-join-monitor', { examId: selectedExam });
    setConnected(true);

    socket.on('monitor-snapshot', ({ sessions: snap }) => {
      const map = {};
      snap.forEach((s) => { map[s.studentId._id] = s; });
      setSessions(map);
    });

    socket.on('student-joined', ({ studentId }) => {
      setSessions((p) => ({ ...p, [studentId]: { ...p[studentId], status: 'online', warningCount: 0 } }));
    });

    socket.on('student-heartbeat', ({ studentId, timeRemaining }) => {
      setSessions((p) => ({ ...p, [studentId]: { ...p[studentId], timeRemaining, lastSeen: new Date() } }));
    });

    socket.on('student-cheat-event', ({ studentId, eventType, warningCount }) => {
      setSessions((p) => ({
        ...p,
        [studentId]: { ...p[studentId], warningCount, lastEvent: eventType, lastEventTime: new Date() },
      }));
    });

    socket.on('student-voided', ({ studentId }) => {
      setSessions((p) => ({ ...p, [studentId]: { ...p[studentId], status: 'voided' } }));
    });

    socket.on('student-disconnected', ({ studentId }) => {
      setSessions((p) => ({ ...p, [studentId]: { ...p[studentId], online: false } }));
    });

    // WebRTC for receiving camera feeds
    socket.on('webrtc-offer', async ({ offer, fromSocketId, studentId }) => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

      pc.ontrack = (event) => {
        if (videoRefs.current[studentId]) {
          videoRefs.current[studentId].srcObject = event.streams[0];
        }
        setSessions((p) => ({ ...p, [studentId]: { ...p[studentId], hasCamera: true } }));
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit('webrtc-ice-candidate', { targetSocketId: fromSocketId, candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc-answer', { targetSocketId: fromSocketId, answer });
      peerConnections.current[studentId] = pc;
    });

    socket.on('webrtc-ice-candidate', async ({ candidate, fromSocketId }) => {
      const pc = Object.values(peerConnections.current).find((_, k) => k === fromSocketId);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.off('monitor-snapshot');
      socket.off('student-joined');
      socket.off('student-heartbeat');
      socket.off('student-cheat-event');
      socket.off('student-voided');
      socket.off('student-disconnected');
      socket.off('webrtc-offer');
      socket.off('webrtc-ice-candidate');
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
  }, [socket, selectedExam]);

  const requestCamera = (studentSocketId) => {
    if (socket) {
      socket.emit('request-camera', { studentSocketId, adminSocketId: socket.id });
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sessionList = Object.values(sessions);

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <Monitor size={24} className="inline mr-2" style={{ color: 'var(--primary-light)' }} />
            Live Monitoring
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            {sessionList.length} active session{sessionList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connected && selectedExam && (
            <span className="flex items-center gap-2 badge badge-success">
              <span className="pulse-dot" style={{ width: 8, height: 8 }} />
              Live
            </span>
          )}
          <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
            className="input-field" style={{ width: 'auto' }}>
            <option value="">Select Exam to Monitor</option>
            {exams.map((e) => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedExam ? (
        <div className="glass-card p-16 flex flex-col items-center" style={{ color: 'var(--text-secondary)' }}>
          <Monitor size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>Select an exam above to start monitoring students</p>
        </div>
      ) : sessionList.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center" style={{ color: 'var(--text-secondary)' }}>
          <User size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>No active students in this exam yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sessionList.map((session) => {
            const studentId = session.studentId?._id || session.studentId;
            const name = session.studentId?.name || 'Student';
            const email = session.studentId?.email || '';
            const isVoided = session.status === 'voided';

            return (
              <div key={studentId} className="glass-card p-5"
                style={{ borderColor: isVoided ? 'rgba(239,68,68,0.4)' : session.warningCount >= 2 ? 'rgba(245,158,11,0.4)' : 'var(--border)' }}>

                {/* Camera feed */}
                <div className="relative rounded-xl overflow-hidden mb-4"
                  style={{ background: '#0a0a14', aspectRatio: '4/3' }}>
                  <video
                    ref={(el) => (videoRefs.current[studentId] = el)}
                    autoPlay playsInline muted
                    className="w-full h-full object-cover"
                  />
                  {!session.hasCamera && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                      style={{ color: 'var(--text-secondary)' }}>
                      <Camera size={28} style={{ opacity: 0.4 }} />
                      <span style={{ fontSize: '12px' }}>No camera feed</span>
                      <button onClick={() => requestCamera(session.socketId)}
                        className="btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                        Request Camera
                      </button>
                    </div>
                  )}

                  {/* Status overlay */}
                  <div className="absolute top-2 right-2">
                    <span className={`badge ${isVoided ? 'badge-danger' : 'badge-success'}`}>
                      {isVoided ? 'Voided' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Student info */}
                <div className="space-y-2">
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{email}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <Clock size={14} style={{ color: 'var(--primary-light)' }} />
                      {formatTime(session.timeRemaining)} left
                    </div>
                    <div className="flex items-center gap-1.5" style={{ fontSize: '13px', color: session.warningCount >= 2 ? '#f59e0b' : 'var(--text-secondary)' }}>
                      <AlertTriangle size={14} />
                      {session.warningCount} warning{session.warningCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {session.lastEvent && (
                    <div className="warning-banner" style={{ padding: '8px 12px' }}>
                      <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                        Last: <strong>{session.lastEvent}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonitoringPage;
