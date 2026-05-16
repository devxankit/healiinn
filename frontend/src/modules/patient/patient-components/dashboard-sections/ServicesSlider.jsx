import React from 'react'
import { IoChevronDown } from 'react-icons/io5'

const ServiceCard = ({ title, subtitle, image, gradient, textColor, onClick }) => (
  <div 
    onClick={onClick}
    className="relative p-5 md:p-10 rounded-[32px] overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] active:scale-95 shadow-sm border border-slate-100 h-full flex flex-col justify-center"
    style={{ background: gradient }}
  >
    <div className="relative z-10 space-y-1 md:space-y-1 max-w-[60%] md:max-w-[65%]">
      <h3 className="text-xl md:text-2xl font-black" style={{ color: textColor }}>{title}</h3>
      <p className="text-[10px] md:text-sm font-bold opacity-70" style={{ color: textColor }}>{subtitle}</p>
    </div>
    <div className="absolute right-8 bottom-8 z-10 flex items-center gap-2">
       <span className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textColor }}>Consult Now</span>
       <span className="text-2xl font-black group-hover:translate-x-2 transition-transform" style={{ color: textColor }}>»</span>
    </div>
    {image && (
      <img 
        src={image} 
        alt="" 
        className="absolute right-[-15px] bottom-[-15px] md:right-[-20px] md:bottom-[-20px] h-[85%] w-auto object-contain mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-500 pointer-events-none z-0"
      />
    )}
  </div>
)

const ServicesSlider = ({ navigate }) => {
  const services = [
    {
      title: "Your Doctor",
      subtitle: "Consult specialist doctors from the comforts of your home",
      image: "https://img.freepik.com/free-vector/online-doctor-concept-illustration_114360-1085.jpg",
      gradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
      textColor: "#e11d48",
      onClick: () => navigate('/patient/doctors')
    },
    {
      title: "Your Dietitian",
      subtitle: "Book Diet Consultation @ Rs 399 only",
      image: "https://img.freepik.com/free-vector/diet-plan-concept-illustration_114360-6514.jpg",
      gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      textColor: "#059669",
      onClick: () => navigate('/patient/specialties')
    },
    {
      title: "Your Pharmacy",
      subtitle: "Order medicines & healthcare products online",
      image: "https://img.freepik.com/free-vector/pharmacist-concept-illustration_114360-2754.jpg",
      gradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
      textColor: "#7c3aed",
      onClick: () => navigate('/patient/pharmacy')
    },
    {
      title: "Your Labs",
      subtitle: "Book lab tests & health checkups with home sample collection",
      image: "https://img.freepik.com/free-vector/science-experiment-concept-illustration_114360-6681.jpg",
      gradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      textColor: "#0284c7",
      onClick: () => navigate('/patient/reports')
    },
    {
      title: "Your Physician",
      subtitle: "Consult with general physicians for everyday health issues",
      image: "https://img.freepik.com/free-vector/medical-prescription-concept-illustration_114360-3335.jpg",
      gradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      textColor: "#d97706",
      onClick: () => navigate('/patient/doctors')
    },
    {
      title: "Your Diagnosis",
      subtitle: "Get accurate diagnosis with advanced imaging and tests",
      image: "https://img.freepik.com/free-vector/radiology-concept-illustration_114360-5418.jpg",
      gradient: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
      textColor: "#4f46e5",
      onClick: () => navigate('/patient/reports')
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-black text-slate-800">Our Services</h2>
        <div className="flex gap-2">
           <div className="hidden md:flex gap-2">
              <button className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                 <IoChevronDown className="h-5 w-5 rotate-90" />
              </button>
              <button className="p-2 rounded-full border border-slate-200 text-[#11496c] hover:bg-slate-50 transition-colors">
                 <IoChevronDown className="h-5 w-5 -rotate-90" />
              </button>
           </div>
        </div>
      </div>
      
      <div className="flex overflow-x-auto overflow-y-hidden pb-8 scrollbar-hide gap-4 md:gap-6 lg:gap-8 snap-x snap-mandatory">
        {services.map((service, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-[380px] lg:min-w-[420px] h-48 md:h-60 snap-start">
            <ServiceCard {...service} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServicesSlider
export { ServiceCard }
