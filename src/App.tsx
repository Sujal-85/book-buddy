import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute, AdminRoute, StudentRoute } from "@/routes/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminBooks from "@/pages/admin/Books";
import AdminMembers from "@/pages/admin/Members";
import IssueBook from "@/pages/admin/IssueBook";
import ReturnBook from "@/pages/admin/ReturnBook";
import Overdue from "@/pages/admin/Overdue";
import AdminSettings from "@/pages/admin/Settings";
import BarcodeScanner from "@/pages/admin/BarcodeScanner";
import AIAnalytics from "@/pages/admin/AIAnalytics";
import DamageDetection from "@/pages/admin/DamageDetection";
import FineCalculator from "@/pages/admin/FineCalculator";
import AICataloging from "@/pages/admin/AICataloging";
import BulkImport from "@/pages/admin/BulkImport";
import StudentAnalytics from "@/pages/admin/StudentAnalytics";
import SmartNotifications from "@/pages/admin/SmartNotifications";
import AIReports from "@/pages/admin/AIReports";
import ShelfManagement from "@/pages/admin/ShelfManagement";

// Student Pages
import StudentHome from "@/pages/student/Home";
import BrowseBooks from "@/pages/student/BrowseBooks";
import MyBooks from "@/pages/student/MyBooks";
import BorrowHistory from "@/pages/student/History";
import StudentProfile from "@/pages/student/Profile";
import AIRecommendations from "@/pages/student/AIRecommendations";
import VoiceSearch from "@/pages/student/VoiceSearch";
import ReadingGoals from "@/pages/student/ReadingGoals";
import StudyCompanion from "@/pages/student/StudyCompanion";
import BookReviews from "@/pages/student/BookReviews";
import Wishlist from "@/pages/student/Wishlist";
import QRBorrow from "@/pages/student/QRBorrow";
import ReadingStats from "@/pages/student/ReadingStats";
import AvailabilityAlerts from "@/pages/student/AvailabilityAlerts";
import AISummary from "@/pages/student/AISummary";

import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-sm',
            duration: 3000,
          }}
        />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AppLayout /></AdminRoute></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="books" element={<AdminBooks />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="issue" element={<IssueBook />} />
              <Route path="return" element={<ReturnBook />} />
              <Route path="overdue" element={<Overdue />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="scanner" element={<BarcodeScanner />} />
              <Route path="analytics" element={<AIAnalytics />} />
              <Route path="damage" element={<DamageDetection />} />
              <Route path="fines" element={<FineCalculator />} />
              <Route path="cataloging" element={<AICataloging />} />
              <Route path="import" element={<BulkImport />} />
              <Route path="student-analytics" element={<StudentAnalytics />} />
              <Route path="notifications" element={<SmartNotifications />} />
              <Route path="reports" element={<AIReports />} />
              <Route path="shelves" element={<ShelfManagement />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute><StudentRoute><AppLayout /></StudentRoute></ProtectedRoute>}>
              <Route index element={<StudentHome />} />
              <Route path="books" element={<BrowseBooks />} />
              <Route path="mybooks" element={<MyBooks />} />
              <Route path="history" element={<BorrowHistory />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="recommendations" element={<AIRecommendations />} />
              <Route path="voice-search" element={<VoiceSearch />} />
              <Route path="goals" element={<ReadingGoals />} />
              <Route path="companion" element={<StudyCompanion />} />
              <Route path="reviews" element={<BookReviews />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="qr-borrow" element={<QRBorrow />} />
              <Route path="stats" element={<ReadingStats />} />
              <Route path="alerts" element={<AvailabilityAlerts />} />
              <Route path="summary" element={<AISummary />} />
            </Route>

            {/* Landing page */}
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatbotWidget />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
