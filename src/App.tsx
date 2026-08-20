import { useState, useEffect } from 'react';
import type { User, OU, ApprovalDocument, DocumentCategory } from './types/approval';
import {
  getUsers,
  getOUs,
  getDocuments,
  getCurrentUser,
  setCurrentUserId,
  initStorage,
  isIntroHidden,
  setIntroHidden,
} from './services/storage';
import { IntroScreen } from './components/intro/IntroScreen';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import type { ActiveTab } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { DocumentList } from './components/document/DocumentList';
import { DocumentDetailModal } from './components/document/DocumentDetailModal';
import { NewDocumentModal } from './components/document/NewDocumentModal';
import { OrgTree } from './components/org/OrgTree';
import { StampCanvas } from './components/approval/StampCanvas';
import './styles/index.css';
import './styles/forms.css';
import './styles/print.css';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(getCurrentUser());
  const [users, setUsers] = useState<User[]>(getUsers());
  const [ous, setOus] = useState<OU[]>(getOUs());
  const [documents, setDocuments] = useState<ApprovalDocument[]>(getDocuments());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedDocument, setSelectedDocument] = useState<ApprovalDocument | null>(null);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [initialDocCategory, setInitialDocCategory] = useState<DocumentCategory>('LEAVE');
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  // 접속 시 첫 화면: 보안 안내. '다음부터 표시 안 함'을 선택하지 않았다면 매 접속마다 표시.
  const [showIntro, setShowIntro] = useState(() => !isIntroHidden());

  useEffect(() => {
    initStorage();
    refreshAllData();
  }, []);

  const refreshAllData = () => {
    const updatedUsers = getUsers();
    const updatedOus = getOUs();
    const updatedDocs = getDocuments();
    const updatedCurrent = getCurrentUser();

    setUsers(updatedUsers);
    setOus(updatedOus);
    setDocuments(updatedDocs);
    setCurrentUser(updatedCurrent);
  };

  const handleSwitchUser = (userId: string) => {
    const newCurrent = setCurrentUserId(userId);
    setCurrentUser(newCurrent);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', !darkMode ? 'dark' : 'light');
  };

  const handleStartNewDocument = (category: DocumentCategory = 'LEAVE') => {
    setInitialDocCategory(category);
    setIsNewDocModalOpen(true);
  };

  const handleDocumentCreated = (newDoc: ApprovalDocument) => {
    refreshAllData();
    setSelectedDocument(newDoc);
  };

  const pendingDocs = documents.filter((d) => {
    const pendingStep = d.approvalLine.find((s) => s.status === 'PENDING');
    return (d.status === 'IN_PROGRESS' || d.status === 'PENDING') && pendingStep?.approverId === currentUser.id;
  });

  const progressDocs = documents.filter(
    (d) => d.drafterId === currentUser.id && (d.status === 'IN_PROGRESS' || d.status === 'PENDING')
  );

  const approvedDocs = documents.filter(
    (d) => (d.drafterId === currentUser.id || d.approvalLine.some((s) => s.approverId === currentUser.id)) && d.status === 'APPROVED'
  );

  const rejectedDocs = documents.filter(
    (d) => (d.drafterId === currentUser.id || d.approvalLine.some((s) => s.approverId === currentUser.id)) && d.status === 'REJECTED'
  );

  return (
    <div className="app-container">
      {showIntro && (
        <IntroScreen
          onClose={() => setShowIntro(false)}
          onDontShowAgain={() => setIntroHidden(true)}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'new-doc') {
            handleStartNewDocument('LEAVE');
          } else {
            setActiveTab(tab);
          }
        }}
        currentUser={currentUser}
        pendingCount={pendingDocs.length}
      />

      <div className="main-content">
        <Header
          currentUser={currentUser}
          allUsers={users}
          onSwitchUser={handleSwitchUser}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onOpenStampModal={() => setIsStampModalOpen(true)}
          onOpenIntro={() => setShowIntro(true)}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              documents={documents}
              onSelectDocument={setSelectedDocument}
              onNavigateTab={(tab) => {
                if (tab === 'new-doc') handleStartNewDocument('LEAVE');
                else setActiveTab(tab);
              }}
              onStartNewDocument={handleStartNewDocument}
            />
          )}

          {activeTab === 'inbox-pending' && (
            <DocumentList
              documents={pendingDocs}
              title="내 결재 대기함 (승인 필요)"
              currentUser={currentUser}
              onSelectDocument={setSelectedDocument}
            />
          )}

          {activeTab === 'inbox-progress' && (
            <DocumentList
              documents={progressDocs}
              title="내가 기안한 결재 진행함"
              currentUser={currentUser}
              onSelectDocument={setSelectedDocument}
            />
          )}

          {activeTab === 'inbox-approved' && (
            <DocumentList
              documents={approvedDocs}
              title="결재 완료함 (보존 및 출력)"
              currentUser={currentUser}
              onSelectDocument={setSelectedDocument}
            />
          )}

          {activeTab === 'inbox-rejected' && (
            <DocumentList
              documents={rejectedDocs}
              title="반려 문서함"
              currentUser={currentUser}
              onSelectDocument={setSelectedDocument}
            />
          )}

          {activeTab === 'org' && (
            <OrgTree ous={ous} users={users} onRefreshData={refreshAllData} />
          )}

          {activeTab === 'stamps' && (
            <StampCanvas
              currentUser={currentUser}
              onUserUpdated={(updated) => {
                setCurrentUser(updated);
                refreshAllData();
              }}
            />
          )}
        </main>
      </div>

      {isNewDocModalOpen && (
        <NewDocumentModal
          currentUser={currentUser}
          allUsers={users}
          initialCategory={initialDocCategory}
          allDocuments={documents}
          onClose={() => setIsNewDocModalOpen(false)}
          onDocumentCreated={handleDocumentCreated}
        />
      )}

      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          currentUser={currentUser}
          onClose={() => setSelectedDocument(null)}
          onDocumentUpdated={refreshAllData}
        />
      )}

      {isStampModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>내 전자 직인/서명 관리</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsStampModalOpen(false)}>
                닫기
              </button>
            </div>
            <div className="modal-body">
              <StampCanvas
                currentUser={currentUser}
                onUserUpdated={(updated) => {
                  setCurrentUser(updated);
                  refreshAllData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
