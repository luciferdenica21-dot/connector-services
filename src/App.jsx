import './i18n';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services, { ServiceSeoPage } from './components/Services';
import Contact from './components/Contact';

function App() {
  const MainLayout = ({ children, showContact = false }) => (
    <div className="min-h-screen flex flex-col" data-section="site">
      <Navbar />
      <main className="flex-grow pb-10 md:pb-9">
        {children}
        {showContact && <Contact />}
      </main>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <MainLayout showContact={true}>
              <Hero />
            </MainLayout>
          } 
        />
        <Route
          path="/services"
          element={
            <MainLayout showContact={true}>
              <Services />
            </MainLayout>
          }
        />
        <Route
          path="/services/:slug"
          element={
            <MainLayout showContact={true}>
              <ServiceSeoPage />
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
