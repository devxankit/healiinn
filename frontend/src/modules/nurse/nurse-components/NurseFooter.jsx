import { IoLogoFacebook, IoLogoTwitter, IoLogoLinkedin, IoLogoInstagram } from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'

const NurseFooter = () => {
  return (
    <footer className="hidden lg:block bg-white border-t border-slate-100 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-6">
            <img
              src={healinnLogo}
              alt="Healinn"
              className="h-6 w-auto object-contain opacity-80"
            />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} Healinn. All rights reserved.
            </p>
          </div>

          {/* Support Info */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Support Services</p>
              <p className="text-[11px] font-bold text-slate-600">support@heallyn.com</p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[IoLogoFacebook, IoLogoTwitter, IoLogoLinkedin, IoLogoInstagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-[#11496c] hover:text-white transition-all duration-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default NurseFooter
