import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoMedicalOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoBagHandleOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoWalletOutline,
  IoHelpCircleOutline,
  IoArrowForwardOutline,
  IoReceiptOutline,
  IoArchiveOutline,
  IoPulseOutline,
  IoFlaskOutline,
  IoScanOutline,
  IoMicOutline,
  IoCall,
  IoChevronDown,
  IoCartOutline,
  IoClose,
  IoChatbubbleEllipsesOutline,
  IoShareSocialOutline,
  IoBookOutline,
  IoDiamondOutline,
  IoHeadsetOutline,
  IoShieldCheckmarkOutline,
  IoInfiniteOutline,
  IoHeartCircleOutline,
  IoFlashOutline,
} from 'react-icons/io5'
import PatientNavbar from '../patient-components/PatientNavbar'
import PatientSidebar from '../patient-components/PatientSidebar'
import { useToast } from '../../../contexts/ToastContext'
import { getPatientDashboard, getPatientProfile } from '../patient-services/patientService'
import NotificationBell from '../../../components/NotificationBell'
import healinnLogo from '../../../assets/images/logo.png'

// Using CDN/Unsplash URLs for assets to ensure stability across environments
const diabeatEaseImg = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'
const heartUpImg = 'https://images.unsplash.com/photo-1631549916768-4119b2e55916?auto=format&fit=crop&q=80&w=200'
const livUpImg = 'https://images.unsplash.com/photo-1550573105-75864e358476?auto=format&fit=crop&q=80&w=200'
const radiologyTestsImg = 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=200'

// Category cards configuration (values will be populated from API)
const categoryCardsConfig = [
  {
    id: 'appointments',
    title: 'APPOINTMENTS',
    description: 'Upcoming',
    iconBgColor: '#1976D2',
    icon: IoCalendarOutline,
    route: '/patient/appointments',
    dataKey: 'upcomingAppointmentsCount', // Use count instead of array
  },
  {
    id: 'prescriptions',
    title: 'PRESCRIPTION AND LAB REPORT',
    description: 'Active',
    iconBgColor: '#14B8A6',
    icon: IoDocumentTextOutline,
    route: '/patient/prescriptions',
    dataKey: 'activePrescriptions',
  },
  {
    id: 'orders',
    title: 'ORDERS',
    description: 'Recent',
    iconBgColor: '#3B82F6',
    icon: IoBagHandleOutline,
    route: '/patient/orders',
    dataKey: 'recentOrders',
  },
  {
    id: 'requests',
    title: 'REQUESTS',
    description: 'Responses',
    iconBgColor: '#8B5CF6',
    icon: IoChatbubbleOutline,
    route: '/patient/requests',
    dataKey: 'pendingRequests',
  },
]

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <svg key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  if (hasHalfStar) {
    stars.push(
      <svg key="half" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <defs>
          <linearGradient id={`half-fill-${rating}`}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path fill={`url(#half-fill-${rating})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(
      <svg key={`empty-${i}`} className="h-3.5 w-3.5 fill-slate-300 text-slate-300" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  return stars
}

const navItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: IoHomeOutline },
  { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: IoPeopleOutline },
  { id: 'transactions', label: 'Transactions', to: '/patient/transactions', Icon: IoReceiptOutline },
  { id: 'history', label: 'History', to: '/patient/history', Icon: IoArchiveOutline },
  { id: 'support', label: 'Support', to: '/patient/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: IoPersonCircleOutline },
]

// Helper function to check if doctor is active
const isDoctorActive = (doctorName) => {
  try {
    const saved = localStorage.getItem('doctorProfile')
    if (saved) {
      const profile = JSON.parse(saved)
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      // Check if this doctor matches the saved profile
      if (doctorName.includes(profile.firstName) || doctorName.includes(profile.lastName) || doctorName === fullName) {
        return profile.isActive !== false // Default to true if not set
      }
    }
    // Check separate active status
    const activeStatus = localStorage.getItem('doctorProfileActive')
    if (activeStatus !== null) {
      const isActive = JSON.parse(activeStatus)
      // If doctor name matches, return the status
      if (saved) {
        const profile = JSON.parse(saved)
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        if (doctorName.includes(profile.firstName) || doctorName.includes(profile.lastName) || doctorName === fullName) {
          return isActive
        }
      }
    }
  } catch (error) {
    console.error('Error checking doctor active status:', error)
  }
  // Default: show all doctors if no profile found (for mock data)
  return true
}

// Helper components for new sections
const HealthKarmaSection = ({ patientName, isCompact = false }) => {
  if (isCompact) {
    return (
      <div className="p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-xl font-bold text-white tracking-tight">HealthKarma</h2>
             <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Powered by AI</p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-emerald-400/30 flex items-center justify-center text-xl text-emerald-400 font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            ?
          </div>
        </div>
        
        <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                 <IoPersonCircleOutline className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                 <h3 className="text-sm font-bold text-white flex items-center gap-1">
                   Hi, {patientName}
                 </h3>
                 <p className="text-[10px] text-white/50 font-medium tracking-wide">Welcome back!</p>
              </div>
           </div>
        </div>

        <div className="space-y-4 pt-1">
          <p className="text-xs text-white/70 font-medium leading-relaxed">
            Your HealthKarma score helps us personalize your healthcare journey.
          </p>
          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
            Calculate My Score
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#e0f7fa] rounded-[24px] p-4 md:p-5 space-y-4 shadow-sm border border-cyan-100 h-full">
      <h2 className="text-xl md:text-xl font-bold text-slate-800 px-1">HealthKarma</h2>
      
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-1">
            Hi, {patientName} <IoChevronDown className="h-4 w-4" />
          </h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Welcome to HealthKarma!</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-4 shadow-sm flex items-center gap-3 md:gap-4 border border-cyan-50 relative overflow-hidden">
         <div className="flex-1 space-y-2 md:space-y-3 z-10">
            <h3 className="text-base md:text-lg font-extrabold text-slate-900">Find Your HealthKarma</h3>
            <p className="text-[10px] md:text-xs text-slate-600 font-medium leading-relaxed">
              Your HealthKarma score will help us understand your health status better
            </p>
            <button className="bg-[#11496c] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold flex items-center gap-2 hover:bg-[#0d3a52] transition-colors whitespace-nowrap">
              Calculate Your Score <IoChevronDown className="h-3 w-3 -rotate-90" />
            </button>
         </div>
         <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-[6px] md:border-[10px] border-slate-50 flex items-center justify-center text-xl md:text-3xl text-cyan-400 font-bold shadow-inner shrink-0">
            ?
         </div>
      </div>
    </div>
  )
}

const HealthSupplementsSection = ({ navigate }) => {
  const supplements = [
    { id: 1, name: 'DIABEAT-EASE', price: 1095, oldPrice: 2299, image: diabeatEaseImg },
    { id: 2, name: 'HEART-UP', price: 728, oldPrice: 1618, image: heartUpImg },
    { id: 3, name: 'LIV-UP', price: 728, oldPrice: 1618, image: livUpImg },
  ]

  return (
    <div className="bg-[#e0f2f1]/40 rounded-[24px] p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-800">Health Supplements</h2>
          <p className="text-[10px] md:text-sm text-slate-500 font-medium">Choose from a wide range for healthy living</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[#11496c] text-xs md:text-lg font-black italic">HerbVed</span>
           <span className="text-[8px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">by Healiinn</span>
        </div>
      </div>

      <div className="flex gap-3 md:gap-8 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-6">
        {supplements.map(item => (
          <div key={item.id} className="min-w-[120px] md:min-w-0 bg-white rounded-3xl p-3 md:p-3 shadow-sm border border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="h-24 md:h-32 w-full flex items-center justify-center mb-3">
               <img src={item.image} alt={item.name} className="h-full object-contain hover:scale-105 transition-transform" />
            </div>
            <h3 className="text-[10px] md:text-[10px] font-black text-slate-800 text-center uppercase tracking-tight">{item.name}</h3>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-xs md:text-base font-black text-slate-900">₹{item.price}</span>
               <span className="text-[9px] md:text-xs text-slate-400 line-through">₹{item.oldPrice}</span>
            </div>
          </div>
        ))}
        <div className="min-w-[120px] md:min-w-0 bg-white/50 rounded-3xl p-3 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-white/80 transition-colors cursor-pointer">
           <IoArrowForwardOutline className="h-5 w-5 md:h-10 md:w-10 mb-2" />
           <span className="text-[10px] md:text-sm font-black uppercase tracking-widest">View All</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-6 pt-2">
         <button className="flex-1 md:flex-none md:px-12 py-3.5 rounded-2xl border-2 border-[#11496c] text-[#11496c] text-[10px] md:text-sm font-black uppercase tracking-widest hover:bg-[#11496c] hover:text-white transition-all active:scale-95">
            Track Orders
         </button>
         <button className="flex-1 md:flex-none md:px-12 py-3.5 rounded-2xl bg-[#11496c] text-white text-[10px] md:text-sm font-black uppercase tracking-widest hover:bg-[#0d3a52] transition-all shadow-lg shadow-[#11496c]/20 active:scale-95">
            Explore HerbVed
         </button>
      </div>
    </div>
  )
}

const ServiceCard = ({ title, subtitle, icon, gradient, textColor, onClick }) => (
  <div 
    onClick={onClick}
    className="relative p-5 md:p-10 rounded-[32px] overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] active:scale-95 shadow-sm border border-slate-100 h-full flex flex-col justify-center"
    style={{ background: gradient }}
  >
    <div className="relative z-10 space-y-1 md:space-y-1 max-w-[70%]">
      <h3 className="text-xl md:text-2xl font-black" style={{ color: textColor }}>{title}</h3>
      <p className="text-[10px] md:text-sm font-bold opacity-70" style={{ color: textColor }}>{subtitle}</p>
    </div>
    {/* Watermark icon removed per user request */}
    <div className="absolute right-8 bottom-8 z-10 flex items-center gap-2">
       <span className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textColor }}>Consult Now</span>
       <span className="text-2xl font-black group-hover:translate-x-2 transition-transform" style={{ color: textColor }}>»</span>
    </div>
  </div>
)

const ArticlesSection = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
       <h2 className="text-xl md:text-xl font-bold text-slate-800">Articles for you</h2>
       <button className="text-[#11496c] font-bold text-sm hover:underline">View All</button>
    </div>
    <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4">
      {[
        { id: 1, title: 'Immunity Boosting Tips', desc: 'Practical ways to strengthen your immune system naturally.', time: '23 min(s) read', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400' },
        { id: 2, title: 'Women\'s Health Guide', desc: 'Essential health checks and wellness advice for women.', time: '20 min(s) read', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400' },
        { id: 3, title: 'Nutrition 101', desc: 'Understanding the basics of a balanced diet for long-term health.', time: '15 min(s) read', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400' },
        { id: 4, title: 'Yoga for Stress', desc: 'Manage daily stress through simple breathing and yoga techniques.', time: '12 min(s) read', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400' },
      ].map(article => (
        <div key={article.id} className="min-w-[200px] md:min-w-0 snap-center bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group cursor-pointer">
           <div className="h-32 md:h-44 overflow-hidden">
              <img src={article.img} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
           </div>
           <div className="p-4 md:p-5 space-y-2">
              <h3 className="text-base md:text-base font-bold text-slate-900 leading-tight line-clamp-1">{article.title}</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium line-clamp-2">{article.desc}</p>
              <div className="flex items-center justify-between pt-1">
                 <p className="text-[9px] md:text-[10px] text-[#11496c] font-black uppercase tracking-widest">{article.time}</p>
                 <button className="text-slate-900 text-[10px] md:text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <IoArrowForwardOutline className="h-3 w-3" />
                 </button>
              </div>
           </div>
        </div>
      ))}
    </div>
  </div>
)

const TrustSection = () => (
  <div className="bg-gradient-to-br from-[#f0fdfa] to-white rounded-[32px] p-6 md:p-8 space-y-6 border border-teal-50 h-full">
     <div className="text-center lg:text-left space-y-2">
        <h2 className="text-2xl md:text-2xl font-bold text-slate-900 leading-tight">
           Why <span className="text-[#11496c]">8.5 Million</span> Indians Trust <span className="text-[#11496c]">Healiinn Labs</span>
        </h2>
     </div>

     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
           { icon: IoDiamondOutline, title: 'CAP & NABL Accredited Labs', color: '#fef3c7', iconColor: '#d97706' },
           { icon: IoTimeOutline, title: 'On Time Sample Collection', color: '#ecfdf5', iconColor: '#059669' },
           { icon: IoDocumentTextOutline, title: 'Smart Reports in 6 Hours', color: '#f0f9ff', iconColor: '#0284c7' },
           { icon: IoHeadsetOutline, title: 'Free Report Consultation', color: '#f5f3ff', iconColor: '#7c3aed' },
        ].map((item, idx) => (
           <div key={idx} className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-slate-50 flex flex-col gap-2 md:gap-3 hover:shadow-md transition-shadow">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.color }}>
                 <item.icon className="h-4 w-4 md:h-5 md:w-5" style={{ color: item.iconColor }} />
              </div>
              <p className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight">{item.title}</p>
           </div>
        ))}
     </div>
  </div>
)

const TestsGrid = ({ title, items }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl md:text-xl font-bold text-slate-800">{title}</h2>
      <button className="text-slate-500 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
         See all <IoArrowForwardOutline className="h-4 w-4" />
      </button>
    </div>
    <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {items.map((item, idx) => (
        <div key={idx} className="min-w-[140px] md:min-w-0 bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col items-center gap-3 md:gap-4 hover:shadow-lg transition-all group shrink-0">
           <div className="h-28 w-full md:h-36 rounded-2xl bg-slate-50 overflow-hidden group-hover:scale-105 transition-transform duration-500 border-2 border-white shadow-sm">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
           </div>
           <div className="text-center space-y-1">
              <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">{item.name}</h3>
              <p className="text-xs md:text-sm text-[#11496c] font-black">Starting @ ₹{item.price}</p>
           </div>
           <button className="w-full py-2.5 md:py-4 bg-[#11496c] text-white text-[10px] md:text-sm font-bold rounded-xl md:rounded-2xl hover:bg-[#0d3a52] transition-colors shadow-lg shadow-[#11496c]/10">
              Book Appointment
           </button>
        </div>
      ))}
    </div>
  </div>
)

const RadiologyTests = () => (
  <TestsGrid 
    title="Radiology Tests"
    items={[
      { name: 'Digital X-ray', price: 250, image: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=200' },
      { name: 'Ultrasound', price: 935, image: 'https://images.unsplash.com/photo-1579154235602-3c35bd799656?auto=format&fit=crop&q=80&w=200' },
      { name: 'CT Scan', price: 1500, image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200' },
    ]}
  />
)

const HealthConcerns = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl md:text-xl font-bold text-slate-800">Health Concerns</h2>
      <button className="text-slate-500 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
         See all <IoArrowForwardOutline className="h-4 w-4" />
      </button>
    </div>
    <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 md:gap-6">
      {[
        { name: 'Digestion', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400' },
        { name: 'Infection', image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400' },
        { name: 'Pregnancy', image: 'https://images.unsplash.com/photo-1559839734-2b71f1e3c770?auto=format&fit=crop&q=80&w=400' },
        { name: 'Skin Care', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400' },
        { name: 'Heart Health', image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=400' },
        { name: 'Bone Health', image: 'https://images.unsplash.com/photo-1579154235602-3c35bd799656?auto=format&fit=crop&q=80&w=400' },
      ].map((item, idx) => (
        <div key={idx} className="relative min-w-[120px] md:min-w-[140px] aspect-[4/5] rounded-[24px] overflow-hidden group cursor-pointer shadow-md shrink-0">
           <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
           <div className="absolute bottom-4 left-0 right-0 px-3 flex flex-col items-center gap-2">
              <span className="text-white text-xs md:text-sm font-black text-center">{item.name}</span>
              <button className="w-full py-2 bg-[#11496c]/40 backdrop-blur-md border border-white/30 text-white text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-[#11496c]/60 transition-colors">
                Explore
              </button>
           </div>
        </div>
      ))}
    </div>
  </div>
)

const PatientDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false) // Start with false to show content immediately
  const [error, setError] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [activeTab, setActiveTab] = useState('doctors')
  const [profile, setProfile] = useState(null)
  const [showPromoModal, setShowPromoModal] = useState(true)

  // Fetch profile and dashboard data in parallel for faster loading
  useEffect(() => {
    const fetchData = async () => {
      // Check if user is authenticated before making API call
      const { getAuthToken } = await import('../../../utils/apiClient')
      const token = getAuthToken('patient')

      if (!token) {
        // No token, redirect to login
        navigate('/patient/login')
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch profile and dashboard in parallel for faster loading
        const [profileResponse, dashboardResponse] = await Promise.allSettled([
          getPatientProfile().catch(() => ({ success: false })),
          getPatientDashboard()
        ])

        // Handle profile response (non-critical, don't block UI)
        if (profileResponse.status === 'fulfilled' && profileResponse.value.success && profileResponse.value.data) {
          const patient = profileResponse.value.data.patient || profileResponse.value.data
          setProfile({
            ...patient,
            address: patient.address || {},
          })
        }

        // Handle dashboard response
        const response = dashboardResponse.status === 'fulfilled' ? dashboardResponse.value : null
        
        if (!response || !response.success) {
          throw new Error(dashboardResponse.reason?.message || 'Failed to load dashboard')
        }

        if (response.data) {
          setDashboardData(response.data)

          // Set category card values
          const data = response.data

          // Set upcoming appointments
          if (data.upcomingAppointments) {
            setUpcomingAppointments(data.upcomingAppointments)
          }

          // Set doctors (if available in dashboard response)
          if (data.recommendedDoctors) {
            setDoctors(data.recommendedDoctors)
          }
        }
      } catch (err) {
        // Handle 401 Unauthorized - user logged out
        if (err.message && (err.message.includes('Authentication token missing') || err.message.includes('Unauthorized') || err.message.includes('401') || err.message.includes('Session expired'))) {
          // Don't show error toast for auth errors - user is being redirected
          // Clear tokens and redirect to login (apiClient should handle this, but ensure it happens)
          const { clearTokens } = await import('../../../utils/apiClient')
          clearTokens('patient')
          // Don't navigate if already on login page or if redirect is happening
          if (!window.location.pathname.includes('/login')) {
            navigate('/patient/login')
          }
          return
        }

        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast, navigate])

  // Get category cards with real data
  const categoryCards = useMemo(() => {
    if (!dashboardData) return categoryCardsConfig.map(card => ({ ...card, value: '0' }))

    return categoryCardsConfig.map(card => {
      let value = dashboardData[card.dataKey]

      // Handle arrays - get length instead of array itself
      if (Array.isArray(value)) {
        value = value.length
      }

      // Handle objects - try to get count property or default to 0
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = value.count || value.length || 0
      }

      return {
        ...card,
        value: String(value || 0),
      }
    })
  }, [dashboardData])

  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors]

    // Filter by active status
    filtered = filtered.filter((doctor) => isDoctorActive(doctor.name || `${doctor.firstName} ${doctor.lastName}`))

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (doctor) => {
          const name = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
          const specialty = doctor.specialty || doctor.specialization || ''
          return (
            name.toLowerCase().includes(normalizedSearch) ||
            specialty.toLowerCase().includes(normalizedSearch)
          )
        }
      )
    }

    return filtered
  }, [searchTerm, doctors])

  // Mock data for nurses
  const mockNurses = useMemo(() => [
    {
      _id: 'n1',
      firstName: 'Sarah',
      lastName: 'Wilson',
      specialization: 'Critical Care',
      clinicName: 'City Hospital',
      clinicAddress: '123 Health Ave, Mumbai',
      rating: 4.8,
      reviewCount: 45,
      fee: 500,
      image: '', // Will use avatar fallback
    },
    {
      _id: 'n2',
      firstName: 'Priya',
      lastName: 'Sharma',
      specialization: 'Pediatric Care',
      clinicName: 'Sunshine Clinic',
      clinicAddress: '45 Care Lane, Pune',
      rating: 4.9,
      reviewCount: 82,
      fee: 600,
      image: '',
    },
    {
      _id: 'n3',
      firstName: 'Anita',
      lastName: 'Desai',
      specialization: 'Home Care',
      clinicName: 'Healiinn Home Services',
      clinicAddress: 'Indore, MP',
      rating: 4.7,
      reviewCount: 28,
      fee: 450,
      image: '',
    }
  ], [])

  const filteredNurses = useMemo(() => {
    let filtered = [...mockNurses]

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (nurse) => {
          const name = `${nurse.firstName} ${nurse.lastName}`
          return (
            name.toLowerCase().includes(normalizedSearch) ||
            nurse.specialization.toLowerCase().includes(normalizedSearch)
          )
        }
      )
    }

    return filtered
  }, [searchTerm, mockNurses])

  const handleTakeToken = (doctorId, fee) => {
    if (!doctorId) {
      toast.error('Doctor information is not available. Please try again.')
      return
    }
    navigate(`/patient/doctors/${doctorId}?book=true`)
  }

  const handleSidebarToggle = () => {
    if (isSidebarOpen) {
      handleSidebarClose()
    } else {
      setIsSidebarOpen(true)
    }
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      // Import logout function from patientService
      const { logoutPatient } = await import('../patient-services/patientService')
      await logoutPatient()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      const { clearPatientTokens } = await import('../patient-services/patientService')
      clearPatientTokens()
      toast.success('Logged out successfully')
    }
    // Navigate to login page
    setTimeout(() => {
      navigate('/patient/login', { replace: true })
    }, 500)
  }

  return (
    <section className="bg-[#f8fafc] min-h-screen pb-32 overflow-x-hidden">
      {/* Search Bar Section - Desktop Responsive with Logo */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-6">
           {/* Logo & Search Area */}
           <div className="flex items-center gap-6 flex-1">
              <div 
                onClick={() => navigate('/patient/dashboard')}
                className="flex items-center cursor-pointer group shrink-0"
              >
                 <img
                   src={healinnLogo}
                   alt="Healiinn"
                   className="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105"
                 />
              </div>
              
              <div className="flex-1 relative max-w-md hidden lg:block">
                 <input
                   type="text"
                   placeholder="Search for 'CBC', 'Blood Test'..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]/10 focus:border-[#11496c] transition-all"
                 />
                 <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
           </div>

           {/* Desktop Navigation Links */}
           <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Dashboard', to: '/patient/dashboard', icon: IoHomeOutline },
                { label: 'Care', to: '/patient/doctors', icon: IoPulseOutline },
                { label: 'History', to: '/patient/history', icon: IoArchiveOutline },
                { label: 'Profile', to: '/patient/profile', icon: IoPersonCircleOutline },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === item.to 
                      ? 'bg-[#11496c] text-white shadow-md shadow-[#11496c]/20' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#11496c]'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
           </nav>

           {/* Action Icons */}
           <div className="flex items-center gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 hidden xl:flex flex-col items-center shadow-sm">
                 <span className="text-[9px] font-bold text-[#11496c] uppercase tracking-tighter">Wallet Balance</span>
                 <span className="text-sm font-black text-slate-800">₹{profile?.walletBalance || 0}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors relative">
                 <NotificationBell className="text-slate-600" />
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-slate-50 rounded-full border border-slate-200 text-slate-600 md:hidden"
              >
                <IoMenuOutline className="h-6 w-6" />
              </button>
           </div>
        </div>
        {/* Mobile/Small Tablet Search Bar */}
        <div className="px-4 pb-3 lg:hidden bg-white">
           <div className="relative">
              <input
                type="text"
                placeholder="Search for 'CBC', 'MRI'..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
              />
              <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           </div>
        </div>
      </header>

      {/* Edge-to-edge Hero Banner - Compact & On-Theme */}
      <div className="w-full bg-[#11496c] relative overflow-hidden">
        {/* Modern Medical Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#11496c] via-[#1a5f8a] to-[#11496c]"></div>
        
        {/* Subtle Decorative Elements */}
        <div className="absolute inset-0 opacity-30">
           <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 relative z-10">
           <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full backdrop-blur-md">
                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                 <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-300">Live Consultation Available</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight max-w-2xl">
                 Consult the <span className="text-emerald-400">Best Doctors</span> Online
              </h1>
              <p className="text-white/70 text-xs md:text-sm font-medium max-w-lg">
                 Expert medical advice from the comfort of your home within 10 minutes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
                 <button 
                   onClick={() => navigate('/patient/doctors')}
                   className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] md:text-xs px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 w-full sm:w-auto uppercase tracking-widest"
                 >
                    Book Appointment
                 </button>
                 <button 
                   onClick={() => navigate('/patient/specialties')}
                   className="bg-white/5 hover:bg-white/10 text-white font-black text-[10px] md:text-xs px-6 py-3 rounded-xl transition-all border border-white/10 backdrop-blur-md active:scale-95 w-full sm:w-auto uppercase tracking-widest"
                 >
                    View Specialists
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 flex flex-col gap-8">
         {/* HealthKarma Section - Separate Card */}
         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
               <HealthKarmaSection patientName={dashboardData?.patientName?.split(' ')[0] || 'User'} />
            </div>
            <div className="lg:col-span-2 flex flex-col justify-center bg-white rounded-[24px] p-6 md:p-6 border border-slate-100 shadow-sm">
               <h3 className="text-lg font-bold text-slate-800 mb-2">Welcome Back!</h3>
               <p className="text-sm text-slate-500 font-medium">You have 0 upcoming appointments for today.</p>
               <button className="mt-4 text-[#11496c] text-sm font-bold flex items-center gap-2 hover:underline">
                  Check History <IoArrowForwardOutline className="h-4 w-4" />
               </button>
            </div>
         </div>

        {/* Health Supplements Section */}
        <HealthSupplementsSection navigate={navigate} />

        {/* Doctor, Dietitian & Pharmacy Cards */}
        <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 md:grid md:grid-cols-3 lg:gap-8">
           <div className="min-w-[220px] md:min-w-0 flex-1 h-44 md:h-56">
              <ServiceCard 
                 title="Your Doctor"
                 subtitle="Consult specialist doctors from the comforts of your home"
                 gradient="linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)"
                 textColor="#e11d48"
                 onClick={() => navigate('/patient/doctors')}
              />
           </div>
           <div className="min-w-[220px] md:min-w-0 flex-1 h-44 md:h-56">
              <ServiceCard 
                 title="Your Dietitian"
                 subtitle="Book Diet Consultation @ Rs 399 only"
                 gradient="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                 textColor="#059669"
                 onClick={() => navigate('/patient/specialties')}
              />
           </div>
           <div className="min-w-[220px] md:min-w-0 flex-1 h-44 md:h-56">
              <ServiceCard 
                 title="Your Pharmacy"
                 subtitle="Order medicines & healthcare products online"
                 gradient="linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
                 textColor="#7c3aed"
                 onClick={() => navigate('/patient/pharmacy')}
              />
           </div>
        </div>

        {/* Articles Section */}
        <ArticlesSection />

        {/* Middle Section: Trust & Awards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm">
           <TrustSection />
           <div className="flex flex-col items-center space-y-6">
              <div className="relative flex flex-col items-center">
                 <div className="absolute inset-0 scale-150 blur-3xl bg-[#11496c]/5 rounded-full"></div>
                 <div className="w-56 h-56 md:w-64 md:h-64 border-4 border-slate-100 rounded-full flex flex-col items-center justify-center p-8 text-center relative bg-white shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Times Health Excellence Survey 2025</span>
                    <span className="text-6xl font-black text-[#11496c] my-2">No. 1</span>
                    <span className="text-xs font-bold text-slate-600">Diagnostics Service Provider</span>
                 </div>
                 <div className="bg-slate-800 text-white text-xs font-bold px-8 py-3 rounded-full mt-[-25px] relative z-10 shadow-xl border-2 border-white">
                    In Delhi NCR & Mumbai
                 </div>
              </div>
              <div className="text-center">
                 <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Stay Healthy</h2>
                 <p className="text-xs font-bold text-slate-400 flex items-center justify-center gap-2 mt-2">
                    Made with <span className="text-red-500 text-lg">❤</span> By Healthians Team
                 </p>
              </div>
           </div>
        </div>

        {/* Radiology Tests */}
        <RadiologyTests />

        {/* Banners Row: Advisor & Refer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-gradient-to-r from-[#11496c] to-[#0d3a52] rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-[#11496c]/20">
              <div className="relative z-10">
                 <h3 className="text-2xl font-bold leading-tight max-w-[250px] mb-8">
                    Talk to our health advisors now for <span className="text-blue-300">attractive discounts</span> on your Bookings
                 </h3>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 bg-white text-[#11496c] font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-slate-50 transition-colors">
                       <IoCall className="h-5 w-5" /> Call Now
                    </button>
                    <button className="flex-1 bg-[#ffffff20] backdrop-blur-md text-white font-black text-sm py-4 rounded-2xl border border-white/30 flex items-center justify-center gap-3 hover:bg-[#ffffff30] transition-colors">
                       <IoChatbubbleEllipsesOutline className="h-5 w-5" /> Chat With Us
                    </button>
                 </div>
              </div>
              <img 
                 src="https://img.freepik.com/free-photo/beautiful-young-female-doctor-looking-camera-office_23-2147896177.jpg" 
                 alt="" 
                 className="absolute right-[-20px] bottom-0 h-[150%] object-contain opacity-40 mix-blend-overlay hidden md:block"
              />
           </div>

           <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl border border-slate-700">
              <div className="relative z-10 space-y-6 h-full flex flex-col justify-between">
                 <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black tracking-tight leading-none">Refer &<br />Earn Rewards</h3>
                    <div className="bg-[#11496c] p-4 rounded-2xl shadow-inner border border-slate-700">
                       <IoFlashOutline className="h-10 w-10 text-amber-400" />
                    </div>
                 </div>
                 <p className="text-sm text-slate-400 font-medium max-w-[250px]">
                    Win iPhone 16 Pro, Earbuds & Smart Watches Every Month. Join the league!
                 </p>
                 <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all hover:scale-110">
                    <IoArrowForwardOutline className="h-6 w-6" />
                 </button>
              </div>
              <img 
                 src="https://img.freepik.com/free-photo/apple-watch-iphone-white-background_23-2148866160.jpg" 
                 alt="" 
                 className="absolute right-0 bottom-0 h-[130%] object-contain opacity-20 hidden md:block"
              />
           </div>
        </div>

        {/* Interactive Row: DND & Featured Test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-50 rounded-2xl">
                    <IoShieldCheckmarkOutline className="h-6 w-6 text-[#11496c]" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-base font-bold text-slate-700">Enable do not disturb Status</span>
                    <span className="text-[10px] text-slate-400">Stop receiving promotional calls</span>
                 </div>
              </div>
              <div className="relative inline-flex h-7 w-12 items-center rounded-full bg-slate-200 transition-colors cursor-pointer">
                 <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform translate-x-1 shadow-sm"></span>
              </div>
           </div>

           <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex items-center justify-between gap-6">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-[#11496c] uppercase tracking-widest">Featured Test</span>
                 <h3 className="text-xl font-bold text-slate-900">Food Intolerance Test</h3>
                 <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-slate-900">₹5499</span>
                    <span className="text-sm text-slate-400 line-through">₹18330</span>
                 </div>
              </div>
              <button className="px-8 py-4 bg-[#11496c] text-white font-black rounded-2xl shadow-lg shadow-[#11496c]/20 hover:bg-[#0d3a52] transition-all active:scale-95">
                 Book Now
              </button>
           </div>
        </div>

        {/* Health Concerns Section */}
        <HealthConcerns />
      </div>

      {/* Floating Call Button */}
      <button className="fixed bottom-24 right-4 md:right-8 z-40 bg-white shadow-2xl rounded-full p-1 md:p-1.5 flex items-center gap-2 md:gap-3 pr-4 md:pr-6 border border-slate-100 group active:scale-95 transition-all hover:scale-105">
         <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-[#11496c] flex items-center justify-center text-white shadow-xl shadow-[#11496c]/40">
            <IoCall className="h-5 w-5 md:h-6 md:w-6" />
         </div>
         <span className="text-sm md:text-base font-black text-slate-800 group-hover:text-[#11496c] transition-colors">Call to Book</span>
      </button>

      {/* Sidebar */}
      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </section>
  )
}

export default PatientDashboard
