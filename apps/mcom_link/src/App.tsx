import { useState } from 'react'
import './App.css'
// Replace these with your actual image paths
import mainMeditation from './assets/rotator.png' 
import secondaryMeditation from './assets/image.jpg'

function App() {
  const [activeTab, setActiveTab] = useState('Home')

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">🌿</div>
          Sarina
        </div>

        <div className="nav-links-container">
          <div className="nav-links">
            {['Home', 'Product', 'Service', 'About'].map((tab) => (
              <button
                key={tab}
                className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="auth-buttons">
          <button className="btn-login">Login</button>
          <button className="btn-signin">Sign in</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        
        {/* Left Side */}
        <section className="hero-left">
          <div className="badge">• meditation</div>
          <h1 className="headline">
            Mindfullness <br />
            <span className="headline-card">
               <span className="icon-circle">🧘</span> More Calm
            </span> <br />
            Meaningful
          </h1>

          <div className="description-container">
            <div className="divider"></div>
            <p className="description">
              We offer a holistic approach to yoga and meditation, blending traditional practices with modern techniques to help you achieve harmony and inner peace.
            </p>
          </div>

          <div className="hero-ctas">
            <button className="btn-primary">Get started</button>
            <button className="btn-outline">Explore</button>
          </div>
        </section>

        {/* Center Visual */}
        <section className="hero-center">
          <div className="main-image-wrapper">
            <img src={secondaryMeditation} alt="Meditation" className="main-img" />
            <div className="floating-tag tag-meditation">Meditation</div>
            <div className="floating-tag tag-mental">Mental Less</div>
            
            <div className="glass-stat-card">
              <h2>+240</h2>
              <p>people improve their mentality here</p>
              <div className="stat-tags">
                <span>• Mental health</span>
                <span>• Mindfulness</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side */}
        <section className="hero-right">
          <div className="offer-header">
            <h3>Explore Our Offerings</h3>
            <p>Whether you're a beginner or an experienced practitioner, our community is here to support your journey.</p>
          </div>

          <div className="side-card">
             <img src={secondaryMeditation} alt="Community" className="side-img" />
             <div className="side-badge">• Community</div>
             <div className="side-glass-card">
                <h2>+240</h2>
                <p>Join our community now and start with Us</p>
             </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App