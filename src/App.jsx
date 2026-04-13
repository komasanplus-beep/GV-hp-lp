import React, { useEffect, useRef } from 'react'
import './App.css'
import MasterAnnouncements from './pages/MasterAnnouncements'
import MasterAnnouncementEdit from './pages/MasterAnnouncementEdit'
import AdminInquiryAISettings from './pages/AdminInquiryAISettings'
import MasterLPTemplates from './pages/MasterLPTemplates'
import MasterAIControl from './pages/MasterAIControl'
import MasterPlanLimits from './pages/MasterPlanLimits'
import MasterBillingSettings from './pages/MasterBillingSettings'
import MasterBillingPlans from './pages/MasterBillingPlans'
import MasterSubscriptionManagement from './pages/MasterSubscriptionManagement'
import SiteView from './pages/SiteView'
import LPView from './pages/LPView'
import AdminInquiries from './pages/AdminInquiries'
import AdminServices from './pages/AdminServices'
import AdminLPCodeCreator from './pages/AdminLPCodeCreator'
import AdminLPList from './pages/AdminLPList'
import SiteHeaderSettings from './pages/SiteHeaderSettings'
import SiteFooterSettings from './pages/SiteFooterSettings'
import SiteSeoSettings from './pages/SiteSeoSettings'
import ServiceDetail from './pages/ServiceDetail.jsx'
import SiteCreateWizard from './pages/SiteCreateWizard'
import AdminPostManager from './pages/AdminPostManager.jsx'
import AdminPostEdit from './pages/AdminPostEdit'
import AdminPostCategories from './pages/AdminPostCategories'
import AdminPostTags from './pages/AdminPostTags'
import PostListPage from './pages/PostListPage'
import PostDetailPage from './pages/PostDetailPage.jsx'
import AdminLPAnalytics from './pages/AdminLPAnalytics'
import AdminSiteAnalytics from './pages/AdminSiteAnalytics'
import AdminNoticeManager from './pages/AdminNoticeManager'
import AdminInquiryManager from './pages/AdminInquiryManager'
import UserNoticeList from './pages/UserNoticeList'
import UserInquiryList from './pages/UserInquiryList'
import UserQAPage from './pages/UserQAPage'
import PricingPage from './components/plan/PricingPage'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const location = window.location.pathname;
  const search = window.location.search;
  const isPublicRoute = 
    ['/SiteView', '/site/', '/lp/'].some(p => location.startsWith(p)) ||
    search.includes('site_id=') || // SiteView query
    search.includes('slug=');       // LPView query
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const hasRedirectedRef = useRef(false);

  // [FIXED] 認証エラー時のリダイレクトを useEffect で1回だけ実行（hasRedirectedRef で保護）
  useEffect(() => {
    if (!isPublicRoute && authError?.type === 'auth_required' && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigateToLogin();
    }
  }, [authError?.type, isPublicRoute, navigateToLogin]);

  // ページ遷移時に redirect フラグをリセット（ブラウザ戻るボタン対応）
  useEffect(() => {
    if (isPublicRoute || !authError?.type) {
      hasRedirectedRef.current = false;
    }
  }, [isPublicRoute, authError?.type]);

  // Show loading spinner while checking app public settings (only for protected routes)
  if (!isPublicRoute && isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // [FIXED] authError 処理は useEffect で実行済み（render 中の実行は削除）
  // ここでは user_not_registered エラーのみを同期で表示
  if (!isPublicRoute && authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
  <Routes>
    {/* Public Routes - no authentication required */}
    <Route path="/SiteView" element={<SiteView />} />
    <Route path="/site/:siteId" element={<SiteView />} />
    <Route path="/lp/:slug" element={<LPView />} />

    {/* New Site Creation Wizard - protected */}
    <Route path="/create-site" element={<SiteCreateWizard />} />

    {/* Protected Routes */}
    <Route path="/" element={
      <LayoutWrapper currentPageName={mainPageKey}>
        <MainPage />
      </LayoutWrapper>
    } />
    {Object.entries(Pages).map(([path, Page]) => (
      <Route
        key={path}
        path={`/${path}`}
        element={
          <LayoutWrapper currentPageName={path}>
            <Page />
          </LayoutWrapper>
        }
      />
    ))}
    <Route path="/MasterLPTemplates" element={<MasterLPTemplates />} />
    <Route path="/MasterAIControl" element={<MasterAIControl />} />
    <Route path="/MasterPlanLimits" element={<MasterPlanLimits />} />
    <Route path="/MasterBillingSettings" element={<MasterBillingSettings />} />
    <Route path="/MasterBillingPlans" element={<MasterBillingPlans />} />
    <Route path="/MasterSubscriptionManagement" element={<MasterSubscriptionManagement />} />
    <Route path="/AdminInquiries" element={<AdminInquiries />} />
    <Route path="/AdminServices" element={<AdminServices />} />
    <Route path="/AdminLPCodeCreator" element={<AdminLPCodeCreator />} />
    <Route path="/AdminLPList" element={<AdminLPList />} />
    {/* Redirect legacy LP AI generation routes to LP management */}
    <Route path="/AdminLPGenerate" element={<Navigate to="/AdminLPList" replace />} />
    <Route path="/admin/lp-ai" element={<Navigate to="/AdminLPList" replace />} />
    <Route path="/admin/lp/ai" element={<Navigate to="/AdminLPList" replace />} />
    <Route path="/SiteHeaderSettings" element={<SiteHeaderSettings />} />
    <Route path="/SiteFooterSettings" element={<SiteFooterSettings />} />
    <Route path="/SiteSeoSettings" element={<SiteSeoSettings />} />
    <Route path="/service/:serviceId" element={<ServiceDetail />} />
    <Route path="/AdminPostManager" element={<AdminPostManager />} />
    <Route path="/AdminPostEdit" element={<AdminPostEdit />} />
    <Route path="/AdminPostCategories" element={<AdminPostCategories />} />
    <Route path="/AdminPostTags" element={<AdminPostTags />} />
    <Route path="/AdminLPAnalytics" element={<AdminLPAnalytics />} />
    <Route path="/AdminSiteAnalytics" element={<AdminSiteAnalytics />} />
    <Route path="/AdminNoticeManager" element={<AdminNoticeManager />} />
    <Route path="/AdminInquiryManager" element={<AdminInquiryManager />} />
    <Route path="/Pricing" element={<PricingPage />} />
    <Route path="/posts" element={<PostListPage />} />
    <Route path="/post/:slug" element={<PostDetailPage />} />
    <Route path="/MyNotices" element={<UserNoticeList />} />
    <Route path="/MyInquiries" element={<UserInquiryList />} />
    <Route path="/UserQAPage" element={<UserQAPage />} />
    <Route path="/MasterAnnouncements" element={<MasterAnnouncements />} />
    <Route path="/MasterAnnouncementEdit" element={<MasterAnnouncementEdit />} />
    <Route path="/AdminInquiryAISettings" element={<AdminInquiryAISettings />} />

    <Route path="*" element={<PageNotFound />} />
  </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App