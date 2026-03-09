/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminABTest from './pages/AdminABTest';
import AdminAIGenerate from './pages/AdminAIGenerate';
import AdminBlog from './pages/AdminBlog';
import AdminBookings from './pages/AdminBookings';
import AdminContent from './pages/AdminContent';
import AdminDomainSettings from './pages/AdminDomainSettings';
import AdminGuests from './pages/AdminGuests';
import AdminLPAnalytics from './pages/AdminLPAnalytics';
import AdminLPEditor from './pages/AdminLPEditor';
import AdminLPGenerate from './pages/AdminLPGenerate';
import AdminLPList from './pages/AdminLPList';
import AdminRooms from './pages/AdminRooms';
import AdminSettings from './pages/AdminSettings';
import AdminSiteList from './pages/AdminSiteList';
import BlogPage from './pages/BlogPage';
import BlogPost from './pages/BlogPost';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import LPView from './pages/LPView';
import MasterAIKnowledge from './pages/MasterAIKnowledge';
import MasterAISettings from './pages/MasterAISettings';
import MasterDashboard from './pages/MasterDashboard';
import MasterDomainList from './pages/MasterDomainList';
import MasterFeatureControl from './pages/MasterFeatureControl';
import MasterLPList from './pages/MasterLPList';
import MasterPlans from './pages/MasterPlans';
import MasterSiteList from './pages/MasterSiteList';
import MasterSystemLogs from './pages/MasterSystemLogs';
import MasterTemplates from './pages/MasterTemplates';
import MasterUsers from './pages/MasterUsers';
import SeoSettings from './pages/SeoSettings';
import SiteBlockEditor from './pages/SiteBlockEditor';
import SitePageManager from './pages/SitePageManager';
import UserDashboard from './pages/UserDashboard';


export const PAGES = {
    "AdminABTest": AdminABTest,
    "AdminAIGenerate": AdminAIGenerate,
    "AdminBlog": AdminBlog,
    "AdminBookings": AdminBookings,
    "AdminContent": AdminContent,
    "AdminDomainSettings": AdminDomainSettings,
    "AdminGuests": AdminGuests,
    "AdminLPAnalytics": AdminLPAnalytics,
    "AdminLPEditor": AdminLPEditor,
    "AdminLPGenerate": AdminLPGenerate,
    "AdminLPList": AdminLPList,
    "AdminRooms": AdminRooms,
    "AdminSettings": AdminSettings,
    "AdminSiteList": AdminSiteList,
    "BlogPage": BlogPage,
    "BlogPost": BlogPost,
    "Dashboard": Dashboard,
    "Home": Home,
    "LPView": LPView,
    "MasterAIKnowledge": MasterAIKnowledge,
    "MasterAISettings": MasterAISettings,
    "MasterDashboard": MasterDashboard,
    "MasterDomainList": MasterDomainList,
    "MasterFeatureControl": MasterFeatureControl,
    "MasterLPList": MasterLPList,
    "MasterPlans": MasterPlans,
    "MasterSiteList": MasterSiteList,
    "MasterSystemLogs": MasterSystemLogs,
    "MasterTemplates": MasterTemplates,
    "MasterUsers": MasterUsers,
    "SeoSettings": SeoSettings,
    "SiteBlockEditor": SiteBlockEditor,
    "SitePageManager": SitePageManager,
    "UserDashboard": UserDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};