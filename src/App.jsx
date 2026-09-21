import './i18n';
import { useState } from 'react' 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services, { ServiceSeoPage } from './components/Services';
import OrderSidebar from './components/OrderSidebar';
import TermsInfo from './components/TermsInfo';

function App() {
  const [isOrderOpen, setIsOrderOpen] = useState(false);

  const MainLayout = ({ children }) => (
    <div className="min-h-screen flex flex-col" data-section="site">
      <Navbar setIsOrderOpen={setIsOrderOpen} />
      <main className="flex-grow pb-10 md:pb-9">
        {children}
      </main>
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-t border-white/5 py-2 md:py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] text-center">
        <span className="text-white/70 text-[10px] tracking-widest uppercase">created by PXD </span><span className="text-[10px] font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400 uppercase">STUDIO</span>
      </footer>
      <OrderSidebar isOrderOpen={isOrderOpen} setIsOrderOpen={setIsOrderOpen} />
      <TermsInfo />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <MainLayout>
              <Hero setIsOrderOpen={setIsOrderOpen} />
            </MainLayout>
          } 
        />
        <Route
          path="/services"
          element={
            <MainLayout>
              <Services setIsOrderOpen={setIsOrderOpen} />
            </MainLayout>
          }
        />
        <Route
          path="/services/:slug"
          element={
            <MainLayout>
              <ServiceSeoPage setIsOrderOpen={setIsOrderOpen} />
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
