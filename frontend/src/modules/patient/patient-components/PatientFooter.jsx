import React from 'react'
import { IoLogoFacebook, IoLogoTwitter, IoLogoLinkedin, IoLogoInstagram, IoCallOutline, IoMailOutline } from 'react-icons/io5'

const PatientFooter = () => {
  return (
    <footer className="bg-[#0b3b5b] text-white pt-8 pb-6 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">Follow Us:</span>
            <div className="flex items-center gap-3">
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <IoLogoFacebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <IoLogoTwitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <IoLogoLinkedin className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <IoLogoInstagram className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-white/80 font-medium">
            <div className="flex items-center gap-2">
              <IoCallOutline className="h-4 w-4 text-white/60" />
              <span>Support: +1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <IoMailOutline className="h-4 w-4 text-white/60" />
              <span>help@heallyn.com</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
        <p>© 2026 Heallyn. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default PatientFooter
