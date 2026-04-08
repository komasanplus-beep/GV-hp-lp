import './App.css'
import MasterLPTemplates from './pages/MasterLPTemplates'
import MasterAIControl from './pages/MasterAIControl'
import MasterPlanLimits from './pages/MasterPlanLimits'
import SiteView from './pages/SiteView'
import LPView from './pages/LPView'
import BlogPage from './pages/BlogPage'
import AdminInquiries from './pages/AdminInquiries'
import AdminServices from './pages/AdminServices'
import AdminLPCodeCreator from './pages/AdminLPCodeCreator'
import SiteHeaderSettings from './pages/SiteHeaderSettings'
import SiteFooterSettings from './pages/SiteFooterSettings'
import SiteSeoSettings from './pages/SiteSeoSettings'
import ServiceDetail from './pages/ServiceDetail.jsx'
import SiteCreateWizard from './pages/SiteCreateWizard'
import AdminPostList from './pages/AdminPostList'
import AdminPostManager from './pages/AdminPostManager.jsx'
import AdminPostEdit from './pages/AdminPostEdit'
import AdminPostCategories from './pages/AdminPostCategories'
import AdminPostTags from './pages/AdminPostTags'
import PostListPage from './pages/PostListPage'
import PostDetailPage from './pages/PostDetailPage.jsx'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
    ['/SiteView', '/site/', '/lp/', '/BlogPage'].some(p => location.startsWith(p)) ||
    search.includes('site_id=') || // SiteView query
    search.includes('slug=');       // LPView query
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings (only for protected routes)
  if (!isPublicRoute && isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (only for protected routes)
  if (!isPublicRoute && authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public Routes - no authentication required */}
      <Route path="/SiteView" element={<SiteView />} />
      <Route path="/site/:siteId" element={<SiteView />} />
      <Route path="/lp/:slug" element={<LPView />} />
      <Route path="/BlogPage" element={<BlogPage />} />
      
      {/* New Site Creation Wizard - protected */}
      <Route path="/create-site" element={<SiteCreateWizard />} />
      
      <Route path="*" element={<PageNotFound />} />
      
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
      <Route path="/AdminInquiries" element={<AdminInquiries />} />
      <Route path="/AdminServices" element={<AdminServices />} />
      <Route path="/AdminLPCodeCreator" element={<AdminLPCodeCreator />} />
      <Route path="/SiteHeaderSettings" element={<SiteHeaderSettings />} />
      <Route path="/SiteFooterSettings" element={<SiteFooterSettings />} />
      <Route path="/SiteSeoSettings" element={<SiteSeoSettings />} />
      <Route path="/service/:serviceId" element={<ServiceDetail />} />
      <Route path="/AdminPostList" element={<AdminPostList />} />
      <Route path="/AdminPostManager" element={<AdminPostManager />} />
      <Route path="/AdminPostEdit" element={<AdminPostEdit />} />
      <Route path="/AdminPostCategories" element={<AdminPostCategories />} />
      <Route path="/AdminPostTags" element={<AdminPostTags />} />
      <Route path="/posts" element={<PostListPage />} />
      <Route path="/post/:slug" element={<PostDetailPage />} />
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