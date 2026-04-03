import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen, Users, Clock, Monitor, Wifi, Award, ChevronDown, ChevronUp,
  Library, GraduationCap, Search, BarChart3, Shield, Globe, Newspaper,
  FileText, Headphones, Bookmark, Eye, Play, ExternalLink, Mail, Phone,
  MapPin, ScanBarcode, BrainCircuit, Bot, Sparkles, Bell, CalendarCheck,
  MessageSquare, Lightbulb, TrendingUp, Star, QrCode, Mic, Languages,
  Accessibility, BookMarked, ListChecks
} from 'lucide-react';
import famtLogo from '@/assets/famt-logo.png';
import librarianImg from '@/assets/librarian.png';
import libraryStudentsImg from '@/assets/library-students.png';

const libraryResources = [
  { label: 'Books (Titles)', value: '7,496' },
  { label: 'Books (Volumes)', value: '37,419' },
  { label: 'Periodicals', value: '8' },
  { label: 'Non-Book Material', value: '4,418' },
  { label: 'Bound Volumes', value: '535' },
  { label: 'Theses/Projects', value: '2,464' },
  { label: 'E-Journals', value: '510' },
  { label: 'E-Books', value: '1,028' },
];

const staff = [
  { sr: 1, name: 'Mr. Mahesh V. Bhide', qualification: 'B.Sc, M.Lib', designation: 'Librarian' },
  { sr: 2, name: 'Mr. Vinay S. Keer', qualification: 'B.A, M.Lib', designation: 'Assistant Librarian' },
  { sr: 3, name: 'Mr. Suhas K. Rawanang', qualification: 'B.A, M.Lib', designation: 'Library Assistant' },
  { sr: 4, name: 'Ms. Pratiksha Nevarekar', qualification: '—', designation: 'Library Attendant' },
];

const adminFeatures = [
  { icon: ScanBarcode, title: 'Barcode Scanning', desc: 'Scan book barcodes to auto-fill details during issue, return and cataloguing' },
  { icon: BrainCircuit, title: 'AI Book Recommendations', desc: 'AI suggests books to purchase based on demand trends and curriculum needs' },
  { icon: Bot, title: 'AI Chatbot Assistant', desc: 'Amazon Lex powered chatbot handles student queries 24/7 automatically' },
  { icon: TrendingUp, title: 'Predictive Analytics', desc: 'AI predicts overdue risks and peak usage times for better planning' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Automated WhatsApp & email reminders via n8n webhooks for due dates' },
  { icon: BarChart3, title: 'Usage Analytics Dashboard', desc: 'Real-time charts showing borrowing trends, popular genres and peak hours' },
  { icon: Shield, title: 'Plagiarism Detection', desc: 'Integrated DrillBeat Pro anti-plagiarism checking for thesis submissions' },
  { icon: ListChecks, title: 'Bulk Operations', desc: 'Bulk issue, return and catalogue books with CSV import/export' },
  { icon: CalendarCheck, title: 'Smart Due Date Calculation', desc: 'AI adjusts due dates based on exam schedules and holidays automatically' },
  { icon: QrCode, title: 'QR Code Generation', desc: 'Auto-generate QR codes for book labels, shelf markers and membership cards' },
];

const studentFeatures = [
  { icon: Search, title: 'AI-Powered Book Search', desc: 'Natural language search — ask "books about machine learning" and get results' },
  { icon: Sparkles, title: 'Personalized Recommendations', desc: 'AI recommends books based on your borrowing history and course enrolled' },
  { icon: Bookmark, title: 'Digital Bookmarks & Notes', desc: 'Save bookmarks, highlights and notes for e-books and e-journals' },
  { icon: MessageSquare, title: 'Book Reviews & Ratings', desc: 'Rate and review books to help fellow students discover great reads' },
  { icon: Lightbulb, title: 'Study Room Booking', desc: 'Reserve library study rooms and discussion spaces online' },
  { icon: Languages, title: 'Multi-Language Support', desc: 'Browse the catalogue in English, Hindi and Marathi' },
  { icon: Mic, title: 'Voice Search', desc: 'Search for books using voice commands for hands-free browsing' },
  { icon: BookMarked, title: 'Reading Goals & Streaks', desc: 'Set monthly reading goals, track streaks and earn achievement badges' },
  { icon: Star, title: 'Wishlist & Availability Alerts', desc: 'Add books to wishlist and get notified when they become available' },
  { icon: Accessibility, title: 'Accessibility Mode', desc: 'High contrast, text-to-speech and screen reader optimized interface' },
];

const facilities = [
  'WebOPAC (Online Public Access Catalogue)',
  'Digital Library — Springer, NDL, NPTEL',
  'E-Journals & E-Books Access',
  'Competitive Examination Section (GATE, GRE, CAT, UPSC)',
  'Book Bank for SC/ST Students',
  'Internet & WiFi Access',
  'Multimedia / CD-ROM Collection',
  'Online Question Papers',
  'Plagiarism Checking (DrillBeat Pro)',
  'Newspaper Clipping Service',
  'Current Awareness Services',
  'Information Literacy Program',
  'Overnight Issue Facility',
  'Reservation Facility',
  'Divyang Student Support',
];

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 bg-card text-foreground font-semibold text-left hover:bg-secondary transition-colors">
        {title}
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 bg-background border-t border-border">{children}</div>}
    </div>
  );
};

const Index: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/student');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={famtLogo} alt="FAMT Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">FAMT Library</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#resources" className="hover:text-foreground transition-colors">Resources</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#facilities" className="hover:text-foreground transition-colors">Facilities</a>
            <a href="#staff" className="hover:text-foreground transition-colors">Staff</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground hidden lg:inline-block">Hi, {user.name}</span>
                <Link to={user.role === 'admin' ? '/admin' : '/student'} className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity flex items-center gap-2">
                  Dashboard
                </Link>
                <button onClick={logout} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-accent hover:underline">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground mb-6">
                <Library className="h-4 w-4" />
                Finolex Academy of Management & Technology
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight mb-6">
                Your Gateway to<br />
                <span className="text-accent">Knowledge & Learning</span>
              </h2>
              <p className="text-muted-foreground text-base lg:text-lg mb-8 max-w-lg">
                An ocean of knowledge with 37,419+ volumes, digital resources, e-journals, and AI-powered tools — all designed to empower your academic journey.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={user ? (user.role === 'admin' ? '/admin' : '/student') : '/register'} className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90 transition-opacity">
                  <GraduationCap className="h-5 w-5" /> {user ? 'Go to Dashboard' : 'Get Started'}
                </Link>
                <a href="#about" className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-md font-medium hover:bg-secondary transition-colors">
                  <BookOpen className="h-5 w-5" /> Explore Library
                </a>
              </div>
            </div>
            <div className="relative">
              <img src={libraryStudentsImg} alt="Students reading in FAMT Library" className="rounded-lg border border-border w-full object-cover max-h-[400px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-secondary border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: '37,419+', label: 'Book Volumes' },
              { value: '510', label: 'E-Journals' },
              { value: '1,028', label: 'E-Books' },
              { value: '2,464', label: 'Theses & Projects' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-semibold text-accent">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">About the Library</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Finolex Academy Library occupies a place of pride in FAMT and is an essential component of the institute's outstanding education mission.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Eye className="h-5 w-5 text-accent" /> Vision</h4>
            <p className="text-muted-foreground text-sm">
              To empower teaching – learning and research with appropriate collection and dissemination of the knowledge.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="h-5 w-5 text-accent" /> Mission</h4>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li><strong>M1:</strong> To develop state of art library facilities enabling effective dissemination of appropriate knowledge.</li>
              <li><strong>M2:</strong> To offer comprehensive online and offline resources and services in support of teaching, learning and research.</li>
              <li><strong>M3:</strong> To promote ethical and societal practices among users.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Finolex Academy's library is need-based, qualitative and has up-to-date collection of books and journals catalogued to meet the information needs of students and faculty members. It is facilitated with reference services, competitive examination section, a Book Bank facility for SC/ST students and Current Awareness Service. It offers online information retrieval facility through a 100 Mbps leased line connection, computerized catalogue search via OPAC, Multimedia Library facility (Ekalavya Self Learning Centre), E-journals, E-books and online question paper facility.
          </p>
        </div>
      </section>

      {/* Resources Table */}
      <section id="resources" className="bg-secondary border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8 text-center">Library Resources</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {libraryResources.map((r) => (
              <div key={r.label} className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-xl font-semibold text-accent">{r.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> Library Timings</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between py-2 border-b border-border">
                <span>Monday – Saturday</span><span className="font-medium text-foreground">9:00 AM – 5:15 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>During Examinations</span><span className="font-medium text-foreground">9:00 AM – 8:30 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>2nd & 4th Saturdays</span><span className="font-medium text-foreground">10:00 AM – 5:30 PM</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Sunday</span><span className="font-medium text-foreground">10:00 AM – 1:30 PM</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">Issue/Return: Mon–Sat, 10:00 AM – 4:30 PM</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /> Borrowing Rules</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between py-2 border-b border-border">
                <span>Students</span><span className="font-medium text-foreground">5 books / 15 days</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Faculty</span><span className="font-medium text-foreground">10 books / semester</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Staff</span><span className="font-medium text-foreground">5 books / semester</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Overnight Issue</span><span className="font-medium text-foreground">2 books after 4:30 PM</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">Reference books, encyclopaedias and bound journals are non-issuable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Video */}
      <section className="bg-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">Library Tour</h3>
          <p className="text-muted-foreground mb-8">Take a virtual tour of our library facilities</p>
          <div className="aspect-video rounded-lg overflow-hidden border border-border">
            <iframe
              src="https://www.youtube.com/embed/6DfKdd33UXw"
              title="FAMT Library Tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* AI Features — Admin */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">AI-Powered Admin Features</h3>
          <p className="text-muted-foreground">Smart tools for efficient library management</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {adminFeatures.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-lg p-4 hover:border-accent transition-colors">
              <f.icon className="h-8 w-8 text-accent mb-3" />
              <h4 className="font-semibold text-foreground text-sm mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Features — Student */}
      <section className="bg-secondary border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">Smart Student Features</h3>
            <p className="text-muted-foreground">Personalized tools to enhance your learning experience</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {studentFeatures.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-lg p-4 hover:border-accent transition-colors">
                <f.icon className="h-8 w-8 text-accent mb-3" />
                <h4 className="font-semibold text-foreground text-sm mb-1">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Accordion */}
      <section id="facilities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8 text-center">Facilities & Services</h3>
        <div className="max-w-3xl mx-auto space-y-3">
          <AccordionItem title="Library Facilities" defaultOpen>
            <ul className="grid sm:grid-cols-2 gap-2">
              {facilities.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title="Digital Library">
            <div className="text-sm text-muted-foreground space-y-3">
              <p><strong>Springer:</strong> 510 e-journals & 920 e-books covering three subject collections.</p>
              <p><strong>Videeya Engineering Collection:</strong> 36 book titles & 108 volumes.</p>
              <p><strong>NDL (National Digital Library of India):</strong> Single-window search for digital contents including books, articles, videos, audios and thesis.</p>
              <p><strong>NPTEL:</strong> Video lectures from IITs and IISc, organized branch, semester & subject wise through library webpage.</p>
            </div>
          </AccordionItem>
          <AccordionItem title="Membership & Circulation">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Every bonafide student is entitled to become a member. Open access system is practiced. Borrowing is allowed only to registered members against their membership card.</p>
              <p>Books from the Reference section must be referred in the library only. Reservation facility is available for books in circulation.</p>
            </div>
          </AccordionItem>
          <AccordionItem title="Quick Links">
            <div className="flex flex-wrap gap-3">
              <a href="https://forms.gle/5gkcSQ5jhPr3kPZS9" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <FileText className="h-4 w-4" /> Book Request Form <ExternalLink className="h-3 w-3" />
              </a>
              <a href="https://forms.gle/e8Ukys59ady9XbhMA" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <FileText className="h-4 w-4" /> Library Feedback Form <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </AccordionItem>
        </div>
      </section>

      {/* Librarian's Message */}
      <section className="bg-secondary border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8 text-center">Librarian's Message</h3>
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-lg p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img src={librarianImg} alt="Mr. Mahesh V. Bhide — Librarian" className="w-24 h-28 object-cover rounded-lg border border-border flex-shrink-0" />
              <div>
                <blockquote className="text-muted-foreground text-sm leading-relaxed italic mb-4">
                  "Central library provides the resources and study environment needed for the teaching-learning community. It preserves wonderful treasures ranging from Books, Print Journals, Dissertation/Thesis, Newspapers, audio-visual material, e-journals, and NPTEL Video lectures. Library staff happily assist all users in finding books, searching online resources and accessing other facilities. I am sure you will consider the Library as an ideal starting point for all your academic endeavours, research activities and personal growth. Welcome to the library and wish you a happy learning experience."
                </blockquote>
                <p className="font-semibold text-foreground">Mahesh V. Bhide</p>
                <p className="text-xs text-muted-foreground">Librarian, FAMT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staff */}
      <section id="staff" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8 text-center">Library Staff</h3>
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Sr.</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Qualification</th>
                <th className="px-4 py-3 text-left font-medium">Designation</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.sr} className="border-t border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{s.sr}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.qualification}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.designation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-3">Ready to explore the library?</h3>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Register now to browse the catalogue, borrow books, access e-resources and get AI-powered recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="px-6 py-3 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90 transition-opacity">
              Student Registration
            </Link>
            <Link to="/login" className="px-6 py-3 border border-primary-foreground/30 text-primary-foreground rounded-md font-medium hover:bg-primary-foreground/10 transition-colors">
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src={famtLogo} alt="FAMT" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-foreground text-sm">FAMT Library</span>
              </div>
              <p className="text-xs text-muted-foreground">Finolex Academy of Management & Technology, Ratnagiri, Maharashtra</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Contact</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Globe className="h-3 w-3" /> <a href="https://www.famt.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-accent">www.famt.ac.in</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Quick Links</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><Link to="/login" className="hover:text-accent">Login</Link></p>
                <p><Link to="/register" className="hover:text-accent">Register</Link></p>
                <p><a href="https://forms.gle/5gkcSQ5jhPr3kPZS9" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Book Request</a></p>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} FAMT Library Management System. सिद्धिभवति कर्मजा
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
