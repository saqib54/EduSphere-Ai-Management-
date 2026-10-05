const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../src/App.jsx');
let src = fs.readFileSync(appPath, 'utf8');
const lines = src.split('\n');

// Replacement block: SplashScreen + new PublicPortal (replaces lines index 2991..3071 inclusive)
const newBlock = `// ================================================================================
// SPLASH SCREEN
// ================================================================================
function SplashScreen() {
  return (
    <div className="splash-overlay">
      <div className="splash-card">
        <div className="splash-logo-ring">
          <BookOpen size={44} weight="fill" />
        </div>
        <div className="splash-name">Edu<span>Sphere</span></div>
        <div className="splash-tagline">School &amp; College Management System</div>
        <div className="splash-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ================================================================================
// PUBLIC PORTAL
// ================================================================================
function PublicPortal({ onOpenLogin, onOpenAdmission }) {
  return (
    <div className="pub-root">

      <header className="pub-header">
        <div className="pub-brand" onClick={onOpenLogin}>
          <span className="pub-brand-icon"><BookOpen size={22} weight="fill" /></span>
          <span className="pub-brand-name"><b>EduSphere</b><small>School &amp; College</small></span>
        </div>
        <nav className="pub-nav">
          <span onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</span>
          <span onClick={() => document.getElementById("pub-academics")?.scrollIntoView({ behavior: "smooth" })}>Academics</span>
          <span onClick={() => document.getElementById("pub-facilities")?.scrollIntoView({ behavior: "smooth" })}>Facilities</span>
          <span className="pub-nav-admission" onClick={onOpenAdmission}>Online Admission</span>
          <Btn onClick={onOpenLogin}><House size={16} weight="fill" /> Portal Login</Btn>
        </nav>
      </header>

      <section className="pub-hero">
        <div className="pub-hero-content">
          <span className="pub-hero-eyebrow"><Star size={12} weight="fill" /> ESTABLISHED 2012 &middot; ISLAMABAD / SIALKOT CAMPUS</span>
          <h1>Excellence in Education,<br /><span className="accent">Character &amp; Innovation</span></h1>
          <p>Empowering the next generation with modern academics, comprehensive digital portals, science labs, and state-of-the-art co-curricular activities across Pakistan.</p>
          <div className="pub-hero-cta">
            <button className="primary-button" onClick={onOpenAdmission}><UserPlus size={19} weight="bold" /> Apply for Admission 2026-27</button>
            <button className="secondary-button" onClick={onOpenLogin}><House size={19} weight="bold" /> Student / Staff Portal Login</button>
          </div>
          <div className="pub-hero-stats">
            <div className="pub-hero-stat"><strong>3,200+</strong><span>Enrolled Students</span></div>
            <div className="pub-hero-stat"><strong>120+</strong><span>Qualified Teachers</span></div>
            <div className="pub-hero-stat"><strong>95%</strong><span>Board Pass Rate</span></div>
            <div className="pub-hero-stat"><strong>12</strong><span>Years of Excellence</span></div>
          </div>
        </div>
      </section>

      <section className="pub-section" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <div className="pub-stats-row">
          <div className="pub-stat-card tone-blue"><strong>3,200+</strong><span>Total Students</span></div>
          <div className="pub-stat-card tone-purple"><strong>120+</strong><span>Teaching Staff</span></div>
          <div className="pub-stat-card tone-green"><strong>95%</strong><span>Annual Pass Rate</span></div>
          <div className="pub-stat-card tone-orange"><strong>12 Yrs</strong><span>Established Excellence</span></div>
        </div>
      </section>

      <section className="pub-section pub-section-alt" id="pub-academics">
        <div className="pub-section-title">
          <span className="pub-pill">ACADEMICS</span>
          <h2>Our Academic Programs</h2>
          <p>Structured curriculum conforming to FBISE &amp; Punjab Board Standards.</p>
        </div>
        <div className="pub-grid-3">
          <div className="pub-card">
            <div className="pub-card-icon"><BookOpen size={26} /></div>
            <h3>Junior School (Grades 1-5)</h3>
            <p>Activity-based conceptual learning, English fluency, Mathematics foundations, and Islamic studies in a nurturing environment.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Buildings size={26} /></div>
            <h3>Middle School (Grades 6-8)</h3>
            <p>Comprehensive Science, Computer Studies, Urdu &amp; English languages, and advanced analytical skill development.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><GraduationCap size={26} /></div>
            <h3>Secondary &amp; HSSC (9-12)</h3>
            <p>Pre-Medical, Pre-Engineering, Computer Science, and Humanities with expert board exam preparation and top results.</p>
          </div>
        </div>
      </section>

      <section className="pub-section" id="pub-facilities">
        <div className="pub-section-title">
          <span className="pub-pill">FACILITIES</span>
          <h2>State-of-the-Art Facilities</h2>
          <p>Everything your child needs for academic excellence, physical development, and a safe campus experience.</p>
        </div>
        <div className="pub-grid-3">
          <div className="pub-card">
            <div className="pub-card-icon"><Book size={26} /></div>
            <h3>Digital Library</h3>
            <p>Over 5,000 reference books, journals, e-books, and quiet research study bays with high-speed internet.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Globe size={26} /></div>
            <h3>Modern Computer Labs</h3>
            <p>Latest hardware, broadband connectivity, and certified IT instructors delivering Microsoft &amp; programming courses.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Bus size={26} /></div>
            <h3>Air-Conditioned Fleet</h3>
            <p>GPS-monitored campus transport covering all major urban routes with dedicated female attendants on every bus.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><ShieldCheck size={26} /></div>
            <h3>Safe &amp; Secure Campus</h3>
            <p>24/7 CCTV surveillance, biometric access control, guarded entry points, and dedicated female security personnel.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><ChartBar size={26} /></div>
            <h3>Smart Classrooms</h3>
            <p>Digital projectors, interactive whiteboards, and a modern LMS-integrated teaching environment in every class.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Star size={26} /></div>
            <h3>Sports &amp; Co-Curricular</h3>
            <p>Cricket, basketball, athletics, science olympiad, debate competitions, and annual sports gala for all students.</p>
          </div>
        </div>
      </section>

      <div className="pub-cta-banner">
        <h2>Ready to Join EduSphere?</h2>
        <p>Applications for the 2026-27 academic session are now open. Secure your child's future today.</p>
        <button className="primary-button" onClick={onOpenAdmission}><UserPlus size={20} weight="bold" /> Apply for Online Admission</button>
      </div>

      <footer className="pub-footer">
        <div className="pub-footer-brand">
          <span style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)', display: 'grid', placeItems: 'center', color: 'white', flexShrink: 0 }}>
            <BookOpen size={18} weight="fill" />
          </span>
          <b>EduSphere</b>
        </div>
        <div className="pub-footer-links">
          <span onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</span>
          <span onClick={() => document.getElementById("pub-academics")?.scrollIntoView({ behavior: "smooth" })}>Academics</span>
          <span onClick={onOpenAdmission}>Admissions</span>
          <span onClick={onOpenLogin}>Staff Login</span>
        </div>
        <span>© 2026 EduSphere School &amp; College. All rights reserved.</span>
      </footer>
    </div>
  );
}`;

// lines 2991 to 3072 (0-based) are the old block
const before = lines.slice(0, 2991).join('\n');
const after  = lines.slice(3073).join('\n');
const newSrc = before + '\n' + newBlock + '\n' + after;

fs.writeFileSync(appPath, newSrc, 'utf8');
console.log('OK. Total lines:', newSrc.split('\n').length);
